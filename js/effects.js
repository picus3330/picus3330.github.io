/* ============================================================
   NEXUS STRIKE — Effects System (OPTIMIZED)
   
   PERF: All particles = vertices in ONE BufferGeometry Points
   → 1 draw call total instead of hundreds of individual meshes
   → Pre-allocated fixed buffers, zero GC pressure in hot loop
   → Swap-remove for O(1) particle death
   ============================================================ */

class ParticleSystem {
    constructor(scene, maxParticles) {
        this.max = maxParticles || 800;
        this.count = 0;

        // Pre-allocated typed arrays (never reallocated)
        this._pos  = new Float32Array(this.max * 3);
        this._col  = new Float32Array(this.max * 3);
        this._sizes = new Float32Array(this.max);
        this._vel  = new Float32Array(this.max * 3);
        this._life = new Float32Array(this.max);
        this._maxLife = new Float32Array(this.max);
        this._grav = new Float32Array(this.max);

        this.geometry = new THREE.BufferGeometry();
        this.geometry.setAttribute('position', new THREE.BufferAttribute(this._pos, 3));
        this.geometry.setAttribute('color',    new THREE.BufferAttribute(this._col, 3));
        this.geometry.setAttribute('size',     new THREE.BufferAttribute(this._sizes, 1));
        this.geometry.setDrawRange(0, 0);

        this.material = new THREE.PointsMaterial({
            size: 0.5,
            vertexColors: true,
            transparent: true,
            opacity: 0.9,
            sizeAttenuation: true,
            depthWrite: false,
            blending: THREE.AdditiveBlending
        });

        this.points = new THREE.Points(this.geometry, this.material);
        this.points.frustumCulled = false;
        scene.add(this.points);

        this._tmpColor = new THREE.Color();
    }

    emit(position, opts) {
        const n     = opts.count    || 8;
        const color = opts.color    || 0x00f0ff;
        const speed = opts.speed    || 5;
        const spread= opts.spread   || 1;
        const life  = opts.lifetime || 0.6;
        const grav  = opts.gravity !== undefined ? opts.gravity : -8;
        const sz    = opts.size     || 0.4;

        this._tmpColor.setHex(color);
        const cr = this._tmpColor.r, cg = this._tmpColor.g, cb = this._tmpColor.b;

        for (let i = 0; i < n; i++) {
            if (this.count >= this.max) return;
            const idx = this.count;
            const i3 = idx * 3;

            this._pos[i3]   = position.x + (Math.random()-.5)*.3;
            this._pos[i3+1] = (position.y || 0.5) + Math.random()*.2;
            this._pos[i3+2] = position.z + (Math.random()-.5)*.3;

            const dx = (Math.random()-.5)*spread, dy = Math.random()*.5+.3, dz = (Math.random()-.5)*spread;
            const len = Math.sqrt(dx*dx+dy*dy+dz*dz)||1;
            const s = speed * (.5+Math.random()*.5) / len;
            this._vel[i3]=dx*s; this._vel[i3+1]=dy*s; this._vel[i3+2]=dz*s;

            this._col[i3]=cr; this._col[i3+1]=cg; this._col[i3+2]=cb;
            this._sizes[idx] = sz * (.7+Math.random()*.6);

            const l = life * (.6+Math.random()*.4);
            this._life[idx] = l;
            this._maxLife[idx] = l;
            this._grav[idx] = grav;
            this.count++;
        }
    }

    emitTrail(position, direction, opts) {
        const n    = opts.count || 2;
        const color= opts.color || 0x00f0ff;
        const speed= opts.speed || 2;
        const life = opts.lifetime || 0.2;

        this._tmpColor.setHex(color);
        const cr=this._tmpColor.r, cg=this._tmpColor.g, cb=this._tmpColor.b;

        for (let i = 0; i < n; i++) {
            if (this.count >= this.max) return;
            const idx = this.count, i3 = idx*3;
            this._pos[i3]=position.x; this._pos[i3+1]=position.y||.5; this._pos[i3+2]=position.z;
            this._vel[i3]=-direction.x*speed+(Math.random()-.5);
            this._vel[i3+1]=Math.random()*.3;
            this._vel[i3+2]=-direction.z*speed+(Math.random()-.5);
            this._col[i3]=cr; this._col[i3+1]=cg; this._col[i3+2]=cb;
            this._sizes[idx]=.25;
            const l=life*(.6+Math.random()*.4);
            this._life[idx]=l; this._maxLife[idx]=l; this._grav[idx]=0;
            this.count++;
        }
    }

    update(dt) {
        let i = 0;
        while (i < this.count) {
            this._life[i] -= dt;
            if (this._life[i] <= 0) {
                // Swap-remove: move last particle into this slot
                this.count--;
                if (i < this.count) {
                    const i3=i*3, l3=this.count*3;
                    this._pos[i3]=this._pos[l3]; this._pos[i3+1]=this._pos[l3+1]; this._pos[i3+2]=this._pos[l3+2];
                    this._vel[i3]=this._vel[l3]; this._vel[i3+1]=this._vel[l3+1]; this._vel[i3+2]=this._vel[l3+2];
                    this._col[i3]=this._col[l3]; this._col[i3+1]=this._col[l3+1]; this._col[i3+2]=this._col[l3+2];
                    this._sizes[i]=this._sizes[this.count];
                    this._life[i]=this._life[this.count];
                    this._maxLife[i]=this._maxLife[this.count];
                    this._grav[i]=this._grav[this.count];
                }
                continue;
            }
            const i3=i*3;
            this._vel[i3+1] += this._grav[i]*dt;
            this._pos[i3]   += this._vel[i3]*dt;
            this._pos[i3+1] += this._vel[i3+1]*dt;
            this._pos[i3+2] += this._vel[i3+2]*dt;
            // Shrink with life
            const ratio = this._life[i]/this._maxLife[i];
            this._sizes[i] *= (.96 + ratio*.04);
            i++;
        }
        this.geometry.setDrawRange(0, this.count);
        this.geometry.attributes.position.needsUpdate = true;
        this.geometry.attributes.color.needsUpdate = true;
        this.geometry.attributes.size.needsUpdate = true;
    }

