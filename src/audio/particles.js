// Sparse melodic particles (random tones)

export class SonicParticles {
    constructor(context, masterGain) {
        this.context = context;
        this.masterGain = masterGain;
        this.isPlaying = false;
    }

    init() {
        // Particles are triggered randomly
    }

    start() {
        this.isPlaying = true;
        this.scheduleNextParticle();
    }

    scheduleNextParticle() {
        if (!this.isPlaying) return;

        // Random interval: 3-10 seconds
        const interval = 3000 + Math.random() * 7000;
        
        setTimeout(() => {
            this.triggerParticle();
            this.scheduleNextParticle();
        }, interval);
    }

    triggerParticle() {
        const now = this.context.currentTime;
        const duration = 2.5 + Math.random() * 1.5;
        
        // Random note from pentatonic scale
        const scale = [220, 247, 277, 330, 370, 440, 494, 554];
        const baseFreq = scale[Math.floor(Math.random() * scale.length)];
        
        // Oscillator 1: Main tone (sine)
        const osc1 = this.context.createOscillator();
        osc1.type = 'sine';
        osc1.frequency.value = baseFreq;
        
        // Oscillator 2: Octave shimmer
        const osc2 = this.context.createOscillator();
        osc2.type = 'triangle';
        osc2.frequency.value = baseFreq * 2;
        osc2.detune.value = 3;
        
        // Oscillator 3: Fifth harmonic
        const osc3 = this.context.createOscillator();
        osc3.type = 'sine';
        osc3.frequency.value = baseFreq * 1.5;
        osc3.detune.value = -2;
        
        // Sub for warmth
        const subOsc = this.context.createOscillator();
        subOsc.type = 'sine';
        subOsc.frequency.value = baseFreq * 0.5;
        
        // Pitch drift
        const driftLFO = this.context.createOscillator();
        driftLFO.type = 'sine';
        driftLFO.frequency.value = 0.5;
        
        const driftDepth = this.context.createGain();
        driftDepth.gain.value = 3;
        
        driftLFO.connect(driftDepth);
        driftDepth.connect(osc1.frequency);
        driftDepth.connect(osc2.frequency);
        driftDepth.connect(osc3.frequency);
        
        // Mix gains
        const osc1Mix = this.context.createGain();
        osc1Mix.gain.value = 0.5;
        
        const osc2Mix = this.context.createGain();
        osc2Mix.gain.value = 0.25;
        osc2Mix.gain.linearRampToValueAtTime(0.35, now + duration * 0.6);
        
        const osc3Mix = this.context.createGain();
        osc3Mix.gain.value = 0.15;
        
        const subMix = this.context.createGain();
        subMix.gain.value = 0.1;
        
        // Main envelope
        const mainGain = this.context.createGain();
        mainGain.gain.value = 0;
        mainGain.gain.linearRampToValueAtTime(0.12, now + 0.05);
        mainGain.gain.linearRampToValueAtTime(0.1, now + duration * 0.3);
        mainGain.gain.exponentialRampToValueAtTime(0.001, now + duration);
        
        // Resonant filter with sweep
        const filter = this.context.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 4000;
        filter.frequency.exponentialRampToValueAtTime(1200, now + duration);
        filter.Q.value = 2;
        filter.Q.linearRampToValueAtTime(0.5, now + duration);
        
        // Chorus
        const chorusDelay = this.context.createDelay(0.03);
        chorusDelay.delayTime.value = 0.015;
        
        const chorusLFO = this.context.createOscillator();
        chorusLFO.type = 'sine';
        chorusLFO.frequency.value = 3;
        
        const chorusDepth = this.context.createGain();
        chorusDepth.gain.value = 0.008;
        
        chorusLFO.connect(chorusDepth);
        chorusDepth.connect(chorusDelay.delayTime);
        
        // Reverb-like delay
        const reverbDelay = this.context.createDelay(0.15);
        reverbDelay.delayTime.value = 0.08 + Math.random() * 0.05;
        
        const reverbFeedback = this.context.createGain();
        reverbFeedback.gain.value = 0.4;
        
        const reverbFilter = this.context.createBiquadFilter();
        reverbFilter.type = 'lowpass';
        reverbFilter.frequency.value = 2000;
        
        reverbDelay.connect(reverbFilter);
        reverbFilter.connect(reverbFeedback);
        reverbFeedback.connect(reverbDelay);
        
        const reverbMix = this.context.createGain();
        reverbMix.gain.value = 0.3;
        
        // Saturation
        const saturation = this.context.createWaveShaper();
        const satCurve = new Float32Array(256);
        for (let i = 0; i < 256; i++) {
            const x = (i / 128) - 1;
            satCurve[i] = Math.tanh(x * 1.2);
        }
        saturation.curve = satCurve;
        
        // Stereo width
        const widener = this.context.createDelay(0.01);
        widener.delayTime.value = 0.003;
        
        const merger = this.context.createChannelMerger(2);
        const splitter = this.context.createChannelSplitter(2);
        
        // Connect oscillators
        osc1.connect(osc1Mix);
        osc2.connect(osc2Mix);
        osc3.connect(osc3Mix);
        subOsc.connect(subMix);
        
        osc1Mix.connect(filter);
        osc2Mix.connect(filter);
        osc3Mix.connect(filter);
        subMix.connect(filter);
        
        filter.connect(chorusDelay);
        chorusDelay.connect(saturation);
        filter.connect(saturation);
        
        saturation.connect(reverbDelay);
        reverbDelay.connect(reverbMix);
        
        saturation.connect(mainGain);
        reverbMix.connect(mainGain);
        
        // Stereo
        mainGain.connect(splitter);
        splitter.connect(merger, 0, 0);
        splitter.connect(widener, 1);
        widener.connect(merger, 0, 1);
        
        merger.connect(this.masterGain);
        
        osc1.start(now);
        osc2.start(now);
        osc3.start(now);
        subOsc.start(now);
        driftLFO.start(now);
        chorusLFO.start(now);
        
        osc1.stop(now + duration + 0.5);
        osc2.stop(now + duration + 0.5);
        osc3.stop(now + duration + 0.5);
        subOsc.stop(now + duration + 0.5);
        driftLFO.stop(now + duration + 0.5);
        chorusLFO.stop(now + duration + 0.5);
    }

    stop() {
        this.isPlaying = false;
    }
}

