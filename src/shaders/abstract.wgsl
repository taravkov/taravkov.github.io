// Abstract Shader Art - Kandinsky/Miro style

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

// SDF for blobs
fn sdCircle(p: vec2f, r: f32) -> f32 {
    return length(p) - r;
}

fn smoothMin(a: f32, b: f32, k: f32) -> f32 {
    let h = clamp(0.5 + 0.5 * (b - a) / k, 0.0, 1.0);
    return mix(b, a, h) - k * h * (1.0 - h);
}

// Organic blob using metaballs
fn mapBlob(p: vec2f, center: vec2f, size: f32, time: f32) -> f32 {
    let localP = p - center;
    
    // Main circle
    var d = sdCircle(localP, size);
    
    // Add wobbles
    let wobble1 = sdCircle(localP - vec2f(cos(time + 0.0), sin(time + 0.0)) * size * 0.4, size * 0.6);
    let wobble2 = sdCircle(localP - vec2f(cos(time + 2.1), sin(time + 2.1)) * size * 0.5, size * 0.5);
    let wobble3 = sdCircle(localP - vec2f(cos(time + 4.2), sin(time + 4.2)) * size * 0.3, size * 0.7);
    
    d = smoothMin(d, wobble1, size * 0.2);
    d = smoothMin(d, wobble2, size * 0.25);
    d = smoothMin(d, wobble3, size * 0.15);
    
    return d;
}

// Curved line segment
fn sdLineSegment(p: vec2f, a: vec2f, b: vec2f) -> f32 {
    let pa = p - a;
    let ba = b - a;
    let h = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0);
    return length(pa - ba * h);
}

// Bezier curve approximation
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

// Wavy ribbon
fn sdWave(p: vec2f, y: f32, amplitude: f32, frequency: f32) -> f32 {
    let wave = y + sin(p.x * frequency) * amplitude;
    return abs(p.y - wave);
}

@fragment
fn fs_main(@location(0) uv : vec2f) -> @location(0) vec4f {
    let t = uniforms.time * 0.3;
    let aspectRatio = uniforms.resolution.x / uniforms.resolution.y;
    
    // Correct aspect ratio
    var p = (uv - 0.5) * 2.0;
    p.x *= aspectRatio;
    
    // === BACKGROUND: Teal/Green textured ===
    let bgNoise = fbm(uv * 8.0 + vec2f(t * 0.1));
    let bgCol = mix(vec3f(0.15, 0.45, 0.4), vec3f(0.2, 0.55, 0.45), bgNoise);
    
    var col = bgCol;
    
    // === GROUND: Pink/Yellow textured bottom ===
    if (p.y < -0.3) {
        let groundNoise = fbm(uv * 12.0);
        let groundBase = mix(
            vec3f(0.95, 0.7, 0.3),  // Yellow
            vec3f(0.9, 0.4, 0.6),   // Pink
            noise(uv * 6.0)
        );
        col = mix(groundBase, vec3f(0.95, 0.5, 0.7), groundNoise * 0.5);
    }
    
    // === BLOBS: Pink/Orange glowing organic shapes ===
    
    // Large blob top-left
    let blob1Center = vec2f(-0.8, 0.6) + vec2f(sin(t * 0.5) * 0.1, cos(t * 0.7) * 0.05);
    let blob1 = mapBlob(p, blob1Center, 0.25, t);
    
    if (blob1 < 0.0) {
        let blobCol1 = mix(
            vec3f(1.0, 0.8, 0.3),   // Yellow
            vec3f(1.0, 0.5, 0.6),   // Pink
            noise(uv * 10.0)
        );
        let glow1 = exp(-blob1 * blob1 * 20.0);
        col = mix(col, blobCol1, smoothstep(0.02, -0.02, blob1));
        col += blobCol1 * glow1 * 0.3;
    }
    
    // Medium blob center
    let blob2Center = vec2f(-0.1, 0.1) + vec2f(cos(t * 0.6) * 0.08, sin(t * 0.4) * 0.06);
    let blob2 = mapBlob(p, blob2Center, 0.18, t + 2.0);
    
    if (blob2 < 0.0) {
        let blobCol2 = mix(
            vec3f(0.95, 0.4, 0.7),  // Pink
            vec3f(0.3, 0.7, 0.5),   // Teal accent
            fbm(uv * 15.0)
        );
        col = mix(col, blobCol2, smoothstep(0.02, -0.02, blob2));
    }
    
    // Small blob bottom-right
    let blob3Center = vec2f(0.6, -0.1) + vec2f(sin(t * 0.8) * 0.05, cos(t * 0.5) * 0.08);
    let blob3 = mapBlob(p, blob3Center, 0.2, t + 4.0);
    
    if (blob3 < 0.0) {
        let blobCol3 = mix(
            vec3f(1.0, 0.6, 0.4),   // Orange
            vec3f(0.95, 0.8, 0.3),  // Yellow
            noise(uv * 12.0)
        );
        col = mix(col, blobCol3, smoothstep(0.02, -0.02, blob3));
    }
    
    // === CURVED LINES: Thin golden threads ===
    
    // Line 1: Top-left diagonal
    let line1 = sdBezier(
        p,
        vec2f(-1.2, 0.9),
        vec2f(-0.5, 0.7),
        vec2f(0.2, 0.3)
    );
    if (line1 < 0.01) {
        col = mix(col, vec3f(0.95, 0.85, 0.3), smoothstep(0.01, 0.005, line1));
    }
    
    // Line 2: Center curve
    let line2 = sdBezier(
        p,
        vec2f(-0.6, -0.2),
        vec2f(0.0, 0.4),
        vec2f(0.8, 0.1)
    );
    if (line2 < 0.008) {
        col = mix(col, vec3f(0.9, 0.8, 0.25), smoothstep(0.008, 0.004, line2));
    }
    
    // Line 3: Bottom curve
    let line3 = sdBezier(
        p,
        vec2f(-0.3, -0.6),
        vec2f(0.1, -0.4),
        vec2f(0.6, -0.5)
    );
    if (line3 < 0.006) {
        col = mix(col, vec3f(0.85, 0.75, 0.2), smoothstep(0.006, 0.003, line3));
    }
    
    // === WAVY RIBBON: Pink wave at top ===
    let wave = sdWave(p, 0.75, 0.08, 8.0);
    if (wave < 0.05) {
        let waveCol = vec3f(0.95, 0.5, 0.65);
        col = mix(col, waveCol, smoothstep(0.05, 0.02, wave));
    }
    
    // === TEXTURE GRAIN ===
    let grain = hash(uv * 1000.0 + vec2f(t)) * 0.15;
    col += grain - 0.075;
    
    // === VIGNETTE (subtle) ===
    let vignette = 1.0 - length(p) * 0.2;
    col *= vignette;
    
    // Gamma correction
    col = pow(col, vec3f(0.8));
    
    return vec4f(col, 1.0);
}

