/* ============================================================
   NEXUS STRIKE — UI Manager
   ============================================================ */

class UIManager {
    constructor() {
        this.els = {};
        const ids = ['health-bar','health-bar-damage','health-text','score-value','wave-value',
            'enemies-count','dash-cooldown','special-cooldown','wave-announcement','wave-announce-num',
            'game-hud','main-menu','pause-menu','game-over','settings-panel','controls-panel',
            'credits-panel','hero-select','loading-screen','loader-bar','loader-text',
            'final-score','final-wave','final-kills','best-score','crosshair',
            'hud-hero-name','special-icon','damage-vignette','hit-marker'];
        ids.forEach(id => this.els[id] = document.getElementById(id));
        this.lastHP = 100;
    }

    updateHealth(cur, max) {
        const pct = Math.max(0, (cur / max) * 100);
        this.els['health-bar'].style.width = pct + '%';
        this.els['health-text'].textContent = Math.ceil(cur);
        if (pct < this.lastHP) setTimeout(() => { this.els['health-bar-damage'].style.width = pct + '%'; }, 300);
        else this.els['health-bar-damage'].style.width = pct + '%';
        this.lastHP = pct;
        this.els['health-bar'].style.background = pct < 25 ? 'linear-gradient(90deg,#ff0033,#ff2244)' :
            pct < 50 ? 'linear-gradient(90deg,#ff4400,#ff6644)' : 'linear-gradient(90deg,#ff2244,#ff6644)';
    }

    updateScore(s) {
        const el = this.els['score-value'];
        el.textContent = s.toLocaleString();
        el.classList.remove('score-pop'); void el.offsetWidth; el.classList.add('score-pop');
    }

    updateWave(w) { this.els['wave-value'].textContent = w; }
    updateEnemyCount(c) { this.els['enemies-count'].textContent = c; }

    updateDashCooldown(rem) {
        const cd = this.els['dash-cooldown'];
        if (rem > 0) { cd.classList.add('active'); cd.textContent = rem.toFixed(1); }
        else cd.classList.remove('active');
    }

    updateSpecialCooldown(rem) {
        const cd = this.els['special-cooldown'];
        if (rem > 0) { cd.classList.add('active'); cd.textContent = rem.toFixed(1); }
        else cd.classList.remove('active');
    }

    setHeroInfo(heroDef) {
        if (this.els['hud-hero-name']) this.els['hud-hero-name'].textContent = heroDef.name;
        if (this.els['special-icon']) this.els['special-icon'].textContent = heroDef.specialIcon;
    }

    announceWave(num) {
        this.els['wave-announce-num'].textContent = num;
        const el = this.els['wave-announcement'];
        el.classList.remove('hidden');
        el.style.animation = 'none'; void el.offsetWidth; el.style.animation = '';
        setTimeout(() => el.classList.add('hidden'), 2200);
    }

    showScreen(id) {
        ['main-menu','settings-panel','controls-panel','credits-panel','pause-menu','game-over','game-hud','hero-select']
            .forEach(s => { const e = document.getElementById(s); if (e) e.classList.add('hidden'); });
        const t = document.getElementById(id);
        if (t) t.classList.remove('hidden');
    }

    showHUD() { this.els['game-hud'].classList.remove('hidden'); document.body.style.cursor = 'none'; }
    hideHUD() { this.els['game-hud'].classList.add('hidden'); document.body.style.cursor = 'default'; }
    showMenu() { this.hideHUD(); this.showScreen('main-menu'); }

    showPause() { this.showScreen('pause-menu'); document.body.style.cursor = 'default'; }
    hidePause() { this.els['pause-menu'].classList.add('hidden'); document.body.style.cursor = 'none'; this.showHUD(); }

    showGameOver(score, wave, kills) {
        this.hideHUD();
        this.els['final-score'].textContent = score.toLocaleString();
        this.els['final-wave'].textContent = wave;
        this.els['final-kills'].textContent = kills;
        const best = parseInt(localStorage.getItem('nexusBest') || '0');
        if (score > best) localStorage.setItem('nexusBest', score.toString());
        this.els['best-score'].textContent = Math.max(score, best).toLocaleString();
        this.showScreen('game-over'); document.body.style.cursor = 'default';
    }

    updateLoader(pct, txt) { this.els['loader-bar'].style.width = pct + '%'; if (txt) this.els['loader-text'].textContent = txt; }
    hideLoader() { const ls = this.els['loading-screen']; ls.style.opacity = '0'; ls.style.transition = 'opacity .5s'; setTimeout(() => ls.style.display = 'none', 500); }
}
