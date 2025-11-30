// RAZAKA Layer - Elements from reference image
// Pink ribbons, glowing spheres, teal shapes, portal with oval

fn sdBox2D(p: vec2f, b: vec2f) -> f32 {
    let d = abs(p) - b;
    return length(max(d, vec2f(0.0))) + min(max(d.x, d.y), 0.0);
}

fn sdRibbon(p: vec2f, start: vec2f, end: vec2f, width: f32, curve: f32, time: f32, seed: f32) -> f32 {
    let pa = p - start;
    let ba = end - start;
    let h = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0);
    
    // Multiple sine waves for organic flow
    let flow1 = sin(h * 3.14159 * curve + time * 0.8 + seed) * width * 0.35;
    let flow2 = sin(h * 6.28 * (curve + 0.5) - time * 0.6 + seed * 1.5) * width * 0.2;
    let flow3 = cos(h * 9.42 * curve + time * 0.4 + seed * 2.0) * width * 0.15;
    
    // Organic width variation along the ribbon
    let widthMod = 1.0 + sin(h * 12.56 + time * 0.5 + seed) * 0.25 + 
                         cos(h * 18.84 - time * 0.35 + seed * 1.2) * 0.15;
    
    // Combine flows for complex undulation
    let offset = vec2f(
        flow1 + flow2 * 0.7,
        flow3 * 0.8
    );
    
    // Distance with organic bulges
    let baseDist = length(pa - ba * h + offset) - (width * widthMod);
    
    // Add noise-based turbulence
    let noisePos = p * 8.0 + vec2f(time * 0.1);
    let turbulence = fbm(noisePos) * width * 0.12;
    
    return baseDist + turbulence;
}

fn rotate2D(p: vec2f, angle: f32) -> vec2f {
    let c = cos(angle);
    let s = sin(angle);
    return vec2f(c * p.x - s * p.y, s * p.x + c * p.y);
}

