fn mapCarpet(p: vec3f) -> f32 {
    var d = sdBox(p - vec3f(0.0, -1.5, 2.0), vec3f(3.0, 0.08, 4.5));
    
    let folds = sin(p.x * 2.0 + p.z * 1.5) * 0.05 + sin(p.x * 5.0) * 0.02;
    d += folds * 0.5;
    
    let carpetCenter = vec3f(0.0, -1.5, 2.0);
    let edgeThreshold = 4.4;
    
    if (abs(p.z - carpetCenter.z) > edgeThreshold) {
        let tassel_x = fract((p.x - carpetCenter.x + 3.0) / 0.2) - 0.5;
        let tassel_d = length(vec2f(tassel_x * 0.2, p.y - carpetCenter.y + 1.5)) - 0.02;
        d = min(d, tassel_d);
    }
    
    // Coffee Table on top of carpet
    d = min(d, mapCoffeeTable(p));
    
    return d;
}

fn mapCoffeeTable(p: vec3f) -> f32 {
    // Small wooden table in front of chair
    let tableCenter = vec3f(0.0, -0.9, 3.5);
    var localP = p - tableCenter;
    
    // Tabletop
    let top = sdRoundBox(localP - vec3f(0.0, 0.0, 0.0), vec3f(0.4, 0.05, 0.3), 0.02);
    
    // Legs (4 thin cylinders)
    let legH = 0.3;
    let legR = 0.03;
    
    let leg1 = sdCappedCylinder(localP - vec3f(-0.35, -legH, -0.25), legH, legR);
    let leg2 = sdCappedCylinder(localP - vec3f(0.35, -legH, -0.25), legH, legR);
    let leg3 = sdCappedCylinder(localP - vec3f(-0.35, -legH, 0.25), legH, legR);
    let leg4 = sdCappedCylinder(localP - vec3f(0.35, -legH, 0.25), legH, legR);
    
    var table = min(top, min(min(leg1, leg2), min(leg3, leg4)));
    
    // Cup on table
    let cupPos = localP - vec3f(-0.15, 0.1, 0.0);
    let cup = sdCappedCylinder(cupPos, 0.08, 0.05);
    
    // Book on table
    let bookPos = localP - vec3f(0.15, 0.06, 0.05);
    let book = sdRoundBox(bookPos, vec3f(0.12, 0.01, 0.09), 0.005);
    
    table = min(table, cup);
    table = min(table, book);
    
    return table;
}

// Procedural Carpet Pattern
fn getCarpetPattern(uv: vec2f) -> vec3f {
    var p = uv * 3.0;
    p = abs(p);
    
    let r = length(p);
    let a = atan2(p.y, p.x);
    
    let medallion = smoothstep(0.4, 0.45, abs(r - 1.5 + sin(a * 8.0) * 0.2));
    let weave = sin(p.x * 40.0) * sin(p.y * 40.0);
    let border = step(2.5, max(p.x, p.y));
    
    let darkRed = vec3f(0.4, 0.05, 0.05);
    let gold = vec3f(0.8, 0.6, 0.2);
    let blue = vec3f(0.1, 0.1, 0.3);
    
    var col = darkRed;
    col = mix(col, gold, (1.0 - medallion) * 0.8);
    col *= 0.8 + weave * 0.2;
    col = mix(col, blue, border);
    
    if (border > 0.5) {
        let borderPat = sin(p.x * 10.0) * sin(p.y * 10.0);
        col = mix(col, gold, smoothstep(0.5, 0.6, borderPat));
    }
    
    return col;
}

fn getCarpetColor(p: vec3f, n: vec3f, rd: vec3f, lightDir: vec3f, shadow: f32) -> vec3f {
    // Check if coffee table
    if (mapCoffeeTable(p) < 0.1) {
        return getCoffeeTableColor(p);
    }
    
    let albedo = getCarpetPattern(p.xz);
    
    let V = -rd;
    let NdotV = max(0.0, dot(n, V));
    
    let sheen = pow(1.0 - NdotV, 3.0);
    let fuzz = noise(p.xz * 100.0);
    
    let H = normalize(lightDir + V);
    let NdotH = max(0.0, dot(n, H));
    let spec = pow(NdotH, 20.0) * 0.2;
    
    let sheenColor = mix(albedo, vec3f(1.0), 0.5);
    
    var col = albedo * (0.2 + 0.8 * shadow * max(0.0, dot(n, lightDir)));
    col += sheen * sheenColor * 0.5;
    col += spec * shadow;
    col *= 0.8 + 0.2 * fuzz;
    
    return col;
}

fn getCoffeeTableColor(p: vec3f) -> vec3f {
    let tableCenter = vec3f(0.0, -0.9, 3.5);
    let localP = p - tableCenter;
    
    // Check if cup (white ceramic)
    let cupDist = length(localP - vec3f(-0.15, 0.1, 0.0));
    if (cupDist < 0.1) {
        return vec3f(0.8, 0.75, 0.7);
    }
    
    // Check if book (pages)
    let bookDist = length(localP - vec3f(0.15, 0.06, 0.05));
    if (bookDist < 0.15) {
        return vec3f(0.9, 0.85, 0.75);
    }
    
    // Wood table
    let woodGrain = fbm(p.xz * 20.0 + p.y * 5.0);
    let woodCol = vec3f(0.3, 0.15, 0.08);
    return woodCol * (0.8 + woodGrain * 0.2);
}
