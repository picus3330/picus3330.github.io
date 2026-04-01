/* ============================================================
   NEXUS STRIKE — Combat System (OPTIMIZED)
   
   PERF: Projectile mesh pool (no create/destroy per shot),
   shared materials, ZERO PointLights, reduced trail particles,
   spatial early-out on collision checks.
   ============================================================ */

// Shared geometries + materials — created ONCE, reused forever
const _projGeomPlayer = new THREE.CylinderGeometry(0.08, 0.08, 0.5, 5);
_projGeomPlayer.rotateX(Math.PI / 2);
const _projGeomEnemy = new THREE.CylinderGeometry(0.07, 0.07, 0.45, 5);
_projGeomEnemy.rotateX(Math.PI / 2);
const _projMatPlayer = new THREE.MeshBasicMaterial({ color: 0x00f0ff });
const _projMatEnemy  = new THREE.MeshBasicMaterial({ color: 0xff2244 });

class Projectile {
    constructor() {
        // Two meshes in pool — player and enemy versions
        this.meshPlayer = new THREE.Mesh(_projGeomPlayer, _projMatPlayer);
        this.meshEnemy  = new THREE.Mesh(_projGeomEnemy, _projMatEnemy);
        this.meshPlayer.visible = false;
        this.meshEnemy.visible = false;
        this.mesh = null;
        this.alive = false;
        this.velocity = new THREE.Vector3();
        this.age = 0;
        this.lifetime = 2;
        this.damage = 20;
        this.isPlayerProjectile = true;
        this.radius = 0.15;
        this._trailAcc = 0; // throttle trail spawns
    }

    /** Activate this pooled projectile */
    fire(scene, position, direction, opts) {
        this.isPlayerProjectile = opts.isPlayer !== false;
        this.mesh = this.isPlayerProjectile ? this.meshPlayer : this.meshEnemy;
        this.mesh.position.copy(position);
        this.velocity.copy(direction).normalize().multiplyScalar(opts.speed || 28);
        this.damage = opts.damage || 20;
        this.lifetime = opts.lifetime || 2;
        this.age = 0;
        this.alive = true;
        this._trailAcc = 0;

        // Orient
        const lk = position.clone().add(this.velocity);
        this.mesh.lookAt(lk);
        this.mesh.visible = true;
        if (!this.mesh.parent) scene.add(this.mesh);
    }

    update(dt) {
        if (!this.alive) return;
        this.age += dt;
        if (this.age >= this.lifetime) { this.kill(); return; }

        this.mesh.position.addScaledVector(this.velocity, dt);

        // Trail particles — throttled to max 1 per 0.06s (was every frame)
        this._trailAcc += dt;
        if (this._trailAcc > 0.06 && particleSystem) {
            this._trailAcc = 0;
            const c = this.isPlayerProjectile ? 0x00a0cc : 0xcc1133;
            particleSystem.emitTrail(this.mesh.position, this.velocity, {
                count: 1, color: c, speed: 1, lifetime: 0.15
            });
        }
    }

    kill() {
        this.alive = false;
        if (this.mesh) this.mesh.visible = false;
    }
}

class CombatSystem {
    constructor(scene) {
        this.scene = scene;
        this.pool = [];
        this.active = [];
        this.powerUps = [];
        this.powerUpTimer = 0;
        this.powerUpInterval = 18;
        this._hitTimer = null;

        // Pre-allocate projectile pool
        for (let i = 0; i < 80; i++) {
            this.pool.push(new Projectile());
        }
    }

    shoot(position, direction, opts) {
        let proj = this.pool.pop();
        if (!proj) {
            // Pool exhausted — reuse oldest active
            proj = this.active.shift();
            if (proj) proj.kill();
            else proj = new Projectile(); // fallback
        }
        proj.fire(this.scene, position, direction, opts || {});
        this.active.push(proj);
        return proj;
    }

    /** Shoot multiple projectiles in a spread pattern */
    shootSpread(position, direction, spreadAngle, count, opts) {
        const baseAngle = Math.atan2(direction.x, direction.z);
        const step = spreadAngle / Math.max(count - 1, 1);
        const startAngle = baseAngle - spreadAngle / 2;
        for (let i = 0; i < count; i++) {
            const angle = startAngle + step * i;
            const dir = new THREE.Vector3(Math.sin(angle), 0, Math.cos(angle));
            this.shoot(position.clone(), dir, opts);
        }
    }

