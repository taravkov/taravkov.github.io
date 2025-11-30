// Rare glitch/grain events

export class GlitchLayer {
    constructor(context, masterGain) {
        this.context = context;
        this.masterGain = masterGain;
        this.lastGlitchTime = 0;
        this.isPlaying = false;
    }

    init() {
        // Glitches will be triggered randomly in update
    }

    start() {
        this.isPlaying = true;
        this.scheduleNextGlitch();
    }

    scheduleNextGlitch() {
        if (!this.isPlaying) return;

        // Random interval: 8-20 seconds
        const interval = 8000 + Math.random() * 12000;
        
        setTimeout(() => {
            this.triggerGlitch();
            this.scheduleNextGlitch();
        }, interval);
    }

    triggerGlitch() {
        const glitchType = Math.random() > 0.5 ? 'metallic' : 'granular';
        
        if (glitchType === 'metallic') {
            this.metallicGlitch();
        } else {
            this.granularGlitch();
        }
    }

    // Metallic ping/click glitch (complex sound design)
    metallicGlitch() {
        const now = this.context.currentTime;
        const baseFreq = 2000 + Math.random() * 3000;
        
        // Oscillator 1: High frequency carrier
        const osc1 = this.context.createOscillator();
        osc1.type = 'sine';
        osc1.frequency.value = baseFreq;
        osc1.frequency.exponentialRampToValueAtTime(baseFreq * 2.5, now + 0.08);
        
        // Oscillator 2: Sub harmonic
        const osc2 = this.context.createOscillator();
        osc2.type = 'square';
        osc2.frequency.value = baseFreq * 0.5;
        osc2.frequency.exponentialRampToValueAtTime(baseFreq * 1.5, now + 0.06);
        
        // Oscillator 3: Inharmonic layer
        const osc3 = this.context.createOscillator();
        osc3.type = 'triangle';
        osc3.frequency.value = baseFreq * 1.33;
        osc3.frequency.exponentialRampToValueAtTime(baseFreq * 3, now + 0.1);
        
        // FM modulation
        const modulator = this.context.createOscillator();
        modulator.type = 'sine';
        modulator.frequency.value = 200 + Math.random() * 400;
        
        const modGain = this.context.createGain();
        modGain.gain.value = 500;
        modGain.gain.exponentialRampToValueAtTime(100, now + 0.08);
        
        modulator.connect(modGain);
        modGain.connect(osc1.frequency);
        
        // Noise burst for attack transient
        const noiseBuffer = this.context.createBuffer(1, this.context.sampleRate * 0.02, this.context.sampleRate);
        const noiseData = noiseBuffer.getChannelData(0);
        for (let i = 0; i < noiseData.length; i++) {
            noiseData[i] = (Math.random() * 2 - 1) * Math.exp(-i / (this.context.sampleRate * 0.005));
        }
        const noise = this.context.createBufferSource();
        noise.buffer = noiseBuffer;
        
        const noiseFilter = this.context.createBiquadFilter();
        noiseFilter.type = 'highpass';
        noiseFilter.frequency.value = 5000;
        noiseFilter.Q.value = 5;
        
        // Mix gains
        const osc1Mix = this.context.createGain();
        osc1Mix.gain.value = 0.4;
        
        const osc2Mix = this.context.createGain();
        osc2Mix.gain.value = 0.15;
        
        const osc3Mix = this.context.createGain();
        osc3Mix.gain.value = 0.25;
        
        const noiseMix = this.context.createGain();
        noiseMix.gain.value = 0.2;
        
        // Main envelope
        const mainGain = this.context.createGain();
        mainGain.gain.value = 0;
        mainGain.gain.linearRampToValueAtTime(0.18, now + 0.001);
        mainGain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
        
        // Metallic filter sweep (more extreme)
        const filter = this.context.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.value = 3000;
        filter.frequency.linearRampToValueAtTime(9000, now + 0.08);
        filter.frequency.linearRampToValueAtTime(2000, now + 0.15);
        filter.Q.value = 12;
        
        // Distortion with harmonic folding
        const distortion = this.context.createWaveShaper();
        const distCurve = new Float32Array(256);
        for (let i = 0; i < 256; i++) {
            const x = (i / 128) - 1;
            distCurve[i] = Math.tanh(x * 6) + Math.sin(x * 15) * 0.1;
        }
        distortion.curve = distCurve;
        
        // Ping-pong delay
        const delayL = this.context.createDelay(0.1);
        const delayR = this.context.createDelay(0.1);
        delayL.delayTime.value = 0.04;
        delayR.delayTime.value = 0.065;
        
        const delayFeedback = this.context.createGain();
        delayFeedback.gain.value = 0.3;
        
        delayL.connect(delayFeedback);
        delayFeedback.connect(delayR);
        
        const merger = this.context.createChannelMerger(2);
        
        // Connect chain
        osc1.connect(osc1Mix);
        osc2.connect(osc2Mix);
        osc3.connect(osc3Mix);
        noise.connect(noiseFilter);
        noiseFilter.connect(noiseMix);
        
        osc1Mix.connect(filter);
        osc2Mix.connect(filter);
        osc3Mix.connect(filter);
        noiseMix.connect(filter);
        
        filter.connect(distortion);
        distortion.connect(delayL);
        distortion.connect(delayR);
        delayL.connect(merger, 0, 0);
        delayR.connect(merger, 0, 1);
        merger.connect(mainGain);
        mainGain.connect(this.masterGain);
        
        osc1.start(now);
        osc2.start(now);
        osc3.start(now);
        modulator.start(now);
        noise.start(now);
        
        osc1.stop(now + 0.2);
        osc2.stop(now + 0.2);
        osc3.stop(now + 0.2);
        modulator.stop(now + 0.2);
    }

