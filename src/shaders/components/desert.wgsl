// Desert with scattered bushes/tumbleweeds

fn mapDesert(p: vec3f) -> f32 {
    let pos = p * 0.2;
    
    let large = sdLargeWaves(pos);
    let small = sdSmallWaves(pos);
    
    let h = (large + small) * 5.0;
    
    var terrain = p.y + 2.0 - h;
    
    // Add scattered bushes
    terrain = min(terrain, mapDesertBushes(p));
    
    return terrain;
}

fn mapDesertBushes(p: vec3f) -> f32 {
    // Scattered tumbleweeds/dead bushes
    var minBush = 1000.0;
    
    // Bush 1: Near left
    let bush1Pos = vec3f(-8.0, -1.5, 8.0);
    minBush = min(minBush, mapSingleBush(p, bush1Pos, 0.5));
    
    // Bush 2: Mid right
    let bush2Pos = vec3f(6.0, -1.6, 12.0);
    minBush = min(minBush, mapSingleBush(p, bush2Pos, 0.4));
    
    // Bush 3: Far left (smaller)
    let bush3Pos = vec3f(-12.0, -1.5, 15.0);
    minBush = min(minBush, mapSingleBush(p, bush3Pos, 0.3));
    
    // Bush 4: Close right (tiny)
    let bush4Pos = vec3f(4.0, -1.4, 5.0);
    minBush = min(minBush, mapSingleBush(p, bush4Pos, 0.35));
    
    return minBush;
}

fn mapSingleBush(p: vec3f, center: vec3f, size: f32) -> f32 {
    let localP = p - center;
    
    // Rough sphere cluster for tumbleweed
    var d = sdSphere(localP, size);
    
    // Add asymmetry with displaced spheres
    d = min(d, sdSphere(localP - vec3f(size * 0.3, size * 0.2, 0.0), size * 0.7));
    d = min(d, sdSphere(localP - vec3f(-size * 0.2, size * 0.3, size * 0.2), size * 0.6));
    d = min(d, sdSphere(localP - vec3f(0.0, -size * 0.3, -size * 0.2), size * 0.5));
    
    return d;
}

// Journey-inspired Desert Shader

// Constants (Scheme 1)
const _TerrainCol = vec3f(0.56618, 0.29249, 0.1915);
const _TerrainSpecColor = vec3f(1.0, 0.77637, 0.53676);
const _TerrainRimColor = vec3f(0.16176, 0.13131, 0.098724);
const _TerrainShadowColor = vec3f(0.48529, 0.13282, 0.0);

const _LargeWaveOffset = vec3f(-3.65, 4.41, -11.64);
const _LargeWaveDetail = vec2f(0.25, 0.73);
const _LargeWavePowStre = vec3f(0.6, 2.96, -2.08);

const _SmallWaveDetail = vec3f(3.19, 16.0, 6.05);
const _SmallDetailStrength = 0.006;
const _WindSpeed = vec2f(2.0, 0.6);

fn sdLargeWaves(pos: vec3f) -> f32 {
    let distZ = abs(pos.z - uniforms.camPos.z);
    let distX = abs(pos.x - uniforms.camPos.x);
    var dist = (distZ) + (distX * 0.1);
    dist = dist * dist * 0.01;

    let detailNoise = noise(pos.xz) * -2.5;
    
    var largeWaves = (sin(_LargeWaveOffset.z + pos.z * _LargeWaveDetail.y + pos.z * 0.02)  
                      * sin((_LargeWaveOffset.x + dist) + (pos.x * _LargeWaveDetail.x) ) * 0.5) + 0.5;
                      
    largeWaves = -_LargeWaveOffset.y + pow(largeWaves, _LargeWavePowStre.x) * _LargeWavePowStre.y - detailNoise * 0.1;
    
    let a = largeWaves;
    let b = _LargeWavePowStre.z;
    let k = 0.2;
    let h = clamp(0.5 + 0.5 * (b - a) / k, 0.0, 1.0);
    largeWaves = mix(b, a, h) - k * h * (1.0 - h);
    
    return (largeWaves - dist) * 0.9;
}

fn sdSmallWaves(pos: vec3f) -> f32 {
    let t = uniforms.time;
    let detailNoise = noise(pos.xz) * _SmallWaveDetail.z;
    
    let smallWaves = sin(pos.z * _SmallWaveDetail.y + detailNoise + t * _WindSpeed.y) * 
                     sin(pos.x * _SmallWaveDetail.x + detailNoise + t * _WindSpeed.x) * _SmallDetailStrength;
    
    // Fine ripples for extra detail
    let fineRipples = sin(pos.x * 50.0 + pos.z * 30.0 + t * 2.0) * 0.01 
                    + sin(pos.x * 80.0 - pos.z * 60.0 + t * 3.0) * 0.005;
                     
    return (smallWaves + fineRipples) * 0.9;
}

// Custom lighting for Desert (Forward called from main)
fn getDesertColor(p: vec3f, n: vec3f, rd: vec3f, lightDir: vec3f, shadow: f32) -> vec3f {
    // Check if this is a bush (simple position check)
    let isBush = mapDesertBushes(p) < 0.1;
    
    if (isBush) {
        // Dark silhouette for bushes
        return vec3f(0.01, 0.01, 0.02);
    }
    
    // Procedural Glitter (No texture)
    let noiseVal = noise(p.xz * 100.0);
    let textureGlitter = pow(max(0.0, noiseVal - 0.6) * 2.5, 4.0);
    
    // Rim
    var rim = 1.0 - clamp(dot(n, -rd), 0.0, 1.0);
    rim = clamp(pow(rim, 5.59), 0.0, 1.0) * 1.61; 
    let rimColor = rim * _TerrainRimColor;
    
    // Specular
    let V = -rd;
    let H = normalize(lightDir + V);
    
    var mainSpec = clamp(dot(n, H), 0.0, 1.0); 
    
    mainSpec = pow(mainSpec, 55.35) * 1.56 * 2.0; 
    mainSpec *= textureGlitter;
    
    let rimSpec = pow(rim, 2.88) * textureGlitter; 
    let specColor = (mainSpec + rimSpec) * _TerrainSpecColor;
    
    // Shadow Color Mixing
    let shadowCol = _TerrainShadowColor;
    let litCol = _TerrainCol + rimColor + specColor;
    
    return mix(shadowCol, litCol, shadow);
}
