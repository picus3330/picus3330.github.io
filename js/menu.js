/* ============================================================
   NEXUS STRIKE — Menu System
   Animated Three.js background, button wiring, transitions
   ============================================================ */

class MenuSystem {
    constructor(scene, camera, renderer) {
        this.scene = scene;
        this.camera = camera;
        this.renderer = renderer;
        this.menuObjects = new THREE.Group();
        this.scene.add(this.menuObjects);
        this.active = true;
        this.time = 0;

        this._buildBackground();
    }

    /** Create animated menu background */
    _buildBackground() {
        // Floating geometric shapes
        this.floaters = [];
        const colors = [0x00f0ff, 0xff00aa, 0x4040ff, 0x00ff88, 0xffcc00];
        const geometries = [
            new THREE.OctahedronGeometry(0.5, 0),
            new THREE.TetrahedronGeometry(0.5, 0),
            new THREE.IcosahedronGeometry(0.4, 0),
            new THREE.BoxGeometry(0.6, 0.6, 0.6),
            new THREE.DodecahedronGeometry(0.4, 0),
        ];

        for (let i = 0; i < 40; i++) {
            const geom = geometries[Math.floor(Math.random() * geometries.length)];
            const color = colors[Math.floor(Math.random() * colors.length)];
            const mat = new THREE.MeshBasicMaterial({
                color: color,
                wireframe: true,
                transparent: true,
                opacity: 0.15 + Math.random() * 0.2
            });
            const mesh = new THREE.Mesh(geom, mat);

            // Random position in a sphere
            mesh.position.set(
                (Math.random() - 0.5) * 50,
                (Math.random() - 0.5) * 30,
                (Math.random() - 0.5) * 50 - 20
            );

            mesh.userData.rotSpeed = {
                x: (Math.random() - 0.5) * 0.5,
                y: (Math.random() - 0.5) * 0.5,
                z: (Math.random() - 0.5) * 0.3,
            };
            mesh.userData.floatSpeed = 0.3 + Math.random() * 0.5;
            mesh.userData.floatOffset = Math.random() * Math.PI * 2;
            mesh.userData.baseY = mesh.position.y;

            const scale = 0.5 + Math.random() * 1.5;
            mesh.scale.setScalar(scale);

            this.menuObjects.add(mesh);
            this.floaters.push(mesh);
        }

        // Central glowing orb
        const orbGeom = new THREE.SphereGeometry(2, 32, 32);
        const orbMat = new THREE.MeshBasicMaterial({
            color: 0x00f0ff,
            transparent: true,
            opacity: 0.08
        });
        this.centralOrb = new THREE.Mesh(orbGeom, orbMat);
        this.centralOrb.position.set(0, 0, -15);
        this.menuObjects.add(this.centralOrb);

        // Ring around orb
        const ringGeom = new THREE.TorusGeometry(3.5, 0.05, 8, 64);
        const ringMat = new THREE.MeshBasicMaterial({
            color: 0x00f0ff,
            transparent: true,
            opacity: 0.2
        });
        this.orbRing = new THREE.Mesh(ringGeom, ringMat);
        this.orbRing.position.copy(this.centralOrb.position);
        this.menuObjects.add(this.orbRing);

        // Second ring
        const ring2 = new THREE.Mesh(
            new THREE.TorusGeometry(4.5, 0.03, 8, 64),
            new THREE.MeshBasicMaterial({ color: 0xff00aa, transparent: true, opacity: 0.12 })
        );
        ring2.position.copy(this.centralOrb.position);
        ring2.rotation.x = Math.PI / 3;
        this.orbRing2 = ring2;
        this.menuObjects.add(ring2);

        // Particle field (static dots)
        const starCount = 200;
        const starGeom = new THREE.BufferGeometry();
        const starPositions = new Float32Array(starCount * 3);
        for (let i = 0; i < starCount * 3; i += 3) {
            starPositions[i] = (Math.random() - 0.5) * 80;
            starPositions[i + 1] = (Math.random() - 0.5) * 40;
            starPositions[i + 2] = (Math.random() - 0.5) * 80 - 20;
        }
        starGeom.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
        const starMat = new THREE.PointsMaterial({
            color: 0x4488cc,
            size: 0.15,
            transparent: true,
            opacity: 0.4
        });
        this.stars = new THREE.Points(starGeom, starMat);
        this.menuObjects.add(this.stars);

        // Menu camera position
        this.camera.position.set(0, 5, 12);
        this.camera.lookAt(0, 0, -15);
    }

