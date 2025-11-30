import { WebGPURenderer } from './webgpu.js';
import { AmbientAudio } from './audio.js';

// Import abstract shader
import commonWGSL from './shaders/components/common.wgsl?raw';
import razakaWGSL from './shaders/components/razaka.wgsl?raw';
import abstractWGSL from './shaders/abstract.wgsl?raw';

const renderer = new WebGPURenderer();
const audio = new AmbientAudio();

async function init() {
    try {
        await renderer.init();
        
        // Stitch shaders (common utils + razaka layer + abstract)
        const shaderCode = [
            commonWGSL,
            razakaWGSL,
            abstractWGSL
        ].join('\n\n');
        
        await renderer.createPipeline(shaderCode);
        
        // Initialize audio
        await audio.init();
        
        // UI elements
        const startPrompt = document.getElementById('start-prompt');
        const startButton = document.getElementById('start-audio');
        const audioControls = document.getElementById('audio-controls');
        const toggleButton = document.getElementById('toggle-audio');
        
        let audioPlaying = false;
        
        // Start audio on first user interaction
        const startAudio = () => {
            audio.start();
            audioPlaying = true;
            startPrompt.classList.add('hidden');
            audioControls.classList.remove('hidden');
        };
        
        startButton.addEventListener('click', startAudio);
        
        // Play/pause toggle
        toggleButton.addEventListener('click', () => {
            if (audioPlaying) {
                audio.setVolume(0);
                toggleButton.textContent = '▶️';
                audioPlaying = false;
            } else {
                audio.setVolume(0.3);
                toggleButton.textContent = '⏸️';
                audioPlaying = true;
            }
        });
        
        animate();
    } catch (e) {
        console.error(e);
        document.body.innerHTML = `<h1 style="color:white">${e.message}</h1>`;
    }
}

init();

// Camera not needed for 2D abstract art
// Animate time and sync audio

function animate() {
    requestAnimationFrame(animate);
    
    const time = performance.now() / 1000;
    
    // Calculate visual intensity for audio sync
    const colorIntensity = Math.abs(Math.sin(time * 0.1)) * 0.5 + 0.5;
    const movement = Math.abs(Math.sin(time * 0.15 + 1.5)) * 0.5 + 0.5;
    
    // Update audio based on visuals
    audio.updateFromVisuals({
        time,
        colorIntensity,
        movement
    });
    
    renderer.render({
        uTime: time,
        uResolution: [window.innerWidth, window.innerHeight],
        uCamPos: [0, 0, 0], // Not used
        uCamRot: [0, 0]     // Not used
    });
}
