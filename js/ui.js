/* ============================================================
   NEXUS STRIKE — UI Manager
   HUD updates, screen transitions, health bar, cooldowns
   ============================================================ */

class UIManager {
    constructor() {
        // Cache DOM elements for performance
        this.els = {
            healthBar: document.getElementById('health-bar'),
            healthBarDamage: document.getElementById('health-bar-damage'),
            healthText: document.getElementById('health-text'),
            scoreValue: document.getElementById('score-value'),
            waveValue: document.getElementById('wave-value'),
            enemiesCount: document.getElementById('enemies-count'),
            dashCooldown: document.getElementById('dash-cooldown'),
            shootCooldown: document.getElementById('shoot-cooldown'),
            waveAnnouncement: document.getElementById('wave-announcement'),
            waveAnnounceNum: document.getElementById('wave-announce-num'),
            gameHud: document.getElementById('game-hud'),
            mainMenu: document.getElementById('main-menu'),
            pauseMenu: document.getElementById('pause-menu'),
            gameOver: document.getElementById('game-over'),
            settingsPanel: document.getElementById('settings-panel'),
            controlsPanel: document.getElementById('controls-panel'),
            creditsPanel: document.getElementById('credits-panel'),
            loadingScreen: document.getElementById('loading-screen'),
            loaderBar: document.getElementById('loader-bar'),
            loaderText: document.getElementById('loader-text'),
            finalScore: document.getElementById('final-score'),
            finalWave: document.getElementById('final-wave'),
            finalKills: document.getElementById('final-kills'),
            bestScore: document.getElementById('best-score'),
            crosshair: document.getElementById('crosshair'),
        };

        this.lastHealthPercent = 100;
    }

    /** Update health bar display */
    updateHealth(current, max) {
        const percent = Math.max(0, (current / max) * 100);
        this.els.healthBar.style.width = percent + '%';
        this.els.healthText.textContent = Math.ceil(current);

        // Delayed damage bar (shows recent damage amount)
        if (percent < this.lastHealthPercent) {
            // Damage bar follows with delay
            setTimeout(() => {
                this.els.healthBarDamage.style.width = percent + '%';
            }, 300);
        } else {
            this.els.healthBarDamage.style.width = percent + '%';
        }
        this.lastHealthPercent = percent;

        // Color shift when low
        if (percent < 25) {
            this.els.healthBar.style.background = 'linear-gradient(90deg, #ff0033, #ff2244)';
        } else if (percent < 50) {
            this.els.healthBar.style.background = 'linear-gradient(90deg, #ff4400, #ff6644)';
        } else {
            this.els.healthBar.style.background = 'linear-gradient(90deg, #ff2244, #ff6644)';
        }
    }

    /** Update score with pop animation */
    updateScore(score) {
        this.els.scoreValue.textContent = score.toLocaleString();
        this.els.scoreValue.classList.remove('score-pop');
        // Force reflow to restart animation
        void this.els.scoreValue.offsetWidth;
        this.els.scoreValue.classList.add('score-pop');
    }

    /** Update wave number */
    updateWave(wave) {
        this.els.waveValue.textContent = wave;
    }

    /** Update enemy count */
    updateEnemyCount(count) {
        this.els.enemiesCount.textContent = count;
    }

    /** Show dash cooldown overlay */
    updateDashCooldown(remaining, total) {
        const cd = this.els.dashCooldown;
        if (remaining > 0) {
            cd.classList.add('active');
            cd.textContent = remaining.toFixed(1);
        } else {
            cd.classList.remove('active');
        }
    }

    /** Show shoot cooldown */
    updateShootCooldown(remaining, total) {
        const cd = this.els.shootCooldown;
        if (remaining > 0) {
            cd.classList.add('active');
            cd.textContent = '';
            cd.style.background = `rgba(0,0,0,${0.7 * (remaining / total)})`;
        } else {
            cd.classList.remove('active');
        }
    }

    /** Display wave announcement */
    announceWave(waveNum) {
        this.els.waveAnnounceNum.textContent = waveNum;
        this.els.waveAnnouncement.classList.remove('hidden');
        // Re-trigger animation
        this.els.waveAnnouncement.style.animation = 'none';
        void this.els.waveAnnouncement.offsetWidth;
        this.els.waveAnnouncement.style.animation = '';

        setTimeout(() => {
            this.els.waveAnnouncement.classList.add('hidden');
        }, 2200);
    }

    /** Screen management */
    showScreen(screenId) {
        // Hide all screens
        const screens = ['main-menu', 'settings-panel', 'controls-panel',
            'credits-panel', 'pause-menu', 'game-over', 'game-hud'];
        screens.forEach(id => {
            const el = document.getElementById(id);
            if (el) el.classList.add('hidden');
        });
        // Show requested
        const target = document.getElementById(screenId);
        if (target) target.classList.remove('hidden');
    }

    showHUD() {
        this.els.gameHud.classList.remove('hidden');
        this.els.crosshair.style.display = '';
        document.body.style.cursor = 'none';
    }

    hideHUD() {
        this.els.gameHud.classList.add('hidden');
        document.body.style.cursor = 'default';
    }

    showMenu() {
        this.hideHUD();
        this.showScreen('main-menu');
    }

    showPause() {
        this.showScreen('pause-menu');
        document.body.style.cursor = 'default';
    }

    hidePause() {
        this.els.pauseMenu.classList.add('hidden');
        document.body.style.cursor = 'none';
        this.showHUD();
    }

    showGameOver(score, wave, kills) {
        this.hideHUD();
        this.els.finalScore.textContent = score.toLocaleString();
        this.els.finalWave.textContent = wave;
        this.els.finalKills.textContent = kills;
        const best = parseInt(localStorage.getItem('nexusBestScore') || '0');
        if (score > best) {
            localStorage.setItem('nexusBestScore', score.toString());
        }
        this.els.bestScore.textContent = Math.max(score, best).toLocaleString();
        this.showScreen('game-over');
        document.body.style.cursor = 'default';
    }

    /** Loading screen */
    updateLoader(progress, text) {
        this.els.loaderBar.style.width = progress + '%';
        if (text) this.els.loaderText.textContent = text;
    }

    hideLoader() {
        this.els.loadingScreen.style.opacity = '0';
        this.els.loadingScreen.style.transition = 'opacity 0.5s';
        setTimeout(() => {
            this.els.loadingScreen.style.display = 'none';
        }, 500);
    }
}
