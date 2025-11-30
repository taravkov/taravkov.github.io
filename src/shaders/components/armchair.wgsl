fn mapArmchair(p: vec3f) -> f32 {
    // Transform to local space
    var pos = p - vec3f(0.0, -1.4, 2.0);
    pos = rotateY(pos, -0.2);
    
    // === LUXURY CHESTERFIELD ARMCHAIR ===
    // More detailed, sculptural chair
    
    // 1. Base/Seat - Wider, more imposing
    let seatHeight = 0.5;
    let seatWidth = 0.9;
    let seatDepth = 0.85;
    
    let base = sdRoundBox(pos - vec3f(0.0, seatHeight, 0.0), vec3f(seatWidth, 0.25, seatDepth), 0.08);
    
    // Seat cushion - deeply tufted, bulging
    var cushionPos = pos - vec3f(0.0, seatHeight + 0.25, 0.0);
    // Add bulge with noise
    let bulgeFactor = sin(cushionPos.x * 3.0) * sin(cushionPos.z * 3.0) * 0.1;
    let cushion = sdRoundBox(cushionPos, vec3f(seatWidth - 0.1, 0.15, seatDepth - 0.1), 0.12) - bulgeFactor;
    
    // 2. Backrest - Tall, curved, impressive
    var backPos = pos - vec3f(0.0, 1.4, -seatDepth + 0.2);
    // Curve the backrest backwards
    backPos.z += backPos.y * backPos.y * 0.05;
    let back = sdRoundBox(backPos, vec3f(seatWidth + 0.2, 0.8, 0.25), 0.15);
    
    // Top crest of backrest (extra detail)
    let crestPos = pos - vec3f(0.0, 2.1, -seatDepth + 0.15);
    let crest = sdRoundBox(crestPos, vec3f(seatWidth + 0.25, 0.15, 0.2), 0.1);
    
    // 3. Armrests - Thick, rolled, luxurious
    let armRadius = 0.32;
    let armLength = seatDepth + 0.2;
    let armHeight = 1.1;
    let armX = seatWidth + 0.1;
    
    // Left armrest
    var armLPos = pos - vec3f(-armX, armHeight, 0.0);
    let armL = sdCapsule(
        armLPos, 
        vec3f(0.0, 0.0, -armLength * 0.5), 
        vec3f(0.0, 0.0, armLength * 0.5), 
        armRadius
    );
    
    // Right armrest
    var armRPos = pos - vec3f(armX, armHeight, 0.0);
    let armR = sdCapsule(
        armRPos, 
        vec3f(0.0, 0.0, -armLength * 0.5), 
        vec3f(0.0, 0.0, armLength * 0.5), 
        armRadius
    );
    
    // 4. Combine Main Body with smooth unions for organic look
    var chair = opSmoothUnion(base, back, 0.25);
    chair = opSmoothUnion(chair, crest, 0.2);
    chair = opSmoothUnion(chair, armL, 0.25);
    chair = opSmoothUnion(chair, armR, 0.25);
    chair = opSmoothUnion(chair, cushion, 0.08);
    
    // 5. Legs - Carved wood, Queen Anne style
    let legRadius = 0.08;
    let legHeight = 0.25;
    let lx = seatWidth - 0.15;
    let lz = seatDepth - 0.15;
    
    // Front legs (curved)
    var leg1Pos = pos - vec3f(-lx, legHeight, lz);
    leg1Pos.y += abs(leg1Pos.x) * 0.1; // Slight curve
    let leg1 = sdCapsule(leg1Pos, vec3f(0.0, 0.0, 0.0), vec3f(0.0, -legHeight, 0.0), legRadius);
    
    var leg2Pos = pos - vec3f(lx, legHeight, lz);
    leg2Pos.y += abs(leg2Pos.x) * 0.1;
    let leg2 = sdCapsule(leg2Pos, vec3f(0.0, 0.0, 0.0), vec3f(0.0, -legHeight, 0.0), legRadius);
    
    // Back legs (straight)
    let leg3 = sdCappedCylinder(pos - vec3f(-lx, legHeight, -lz), legHeight, legRadius);
    let leg4 = sdCappedCylinder(pos - vec3f(lx, legHeight, -lz), legHeight, legRadius);
    
    let legs = min(min(leg1, leg2), min(leg3, leg4));
    
    var chairFull = min(chair, legs);
    
    // === HUMAN SILHOUETTE (More detailed) ===
    
    // Torso (slightly forward lean)
    let torsoPos = pos - vec3f(0.0, 1.05, 0.15);
    let torso = sdRoundBox(torsoPos, vec3f(0.28, 0.5, 0.18), 0.06);
    
    // Head (with neck)
    let neckPos = pos - vec3f(0.0, 1.62, 0.1);
    let neck = sdCappedCylinder(neckPos, 0.08, 0.06);
    
    let headPos = pos - vec3f(0.0, 1.8, 0.08);
    let head = sdSphere(headPos, 0.2);
    
    // Arms - more natural pose
    // Left arm (resting on armrest, bent)
    let shoulderL = pos - vec3f(-0.35, 1.4, 0.1);
    let upperArmL = sdCapsule(shoulderL, vec3f(0.0, 0.0, 0.0), vec3f(-0.15, -0.15, 0.0), 0.06);
    let elbowL = pos - vec3f(-0.5, 1.25, 0.1);
    let forearmL = sdCapsule(elbowL, vec3f(0.0, 0.0, 0.0), vec3f(-0.05, -0.2, 0.05), 0.055);
    
    // Right arm
    let shoulderR = pos - vec3f(0.35, 1.4, 0.1);
    let upperArmR = sdCapsule(shoulderR, vec3f(0.0, 0.0, 0.0), vec3f(0.15, -0.15, 0.0), 0.06);
    let elbowR = pos - vec3f(0.5, 1.25, 0.1);
    let forearmR = sdCapsule(elbowR, vec3f(0.0, 0.0, 0.0), vec3f(0.05, -0.2, 0.05), 0.055);
    
    // Legs (seated, bent at knees)
    // Thighs
    let thighL = sdCapsule(pos - vec3f(-0.18, 0.8, 0.25), vec3f(0.0, 0.15, 0.0), vec3f(0.0, -0.15, 0.15), 0.07);
    let thighR = sdCapsule(pos - vec3f(0.18, 0.8, 0.25), vec3f(0.0, 0.15, 0.0), vec3f(0.0, -0.15, 0.15), 0.07);
    
    // Shins
    let shinL = sdCapsule(pos - vec3f(-0.18, 0.5, 0.4), vec3f(0.0, 0.15, 0.0), vec3f(0.0, -0.3, 0.05), 0.06);
    let shinR = sdCapsule(pos - vec3f(0.18, 0.5, 0.4), vec3f(0.0, 0.15, 0.0), vec3f(0.0, -0.3, 0.05), 0.06);
    
    var human = min(torso, min(neck, head));
    human = min(human, min(upperArmL, forearmL));
    human = min(human, min(upperArmR, forearmR));
    human = min(human, min(thighL, thighR));
    human = min(human, min(shinL, shinR));
    
    return min(chairFull, human);
}