    /** Animate menu background */
    update(dt) {
        if (!this.active) return;
        this.time += dt;

        // Rotate floaters
        for (const f of this.floaters) {
            f.rotation.x += f.userData.rotSpeed.x * dt;
            f.rotation.y += f.userData.rotSpeed.y * dt;
            f.rotation.z += f.userData.rotSpeed.z * dt;
            f.position.y = f.userData.baseY +
                Math.sin(this.time * f.userData.floatSpeed + f.userData.floatOffset) * 1.5;
        }

        // Pulse orb
        const orbScale = 1 + Math.sin(this.time * 1.5) * 0.15;
        this.centralOrb.scale.setScalar(orbScale);

        // Rotate rings
        this.orbRing.rotation.z += dt * 0.3;
        this.orbRing.rotation.x = Math.sin(this.time * 0.5) * 0.3;
        this.orbRing2.rotation.y += dt * 0.4;
        this.orbRing2.rotation.z += dt * 0.2;

        // Subtle camera sway
        this.camera.position.x = Math.sin(this.time * 0.2) * 1.5;
        this.camera.position.y = 5 + Math.sin(this.time * 0.3) * 0.5;
        this.camera.lookAt(0, 0, -15);

        // Slowly rotate stars
        this.stars.rotation.y += dt * 0.02;
    }

    /** Show menu objects */
    show() {
        this.active = true;
        this.menuObjects.visible = true;
    }

    /** Hide menu objects */
    hide() {
        this.active = false;
        this.menuObjects.visible = false;
    }
}

/** Wire up all menu button interactions */
function setupMenuButtons(gameManager, menuSystem, ui) {
    const $ = id => document.getElementById(id);

    // Play
    $('btn-play').addEventListener('click', () => {
        if (audioSystem) audioSystem.playClick();
        menuSystem.hide();
        gameManager.buildArena();
        gameManager.startGame();
    });

    // Settings
    $('btn-settings').addEventListener('click', () => {
        if (audioSystem) audioSystem.playClick();
        ui.showScreen('settings-panel');
    });
    $('btn-settings-back').addEventListener('click', () => {
        if (audioSystem) audioSystem.playClick();
        ui.showMenu();
    });
    $('btn-pause-settings').addEventListener('click', () => {
        if (audioSystem) audioSystem.playClick();
        ui.showScreen('settings-panel');
    });

    // Controls
    $('btn-controls').addEventListener('click', () => {
        if (audioSystem) audioSystem.playClick();
        ui.showScreen('controls-panel');
    });
    $('btn-controls-back').addEventListener('click', () => {
        if (audioSystem) audioSystem.playClick();
        ui.showMenu();
    });

    // Credits
    $('btn-credits').addEventListener('click', () => {
        if (audioSystem) audioSystem.playClick();
        ui.showScreen('credits-panel');
    });
    $('btn-credits-back').addEventListener('click', () => {
        if (audioSystem) audioSystem.playClick();
        ui.showMenu();
    });

    // Pause controls
    $('btn-resume').addEventListener('click', () => {
        if (audioSystem) audioSystem.playClick();
        gameManager.resume();
    });
    $('btn-quit').addEventListener('click', () => {
        if (audioSystem) audioSystem.playClick();
        menuSystem.show();
        gameManager.quitToMenu();
    });

    // Game over
    $('btn-restart').addEventListener('click', () => {
        if (audioSystem) audioSystem.playClick();
        gameManager.restart();
    });
    $('btn-gameover-menu').addEventListener('click', () => {
        if (audioSystem) audioSystem.playClick();
        menuSystem.show();
        gameManager.quitToMenu();
    });

    // Keyboard shortcuts
    window.addEventListener('keydown', (e) => {
        if (e.code === 'Escape') {
            if (gameManager.state === GAME_STATE.PLAYING) {
                gameManager.pause();
            } else if (gameManager.state === GAME_STATE.PAUSED) {
                gameManager.resume();
            }
        }
        if (e.code === 'KeyR' && gameManager.state === GAME_STATE.GAME_OVER) {
            gameManager.restart();
        }
    });

    // Settings controls
    $('vol-master').addEventListener('input', (e) => {
        if (audioSystem) audioSystem.setMasterVolume(e.target.value / 100);
    });
    $('vol-sfx').addEventListener('input', (e) => {
        if (audioSystem) audioSystem.setSfxVolume(e.target.value / 100);
    });
    $('screen-shake').addEventListener('change', (e) => {
        if (screenShake) screenShake.enabled = e.target.checked;
    });

    // Button hover sounds
    document.querySelectorAll('.menu-btn').forEach(btn => {
        btn.addEventListener('mouseenter', () => {
            if (audioSystem && audioSystem.initialized) {
                // Tiny hover sound
                const osc = audioSystem.ctx.createOscillator();
                const gain = audioSystem.ctx.createGain();
                osc.type = 'sine';
                osc.frequency.value = 1200;
                gain.gain.setValueAtTime(0.03, audioSystem.ctx.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.001, audioSystem.ctx.currentTime + 0.03);
                osc.connect(gain);
                gain.connect(audioSystem.sfxGain);
                osc.start();
                osc.stop(audioSystem.ctx.currentTime + 0.03);
            }
        });
    });
}
