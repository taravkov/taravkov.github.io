// Placeholder audio controller — no sound yet

export class AmbientAudio {
    constructor() {
        this.isInitialized = false;
        this.isPlaying = false;
    }

    async init() {
        this.isInitialized = true;
    }

    start() {
        if (!this.isInitialized) return;
        this.isPlaying = true;
    }

    pause() {
        this.isPlaying = false;
    }

    resume() {
        if (!this.isInitialized) return;
        this.isPlaying = true;
    }

    updateFromVisuals() {
        // No-op for now
    }

    setVolume() {
        // No-op
    }
}
