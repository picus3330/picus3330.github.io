/* ============================================================
   NEXUS STRIKE — Player System with Hero Classes
   
   4 Heroes:
     VANGUARD — Balanced. Ability: Energy burst (AoE damage)
     PHANTOM  — Fast, low HP, rapid fire. Ability: Blink (teleport)
     SENTINEL — Tanky, slow, shotgun. Ability: Shield (absorb hits)
     STRIKER  — Medium. Ability: Power shot (high-damage charged)
   ============================================================ */

const HERO_DEFS = {
    vanguard: {
        name: 'VANGUARD',
        desc: 'Balanced combat operative. Reliable in all situations.',
        color: 0x00ccff,
        colorHex: '#00ccff',
        health: 100,
        speed: 9,
        shootCooldown: 0.22,
        damage: 20,
        dashCooldown: 2.0,
        specialCooldown: 6,
        specialIcon: '◉',
        specialName: 'PULSE BURST',
        stats: { hp: 3, spd: 3, dmg: 3, fire: 3 }
    },
    phantom: {
        name: 'PHANTOM',
        desc: 'High-speed infiltrator. Blink behind enemy lines.',
        color: 0xaa00ff,
        colorHex: '#aa00ff',
        health: 65,
        speed: 13,
        shootCooldown: 0.12,
        damage: 12,
        dashCooldown: 1.5,
        specialCooldown: 4,
        specialIcon: '⊘',
        specialName: 'BLINK',
        stats: { hp: 1, spd: 5, dmg: 2, fire: 5 }
    },
    sentinel: {
        name: 'SENTINEL',
        desc: 'Heavy weapons platform. Shotgun spread & energy shield.',
        color: 0x00ff88,
        colorHex: '#00ff88',
        health: 150,
        speed: 6,
        shootCooldown: 0.55,
        damage: 12, // per pellet, fires 4
        dashCooldown: 2.5,
        specialCooldown: 8,
        specialIcon: '◈',
        specialName: 'SHIELD',
        stats: { hp: 5, spd: 1, dmg: 4, fire: 2 }
    },
    striker: {
        name: 'STRIKER',
        desc: 'Precision operative. Devastating charged power shot.',
        color: 0xff8800,
        colorHex: '#ff8800',
        health: 85,
        speed: 8,
        shootCooldown: 0.3,
        damage: 24,
        dashCooldown: 2.0,
        specialCooldown: 5,
        specialIcon: '⊕',
        specialName: 'POWER SHOT',
        stats: { hp: 2, spd: 3, dmg: 5, fire: 3 }
    }
};

class Player {
    constructor(scene, camera, heroId) {
        this.scene = scene;
        this.camera = camera;
        this.heroId = heroId || 'vanguard';
        this.heroDef = HERO_DEFS[this.heroId];
        this.alive = true;
        this.radius = .5;

        // Stats from hero def
        this.maxHealth = this.heroDef.health;
        this.health = this.maxHealth;
        this.baseSpeed = this.heroDef.speed;
        this.speed = this.baseSpeed;
        this.baseDamage = this.heroDef.damage;
        this.shootCooldown = this.heroDef.shootCooldown;

        // Movement
        this.velocity = new THREE.Vector3();
        this.acceleration = 40;
        this.friction = 12;

        // Dash
        this.dashSpeed = 28;
        this.dashDuration = .15;
        this.dashCooldownMax = this.heroDef.dashCooldown;
        this.dashTimer = 0;
        this.dashCooldownTimer = 0;
        this.isDashing = false;
        this.dashDirection = new THREE.Vector3();

        // Shooting
        this.shootTimer = 0;

        // Special ability
        this.specialCooldownMax = this.heroDef.specialCooldown;
        this.specialCooldownTimer = 0;

        // Shield (Sentinel)
        this.shieldActive = false;
        this.shieldTimer = 0;
        this.shieldMesh = null;

        // Invulnerability
        this.invulnerable = false;
        this.invulTimer = 0;
        this.invulDuration = 2;

        // Boosts
        this.speedBoostTimer = 0;
        this.damageBoostTimer = 0;

        // Input
        this.input = { w:false, a:false, s:false, d:false, shoot:false, dash:false, special:false };
        this.mouseWorld = new THREE.Vector3();
        this._mouseNDC = new THREE.Vector2();
        this._raycaster = new THREE.Raycaster();
        this._groundPlane = new THREE.Plane(new THREE.Vector3(0,1,0), 0);
        this._aimDir = new THREE.Vector3();

        this._buildMesh();
        this._setupInput();
    }

