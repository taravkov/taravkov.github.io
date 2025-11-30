// Ambient audio engine synchronized with visuals

import { AmbientPads } from './audio/pads.js';
import { GlitchLayer } from './audio/glitches.js';
import { SubDrone } from './audio/drone.js';
import { SonicParticles } from './audio/particles.js';
import { AtmosphericSweeps } from './audio/sweeps.js';

export class AmbientAudio {
    constructor() {
        this.context = null;
        this.masterGain = null;
        this.noiseNode = null;
        this.isPlaying = false;
        
        // Layer instances
        this.pads = null;
        this.glitches = null;
        this.drone = null;
        this.particles = null;
        this.sweeps = null;
    }

    async init() {
        this.context = new (window.AudioContext || window.webkitAudioContext)();
        
        // Master gain (volume control)
        this.masterGain = this.context.createGain();
        this.masterGain.gain.value = 0.3;
        this.masterGain.connect(this.context.destination);
        
        // Initialize all layers
        this.createPinkNoise();
        
        // Pads disabled - too much presence
        // this.pads = new AmbientPads(this.context, this.masterGain);
        // this.pads.init();
        
        this.glitches = new GlitchLayer(this.context, this.masterGain);
        this.glitches.init();
        
        this.drone = new SubDrone(this.context, this.masterGain);
        this.drone.init();
        
        this.particles = new SonicParticles(this.context, this.masterGain);
        this.particles.init();
        
        this.sweeps = new AtmosphericSweeps(this.context, this.masterGain);
        this.sweeps.init();
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


    start() {
        if (this.isPlaying) return;
        
        // Resume context if suspended (browser autoplay policy)
        if (this.context.state === 'suspended') {
            this.context.resume();
        }
        
        // Start all layers
        // this.pads.start(); // Disabled
        this.drone.start();
        this.glitches.start();
        this.particles.start();
        this.sweeps.start();
        
        this.isPlaying = true;
    }

    // Modulate audio based on visual parameters
    updateFromVisuals(params) {
        if (!this.isPlaying) return;
        
        const { time, colorIntensity = 0.5, movement = 0.5 } = params;
        
        // Update all layers
        // this.pads.updateFromVisuals(colorIntensity, movement); // Disabled
        this.drone.updateFromVisuals(colorIntensity, movement);
    }

    pause() {
        this.masterGain.gain.linearRampToValueAtTime(
            0,
            this.context.currentTime + 0.2
        );
        this.isPlaying = false;
        this.glitches.stop();
        this.particles.stop();
        this.sweeps.stop();
    }

    resume() {
        this.masterGain.gain.linearRampToValueAtTime(
            0.3,
            this.context.currentTime + 0.2
        );
        this.isPlaying = true;
        this.glitches.start();
        this.particles.start();
        this.sweeps.start();
    }

    setVolume(volume) {
        this.masterGain.gain.linearRampToValueAtTime(
            volume,
            this.context.currentTime + 0.1
        );
    }
}

