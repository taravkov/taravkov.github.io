// Textured ambient pads

export class AmbientPads {
    constructor(context, masterGain) {
        this.context = context;
        this.masterGain = masterGain;
        this.layers = [];
    }

    init() {
        // Pad 1: Deep evolving pad (purple feeling)
        this.createPad({
            freq: 110,
            type: 'triangle',
            filterFreq: 800,
            filterQ: 2.5,
            lfoRate: 0.08,
            lfoDepth: 15,
            gain: 0.15,
            detune: 0
        });

        // Pad 2: Shimmering high pad (pink feeling)
        this.createPad({
            freq: 440,
            type: 'sine',
            filterFreq: 2200,
            filterQ: 3.0,
            lfoRate: 0.12,
            lfoDepth: 25,
            gain: 0.08,
            detune: 7
        });

        // Pad 3: Mid-range textured pad (moving clouds)
        this.createPad({
            freq: 220,
            type: 'sawtooth',
            filterFreq: 1200,
            filterQ: 1.8,
            lfoRate: 0.15,
            lfoDepth: 40,
            gain: 0.06,
            detune: -5
        });

        // Pad 4: Grainy atmospheric pad (spatial depth)
        this.createPad({
            freq: 165,
            type: 'triangle',
            filterFreq: 600,
            filterQ: 2.2,
            lfoRate: 0.06,
            lfoDepth: 12,
            gain: 0.12,
            detune: 3
        });
    }

    createPad(config) {
        const { freq, type, filterFreq, filterQ, lfoRate, lfoDepth, gain, detune } = config;

        // Main oscillator
        const osc = this.context.createOscillator();
        osc.type = type;
        osc.frequency.value = freq;
        osc.detune.value = detune;

        // Second oscillator for richness (slightly detuned)
        const osc2 = this.context.createOscillator();
        osc2.type = type;
        osc2.frequency.value = freq;
        osc2.detune.value = detune + 5;

        // Filter for texture
        const filter = this.context.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = filterFreq;
        filter.Q.value = filterQ;

        // LFO for filter modulation
        const filterLFO = this.context.createOscillator();
        filterLFO.type = 'sine';
        filterLFO.frequency.value = lfoRate;

        const filterLFOGain = this.context.createGain();
        filterLFOGain.gain.value = lfoDepth;

        filterLFO.connect(filterLFOGain);
        filterLFOGain.connect(filter.frequency);

        // LFO for amplitude (breathing)
        const ampLFO = this.context.createOscillator();
        ampLFO.type = 'sine';
        ampLFO.frequency.value = lfoRate * 0.7;

        const ampLFOGain = this.context.createGain();
        ampLFOGain.gain.value = gain * 0.3;

        const ampGain = this.context.createGain();
        ampGain.gain.value = gain;

        ampLFO.connect(ampLFOGain);
        ampLFOGain.connect(ampGain.gain);

        // Connect chain
        osc.connect(filter);
        osc2.connect(filter);
        filter.connect(ampGain);
        ampGain.connect(this.masterGain);

        this.layers.push({ osc, osc2, filterLFO, ampLFO, filter, ampGain });
    }

    start() {
        this.layers.forEach(({ osc, osc2, filterLFO, ampLFO }) => {
            osc.start();
            osc2.start();
            filterLFO.start();
            ampLFO.start();
        });
    }

    updateFromVisuals(colorIntensity, movement) {
        this.layers.forEach(({ filter, ampGain }, idx) => {
            // Modulate filter brightness
            const baseFreq = [800, 2200, 1200, 600][idx];
            const targetFreq = baseFreq * (0.6 + colorIntensity * 0.8);
            filter.frequency.linearRampToValueAtTime(
                targetFreq,
                this.context.currentTime + 0.5
            );

            // Modulate amplitude
            const baseGain = [0.15, 0.08, 0.06, 0.12][idx];
            const targetGain = baseGain * (0.7 + movement * 0.5);
            ampGain.gain.linearRampToValueAtTime(
                targetGain,
                this.context.currentTime + 0.5
            );
        });
    }
}

