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
