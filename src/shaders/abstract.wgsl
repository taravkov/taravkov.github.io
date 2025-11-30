// Abstract Shader Art - Layered composition system

struct VertexOutput {
    @builtin(position) Position : vec4f,
    @location(0) uv : vec2f,
};

@vertex
fn vs_main(@builtin(vertex_index) vertexIndex : u32) -> VertexOutput {
    var pos = array<vec2f, 6>(
        vec2f(-1.0, -1.0), vec2f(1.0, -1.0), vec2f(-1.0, 1.0),
        vec2f(-1.0, 1.0), vec2f(1.0, -1.0), vec2f(1.0, 1.0)
    );
    
    var output : VertexOutput;
    let xy = pos[vertexIndex];
    output.Position = vec4f(xy, 0.0, 1.0);
    output.uv = xy * 0.5 + 0.5;
    return output;
}

// === ORIGINAL SCENE ELEMENTS ===

fn sdCircle(p: vec2f, r: f32) -> f32 {
    return length(p) - r;
}

fn smoothMin(a: f32, b: f32, k: f32) -> f32 {
    let h = clamp(0.5 + 0.5 * (b - a) / k, 0.0, 1.0);
    return mix(b, a, h) - k * h * (1.0 - h);
}

fn mapBlob(p: vec2f, center: vec2f, size: f32, time: f32) -> f32 {
    let localP = p - center;
    var d = sdCircle(localP, size);
    
    let wobble1 = sdCircle(localP - vec2f(cos(time + 0.0), sin(time + 0.0)) * size * 0.4, size * 0.6);
    let wobble2 = sdCircle(localP - vec2f(cos(time + 2.1), sin(time + 2.1)) * size * 0.5, size * 0.5);
    let wobble3 = sdCircle(localP - vec2f(cos(time + 4.2), sin(time + 4.2)) * size * 0.3, size * 0.7);
    
    d = smoothMin(d, wobble1, size * 0.2);
    d = smoothMin(d, wobble2, size * 0.25);
    d = smoothMin(d, wobble3, size * 0.15);
    
    return d;
}

fn sdBezier(p: vec2f, p0: vec2f, p1: vec2f, p2: vec2f) -> f32 {
    var minDist = 1000.0;
    for (var i = 0; i < 20; i++) {
        let t = f32(i) / 19.0;
        let s = 1.0 - t;
        let pt = s * s * p0 + 2.0 * s * t * p1 + t * t * p2;
        minDist = min(minDist, length(p - pt));
    }
    return minDist;
}

fn sdWave(p: vec2f, y: f32, amplitude: f32, frequency: f32) -> f32 {
    let wave = y + sin(p.x * frequency) * amplitude;
    return abs(p.y - wave);
}

// === LAYER: Liquid Distortion ===

fn distortDomain(p: vec2f, time: f32) -> vec2f {
    var distorted = p;
    
    distorted += vec2f(
        sin(p.y * 3.0 + time * 0.5) * 0.3,
        cos(p.x * 2.5 + time * 0.4) * 0.25
    );
    
    distorted += vec2f(
        sin(p.y * 8.0 - time * 0.8) * 0.15,
        cos(p.x * 6.0 + time * 0.6) * 0.18
    );
    
    distorted += vec2f(
        fbm(p * 4.0 + time * 0.1) * 0.2,
        fbm(p * 5.0 - time * 0.15) * 0.18
    );
    
    return distorted;
}

fn liquidFlowLayer(p: vec2f, time: f32) -> vec4f {
    let distorted = distortDomain(p, time);
    
    let n1 = fbm(distorted * 2.0);
    let n2 = fbm(distorted * 4.0 + vec2f(time * 0.2));
    let n3 = fbm(distorted * 8.0 - vec2f(time * 0.3));
    
    let combined = n1 * 0.5 + n2 * 0.3 + n3 * 0.2;
    
    let yellowRegion = smoothstep(0.6, 0.9, combined);
    
    // Evolving liquid colors
    let liquidCol1 = getPalette(time, 3.0);
    let liquidCol2 = getPalette(time, 3.3);
    let liquidCol3 = getPalette(time, 3.6);
    
    var col = mix(liquidCol1, liquidCol2, yellowRegion);
    
    let transitionMask = smoothstep(0.45, 0.55, combined) * (1.0 - smoothstep(0.55, 0.65, combined));
    col = mix(col, liquidCol3, transitionMask * 0.6);
    
    // Return with alpha for blending control
    let alpha = smoothstep(0.2, 0.8, combined) * 0.75; // 75% max opacity
    
    return vec4f(col, alpha);
}

