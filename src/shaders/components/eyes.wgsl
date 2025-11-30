// Spiky Eye Creatures - Reference Style

fn mapEyes(p: vec3f) -> f32 {
    let t = uniforms.time;
    
    // Eye 1: Large spiky creature in upper left
    let eye1Pos = vec3f(
        -8.0 + sin(t * 0.2) * 2.0, 
        15.0 + sin(t * 0.4) * 1.5, 
        25.0 + cos(t * 0.2) * 3.0
    );
    let d1 = mapSpikyEye(p, eye1Pos, 2.5, 12);
    
    // Eye 2: Medium spiky creature upper right
    let eye2Pos = vec3f(
        12.0 + cos(t * 0.3) * 3.0,
        18.0 + sin(t * 0.5 + 1.5) * 2.0,
        28.0
    );
    let d2 = mapSpikyEye(p, eye2Pos, 1.8, 10);
    
    // Eye 3: Small spiky creature bottom center
    let eye3Pos = vec3f(
        2.0 + sin(t * 0.25) * 1.5,
        8.0 + cos(t * 0.45 + 3.0) * 1.0,
        22.0
    );
    let d3 = mapSpikyEye(p, eye3Pos, 1.2, 8);
    
    return min(d1, min(d2, d3));
}

fn mapSpikyEye(p: vec3f, center: vec3f, size: f32, spikes: i32) -> f32 {
    let localP = p - center;
    
    // Central eye sphere
    let eyeCore = sdSphere(localP, size * 0.4);
    
    // Spikes radiating outward
    var minSpike = 1000.0;
    
    for (var i = 0; i < spikes; i++) {
        let angle = f32(i) / f32(spikes) * 6.283185;
        let angleY = sin(f32(i) * 0.5) * 0.8; // Vary vertical angle
        
        // Spike direction
        let spikeDir = vec3f(
            cos(angle) * cos(angleY),
            sin(angleY),
            sin(angle) * cos(angleY)
        );
        
        // Spike as elongated cone/capsule
        let spikeLen = size * 1.5;
        let spikeBase = spikeDir * size * 0.3;
        let spikeTip = spikeDir * (size * 0.3 + spikeLen);
        
        // Distance to line segment (capsule)
        let pa = localP - spikeBase;
        let ba = spikeTip - spikeBase;
        let h = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0);
        let d = length(pa - ba * h) - size * 0.08 * (1.0 - h); // Taper to point
        
        minSpike = min(minSpike, d);
    }
    
    // Combine eye and spikes
    return min(eyeCore, minSpike);
}

fn getEyesMaterial(p: vec3f) -> vec3f {
    let t = uniforms.time;
    
    // Find which eye we're on
    let eye1Pos = vec3f(-8.0 + sin(t * 0.2) * 2.0, 15.0 + sin(t * 0.4) * 1.5, 25.0 + cos(t * 0.2) * 3.0);
    let eye2Pos = vec3f(12.0 + cos(t * 0.3) * 3.0, 18.0 + sin(t * 0.5 + 1.5) * 2.0, 28.0);
    let eye3Pos = vec3f(2.0 + sin(t * 0.25) * 1.5, 8.0 + cos(t * 0.45 + 3.0) * 1.0, 22.0);
    
    let d1 = length(p - eye1Pos);
    let d2 = length(p - eye2Pos);
    let d3 = length(p - eye3Pos);
    
    var eyePos = eye1Pos;
    var eyeSize = 2.5;
    
    if (d2 < d1 && d2 < d3) {
        eyePos = eye2Pos;
        eyeSize = 1.8;
    } else if (d3 < d1 && d3 < d2) {
        eyePos = eye3Pos;
        eyeSize = 1.2;
    }
    
    let localP = p - eyePos;
    let distToCore = length(localP);
    
    // Eye core: Bright green iris with dark pupil
    if (distToCore < eyeSize * 0.2) {
        // Pupil
        return vec3f(0.0, 0.0, 0.0);
    } else if (distToCore < eyeSize * 0.4) {
        // Iris: Radial pattern
        let angle = atan2(localP.y, localP.x);
        let radialPattern = sin(angle * 16.0) * 0.5 + 0.5;
        return mix(vec3f(0.0, 0.5, 0.3), vec3f(0.2, 0.9, 0.6), radialPattern);
    } else {
        // Spikes/body: Dark silhouette
        return vec3f(0.0, 0.0, 0.0);
    }
}
