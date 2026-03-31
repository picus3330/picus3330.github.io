import * as THREE from 'three';

export class Player {
    constructor(scene, gameManager) {
        this.scene = scene;
        this.gameManager = gameManager;
        
        // Stats
        this.maxHealth = 100;
        this.health = this.maxHealth;
        this.speed = 10;
        this.radius = 0.5;
        
        // Abilities
        this.isDashing = false;
        this.dashCooldown = 2.0; // seconds
        this.dashTimer = 0;
        this.dashSpeedMultiplier = 3.5;
        this.dashDuration = 0.15;
        this.currentDashTime = 0;
        
        this.shootCooldown = 0.15;
        this.shootTimer = 0;

        // Visuals
        this.mesh = new THREE.Group();
        
        // Body
        const bodyGeo = new THREE.CylinderGeometry(0.5, 0.5, 1, 16);
        const bodyMat = new THREE.MeshStandardMaterial({ color: 0x00ffff, roughness: 0.2, metalness: 0.8 });
        this.bodyMesh = new THREE.Mesh(bodyGeo, bodyMat);
        this.bodyMesh.position.y = 0.5;
        this.bodyMesh.castShadow = true;
        this.mesh.add(this.bodyMesh);

        // "Cannon" indicator for direction
        const cannonGeo = new THREE.BoxGeometry(0.2, 0.2, 0.8);
        const cannonMat = new THREE.MeshStandardMaterial({ color: 0xffffff });
        this.cannon = new THREE.Mesh(cannonGeo, cannonMat);
        this.cannon.position.set(0, 0.6, 0.5);
        this.mesh.add(this.cannon);

        this.scene.add(this.mesh);
    }

    update(dt, input) {
        // Timers
        if (this.dashTimer > 0) {
            this.dashTimer -= dt;
            if (this.dashTimer <= 0) this.gameManager.ui.updateDash(true);
        }
        if (this.shootTimer > 0) this.shootTimer -= dt;

        // Movement Logic
        let currentSpeed = this.speed;

        if (input.keys['Space'] && this.dashTimer <= 0 && !this.isDashing) {
            this.isDashing = true;
            this.currentDashTime = this.dashDuration;
            this.dashTimer = this.dashCooldown;
            this.gameManager.ui.updateDash(false);
        }

        if (this.isDashing) {
            currentSpeed *= this.dashSpeedMultiplier;
            this.currentDashTime -= dt;
            if (this.currentDashTime <= 0) this.isDashing = false;
        }

        const moveDir = new THREE.Vector3(0, 0, 0);
        if (input.keys['KeyW']) moveDir.z -= 1;
        if (input.keys['KeyS']) moveDir.z += 1;
        if (input.keys['KeyA']) moveDir.x -= 1;
        if (input.keys['KeyD']) moveDir.x += 1;

        if (moveDir.lengthSq() > 0) {
            moveDir.normalize();
            this.mesh.position.addScaledVector(moveDir, currentSpeed * dt);
        }

        // Keep inside arena bounds
        const bound = 19;
        this.mesh.position.x = THREE.MathUtils.clamp(this.mesh.position.x, -bound, bound);
        this.mesh.position.z = THREE.MathUtils.clamp(this.mesh.position.z, -bound, bound);

        // Aiming
        if (input.mousePos) {
            this.mesh.lookAt(input.mousePos.x, this.mesh.position.y, input.mousePos.z);
        }

        // Shooting
        if (input.isMouseDown && this.shootTimer <= 0) {
            this.shoot();
        }
    }

    shoot() {
        this.shootTimer = this.shootCooldown;
        const dir = new THREE.Vector3(0, 0, 1).applyQuaternion(this.mesh.quaternion);
        this.gameManager.spawnProjectile(this.mesh.position.clone().setY(0.6), dir, true);
    }

    takeDamage(amount) {
        if (this.isDashing) return; // i-frames during dash
        this.health -= amount;
        this.gameManager.ui.updateHealth(this.health, this.maxHealth);
        
        // Damage feedback flash
        this.bodyMesh.material.color.setHex(0xff0000);
        setTimeout(() => {
            if (this.bodyMesh) this.bodyMesh.material.color.setHex(0x00ffff);
        }, 100);

        if (this.health <= 0) {
            this.gameManager.gameOver();
        }
    }
}
