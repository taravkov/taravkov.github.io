// Atmospheric frequency sweeps

export class AtmosphericSweeps {
    constructor(context, masterGain) {
        this.context = context;
        this.masterGain = masterGain;
        this.isPlaying = false;
    }

    init() {
        // Sweeps are triggered randomly
    }

    start() {
        this.isPlaying = true;
        this.scheduleNextSweep();
    }

    scheduleNextSweep() {
        if (!this.isPlaying) return;

        // Random interval: 12-30 seconds (rare, atmospheric)
        const interval = 12000 + Math.random() * 18000;
        
        setTimeout(() => {
            this.triggerSweep();
            this.scheduleNextSweep();
        }, interval);
    }

    triggerSweep() {
        const now = this.context.currentTime;
        const duration = 3 + Math.random() * 4;
        
        // Direction: up or down
        const direction = Math.random() > 0.5 ? 1 : -1;
        const startFreq = direction > 0 ? 200 : 1200;
        const endFreq = direction > 0 ? 1200 : 200;
        
        // Oscillator 1: Main sweep (sine)
        const osc1 = this.context.createOscillator();
        osc1.type = 'sine';
        osc1.frequency.value = startFreq;
        osc1.frequency.exponentialRampToValueAtTime(endFreq, now + duration);
        
        // Oscillator 2: Harmonic layer (triangle)
        const osc2 = this.context.createOscillator();
        osc2.type = 'triangle';
        osc2.frequency.value = startFreq * 1.5;
        osc2.frequency.exponentialRampToValueAtTime(endFreq * 1.5, now + duration * 0.9);
        osc2.detune.value = 5;
        
        // Oscillator 3: Sub layer
        const osc3 = this.context.createOscillator();
        osc3.type = 'sine';
        osc3.frequency.value = startFreq * 0.5;
        osc3.frequency.exponentialRampToValueAtTime(endFreq * 0.5, now + duration * 1.1);
        osc3.detune.value = -3;
        
        // Noise layer for texture
        const noiseBuffer = this.context.createBuffer(1, this.context.sampleRate * duration, this.context.sampleRate);
        const noiseData = noiseBuffer.getChannelData(0);
        for (let i = 0; i < noiseData.length; i++) {
            noiseData[i] = (Math.random() * 2 - 1) * 0.3;
        }
        const noise = this.context.createBufferSource();
        noise.buffer = noiseBuffer;
        
        // Noise filter (sweeps with main frequency)
        const noiseFilter = this.context.createBiquadFilter();
        noiseFilter.type = 'bandpass';
        noiseFilter.frequency.value = startFreq;
        noiseFilter.frequency.exponentialRampToValueAtTime(endFreq, now + duration);
        noiseFilter.Q.value = 8;
        
        // FM modulation for complexity
        const modulator = this.context.createOscillator();
        modulator.type = 'sine';
        modulator.frequency.value = 3 + Math.random() * 5;
        
        const modDepth = this.context.createGain();
        modDepth.gain.value = 30;
        modDepth.gain.linearRampToValueAtTime(80, now + duration * 0.5);
        modDepth.gain.linearRampToValueAtTime(20, now + duration);
        
        modulator.connect(modDepth);
        modDepth.connect(osc1.frequency);
        
        // Mix gains
        const osc1Mix = this.context.createGain();
        osc1Mix.gain.value = 0.45;
        
        const osc2Mix = this.context.createGain();
        osc2Mix.gain.value = 0.25;
        osc2Mix.gain.linearRampToValueAtTime(0.35, now + duration * 0.6);
        
        const osc3Mix = this.context.createGain();
        osc3Mix.gain.value = 0.2;
        
        const noiseMix = this.context.createGain();
        noiseMix.gain.value = 0.1;
        
        // Main envelope
        const mainGain = this.context.createGain();
        mainGain.gain.value = 0;
        mainGain.gain.linearRampToValueAtTime(0.1, now + duration * 0.3);
        mainGain.gain.linearRampToValueAtTime(0.1, now + duration * 0.7);
        mainGain.gain.linearRampToValueAtTime(0, now + duration);
        
        // Resonant bandpass (follows sweep)
        const filter = this.context.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.value = startFreq * 2;
        filter.frequency.exponentialRampToValueAtTime(endFreq * 2, now + duration);
        filter.Q.value = 5;
        filter.Q.linearRampToValueAtTime(2, now + duration);
        
        // Phaser for movement
        const phaser = this.context.createBiquadFilter();
        phaser.type = 'allpass';
        phaser.frequency.value = 500;
        
        const phaserLFO = this.context.createOscillator();
        phaserLFO.type = 'sine';
        phaserLFO.frequency.value = 0.3;
        
        const phaserDepth = this.context.createGain();
        phaserDepth.gain.value = 400;
        
        phaserLFO.connect(phaserDepth);
        phaserDepth.connect(phaser.frequency);
        
        // Stereo autopan
        const panner = this.context.createStereoPanner();
        panner.pan.value = 0;
        panner.pan.linearRampToValueAtTime(direction * 0.7, now + duration * 0.5);
        panner.pan.linearRampToValueAtTime(0, now + duration);
        
        // Reverb tail
        const reverbDelay = this.context.createDelay(0.3);
        reverbDelay.delayTime.value = 0.15;
        
        const reverbFeedback = this.context.createGain();
        reverbFeedback.gain.value = 0.5;
        
        const reverbFilter = this.context.createBiquadFilter();
        reverbFilter.type = 'lowpass';
        reverbFilter.frequency.value = 3000;
        
        reverbDelay.connect(reverbFilter);
        reverbFilter.connect(reverbFeedback);
        reverbFeedback.connect(reverbDelay);
        
        const reverbMix = this.context.createGain();
        reverbMix.gain.value = 0.25;
        
        // Soft saturation
        const saturation = this.context.createWaveShaper();
        const satCurve = new Float32Array(256);
        for (let i = 0; i < 256; i++) {
            const x = (i / 128) - 1;
            satCurve[i] = Math.tanh(x * 1.3);
        }
        saturation.curve = satCurve;
        
        // Connect oscillators
        osc1.connect(osc1Mix);
        osc2.connect(osc2Mix);
        osc3.connect(osc3Mix);
        noise.connect(noiseFilter);
        noiseFilter.connect(noiseMix);
        
        // Mix to filter
        osc1Mix.connect(filter);
        osc2Mix.connect(filter);
        osc3Mix.connect(filter);
        noiseMix.connect(filter);
        
        // Filter chain
        filter.connect(phaser);
        phaser.connect(saturation);
        
        // Reverb
        saturation.connect(reverbDelay);
        reverbDelay.connect(reverbMix);
        
        // Mix dry + reverb
        saturation.connect(panner);
        reverbMix.connect(panner);
        
        panner.connect(mainGain);
        mainGain.connect(this.masterGain);
        
        // Start all
        osc1.start(now);
        osc2.start(now);
        osc3.start(now);
        noise.start(now);
        modulator.start(now);
        phaserLFO.start(now);
        
        osc1.stop(now + duration + 0.5);
        osc2.stop(now + duration + 0.5);
        osc3.stop(now + duration + 0.5);
        modulator.stop(now + duration + 0.5);
        phaserLFO.stop(now + duration + 0.5);
    }

    stop() {
        this.isPlaying = false;
    }
}

