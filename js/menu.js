/* ============================================================
   NEXUS STRIKE — Menu System with Hero Selection
   ============================================================ */

class MenuSystem {
    constructor(scene, camera, renderer) {
        this.scene = scene;
        this.camera = camera;
        this.active = true;
        this.time = 0;
        this.menuObjects = new THREE.Group();
        this.scene.add(this.menuObjects);
        this.floaters = [];
        this._build();
    }

    _build() {
        const colors = [0x00f0ff, 0xff00aa, 0x4040ff, 0x00ff88, 0xffcc00];
        const geoms = [
            new THREE.OctahedronGeometry(.5, 0),
            new THREE.TetrahedronGeometry(.5, 0),
            new THREE.IcosahedronGeometry(.4, 0),
            new THREE.BoxGeometry(.6, .6, .6),
        ];

        for (let i = 0; i < 30; i++) {
            const mat = new THREE.MeshBasicMaterial({
                color: colors[i % colors.length], wireframe: true, transparent: true, opacity: .12 + Math.random() * .15
            });
            const mesh = new THREE.Mesh(geoms[i % geoms.length], mat);
            mesh.position.set((Math.random()-.5)*50, (Math.random()-.5)*25, (Math.random()-.5)*50-20);
            mesh.userData.rs = { x: (Math.random()-.5)*.4, y: (Math.random()-.5)*.4 };
            mesh.userData.fs = .3 + Math.random() * .4;
            mesh.userData.fo = Math.random() * Math.PI * 2;
            mesh.userData.by = mesh.position.y;
            mesh.scale.setScalar(.5 + Math.random() * 1.5);
            this.menuObjects.add(mesh);
            this.floaters.push(mesh);
        }

        // Central orb
        this.orb = new THREE.Mesh(
            new THREE.SphereGeometry(2, 24, 24),
            new THREE.MeshBasicMaterial({ color: 0x00f0ff, transparent: true, opacity: .06 })
        );
        this.orb.position.set(0, 0, -15);
        this.menuObjects.add(this.orb);

        // Ring
        this.ring = new THREE.Mesh(
            new THREE.TorusGeometry(3.5, .04, 6, 48),
            new THREE.MeshBasicMaterial({ color: 0x00f0ff, transparent: true, opacity: .15 })
        );
        this.ring.position.copy(this.orb.position);
        this.menuObjects.add(this.ring);

        // Stars (single Points object)
        const starCount = 150;
        const sp = new Float32Array(starCount * 3);
        for (let i = 0; i < starCount * 3; i += 3) {
            sp[i] = (Math.random()-.5)*80; sp[i+1] = (Math.random()-.5)*35; sp[i+2] = (Math.random()-.5)*80-20;
        }
        const sg = new THREE.BufferGeometry();
        sg.setAttribute('position', new THREE.BufferAttribute(sp, 3));
        this.stars = new THREE.Points(sg, new THREE.PointsMaterial({ color: 0x3366aa, size: .12, transparent: true, opacity: .35 }));
        this.menuObjects.add(this.stars);

        this.camera.position.set(0, 5, 12);
        this.camera.lookAt(0, 0, -15);
    }

    update(dt) {
        if (!this.active) return;
        this.time += dt;
        for (const f of this.floaters) {
            f.rotation.x += f.userData.rs.x * dt;
            f.rotation.y += f.userData.rs.y * dt;
            f.position.y = f.userData.by + Math.sin(this.time * f.userData.fs + f.userData.fo) * 1.5;
        }
        this.orb.scale.setScalar(1 + Math.sin(this.time * 1.5) * .12);
        this.ring.rotation.z += dt * .3;
        this.ring.rotation.x = Math.sin(this.time * .5) * .3;
        this.camera.position.x = Math.sin(this.time * .2) * 1.5;
        this.camera.position.y = 5 + Math.sin(this.time * .3) * .4;
        this.camera.lookAt(0, 0, -15);
        this.stars.rotation.y += dt * .015;
    }

    show() { this.active = true; this.menuObjects.visible = true; }
    hide() { this.active = false; this.menuObjects.visible = false; }
}

/* ---- Hero Selection Grid Builder ---- */
function buildHeroSelectUI() {
    const grid = document.getElementById('hero-grid');
    if (!grid) return;
    grid.innerHTML = '';

    Object.keys(HERO_DEFS).forEach((id, idx) => {
        const h = HERO_DEFS[id];
        const card = document.createElement('div');
        card.className = 'hero-card' + (idx === 0 ? ' selected' : '');
        card.dataset.hero = id;
        card.innerHTML = `
            <div class="hero-card-icon" style="color:${h.colorHex};text-shadow:0 0 15px ${h.colorHex}">${h.specialIcon}</div>
            <div class="hero-card-name">${h.name}</div>
            <div class="hero-card-role">${h.specialName}</div>
        `;
        card.style.borderColor = idx === 0 ? h.colorHex : '';
        grid.appendChild(card);
    });

    // Show first hero detail
    _updateHeroDetail('vanguard');
}

