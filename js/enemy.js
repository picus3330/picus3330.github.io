/* ============================================================
   NEXUS STRIKE — Enemy AI (OPTIMIZED)
   
   PERF: Shared material cache per type, simpler geometry,
   squared distance checks (no sqrt), reduced per-frame alloc.
   ============================================================ */

const ENEMY_STATES = { IDLE: 0, PATROL: 1, CHASE: 2, ATTACK: 3, STUNNED: 4 };

// Material cache — one material per enemy type, reused by all instances
const _enemyMats = {};
function _getEnemyMat(color) {
    if (_enemyMats[color]) return _enemyMats[color];
    _enemyMats[color] = new THREE.MeshStandardMaterial({
        color, roughness: .3, metalness: .7, emissive: color, emissiveIntensity: .2
    });
    return _enemyMats[color];
}

// Shared geometries
const _enemyGeoms = {
    grunt:   new THREE.DodecahedronGeometry(.5, 0),
    charger: new THREE.ConeGeometry(.5, 1.2, 5),
    sniper:  new THREE.CylinderGeometry(.2, .35, 1.4, 6),
    tank:    new THREE.BoxGeometry(1, .8, 1)
};

class Enemy {
    constructor(scene, position, type) {
        this.scene = scene;
        this.type = type || 'grunt';
        this.alive = true;
        this.state = ENEMY_STATES.PATROL;
        this.stateTimer = 0;
        this.radius = .6;

        const s = Enemy.TYPES[this.type] || Enemy.TYPES.grunt;
        this.maxHealth = s.health; this.health = s.health;
        this.speed = s.speed; this.damage = s.damage;
        this.attackRange = s.attackRange; this.attackCooldown = s.attackCooldown;
        this.detectionRange = s.detectionRange; this.scoreValue = s.scoreValue;
        this.color = s.color; this.scale = s.scale || 1;

        this.attackTimer = 0; this.stunTimer = 0;
        this.patrolTarget = null; this.hitFlashTimer = 0;

        this._buildMesh(position);
        // Reusable vectors to avoid per-frame allocation
        this._dir = new THREE.Vector3();
        this._newPos = new THREE.Vector3();
    }

    static TYPES = {
        grunt:   { health:40,  speed:4,   damage:10, attackRange:12, attackCooldown:1.5, detectionRange:16, scoreValue:100, color:0xff2244, scale:1 },
        charger: { health:60,  speed:6.5, damage:20, attackRange:2.5,attackCooldown:2,   detectionRange:14, scoreValue:150, color:0xff8800, scale:1.2 },
        sniper:  { health:25,  speed:2.5, damage:25, attackRange:22, attackCooldown:2.5, detectionRange:24, scoreValue:200, color:0xaa00ff, scale:.9 },
        tank:    { health:120, speed:2,   damage:15, attackRange:8,  attackCooldown:1,   detectionRange:12, scoreValue:300, color:0x00ff88, scale:1.5 }
    };

