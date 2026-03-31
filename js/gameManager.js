/* ============================================================
   NEXUS STRIKE — Game Manager (OPTIMIZED)
   
   PERF: Reduced lights (2 instead of 6+), no per-corner
   point lights, simplified cover geometry, optional shadows.
   ============================================================ */

const GAME_STATE = { MENU: 0, PLAYING: 1, PAUSED: 2, GAME_OVER: 3 };

class GameManager {
    constructor(scene, camera, ui) {
        this.scene = scene;
        this.camera = camera;
        this.ui = ui;
        this.state = GAME_STATE.MENU;
        this.selectedHero = 'vanguard';
        this.quality = 'medium';

        this.score = 0; this.wave = 0; this.kills = 0;
        this.enemies = []; this.obstacles = [];
        this.betweenWaves = false; this.waveDelay = 0;

        this.player = null;
        this.combatSystem = null;
        this.arenaGroup = new THREE.Group();
        this.scene.add(this.arenaGroup);

        // Reusable vec for camera
        this._camTarget = new THREE.Vector3();
        this._camDesired = new THREE.Vector3();
    }

    buildArena() {
        // Clear previous
        while (this.arenaGroup.children.length) this.arenaGroup.remove(this.arenaGroup.children[0]);
        this.obstacles = [];

        // Ground
        const ground = new THREE.Mesh(
            new THREE.PlaneGeometry(52, 52),
            new THREE.MeshStandardMaterial({ color: 0x0a1525, roughness: .9, metalness: .1 })
        );
        ground.rotation.x = -Math.PI / 2;
        this.arenaGroup.add(ground);

        // Grid
        const grid = new THREE.GridHelper(50, 25, 0x0a2540, 0x0a2040);
        grid.position.y = .01;
        grid.material.opacity = .25; grid.material.transparent = true;
        this.arenaGroup.add(grid);

        // Walls — shared material
        const wallMat = new THREE.MeshStandardMaterial({
            color: 0x00aacc, roughness: .3, metalness: .7, emissive: 0x003344, emissiveIntensity: .3,
            transparent: true, opacity: .6
        });
        const wallH = 2.5, as = 25;
        [[as*2,.4,0,-as],[as*2,.4,0,as],[.4,as*2,-as,0],[.4,as*2,as,0]].forEach(([w,d,x,z]) => {
            const wall = new THREE.Mesh(new THREE.BoxGeometry(w, wallH, d), wallMat);
            wall.position.set(x, wallH/2, z);
            this.arenaGroup.add(wall);
        });

        // Cover objects — shared material, NO edge wireframes (saves draw calls)
        const coverMat = new THREE.MeshStandardMaterial({
            color: 0x1a2840, roughness: .5, metalness: .6, emissive: 0x0a1420, emissiveIntensity: .15
        });

        const covers = [
            [0,0,3,1.8,3], [-10,-10,2.5,2,2.5], [10,-10,2.5,2,2.5], [-10,10,2.5,2,2.5], [10,10,2.5,2,2.5],
            [-5,0,1.2,1.5,5], [5,0,1.2,1.5,5], [0,-7,5,1.5,1.2], [0,7,5,1.5,1.2],
            [-18,-5,2,1.2,2], [18,-5,2,1.2,2], [-18,5,2,1.2,2], [18,5,2,1.2,2],
            [-5,-18,2,1.2,2], [5,-18,2,1.2,2], [-5,18,2,1.2,2], [5,18,2,1.2,2],
            [-15,-15,3,.6,3], [15,-15,3,.6,3], [-15,15,3,.6,3], [15,15,3,.6,3]
        ];

        covers.forEach(([x,z,w,h,d]) => {
            const cover = new THREE.Mesh(new THREE.BoxGeometry(w,h,d), coverMat);
            cover.position.set(x, h/2, z);
            cover.userData.bounds = {
                min: new THREE.Vector3(x-w/2, 0, z-d/2),
                max: new THREE.Vector3(x+w/2, h, z+d/2)
            };
            this.arenaGroup.add(cover);
            this.obstacles.push(cover);
        });

        // Lighting — MINIMAL for performance (2 lights only)
        this.arenaGroup.add(new THREE.AmbientLight(0x1a2a40, .7));

        const dirLight = new THREE.DirectionalLight(0x4488cc, .6);
        dirLight.position.set(10, 20, 10);
        // Shadows only on high quality
        if (this.quality === 'high') {
            dirLight.castShadow = true;
            dirLight.shadow.mapSize.width = 512;
            dirLight.shadow.mapSize.height = 512;
            dirLight.shadow.camera.near = 1; dirLight.shadow.camera.far = 50;
            dirLight.shadow.camera.left = -30; dirLight.shadow.camera.right = 30;
            dirLight.shadow.camera.top = 30; dirLight.shadow.camera.bottom = -30;
        }
        this.arenaGroup.add(dirLight);
    }

