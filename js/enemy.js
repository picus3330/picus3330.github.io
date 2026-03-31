/* ============================================================
   NEXUS STRIKE — Enemy AI System
   State-based AI, multiple enemy types, behavior patterns
   ============================================================ */

const ENEMY_STATES = { IDLE: 0, PATROL: 1, CHASE: 2, ATTACK: 3, STUNNED: 4 };

class Enemy {
    constructor(scene, position, type = 'grunt') {
        this.scene = scene;
        this.type = type;
        this.alive = true;
        this.state = ENEMY_STATES.PATROL;
        this.stateTimer = 0;
        this.radius = 0.6;

        // Type-specific stats
        const stats = Enemy.TYPES[type] || Enemy.TYPES.grunt;
        this.maxHealth = stats.health;
        this.health = stats.health;
        this.speed = stats.speed;
        this.damage = stats.damage;
        this.attackRange = stats.attackRange;
        this.attackCooldown = stats.attackCooldown;
        this.detectionRange = stats.detectionRange;
        this.scoreValue = stats.scoreValue;
        this.color = stats.color;
        this.scale = stats.scale || 1;

        this.attackTimer = 0;
        this.stunTimer = 0;
        this.patrolTarget = null;
        this.hitFlashTimer = 0;

        this._createMesh(position);
    }

    static TYPES = {
        grunt: {
            health: 40, speed: 4, damage: 10, attackRange: 12,
            attackCooldown: 1.5, detectionRange: 16, scoreValue: 100,
            color: 0xff2244, scale: 1
        },
        charger: {
            health: 60, speed: 6.5, damage: 20, attackRange: 2.5,
            attackCooldown: 2.0, detectionRange: 14, scoreValue: 150,
            color: 0xff8800, scale: 1.2
        },
        sniper: {
            health: 25, speed: 2.5, damage: 25, attackRange: 22,
            attackCooldown: 2.5, detectionRange: 24, scoreValue: 200,
            color: 0xaa00ff, scale: 0.9
        },
        tank: {
            health: 120, speed: 2.0, damage: 15, attackRange: 8,
            attackCooldown: 1.0, detectionRange: 12, scoreValue: 300,
            color: 0x00ff88, scale: 1.5
        }
    };

    _createMesh(position) {
        // Body — unique shape per type
        const group = new THREE.Group();

        let bodyGeom, bodyMat;
        bodyMat = new THREE.MeshStandardMaterial({
            color: this.color,
            roughness: 0.3,
            metalness: 0.7,
            emissive: this.color,
            emissiveIntensity: 0.2
        });

        switch (this.type) {
            case 'charger':
                // Wedge shape
                bodyGeom = new THREE.ConeGeometry(0.5, 1.2, 5);
                const body = new THREE.Mesh(bodyGeom, bodyMat);
                body.rotation.x = Math.PI / 2;
                body.position.y = 0.6;
                group.add(body);
                break;

            case 'sniper':
                // Tall thin shape
                bodyGeom = new THREE.CylinderGeometry(0.2, 0.35, 1.4, 6);
                const sniperBody = new THREE.Mesh(bodyGeom, bodyMat);
                sniperBody.position.y = 0.7;
                group.add(sniperBody);
                // Eye
                const eyeGeom = new THREE.SphereGeometry(0.15, 8, 8);
                const eyeMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
                const eye = new THREE.Mesh(eyeGeom, eyeMat);
                eye.position.set(0, 1.2, 0.2);
                group.add(eye);
                break;

            case 'tank':
                // Wide boxy shape
                bodyGeom = new THREE.BoxGeometry(1.0, 0.8, 1.0);
                const tankBody = new THREE.Mesh(bodyGeom, bodyMat);
                tankBody.position.y = 0.5;
                group.add(tankBody);
                // Top turret
                const turretGeom = new THREE.CylinderGeometry(0.3, 0.3, 0.4, 8);
                const turret = new THREE.Mesh(turretGeom, bodyMat);
                turret.position.y = 1.1;
                group.add(turret);
                break;

            default: // grunt
                bodyGeom = new THREE.DodecahedronGeometry(0.5, 0);
                const gruntBody = new THREE.Mesh(bodyGeom, bodyMat);
                gruntBody.position.y = 0.6;
                group.add(gruntBody);
                // Spikes
                for (let i = 0; i < 3; i++) {
                    const spike = new THREE.Mesh(
                        new THREE.ConeGeometry(0.1, 0.3, 4),
                        bodyMat
                    );
                    const angle = (i / 3) * Math.PI * 2;
                    spike.position.set(Math.cos(angle) * 0.4, 0.6, Math.sin(angle) * 0.4);
                    spike.lookAt(new THREE.Vector3(
                        Math.cos(angle) * 2, 0.6, Math.sin(angle) * 2
                    ));
                    group.add(spike);
                }
        }

        // Shadow circle on ground
        const shadowGeom = new THREE.CircleGeometry(0.4 * this.scale, 16);
        const shadowMat = new THREE.MeshBasicMaterial({
            color: 0x000000, transparent: true, opacity: 0.3
        });
        const shadow = new THREE.Mesh(shadowGeom, shadowMat);
        shadow.rotation.x = -Math.PI / 2;
        shadow.position.y = 0.02;
        group.add(shadow);

        group.scale.setScalar(this.scale);
        group.position.copy(position);
        group.position.y = 0;

        this.mesh = group;
        this.bodyMaterial = bodyMat;
        this.scene.add(this.mesh);
    }

