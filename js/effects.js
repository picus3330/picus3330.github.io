/* ============================================================
   NEXUS STRIKE — Effects System
   Particles, screen shake, audio synthesis, visual feedback
   ============================================================ */

class ParticleSystem {
    constructor(scene) {
        this.scene = scene;
        this.particles = [];
        this.pool = [];          // Object pool for reuse
        this.maxParticles = 600;
        this.geometry = new THREE.SphereGeometry(0.08, 4, 4); // Shared geometry
    }

    /** Spawn a burst of particles at position */
    emit(position, options = {}) {
        const {
            count = 8,
            color = 0x00f0ff,
            speed = 5,
            spread = 1,
            lifetime = 0.6,
            size = 0.08,
            gravity = -8
        } = options;

        for (let i = 0; i < count; i++) {
            if (this.particles.length >= this.maxParticles) break;
            const p = this._getParticle(color, size);
            p.position.copy(position);
            // Random velocity in sphere
            const dir = new THREE.Vector3(
                (Math.random() - 0.5) * spread,
                Math.random() * 0.5 + 0.3,
                (Math.random() - 0.5) * spread
            ).normalize().multiplyScalar(speed * (0.5 + Math.random() * 0.5));
            p.userData.velocity = dir;
            p.userData.lifetime = lifetime * (0.7 + Math.random() * 0.3);
            p.userData.age = 0;
            p.userData.gravity = gravity;
            p.visible = true;
            p.scale.setScalar(1);
            p.material.opacity = 1;
            this.scene.add(p);
            this.particles.push(p);
        }
    }

    /** Emit a directional trail effect */
    emitTrail(position, direction, options = {}) {
        const {
            count = 4,
            color = 0x00f0ff,
            speed = 2,
            lifetime = 0.3,
            size = 0.06
        } = options;

        for (let i = 0; i < count; i++) {
            if (this.particles.length >= this.maxParticles) break;
            const p = this._getParticle(color, size);
            p.position.copy(position);
            const vel = direction.clone().multiplyScalar(-speed)
                .add(new THREE.Vector3(
                    (Math.random() - 0.5) * 1.5,
                    Math.random() * 0.5,
                    (Math.random() - 0.5) * 1.5
                ));
            p.userData.velocity = vel;
            p.userData.lifetime = lifetime;
            p.userData.age = 0;
            p.userData.gravity = 0;
            p.visible = true;
            p.scale.setScalar(1);
            p.material.opacity = 1;
            this.scene.add(p);
            this.particles.push(p);
        }
    }

    /** Get from pool or create new particle */
    _getParticle(color, size) {
        if (this.pool.length > 0) {
            const p = this.pool.pop();
            p.material.color.setHex(color);
            p.material.emissive.setHex(color);
            p.scale.setScalar(size / 0.08);
            return p;
        }
        const mat = new THREE.MeshBasicMaterial({
            color: color,
            transparent: true,
            opacity: 1
        });
        const mesh = new THREE.Mesh(this.geometry, mat);
        mesh.scale.setScalar(size / 0.08);
        mesh.userData = {};
        return mesh;
    }

    /** Update all living particles */
    update(dt) {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.userData.age += dt;
            const lifeRatio = p.userData.age / p.userData.lifetime;

            if (lifeRatio >= 1) {
                // Return to pool
                p.visible = false;
                this.scene.remove(p);
                this.pool.push(p);
                this.particles.splice(i, 1);
                continue;
            }

            // Physics update
            p.userData.velocity.y += p.userData.gravity * dt;
            p.position.addScaledVector(p.userData.velocity, dt);

            // Fade and shrink
            p.material.opacity = 1 - lifeRatio;
            p.scale.setScalar((1 - lifeRatio * 0.5) * (p.scale.x > 0 ? 1 : 0.5));
        }
    }

    /** Clean up all particles */
    clear() {
        for (const p of this.particles) {
            p.visible = false;
            this.scene.remove(p);
            this.pool.push(p);
        }
        this.particles = [];
    }
}

/* ---- Screen Shake System ---- */
class ScreenShake {
    constructor(camera) {
        this.camera = camera;
        this.intensity = 0;
        this.decay = 8;
        this.originalPosition = new THREE.Vector3();
        this.enabled = true;
    }

    /** Trigger a shake */
    shake(intensity = 0.3) {
        if (!this.enabled) return;
        this.intensity = Math.max(this.intensity, intensity);
    }

    /** Apply shake offset per frame */
    update(dt) {
        if (this.intensity > 0.001) {
            const offsetX = (Math.random() - 0.5) * this.intensity;
            const offsetY = (Math.random() - 0.5) * this.intensity;
            this.camera.position.x += offsetX;
            this.camera.position.z += offsetY;
            this.intensity *= Math.max(0, 1 - this.decay * dt);
        } else {
            this.intensity = 0;
        }
    }
}