    _buildMesh(position) {
        const group = new THREE.Group();
        const mat = _getEnemyMat(this.color);
        this.bodyMaterial = mat;

        const geom = _enemyGeoms[this.type] || _enemyGeoms.grunt;
        const body = new THREE.Mesh(geom, mat);
        if (this.type === 'charger') { body.rotation.x = Math.PI/2; body.position.y = .6; }
        else if (this.type === 'tank') { body.position.y = .5; }
        else { body.position.y = .6; }
        group.add(body);

        // Simple shadow disc
        const shadow = new THREE.Mesh(
            new THREE.CircleGeometry(.4 * this.scale, 8),
            new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: .25 })
        );
        shadow.rotation.x = -Math.PI / 2; shadow.position.y = .02;
        group.add(shadow);

        group.scale.setScalar(this.scale);
        group.position.copy(position); group.position.y = 0;
        this.mesh = group;
        scene.add(group);
    }

    update(dt, playerPos, combat, obstacles) {
        if (!this.alive) return;

        this.stateTimer += dt;
        this.attackTimer += dt;

        // Hit flash
        if (this.hitFlashTimer > 0) { this.hitFlashTimer -= dt; this.bodyMaterial.emissiveIntensity = 1.5; }
        else { this.bodyMaterial.emissiveIntensity = .2; }

        if (this.state === ENEMY_STATES.STUNNED) {
            this.stunTimer -= dt;
            if (this.stunTimer <= 0) { this.state = ENEMY_STATES.CHASE; this.stateTimer = 0; }
            return;
        }

        // Squared distance (avoid sqrt)
        const dx = playerPos.x - this.mesh.position.x;
        const dz = playerPos.z - this.mesh.position.z;
        const distSq = dx * dx + dz * dz;
        this._dir.set(dx, 0, dz);
        const dist = Math.sqrt(distSq); // only one sqrt per enemy per frame
        if (dist > .01) { this._dir.x /= dist; this._dir.z /= dist; }

        const detSq = this.detectionRange * this.detectionRange;
        const atkSq = this.attackRange * this.attackRange;

        switch (this.state) {
            case ENEMY_STATES.IDLE:
                if (distSq < detSq) { this.state = ENEMY_STATES.CHASE; this.stateTimer = 0; }
                else if (this.stateTimer > 2) { this.state = ENEMY_STATES.PATROL; this.stateTimer = 0; this._pickPatrol(); }
                break;
            case ENEMY_STATES.PATROL:
                if (distSq < detSq) { this.state = ENEMY_STATES.CHASE; this.stateTimer = 0; }
                else {
                    this._moveToward(this.patrolTarget, dt, obstacles);
                    if (!this.patrolTarget || this._distSqTo(this.patrolTarget) < 1) { this.state = ENEMY_STATES.IDLE; this.stateTimer = 0; }
                }
                break;
            case ENEMY_STATES.CHASE:
                if (distSq > detSq * 2.25) { this.state = ENEMY_STATES.PATROL; this.stateTimer = 0; this._pickPatrol(); }
                else if (distSq <= atkSq) { this.state = ENEMY_STATES.ATTACK; this.stateTimer = 0; }
                else { this._moveToward(playerPos, dt, obstacles); this._face(this._dir, dt); }
                break;
            case ENEMY_STATES.ATTACK:
                if (distSq > atkSq * 1.44) { this.state = ENEMY_STATES.CHASE; this.stateTimer = 0; }
                else {
                    this._face(this._dir, dt);
                    if (this.type === 'charger') this._moveToward(playerPos, dt, obstacles, 1.5);
                    if (this.attackTimer >= this.attackCooldown) {
                        this._attack(this._dir, combat);
                        this.attackTimer = 0;
                    }
                }
                break;
        }

        // Gentle hover
        this.mesh.position.y = Math.sin(Date.now() * .003 + this.mesh.id) * .04;
    }

    _moveToward(target, dt, obstacles, mult) {
        if (!target) return;
        const mx = target.x - this.mesh.position.x;
        const mz = target.z - this.mesh.position.z;
        const ml = Math.sqrt(mx*mx + mz*mz);
        if (ml < .3) return;
        const s = this.speed * (mult || 1) * dt / ml;
        this._newPos.x = this.mesh.position.x + mx * s;
        this._newPos.z = this.mesh.position.z + mz * s;
        // Clamp
        this._newPos.x = Math.max(-24, Math.min(24, this._newPos.x));
        this._newPos.z = Math.max(-24, Math.min(24, this._newPos.z));
        // Obstacle avoidance
        const margin = this.radius * this.scale + .3;
        for (let i = 0; i < obstacles.length; i++) {
            const b = obstacles[i].userData.bounds;
            if (!b) continue;
            if (this._newPos.x > b.min.x - margin && this._newPos.x < b.max.x + margin &&
                this._newPos.z > b.min.z - margin && this._newPos.z < b.max.z + margin) {
                // Try slide X only
                const sx = this.mesh.position.x + mx * s;
                if (!(sx > b.min.x - margin && sx < b.max.x + margin &&
                      this.mesh.position.z > b.min.z - margin && this.mesh.position.z < b.max.z + margin)) {
                    this._newPos.x = sx; this._newPos.z = this.mesh.position.z;
                } else {
                    const sz = this.mesh.position.z + mz * s;
                    if (!(this.mesh.position.x > b.min.x - margin && this.mesh.position.x < b.max.x + margin &&
                          sz > b.min.z - margin && sz < b.max.z + margin)) {
                        this._newPos.x = this.mesh.position.x; this._newPos.z = sz;
                    } else return; // fully blocked
                }
                break;
            }
        }
        this.mesh.position.x = this._newPos.x;
        this.mesh.position.z = this._newPos.z;
        this._face({ x: mx / ml, z: mz / ml }, dt);
    }

    _face(dir, dt) {
        const target = Math.atan2(dir.x, dir.z);
        let diff = target - this.mesh.rotation.y;
        if (diff > Math.PI) diff -= Math.PI * 2;
        if (diff < -Math.PI) diff += Math.PI * 2;
        this.mesh.rotation.y += diff * Math.min(1, 8 * dt);
    }

    _attack(dir, combat) {
        if (!combat) return;
        const sp = this.mesh.position.clone();
        sp.y = .6 * this.scale;
        sp.x += dir.x * .8; sp.z += dir.z * .8;
        combat.shoot(sp, dir, {
            isPlayer: false, damage: this.damage,
            speed: this.type === 'sniper' ? 20 : 14,
            lifetime: 2.5
        });
    }

    _pickPatrol() {
        this.patrolTarget = new THREE.Vector3(
            Math.max(-22, Math.min(22, this.mesh.position.x + (Math.random() - .5) * 16)),
            0,
            Math.max(-22, Math.min(22, this.mesh.position.z + (Math.random() - .5) * 16))
        );
    }

    _distSqTo(v) {
        const dx = this.mesh.position.x - v.x, dz = this.mesh.position.z - v.z;
        return dx*dx + dz*dz;
    }

    takeDamage(amount) {
        if (!this.alive) return;
        this.health -= amount;
        this.hitFlashTimer = .1;
        this.state = ENEMY_STATES.STUNNED;
        this.stunTimer = .12;
        if (this.health <= 0) this.die();
    }

    die() {
        this.alive = false;
        if (particleSystem) {
            particleSystem.emit(this.mesh.position, { count: 14, color: this.color, speed: 6, lifetime: .5, spread: 1.5 });
            particleSystem.emit(this.mesh.position, { count: 6, color: 0xffffff, speed: 3, lifetime: .3 });
        }
        if (audioSystem) audioSystem.playEnemyDeath();
        this.scene.remove(this.mesh);
    }

    destroy() { this.alive = false; this.scene.remove(this.mesh); }
}