    // Granular texture glitch (complex layered grains)
    granularGlitch() {
        const now = this.context.currentTime;
        const duration = 0.3 + Math.random() * 0.4;
        
        // Create burst of complex grains
        for (let i = 0; i < 8; i++) {
            const grainDelay = i * 0.05;
            const grainTime = now + grainDelay;
            const grainFreq = 100 + Math.random() * 400;
            
            // Dual oscillators per grain
            const osc1 = this.context.createOscillator();
            osc1.type = 'square';
            osc1.frequency.value = grainFreq;
            osc1.frequency.exponentialRampToValueAtTime(grainFreq * 0.7, grainTime + 0.08);
            
            const osc2 = this.context.createOscillator();
            osc2.type = 'sawtooth';
            osc2.frequency.value = grainFreq * 1.5;
            osc2.detune.value = Math.random() * 20 - 10;
            
            // Noise component per grain
            const noiseBuffer = this.context.createBuffer(1, this.context.sampleRate * 0.05, this.context.sampleRate);
            const noiseData = noiseBuffer.getChannelData(0);
            for (let j = 0; j < noiseData.length; j++) {
                noiseData[j] = (Math.random() * 2 - 1) * Math.exp(-j / (this.context.sampleRate * 0.02));
            }
            const noise = this.context.createBufferSource();
            noise.buffer = noiseBuffer;
            
            // Grain envelope
            const gain = this.context.createGain();
            gain.gain.value = 0;
            gain.gain.linearRampToValueAtTime(0.08, grainTime + 0.01);
            gain.gain.exponentialRampToValueAtTime(0.001, grainTime + 0.08);
            
            // Resonant filter per grain
            const filter = this.context.createBiquadFilter();
            filter.type = 'bandpass';
            filter.frequency.value = 800 + Math.random() * 1200;
            filter.frequency.linearRampToValueAtTime(filter.frequency.value * 1.5, grainTime + 0.04);
            filter.Q.value = 5 + Math.random() * 5;
            
            // Waveshaper for grit
            const shaper = this.context.createWaveShaper();
            const curve = new Float32Array(256);
            for (let j = 0; j < 256; j++) {
                const x = (j / 128) - 1;
                curve[j] = Math.sign(x) * Math.pow(Math.abs(x), 0.6);
            }
            shaper.curve = curve;
            
            // Random pan per grain
            const panner = this.context.createStereoPanner();
            panner.pan.value = Math.random() * 2 - 1;
            
            // Mix oscillators
            const osc1Mix = this.context.createGain();
            osc1Mix.gain.value = 0.5;
            
            const osc2Mix = this.context.createGain();
            osc2Mix.gain.value = 0.3;
            
            const noiseMix = this.context.createGain();
            noiseMix.gain.value = 0.2;
            
            osc1.connect(osc1Mix);
            osc2.connect(osc2Mix);
            noise.connect(noiseMix);
            
            osc1Mix.connect(filter);
            osc2Mix.connect(filter);
            noiseMix.connect(filter);
            
            filter.connect(shaper);
            shaper.connect(panner);
            panner.connect(gain);
            gain.connect(this.masterGain);
            
            osc1.start(grainTime);
            osc2.start(grainTime);
            noise.start(grainTime);
            
            osc1.stop(grainTime + 0.1);
            osc2.stop(grainTime + 0.1);
        }
    }

    stop() {
        this.isPlaying = false;
    }
}