function _updateHeroDetail(heroId) {
    const h = HERO_DEFS[heroId];
    document.getElementById('hero-detail-name').textContent = h.name;
    document.getElementById('hero-detail-name').style.color = h.colorHex;
    document.getElementById('hero-detail-desc').textContent = h.desc;

    const statsEl = document.getElementById('hero-stats');
    statsEl.innerHTML = '';
    const labels = { hp: 'HEALTH', spd: 'SPEED', dmg: 'DAMAGE', fire: 'FIRE RATE' };
    for (const [key, label] of Object.entries(labels)) {
        const val = h.stats[key];
        const row = document.createElement('div');
        row.className = 'hero-stat-row';
        let bars = '';
        for (let i = 0; i < 5; i++) {
            bars += `<div class="stat-pip ${i < val ? 'filled' : ''}" style="${i < val ? 'background:' + h.colorHex + ';box-shadow:0 0 4px ' + h.colorHex : ''}"></div>`;
        }
        row.innerHTML = `<span class="stat-name">${label}</span><div class="stat-pips">${bars}</div>`;
        statsEl.appendChild(row);
    }
}

/* ---- Wire all buttons ---- */
function setupMenuButtons(gameManager, menuSystem, ui) {
    const $ = id => document.getElementById(id);

    buildHeroSelectUI();

    $('btn-play').addEventListener('click', () => {
        if (audioSystem) audioSystem.playClick();
        ui.showScreen('hero-select');
    });

    // Hero card selection
    $('hero-grid').addEventListener('click', (e) => {
        const card = e.target.closest('.hero-card');
        if (!card) return;
        if (audioSystem) audioSystem.playClick();
        document.querySelectorAll('.hero-card').forEach(c => {
            c.classList.remove('selected');
            c.style.borderColor = '';
        });
        card.classList.add('selected');
        const heroId = card.dataset.hero;
        const h = HERO_DEFS[heroId];
        card.style.borderColor = h.colorHex;
        gameManager.selectedHero = heroId;
        _updateHeroDetail(heroId);
    });

    $('btn-deploy').addEventListener('click', () => {
        if (audioSystem) audioSystem.playClick();
        menuSystem.hide();
        gameManager.buildArena();
        gameManager.startGame();
    });

    $('btn-hero-back').addEventListener('click', () => {
        if (audioSystem) audioSystem.playClick();
        ui.showMenu();
    });

    $('btn-settings').addEventListener('click', () => { if (audioSystem) audioSystem.playClick(); ui.showScreen('settings-panel'); });
    $('btn-settings-back').addEventListener('click', () => { if (audioSystem) audioSystem.playClick(); ui.showMenu(); });
    $('btn-controls').addEventListener('click', () => { if (audioSystem) audioSystem.playClick(); ui.showScreen('controls-panel'); });
    $('btn-controls-back').addEventListener('click', () => { if (audioSystem) audioSystem.playClick(); ui.showMenu(); });
    $('btn-credits').addEventListener('click', () => { if (audioSystem) audioSystem.playClick(); ui.showScreen('credits-panel'); });
    $('btn-credits-back').addEventListener('click', () => { if (audioSystem) audioSystem.playClick(); ui.showMenu(); });

    $('btn-resume').addEventListener('click', () => { if (audioSystem) audioSystem.playClick(); gameManager.resume(); });
    $('btn-quit').addEventListener('click', () => { if (audioSystem) audioSystem.playClick(); menuSystem.show(); gameManager.quitToMenu(); });
    $('btn-restart').addEventListener('click', () => { if (audioSystem) audioSystem.playClick(); gameManager.restart(); });
    $('btn-gameover-menu').addEventListener('click', () => { if (audioSystem) audioSystem.playClick(); menuSystem.show(); gameManager.quitToMenu(); });

    window.addEventListener('keydown', (e) => {
        if (e.code === 'Escape') {
            if (gameManager.state === GAME_STATE.PLAYING) gameManager.pause();
            else if (gameManager.state === GAME_STATE.PAUSED) gameManager.resume();
        }
        if (e.code === 'KeyR' && gameManager.state === GAME_STATE.GAME_OVER) gameManager.restart();
    });

    $('vol-master').addEventListener('input', (e) => { if (audioSystem) audioSystem.setMasterVolume(e.target.value / 100); });
    $('vol-sfx').addEventListener('input', (e) => { if (audioSystem) audioSystem.setSfxVolume(e.target.value / 100); });
    $('screen-shake').addEventListener('change', (e) => { if (screenShake) screenShake.enabled = e.target.checked; });
    $('quality-select').addEventListener('change', (e) => { gameManager.quality = e.target.value; });

    // Hover sounds
    document.querySelectorAll('.menu-btn').forEach(btn => {
        btn.addEventListener('mouseenter', () => {
            if (audioSystem && audioSystem.initialized) {
                audioSystem._tone('sine', 1200, 1000, .03, .03);
            }
        });
    });
}
