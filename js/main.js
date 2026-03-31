/* ============================================================
   NEXUS STRIKE — Main Entry Point (OPTIMIZED)
   
   PERF: Capped pixel ratio to 1.5, removed expensive tone
   mapping, disabled shadows by default, tight game loop.
   ============================================================ */

(function () {
    'use strict';

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5)); // Cap — huge perf win on HiDPI
    renderer.shadowMap.enabled = false; // Off by default, enabled per quality setting
    renderer.setClearColor(0x040810, 1);
    document.body.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x040810, 0.01);

    const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 150);
    camera.position.set(0, 22, 14);
    camera.lookAt(0, 0, 0);

    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    });

    const ui = new UIManager();

    audioSystem = new AudioSystem();
    const initAudio = () => { audioSystem.init(); document.removeEventListener('click', initAudio); document.removeEventListener('keydown', initAudio); };
    document.addEventListener('click', initAudio);
    document.addEventListener('keydown', initAudio);

    screenShake = new ScreenShake();
    floatingText = new FloatingTextManager();

    const gameManager = new GameManager(scene, camera, ui);
    const menuSystem = new MenuSystem(scene, camera, renderer);
    setupMenuButtons(gameManager, menuSystem, ui);

    // Loading
    let lp = 0;
    const steps = [
        [20, 'LOADING GEOMETRY...'], [40, 'COMPILING SHADERS...'],
        [60, 'INITIALIZING AI...'], [80, 'CALIBRATING WEAPONS...'], [100, 'SYSTEMS ONLINE']
    ];
    (function load() {
        if (lp >= steps.length) { setTimeout(() => { ui.hideLoader(); ui.showMenu(); }, 300); return; }
        ui.updateLoader(steps[lp][0], steps[lp][1]);
        lp++;
        setTimeout(load, 250 + Math.random() * 150);
    })();

    // Game loop
    let lastTime = performance.now();
    function loop(now) {
        requestAnimationFrame(loop);
        let dt = (now - lastTime) / 1000;
        lastTime = now;
        if (dt > 0.05) dt = 0.05; // Cap at 20fps equivalent to prevent spiral

        if (gameManager.state === GAME_STATE.MENU || gameManager.state === GAME_STATE.GAME_OVER) {
            menuSystem.update(dt);
        }
        if (gameManager.state === GAME_STATE.PLAYING) {
            gameManager.update(dt);
        }

        renderer.render(scene, camera);
    }
    requestAnimationFrame(loop);

    document.addEventListener('contextmenu', e => e.preventDefault());
})();
