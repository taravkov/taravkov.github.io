// Deep sub-bass drone

export class SubDrone {
    constructor(context, masterGain) {
        this.context = context;
        this.masterGain = masterGain;
        this.layers = [];
    }

    init() {
        // Deep harmonic drone (complex multi-layer)
        const frequencies = [55, 82.5]; // A1, E2
        
        frequencies.forEach((freq, idx) => {
            // Oscillator 1: Main fundamental
            const osc1 = this.context.createOscillator();
            osc1.type = 'sine';
            osc1.frequency.value = freq;
            
            // Oscillator 2: Detuned for beating
            const osc2 = this.context.createOscillator();
            osc2.type = 'sine';
            osc2.frequency.value = freq;
            osc2.detune.value = 2;
            
            // Oscillator 3: Opposite detune
            const osc3 = this.context.createOscillator();
            osc3.type = 'sine';
            osc3.frequency.value = freq;
            osc3.detune.value = -2;
            
            // Sub-harmonic (octave down)
            const subOsc = this.context.createOscillator();
            subOsc.type = 'sine';
            subOsc.frequency.value = freq / 2;
            
            // Triangle wave for warmth
            const triOsc = this.context.createOscillator();
            triOsc.type = 'triangle';
            triOsc.frequency.value = freq;
            triOsc.detune.value = 1;
            
            // LFO 1: Slow frequency drift
            const lfo1 = this.context.createOscillator();
            lfo1.type = 'sine';
            lfo1.frequency.value = 0.03 + idx * 0.01;
            
            const lfo1Gain = this.context.createGain();
            lfo1Gain.gain.value = 1.5;
            
            lfo1.connect(lfo1Gain);
            lfo1Gain.connect(osc1.frequency);
            lfo1Gain.connect(osc2.frequency);
            lfo1Gain.connect(osc3.frequency);
            
            // LFO 2: Very slow detune modulation
            const lfo2 = this.context.createOscillator();
            lfo2.type = 'triangle';
            lfo2.frequency.value = 0.02 + idx * 0.005;
            
            const lfo2Gain = this.context.createGain();
            lfo2Gain.gain.value = 3;
            
            lfo2.connect(lfo2Gain);
            lfo2Gain.connect(osc2.detune);
            lfo2Gain.connect(osc3.detune);
            
            // Mix gains
            const osc1Mix = this.context.createGain();
            osc1Mix.gain.value = 0.35;
            
            const osc2Mix = this.context.createGain();
            osc2Mix.gain.value = 0.3;
            
            const osc3Mix = this.context.createGain();
            osc3Mix.gain.value = 0.3;
            
            const subMix = this.context.createGain();
            subMix.gain.value = 0.15;
            
            const triMix = this.context.createGain();
            triMix.gain.value = 0.05;
            
            // Soft saturation for warmth
            const saturation = this.context.createWaveShaper();
            const satCurve = new Float32Array(256);
            for (let i = 0; i < 256; i++) {
                const x = (i / 128) - 1;
                satCurve[i] = Math.tanh(x * 1.5);
            }
            saturation.curve = satCurve;
            saturation.oversample = '2x';
            
            // Low-pass filter for smoothness
            const filter = this.context.createBiquadFilter();
            filter.type = 'lowpass';
            filter.frequency.value = 150;
            filter.Q.value = 0.7;
            
            // LFO 3: Filter cutoff modulation
            const filterLFO = this.context.createOscillator();
            filterLFO.type = 'sine';
            filterLFO.frequency.value = 0.08 + idx * 0.02;
            
            const filterLFOGain = this.context.createGain();
            filterLFOGain.gain.value = 20;
            
            filterLFO.connect(filterLFOGain);
            filterLFOGain.connect(filter.frequency);
            
            // Amplitude modulation (breathing)
            const ampLFO = this.context.createOscillator();
            ampLFO.type = 'sine';
            ampLFO.frequency.value = 0.05 + idx * 0.015;
            
            const ampLFODepth = this.context.createGain();
            ampLFODepth.gain.value = 0.03;
            
            const mainGain = this.context.createGain();
            mainGain.gain.value = 0.2 / (idx + 1);
            
            ampLFO.connect(ampLFODepth);
            ampLFODepth.connect(mainGain.gain);
            
            // Stereo widener (very subtle)
            const widener = this.context.createDelay(0.005);
            widener.delayTime.value = 0.002;
            
            const merger = this.context.createChannelMerger(2);
            const splitter = this.context.createChannelSplitter(2);
            
            // Connect oscillators to mix
            osc1.connect(osc1Mix);
            osc2.connect(osc2Mix);
            osc3.connect(osc3Mix);
            subOsc.connect(subMix);
            triOsc.connect(triMix);
            
            // Mix to saturation
            osc1Mix.connect(saturation);
            osc2Mix.connect(saturation);
            osc3Mix.connect(saturation);
            subMix.connect(saturation);
            triMix.connect(saturation);
            
            // Saturation to filter
            saturation.connect(filter);
            
            // Filter to gain
            filter.connect(mainGain);
            
            // Stereo widening
            mainGain.connect(splitter);
            splitter.connect(merger, 0, 0);
            splitter.connect(widener, 1);
            widener.connect(merger, 0, 1);
            
            merger.connect(this.masterGain);
            
            this.layers.push({ 
                osc1, osc2, osc3, subOsc, triOsc, 
                lfo1, lfo2, filterLFO, ampLFO,
                gain: mainGain, filter 
            });
        });
    }

    start() {
        this.layers.forEach(({ osc1, osc2, osc3, subOsc, triOsc, lfo1, lfo2, filterLFO, ampLFO }) => {
            osc1.start();
            osc2.start();
            osc3.start();
            subOsc.start();
            triOsc.start();
            lfo1.start();
            lfo2.start();
            filterLFO.start();
            ampLFO.start();
        });
    }

    updateFromVisuals(colorIntensity, movement) {
        this.layers.forEach(({ gain, filter }, idx) => {
            const baseGain = 0.2 / (idx + 1);
            const targetGain = baseGain * (0.6 + movement * 0.6);
            gain.gain.linearRampToValueAtTime(
                targetGain,
                this.context.currentTime + 0.8
            );
            
            // Modulate filter based on color intensity
            const targetFilterFreq = 130 + colorIntensity * 40;
            filter.frequency.linearRampToValueAtTime(
                targetFilterFreq,
                this.context.currentTime + 1.2
            );
        });
    }
}

