/* ============================================================
   NEXUS STRIKE — Combat System
   Projectiles, collision detection, power-ups
   ============================================================ */

class Projectile {
    constructor(scene, position, direction, options = {}) {
        this.scene = scene;
        this.speed = options.speed || 28;
        this.damage = options.damage || 20;
        this.lifetime = options.lifetime || 2.0;
        this.age = 0;
        this.isPlayerProjectile = options.isPlayer !== false;
        this.alive = true;
        this.radius = 0.15;

        // Create mesh — glowing elongated shape
        const color = this.isPlayerProjectile ? 0x00f0ff : 0xff2244;
        const geom = new THREE.CylinderGeometry(0.06, 0.06, 0.4, 6);
        geom.rotateX(Math.PI / 2);
        const mat = new THREE.MeshBasicMaterial({
            color: color,
            transparent: true,
            opacity: 0.9
        });
        this.mesh = new THREE.Mesh(geom, mat);
        this.mesh.position.copy(position);

        // Glow shell
        const glowGeom = new THREE.SphereGeometry(0.15, 8, 8);
        const glowMat = new THREE.MeshBasicMaterial({
            color: color,
            transparent: true,
            opacity: 0.3
        });
        this.glow = new THREE.Mesh(glowGeom, glowMat);
        this.mesh.add(this.glow);

        // Point light for dynamic lighting
        this.light = new THREE.PointLight(color, 0.8, 6);
        this.mesh.add(this.light);

        // Velocity
        this.velocity = direction.clone().normalize().multiplyScalar(this.speed);

        // Orient toward direction
        const lookTarget = position.clone().add(this.velocity);
        this.mesh.lookAt(lookTarget);

        scene.add(this.mesh);
    }

    update(dt) {
        if (!this.alive) return;
        this.age += dt;
        if (this.age >= this.lifetime) {
            this.destroy();
            return;
        }

        // Move
        this.mesh.position.addScaledVector(this.velocity, dt);

        // Trail particles
        if (Math.random() < 0.4 && particleSystem) {
            const color = this.isPlayerProjectile ? 0x00f0ff : 0xff2244;
            particleSystem.emitTrail(this.mesh.position, this.velocity.clone().normalize(), {
                count: 1, color, speed: 1, lifetime: 0.2, size: 0.04
            });
        }

        // Pulse glow
        const pulse = 0.8 + Math.sin(this.age * 20) * 0.2;
        this.glow.scale.setScalar(pulse);
    }

    destroy() {
        this.alive = false;
        this.scene.remove(this.mesh);
        if (this.mesh.geometry) this.mesh.geometry.dispose();
        if (this.mesh.material) this.mesh.material.dispose();
    }
}

class CombatSystem {
    constructor(scene) {
        this.scene = scene;
        this.projectiles = [];
        this.powerUps = [];
        this.powerUpTimer = 0;
        this.powerUpInterval = 15; // seconds between power-up spawns
    }

    /** Fire a projectile from position in direction */
    shoot(position, direction, options = {}) {
        const proj = new Projectile(this.scene, position, direction, options);
        this.projectiles.push(proj);
        return proj;
    }

    /** Update all projectiles and check collisions */
    update(dt, player, enemies, arenaObstacles) {
        // Update projectiles
        for (let i = this.projectiles.length - 1; i >= 0; i--) {
            const p = this.projectiles[i];
            p.update(dt);

            if (!p.alive) {
                this.projectiles.splice(i, 1);
                continue;
            }

            // Check arena bounds
            const pos = p.mesh.position;
            if (Math.abs(pos.x) > 26 || Math.abs(pos.z) > 26) {
                p.destroy();
                this.projectiles.splice(i, 1);
                continue;
            }

            // Check obstacle collisions
            let hitObstacle = false;
            for (const obs of arenaObstacles) {
                if (this._checkBoxCollision(pos, p.radius, obs)) {
                    // Impact particles
                    if (particleSystem) {
                        particleSystem.emit(pos, {
                            count: 5, color: 0xaaaaaa, speed: 3, lifetime: 0.3
                        });
                    }
                    p.destroy();
                    this.projectiles.splice(i, 1);
                    hitObstacle = true;
                    break;
                }
            }
            if (hitObstacle) continue;

            // Player projectile vs enemies
            if (p.isPlayerProjectile) {
                for (const enemy of enemies) {
                    if (!enemy.alive) continue;
                    const dist = pos.distanceTo(enemy.mesh.position);
                    if (dist < enemy.radius + p.radius) {
                        enemy.takeDamage(p.damage);
                        // Hit effects
                        if (particleSystem) {
                            particleSystem.emit(pos, {
                                count: 10, color: 0xff6600, speed: 6, lifetime: 0.4, spread: 1.5
                            });
                        }
                        if (screenShake) screenShake.shake(0.15);
                        if (audioSystem) audioSystem.playHit();
                        // Show hit marker
                        this._showHitMarker();
                        p.destroy();
                        this.projectiles.splice(i, 1);
                        break;
                    }
                }
            }
            // Enemy projectile vs player
            else if (!p.isPlayerProjectile && player && player.alive && !player.invulnerable) {
                const dist = pos.distanceTo(player.mesh.position);
                if (dist < player.radius + p.radius) {
                    player.takeDamage(p.damage);
                    if (particleSystem) {
                        particleSystem.emit(pos, {
                            count: 12, color: 0xff2244, speed: 5, lifetime: 0.5
                        });
                    }
                    if (screenShake) screenShake.shake(0.3);
                    if (audioSystem) audioSystem.playDamage();
                    p.destroy();
                    this.projectiles.splice(i, 1);
                }
            }
        }

        // Power-up spawning
        this.powerUpTimer += dt;
        if (this.powerUpTimer >= this.powerUpInterval && this.powerUps.length < 3) {
            this.spawnPowerUp();
            this.powerUpTimer = 0;
        }

        // Update power-ups
        for (let i = this.powerUps.length - 1; i >= 0; i--) {
            const pu = this.powerUps[i];
            pu.update(dt);

            if (pu.expired) {
                pu.destroy();
                this.powerUps.splice(i, 1);
                continue;
            }

            // Check player pickup
            if (player && player.alive) {
                const dist = player.mesh.position.distanceTo(pu.mesh.position);
                if (dist < player.radius + pu.radius) {
                    pu.apply(player);
                    if (audioSystem) audioSystem.playPickup();
                    if (particleSystem) {
                        particleSystem.emit(pu.mesh.position, {
                            count: 15, color: pu.color, speed: 5, lifetime: 0.5, spread: 2
                        });
                    }
                    pu.destroy();
                    this.powerUps.splice(i, 1);
                }
            }
        }
    }

