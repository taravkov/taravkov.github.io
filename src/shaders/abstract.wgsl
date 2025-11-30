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

// === LAYER: Technical Diagrams ===

// Grid pattern
fn technicalGrid(p: vec2f, spacing: f32, thickness: f32) -> f32 {
    let grid = abs(fract2(p / spacing - 0.5) - 0.5) / (spacing * 0.5);
    return min(grid.x, grid.y) - thickness;
}

// Dotted line
fn dottedLine(p: vec2f, y: f32, dotSpacing: f32, dotSize: f32) -> f32 {
    let distToLine = abs(p.y - y);
    let xMod = fract((p.x + 100.0) / dotSpacing);
    let dotMask = smoothstep(0.5 + dotSize, 0.5 - dotSize, abs(xMod - 0.5));
    return distToLine * (1.0 - dotMask * 0.8);
}

// Circle with radius markers
fn technicalCircle(p: vec2f, center: vec2f, radius: f32, thickness: f32) -> f32 {
    return abs(length(p - center) - radius) - thickness;
}

// Arrow/flow lines
fn flowLine(p: vec2f, start: vec2f, end: vec2f, thickness: f32) -> f32 {
    let pa = p - start;
    let ba = end - start;
    let h = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0);
    return length(pa - ba * h) - thickness;
}

