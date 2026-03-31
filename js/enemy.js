import * as THREE from 'three';

export class Enemy {
    constructor(scene, position, player) {
        this.scene = scene;
        this.player = player;
        this.active = true;
        
        this.health = 30;
        this.speed = 4;
        this.radius = 0.5;
        this.attackRange = 1.5;
        this.damage = 10;
        this.attackCooldown = 1.0;
        this.attackTimer = 0;

        const geo = new THREE.BoxGeometry(1, 1, 1);
        const mat = new THREE.MeshStandardMaterial({ color: 0xff00ff, roughness: 0.5 });
        this.mesh = new THREE.Mesh(geo, mat);
        this.mesh.position.copy(position);
        this.mesh.position.y = 0.5;
        this.mesh.castShadow = true;
        
        this.scene.add(this.mesh);
    }

    update(dt) {
        if (!this.active || !this.player) return;

        if (this.attackTimer > 0) this.attackTimer -= dt;

        const distToPlayer = this.mesh.position.distanceTo(this.player.mesh.position);

        if (distToPlayer > this.attackRange) {
            // Chase State
            const dir = new THREE.Vector3().subVectors(this.player.mesh.position, this.mesh.position);
            dir.y = 0;
            dir.normalize();
            this.mesh.position.addScaledVector(dir, this.speed * dt);
            this.mesh.lookAt(this.player.mesh.position);
        } else {
            // Attack State
            if (this.attackTimer <= 0) {
                this.player.takeDamage(this.damage);
                this.attackTimer = this.attackCooldown;
                
                // Knockback self slightly
                const knockback = new THREE.Vector3().subVectors(this.mesh.position, this.player.mesh.position).normalize();
                this.mesh.position.addScaledVector(knockback, 2);
            }
        }
    }

    takeDamage(amount) {
        this.health -= amount;
        this.mesh.material.color.setHex(0xffffff);
        setTimeout(() => {
            if (this.active) this.mesh.material.color.setHex(0xff00ff);
        }, 50);

        if (this.health <= 0) {
            this.die();
        }
    }

    die() {
        this.active = false;
        this.scene.remove(this.mesh);
    }
}
