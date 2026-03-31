/* ============================================================
   NEXUS STRIKE — Main Entry Point
   Three.js setup, render loop, system initialization
   ============================================================ */

(function () {
    'use strict';

    // ---- Three.js Core Setup ----
    const renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: false,
        powerPreference: 'high-performance'
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); // Cap for performance
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;
    renderer.outputEncoding = THREE.sRGBEncoding;
    renderer.setClearColor(0x040810, 1);
    document.body.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x040810, 0.012);

    const camera = new THREE.PerspectiveCamera(
        50,
        window.innerWidth / window.innerHeight,
        0.1,
        200
    );
    camera.position.set(0, 22, 14);
    camera.lookAt(0, 0, 0);

    // ---- Handle window resize ----
    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    });

    // ---- Initialize Systems ----
    const ui = new UIManager();

    // Audio (needs user interaction to start)
    audioSystem = new AudioSystem();
    const initAudio = () => {
        audioSystem.init();
        document.removeEventListener('click', initAudio);
        document.removeEventListener('keydown', initAudio);
    };
    document.addEventListener('click', initAudio);
    document.addEventListener('keydown', initAudio);

    // Screen shake
    screenShake = new ScreenShake(camera);

    // Floating text
    floatingText = new FloatingTextManager();

    // Game manager
    const gameManager = new GameManager(scene, camera, ui);

    // Menu system with animated background
    const menuSystem = new MenuSystem(scene, camera, renderer);

    // Wire up all button handlers
    setupMenuButtons(gameManager, menuSystem, ui);

    // ---- Loading Sequence ----
    let loadProgress = 0;
    const loadSteps = [
        { progress: 20, text: 'LOADING GEOMETRY...' },
        { progress: 40, text: 'COMPILING SHADERS...' },
        { progress: 60, text: 'INITIALIZING AI...' },
        { progress: 80, text: 'CALIBRATING WEAPONS...' },
        { progress: 100, text: 'SYSTEMS ONLINE' },
    ];

    function simulateLoading() {
        if (loadProgress >= loadSteps.length) {
            // Loading complete
            setTimeout(() => {
                ui.hideLoader();
                ui.showMenu();
            }, 400);
            return;
        }

        const step = loadSteps[loadProgress];
        ui.updateLoader(step.progress, step.text);
        loadProgress++;

        setTimeout(simulateLoading, 300 + Math.random() * 200);
    }
    simulateLoading();

    // ---- Game Loop ----
    let lastTime = performance.now();
    const maxDt = 1 / 30; // Cap delta time to prevent spiral of death

    function gameLoop(currentTime) {
        requestAnimationFrame(gameLoop);

        // Calculate frame-rate independent delta time
        let dt = (currentTime - lastTime) / 1000;
        lastTime = currentTime;

        // Clamp to prevent huge jumps (e.g., tab switching)
        dt = Math.min(dt, maxDt);

        // Update systems based on state
        if (gameManager.state === GAME_STATE.MENU ||
            gameManager.state === GAME_STATE.GAME_OVER) {
            menuSystem.update(dt);
        }

        if (gameManager.state === GAME_STATE.PLAYING) {
            gameManager.update(dt);
        }

        // Render
        renderer.render(scene, camera);
    }

    requestAnimationFrame(gameLoop);

    // ---- Disable right-click context menu in game ----
    document.addEventListener('contextmenu', (e) => e.preventDefault());

    // ---- Performance monitoring (debug, can be removed) ----
    if (window.location.hash === '#debug') {
        const fpsEl = document.createElement('div');
        fpsEl.style.cssText = 'position:fixed;top:4px;right:4px;color:#0f0;font:12px monospace;z-index:9999;';
        document.body.appendChild(fpsEl);
        let frames = 0, fpsTime = 0;
        const origLoop = gameLoop;
        setInterval(() => {
            fpsEl.textContent = `FPS: ${frames}`;
            frames = 0;
        }, 1000);
        // Count frames in render loop via monkey-patch
        const origRender = renderer.render.bind(renderer);
        renderer.render = function (s, c) {
            frames++;
            origRender(s, c);
        };
    }

})();