fn technicalLayer(p: vec2f, time: f32) -> vec4f {
    var dist = 1000.0;
    
    // Thin grid (very subtle)
    let grid = technicalGrid(p, 0.5, 0.002);
    dist = min(dist, grid);
    
    // Horizontal dotted lines at transition zone
    let dottedLine1 = dottedLine(p, -0.25, 0.08, 0.015);
    let dottedLine2 = dottedLine(p, -0.35, 0.1, 0.012);
    let dottedLine3 = dottedLine(p, -0.45, 0.09, 0.013);
    
    dist = min(dist, dottedLine1);
    dist = min(dist, dottedLine2);
    dist = min(dist, dottedLine3);
    
    // Small technical circles scattered
    let circle1 = technicalCircle(p, vec2f(-0.7, -0.3), 0.15, 0.003);
    let circle2 = technicalCircle(p, vec2f(0.6, -0.4), 0.12, 0.003);
    let circle3 = technicalCircle(p, vec2f(0.0, -0.5), 0.08, 0.002);
    
    dist = min(dist, min(circle1, min(circle2, circle3)));
    
    // Flow arrows
    let arrow1 = flowLine(p, vec2f(-0.9, -0.3), vec2f(-0.5, -0.3), 0.002);
    let arrow2 = flowLine(p, vec2f(0.4, -0.4), vec2f(0.8, -0.4), 0.002);
    
    dist = min(dist, min(arrow1, arrow2));
    
    // Vertical measurement lines
    let vLine1 = abs(p.x + 0.85) - 0.001;
    let vLine2 = abs(p.x - 0.85) - 0.001;
    if (p.y > -0.6 && p.y < -0.2) {
        dist = min(dist, min(vLine1, vLine2));
    }
    
    // Color: red/blue technical pen style
    let colorMix = sin(p.x * 10.0 + time) * 0.5 + 0.5;
    let techRed = vec3f(0.8, 0.2, 0.3);
    let techBlue = vec3f(0.2, 0.3, 0.8);
    let lineColor = mix(techRed, techBlue, colorMix);
    
    // Anti-aliased line rendering
    let alpha = smoothstep(0.005, 0.0, dist);
    
    return vec4f(lineColor, alpha * 0.6); // 60% opacity
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
    
    let pink = vec3f(0.98, 0.3, 0.7);
    let yellow = vec3f(1.0, 0.85, 0.1);
    let brown = vec3f(0.6, 0.3, 0.1);
    
    var col = mix(pink, yellow, yellowRegion);
    
    let transitionMask = smoothstep(0.45, 0.55, combined) * (1.0 - smoothstep(0.55, 0.65, combined));
    col = mix(col, brown, transitionMask * 0.6);
    
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
    
    // === BASE LAYER: Original Kandinsky/Miro composition ===
    
    let bgNoise = fbm(uv * 8.0 + vec2f(t * 0.1));
    let bgCol = mix(vec3f(0.15, 0.45, 0.4), vec3f(0.2, 0.55, 0.45), bgNoise);
    
    var col = bgCol;
    
    // Ground (with softer transition)
    let groundTransition = smoothstep(-0.2, -0.4, p.y); // Softer edge
    if (groundTransition > 0.0) {
        let groundNoise = fbm(uv * 12.0);
        let groundBase = mix(
            vec3f(0.95, 0.7, 0.3),
            vec3f(0.9, 0.4, 0.6),
            noise(uv * 6.0)
        );
        let groundCol = mix(groundBase, vec3f(0.95, 0.5, 0.7), groundNoise * 0.5);
        col = mix(col, groundCol, groundTransition);
    }
    
    // Blobs
    let blob1Center = vec2f(-0.8, 0.6) + vec2f(sin(t * 0.5) * 0.1, cos(t * 0.7) * 0.05);
    let blob1 = mapBlob(p, blob1Center, 0.25, t);
    
    if (blob1 < 0.0) {
        let blobCol1 = mix(
            vec3f(1.0, 0.8, 0.3),
            vec3f(1.0, 0.5, 0.6),
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
            vec3f(0.95, 0.4, 0.7),
            vec3f(0.3, 0.7, 0.5),
            fbm(uv * 15.0)
        );
        col = mix(col, blobCol2, smoothstep(0.02, -0.02, blob2));
    }
    
    let blob3Center = vec2f(0.6, -0.1) + vec2f(sin(t * 0.8) * 0.05, cos(t * 0.5) * 0.08);
    let blob3 = mapBlob(p, blob3Center, 0.2, t + 4.0);
    
    if (blob3 < 0.0) {
        let blobCol3 = mix(
            vec3f(1.0, 0.6, 0.4),
            vec3f(0.95, 0.8, 0.3),
            noise(uv * 12.0)
        );
        col = mix(col, blobCol3, smoothstep(0.02, -0.02, blob3));
    }
    
    // Curved lines
    let line1 = sdBezier(p, vec2f(-1.2, 0.9), vec2f(-0.5, 0.7), vec2f(0.2, 0.3));
    if (line1 < 0.01) {
        col = mix(col, vec3f(0.95, 0.85, 0.3), smoothstep(0.01, 0.005, line1));
    }
    
    let line2 = sdBezier(p, vec2f(-0.6, -0.2), vec2f(0.0, 0.4), vec2f(0.8, 0.1));
    if (line2 < 0.008) {
        col = mix(col, vec3f(0.9, 0.8, 0.25), smoothstep(0.008, 0.004, line2));
    }
    
    let line3 = sdBezier(p, vec2f(-0.3, -0.6), vec2f(0.1, -0.4), vec2f(0.6, -0.5));
    if (line3 < 0.006) {
        col = mix(col, vec3f(0.85, 0.75, 0.2), smoothstep(0.006, 0.003, line3));
    }
    
    // Wavy ribbon
    let wave = sdWave(p, 0.75, 0.08, 8.0);
    if (wave < 0.05) {
        let waveCol = vec3f(0.95, 0.5, 0.65);
        col = mix(col, waveCol, smoothstep(0.05, 0.02, wave));
    }
    
    // === LAYER 2: Liquid distortion (stronger overlay) ===
    let liquidLayer = liquidFlowLayer(p * 0.5, t * 0.5);
    
    // Mix with alpha blending (stronger presence)
    col = mix(col, liquidLayer.rgb, liquidLayer.a * 1.2);
    
    // === LAYER 3: Technical diagrams (transition masking) ===
    let techLayer = technicalLayer(p, t);
    
    // Blend technical layer (helps mask transition)
    col = mix(col, techLayer.rgb, techLayer.a);
    
    // Texture grain
    let grain = hash(uv * 1000.0 + vec2f(t)) * 0.15;
    col += grain - 0.075;
    
    // Vignette
    let vignette = 1.0 - length(p) * 0.2;
    col *= vignette;
    
    // Gamma
    col = pow(col, vec3f(0.8));
    
    return vec4f(col, 1.0);
}
