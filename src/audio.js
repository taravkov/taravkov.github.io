// Ambient audio engine synchronized with visuals

export class AmbientAudio {
    constructor() {
        this.context = null;
        this.masterGain = null;
        this.oscillators = [];
        this.noiseNode = null;
        this.isPlaying = false;
    }

    async init() {
        this.context = new (window.AudioContext || window.webkitAudioContext)();
        
        // Master gain (volume control)
        this.masterGain = this.context.createGain();
        this.masterGain.gain.value = 0.3;
        this.masterGain.connect(this.context.destination);
        
        // Create pink noise (softer than white noise)
        this.createPinkNoise();
        
        // Create evolving drone layers
        this.createDroneLayers();
        
        // Create subtle pads
        this.createPadLayers();
    }

    createPinkNoise() {
        const bufferSize = 4096;
        const pinkNoise = this.context.createScriptProcessor(bufferSize, 1, 1);
        
        let b0, b1, b2, b3, b4, b5, b6;
        b0 = b1 = b2 = b3 = b4 = b5 = b6 = 0.0;
        
        pinkNoise.onaudioprocess = (e) => {
            const output = e.outputBuffer.getChannelData(0);
            for (let i = 0; i < bufferSize; i++) {
                const white = Math.random() * 2 - 1;
                b0 = 0.99886 * b0 + white * 0.0555179;
                b1 = 0.99332 * b1 + white * 0.0750759;
                b2 = 0.96900 * b2 + white * 0.1538520;
                b3 = 0.86650 * b3 + white * 0.3104856;
                b4 = 0.55000 * b4 + white * 0.5329522;
                b5 = -0.7616 * b5 - white * 0.0168980;
                output[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.11;
                b6 = white * 0.115926;
            }
        };
        
        // Filter for pink noise
        const noiseFilter = this.context.createBiquadFilter();
        noiseFilter.type = 'lowpass';
        noiseFilter.frequency.value = 800;
        noiseFilter.Q.value = 0.5;
        
        const noiseGain = this.context.createGain();
        noiseGain.gain.value = 0.08;
        
        pinkNoise.connect(noiseFilter);
        noiseFilter.connect(noiseGain);
        noiseGain.connect(this.masterGain);
        
        this.noiseNode = pinkNoise;
    }

    createDroneLayers() {
        // Deep drone base frequencies (purple/blue feeling)
        const droneFreqs = [55, 82.5, 110, 165]; // A1, E2, A2, E3
        
        droneFreqs.forEach((freq, idx) => {
            const osc = this.context.createOscillator();
            osc.type = 'sine';
            osc.frequency.value = freq;
            
            const gain = this.context.createGain();
            gain.gain.value = 0.12 / (idx + 1); // Quieter for higher freqs
            
            // LFO for slow modulation
            const lfo = this.context.createOscillator();
            lfo.type = 'sine';
            lfo.frequency.value = 0.08 + idx * 0.02; // Slow modulation
            
            const lfoGain = this.context.createGain();
            lfoGain.gain.value = 2 + idx * 0.5;
            
            lfo.connect(lfoGain);
            lfoGain.connect(osc.frequency);
            
            osc.connect(gain);
            gain.connect(this.masterGain);
            
            this.oscillators.push({ osc, lfo, gain });
        });
    }

    createPadLayers() {
        // Higher frequency pads (pink/purple feeling)
        const padFreqs = [220, 330, 440, 660]; // A3, E4, A4, E5
        
        padFreqs.forEach((freq, idx) => {
            const osc = this.context.createOscillator();
            osc.type = 'triangle';
            osc.frequency.value = freq;
            
            const gain = this.context.createGain();
            gain.gain.value = 0.05 / (idx + 1);
            
            // Filter for warmth
            const filter = this.context.createBiquadFilter();
            filter.type = 'lowpass';
            filter.frequency.value = 2000 - idx * 200;
            filter.Q.value = 1.5;
            
            // LFO for pad modulation
            const lfo = this.context.createOscillator();
            lfo.type = 'sine';
            lfo.frequency.value = 0.15 + idx * 0.05;
            
            const lfoGain = this.context.createGain();
            lfoGain.gain.value = 3 + idx;
            
            lfo.connect(lfoGain);
            lfoGain.connect(osc.frequency);
            
            osc.connect(filter);
            filter.connect(gain);
            gain.connect(this.masterGain);
            
            this.oscillators.push({ osc, lfo, gain, filter });
        });
    }

    start() {
        if (this.isPlaying) return;
        
        // Resume context if suspended (browser autoplay policy)
        if (this.context.state === 'suspended') {
            this.context.resume();
        }
        
        // Start all oscillators
        this.oscillators.forEach(({ osc, lfo }) => {
            osc.start();
            lfo.start();
        });
        
        this.isPlaying = true;
    }

    stop() {
        if (!this.isPlaying) return;
        
        this.oscillators.forEach(({ osc, lfo }) => {
            osc.stop();
            lfo.stop();
        });
        
        this.isPlaying = false;
    }

    // Modulate audio based on visual parameters
    updateFromVisuals(params) {
        if (!this.isPlaying) return;
        
        const { time, colorIntensity = 0.5, movement = 0.5 } = params;
        
        // Modulate master volume based on visual intensity
        const targetVolume = 0.2 + colorIntensity * 0.2;
        this.masterGain.gain.linearRampToValueAtTime(
            targetVolume,
            this.context.currentTime + 0.5
        );
        
        // Modulate drone layers based on movement
        this.oscillators.slice(0, 4).forEach(({ gain }, idx) => {
            const targetGain = (0.12 / (idx + 1)) * (0.8 + movement * 0.4);
            gain.gain.linearRampToValueAtTime(
                targetGain,
                this.context.currentTime + 0.5
            );
        });
        
        // Modulate pad brightness based on color intensity
        this.oscillators.slice(4).forEach(({ filter }, idx) => {
            if (filter) {
                const targetFreq = (2000 - idx * 200) * (0.7 + colorIntensity * 0.6);
                filter.frequency.linearRampToValueAtTime(
                    targetFreq,
                    this.context.currentTime + 0.3
                );
            }
        });
    }

    setVolume(volume) {
        this.masterGain.gain.linearRampToValueAtTime(
            volume,
            this.context.currentTime + 0.1
        );
    }
}

