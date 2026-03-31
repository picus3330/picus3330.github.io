/* ============================================================
   NEXUS STRIKE — Game Manager
   Wave system, arena generation, game state, spawning
   ============================================================ */

const GAME_STATE = { MENU: 0, PLAYING: 1, PAUSED: 2, GAME_OVER: 3 };

class GameManager {
    constructor(scene, camera, ui) {
        this.scene = scene;
        this.camera = camera;
        this.ui = ui;
        this.state = GAME_STATE.MENU;

        // Game data
        this.score = 0;
        this.wave = 0;
        this.kills = 0;
        this.enemies = [];
        this.obstacles = [];
        this.waveEnemiesRemaining = 0;
        this.waveDelay = 0;
        this.betweenWaves = false;

        // Systems
        this.player = null;
        this.combatSystem = null;

        // Arena objects
        this.arenaGroup = new THREE.Group();
        this.scene.add(this.arenaGroup);
    }

    /** Build the 3D arena with geometry */
    buildArena() {
        // Clear previous
        while (this.arenaGroup.children.length) {
            this.arenaGroup.remove(this.arenaGroup.children[0]);
        }
        this.obstacles = [];

        // ---- Ground plane ----
        const groundGeom = new THREE.PlaneGeometry(52, 52, 1, 1);
        const groundMat = new THREE.MeshStandardMaterial({
            color: 0x0a1525,
            roughness: 0.9,
            metalness: 0.1
        });
        const ground = new THREE.Mesh(groundGeom, groundMat);
        ground.rotation.x = -Math.PI / 2;
        ground.receiveShadow = true;
        this.arenaGroup.add(ground);

        // Grid lines on ground
        const gridHelper = new THREE.GridHelper(50, 25, 0x0a2540, 0x0a2040);
        gridHelper.position.y = 0.01;
        gridHelper.material.opacity = 0.3;
        gridHelper.material.transparent = true;
        this.arenaGroup.add(gridHelper);

        // ---- Arena walls ----
        const wallMat = new THREE.MeshStandardMaterial({
            color: 0x00aacc,
            roughness: 0.3,
            metalness: 0.7,
            emissive: 0x004466,
            emissiveIntensity: 0.3,
            transparent: true,
            opacity: 0.7
        });

        const wallThickness = 0.4;
        const wallHeight = 2.5;
        const arenaSize = 25;

        // Create 4 walls
        const wallConfigs = [
            { w: arenaSize * 2 + wallThickness, d: wallThickness, x: 0, z: -arenaSize },
            { w: arenaSize * 2 + wallThickness, d: wallThickness, x: 0, z: arenaSize },
            { w: wallThickness, d: arenaSize * 2 + wallThickness, x: -arenaSize, z: 0 },
            { w: wallThickness, d: arenaSize * 2 + wallThickness, x: arenaSize, z: 0 },
        ];

        wallConfigs.forEach(cfg => {
            const geom = new THREE.BoxGeometry(cfg.w, wallHeight, cfg.d);
            const wall = new THREE.Mesh(geom, wallMat);
            wall.position.set(cfg.x, wallHeight / 2, cfg.z);
            this.arenaGroup.add(wall);
        });

        // ---- Cover objects ----
        const coverMat = new THREE.MeshStandardMaterial({
            color: 0x1a2840,
            roughness: 0.5,
            metalness: 0.6,
            emissive: 0x0a1420,
            emissiveIntensity: 0.2
        });

        const coverPositions = [
            // Center structures
            { x: 0, z: 0, w: 3, h: 1.8, d: 3 },
            // Quadrant covers
            { x: -10, z: -10, w: 2.5, h: 2.0, d: 2.5 },
            { x: 10, z: -10, w: 2.5, h: 2.0, d: 2.5 },
            { x: -10, z: 10, w: 2.5, h: 2.0, d: 2.5 },
            { x: 10, z: 10, w: 2.5, h: 2.0, d: 2.5 },
            // Lane walls
            { x: -5, z: 0, w: 1.2, h: 1.5, d: 5 },
            { x: 5, z: 0, w: 1.2, h: 1.5, d: 5 },
            { x: 0, z: -7, w: 5, h: 1.5, d: 1.2 },
            { x: 0, z: 7, w: 5, h: 1.5, d: 1.2 },
            // Edge covers
            { x: -18, z: -5, w: 2, h: 1.2, d: 2 },
            { x: 18, z: -5, w: 2, h: 1.2, d: 2 },
            { x: -18, z: 5, w: 2, h: 1.2, d: 2 },
            { x: 18, z: 5, w: 2, h: 1.2, d: 2 },
            { x: -5, z: -18, w: 2, h: 1.2, d: 2 },
            { x: 5, z: -18, w: 2, h: 1.2, d: 2 },
            { x: -5, z: 18, w: 2, h: 1.2, d: 2 },
            { x: 5, z: 18, w: 2, h: 1.2, d: 2 },
            // Elevated platforms
            { x: -15, z: -15, w: 3, h: 0.6, d: 3 },
            { x: 15, z: -15, w: 3, h: 0.6, d: 3 },
            { x: -15, z: 15, w: 3, h: 0.6, d: 3 },
            { x: 15, z: 15, w: 3, h: 0.6, d: 3 },
        ];

        coverPositions.forEach(c => {
            const geom = new THREE.BoxGeometry(c.w, c.h, c.d);
            const cover = new THREE.Mesh(geom, coverMat);
            cover.position.set(c.x, c.h / 2, c.z);
            cover.castShadow = true;
            cover.receiveShadow = true;

            // Store AABB for collision
            cover.userData.bounds = {
                min: new THREE.Vector3(c.x - c.w / 2, 0, c.z - c.d / 2),
                max: new THREE.Vector3(c.x + c.w / 2, c.h, c.z + c.d / 2)
            };

            // Glowing edge lines
            const edges = new THREE.EdgesGeometry(geom);
            const lineMat = new THREE.LineBasicMaterial({
                color: 0x00f0ff, transparent: true, opacity: 0.15
            });
            const wireframe = new THREE.LineSegments(edges, lineMat);
            cover.add(wireframe);

            this.arenaGroup.add(cover);
            this.obstacles.push(cover);
        });

        // ---- Decorative corner pillars ----
        const pillarMat = new THREE.MeshStandardMaterial({
            color: 0x00aacc,
            roughness: 0.2,
            metalness: 0.8,
            emissive: 0x006688,
            emissiveIntensity: 0.4
        });

        [[-24, -24], [24, -24], [-24, 24], [24, 24]].forEach(([x, z]) => {
            const pillar = new THREE.Mesh(
                new THREE.CylinderGeometry(0.4, 0.5, 4, 8),
                pillarMat
            );
            pillar.position.set(x, 2, z);
            this.arenaGroup.add(pillar);

            // Pillar light
            const light = new THREE.PointLight(0x00f0ff, 0.5, 8);
            light.position.set(x, 3.5, z);
            this.arenaGroup.add(light);
        });

        // ---- Ambient lights ----
        const ambientLight = new THREE.AmbientLight(0x1a2a40, 0.6);
        this.arenaGroup.add(ambientLight);

        const dirLight = new THREE.DirectionalLight(0x4488cc, 0.5);
        dirLight.position.set(10, 20, 10);
        dirLight.castShadow = true;
        dirLight.shadow.mapSize.width = 1024;
        dirLight.shadow.mapSize.height = 1024;
        dirLight.shadow.camera.near = 1;
        dirLight.shadow.camera.far = 50;
        dirLight.shadow.camera.left = -30;
        dirLight.shadow.camera.right = 30;
        dirLight.shadow.camera.top = 30;
        dirLight.shadow.camera.bottom = -30;
        this.arenaGroup.add(dirLight);

        // Colored rim lights
        const rimLight1 = new THREE.PointLight(0xff00aa, 0.3, 40);
        rimLight1.position.set(-20, 5, -20);
        this.arenaGroup.add(rimLight1);

        const rimLight2 = new THREE.PointLight(0x00f0ff, 0.3, 40);
        rimLight2.position.set(20, 5, 20);
        this.arenaGroup.add(rimLight2);
    }

