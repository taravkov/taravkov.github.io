// Main Raymarching Shader

// --- Vertex Shader ---
struct VertexOutput {
    @builtin(position) Position : vec4f,
    @location(0) uv : vec2f,
};

@vertex
fn vs_main(@builtin(vertex_index) vertexIndex : u32) -> VertexOutput {
    // Fullscreen triangle strip/list
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

// --- Fragment Shader ---

// Scene Mapping
fn map(p: vec3f) -> vec2f {
    let dDesert = mapDesert(p);
    let dCarpet = mapCarpet(p);
    let dArmchair = mapArmchair(p);
    let dEyes = mapEyes(p);
    
    var res = vec2f(dDesert, 1.0);
    if (dCarpet < res.x) { res = vec2f(dCarpet, 2.0); }
    if (dArmchair < res.x) { res = vec2f(dArmchair, 3.0); }
    if (dEyes < res.x) { res = vec2f(dEyes, 4.0); }
    
    return res;
}

fn getNormal(p: vec3f) -> vec3f {
    let d = map(p).x;
    let e = vec2f(0.001, 0.0);
    let n = d - vec3f(
        map(p - e.xyy).x,
        map(p - e.yxy).x,
        map(p - e.yyx).x
    );
    return normalize(n);
}

fn softShadow(ro: vec3f, rd: vec3f, mint: f32, maxt: f32, k: f32) -> f32 {
    var res = 1.0;
    var t = mint;
    for (var i = 0; i < 16; i++) {
        let h = map(ro + rd * t).x;
        if (h < 0.001) { return 0.0; }
        res = min(res, k * h / t);
        t += h;
        if (t > maxt) { break; }
    }
    return res;
}

fn calcAO(pos: vec3f, nor: vec3f) -> f32 {
    var occ = 0.0;
    var sca = 1.0;
    for (var i = 0; i < 5; i++) {
        let h = 0.01 + 0.12 * f32(i) / 4.0;
        let d = map(pos + h * nor).x;
        occ += (h - d) * sca;
        sca *= 0.95;
    }
    return clamp(1.0 - 3.0 * occ, 0.0, 1.0);
}

@fragment
fn fs_main(@location(0) uv : vec2f) -> @location(0) vec4f {
    // Correct UV aspect ratio
    let screenUV = (uv - 0.5) * vec2f(uniforms.resolution.x / uniforms.resolution.y, 1.0) * 2.0;
    
    // Camera
    let ro = uniforms.camPos;
    let yaw = uniforms.camRot.y;
    let pitch = uniforms.camRot.x;
    
    let forward = normalize(vec3f(sin(yaw), sin(pitch), cos(yaw)));
    let right = normalize(cross(vec3f(0.0, 1.0, 0.0), forward));
    let up = cross(forward, right);
    
    let rd = normalize(forward * 1.5 + screenUV.x * right + screenUV.y * up);
    
    // Raymarching
    var t = 0.0;
    var matId = 0.0;
    let MAX_DIST = 100.0;
    
    for (var i = 0; i < 128; i++) {
        let p = ro + rd * t;
        let h = map(p);
        if (abs(h.x) < 0.001 || t > MAX_DIST) {
            matId = h.y;
            break;
        }
        t += h.x;
    }
    
    // Background / Sky
    var col = vec3f(0.0);
    
    if (t < MAX_DIST) {
        let p = ro + rd * t;
        let n = getNormal(p);
        
        // Material
        var albedo = vec3f(0.5);
        var roughness = 0.5;
        
        if (matId == 1.0) { // Desert
            // Custom "Journey" Lighting
            let lightDir = normalize(vec3f(-0.23, 0.87, -0.42)); // Matches Scheme 1 roughly
            let shadow = softShadow(p + n * 0.01, lightDir, 0.02, 20.0, 8.0);
            
            col = getDesertColor(p, n, rd, lightDir, shadow);
            
            // Apply fog on top
            let fogAmount = 1.0 - exp(-t * 0.005); // Slower fog for desert
            let skyFog = renderProteanSky(rd, uniforms.time * 2.0);
            col = mix(col, skyFog, fogAmount);
            
        } else {
            // Standard PBR-ish for others
            if (matId == 2.0) { // Carpet
                // Procedural Carpet Lighting
                // Using shadow from main loop, re-using lighting logic inside getCarpetColor
                // Actually we need to pass shadow and lightDir
                let lightDir = normalize(vec3f(-10.0, 20.0, 20.0));
                let shadow = softShadow(p + n * 0.01, lightDir, 0.02, 20.0, 8.0);
                col = getCarpetColor(p, n, rd, lightDir, shadow);
                
                // Apply fog (indoor/outdoor mix?)
                // Use same fog as desert
                let fogAmount = 1.0 - exp(-t * 0.015);
                let skyFog = renderProteanSky(rd, uniforms.time * 2.0);
                col = mix(col, skyFog, fogAmount);
                
                // Skip default lighting
                // Just return or jump to end?
                // We can't return easily inside if.
                // Let's restructure.
                
            } else {
                // Armchair / Eyes (Standard Lighting)
                
                if (matId == 3.0) { // Armchair
                    albedo = getArmchairMaterial(p);
                    roughness = 0.4;
                } else if (matId == 4.0) { // Eyes
                    albedo = getEyesMaterial(p);
                    roughness = 0.2;
                }
                
                // REFERENCE LIGHTING: Silhouette with glowing sky backlight
                // Very dark front-facing (silhouette effect)
                // Strong rim light from behind (sky glow)
                
                let skyLightDir = normalize(vec3f(0.0, 0.3, 1.0)); // From behind, slightly above
                let v = -rd;
                
                let ndotSky = max(0.0, dot(n, skyLightDir));
                
                // Rim lighting (strong backlight from glowing sky)
                let rim = pow(1.0 - max(0.0, dot(n, v)), 2.0);
                let skyColor = renderProteanSky(skyLightDir, uniforms.time * 2.0);
                
                // Silhouette: mostly dark, only rim lit
                var lin = albedo * 0.02; // Very dark base
                lin += rim * skyColor * 3.0; // Strong colored rim from sky
                
                // For eyes: add glow
                if (matId == 4.0) {
                    lin += albedo * 5.0; // Bright glowing eyes
                }
                
                // Fog
                let fogAmount = 1.0 - exp(-t * 0.01);
                let skyFog = renderProteanSky(rd, uniforms.time * 2.0);
                
                col = mix(lin, skyFog, fogAmount);
            }
        }
    } else {
        // Sky Background
        col = renderProteanSky(rd, uniforms.time * 2.0);
    }
    
    // Reference-style Color Grading: Rich, painterly
    // Boost saturation heavily
    let luminance = dot(col, vec3f(0.299, 0.587, 0.114));
    col = mix(vec3f(luminance), col, 1.6);
    
    // Strong vignette for dramatic focus
    let vignette = 1.0 - smoothstep(0.3, 1.8, length(screenUV));
    col *= 0.3 + 0.7 * vignette;
    
    // Tone Mapping: Preserve highlights (sky glow)
    col = col / (col + vec3f(0.5));
    col = pow(col, vec3f(0.5)); // Brighter overall
    
    // Subtle film grain
    let grain = hash(uv * 1000.0 + vec2f(uniforms.time)) * 0.02;
    col += grain - 0.01;
    
    return vec4f(col, 1.0);
}

