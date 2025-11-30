import { WebGPURenderer } from './webgpu.js';

// Import abstract shader
import commonWGSL from './shaders/components/common.wgsl?raw';
import abstractWGSL from './shaders/abstract.wgsl?raw';

const renderer = new WebGPURenderer();

async function init() {
    try {
        await renderer.init();
        
        // Stitch shaders (only need common utils + abstract)
        const shaderCode = [
            commonWGSL,
            abstractWGSL
        ].join('\n\n');
        
        await renderer.createPipeline(shaderCode);
        
        animate();
    } catch (e) {
        console.error(e);
        document.body.innerHTML = `<h1 style="color:white">${e.message}</h1>`;
    }
}

init();

// Camera not needed for 2D abstract art
// Just animate time

function animate() {
    requestAnimationFrame(animate);
    
    renderer.render({
        uTime: performance.now() / 1000,
        uResolution: [window.innerWidth, window.innerHeight],
        uCamPos: [0, 0, 0], // Not used
        uCamRot: [0, 0]     // Not used
    });
}
