// Flames layer - Psychedelic warped checkered ground with rising flame ribbons

// Warped checkerboard pattern
fn warpedChecker(p: vec2f, time: f32) -> f32 {
    // Domain warping for liquid distortion
    var warped = p;
    
    warped += vec2f(
        sin(p.y * 4.0 + time * 0.3) * 0.4,
        cos(p.x * 3.0 + time * 0.25) * 0.35
    );
    
    warped += vec2f(
        fbm(p * 3.0 + time * 0.1) * 0.3,
        fbm(p * 2.5 - time * 0.08) * 0.25
    );
    
    // Perspective scaling (larger at bottom)
    let perspectiveFactor = 1.0 + p.y * 0.8;
    warped.x *= perspectiveFactor;
    
    // Checkerboard
    let checker = (floor(warped.x * 8.0) + floor(warped.y * 6.0)) % 2.0;
    
    return checker;
}

// Organic flame ribbon
fn flameRibbon(p: vec2f, center: vec2f, time: f32, seed: f32) -> f32 {
    let localP = p - center;
    
    // Vertical flame shape with curves
    var ribbonDist = abs(localP.x - sin(localP.y * 3.0 + time + seed) * 0.15) - 0.08;
    
    // Add organic bulges
    let bulge1 = sin(localP.y * 8.0 + time * 2.0 + seed) * 0.03;
    let bulge2 = sin(localP.y * 12.0 - time * 1.5 + seed * 2.0) * 0.02;
    ribbonDist += bulge1 + bulge2;
    
    // Taper at top and bottom
    let taper = smoothstep(-0.6, -0.2, localP.y) * smoothstep(0.8, 0.4, localP.y);
    ribbonDist /= (taper + 0.1);
    
    return ribbonDist;
}

// Soft organic cloud/smoke shapes
fn organicCloud(p: vec2f, center: vec2f, size: f32, time: f32, seed: f32) -> f32 {
    let localP = p - center;
    
    // Multi-scale noise for cloud shape
    var cloud = 0.0;
    cloud += fbm(localP * 2.0 + time * 0.1 + seed) * 0.5;
    cloud += fbm(localP * 4.0 - time * 0.15 + seed * 1.5) * 0.3;
    cloud += fbm(localP * 8.0 + time * 0.2 + seed * 2.0) * 0.2;
    
    // Radial falloff
    let radial = 1.0 - length(localP) / size;
    cloud *= smoothstep(0.0, 0.5, radial);
    
    return cloud;
}

// Main flames layer
fn flamesLayer(p: vec2f, time: f32) -> vec4f {
    var col = vec3f(0.0);
    
    // === WARPED CHECKERED GROUND (bottom half) ===
    let checker = warpedChecker(p, time);
    
    // Ground mask (bottom portion)
    let groundMask = smoothstep(0.0, -0.3, p.y);
    
    if (groundMask > 0.01) {
        let checkerCol1 = vec3f(0.05, 0.05, 0.08); // Dark blue-black
        let checkerCol2 = vec3f(0.85, 0.85, 0.9); // Off-white
        
        var checkerCol = mix(checkerCol1, checkerCol2, checker);
        
        // Add purple/pink tint to some squares
        let tintNoise = fbm(p * 5.0);
        if (checker > 0.5 && tintNoise > 0.6) {
            let tintCol = getPalette(time, 8.0);
            checkerCol = mix(checkerCol, tintCol * 0.6, 0.5);
        }
        
        col = mix(col, checkerCol, groundMask);
    }
    
    // === ORGANIC CLOUDS (top half - purple, teal, pink) ===
    
    // Cloud 1 - Purple
    let cloud1Center = vec2f(-0.5, 0.4) + vec2f(sin(time * 0.3) * 0.1, cos(time * 0.2) * 0.05);
    let cloud1 = organicCloud(p, cloud1Center, 0.8, time, 1.0);
    if (cloud1 > 0.01) {
        let cloudCol1 = getPalette(time, 8.5);
        col = mix(col, cloudCol1, cloud1 * 0.7);
    }
    
    // Cloud 2 - Teal
    let cloud2Center = vec2f(0.0, 0.6) + vec2f(cos(time * 0.25) * 0.08, sin(time * 0.18) * 0.06);
    let cloud2 = organicCloud(p, cloud2Center, 0.6, time, 2.0);
    if (cloud2 > 0.01) {
        let cloudCol2 = getPalette(time, 9.0);
        col = mix(col, cloudCol2, cloud2 * 0.8);
    }
    
    // Cloud 3 - Pink/purple
    let cloud3Center = vec2f(0.4, 0.3) + vec2f(sin(time * 0.35) * 0.07, cos(time * 0.22) * 0.08);
    let cloud3 = organicCloud(p, cloud3Center, 0.7, time, 3.0);
    if (cloud3 > 0.01) {
        let cloudCol3 = getPalette(time, 9.5);
        col = mix(col, cloudCol3, cloud3 * 0.65);
    }
    
    // === FLAME RIBBONS (central orange/yellow rising flames) ===
    
    // Main central flame
    let flame1 = flameRibbon(p, vec2f(0.0, -0.2), time, 0.0);
    if (flame1 < 0.15) {
        let flameCore = getPalette(time, 10.0); // Orange
        let flameEdge = getPalette(time, 10.3); // Yellow
        
        let flameMix = smoothstep(0.15, 0.0, flame1);
        let flameCol = mix(flameEdge, flameCore, smoothstep(0.08, 0.0, flame1));
        
        col = mix(col, flameCol, flameMix);
        
        // Inner glow
        let glow = exp(-flame1 * flame1 * 80.0);
        col += flameCore * glow * 0.6;
    }
    
    // Secondary flame ribbon (offset)
    let flame2 = flameRibbon(p, vec2f(-0.15, -0.15), time * 1.1, 2.5);
    if (flame2 < 0.12) {
        let flameCol2 = getPalette(time, 10.6);
        col = mix(col, flameCol2, smoothstep(0.12, 0.05, flame2) * 0.7);
    }
    
    // === WAVY STRIPES (checkered pattern continuation into clouds) ===
    
    // Organic stripes bridging ground to sky
    let stripeY = p.y + 0.1;
    let stripePhase = sin(p.x * 15.0 + time * 0.5) * 0.08 + sin(p.x * 8.0 - time * 0.3) * 0.12;
    let stripeMask = abs(fract2(vec2f(stripeY + stripePhase, 0.0)).x - 0.5);
    
    let stripeBlend = smoothstep(-0.5, 0.2, p.y) * smoothstep(0.6, 0.2, p.y);
    if (stripeBlend > 0.01 && stripeMask < 0.15) {
        let stripeCol = mix(vec3f(0.1), getPalette(time, 11.0), stripeMask / 0.15);
        col = mix(col, stripeCol, stripeBlend * 0.4);
    }
    
    // === FINE GRAIN TEXTURE ===
    let grain = hash(p * 2000.0 + time * 0.05) * 0.15;
    col += grain - 0.075;
    
    // Soft alpha mask with gradual falloff
    let baseMask = smoothstep(0.0, 0.2, length(col));
    
    // Add noise to alpha for organic blending
    let noiseMask = fbm(p * 6.0 + time * 0.05) * 0.3 + 0.7;
    
    // Gradual vertical fade (stronger at edges)
    let verticalFade = smoothstep(-1.0, -0.3, p.y) * smoothstep(1.2, 0.5, p.y);
    
    let finalAlpha = baseMask * noiseMask * verticalFade;
    
    return vec4f(col, finalAlpha);
}