    /** Start the game */
    startGame() {
        this.state = GAME_STATE.PLAYING;
        this.score = 0;
        this.wave = 0;
        this.kills = 0;

        // Clear previous game objects
        this.clearEnemies();
        if (this.combatSystem) this.combatSystem.clear();
        if (this.player) this.player.destroy();

        // Initialize systems
        this.combatSystem = new CombatSystem(this.scene);
        this.player = new Player(this.scene, this.camera);
        particleSystem = new ParticleSystem(this.scene);

        // UI
        this.ui.showHUD();
        this.ui.updateScore(0);
        this.ui.updateWave(1);
        this.ui.updateHealth(100, 100);

        // Start first wave
        this.startNextWave();
    }

    /** Spawn next wave of enemies */
    startNextWave() {
        this.wave++;
        this.betweenWaves = false;

        // Progressive difficulty
        const baseCount = 3;
        const count = baseCount + Math.floor(this.wave * 1.5);
        const types = this._getWaveEnemyTypes();

        this.ui.updateWave(this.wave);
        this.ui.announceWave(this.wave);

        // Spawn enemies at random positions around arena edges
        for (let i = 0; i < count; i++) {
            const type = types[Math.floor(Math.random() * types.length)];
            const pos = this._getSpawnPosition();
            const enemy = new Enemy(this.scene, pos, type);
            this.enemies.push(enemy);
        }

        this.waveEnemiesRemaining = count;
        this.ui.updateEnemyCount(count);
    }

    /** Get enemy types available for current wave */
    _getWaveEnemyTypes() {
        const types = ['grunt'];
        if (this.wave >= 2) types.push('charger');
        if (this.wave >= 3) types.push('sniper');
        if (this.wave >= 5) types.push('tank');
        return types;
    }

