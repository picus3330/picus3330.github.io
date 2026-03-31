/* ============================================================
   NEXUS STRIKE — Player System
   Movement, dash, health, shooting, invulnerability, boosts
   ============================================================ */

class Player {
    constructor(scene, camera) {
        this.scene = scene;
        this.camera = camera;
        this.alive = true;
        this.radius = 0.5;

        // Health
        this.maxHealth = 100;
        this.health = 100;

        // Movement
        this.baseSpeed = 9;
        this.speed = this.baseSpeed;
        this.velocity = new THREE.Vector3();
        this.acceleration = 40;
        this.friction = 12;
        this.position = new THREE.Vector3(0, 0, 0);

        // Dash
        this.dashSpeed = 28;
        this.dashDuration = 0.15;
        this.dashCooldown = 2.0;
        this.dashTimer = 0;       // Time left in dash
        this.dashCooldownTimer = 0;
        this.isDashing = false;
        this.dashDirection = new THREE.Vector3();

        // Shooting
        this.shootCooldown = 0.2;
        this.shootTimer = 0;
        this.baseDamage = 20;

        // Invulnerability
        this.invulnerable = false;
        this.invulTimer = 0;
        this.invulDuration = 2.0;

        // Boosts
        this.speedBoostTimer = 0;
        this.damageBoostTimer = 0;

        // Input state
        this.input = { w: false, a: false, s: false, d: false, shoot: false, dash: false };
        this.mouseWorld = new THREE.Vector3();

        this._createMesh();
        this._setupInput();
    }

    _createMesh() {
        this.mesh = new THREE.Group();

        // Main body — angular hero shape
        const bodyGeom = new THREE.CylinderGeometry(0.3, 0.45, 0.9, 8);
        const bodyMat = new THREE.MeshStandardMaterial({
            color: 0x00ccff,
            roughness: 0.2,
            metalness: 0.8,
            emissive: 0x00ccff,
            emissiveIntensity: 0.3
        });
        this.body = new THREE.Mesh(bodyGeom, bodyMat);
        this.body.position.y = 0.5;
        this.bodyMaterial = bodyMat;
        this.mesh.add(this.body);

        // Head/visor
        const headGeom = new THREE.SphereGeometry(0.22, 8, 8);
        const headMat = new THREE.MeshStandardMaterial({
            color: 0x00f0ff,
            roughness: 0.1,
            metalness: 1.0,
            emissive: 0x00f0ff,
            emissiveIntensity: 0.5
        });
        this.head = new THREE.Mesh(headGeom, headMat);
        this.head.position.y = 1.1;
        this.mesh.add(this.head);

        // Gun barrel
        const gunGeom = new THREE.CylinderGeometry(0.05, 0.05, 0.5, 6);
        gunGeom.rotateX(Math.PI / 2);
        const gunMat = new THREE.MeshStandardMaterial({
            color: 0x334455,
            roughness: 0.3,
            metalness: 0.9
        });
        this.gun = new THREE.Mesh(gunGeom, gunMat);
        this.gun.position.set(0.3, 0.7, 0.3);
        this.mesh.add(this.gun);

        // Subtle point light on player
        const light = new THREE.PointLight(0x00ccff, 0.5, 6);
        light.position.y = 1;
        this.mesh.add(light);
        this.playerLight = light;

        // Ground shadow
        const shadowGeom = new THREE.CircleGeometry(0.45, 16);
        const shadowMat = new THREE.MeshBasicMaterial({
            color: 0x000000, transparent: true, opacity: 0.35
        });
        const shadow = new THREE.Mesh(shadowGeom, shadowMat);
        shadow.rotation.x = -Math.PI / 2;
        shadow.position.y = 0.02;
        this.mesh.add(shadow);

        this.scene.add(this.mesh);
    }

    _setupInput() {
        // Keyboard
        window.addEventListener('keydown', (e) => {
            switch (e.code) {
                case 'KeyW': this.input.w = true; break;
                case 'KeyA': this.input.a = true; break;
                case 'KeyS': this.input.s = true; break;
                case 'KeyD': this.input.d = true; break;
                case 'Space':
                    e.preventDefault();
                    this.input.dash = true;
                    break;
            }
        });
        window.addEventListener('keyup', (e) => {
            switch (e.code) {
                case 'KeyW': this.input.w = false; break;
                case 'KeyA': this.input.a = false; break;
                case 'KeyS': this.input.s = false; break;
                case 'KeyD': this.input.d = false; break;
                case 'Space': this.input.dash = false; break;
            }
        });

        // Mouse
        window.addEventListener('mousedown', (e) => {
            if (e.button === 0) this.input.shoot = true;
        });
        window.addEventListener('mouseup', (e) => {
            if (e.button === 0) this.input.shoot = false;
        });

        // Track mouse position for aiming (using raycaster in update)
        this._mouseNDC = new THREE.Vector2();
        this._raycaster = new THREE.Raycaster();
        this._groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);

