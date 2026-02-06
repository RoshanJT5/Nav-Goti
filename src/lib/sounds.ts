// Sound effects utility for game audio feedback

const sounds = {
    turnStart: '/sounds/turn-start.mp3',
    warning: '/sounds/warning.mp3',
    gameOver: '/sounds/game-over.mp3',
    move: '/sounds/move.mp3',
    drawOffer: '/sounds/notification.mp3'
};

let audioContext: AudioContext | null = null;

// Initialize audio context on first user interaction
export function initAudio() {
    if (typeof window === 'undefined') return;
    if (!audioContext) {
        audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
}

export function playSound(type: keyof typeof sounds) {
    if (typeof window === 'undefined') return;

    try {
        const audio = new Audio(sounds[type]);
        audio.volume = 0.5;
        audio.play().catch(() => {
            // Ignore autoplay errors - browser may block until user interaction
        });
    } catch (e) {
        console.warn('Failed to play sound:', e);
    }
}

// Play a beep sound using Web Audio API (fallback if files don't exist)
export function playBeep(frequency: number = 440, duration: number = 200) {
    if (typeof window === 'undefined') return;

    try {
        const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(ctx.destination);

        oscillator.frequency.value = frequency;
        oscillator.type = 'sine';

        gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration / 1000);

        oscillator.start(ctx.currentTime);
        oscillator.stop(ctx.currentTime + duration / 1000);
    } catch (e) {
        console.warn('Failed to play beep:', e);
    }
}

// Specific sound effects
export function playTurnStartSound() {
    playBeep(880, 150); // High A note
}

export function playWarningSound() {
    playBeep(440, 300); // A note, longer
}

export function playGameOverSound() {
    // Play a chord
    playBeep(523, 500); // C
    setTimeout(() => playBeep(659, 500), 100); // E
    setTimeout(() => playBeep(784, 500), 200); // G
}

export function playMoveSound() {
    playBeep(660, 100);
}

export function playDrawOfferSound() {
    playBeep(550, 150);
    setTimeout(() => playBeep(660, 150), 200);
}