    update(dt, playerPosition, combatSystem, obstacles) {
        if (!this.alive) return;

        this.stateTimer += dt;
        this.attackTimer += dt;
        this.hitFlashTimer -= dt;

        // Hit flash feedback
        if (this.hitFlashTimer > 0) {
            this.bodyMaterial.emissiveIntensity = 1.5;
        } else {
            this.bodyMaterial.emissiveIntensity = 0.2;
        }

        // Stun state
        if (this.state === ENEMY_STATES.STUNNED) {
            this.stunTimer -= dt;
            if (this.stunTimer <= 0) {
                this.state = ENEMY_STATES.CHASE;
                this.stateTimer = 0;
            }
            return;
        }

        const distToPlayer = this.mesh.position.distanceTo(playerPosition);
        const dirToPlayer = new THREE.Vector3()
            .subVectors(playerPosition, this.mesh.position)
            .setY(0)
            .normalize();

        // State machine
        switch (this.state) {
            case ENEMY_STATES.IDLE:
                if (distToPlayer < this.detectionRange) {
                    this.state = ENEMY_STATES.CHASE;
                    this.stateTimer = 0;
                } else if (this.stateTimer > 2) {
                    this.state = ENEMY_STATES.PATROL;
                    this.stateTimer = 0;
                    this._pickPatrolTarget();
                }
                break;

            case ENEMY_STATES.PATROL:
                if (distToPlayer < this.detectionRange) {
                    this.state = ENEMY_STATES.CHASE;
                    this.stateTimer = 0;
                } else {
                    this._moveToward(this.patrolTarget, dt, obstacles);
                    if (!this.patrolTarget || this.mesh.position.distanceTo(this.patrolTarget) < 1) {
                        this.state = ENEMY_STATES.IDLE;
                        this.stateTimer = 0;
                    }
                }
                break;

            case ENEMY_STATES.CHASE:
                if (distToPlayer > this.detectionRange * 1.5) {
                    this.state = ENEMY_STATES.PATROL;
                    this.stateTimer = 0;
                    this._pickPatrolTarget();
                } else if (distToPlayer <= this.attackRange) {
                    this.state = ENEMY_STATES.ATTACK;
                    this.stateTimer = 0;
                } else {
                    this._moveToward(playerPosition, dt, obstacles);
                    this._faceDirection(dirToPlayer, dt);
                }
                break;

            case ENEMY_STATES.ATTACK:
                if (distToPlayer > this.attackRange * 1.2) {
                    this.state = ENEMY_STATES.CHASE;
                    this.stateTimer = 0;
                } else {
                    this._faceDirection(dirToPlayer, dt);

                    // Type-specific attack behavior
                    if (this.type === 'charger') {
                        // Charge at player
                        this._moveToward(playerPosition, dt, obstacles, 1.5);
                    } else if (distToPlayer > this.attackRange * 0.4 && this.type !== 'sniper') {
                        // Strafe while attacking
                        const strafeDir = new THREE.Vector3(-dirToPlayer.z, 0, dirToPlayer.x);
                        if (Math.sin(this.stateTimer * 2) > 0) strafeDir.negate();
                        this._moveToward(
                            this.mesh.position.clone().add(strafeDir.multiplyScalar(3)),
                            dt, obstacles, 0.5
                        );
                    }

                    // Fire
                    if (this.attackTimer >= this.attackCooldown) {
                        this._attack(dirToPlayer, combatSystem);
                        this.attackTimer = 0;
                    }
                }
                break;
        }

        // Gentle hover animation
        const baseY = 0;
        this.mesh.position.y = baseY + Math.sin(Date.now() * 0.003 + this.mesh.id) * 0.05;
    }