        window.addEventListener('mousemove', (e) => {
            this._mouseNDC.x = (e.clientX / window.innerWidth) * 2 - 1;
            this._mouseNDC.y = -(e.clientY / window.innerHeight) * 2 + 1;
            // Update crosshair position
            const crosshair = document.getElementById('crosshair');
            if (crosshair) {
                crosshair.style.left = e.clientX + 'px';
                crosshair.style.top = e.clientY + 'px';
            }
        });
    }

    update(dt, combatSystem, obstacles) {
        if (!this.alive) return;

        this.shootTimer += dt;
        this.dashCooldownTimer -= dt;

        // Boosts
        if (this.speedBoostTimer > 0) {
            this.speedBoostTimer -= dt;
            this.speed = this.baseSpeed * 1.5;
        } else {
            this.speed = this.baseSpeed;
        }
        if (this.damageBoostTimer > 0) {
            this.damageBoostTimer -= dt;
        }

        // Invulnerability
        if (this.invulnerable) {
            this.invulTimer -= dt;
            if (this.invulTimer <= 0) {
                this.invulnerable = false;
            }
            // Blink effect
            this.mesh.visible = Math.sin(this.invulTimer * 20) > 0;
        } else {
            this.mesh.visible = true;
        }

        // Aim toward mouse
        this._raycaster.setFromCamera(this._mouseNDC, this.camera);
        const intersectPoint = new THREE.Vector3();
        this._raycaster.ray.intersectPlane(this._groundPlane, intersectPoint);
        if (intersectPoint) {
            this.mouseWorld.copy(intersectPoint);
            // Smooth rotation toward aim
            const aimDir = new THREE.Vector3()
                .subVectors(intersectPoint, this.mesh.position)
                .setY(0);
            if (aimDir.length() > 0.1) {
                const targetAngle = Math.atan2(aimDir.x, aimDir.z);
                let diff = targetAngle - this.mesh.rotation.y;
                while (diff > Math.PI) diff -= Math.PI * 2;
                while (diff < -Math.PI) diff += Math.PI * 2;
                this.mesh.rotation.y += diff * Math.min(1, 15 * dt);
            }
        }

        // Dash
        if (this.input.dash && this.dashCooldownTimer <= 0 && !this.isDashing) {
            this.isDashing = true;
            this.dashTimer = this.dashDuration;
            this.dashCooldownTimer = this.dashCooldown;
            // Dash in movement direction, or facing direction
            const moveDir = this._getMoveDirection();
            this.dashDirection = moveDir.length() > 0 ? moveDir.normalize() : new THREE.Vector3(
                Math.sin(this.mesh.rotation.y), 0, Math.cos(this.mesh.rotation.y)
            );
            if (audioSystem) audioSystem.playDash();
            // Dash trail
            if (particleSystem) {
                particleSystem.emit(this.mesh.position, {
                    count: 12, color: 0x00f0ff, speed: 3,
                    lifetime: 0.3, spread: 0.5, gravity: 0
                });
            }
        }

        if (this.isDashing) {
            this.dashTimer -= dt;
            if (this.dashTimer <= 0) {
                this.isDashing = false;
            }
            // Apply dash velocity
            this.velocity.copy(this.dashDirection.clone().multiplyScalar(this.dashSpeed));
        } else {
            // Normal movement
            const moveDir = this._getMoveDirection();
            if (moveDir.length() > 0) {
                moveDir.normalize();
                // Accelerate
                this.velocity.x += moveDir.x * this.acceleration * dt;
                this.velocity.z += moveDir.z * this.acceleration * dt;
            }
            // Apply friction
            this.velocity.x *= Math.max(0, 1 - this.friction * dt);
            this.velocity.z *= Math.max(0, 1 - this.friction * dt);
            // Clamp to max speed
            const hSpeed = Math.sqrt(this.velocity.x ** 2 + this.velocity.z ** 2);
            if (hSpeed > this.speed) {
                const scale = this.speed / hSpeed;
                this.velocity.x *= scale;
                this.velocity.z *= scale;
            }
        }

        // Apply velocity
        const newPos = this.mesh.position.clone();
        newPos.x += this.velocity.x * dt;
        newPos.z += this.velocity.z * dt;

        // Arena bounds
        newPos.x = Math.max(-24, Math.min(24, newPos.x));
        newPos.z = Math.max(-24, Math.min(24, newPos.z));

        // Obstacle collision
        for (const obs of obstacles) {
            const box = obs.userData.bounds;
            if (!box) continue;
            const margin = this.radius + 0.1;
            if (newPos.x > box.min.x - margin && newPos.x < box.max.x + margin &&
                newPos.z > box.min.z - margin && newPos.z < box.max.z + margin) {
                // Push out
                const dx1 = newPos.x - (box.min.x - margin);
                const dx2 = (box.max.x + margin) - newPos.x;
                const dz1 = newPos.z - (box.min.z - margin);
                const dz2 = (box.max.z + margin) - newPos.z;
                const minD = Math.min(dx1, dx2, dz1, dz2);
                if (minD === dx1) { newPos.x = box.min.x - margin; this.velocity.x = 0; }
                else if (minD === dx2) { newPos.x = box.max.x + margin; this.velocity.x = 0; }
                else if (minD === dz1) { newPos.z = box.min.z - margin; this.velocity.z = 0; }
                else { newPos.z = box.max.z + margin; this.velocity.z = 0; }
            }
        }

        this.mesh.position.x = newPos.x;
        this.mesh.position.z = newPos.z;
        this.position.copy(this.mesh.position);

        // Shooting
        if (this.input.shoot && this.shootTimer >= this.shootCooldown) {
            this._shoot(combatSystem);
            this.shootTimer = 0;
        }

        // Body tilt based on velocity
        const tiltX = -this.velocity.z * 0.015;
        const tiltZ = this.velocity.x * 0.015;
        this.body.rotation.x += (tiltX - this.body.rotation.x) * 0.1;
        this.body.rotation.z += (tiltZ - this.body.rotation.z) * 0.1;

        // Boost visual
        if (this.speedBoostTimer > 0 || this.damageBoostTimer > 0) {
            this.playerLight.intensity = 1.0 + Math.sin(Date.now() * 0.01) * 0.3;
            this.playerLight.color.setHex(this.damageBoostTimer > 0 ? 0xff00aa : 0xffcc00);
        } else {
            this.playerLight.intensity = 0.5;
            this.playerLight.color.setHex(0x00ccff);
        }
    }

    _getMoveDirection() {
        const dir = new THREE.Vector3();
        if (this.input.w) dir.z -= 1;
        if (this.input.s) dir.z += 1;
        if (this.input.a) dir.x -= 1;
        if (this.input.d) dir.x += 1;
        return dir;
    }

    _shoot(combatSystem) {
        if (!combatSystem) return;
        const aimDir = new THREE.Vector3()
            .subVectors(this.mouseWorld, this.mesh.position)
            .setY(0)
            .normalize();

        const spawnPos = this.mesh.position.clone();
        spawnPos.y = 0.7;
        spawnPos.addScaledVector(aimDir, 0.7);

        const dmg = this.damageBoostTimer > 0 ? this.baseDamage * 1.5 : this.baseDamage;

        combatSystem.shoot(spawnPos, aimDir, {
            isPlayer: true,
            damage: dmg,
            speed: 30,
            lifetime: 2.0
        });

        if (audioSystem) audioSystem.playShoot();

        // Muzzle flash particles
        if (particleSystem) {
            particleSystem.emit(spawnPos, {
                count: 3, color: 0x00f0ff, speed: 4,
                lifetime: 0.15, spread: 0.3, gravity: 0
            });
        }
    }

    takeDamage(amount) {
        if (this.invulnerable || !this.alive) return;
        this.health -= amount;

        // Damage vignette
        const vignette = document.getElementById('damage-vignette');
        if (vignette) {
            vignette.classList.add('active');
            setTimeout(() => vignette.classList.remove('active'), 200);
        }

        if (this.health <= 0) {
            this.health = 0;
            this.die();
        }
    }

    die() {
        this.alive = false;
        if (particleSystem) {
            particleSystem.emit(this.mesh.position, {
                count: 30, color: 0x00f0ff, speed: 10,
                lifetime: 0.8, spread: 2
            });
        }
        if (audioSystem) audioSystem.playExplosion();
        if (screenShake) screenShake.shake(0.5);
        this.mesh.visible = false;
    }

    respawn() {
        this.alive = true;
        this.health = this.maxHealth;
        this.mesh.position.set(0, 0, 0);
        this.velocity.set(0, 0, 0);
        this.mesh.visible = true;
        this.invulnerable = true;
        this.invulTimer = this.invulDuration;
        this.speedBoostTimer = 0;
        this.damageBoostTimer = 0;
    }

    destroy() {
        this.scene.remove(this.mesh);
    }
}