@fragment
fn fs_main(@location(0) uv : vec2f) -> @location(0) vec4f {
    let t = uniforms.time * 0.3;
    let aspectRatio = uniforms.resolution.x / uniforms.resolution.y;
    
    var p = (uv - 0.5) * 2.0;
    p.x *= aspectRatio;
    
    // === BASE LAYER: Evolving psychedelic background ===
    
    let bgNoise = fbm(uv * 12.0 + vec2f(t * 0.05));
    let bgCol1 = getPalette(t, 0.0); // First color
    let bgCol2 = getPalette(t, 0.3); // Second color
    let bgCol = mix(bgCol1, bgCol2, bgNoise);
    
    var col = bgCol;
    
    // Gradient zones with evolving colors
    let zoneNoise = fbm(uv * 6.0);
    let zoneBlend = smoothstep(0.3, 0.7, p.y + zoneNoise * 0.3);
    let zoneCol1 = getPalette(t, 0.6);
    let zoneCol2 = getPalette(t, 0.9);
    let zoneCol = mix(zoneCol1, zoneCol2, bgNoise);
    col = mix(col, zoneCol, zoneBlend * 0.5);
    
    // Blobs
    let blob1Center = vec2f(-0.8, 0.6) + vec2f(sin(t * 0.5) * 0.1, cos(t * 0.7) * 0.05);
    let blob1 = mapBlob(p, blob1Center, 0.25, t);
    
    if (blob1 < 0.0) {
        let blobCol1 = mix(
            getPalette(t, 1.0),
            getPalette(t, 1.2),
            noise(uv * 10.0)
        );
        let glow1 = exp(-blob1 * blob1 * 20.0);
        col = mix(col, blobCol1, smoothstep(0.02, -0.02, blob1));
        col += blobCol1 * glow1 * 0.3;
    }
    
    let blob2Center = vec2f(-0.1, 0.1) + vec2f(cos(t * 0.6) * 0.08, sin(t * 0.4) * 0.06);
    let blob2 = mapBlob(p, blob2Center, 0.18, t + 2.0);
    
    if (blob2 < 0.0) {
        let blobCol2 = mix(
            getPalette(t, 1.5),
            getPalette(t, 1.7),
            fbm(uv * 15.0)
        );
        col = mix(col, blobCol2, smoothstep(0.02, -0.02, blob2));
    }
    
    let blob3Center = vec2f(0.6, -0.1) + vec2f(sin(t * 0.8) * 0.05, cos(t * 0.5) * 0.08);
    let blob3 = mapBlob(p, blob3Center, 0.2, t + 4.0);
    
    if (blob3 < 0.0) {
        let blobCol3 = mix(
            getPalette(t, 2.0),
            getPalette(t, 2.2),
            noise(uv * 12.0)
        );
        col = mix(col, blobCol3, smoothstep(0.02, -0.02, blob3));
    }
    
    // Wavy ribbon
    let wave = sdWave(p, 0.75, 0.08, 8.0);
    if (wave < 0.05) {
        let waveCol = getPalette(t, 2.5);
        col = mix(col, waveCol, smoothstep(0.05, 0.02, wave));
    }
    
    // === LAYER 2: Liquid distortion (BOOSTED for more presence) ===
    let liquidLayer = liquidFlowLayer(p * 0.5, t * 0.5);
    
    // Mix with stronger alpha blending
    col = mix(col, liquidLayer.rgb, liquidLayer.a * 1.8);
    
    // === LAYER 3: RAZAKA elements (from reference, subtle overlay) ===
    let razakaElements = razakaLayer(p, t);
    
    // Blend RAZAKA layer more subtly
    col = mix(col, razakaElements.rgb, razakaElements.a * 0.35);
    
    // === LAYER 4: Flames (psychedelic checkered ground + rising flames) ===
    let flamesElements = flamesLayer(p, t);
    
    // Soft blend with transition mask
    let flameTransition = smoothstep(0.0, 0.3, flamesElements.a) * 
                          smoothstep(1.0, 0.7, flamesElements.a);
    col = mix(col, flamesElements.rgb, flameTransition * 0.25);
    
    // Heavy grain texture (like reference)
    let grain1 = hash(uv * 1500.0 + vec2f(t * 0.1)) * 0.25;
    let grain2 = hash(uv * 800.0 - vec2f(t * 0.05)) * 0.15;
    let grain = (grain1 + grain2) * 0.5;
    col += grain - 0.2;
    
    // Vignette
    let vignette = 1.0 - length(p) * 0.2;
    col *= vignette;
    
    // Gamma
    col = pow(col, vec3f(0.8));
    
    return vec4f(col, 1.0);
}