fn getArmchairMaterial(p: vec3f) -> vec3f {
    var pos = p - vec3f(0.0, -1.4, 2.0);
    pos = rotateY(pos, -0.2);
    
    // Check if it's the human silhouette
    if (pos.y > 0.7) {
        // Human: Pure black silhouette
        return vec3f(0.0, 0.0, 0.0);
    }
    
    // Chair material: Rich velvet with procedural detail
    let uv = pos.xz * 8.0 + pos.xy * 5.0;
    let grain = fbm(uv * 3.0);
    
    // Deep burgundy/wine red base
    let baseCol = vec3f(0.45, 0.08, 0.12);
    let highlightCol = vec3f(0.7, 0.15, 0.2);
    
    var col = mix(baseCol, highlightCol, grain * 0.4);
    
    // Tufted button pattern (more pronounced)
    if (pos.z < -0.4 && pos.y > 1.0 && pos.y < 2.0) { // Backrest
        let buttonUV = vec2f(
            fract((pos.x + seatWidth * 0.5) / 0.25), 
            fract((pos.y - 1.0) / 0.25)
        );
        let buttonDist = length(buttonUV - 0.5);
        if (buttonDist < 0.2) {
            col *= 0.4; // Deep indentation
        }
    }
    
    // Seat cushion tufts
    if (pos.y > 0.4 && pos.y < 0.8 && abs(pos.z) < 0.6) {
        let buttonUV = vec2f(
            fract((pos.x + seatWidth * 0.5) / 0.35), 
            fract((pos.z + 0.6) / 0.35)
        );
        let buttonDist = length(buttonUV - 0.5);
        if (buttonDist < 0.18) {
            col *= 0.5;
        }
    }
    
    // Velvet sheen (directional)
    let sheenNoise = noise(pos.xz * 50.0);
    col *= 0.6 + 0.4 * sheenNoise;
    
    // Legs: Dark polished mahogany
    if (pos.y < 0.35) {
        let woodGrain = fbm(vec2f(pos.y * 20.0, atan2(pos.z, pos.x) * 10.0));
        return vec3f(0.12, 0.06, 0.03) * (0.7 + woodGrain * 0.3);
    }
    
    return col;
}

const seatWidth = 0.9; // Make it accessible for button pattern
