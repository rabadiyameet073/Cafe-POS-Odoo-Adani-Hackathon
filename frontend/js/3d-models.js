/**
 * ULTRA-REALISTIC 3D Food Models - Enhanced Edition
 * Uses MeshPhysicalMaterial with clearcoat, transmission, subsurface scattering
 * All models: highly detailed geometry, realistic materials, ambient detail objects
 */

(function () {
    'use strict';

    /* ─────────────────────────────────────────
       HELPERS
    ───────────────────────────────────────── */
    function rnd(min, max) { return min + Math.random() * (max - min); }

    // Create a lathe shape from a set of [x,y] control points
    function lathe(points, segs) {
        var v2 = points.map(function (p) { return new THREE.Vector2(p[0], p[1]); });
        return new THREE.LatheGeometry(v2, segs || 64);
    }

    /* Physical material shorthand */
    function phys(opts) {
        return new THREE.MeshPhysicalMaterial(opts);
    }

    /* ═══════════════════════════════════════════
       1. COFFEE CUP  – Ceramic + latte art
    ═══════════════════════════════════════════ */
    window.create3DCoffee = function () {
        var g = new THREE.Group();

        /* ── Cup body (lathe for perfect ceramic curve) */
        var bodyGeo = lathe([
            [0.0,  0.00],
            [0.50, 0.00],
            [0.52, 0.04],
            [0.55, 0.20],
            [0.60, 0.55],
            [0.65, 0.90],
            [0.68, 1.20],
            [0.70, 1.40],
            [0.72, 1.45],
            [0.72, 1.50]
        ], 80);
        var cupMat = phys({
            color: 0xFFFDF5,
            roughness: 0.15,
            metalness: 0.0,
            clearcoat: 1.0,
            clearcoatRoughness: 0.08,
            reflectivity: 0.7
        });
        var cup = new THREE.Mesh(bodyGeo, cupMat);
        cup.castShadow = true;
        cup.receiveShadow = true;
        g.add(cup);

        /* ── Inner dark cavity */
        var innerGeo = lathe([
            [0.0,  1.50],
            [0.62, 1.50],
            [0.63, 1.48],
            [0.63, 0.10],
            [0.0,  0.10]
        ], 64);
        var innerMat = phys({ color: 0x1A0D07, roughness: 0.6, metalness: 0.0 });
        g.add(new THREE.Mesh(innerGeo, innerMat));

        /* ── Coffee liquid surface */
        var liquidGeo = new THREE.CylinderGeometry(0.62, 0.62, 0.012, 80);
        var liquidMat = phys({
            color: 0x2C1208,
            roughness: 0.04,
            metalness: 0.8,
            reflectivity: 1.0,
            clearcoat: 0.5
        });
        var liquid = new THREE.Mesh(liquidGeo, liquidMat);
        liquid.position.y = 1.44;
        g.add(liquid);

        /* ── Latte art (white foam swirl using torus segments) */
        var foamMat = phys({ color: 0xFFF8E7, roughness: 0.95, metalness: 0.0 });
        // Central foam blob
        var centerFoam = new THREE.Mesh(
            new THREE.SphereGeometry(0.28, 32, 32),
            foamMat
        );
        centerFoam.scale.set(1, 0.18, 1);
        centerFoam.position.y = 1.455;
        g.add(centerFoam);

        // Leaf/heart art from ellipses
        for (var fi = 0; fi < 3; fi++) {
            var leafGeo = new THREE.SphereGeometry(0.15 - fi * 0.03, 24, 24);
            var leaf = new THREE.Mesh(leafGeo, foamMat);
            leaf.scale.set(1, 0.12, 0.55);
            var ang = fi * Math.PI * 2 / 3;
            leaf.position.set(Math.cos(ang) * 0.25, 1.46, Math.sin(ang) * 0.25);
            g.add(leaf);
        }

        /* ── Handle – extruded ellipse path */
        var handlePath = new THREE.CurvePath();
        handlePath.add(new THREE.QuadraticBezierCurve3(
            new THREE.Vector3(0.70, 1.10, 0),
            new THREE.Vector3(1.15, 1.10, 0),
            new THREE.Vector3(1.20, 0.72, 0)
        ));
        handlePath.add(new THREE.QuadraticBezierCurve3(
            new THREE.Vector3(1.20, 0.72, 0),
            new THREE.Vector3(1.15, 0.35, 0),
            new THREE.Vector3(0.70, 0.35, 0)
        ));
        var hShape = new THREE.Shape();
        hShape.absellipse(0, 0, 0.075, 0.055, 0, Math.PI * 2);
        var handleGeo = new THREE.ExtrudeGeometry(hShape, { steps: 80, bevelEnabled: false, extrudePath: handlePath });
        var handle = new THREE.Mesh(handleGeo, cupMat);
        handle.castShadow = true;
        g.add(handle);

        /* ── Saucer */
        var saucerGeo = lathe([
            [0.0,  0.00],
            [0.82, 0.00],
            [0.95, 0.04],
            [1.08, 0.10],
            [1.12, 0.13],
            [1.10, 0.16],
            [0.0,  0.16]
        ], 80);
        var saucerMat = phys({
            color: 0xFFFDF5,
            roughness: 0.12,
            metalness: 0.0,
            clearcoat: 1.0,
            clearcoatRoughness: 0.06
        });
        var saucer = new THREE.Mesh(saucerGeo, saucerMat);
        saucer.position.y = -0.16;
        saucer.castShadow = true;
        g.add(saucer);

        /* ── Saucer gold rim accent */
        var rimGeo = new THREE.TorusGeometry(1.05, 0.015, 16, 80);
        var rimMat = phys({ color: 0xD4AF37, roughness: 0.1, metalness: 1.0 });
        var rimMesh = new THREE.Mesh(rimGeo, rimMat);
        rimMesh.rotation.x = Math.PI / 2;
        rimMesh.position.y = 0.01;
        g.add(rimMesh);

        /* ── Silver spoon */
        var spoonMat = phys({ color: 0xE8E8E8, roughness: 0.08, metalness: 1.0, clearcoat: 0.8 });
        var spoonBody = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.016, 0.9, 16), spoonMat);
        spoonBody.position.set(0.55, -0.08, 0.35);
        spoonBody.rotation.set(0, 0, Math.PI / 7);
        g.add(spoonBody);
        var spoonBowl = new THREE.Mesh(new THREE.SphereGeometry(0.07, 20, 20, 0, Math.PI * 2, 0, Math.PI / 2), spoonMat);
        spoonBowl.position.set(0.17, -0.09, 0.62);
        spoonBowl.rotation.x = Math.PI / 2;
        g.add(spoonBowl);

        /* ── Steam wisps */
        for (var si = 0; si < 18; si++) {
            var steamGeo = new THREE.SphereGeometry(rnd(0.03, 0.055), 10, 10);
            var steamMat = new THREE.MeshBasicMaterial({
                color: 0xFFFFFF,
                transparent: true,
                opacity: rnd(0.10, 0.22),
                depthWrite: false
            });
            var steam = new THREE.Mesh(steamGeo, steamMat);
            steam.position.set(rnd(-0.35, 0.35), 1.55 + si * 0.14, rnd(-0.35, 0.35));
            steam.userData.floatSpeed = rnd(0.006, 0.016);
            steam.userData.wobbleSpeed = rnd(0.02, 0.06);
            steam.userData.wobbleAmt = rnd(0.04, 0.12);
            steam.userData.isSteam = true;
            g.add(steam);
        }

        g.scale.set(1.4, 1.4, 1.4);
        g.userData.type = 'coffee';
        return g;
    };

    /* ═══════════════════════════════════════════
       2. BURGER  – Gourmet stacked masterpiece
    ═══════════════════════════════════════════ */
    window.create3DBurger = function () {
        var g = new THREE.Group();

        /* ── Bottom bun */
        var botBunMat = phys({
            color: 0xC8935A,
            roughness: 0.88,
            metalness: 0.0,
            clearcoat: 0.15,
            clearcoatRoughness: 0.9,
            sheen: 0.4,
            sheenRoughness: 0.8,
            sheenColor: new THREE.Color(0xFFD090)
        });
        var botBunGeo = lathe([
            [0.0, 0.0],
            [0.88, 0.0],
            [0.96, 0.05],
            [1.00, 0.12],
            [1.00, 0.40],
            [0.96, 0.50],
            [0.0, 0.50]
        ], 72);
        var botBun = new THREE.Mesh(botBunGeo, botBunMat);
        botBun.castShadow = true;
        g.add(botBun);

        /* ── Sesame seeds on bottom bun rim */
        for (var bi = 0; bi < 18; bi++) {
            var sGeo = new THREE.SphereGeometry(0.022, 10, 10);
            var sMat = phys({ color: 0xFFF5DD, roughness: 0.75, metalness: 0.0 });
            var sSeed = new THREE.Mesh(sGeo, sMat);
            var sang = (bi / 18) * Math.PI * 2 + rnd(-0.1, 0.1);
            var srad = rnd(0.65, 0.88);
            sSeed.position.set(Math.cos(sang) * srad, 0.50, Math.sin(sang) * srad);
            sSeed.scale.set(1, 0.45, 1.3);
            g.add(sSeed);
        }

        /* ── Lettuce (wavy disc using torus) */
        var lettuceMat = phys({
            color: 0x4CAF50,
            roughness: 0.82,
            metalness: 0.0,
            transparent: true,
            opacity: 0.95,
            side: THREE.DoubleSide
        });
        var lettuceGeo = new THREE.TorusGeometry(0.85, 0.22, 12, 64);
        var lettuce = new THREE.Mesh(lettuceGeo, lettuceMat);
        lettuce.rotation.x = Math.PI / 2;
        lettuce.position.y = 0.52;
        lettuce.scale.set(1, 1, 0.28);
        g.add(lettuce);
        // Lettuce inner
        var letIn = new THREE.Mesh(new THREE.CylinderGeometry(0.64, 0.64, 0.10, 48), phys({ color: 0x66BB6A, roughness: 0.88, metalness: 0.0 }));
        letIn.position.y = 0.55;
        g.add(letIn);

        /* ── Tomato slices (3) */
        var tomatoMat = phys({
            color: 0xE53935,
            roughness: 0.32,
            metalness: 0.08,
            transparent: true,
            opacity: 0.96,
            clearcoat: 0.8,
            clearcoatRoughness: 0.2
        });
        for (var ti = 0; ti < 3; ti++) {
            var tGeo = new THREE.CylinderGeometry(0.75, 0.75, 0.075, 48);
            var tom = new THREE.Mesh(tGeo, tomatoMat);
            tom.position.y = 0.62 + ti * 0.085;
            tom.rotation.y = ti * Math.PI / 3;
            g.add(tom);
        }

        /* ── Onion rings */
        var onionMat = phys({ color: 0xFCE4EC, roughness: 0.5, metalness: 0.05, transparent: true, opacity: 0.82 });
        for (var oi = 0; oi < 5; oi++) {
            var onGeo = new THREE.TorusGeometry(rnd(0.12, 0.22), 0.028, 10, 24);
            var onion = new THREE.Mesh(onGeo, onionMat);
            var oang = (oi / 5) * Math.PI * 2;
            onion.position.set(Math.cos(oang) * 0.45, 0.70, Math.sin(oang) * 0.45);
            onion.rotation.set(Math.PI / 2, 0, rnd(0, Math.PI));
            g.add(onion);
        }

        /* ── Pickles */
        var pickleMat = phys({ color: 0x388E3C, roughness: 0.55, metalness: 0.1, transparent: true, opacity: 0.92 });
        for (var pi = 0; pi < 4; pi++) {
            var pkGeo = new THREE.CylinderGeometry(0.19, 0.19, 0.05, 16);
            var pk = new THREE.Mesh(pkGeo, pickleMat);
            var pang = (pi / 4) * Math.PI * 2 + Math.PI / 8;
            pk.position.set(Math.cos(pang) * 0.55, 0.75, Math.sin(pang) * 0.55);
            g.add(pk);
        }

        /* ── Beef patty */
        var pattyMat = phys({
            color: 0x3E1F0C,
            roughness: 0.95,
            metalness: 0.03,
            sheen: 0.6,
            sheenColor: new THREE.Color(0x7B3F00),
            sheenRoughness: 0.9
        });
        var pattyGeo = lathe([
            [0.0, 0.00],
            [0.80, 0.00],
            [0.92, 0.05],
            [0.94, 0.20],
            [0.90, 0.38],
            [0.82, 0.42],
            [0.0, 0.42]
        ], 64);
        var patty = new THREE.Mesh(pattyGeo, pattyMat);
        patty.position.y = 0.80;
        g.add(patty);

        /* ── Grill marks */
        var grillMat = phys({ color: 0x0D0705, roughness: 1.0, metalness: 0.0 });
        for (var gi = 0; gi < 5; gi++) {
            var gm = new THREE.Mesh(new THREE.BoxGeometry(1.12, 0.025, 0.065), grillMat);
            gm.position.set(0, 1.22, -0.38 + gi * 0.19);
            gm.rotation.y = 0.18 + (gi % 2) * 0.12;
            g.add(gm);
        }

        /* ── Cheese – melted square-ish drape */
        var cheeseMat = phys({
            color: 0xFFCA28,
            roughness: 0.28,
            metalness: 0.22,
            clearcoat: 0.9,
            clearcoatRoughness: 0.1,
            emissive: new THREE.Color(0xFFB300),
            emissiveIntensity: 0.12
        });
        var cheeseGeo = new THREE.CylinderGeometry(1.02, 0.92, 0.08, 48);
        var cheese = new THREE.Mesh(cheeseGeo, cheeseMat);
        cheese.position.y = 1.24;
        g.add(cheese);
        // Drips
        for (var di = 0; di < 9; di++) {
            var drpGeo = new THREE.CylinderGeometry(0.025, 0.012, rnd(0.10, 0.20), 12);
            var drp = new THREE.Mesh(drpGeo, cheeseMat);
            var dang = (di / 9) * Math.PI * 2;
            drp.position.set(Math.cos(dang) * 0.91, 1.16, Math.sin(dang) * 0.91);
            drp.rotation.set(rnd(-0.15, 0.15), 0, rnd(-0.15, 0.15));
            g.add(drp);
        }

        /* ── Top bun – sphere dome */
        var topBunMat = phys({
            color: 0xBF7B41,
            roughness: 0.82,
            metalness: 0.0,
            clearcoat: 0.25,
            clearcoatRoughness: 0.85,
            sheen: 0.5,
            sheenColor: new THREE.Color(0xFFD090),
            sheenRoughness: 0.8
        });
        var topBunGeo = new THREE.SphereGeometry(1.05, 64, 32, 0, Math.PI * 2, 0, Math.PI * 0.52);
        var topBun = new THREE.Mesh(topBunGeo, topBunMat);
        topBun.position.y = 1.34;
        topBun.castShadow = true;
        g.add(topBun);

        /* ── Sesame seeds on top bun */
        for (var tsi = 0; tsi < 48; tsi++) {
            var tsgeo = new THREE.SphereGeometry(0.026, 10, 10);
            var tseed = new THREE.Mesh(tsgeo, phys({ color: 0xFFF9E6, roughness: 0.7, metalness: 0.0 }));
            var tsang = (tsi / 48) * Math.PI * 2 + rnd(-0.05, 0.05);
            var tsrad = rnd(0.20, 0.88);
            var tsh = Math.sqrt(Math.max(0, 1.05 * 1.05 - tsrad * tsrad));
            tseed.position.set(Math.cos(tsang) * tsrad, 1.34 + tsh + 0.025, Math.sin(tsang) * tsrad);
            tseed.scale.set(1, 0.5, 1.4);
            tseed.rotation.y = rnd(0, Math.PI);
            g.add(tseed);
        }

        g.scale.set(1.15, 1.15, 1.15);
        g.userData.type = 'burger';
        return g;
    };

    /* ═══════════════════════════════════════════
       3. PIZZA  – Neapolitan wood-fired
    ═══════════════════════════════════════════ */
    window.create3DPizza = function () {
        var g = new THREE.Group();

        /* ── Pizza base dough */
        var doughMat = phys({
            color: 0xD2935A,
            roughness: 0.88,
            metalness: 0.01,
            sheen: 0.3,
            sheenColor: new THREE.Color(0xFFD590),
            sheenRoughness: 0.9
        });
        var baseGeo = lathe([
            [0.0,  0.00],
            [1.05, 0.00],
            [1.12, 0.06],
            [1.20, 0.14],
            [1.22, 0.20],
            [1.18, 0.26],  // crust peak
            [1.12, 0.30],
            [0.0,  0.30]
        ], 80);
        var base = new THREE.Mesh(baseGeo, doughMat);
        base.castShadow = true;
        base.receiveShadow = true;
        g.add(base);

        /* ── Char spots on crust */
        var charMat = phys({ color: 0x1A0D06, roughness: 1.0, metalness: 0.0 });
        for (var ci = 0; ci < 14; ci++) {
            var cang = (ci / 14) * Math.PI * 2;
            var charGeo = new THREE.SphereGeometry(rnd(0.04, 0.07), 10, 10);
            var ch = new THREE.Mesh(charGeo, charMat);
            ch.position.set(Math.cos(cang) * 1.15, 0.30, Math.sin(cang) * 1.15);
            ch.scale.set(1, 0.25, 1);
            g.add(ch);
        }

        /* ── Tomato sauce */
        var sauceMat = phys({ color: 0xC62828, roughness: 0.65, metalness: 0.05, emissive: new THREE.Color(0x8B0000), emissiveIntensity: 0.08 });
        var sauce = new THREE.Mesh(new THREE.CylinderGeometry(1.04, 1.0, 0.04, 64), sauceMat);
        sauce.position.y = 0.14;
        g.add(sauce);

        /* ── Melted mozzarella (irregular blobs) */
        var mozzMat = phys({
            color: 0xFFFBE7,
            roughness: 0.45,
            metalness: 0.05,
            clearcoat: 0.6,
            clearcoatRoughness: 0.3,
            emissive: new THREE.Color(0xFFF8DC),
            emissiveIntensity: 0.06
        });
        // Base cheese layer
        g.add(Object.assign(new THREE.Mesh(new THREE.CylinderGeometry(0.98, 0.96, 0.055, 64), mozzMat), { position: new THREE.Vector3(0, 0.195, 0) }));
        // Cheese blobs
        for (var mi = 0; mi < 22; mi++) {
            var mang = (mi / 22) * Math.PI * 2 + rnd(-0.1, 0.1);
            var mrad = rnd(0.18, 0.85);
            var mb = new THREE.Mesh(new THREE.SphereGeometry(rnd(0.06, 0.13), 14, 14), mozzMat);
            mb.scale.set(rnd(1.1, 1.8), rnd(0.25, 0.5), rnd(1.0, 1.6));
            mb.position.set(Math.cos(mang) * mrad, 0.24, Math.sin(mang) * mrad);
            g.add(mb);
        }

        /* ── Pepperoni */
        var pepMat = phys({ color: 0x8B1A1A, roughness: 0.70, metalness: 0.05 });
        var pepDarkMat = phys({ color: 0x4A0000, roughness: 0.9, metalness: 0.0 });
        for (var pepi = 0; pepi < 10; pepi++) {
            var pang = (pepi / 10) * Math.PI * 2 + rnd(-0.1, 0.1);
            var prad = rnd(0.25, 0.80);
            var pep = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 0.032, 24), pepMat);
            pep.position.set(Math.cos(pang) * prad, 0.265, Math.sin(pang) * prad);
            g.add(pep);
            // Fat dots on pepperoni
            for (var fdi = 0; fdi < 6; fdi++) {
                var fang = (fdi / 6) * Math.PI * 2;
                var fd = new THREE.Mesh(new THREE.SphereGeometry(0.018, 8, 8), phys({ color: 0xFFD0A0, roughness: 0.7 }));
                fd.position.set(pep.position.x + Math.cos(fang) * 0.07, 0.285, pep.position.z + Math.sin(fang) * 0.07);
                g.add(fd);
            }
        }

        /* ── Basil leaves (bezier thin shapes) */
        var basilMat = phys({ color: 0x1B5E20, roughness: 0.75, metalness: 0.0, side: THREE.DoubleSide });
        for (var bsi = 0; bsi < 7; bsi++) {
            var bGeo = new THREE.EllipseCurve(0, 0, 0.10, 0.065, 0, Math.PI * 2);
            var bPts = bGeo.getPoints(16);
            var bShape = new THREE.Shape(bPts);
            var bMesh = new THREE.Mesh(new THREE.ShapeGeometry(bShape), basilMat);
            var bang = (bsi / 7) * Math.PI * 2 + rnd(-0.2, 0.2);
            var brad = rnd(0.2, 0.75);
            bMesh.position.set(Math.cos(bang) * brad, 0.30, Math.sin(bang) * brad);
            bMesh.rotation.x = -Math.PI / 2;
            bMesh.rotation.z = rnd(0, Math.PI);
            g.add(bMesh);
        }

        /* ── Bell peppers (coloured strips) */
        var bpColors = [0xFF5722, 0xFFEB3B, 0x4CAF50];
        for (var bpi = 0; bpi < 12; bpi++) {
            var bpGeo = new THREE.BoxGeometry(0.06, 0.03, 0.20);
            var bpMat = phys({ color: bpColors[bpi % 3], roughness: 0.55, metalness: 0.08 });
            var bpMesh = new THREE.Mesh(bpGeo, bpMat);
            var bpang = (bpi / 12) * Math.PI * 2;
            var bprad = rnd(0.25, 0.80);
            bpMesh.position.set(Math.cos(bpang) * bprad, 0.28, Math.sin(bpang) * bprad);
            bpMesh.rotation.y = rnd(0, Math.PI);
            g.add(bpMesh);
        }

        /* ── Black olives */
        var oliveMat = phys({ color: 0x212121, roughness: 0.45, metalness: 0.18 });
        for (var oli = 0; oli < 8; oli++) {
            var olGeo = new THREE.CylinderGeometry(0.07, 0.07, 0.06, 20);
            var ol = new THREE.Mesh(olGeo, oliveMat);
            var olang = (oli / 8) * Math.PI * 2 + Math.PI / 16;
            ol.position.set(Math.cos(olang) * rnd(0.30, 0.75), 0.285, Math.sin(olang) * rnd(0.30, 0.75));
            g.add(ol);
            // Red olive centre
            var olHole = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.07, 12), phys({ color: 0xFF5722, roughness: 0.6 }));
            olHole.position.copy(ol.position);
            g.add(olHole);
        }

        /* ── Mushroom slices */
        var mushMat = phys({ color: 0xD7CCC8, roughness: 0.72, metalness: 0.02 });
        for (var mushi = 0; mushi < 7; mushi++) {
            var muang = (mushi / 7) * Math.PI * 2 + Math.PI / 14;
            var murad = rnd(0.20, 0.70);
            var muCap = new THREE.Mesh(new THREE.SphereGeometry(0.11, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2), mushMat);
            muCap.position.set(Math.cos(muang) * murad, 0.285, Math.sin(muang) * murad);
            g.add(muCap);
            var muStem = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.04, 0.05, 12), phys({ color: 0xEFEBE9, roughness: 0.65 }));
            muStem.position.copy(muCap.position);
            muStem.position.y -= 0.02;
            g.add(muStem);
        }

        /* ── Fresh cherry tomatoes (halved – dome up) */
        var ctMat = phys({ color: 0xEF5350, roughness: 0.35, metalness: 0.08, clearcoat: 0.7, clearcoatRoughness: 0.15 });
        for (var ctI = 0; ctI < 5; ctI++) {
            var ctGeo = new THREE.SphereGeometry(0.09, 20, 20, 0, Math.PI * 2, 0, Math.PI / 2);
            var ct = new THREE.Mesh(ctGeo, ctMat);
            var ctAng = (ctI / 5) * Math.PI * 2 + Math.PI / 10;
            ct.position.set(Math.cos(ctAng) * rnd(0.30, 0.75), 0.295, Math.sin(ctAng) * rnd(0.30, 0.75));
            g.add(ct);
        }

        /* ── Olive oil drizzle dots */
        var ooMat = phys({ color: 0xF9A825, roughness: 0.15, metalness: 0.0, transparent: true, opacity: 0.75 });
        for (var ooi = 0; ooi < 16; ooi++) {
            var ooMesh = new THREE.Mesh(new THREE.SphereGeometry(0.018, 8, 8), ooMat);
            var ooAng = rnd(0, Math.PI * 2);
            ooMesh.position.set(Math.cos(ooAng) * rnd(0.1, 0.9), 0.30, Math.sin(ooAng) * rnd(0.1, 0.9));
            ooMesh.scale.y = 0.25;
            g.add(ooMesh);
        }

        g.scale.set(1.25, 1.25, 1.25);
        g.userData.type = 'pizza';
        return g;
    };

    /* ═══════════════════════════════════════════
       4. COLD DRINK  – Premium iced beverage
    ═══════════════════════════════════════════ */
    window.create3DDrink = function () {
        var g = new THREE.Group();

        /* ── Glass cup body (lathe for perfectly tapered shape) */
        var glassMat = phys({
            color: 0xFFFFFF,
            roughness: 0.04,
            metalness: 0.0,
            transparent: true,
            opacity: 0.18,
            transmission: 0.92,
            thickness: 0.5,
            clearcoat: 1.0,
            clearcoatRoughness: 0.04,
            ior: 1.45,
            envMapIntensity: 2.0
        });
        var glassGeo = lathe([
            [0.00, 0.00],
            [0.46, 0.00],
            [0.50, 0.06],
            [0.53, 0.40],
            [0.57, 0.80],
            [0.60, 1.20],
            [0.62, 1.50],
            [0.63, 1.60],
            [0.62, 1.64]
        ], 80);
        var glassOuter = new THREE.Mesh(glassGeo, glassMat);
        glassOuter.castShadow = true;
        g.add(glassOuter);

        /* ── Glass bottom disc */
        var bottomGeo = new THREE.CylinderGeometry(0.46, 0.46, 0.04, 48);
        var bottomMat = phys({ color: 0xCCEEFF, roughness: 0.05, metalness: 0.0, transparent: true, opacity: 0.35 });
        g.add(Object.assign(new THREE.Mesh(bottomGeo, bottomMat), { position: new THREE.Vector3(0, 0.02, 0) }));

        /* ── Dark cola liquid */
        var colaGeo = lathe([
            [0.0,  0.04],
            [0.44, 0.04],
            [0.48, 0.40],
            [0.52, 0.80],
            [0.55, 1.20],
            [0.57, 1.45],
            [0.0,  1.45]
        ], 64);
        var colaMat = phys({
            color: 0x1A0800,
            roughness: 0.18,
            metalness: 0.2,
            transparent: true,
            opacity: 0.88,
            clearcoat: 0.5
        });
        g.add(new THREE.Mesh(colaGeo, colaMat));

        /* ── Liquid surface with bubbles effect */
        var surfGeo = new THREE.CylinderGeometry(0.57, 0.57, 0.012, 64);
        var surfMat = phys({ color: 0x3E1000, roughness: 0.05, metalness: 0.6, clearcoat: 0.8 });
        var surf = new THREE.Mesh(surfGeo, surfMat);
        surf.position.y = 1.45;
        g.add(surf);

        /* ── Ice cubes – irregular crystal shapes */
        var iceMat = phys({
            color: 0xDEF8FF,
            roughness: 0.04,
            metalness: 0.0,
            transparent: true,
            opacity: 0.65,
            transmission: 0.6,
            clearcoat: 1.0,
            clearcoatRoughness: 0.02,
            ior: 1.31,
            thickness: 0.3,
            envMapIntensity: 2.5
        });
        var icePositions = [
            [0.15,  0.90,  0.18],
            [-0.18, 1.00, -0.12],
            [0.05,  0.70,  -0.22],
            [-0.10, 1.20,  0.08],
            [0.22,  1.10, -0.08],
            [-0.05, 0.60,  0.15],
            [0.18,  1.30, -0.18]
        ];
        icePositions.forEach(function (ip) {
            var sz = rnd(0.17, 0.26);
            // Bevelled box for ice
            var iceGeo = new THREE.BoxGeometry(sz, sz * rnd(0.8, 1.2), sz * rnd(0.85, 1.1));
            var iceMesh = new THREE.Mesh(iceGeo, iceMat);
            iceMesh.position.set(ip[0], ip[1], ip[2]);
            iceMesh.rotation.set(rnd(0, Math.PI), rnd(0, Math.PI), rnd(0, Math.PI));
            iceMesh.castShadow = true;
            g.add(iceMesh);
            // White specular highlight on each cube
            var hlGeo = new THREE.BoxGeometry(sz * 0.3, sz * 0.2, sz * 0.2);
            var hlMat = new THREE.MeshBasicMaterial({ color: 0xFFFFFF, transparent: true, opacity: 0.7, depthWrite: false });
            var hl = new THREE.Mesh(hlGeo, hlMat);
            hl.position.set(ip[0] + sz * 0.22, ip[1] + sz * 0.22, ip[2]);
            g.add(hl);
        });

        /* ── Condensation droplets on glass exterior */
        var dropMat = phys({ color: 0xB3E5FC, roughness: 0.05, metalness: 0.0, transparent: true, opacity: 0.65, clearcoat: 1.0 });
        for (var dri = 0; dri < 30; dri++) {
            var drRad = 0.010 + Math.random() * 0.018;
            var drMesh = new THREE.Mesh(new THREE.SphereGeometry(drRad, 8, 8), dropMat);
            var drAng = Math.random() * Math.PI * 2;
            var drH = rnd(0.08, 1.50);
            var drR = 0.49 + (drH / 1.6) * 0.14;  // matches glass taper
            drMesh.position.set(Math.cos(drAng) * drR, drH, Math.sin(drAng) * drR);
            g.add(drMesh);
            if (Math.random() > 0.55) {
                var trl = new THREE.Mesh(new THREE.CylinderGeometry(drRad * 0.3, drRad * 0.6, rnd(0.04, 0.12), 8), dropMat);
                trl.position.set(drMesh.position.x, drMesh.position.y - 0.06, drMesh.position.z);
                g.add(trl);
            }
        }

        /* ── White plastic lid */
        var lidMat = phys({ color: 0xF5F5F5, roughness: 0.55, metalness: 0.05, clearcoat: 0.3 });
        var lidGeo = lathe([
            [0.0,  0.00],
            [0.60, 0.00],
            [0.63, 0.04],
            [0.65, 0.10],
            [0.64, 0.14],
            [0.58, 0.16],
            [0.0,  0.16]
        ], 64);
        var lid = new THREE.Mesh(lidGeo, lidMat);
        lid.position.y = 1.62;
        lid.castShadow = true;
        g.add(lid);

        /* ── Dome lid with drinking lip */
        var domeMat = phys({ color: 0xFFFFFF, roughness: 0.45, metalness: 0.0, transparent: true, opacity: 0.42, clearcoat: 0.9 });
        var domeGeo = new THREE.SphereGeometry(0.62, 48, 24, 0, Math.PI * 2, 0, 0.55);
        var dome = new THREE.Mesh(domeGeo, domeMat);
        dome.position.y = 1.75;
        g.add(dome);

        /* ── Red & white striped straw */
        var strawRed = phys({ color: 0xD32F2F, roughness: 0.35, metalness: 0.15 });
        var strawWht = phys({ color: 0xFFFFFF, roughness: 0.35, metalness: 0.15 });
        for (var sri = 0; sri < 11; sri++) {
            var seg = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.19, 16), sri % 2 === 0 ? strawRed : strawWht);
            seg.position.set(0.28, 0.65 + sri * 0.19, 0);
            seg.rotation.z = -0.18;
            g.add(seg);
        }
        // flex bend
        var bendMat = phys({ color: 0xD32F2F, roughness: 0.35, metalness: 0.15 });
        var bend = new THREE.Mesh(new THREE.TorusGeometry(0.09, 0.035, 10, 20, Math.PI / 2), bendMat);
        bend.position.set(0.265, 2.74, 0);
        bend.rotation.set(0, 0, -(Math.PI / 2 + 0.18));
        g.add(bend);
        // vertical top section
        var topStraw = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.4, 16), strawRed);
        topStraw.position.set(0.355, 2.97, 0);
        g.add(topStraw);

        /* ── Rising CO2 bubbles inside liquid */
        var bubbleMat = phys({ color: 0xFFFFFF, roughness: 0.1, transparent: true, opacity: 0.38, depthWrite: false });
        for (var bubi = 0; bubi < 18; bubi++) {
            var bub = new THREE.Mesh(new THREE.SphereGeometry(rnd(0.012, 0.028), 10, 10), bubbleMat);
            bub.position.set(rnd(-0.4, 0.4), rnd(0.15, 1.35), rnd(-0.4, 0.4));
            bub.userData.floatSpeed = rnd(0.003, 0.008);
            bub.userData.isSteam = true;   // reuse float logic
            g.add(bub);
        }

        g.scale.set(1.38, 1.38, 1.38);
        g.userData.type = 'drink';
        return g;
    };

})();