/* ---- Audio System (Web Audio API synthesis) ---- */
class AudioSystem {
    constructor() {
        this.ctx = null;
        this.masterGain = null;
        this.sfxGain = null;
        this.initialized = false;
    }

    /** Initialize audio context on first user interaction */
    init() {
        if (this.initialized) return;
        try {
            this.ctx = new (window.AudioContext || window.webkitAudioContext)();
            this.masterGain = this.ctx.createGain();
            this.masterGain.gain.value = 0.7;
            this.masterGain.connect(this.ctx.destination);
            this.sfxGain = this.ctx.createGain();
            this.sfxGain.gain.value = 0.8;
            this.sfxGain.connect(this.masterGain);
            this.initialized = true;
        } catch (e) {
            console.warn('Web Audio not supported');
        }
    }

    setMasterVolume(v) { if (this.masterGain) this.masterGain.gain.value = v; }
    setSfxVolume(v) { if (this.sfxGain) this.sfxGain.gain.value = v; }

    /** Play a synthesized shoot sound */
    playShoot() {
        if (!this.initialized) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(880, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(220, this.ctx.currentTime + 0.1);
        gain.gain.setValueAtTime(0.15, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.1);
        osc.connect(gain);
        gain.connect(this.sfxGain);
        osc.start();
        osc.stop(this.ctx.currentTime + 0.1);
    }

    /** Play a hit impact sound */
    playHit() {
        if (!this.initialized) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(200, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(60, this.ctx.currentTime + 0.15);
        gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.15);
        osc.connect(gain);
        gain.connect(this.sfxGain);
        osc.start();
        osc.stop(this.ctx.currentTime + 0.15);
    }

    /** Play explosion sound */
    playExplosion() {
        if (!this.initialized) return;
        // Noise burst
        const bufferSize = this.ctx.sampleRate * 0.3;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.15));
        }
        const source = this.ctx.createBufferSource();
        source.buffer = buffer;
        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.25, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.3);
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 800;
        source.connect(filter);
        filter.connect(gain);
        gain.connect(this.sfxGain);
        source.start();
    }

    /** Play dash sound */
    playDash() {
        if (!this.initialized) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(400, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(1200, this.ctx.currentTime + 0.08);
        gain.gain.setValueAtTime(0.12, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.12);
        osc.connect(gain);
        gain.connect(this.sfxGain);
        osc.start();
        osc.stop(this.ctx.currentTime + 0.12);
    }

    /** Play enemy death */
    playEnemyDeath() {
        if (!this.initialized) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(600, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(40, this.ctx.currentTime + 0.25);
        gain.gain.setValueAtTime(0.15, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.25);
        osc.connect(gain);
        gain.connect(this.sfxGain);
        osc.start();
        osc.stop(this.ctx.currentTime + 0.25);
    }

    /** Play player damage */
    playDamage() {
        if (!this.initialized) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(120, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(50, this.ctx.currentTime + 0.2);
        gain.gain.setValueAtTime(0.18, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.2);
        osc.connect(gain);
        gain.connect(this.sfxGain);
        osc.start();
        osc.stop(this.ctx.currentTime + 0.2);
    }

    /** Play pickup sound */
    playPickup() {
        if (!this.initialized) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(523, this.ctx.currentTime);
        osc.frequency.setValueAtTime(659, this.ctx.currentTime + 0.08);
        osc.frequency.setValueAtTime(784, this.ctx.currentTime + 0.16);
        gain.gain.setValueAtTime(0.12, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.25);
        osc.connect(gain);
        gain.connect(this.sfxGain);
        osc.start();
        osc.stop(this.ctx.currentTime + 0.25);
    }

    /** Menu click */
    playClick() {
        if (!this.initialized) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.value = 1000;
        gain.gain.setValueAtTime(0.08, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.05);
        osc.connect(gain);
        gain.connect(this.sfxGain);
        osc.start();
        osc.stop(this.ctx.currentTime + 0.05);
    }
}

/* ---- Floating Score Text ---- */
class FloatingTextManager {
    constructor() {
        this.texts = [];
    }

    spawn(text, x, y, color = '#ffcc00') {
        const el = document.createElement('div');
        el.textContent = text;
        el.style.cssText = `
            position: fixed; left: ${x}px; top: ${y}px;
            font-family: 'Orbitron', monospace;
            font-size: 18px; font-weight: 700;
            color: ${color};
            text-shadow: 0 0 10px ${color};
            pointer-events: none; z-index: 200;
            transition: all 0.8s cubic-bezier(0.16, 1, 0.3, 1);
            opacity: 1;
        `;
        document.body.appendChild(el);
        // Animate up and fade
        requestAnimationFrame(() => {
            el.style.top = (y - 60) + 'px';
            el.style.opacity = '0';
        });
        setTimeout(() => el.remove(), 800);
    }
}

// Global instances (will be initialized in main.js)
let particleSystem, screenShake, audioSystem, floatingText;