    _moveToward(target, dt, obstacles, speedMult = 1) {
        if (!target) return;
        const dir = new THREE.Vector3()
            .subVectors(target, this.mesh.position)
            .setY(0);

        if (dir.length() < 0.3) return;
        dir.normalize();

        const movement = dir.multiplyScalar(this.speed * speedMult * dt);
        const newPos = this.mesh.position.clone().add(movement);

        // Arena bounds
        newPos.x = Math.max(-24, Math.min(24, newPos.x));
        newPos.z = Math.max(-24, Math.min(24, newPos.z));

        // Simple obstacle avoidance
        let blocked = false;
        for (const obs of obstacles) {
            const box = obs.userData.bounds;
            if (!box) continue;
            const margin = this.radius * this.scale + 0.3;
            if (newPos.x > box.min.x - margin && newPos.x < box.max.x + margin &&
                newPos.z > box.min.z - margin && newPos.z < box.max.z + margin) {
                blocked = true;
                // Try to slide around
                const slideX = this.mesh.position.clone();
                slideX.x += movement.x;
                const slideZ = this.mesh.position.clone();
                slideZ.z += movement.z;

                if (!(slideX.x > box.min.x - margin && slideX.x < box.max.x + margin &&
                      slideX.z > box.min.z - margin && slideX.z < box.max.z + margin)) {
                    newPos.copy(slideX);
                    blocked = false;
                } else if (!(slideZ.x > box.min.x - margin && slideZ.x < box.max.x + margin &&
                             slideZ.z > box.min.z - margin && slideZ.z < box.max.z + margin)) {
                    newPos.copy(slideZ);
                    blocked = false;
                }
                break;
            }
        }

        if (!blocked) {
            this.mesh.position.x = newPos.x;
            this.mesh.position.z = newPos.z;
        }

        this._faceDirection(dir.normalize(), dt);
    }

    _faceDirection(dir, dt) {
        const targetAngle = Math.atan2(dir.x, dir.z);
        const currentAngle = this.mesh.rotation.y;
        let diff = targetAngle - currentAngle;
        // Normalize angle
        while (diff > Math.PI) diff -= Math.PI * 2;
        while (diff < -Math.PI) diff += Math.PI * 2;
        this.mesh.rotation.y += diff * Math.min(1, 8 * dt);
    }

    _attack(direction, combatSystem) {
        if (!combatSystem) return;
        const spawnPos = this.mesh.position.clone();
        spawnPos.y = 0.6 * this.scale;
        spawnPos.addScaledVector(direction, 0.8);

        combatSystem.shoot(spawnPos, direction, {
            isPlayer: false,
            damage: this.damage,
            speed: this.type === 'sniper' ? 22 : 16,
            lifetime: 2.5
        });
    }

    _pickPatrolTarget() {
        const range = 8;
        this.patrolTarget = new THREE.Vector3(
            this.mesh.position.x + (Math.random() - 0.5) * range * 2,
            0,
            this.mesh.position.z + (Math.random() - 0.5) * range * 2
        );
        // Clamp to arena
        this.patrolTarget.x = Math.max(-22, Math.min(22, this.patrolTarget.x));
        this.patrolTarget.z = Math.max(-22, Math.min(22, this.patrolTarget.z));
    }

    takeDamage(amount) {
        if (!this.alive) return;
        this.health -= amount;
        this.hitFlashTimer = 0.1;

        // Knockback stun
        this.state = ENEMY_STATES.STUNNED;
        this.stunTimer = 0.15;

        if (this.health <= 0) {
            this.die();
        }
    }

    die() {
        this.alive = false;
        // Death explosion particles
        if (particleSystem) {
            particleSystem.emit(this.mesh.position, {
                count: 20, color: this.color, speed: 8,
                lifetime: 0.6, spread: 2
            });
            particleSystem.emit(this.mesh.position, {
                count: 10, color: 0xffffff, speed: 5,
                lifetime: 0.4, spread: 1
            });
        }
        if (audioSystem) audioSystem.playEnemyDeath();
        this.scene.remove(this.mesh);
    }

    destroy() {
        this.alive = false;
        this.scene.remove(this.mesh);
    }
}
