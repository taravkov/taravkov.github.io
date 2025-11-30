// Protean Clouds Port

fn rot(a: f32) -> mat2x2f {
    let c = cos(a);
    let s = sin(a);
    return mat2x2f(vec2f(c,s), vec2f(-s,c));
}

fn mag2(p: vec2f) -> f32 { return dot(p,p); }
fn linstep(mn: f32, mx: f32, x: f32) -> f32 { return clamp((x - mn)/(mx - mn), 0.0, 1.0); }

fn disp(t: f32) -> vec2f {
    return vec2f(sin(t*0.22)*1.0, cos(t*0.175)*1.0) * 2.0;
}

fn mapProtean(p_in: vec3f, time: f32, prm1: f32, bsMo: vec2f) -> vec2f {
    var p = p_in;
    var p2 = p;
    p2.x -= disp(p.z).x;
    p2.y -= disp(p.z).y;
    
    let r = rot(sin(p.z + time) * (0.1 + prm1 * 0.05) + time * 0.09);
    p = vec3f(r * p.xy, p.z);
    
    let cl = mag2(p2.xy);
    var d = 0.0;
    p *= 0.61;
    var z = 1.0;
    var trk = 1.0;
    let dspAmp = 0.1 + prm1 * 0.2;
    
    let m3 = mat3x3f(
        vec3f(0.33338, 0.56034, -0.71817),
        vec3f(-0.87887, 0.32651, -0.15323),
        vec3f(0.15162, 0.69596, 0.61339)
    ) * 1.93;
    
    for(var i = 0; i < 5; i++) {
        p += sin(vec3f(p.z, p.x, p.y) * 0.75 * trk + time * trk * 0.8) * dspAmp;
        d -= abs(dot(cos(p), sin(vec3f(p.y, p.z, p.x))) * z);
        z *= 0.57;
        trk *= 1.4;
        p = m3 * p;
    }
    d = abs(d + prm1 * 3.0) + prm1 * 0.3 - 2.5 + bsMo.y;
    return vec2f(d + cl * 0.2 + 0.25, cl);
}

fn getsat(c: vec3f) -> f32 {
    let mi = min(min(c.x, c.y), c.z);
    let ma = max(max(c.x, c.y), c.z);
    return (ma - mi)/(ma + 1e-7);
}

fn iLerp(a: vec3f, b: vec3f, x: f32) -> vec3f {
    var ic = mix(a, b, x) + vec3f(1e-6, 0.0, 0.0);
    let sd = abs(getsat(ic) - mix(getsat(a), getsat(b), x));
    let dir = normalize(vec3f(2.0*ic.x - ic.y - ic.z, 2.0*ic.y - ic.x - ic.z, 2.0*ic.z - ic.y - ic.x));
    let lgt = dot(vec3f(1.0), ic);
    let ff = dot(dir, normalize(ic));
    ic += 1.5 * dir * sd * ff * lgt;
    return clamp(ic, vec3f(0.0), vec3f(1.0));
}

fn renderProteanSky(rd: vec3f, time: f32) -> vec3f {
    // Adjust camera for sky
    // Original moves ro by time.
    // We simulate this movement to get the flow effect.
    // But we should scale it so it's not too fast.
    let t_mod = time * 1.0; // Speed
    var ro = vec3f(0.0, 0.0, t_mod);
    
    // Apply some of the original camera distortion logic or simplify?
    // Original: ro.xy += disp(ro.z)*dspAmp;
    let dspAmp = 0.85;
    let dispVal = disp(ro.z);
    ro.x += dispVal.x * dspAmp;
    ro.y += dispVal.y * dspAmp;
    
    let prm1 = smoothstep(-0.4, 0.4, sin(t_mod * 0.3));
    let bsMo = vec2f(0.0);
    
    var rez = vec4f(0.0);
    
    // Raymarch loop
    var t = 1.5;
    var fogT = 0.0;
    
    for(var i = 0; i < 80; i++) { // Reduced steps for performance (130 -> 80)
        if (rez.a > 0.99) { break; }
        
        let pos = ro + t * rd;
        let mpv = mapProtean(pos, t_mod, prm1, bsMo);
        let den = clamp(mpv.x - 0.3, 0.0, 1.0) * 1.12;
        let dn = clamp(mpv.x + 2.0, 0.0, 3.0);
        
        var col = vec4f(0.0);
        if (mpv.x > 0.6) {
            // Reference colors: Purple/Magenta/Teal gradient
            col = vec4f(sin(vec3f(5.0, 0.4, 0.2) + mpv.y * 0.1 + sin(pos.z * 0.4) * 0.5 + 1.8) * 0.5 + 0.5, 0.08);
            col = vec4f(col.rgb * den * den * den, col.a);
            col = vec4f(col.rgb * linstep(4.0, -2.5, mpv.x) * 2.3, col.a);
            
            let map1 = mapProtean(pos + 0.8, t_mod, prm1, bsMo).x;
            let map2 = mapProtean(pos + 0.35, t_mod, prm1, bsMo).x;
            
            let dif = clamp((den - map1) / 9.0, 0.001, 1.0) + 
                      clamp((den - map2) / 2.5, 0.001, 1.0);
            
            // Custom color palette: Purple/Pink/Teal like reference
            let cloudBase = vec3f(0.4, 0.15, 0.6); // Purple
            let cloudLight = vec3f(0.8, 0.3, 0.9); // Magenta
            let cloudDark = vec3f(0.1, 0.3, 0.4); // Teal
            
            col = vec4f(col.rgb * den * (cloudDark + 1.5 * cloudLight * dif), col.a);
        }
        
        // Fog with purple/teal tint
        let fogC = exp(t * 0.2 - 2.2);
        col = col + vec4f(0.3, 0.15, 0.4, 0.1) * clamp(fogC - fogT, 0.0, 1.0); // Purple fog
        fogT = fogC;
        
        rez = rez + col * (1.0 - rez.a);
        t += clamp(0.5 - dn * dn * 0.05, 0.09, 0.3);
    }
    
    var col = clamp(rez.rgb, vec3f(0.0), vec3f(1.0));
    
    // Reference-inspired color grading: Purple/Pink/Teal sky
    col = iLerp(col.bgr, col.rgb, clamp(1.0 - prm1, 0.05, 1.0));
    
    // Adjust gamma and tint for reference look
    col = pow(col, vec3f(0.7, 0.55, 0.6)); // Emphasize purple/magenta
    col *= vec3f(1.2, 0.9, 1.1); // Tint: more red/blue, less green
    
    // Add horizon gradient (teal at bottom, purple at top)
    let skyGradient = mix(vec3f(0.2, 0.5, 0.6), vec3f(0.6, 0.2, 0.8), smoothstep(-0.3, 0.5, rd.y));
    col = mix(col, skyGradient, 0.3);
    
    return col;
}
