// Common utilities, noise, SDF primitives

struct Uniforms {
    time: f32,
    pad1: f32,
    pad2: f32,
    pad3: f32,
    resolution: vec2f,
    pad4: vec2f,
    camPos: vec3f,
    pad5: f32,
    camRot: vec2f,
    pad6: vec2f,
};

@group(0) @binding(0) var<uniform> uniforms: Uniforms;
@group(0) @binding(1) var mySampler: sampler;
// Textures removed

// --- Math ---

fn fract(x: f32) -> f32 { return x - floor(x); }
fn fract2(v: vec2f) -> vec2f { return v - floor(v); }
fn fract3(v: vec3f) -> vec3f { return v - floor(v); }

fn rotateY(p: vec3f, angle: f32) -> vec3f {
    let c = cos(angle);
    let s = sin(angle);
    return vec3f(c*p.x + s*p.z, p.y, -s*p.x + c*p.z);
}

// --- Noise ---

fn hash(p: vec2f) -> f32 {
    return fract(sin(dot(p, vec2f(12.9898, 78.233))) * 43758.5453);
}

fn noise(p: vec2f) -> f32 {
    let i = floor(p);
    let f = fract2(p);
    let u = f * f * (3.0 - 2.0 * f);
    
    return mix(mix(hash(i + vec2f(0.0, 0.0)), 
                   hash(i + vec2f(1.0, 0.0)), u.x),
               mix(hash(i + vec2f(0.0, 1.0)), 
                   hash(i + vec2f(1.0, 1.0)), u.x), u.y);
}

fn fbm(p: vec2f) -> f32 {
    var v = 0.0;
    var a = 0.5;
    var shift = vec2f(100.0);
    var pos = p;
    // Rotate to reduce axial bias
    let rot = mat2x2f(cos(0.5), sin(0.5), -sin(0.5), cos(0.5));
    for (var i = 0; i < 4; i++) {
        v += a * noise(pos);
        pos = rot * pos * 2.0 + shift;
        a *= 0.5;
    }
    return v;
}

// --- Primitives ---

fn sdSphere(p: vec3f, s: f32) -> f32 {
    return length(p) - s;
}

fn sdBox(p: vec3f, b: vec3f) -> f32 {
    let q = abs(p) - b;
    return length(max(q, vec3f(0.0))) + min(max(q.x, max(q.y, q.z)), 0.0);
}

fn sdRoundBox(p: vec3f, b: vec3f, r: f32) -> f32 {
    let q = abs(p) - b;
    return length(max(q, vec3f(0.0))) + min(max(q.x, max(q.y, q.z)), 0.0) - r;
}

fn sdCappedCylinder(p: vec3f, h: f32, r: f32) -> f32 {
  let d = abs(vec2f(length(p.xz),p.y)) - vec2f(r,h);
  return min(max(d.x,d.y),0.0) + length(max(d,vec2f(0.0)));
}

fn sdCapsule(p: vec3f, a: vec3f, b: vec3f, r: f32) -> f32 {
    let pa = p - a;
    let ba = b - a;
    let h = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0);
    return length(pa - ba * h) - r;
}

fn opSmoothUnion(d1: f32, d2: f32, k: f32) -> f32 {
    let h = clamp(0.5 + 0.5 * (d2 - d1) / k, 0.0, 1.0);
    return mix(d2, d1, h) - k * h * (1.0 - h);
}

fn opSubtraction(d1: f32, d2: f32) -> f32 {
    return max(-d1, d2);
}

// --- Color Palette Generation ---

// Smooth interpolation function (quintic for very smooth transitions)
fn smootherStep(t: f32) -> f32 {
    return t * t * t * (t * (t * 6.0 - 15.0) + 10.0);
}

// Generate smooth evolving color based on time (no green/yellow)
fn evolvingColor(baseHue: f32, time: f32, seed: f32) -> vec3f {
    // Map to pink/purple/blue/red range, avoiding green (0.15-0.5) and yellow (0.1-0.15)
    // Use ranges: 0.5-1.0 (purple to pink/red) and 0.0-0.1 (red)
    
    // Much slower, smoother modulation
    let slowTime = time * 0.08;
    let rawHue = fract(baseHue + sin(slowTime + seed) * 0.15 + cos(slowTime * 0.7 + seed * 1.3) * 0.1);
    
    // Smooth blend between color zones to avoid harsh transitions
    let zoneFactor = smootherStep(fract(rawHue));
    
    // Remap with smooth interpolation
    let hue1 = 0.55 + zoneFactor * 0.9;  // Purple/blue/pink range
    let hue2 = zoneFactor * 0.2 - 0.1;   // Deep red range
    
    let hue = mix(hue1, hue2, smootherStep(smoothstep(0.4, 0.6, rawHue)));
    
    // Slower, smoother sat/val changes
    let sat = 0.5 + sin(slowTime * 0.6 + seed * 1.5) * 0.2 + cos(slowTime * 0.4 + seed * 2.0) * 0.1;
    let val = 0.6 + sin(slowTime * 0.5 + seed * 2.0) * 0.15 + cos(slowTime * 0.3 + seed * 1.2) * 0.1;
    
    // HSV to RGB
    let c = vec3f(hue, clamp(sat, 0.3, 0.8), clamp(val, 0.4, 0.8));
    let k = vec3f(1.0, 2.0 / 3.0, 1.0 / 3.0);
    let p = abs(fract3(vec3f(c.x) + k) * 6.0 - vec3f(3.0));
    return c.z * mix(vec3f(1.0), clamp(p - vec3f(1.0), vec3f(0.0), vec3f(1.0)), c.y);
}

// Get palette for specific layer
fn getPalette(time: f32, layerId: f32) -> vec3f {
    // Very slow cycling through color space with layer offset
    let baseHue = fract(time * 0.03 + layerId * 0.25);
    return evolvingColor(baseHue, time, layerId);
}
