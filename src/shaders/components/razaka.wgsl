// RAZAKA Layer - Elements from reference image
// Pink ribbons, glowing spheres, teal shapes, portal with oval

fn sdBox2D(p: vec2f, b: vec2f) -> f32 {
    let d = abs(p) - b;
    return length(max(d, vec2f(0.0))) + min(max(d.x, d.y), 0.0);
}

fn sdRibbon(p: vec2f, start: vec2f, end: vec2f, width: f32, curve: f32) -> f32 {
    let pa = p - start;
    let ba = end - start;
    let h = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0);
    let offset = sin(h * 3.14159 * curve) * width * 0.3;
    return length(pa - ba * h + vec2f(offset, 0.0)) - width;
}

fn rotate2D(p: vec2f, angle: f32) -> vec2f {
    let c = cos(angle);
    let s = sin(angle);
    return vec2f(c * p.x - s * p.y, s * p.x + c * p.y);
}

fn razakaLayer(p: vec2f, time: f32) -> vec4f {
    var col = vec3f(0.0);
    var alpha = 0.0;
    
    // Ribbons with evolving colors
    let ribbon1 = sdRibbon(p, vec2f(-0.5, 1.0), vec2f(0.3, 0.2), 0.12, 2.0);
    if (ribbon1 < 0.0) {
        let depth = smoothstep(0.0, -0.1, ribbon1);
        let ribbonCol = mix(getPalette(time, 4.0), getPalette(time, 4.1), depth);
        col = mix(col, ribbonCol, 0.9);
        alpha = max(alpha, 0.9);
    }
    
    let ribbon2 = sdRibbon(p, vec2f(-0.8, 0.4), vec2f(0.6, -0.3), 0.1, 1.5);
    if (ribbon2 < 0.0) {
        let depth = smoothstep(0.0, -0.08, ribbon2);
        let ribbonCol = mix(getPalette(time, 4.3), getPalette(time, 4.4), depth);
        col = mix(col, ribbonCol, 0.85);
        alpha = max(alpha, 0.85);
    }
    
    let ribbon3 = sdRibbon(p, vec2f(0.2, 0.9), vec2f(-0.4, -0.2), 0.09, 1.8);
    if (ribbon3 < 0.0) {
        let depth = smoothstep(0.0, -0.07, ribbon3);
        let ribbonCol = mix(getPalette(time, 4.6), getPalette(time, 4.7), depth);
        col = mix(col, ribbonCol, 0.88);
        alpha = max(alpha, 0.88);
    }
    
    // Geometric shapes with evolving colors
    let tealCenter1 = vec2f(0.7, 0.8);
    let tealRotated1 = rotate2D(p - tealCenter1, 0.6);
    let teal1 = sdBox2D(tealRotated1, vec2f(0.2, 0.06));
    
    if (teal1 < 0.0) {
        col = mix(col, getPalette(time, 5.0), 0.95);
        alpha = max(alpha, 0.95);
    }
    
    let tealCenter2 = vec2f(0.8, 0.5);
    let tealRotated2 = rotate2D(p - tealCenter2, -0.3);
    let teal2 = sdBox2D(tealRotated2, vec2f(0.15, 0.08));
    
    if (teal2 < 0.0) {
        col = mix(col, getPalette(time, 5.2), 0.92);
        alpha = max(alpha, 0.92);
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
    
    // Portal/window with glowing oval
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