    /** Spawn a random power-up */
    spawnPowerUp() {
        const types = ['health', 'speed', 'damage'];
        const type = types[Math.floor(Math.random() * types.length)];
        const x = (Math.random() - 0.5) * 40;
        const z = (Math.random() - 0.5) * 40;
        const pu = new PowerUp(this.scene, new THREE.Vector3(x, 0.8, z), type);
        this.powerUps.push(pu);
    }

    /** Show brief hit marker on screen */
    _showHitMarker() {
        const el = document.getElementById('hit-marker');
        if (!el) return;
        el.classList.remove('hidden');
        clearTimeout(this._hitTimer);
        this._hitTimer = setTimeout(() => el.classList.add('hidden'), 200);
    }

    /** Simple AABB collision check */
    _checkBoxCollision(point, radius, obstacle) {
        const box = obstacle.userData.bounds;
        if (!box) return false;
        // Closest point on box to sphere center
        const cx = Math.max(box.min.x, Math.min(point.x, box.max.x));
        const cz = Math.max(box.min.z, Math.min(point.z, box.max.z));
        const dx = point.x - cx;
        const dz = point.z - cz;
        return (dx * dx + dz * dz) < (radius * radius);
    }

    /** Clean up everything */
    clear() {
        for (const p of this.projectiles) p.destroy();
        this.projectiles = [];
        for (const pu of this.powerUps) pu.destroy();
        this.powerUps = [];
        this.powerUpTimer = 0;
    }
}

/* ---- Power-Up ---- */
class PowerUp {
    constructor(scene, position, type) {
        this.scene = scene;
        this.type = type;
        this.radius = 0.6;
        this.lifetime = 20;
        this.age = 0;
        this.expired = false;

        const colorMap = {
            health: 0x00ff88,
            speed: 0xffcc00,
            damage: 0xff00aa
        };
        this.color = colorMap[type] || 0xffffff;

        // Outer ring
        const ringGeom = new THREE.TorusGeometry(0.5, 0.08, 8, 16);
        const ringMat = new THREE.MeshBasicMaterial({
            color: this.color,
            transparent: true,
            opacity: 0.7
        });
        this.mesh = new THREE.Mesh(ringGeom, ringMat);
        this.mesh.position.copy(position);
        this.mesh.rotation.x = Math.PI / 2;

        // Inner icon (simple geometry per type)
        let innerGeom;
        if (type === 'health') innerGeom = new THREE.OctahedronGeometry(0.25, 0);
        else if (type === 'speed') innerGeom = new THREE.ConeGeometry(0.2, 0.4, 4);
        else innerGeom = new THREE.BoxGeometry(0.3, 0.3, 0.3);

        const innerMat = new THREE.MeshBasicMaterial({ color: this.color });
        this.inner = new THREE.Mesh(innerGeom, innerMat);
        this.inner.rotation.x = -Math.PI / 2; // Undo parent rotation
        this.mesh.add(this.inner);

        // Point light
        this.light = new THREE.PointLight(this.color, 0.6, 5);
        this.mesh.add(this.light);

        scene.add(this.mesh);
    }

    update(dt) {
        this.age += dt;
        if (this.age >= this.lifetime) {
            this.expired = true;
            return;
        }
        // Hover and rotate
        this.mesh.position.y = 0.8 + Math.sin(this.age * 3) * 0.15;
        this.inner.rotation.y += dt * 2;
        this.inner.rotation.z += dt * 1.5;

        // Blink when about to expire
        if (this.age > this.lifetime - 5) {
            this.mesh.visible = Math.sin(this.age * 10) > 0;
        }
    }

    apply(player) {
        switch (this.type) {
            case 'health':
                player.health = Math.min(player.maxHealth, player.health + 30);
                break;
            case 'speed':
                player.speedBoostTimer = 5; // 5 seconds of speed
                break;
            case 'damage':
                player.damageBoostTimer = 5; // 5 seconds of extra damage
                break;
        }
    }

    destroy() {
        this.scene.remove(this.mesh);
    }
}