    clear() { this.count = 0; this.geometry.setDrawRange(0,0); }
}

class ScreenShake {
    constructor() { this.intensity=0; this.decay=8; this.enabled=true; this.offsetX=0; this.offsetZ=0; }
    shake(intensity) { if(this.enabled) this.intensity=Math.max(this.intensity,intensity); }
    update(dt) {
        if(this.intensity>.001){
            this.offsetX=(Math.random()-.5)*this.intensity;
            this.offsetZ=(Math.random()-.5)*this.intensity;
            this.intensity*=Math.max(0,1-this.decay*dt);
        } else { this.intensity=0; this.offsetX=0; this.offsetZ=0; }
    }
}

class AudioSystem {
    constructor(){this.ctx=null;this.masterGain=null;this.sfxGain=null;this.initialized=false;}
    init(){
        if(this.initialized)return;
        try{
            this.ctx=new(window.AudioContext||window.webkitAudioContext)();
            this.masterGain=this.ctx.createGain();this.masterGain.gain.value=.7;this.masterGain.connect(this.ctx.destination);
            this.sfxGain=this.ctx.createGain();this.sfxGain.gain.value=.8;this.sfxGain.connect(this.masterGain);
            this.initialized=true;
        }catch(e){}
    }
    setMasterVolume(v){if(this.masterGain)this.masterGain.gain.value=v;}
    setSfxVolume(v){if(this.sfxGain)this.sfxGain.gain.value=v;}
    _tone(type,f0,f1,dur,vol){
        if(!this.initialized)return;const t=this.ctx.currentTime;
        const o=this.ctx.createOscillator(),g=this.ctx.createGain();
        o.type=type;o.frequency.setValueAtTime(f0,t);o.frequency.exponentialRampToValueAtTime(Math.max(f1,20),t+dur);
        g.gain.setValueAtTime(vol,t);g.gain.exponentialRampToValueAtTime(.001,t+dur);
        o.connect(g);g.connect(this.sfxGain);o.start(t);o.stop(t+dur);
    }
    playShoot(){this._tone('square',880,220,.08,.12);}
    playHit(){this._tone('sawtooth',200,60,.12,.15);}
    playDash(){this._tone('sine',400,1200,.1,.1);}
    playDamage(){this._tone('sawtooth',120,50,.18,.15);}
    playEnemyDeath(){this._tone('square',600,40,.22,.12);}
    playPickup(){if(!this.initialized)return;const t=this.ctx.currentTime;const o=this.ctx.createOscillator(),g=this.ctx.createGain();o.type='sine';o.frequency.setValueAtTime(523,t);o.frequency.setValueAtTime(659,t+.07);o.frequency.setValueAtTime(784,t+.14);g.gain.setValueAtTime(.1,t);g.gain.exponentialRampToValueAtTime(.001,t+.22);o.connect(g);g.connect(this.sfxGain);o.start(t);o.stop(t+.22);}
    playClick(){this._tone('sine',1000,800,.04,.06);}
    playShotgun(){if(!this.initialized)return;const t=this.ctx.currentTime;const len=this.ctx.sampleRate*.08|0;const buf=this.ctx.createBuffer(1,len,this.ctx.sampleRate);const d=buf.getChannelData(0);for(let i=0;i<len;i++)d[i]=(Math.random()*2-1)*Math.exp(-i/(len*.04));const s=this.ctx.createBufferSource();s.buffer=buf;const g=this.ctx.createGain();g.gain.setValueAtTime(.16,t);g.gain.exponentialRampToValueAtTime(.001,t+.08);s.connect(g);g.connect(this.sfxGain);s.start(t);}
    playExplosion(){if(!this.initialized)return;const t=this.ctx.currentTime;const len=this.ctx.sampleRate*.2|0;const buf=this.ctx.createBuffer(1,len,this.ctx.sampleRate);const d=buf.getChannelData(0);for(let i=0;i<len;i++)d[i]=(Math.random()*2-1)*Math.exp(-i/(len*.1));const s=this.ctx.createBufferSource();s.buffer=buf;const g=this.ctx.createGain();g.gain.setValueAtTime(.2,t);g.gain.exponentialRampToValueAtTime(.001,t+.2);const f=this.ctx.createBiquadFilter();f.type='lowpass';f.frequency.value=500;s.connect(f);f.connect(g);g.connect(this.sfxGain);s.start(t);}
    playCharge(){this._tone('sine',200,1600,.35,.07);}
}

class FloatingTextManager {
    constructor(){this._pool=[];}
    spawn(text,x,y,color){
        color=color||'#ffcc00';
        let el=this._pool.pop();
        if(!el){el=document.createElement('div');el.className='floating-text';document.body.appendChild(el);}
        el.textContent=text;el.style.cssText=`position:fixed;left:${x}px;top:${y}px;color:${color};text-shadow:0 0 8px ${color};font-family:'Orbitron',monospace;font-size:16px;font-weight:700;pointer-events:none;z-index:200;opacity:1;transform:translateY(0);transition:all .6s cubic-bezier(.16,1,.3,1);display:block;`;
        void el.offsetWidth;
        el.style.opacity='0';el.style.transform='translateY(-45px)';
        setTimeout(()=>{el.style.display='none';this._pool.push(el);},600);
    }
}

let particleSystem, screenShake, audioSystem, floatingText;
