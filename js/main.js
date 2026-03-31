import { GameManager } from './gameManager.js';

document.addEventListener('DOMContentLoaded', () => {
    const container = document.getElementById('game-container');
    const game = new GameManager(container);

    // Event Listeners for UI
    document.getElementById('btn-start').addEventListener('click', () => game.startGame());
    document.getElementById('btn-restart').addEventListener('click', () => game.startGame());
    document.getElementById('btn-resume').addEventListener('click', () => game.togglePause());

    // Keyboard Input
    window.addEventListener('keydown', (e) => {
        game.input.keys[e.code] = true;
        if (e.code === 'Escape') game.togglePause();
    });

    window.addEventListener('keyup', (e) => {
        game.input.keys[e.code] = false;
    });

    // Mouse Input
    window.addEventListener('mousemove', (e) => {
        game.updateMousePosition(e.clientX, e.clientY);
    });

    window.addEventListener('mousedown', (e) => {
        if(e.button === 0) game.input.isMouseDown = true;
    });

    window.addEventListener('mouseup', (e) => {
        if(e.button === 0) game.input.isMouseDown = false;
    });

    // Window Resize
    window.addEventListener('resize', () => game.resize());

    // Start engine loop
    game.animate();
});