    startGame() {
        this.state = GAME_STATE.PLAYING;
        this.score = 0; this.wave = 0; this.kills = 0;

        this.clearEnemies();
        if (this.combatSystem) this.combatSystem.clear();
        if (this.player) this.player.destroy();

        const maxP = this.quality === 'low' ? 400 : this.quality === 'high' ? 1000 : 800;
        this.combatSystem = new CombatSystem(this.scene);
        this.player = new Player(this.scene, this.camera, this.selectedHero);
        particleSystem = new ParticleSystem(this.scene, maxP);

        this.ui.showHUD();
        this.ui.updateScore(0); this.ui.updateWave(1); this.ui.updateHealth(this.player.maxHealth, this.player.maxHealth);
        this.ui.setHeroInfo(this.player.heroDef);

        this.startNextWave();
    }

    startNextWave() {
        this.wave++;
        this.betweenWaves = false;
        const count = 3 + Math.floor(this.wave * 1.4);
        const types = this._waveTypes();

        this.ui.updateWave(this.wave);
        this.ui.announceWave(this.wave);

        for (let i = 0; i < count; i++) {
            const type = types[Math.floor(Math.random() * types.length)];
            this.enemies.push(new Enemy(this.scene, this._spawnPos(), type));
        }
        this.ui.updateEnemyCount(this.enemies.length);
    }

    _waveTypes() {
        const t = ['grunt'];
        if (this.wave >= 2) t.push('charger');
        if (this.wave >= 3) t.push('sniper');
        if (this.wave >= 5) t.push('tank');
        return t;
    }

    _spawnPos() {
        const edge = Math.random() * 4 | 0;
        const r = (Math.random() - .5) * 40;
        switch (edge) {
            case 0: return new THREE.Vector3(r, 0, -22);
            case 1: return new THREE.Vector3(r, 0, 22);
            case 2: return new THREE.Vector3(-22, 0, r);
            default: return new THREE.Vector3(22, 0, r);
        }
    }

    update(dt) {
        if (this.state !== GAME_STATE.PLAYING) return;

        const p = this.player;
        if (p) {
            p.update(dt, this.combatSystem, this.obstacles, this.enemies);
            this.ui.updateHealth(p.health, p.maxHealth);
            this.ui.updateDashCooldown(Math.max(0, p.dashCooldownTimer));
            this.ui.updateSpecialCooldown(Math.max(0, p.specialCooldownTimer));

            if (!p.alive) { this.gameOver(); return; }
            this._updateCamera(dt);
        }

        // Enemies
        for (let i = this.enemies.length - 1; i >= 0; i--) {
            const e = this.enemies[i];
            if (!e.alive) {
                this.score += e.scoreValue;
                this.kills++;
                this.ui.updateScore(this.score);
                if (floatingText) {
                    const sp = this._worldToScreen(e.mesh.position);
                    floatingText.spawn('+' + e.scoreValue, sp.x, sp.y);
                }
                this.enemies.splice(i, 1);
                this.ui.updateEnemyCount(this.enemies.length);
                continue;
            }
            e.update(dt, p.mesh.position, this.combatSystem, this.obstacles);
        }

        if (this.combatSystem) this.combatSystem.update(dt, p, this.enemies, this.obstacles);
        if (particleSystem) particleSystem.update(dt);
        if (screenShake) screenShake.update(dt);

        // Wave check
        if (this.enemies.length === 0 && !this.betweenWaves) { this.betweenWaves = true; this.waveDelay = 2; }
        if (this.betweenWaves) { this.waveDelay -= dt; if (this.waveDelay <= 0) this.startNextWave(); }
    }

    _updateCamera(dt) {
        const t = this.player.mesh.position;
        this._camDesired.set(t.x, 22, t.z + 14);
        this.camera.position.lerp(this._camDesired, Math.min(1, 5 * dt));
        // Apply screen shake offset
        if (screenShake) {
            this.camera.position.x += screenShake.offsetX;
            this.camera.position.z += screenShake.offsetZ;
        }
        this._camTarget.set(t.x, 0, t.z);
        this.camera.lookAt(this._camTarget);
    }

    _worldToScreen(wp) {
        const v = wp.clone().project(this.camera);
        return { x: (v.x*.5+.5)*window.innerWidth, y: (-v.y*.5+.5)*window.innerHeight };
    }

    pause()  { if (this.state===GAME_STATE.PLAYING) { this.state=GAME_STATE.PAUSED; this.ui.showPause(); } }
    resume() { if (this.state===GAME_STATE.PAUSED)  { this.state=GAME_STATE.PLAYING; this.ui.hidePause(); } }
    gameOver() { this.state = GAME_STATE.GAME_OVER; this.ui.showGameOver(this.score, this.wave, this.kills); }

    quitToMenu() {
        this.state = GAME_STATE.MENU;
        this.clearEnemies();
        if (this.combatSystem) this.combatSystem.clear();
        if (this.player) { this.player.destroy(); this.player = null; }
        if (particleSystem) particleSystem.clear();
        this.ui.showMenu();
    }

    restart() {
        this.clearEnemies();
        if (this.combatSystem) this.combatSystem.clear();
        if (particleSystem) particleSystem.clear();
        this.startGame();
    }

    clearEnemies() { for (const e of this.enemies) e.destroy(); this.enemies = []; }
}