    _buildMesh() {
        const c = this.heroDef.color;
        this.mesh = new THREE.Group();

        const bodyMat = new THREE.MeshStandardMaterial({
            color: c, roughness: .2, metalness: .8, emissive: c, emissiveIntensity: .3
        });
        this.bodyMaterial = bodyMat;

        // Body shape varies per hero
        let bodyGeom;
        switch (this.heroId) {
            case 'phantom':
                bodyGeom = new THREE.ConeGeometry(.35, .9, 6);
                break;
            case 'sentinel':
                bodyGeom = new THREE.BoxGeometry(.7, .9, .7);
                break;
            case 'striker':
                bodyGeom = new THREE.CylinderGeometry(.25, .45, .9, 6);
                break;
            default:
                bodyGeom = new THREE.CylinderGeometry(.3, .45, .9, 8);
        }
        const body = new THREE.Mesh(bodyGeom, bodyMat);
        body.position.y = .5;
        this.mesh.add(body);
        this.body = body;

        // Head
        const head = new THREE.Mesh(
            new THREE.SphereGeometry(.2, 6, 6),
            new THREE.MeshStandardMaterial({ color: c, roughness: .1, metalness: 1, emissive: c, emissiveIntensity: .5 })
        );
        head.position.y = 1.1;
        this.mesh.add(head);

        // Gun
        const gunGeom = new THREE.CylinderGeometry(.04, .04, .45, 5);
        gunGeom.rotateX(Math.PI / 2);
        const gun = new THREE.Mesh(gunGeom, new THREE.MeshStandardMaterial({ color: 0x334455, roughness: .3, metalness: .9 }));
        gun.position.set(.3, .7, .3);
        this.mesh.add(gun);

        // Shadow
        const shadow = new THREE.Mesh(
            new THREE.CircleGeometry(.4, 8),
            new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: .3 })
        );
        shadow.rotation.x = -Math.PI / 2; shadow.position.y = .02;
        this.mesh.add(shadow);

        this.scene.add(this.mesh);
    }

    _setupInput() {
        this._onKeyDown = (e) => {
            switch (e.code) {
                case 'KeyW': this.input.w = true; break;
                case 'KeyA': this.input.a = true; break;
                case 'KeyS': this.input.s = true; break;
                case 'KeyD': this.input.d = true; break;
                case 'Space': e.preventDefault(); this.input.dash = true; break;
                case 'KeyQ': this.input.special = true; break;
            }
        };
        this._onKeyUp = (e) => {
            switch (e.code) {
                case 'KeyW': this.input.w = false; break;
                case 'KeyA': this.input.a = false; break;
                case 'KeyS': this.input.s = false; break;
                case 'KeyD': this.input.d = false; break;
                case 'Space': this.input.dash = false; break;
                case 'KeyQ': this.input.special = false; break;
            }
        };
        this._onMouseDown = (e) => { if (e.button === 0) this.input.shoot = true; };
        this._onMouseUp   = (e) => { if (e.button === 0) this.input.shoot = false; };
        this._onMouseMove  = (e) => {
            this._mouseNDC.x = (e.clientX / window.innerWidth) * 2 - 1;
            this._mouseNDC.y = -(e.clientY / window.innerHeight) * 2 + 1;
            const ch = document.getElementById('crosshair');
            if (ch) { ch.style.left = e.clientX + 'px'; ch.style.top = e.clientY + 'px'; }
        };

        window.addEventListener('keydown', this._onKeyDown);
        window.addEventListener('keyup', this._onKeyUp);
        window.addEventListener('mousedown', this._onMouseDown);
        window.addEventListener('mouseup', this._onMouseUp);
        window.addEventListener('mousemove', this._onMouseMove);
    }

    update(dt, combatSystem, obstacles, enemies) {
        if (!this.alive) return;

        this.shootTimer += dt;
        this.dashCooldownTimer -= dt;
        this.specialCooldownTimer -= dt;

        // Boosts
        if (this.speedBoostTimer > 0) { this.speedBoostTimer -= dt; this.speed = this.baseSpeed * 1.4; }
        else this.speed = this.baseSpeed;
        if (this.damageBoostTimer > 0) this.damageBoostTimer -= dt;

        // Invulnerability
        if (this.invulnerable) {
            this.invulTimer -= dt;
            if (this.invulTimer <= 0) this.invulnerable = false;
            this.mesh.visible = Math.sin(this.invulTimer * 20) > 0;
        } else this.mesh.visible = true;

        // Shield (Sentinel)
        if (this.shieldActive) {
            this.shieldTimer -= dt;
            if (this.shieldTimer <= 0) {
                this.shieldActive = false;
                if (this.shieldMesh) { this.shieldMesh.visible = false; }
            } else if (this.shieldMesh) {
                this.shieldMesh.visible = true;
                this.shieldMesh.rotation.y += dt * 3;
                this.shieldMesh.material.opacity = .15 + Math.sin(Date.now() * .008) * .08;
            }
        }

        // Aim
        this._raycaster.setFromCamera(this._mouseNDC, this.camera);
        const ip = new THREE.Vector3();
        if (this._raycaster.ray.intersectPlane(this._groundPlane, ip)) {
            this.mouseWorld.copy(ip);
            this._aimDir.subVectors(ip, this.mesh.position).setY(0);
            if (this._aimDir.length() > .1) {
                const ta = Math.atan2(this._aimDir.x, this._aimDir.z);
                let diff = ta - this.mesh.rotation.y;
                if (diff > Math.PI) diff -= Math.PI * 2;
                if (diff < -Math.PI) diff += Math.PI * 2;
                this.mesh.rotation.y += diff * Math.min(1, 15 * dt);
            }
            this._aimDir.normalize();
        }

        // Dash
        if (this.input.dash && this.dashCooldownTimer <= 0 && !this.isDashing) {
            this.isDashing = true;
            this.dashTimer = this.dashDuration;
            this.dashCooldownTimer = this.dashCooldownMax;
            const md = this._getMoveDir();
            this.dashDirection = md.length() > 0 ? md.normalize() : new THREE.Vector3(Math.sin(this.mesh.rotation.y), 0, Math.cos(this.mesh.rotation.y));

            // Phantom blink: teleport forward
            if (this.heroId === 'phantom') {
                const blinkDist = 8;
                this.mesh.position.x += this.dashDirection.x * blinkDist;
                this.mesh.position.z += this.dashDirection.z * blinkDist;
                this.mesh.position.x = Math.max(-24, Math.min(24, this.mesh.position.x));
                this.mesh.position.z = Math.max(-24, Math.min(24, this.mesh.position.z));
                this.isDashing = false;
                if (particleSystem) particleSystem.emit(this.mesh.position, { count: 15, color: 0xaa00ff, speed: 5, lifetime: .3, spread: 2, gravity: 0 });
            } else {
                if (particleSystem) particleSystem.emit(this.mesh.position, { count: 8, color: this.heroDef.color, speed: 3, lifetime: .25, spread: .5, gravity: 0 });
            }
            if (audioSystem) audioSystem.playDash();
        }

        if (this.isDashing) {
            this.dashTimer -= dt;
            if (this.dashTimer <= 0) this.isDashing = false;
            this.velocity.copy(this.dashDirection).multiplyScalar(this.dashSpeed);
        } else {
            const md = this._getMoveDir();
            if (md.length() > 0) {
                md.normalize();
                this.velocity.x += md.x * this.acceleration * dt;
                this.velocity.z += md.z * this.acceleration * dt;
            }
            this.velocity.x *= Math.max(0, 1 - this.friction * dt);
            this.velocity.z *= Math.max(0, 1 - this.friction * dt);
            const hSpeed = Math.sqrt(this.velocity.x ** 2 + this.velocity.z ** 2);
            if (hSpeed > this.speed) { const sc = this.speed / hSpeed; this.velocity.x *= sc; this.velocity.z *= sc; }
        }

        // Apply movement + collision
        const nx = this.mesh.position.x + this.velocity.x * dt;
        const nz = this.mesh.position.z + this.velocity.z * dt;
        this.mesh.position.x = Math.max(-24, Math.min(24, nx));
        this.mesh.position.z = Math.max(-24, Math.min(24, nz));

        for (const obs of obstacles) {
            const b = obs.userData.bounds; if (!b) continue;
            const m = this.radius + .1;
            if (this.mesh.position.x > b.min.x-m && this.mesh.position.x < b.max.x+m &&
                this.mesh.position.z > b.min.z-m && this.mesh.position.z < b.max.z+m) {
                const d1=this.mesh.position.x-(b.min.x-m), d2=(b.max.x+m)-this.mesh.position.x;
                const d3=this.mesh.position.z-(b.min.z-m), d4=(b.max.z+m)-this.mesh.position.z;
                const mn=Math.min(d1,d2,d3,d4);
                if(mn===d1){this.mesh.position.x=b.min.x-m;this.velocity.x=0;}
                else if(mn===d2){this.mesh.position.x=b.max.x+m;this.velocity.x=0;}
                else if(mn===d3){this.mesh.position.z=b.min.z-m;this.velocity.z=0;}
                else{this.mesh.position.z=b.max.z+m;this.velocity.z=0;}
            }
        }

        // Shooting
        if (this.input.shoot && this.shootTimer >= this.shootCooldown) {
            this._shoot(combatSystem);
            this.shootTimer = 0;
        }

        // Special ability (Q)
        if (this.input.special && this.specialCooldownTimer <= 0) {
            this._useSpecial(combatSystem, enemies);
            this.specialCooldownTimer = this.specialCooldownMax;
        }

        // Body tilt
        this.body.rotation.x += (-this.velocity.z * .012 - this.body.rotation.x) * .1;
        this.body.rotation.z += (this.velocity.x * .012 - this.body.rotation.z) * .1;
    }

    _getMoveDir() {
        const d = new THREE.Vector3();
        if (this.input.w) d.z -= 1; if (this.input.s) d.z += 1;
        if (this.input.a) d.x -= 1; if (this.input.d) d.x += 1;
        return d;
    }

    _shoot(combat) {
        if (!combat) return;
        const sp = this.mesh.position.clone();
        sp.y = .7; sp.addScaledVector(this._aimDir, .7);
        const dmg = this.damageBoostTimer > 0 ? this.baseDamage * 1.5 : this.baseDamage;

        if (this.heroId === 'sentinel') {
            // Shotgun spread: 4 pellets
            combat.shootSpread(sp, this._aimDir, .35, 4, {
                isPlayer: true, damage: dmg, speed: 26, lifetime: 1.0
            });
            if (audioSystem) audioSystem.playShotgun();
        } else {
            combat.shoot(sp, this._aimDir, {
                isPlayer: true, damage: dmg,
                speed: this.heroId === 'phantom' ? 34 : 30,
                lifetime: 2
            });
            if (audioSystem) audioSystem.playShoot();
        }
        if (particleSystem) particleSystem.emit(sp, { count: 2, color: this.heroDef.color, speed: 3, lifetime: .1, spread: .2, gravity: 0, size: .25 });
    }

    _useSpecial(combat, enemies) {
        switch (this.heroId) {
            case 'vanguard':
                // Pulse burst — AoE damage around player
                if (audioSystem) audioSystem.playExplosion();
                if (screenShake) screenShake.shake(.3);
                if (particleSystem) particleSystem.emit(this.mesh.position, { count: 25, color: 0x00ccff, speed: 8, lifetime: .5, spread: 3, gravity: -2 });
                for (const e of enemies) {
                    if (!e.alive) continue;
                    const dx = e.mesh.position.x - this.mesh.position.x;
                    const dz = e.mesh.position.z - this.mesh.position.z;
                    if (dx*dx + dz*dz < 64) e.takeDamage(35); // radius 8
                }
                break;

            case 'phantom':
                // Blink — teleport to mouse position
                if (audioSystem) audioSystem.playDash();
                const target = this.mouseWorld.clone();
                target.x = Math.max(-24, Math.min(24, target.x));
                target.z = Math.max(-24, Math.min(24, target.z));
                if (particleSystem) particleSystem.emit(this.mesh.position, { count: 12, color: 0xaa00ff, speed: 5, lifetime: .3, spread: 1.5, gravity: 0 });
                this.mesh.position.x = target.x;
                this.mesh.position.z = target.z;
                this.invulnerable = true; this.invulTimer = .5;
                if (particleSystem) particleSystem.emit(this.mesh.position, { count: 12, color: 0xaa00ff, speed: 5, lifetime: .3, spread: 1.5, gravity: 0 });
                break;

            case 'sentinel':
                // Shield — absorb next 50 damage for 4 seconds
                this.shieldActive = true;
                this.shieldTimer = 4;
                if (!this.shieldMesh) {
                    const sg = new THREE.SphereGeometry(1, 12, 12);
                    const sm = new THREE.MeshBasicMaterial({ color: 0x00ff88, transparent: true, opacity: .15, side: THREE.DoubleSide });
                    this.shieldMesh = new THREE.Mesh(sg, sm);
                    this.shieldMesh.position.y = .6;
                    this.mesh.add(this.shieldMesh);
                }
                this.shieldHP = 50;
                if (audioSystem) audioSystem.playPickup();
                if (particleSystem) particleSystem.emit(this.mesh.position, { count: 15, color: 0x00ff88, speed: 4, lifetime: .4, spread: 2, gravity: 0 });
                break;

            case 'striker':
                // Power shot — big slow projectile, high damage
                if (!combat) return;
                const sp = this.mesh.position.clone();
                sp.y = .7; sp.addScaledVector(this._aimDir, .7);
                combat.shoot(sp, this._aimDir, {
                    isPlayer: true, damage: 80, speed: 18, lifetime: 3
                });
                if (audioSystem) audioSystem.playCharge();
                if (screenShake) screenShake.shake(.15);
                if (particleSystem) particleSystem.emit(sp, { count: 10, color: 0xff8800, speed: 4, lifetime: .3, spread: .5, gravity: 0 });
                break;
        }
    }

    takeDamage(amount) {
        if (this.invulnerable || !this.alive) return;
        // Sentinel shield absorbs damage first
        if (this.shieldActive && this.shieldHP > 0) {
            this.shieldHP -= amount;
            if (this.shieldHP <= 0) {
                this.shieldActive = false;
                if (this.shieldMesh) this.shieldMesh.visible = false;
                amount = -this.shieldHP; // overflow damage
                if (amount <= 0) return;
            } else return;
        }
        this.health -= amount;
        const v = document.getElementById('damage-vignette');
        if (v) { v.classList.add('active'); setTimeout(() => v.classList.remove('active'), 200); }
        if (this.health <= 0) { this.health = 0; this.die(); }
    }

    die() {
        this.alive = false;
        if (particleSystem) particleSystem.emit(this.mesh.position, { count: 25, color: this.heroDef.color, speed: 8, lifetime: .7, spread: 2 });
        if (audioSystem) audioSystem.playExplosion();
        if (screenShake) screenShake.shake(.4);
        this.mesh.visible = false;
    }

    respawn() {
        this.alive = true; this.health = this.maxHealth;
        this.mesh.position.set(0, 0, 0); this.velocity.set(0, 0, 0);
        this.mesh.visible = true; this.invulnerable = true; this.invulTimer = this.invulDuration;
        this.speedBoostTimer = 0; this.damageBoostTimer = 0;
        this.shieldActive = false; if (this.shieldMesh) this.shieldMesh.visible = false;
    }

    destroy() {
        window.removeEventListener('keydown', this._onKeyDown);
        window.removeEventListener('keyup', this._onKeyUp);
        window.removeEventListener('mousedown', this._onMouseDown);
        window.removeEventListener('mouseup', this._onMouseUp);
        window.removeEventListener('mousemove', this._onMouseMove);
        this.scene.remove(this.mesh);
    }
}