fn razakaLayer(p: vec2f, time: f32) -> vec4f {
    var col = vec3f(0.0);
    var alpha = 0.0;
    
    // Ribbons with organic flowing shapes and evolving colors
    let ribbon1 = sdRibbon(p, vec2f(-0.5, 1.0), vec2f(0.3, 0.2), 0.12, 2.0, time, 1.0);
    if (ribbon1 < 0.0) {
        let depth = smoothstep(0.0, -0.1, ribbon1);
        let ribbonCol = mix(getPalette(time, 4.0), getPalette(time, 4.1), depth);
        
        // Add internal gradient based on position along ribbon
        let gradientNoise = fbm(p * 5.0 + time * 0.08);
        let ribbonColFinal = mix(ribbonCol, getPalette(time, 4.15), gradientNoise * 0.4);
        
        col = mix(col, ribbonColFinal, 0.9);
        alpha = max(alpha, 0.9);
        
        // Subtle glow on edges
        let edgeGlow = exp(-ribbon1 * ribbon1 * 50.0);
        col += ribbonColFinal * edgeGlow * 0.3;
    }
    
    let ribbon2 = sdRibbon(p, vec2f(-0.8, 0.4), vec2f(0.6, -0.3), 0.1, 1.5, time, 2.5);
    if (ribbon2 < 0.0) {
        let depth = smoothstep(0.0, -0.08, ribbon2);
        let ribbonCol = mix(getPalette(time, 4.3), getPalette(time, 4.4), depth);
        
        let gradientNoise = fbm(p * 6.0 - time * 0.06);
        let ribbonColFinal = mix(ribbonCol, getPalette(time, 4.45), gradientNoise * 0.35);
        
        col = mix(col, ribbonColFinal, 0.85);
        alpha = max(alpha, 0.85);
        
        let edgeGlow = exp(-ribbon2 * ribbon2 * 60.0);
        col += ribbonColFinal * edgeGlow * 0.25;
    }
    
    let ribbon3 = sdRibbon(p, vec2f(0.2, 0.9), vec2f(-0.4, -0.2), 0.09, 1.8, time, 4.0);
    if (ribbon3 < 0.0) {
        let depth = smoothstep(0.0, -0.07, ribbon3);
        let ribbonCol = mix(getPalette(time, 4.6), getPalette(time, 4.7), depth);
        
        let gradientNoise = fbm(p * 7.0 + time * 0.07);
        let ribbonColFinal = mix(ribbonCol, getPalette(time, 4.75), gradientNoise * 0.38);
        
        col = mix(col, ribbonColFinal, 0.88);
        alpha = max(alpha, 0.88);
        
        let edgeGlow = exp(-ribbon3 * ribbon3 * 70.0);
        col += ribbonColFinal * edgeGlow * 0.28;
    }
    
    // Geometric shapes with organic distortion and evolving colors
    let tealCenter1 = vec2f(0.7, 0.8) + vec2f(sin(time * 0.6) * 0.02, cos(time * 0.5) * 0.015);
    let tealRotated1 = rotate2D(p - tealCenter1, 0.6 + sin(time * 0.3) * 0.1);
    
    // Add organic warping to the rectangle
    let warpedP1 = tealRotated1 + vec2f(
        sin(tealRotated1.y * 10.0 + time * 0.8) * 0.015,
        cos(tealRotated1.x * 8.0 - time * 0.6) * 0.012
    );
    
    let teal1 = sdBox2D(warpedP1, vec2f(0.2, 0.06));
    
    // Add noise-based distortion
    let noise1 = fbm(tealRotated1 * 12.0 + time * 0.05);
    let teal1Final = teal1 + noise1 * 0.008;
    
    if (teal1Final < 0.0) {
        let depth = smoothstep(0.0, -0.04, teal1Final);
        let shapeCol = mix(getPalette(time, 5.0), getPalette(time, 5.05), depth);
        
        // Internal texture
        let internalNoise = fbm(tealRotated1 * 20.0);
        let finalCol = mix(shapeCol, getPalette(time, 5.1), internalNoise * 0.2);
        
        col = mix(col, finalCol, 0.95);
        alpha = max(alpha, 0.95);
        
        // Soft glow on edges
        let edgeGlow = exp(-teal1Final * teal1Final * 100.0);
        col += finalCol * edgeGlow * 0.2;
    }
    
    let tealCenter2 = vec2f(0.8, 0.5) + vec2f(cos(time * 0.7) * 0.018, sin(time * 0.55) * 0.02);
    let tealRotated2 = rotate2D(p - tealCenter2, -0.3 + cos(time * 0.4) * 0.08);
    
    // Organic warping
    let warpedP2 = tealRotated2 + vec2f(
        cos(tealRotated2.y * 12.0 - time * 0.7) * 0.012,
        sin(tealRotated2.x * 10.0 + time * 0.5) * 0.01
    );
    
    let teal2 = sdBox2D(warpedP2, vec2f(0.15, 0.08));
    
    let noise2 = fbm(tealRotated2 * 15.0 - time * 0.04);
    let teal2Final = teal2 + noise2 * 0.007;
    
    if (teal2Final < 0.0) {
        let depth = smoothstep(0.0, -0.035, teal2Final);
        let shapeCol = mix(getPalette(time, 5.2), getPalette(time, 5.25), depth);
        
        let internalNoise = fbm(tealRotated2 * 18.0);
        let finalCol = mix(shapeCol, getPalette(time, 5.3), internalNoise * 0.18);
        
        col = mix(col, finalCol, 0.92);
        alpha = max(alpha, 0.92);
        
        let edgeGlow = exp(-teal2Final * teal2Final * 120.0);
        col += finalCol * edgeGlow * 0.18;
    }
    
    // Glowing spheres with evolving colors
    let sphere1Pos = vec2f(-0.7, 0.7) + vec2f(sin(time * 0.8) * 0.03, cos(time * 0.6) * 0.02);
    let sphere1Dist = length(p - sphere1Pos);
    let sphere1Glow = exp(-sphere1Dist * sphere1Dist * 8.0);
    let sphere1Core = smoothstep(0.15, 0.08, sphere1Dist);
    
    let sphereCol1 = mix(getPalette(time, 5.5), getPalette(time, 5.6), sphere1Dist / 0.2);
    col += sphereCol1 * sphere1Glow * 0.6;
    col = mix(col, sphereCol1, sphere1Core);
    alpha = max(alpha, sphere1Core + sphere1Glow * 0.3);
    
    let sphere2Pos = vec2f(0.5, 0.3);
    let sphere2Dist = length(p - sphere2Pos);
    let sphere2Glow = exp(-sphere2Dist * sphere2Dist * 10.0);
    let sphere2Core = smoothstep(0.12, 0.06, sphere2Dist);
    
    let sphereCol2 = mix(getPalette(time, 5.8), getPalette(time, 5.9), sphere2Dist / 0.15);
    col += sphereCol2 * sphere2Glow * 0.5;
    col = mix(col, sphereCol2, sphere2Core);
    alpha = max(alpha, sphere2Core + sphere2Glow * 0.25);
    
    let sphere3Pos = vec2f(-0.5, -0.7);
    let sphere3Dist = length(p - sphere3Pos);
    let sphere3Glow = exp(-sphere3Dist * sphere3Dist * 12.0);
    let sphere3Core = smoothstep(0.1, 0.05, sphere3Dist);
    
    let sphereCol3 = mix(getPalette(time, 6.1), getPalette(time, 6.2), sphere3Dist / 0.12);
    col += sphereCol3 * sphere3Glow * 0.55;
    col = mix(col, sphereCol3, sphere3Core);
    alpha = max(alpha, sphere3Core + sphere3Glow * 0.28);
    
    // Portal/window with glowing oval - DISABLED (too much attention)
    /*
    let portalFrame = sdBox2D(p - vec2f(0.5, -0.5), vec2f(0.35, 0.5));
    let portalBorder = abs(portalFrame) - 0.015;
    
    if (portalBorder < 0.0) {
        col = mix(col, getPalette(time, 6.5), 0.9);
        alpha = max(alpha, 0.9);
    }
    
    // Glowing oval inside portal
    let ovalP = (p - vec2f(0.5, -0.5)) / vec2f(0.25, 0.4);
    let ovalDist = length(ovalP) - 1.0;
    let ovalGlow = exp(-ovalDist * ovalDist * 2.0);
    let ovalCore = smoothstep(0.2, -0.3, ovalDist);
    
    if (portalFrame < 0.0) {
        let ovalCol = mix(getPalette(time, 6.7), getPalette(time, 6.8), length(ovalP) * 0.5);
        col += ovalCol * ovalGlow * 1.2;
        col = mix(col, ovalCol * 1.3, ovalCore);
        alpha = max(alpha, ovalCore + ovalGlow * 0.5);
    }
    */
    
    // Organic lines with evolving colors (darker tones)
    let wavyLine1 = sdBezier(p, vec2f(-0.9, 0.9), vec2f(-0.3, 0.6), vec2f(0.4, 0.8));
    if (wavyLine1 < 0.003) {
        let lineAlpha = smoothstep(0.003, 0.001, wavyLine1);
        let lineCol = getPalette(time, 7.0) * 0.4; // Darker
        col = mix(col, lineCol, lineAlpha);
        alpha = max(alpha, lineAlpha * 0.7);
    }
    
    let wavyLine2 = sdBezier(p, vec2f(-0.6, 0.2), vec2f(0.0, 0.5), vec2f(0.7, 0.0));
    if (wavyLine2 < 0.002) {
        let lineAlpha = smoothstep(0.002, 0.0, wavyLine2);
        let lineCol = getPalette(time, 7.2) * 0.35; // Darker
        col = mix(col, lineCol, lineAlpha);
        alpha = max(alpha, lineAlpha * 0.6);
    }
    
    let wavyLine3 = sdBezier(p, vec2f(0.3, -0.8), vec2f(0.6, -0.3), vec2f(0.2, 0.2));
    if (wavyLine3 < 0.0025) {
        let lineAlpha = smoothstep(0.0025, 0.0005, wavyLine3);
        let lineCol = getPalette(time, 7.4) * 0.38; // Darker
        col = mix(col, lineCol, lineAlpha);
        alpha = max(alpha, lineAlpha * 0.65);
    }
    
    return vec4f(col, clamp(alpha, 0.0, 1.0));
}