    /** Get a valid spawn position away from player */
    _getSpawnPosition() {
        const margin = 5;
        let pos;
        do {
            const edge = Math.floor(Math.random() * 4);
            switch (edge) {
                case 0: pos = new THREE.Vector3((Math.random() - 0.5) * 40, 0, -22); break;
                case 1: pos = new THREE.Vector3((Math.random() - 0.5) * 40, 0, 22); break;
                case 2: pos = new THREE.Vector3(-22, 0, (Math.random() - 0.5) * 40); break;
                case 3: pos = new THREE.Vector3(22, 0, (Math.random() - 0.5) * 40); break;
            }
        } while (this.player && pos.distanceTo(this.player.mesh.position) < margin);
        return pos;
    }

    /** Main update loop */
    update(dt) {
        if (this.state !== GAME_STATE.PLAYING) return;

        // Update player
        if (this.player) {
            this.player.update(dt, this.combatSystem, this.obstacles);

            // Update HUD
            this.ui.updateHealth(this.player.health, this.player.maxHealth);
            this.ui.updateDashCooldown(
                Math.max(0, this.player.dashCooldownTimer),
                this.player.dashCooldown
            );
            this.ui.updateShootCooldown(
                Math.max(0, this.player.shootCooldown - this.player.shootTimer),
                this.player.shootCooldown
            );

            // Check player death
            if (!this.player.alive) {
                this.gameOver();
                return;
            }

            // Camera follow
            this._updateCamera(dt);
        }

        // Update enemies
        for (let i = this.enemies.length - 1; i >= 0; i--) {
            const enemy = this.enemies[i];
            if (!enemy.alive) {
                // Award score
                this.score += enemy.scoreValue;
                this.kills++;
                this.ui.updateScore(this.score);

                // Floating score text
                if (floatingText) {
                    const screenPos = this._worldToScreen(enemy.mesh.position);
                    floatingText.spawn('+' + enemy.scoreValue, screenPos.x, screenPos.y);
                }

                this.enemies.splice(i, 1);
                this.waveEnemiesRemaining = this.enemies.length;
                this.ui.updateEnemyCount(this.waveEnemiesRemaining);
                continue;
            }
            enemy.update(dt, this.player.mesh.position, this.combatSystem, this.obstacles);
        }

        // Update combat
        if (this.combatSystem) {
            this.combatSystem.update(dt, this.player, this.enemies, this.obstacles);
        }

        // Update particles
        if (particleSystem) particleSystem.update(dt);

        // Screen shake
        if (screenShake) screenShake.update(dt);

        // Wave completion check
        if (this.enemies.length === 0 && !this.betweenWaves) {
            this.betweenWaves = true;
            this.waveDelay = 2.0;
        }

        if (this.betweenWaves) {
            this.waveDelay -= dt;
            if (this.waveDelay <= 0) {
                this.startNextWave();
            }
        }
    }

    /** Smooth camera follow */
    _updateCamera(dt) {
        const target = this.player.mesh.position;
        const camOffset = new THREE.Vector3(0, 22, 14);
        const desiredPos = target.clone().add(camOffset);

        // Smooth follow
        this.camera.position.lerp(desiredPos, Math.min(1, 5 * dt));
        this.camera.lookAt(target.x, 0, target.z);
    }

    /** Convert world position to screen coordinates */
    _worldToScreen(worldPos) {
        const vec = worldPos.clone().project(this.camera);
        return {
            x: (vec.x * 0.5 + 0.5) * window.innerWidth,
            y: (-vec.y * 0.5 + 0.5) * window.innerHeight
        };
    }

    /** Pause */
    pause() {
        if (this.state === GAME_STATE.PLAYING) {
            this.state = GAME_STATE.PAUSED;
            this.ui.showPause();
        }
    }

    /** Resume */
    resume() {
        if (this.state === GAME_STATE.PAUSED) {
            this.state = GAME_STATE.PLAYING;
            this.ui.hidePause();
        }
    }

    /** Game over */
    gameOver() {
        this.state = GAME_STATE.GAME_OVER;
        this.ui.showGameOver(this.score, this.wave, this.kills);
    }

    /** Quit to menu */
    quitToMenu() {
        this.state = GAME_STATE.MENU;
        this.clearEnemies();
        if (this.combatSystem) this.combatSystem.clear();
        if (this.player) { this.player.destroy(); this.player = null; }
        if (particleSystem) particleSystem.clear();
        this.ui.showMenu();
    }

    /** Restart game */
    restart() {
        this.clearEnemies();
        if (this.combatSystem) this.combatSystem.clear();
        if (particleSystem) particleSystem.clear();
        this.startGame();
    }

    /** Remove all enemies */
    clearEnemies() {
        for (const e of this.enemies) e.destroy();
        this.enemies = [];
    }
}