    update(dt, player, enemies, obstacles) {
        for (let i = this.active.length - 1; i >= 0; i--) {
            const p = this.active[i];
            p.update(dt);

            if (!p.alive) { this.pool.push(p); this.active.splice(i, 1); continue; }

            const pos = p.mesh.position;

            // Bounds check
            if (Math.abs(pos.x) > 26 || Math.abs(pos.z) > 26) {
                p.kill(); this.pool.push(p); this.active.splice(i, 1); continue;
            }

            // Obstacle collision
            let hitObs = false;
            for (let o = 0; o < obstacles.length; o++) {
                const b = obstacles[o].userData.bounds;
                if (!b) continue;
                // Quick AABB vs point
                if (pos.x > b.min.x - .15 && pos.x < b.max.x + .15 &&
                    pos.z > b.min.z - .15 && pos.z < b.max.z + .15) {
                    if (particleSystem) particleSystem.emit(pos, { count: 3, color: 0x667788, speed: 2, lifetime: 0.2, size: 0.25 });
                    p.kill(); this.pool.push(p); this.active.splice(i, 1);
                    hitObs = true; break;
                }
            }
            if (hitObs) continue;

            // Player projectile → enemies
            if (p.isPlayerProjectile) {
                for (let e = 0; e < enemies.length; e++) {
                    const en = enemies[e];
                    if (!en.alive) continue;
                    const dx = pos.x - en.mesh.position.x;
                    const dz = pos.z - en.mesh.position.z;
                    const distSq = dx*dx + dz*dz;
                    const rSum = en.radius + p.radius;
                    if (distSq < rSum * rSum) {
                        en.takeDamage(p.damage);
                        if (particleSystem) particleSystem.emit(pos, { count: 6, color: 0xff6600, speed: 4, lifetime: 0.3, spread: 1.2 });
                        if (screenShake) screenShake.shake(0.12);
                        if (audioSystem) audioSystem.playHit();
                        this._showHitMarker();
                        p.kill(); this.pool.push(p); this.active.splice(i, 1);
                        break;
                    }
                }
            }
            // Enemy projectile → player
            else if (player && player.alive && !player.invulnerable) {
                const dx = pos.x - player.mesh.position.x;
                const dz = pos.z - player.mesh.position.z;
                const distSq = dx*dx + dz*dz;
                const rSum = player.radius + p.radius;
                if (distSq < rSum * rSum) {
                    player.takeDamage(p.damage);
                    if (particleSystem) particleSystem.emit(pos, { count: 8, color: 0xff2244, speed: 4, lifetime: 0.4 });
                    if (screenShake) screenShake.shake(0.25);
                    if (audioSystem) audioSystem.playDamage();
                    p.kill(); this.pool.push(p); this.active.splice(i, 1);
                }
            }
        }

        // Power-ups
        this.powerUpTimer += dt;
        if (this.powerUpTimer >= this.powerUpInterval && this.powerUps.length < 3) {
            this._spawnPowerUp();
            this.powerUpTimer = 0;
        }
        for (let i = this.powerUps.length - 1; i >= 0; i--) {
            const pu = this.powerUps[i];
            pu.age += dt;
            if (pu.age >= 20) { this.scene.remove(pu.mesh); this.powerUps.splice(i, 1); continue; }
            // Hover + rotate
            pu.mesh.position.y = .8 + Math.sin(pu.age * 3) * .12;
            pu.mesh.children[0].rotation.y += dt * 2;
            // Blink near expiry
            if (pu.age > 15) pu.mesh.visible = Math.sin(pu.age * 10) > 0;
            // Pickup check
            if (player && player.alive) {
                const dx = player.mesh.position.x - pu.mesh.position.x;
                const dz = player.mesh.position.z - pu.mesh.position.z;
                if (dx*dx + dz*dz < 1.2) {
                    pu.apply(player);
                    if (audioSystem) audioSystem.playPickup();
                    if (particleSystem) particleSystem.emit(pu.mesh.position, { count: 10, color: pu.color, speed: 4, lifetime: 0.4, spread: 1.5 });
                    this.scene.remove(pu.mesh); this.powerUps.splice(i, 1);
                }
            }
        }
    }

    _spawnPowerUp() {
        const types = ['health', 'speed', 'damage'];
        const type = types[Math.floor(Math.random() * types.length)];
        const colors = { health: 0x00ff88, speed: 0xffcc00, damage: 0xff00aa };
        const color = colors[type];
        const x = (Math.random() - .5) * 40, z = (Math.random() - .5) * 40;

        const group = new THREE.Group();
        group.position.set(x, .8, z);
        // Ring
        const ring = new THREE.Mesh(
            new THREE.TorusGeometry(.45, .06, 6, 16),
            new THREE.MeshBasicMaterial({ color, transparent: true, opacity: .6 })
        );
        ring.rotation.x = Math.PI / 2;
        group.add(ring);
        // Inner shape
        const geoms = { health: new THREE.OctahedronGeometry(.2, 0), speed: new THREE.ConeGeometry(.18, .35, 4), damage: new THREE.BoxGeometry(.25, .25, .25) };
        const inner = new THREE.Mesh(geoms[type], new THREE.MeshBasicMaterial({ color }));
        group.add(inner);
        this.scene.add(group);

        this.powerUps.push({
            mesh: group, age: 0, color,
            apply(player) {
                if (type === 'health') player.health = Math.min(player.maxHealth, player.health + 30);
                else if (type === 'speed') player.speedBoostTimer = 5;
                else player.damageBoostTimer = 5;
            }
        });
    }

    _showHitMarker() {
        const el = document.getElementById('hit-marker');
        if (!el) return;
        el.classList.remove('hidden');
        clearTimeout(this._hitTimer);
        this._hitTimer = setTimeout(() => el.classList.add('hidden'), 150);
    }

    clear() {
        for (const p of this.active) p.kill();
        this.pool.push(...this.active);
        this.active = [];
        for (const pu of this.powerUps) this.scene.remove(pu.mesh);
        this.powerUps = [];
        this.powerUpTimer = 0;
    }
}
