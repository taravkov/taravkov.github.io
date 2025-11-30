export class WebGPURenderer {
    constructor() {
        if (!navigator.gpu) {
            throw new Error("WebGPU not supported on this browser.");
        }
        
        this.canvas = document.createElement('canvas');
        document.body.appendChild(this.canvas);
        
        this.adapter = null;
        this.device = null;
        this.context = null;
        this.format = navigator.gpu.getPreferredCanvasFormat();
        this.pipeline = null;
        this.bindGroup = null;
        this.uniformBuffer = null;
        this.textures = {};
        this.samplers = {};
    }

    async init() {
        this.adapter = await navigator.gpu.requestAdapter();
        if (!this.adapter) {
            throw new Error("No appropriate GPUAdapter found.");
        }
        
        this.device = await this.adapter.requestDevice();
        
        this.context = this.canvas.getContext('webgpu');
        this.resize();
        
        window.addEventListener('resize', () => this.resize());
        
        // Create Uniform Buffer
        // struct Uniforms {
        //   time: f32,
        //   resolution: vec2f,
        //   camPos: vec3f,
        //   camRot: vec2f, // pitch, yaw
        //   padding...
        // }
        // Size: 4 (time) + 8 (res) + 16 (camPos - align 16) + 8 (camRot) = ~36 bytes -> pad to 48 or 64
        // Let's align carefully.
        // uTime (f32), pad, pad, pad
        // uResolution (vec2f), pad, pad
        // uCamPos (vec3f), pad
        // uCamRot (vec2f)
        
        const uniformBufferSize = 64; // Generous padding
        this.uniformBuffer = this.device.createBuffer({
            size: uniformBufferSize,
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
        });

        // Default Sampler
        const sampler = this.device.createSampler({
            magFilter: 'linear',
            minFilter: 'linear',
            mipmapFilter: 'linear',
            addressModeU: 'repeat',
            addressModeV: 'repeat',
            maxAnisotropy: 16,
        });
        this.samplers['default'] = sampler;
    }

    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        this.context.configure({
            device: this.device,
            format: this.format,
            alphaMode: 'premultiplied',
        });
    }

    async createPipeline(wgslCode) {
        const module = this.device.createShaderModule({
            label: 'Main Shader',
            code: wgslCode,
        });

        // Check for compilation info
        const info = await module.getCompilationInfo();
        if (info.messages.length > 0) {
            let hasError = false;
            for (const msg of info.messages) {
                console.log(`${msg.lineNum}:${msg.linePos} - ${msg.message}`);
                if (msg.type === 'error') hasError = true;
            }
            if (hasError) return;
        }

        // Define Layout
        // BindGroup 0:
        // Binding 0: Uniforms
        // Binding 1: Sampler
        // Binding 2: Desert Texture
        // Binding 3: Carpet Texture
        
        const bindGroupLayout = this.device.createBindGroupLayout({
            entries: [
                { binding: 0, visibility: GPUShaderStage.FRAGMENT, buffer: { type: 'uniform' } },
                { binding: 1, visibility: GPUShaderStage.FRAGMENT, sampler: { type: 'filtering' } },
                // Removed textures
            ],
        });

        this.pipeline = this.device.createRenderPipeline({
            layout: this.device.createPipelineLayout({
                bindGroupLayouts: [bindGroupLayout],
            }),
            vertex: {
                module,
                entryPoint: 'vs_main',
            },
            fragment: {
                module,
                entryPoint: 'fs_main',
                targets: [{ format: this.format }],
            },
            primitive: {
                topology: 'triangle-list',
            },
        });

        // Create BindGroup
        this.bindGroup = this.device.createBindGroup({
            layout: bindGroupLayout,
            entries: [
                { binding: 0, resource: { buffer: this.uniformBuffer } },
                { binding: 1, resource: this.samplers['default'] },
            ],
        });
    }

    async loadTexture(name, url) {
        const img = new Image();
        img.src = url;
        await new Promise(r => img.onload = r);
        
        const imageBitmap = await createImageBitmap(img);
        
        const texture = this.device.createTexture({
            size: [imageBitmap.width, imageBitmap.height],
            format: 'rgba8unorm',
            usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST | GPUTextureUsage.RENDER_ATTACHMENT,
        });
        
        this.device.queue.copyExternalImageToTexture(
            { source: imageBitmap },
            { texture: texture },
            [imageBitmap.width, imageBitmap.height]
        );
        
        this.textures[name] = texture;
    }

    render(params) {
        if (!this.pipeline || !this.bindGroup) return;

        // Update Uniforms
        const uniformData = new Float32Array(16); // 64 bytes = 16 floats
        
        uniformData[0] = params.uTime;
        // Padding at 1, 2, 3 implied unused or packed if careful
        
        uniformData[4] = params.uResolution[0];
        uniformData[5] = params.uResolution[1];
        // Padding 6, 7
        
        uniformData[8] = params.uCamPos[0];
        uniformData[9] = params.uCamPos[1];
        uniformData[10] = params.uCamPos[2];
        // Padding 11
        
        uniformData[12] = params.uCamRot[0]; // Pitch
        uniformData[13] = params.uCamRot[1]; // Yaw
        
        this.device.queue.writeBuffer(this.uniformBuffer, 0, uniformData);

        const commandEncoder = this.device.createCommandEncoder();
        const passEncoder = commandEncoder.beginRenderPass({
            colorAttachments: [{
                view: this.context.getCurrentTexture().createView(),
                clearValue: { r: 0, g: 0, b: 0, a: 1 },
                loadOp: 'clear',
                storeOp: 'store',
            }],
        });

        passEncoder.setPipeline(this.pipeline);
        passEncoder.setBindGroup(0, this.bindGroup);
        passEncoder.draw(6); // Draw full screen quad (6 vertices)
        passEncoder.end();

        this.device.queue.submit([commandEncoder.finish()]);
    }
}

