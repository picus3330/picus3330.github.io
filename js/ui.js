export class UIManager {
    constructor() {
        this.startMenu = document.getElementById('start-menu');
        this.pauseMenu = document.getElementById('pause-menu');
        this.gameOverMenu = document.getElementById('game-over-menu');
        this.hud = document.getElementById('hud');
        
        this.healthBar = document.getElementById('health-bar');
        this.scoreVal = document.getElementById('score-val');
        this.finalScore = document.getElementById('final-score');
        this.dashStatus = document.getElementById('dash-status');
    }

    showScreen(screenId) {
        this.startMenu.classList.remove('active');
        this.pauseMenu.classList.remove('active');
        this.gameOverMenu.classList.remove('active');
        this.hud.classList.remove('active');

        this.startMenu.classList.add('hidden');
        this.pauseMenu.classList.add('hidden');
        this.gameOverMenu.classList.add('hidden');
        this.hud.classList.add('hidden');

        document.getElementById(screenId).classList.remove('hidden');
        document.getElementById(screenId).classList.add('active');
    }

    updateHealth(current, max) {
        const percentage = Math.max(0, (current / max) * 100);
        this.healthBar.style.width = `${percentage}%`;
        if (percentage < 30) this.healthBar.style.background = '#f00';
        else this.healthBar.style.background = 'linear-gradient(90deg, #0ff, #0055ff)';
    }

    updateScore(score) {
        this.scoreVal.innerText = score;
        this.finalScore.innerText = score;
    }

    updateDash(isReady) {
        this.dashStatus.innerText = isReady ? 'Ready' : 'Cooldown';
        this.dashStatus.style.color = isReady ? '#0ff' : '#f00';
    }
}
