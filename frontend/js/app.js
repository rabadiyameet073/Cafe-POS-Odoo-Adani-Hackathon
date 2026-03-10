(function () {
    'use strict';

    if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined') {
        gsap.registerPlugin(ScrollTrigger);
    }

    // ============================================
    // DATA
    // ============================================
    const FOOD_MODES = {
        coffee: {
            id: 'coffee',
            label: 'COFFEE',
            emoji: '☕',
            headline: 'Freshly Brewed Happiness',
            subtext: 'Premium beans, perfect roast, unforgettable taste',
            bgColor: '#1a0f0a',
            accentColor: '#D4A574',
            secondaryColor: '#F5E6D3',
            gradientFrom: '#3D2314',
            gradientTo: '#1a0f0a',
            features: [
                { icon: '☕', title: 'Fresh Beans', desc: 'Daily roasted premium Arabica' },
                { icon: '👨‍🍳', title: 'Expert Baristas', desc: 'Award-winning coffee artists' },
                { icon: '🔥', title: 'Perfect Brew', desc: 'Precision temperature control' },
                { icon: '⚡', title: 'Quick Service', desc: 'Ready in under 3 minutes' }
            ],
            marquee: ['☕ ESPRESSO', '✨ CAPPUCCINO', '🌟 LATTE', '💫 AMERICANO', '⭐ MOCHA', '✨ MACCHIATO'],
            quote: '"A good coffee is a language in itself."',
            menuItems: [
                { name: 'Classic Espresso', price: '₹350', desc: 'Rich, bold, perfect', popular: true },
                { name: 'Caramel Macchiato', price: '₹550', desc: 'Sweet vanilla layers', popular: false },
                { name: 'Cold Brew', price: '₹450', desc: '18-hour slow steeped', popular: true },
                { name: 'Matcha Latte', price: '₹500', desc: 'Premium Japanese matcha', popular: false }
            ]
        },
        burger: {
            id: 'burger',
            label: 'BURGER',
            emoji: '🍔',
            headline: 'Big Bites, Bold Flavors',
            subtext: 'Juicy patties, fresh ingredients, unforgettable taste',
            bgColor: '#1a1205',
            accentColor: '#FFD700',
            secondaryColor: '#FFF8E1',
            gradientFrom: '#3D2B0A',
            gradientTo: '#1a1205',
            features: [
                { icon: '🍔', title: 'Premium Beef', desc: '100% grass-fed Angus' },
                { icon: '🥬', title: 'Fresh Daily', desc: 'Farm-to-table ingredients' },
                { icon: '🧀', title: 'Aged Cheese', desc: 'Perfect melt every time' },
                { icon: '🔥', title: 'Flame Grilled', desc: 'Smoky perfection' }
            ],
            marquee: ['🍔 CLASSIC BURGER', '🔥 DOUBLE STACK', '🧀 CHEESE DELUXE', '🥓 BACON SUPREME', '🌶️ SPICY JALAPEÑO', '🍄 MUSHROOM SWISS'],
            quote: '"Life is too short for bad burgers."',
            menuItems: [
                { name: 'Classic Smash', price: '₹1200', desc: 'Double patty, special sauce', popular: true },
                { name: 'Truffle Burger', price: '₹1800', desc: 'Truffle aioli, arugula', popular: false },
                { name: 'BBQ Bacon', price: '₹1500', desc: 'Crispy bacon, onion rings', popular: true },
                { name: 'Veggie Delight', price: '₹1100', desc: 'Beyond meat, avocado', popular: false }
            ]
        },
        pizza: {
            id: 'pizza',
            label: 'PIZZA',
            emoji: '🍕',
            headline: 'Slice of Pure Happiness',
            subtext: 'Stone baked, cheesy goodness, Italian perfection',
            bgColor: '#1a0505',
            accentColor: '#FF6B35',
            secondaryColor: '#FFE4B5',
            gradientFrom: '#4A1010',
            gradientTo: '#1a0505',
            features: [
                { icon: '🍕', title: 'Wood Fired', desc: 'Authentic 900°F oven' },
                { icon: '🧀', title: 'Fresh Mozzarella', desc: 'Imported from Italy' },
                { icon: '🍅', title: 'San Marzano', desc: 'DOP certified tomatoes' },
                { icon: '👨‍👩‍👧‍👦', title: 'Family Recipes', desc: '3 generations of tradition' }
            ],
            marquee: ['🍕 MARGHERITA', '🧀 QUATTRO FORMAGGI', '🥓 PEPPERONI', '🍄 FUNGHI', '🌿 PROSCIUTTO', '🔥 DIAVOLA'],
            quote: '"Pizza is not just food, it\'s a feeling."',
            menuItems: [
                { name: 'Margherita DOC', price: '₹1600', desc: 'Buffalo mozzarella, basil', popular: true },
                { name: 'Pepperoni Feast', price: '₹1800', desc: 'Double pepperoni, cheese', popular: true },
                { name: 'Truffle Bianca', price: '₹2400', desc: 'White sauce, truffle oil', popular: false },
                { name: 'Veggie Supreme', price: '₹1700', desc: 'Seasonal vegetables', popular: false }
            ]
        },
        dessert: {
            id: 'dessert',
            label: 'DRINKS',
            emoji: '🥤',
            headline: 'Taste The Feeling',
            subtext: 'Ice cold refreshment, classic taste, pure happiness',
            bgColor: '#0a0505',
            accentColor: '#E61A27',
            secondaryColor: '#FFFFFF',
            gradientFrom: '#2A0A0A',
            gradientTo: '#0a0505',
            features: [
                { icon: '🥤', title: 'Ice Cold', desc: 'Perfectly chilled always' },
                { icon: '✨', title: 'Classic Taste', desc: 'Original secret recipe' },
                { icon: '🧊', title: 'Refreshing', desc: 'Beat any heat wave' },
                { icon: '🌟', title: 'Premium Quality', desc: 'Only the finest ingredients' }
            ],
            marquee: ['🥤 COCA-COLA', '❄️ SPRITE', '🍋 FANTA', '💜 GRAPE SODA', '🍊 ORANGE CRUSH', '✨ LEMONADE'],
            quote: '"Open happiness. Taste the feeling."',
            menuItems: [
                { name: 'Classic Coke', price: '₹300', desc: 'The original taste', popular: true },
                { name: 'Fresh Lemonade', price: '₹450', desc: 'Hand-squeezed daily', popular: true },
                { name: 'Berry Smoothie', price: '₹600', desc: 'Mixed berries, yogurt', popular: false },
                { name: 'Iced Tea', price: '₹350', desc: 'Brewed fresh, lemon', popular: false }
            ]
        }
    };

    const MODE_ORDER = ['coffee', 'burger', 'pizza', 'dessert'];
    const SWITCH_INTERVAL = 6000;

    const TESTIMONIALS = [
        { name: 'Sarah M.', role: 'Food Blogger', text: 'The best coffee I\'ve ever had! The atmosphere is incredible.', rating: 5, avatar: '👩‍🦰' },
        { name: 'James K.', role: 'Regular Customer', text: 'Their burgers are absolutely legendary. I come here every week!', rating: 5, avatar: '👨' },
        { name: 'Emily R.', role: 'Chef', text: 'As a chef, I appreciate the quality. Their pizza rivals the best in Italy.', rating: 5, avatar: '👩‍🍳' },
        { name: 'Michael T.', role: 'Food Critic', text: 'Odoo Cafe sets the standard for what a modern cafe should be.', rating: 5, avatar: '🧔' }
    ];

    const STATS = [
        { number: '50K+', label: 'Happy Customers', icon: '😊' },
        { number: '15+', label: 'Years Experience', icon: '🏆' },
        { number: '100+', label: 'Menu Items', icon: '📋' },
        { number: '4.9', label: 'Average Rating', icon: '⭐' }
    ];

    const MODE_ICONS = {
        coffee: '<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M18 8h1a4 4 0 0 1 0 8h-1"/><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"/><line x1="6" y1="1" x2="6" y2="4"/><line x1="10" y1="1" x2="10" y2="4"/><line x1="14" y1="1" x2="14" y2="4"/></svg>',
        burger: '<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M3 11h18a1 1 0 0 1 1 1v1a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1v-1a1 1 0 0 1 1-1z"/><path d="M4 11V9a8 8 0 1 1 16 0v2"/><path d="M4 14v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2"/><line x1="6" y1="8" x2="7" y2="8"/><line x1="17" y1="8" x2="18" y2="8"/></svg>',
        pizza: '<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M12 2L2 22h20L12 2z"/><circle cx="12" cy="12" r="1.5"/><circle cx="9" cy="16" r="1"/><circle cx="15" cy="16" r="1"/><circle cx="12" cy="8" r="1"/></svg>',
        dessert: '<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M6 2L3 22h18L18 2H6z"/><line x1="3" y1="8" x2="21" y2="8"/><path d="M12 2v6"/><path d="M9 11v2"/><path d="M15 13v2"/></svg>'
    };

    function isLightMode(id) {
        return id === 'burger' || id === 'coffee';
    }

    // ============================================
    // LOADER
    // ============================================
    function initLoader(onComplete) {
        const wrap = document.getElementById('loader-wrap');
        const progressBar = document.getElementById('loader-progress-bar');
        const percentEl = document.getElementById('loader-percent');
        const skipBtn = document.getElementById('loader-skip');
        const appEl = document.getElementById('app');

        if (!wrap || !appEl) return;

        const taglineLetters = wrap.querySelectorAll('.loader-tagline-letter');
        const logoWrap = wrap.querySelector('.loader-logo-wrap');

        let _finished = false;
        function finish() {
            if (_finished) return;   // ← prevent double-call (delayedCall + skip btn)
            _finished = true;
            gsap.killDelayedCallsTo && gsap.killDelayedCallsTo(finish);

            if (typeof gsap === 'undefined') {
                // Fallback without GSAP - ensure smooth transition
                appEl.style.display = 'block';
                appEl.style.opacity = '0';
                wrap.style.transition = 'opacity 0.8s ease-out';
                wrap.style.opacity = '0';
                setTimeout(function () {
                    wrap.style.display = 'none';
                    appEl.style.transition = 'opacity 0.8s ease-in';
                    appEl.style.opacity = '1';
                    onComplete();
                }, 800);
                return;
            }

            // Premium GSAP animation - smooth fade and scale
            const tl = gsap.timeline({
                onStart: function () {
                    appEl.style.display = 'block';
                    gsap.set(appEl, { opacity: 0, scale: 0.95 });
                }
            });

            tl.to('.loader-logo-wrap', {
                scale: 1.15,
                opacity: 0,
                duration: 0.5,
                ease: 'power2.in'
            })
                .to('.loader-tagline', {
                    opacity: 0,
                    y: -20,
                    duration: 0.4,
                    ease: 'power2.in'
                }, '-=0.3')
                .to('.loader-progress-wrap, .loader-skip', {
                    opacity: 0,
                    y: 20,
                    duration: 0.4,
                    ease: 'power2.in'
                }, '-=0.3')
                .to('.loader-orbit, .loader-orb', {
                    opacity: 0,
                    scale: 0.8,
                    duration: 0.5,
                    ease: 'power2.in'
                }, '-=0.4')
                .to('.loader-corner, .loader-ambient', {
                    opacity: 0,
                    duration: 0.3,
                    ease: 'power2.in'
                }, '-=0.3')
                .to(wrap, {
                    clipPath: 'circle(0% at 50% 50%)',
                    duration: 1.2,
                    ease: 'power3.inOut'
                }, '-=0.2')
                .to(appEl, {
                    opacity: 1,
                    scale: 1,
                    duration: 0.8,
                    ease: 'power2.out'
                }, '-=0.6')
                .call(function () {
                    wrap.style.display = 'none';
                    onComplete();
                });
        }

        skipBtn.style.display = 'none';
        setTimeout(function () {
            skipBtn.style.display = 'flex';
            skipBtn.onclick = finish;
        }, 1500);

        if (typeof gsap !== 'undefined') {
            // Set initial states using actual HTML classes
            gsap.set(logoWrap, { opacity: 0, y: 80, scale: 0.8 });
            gsap.set('.loader-logo', { opacity: 0, scale: 0.5 });
            gsap.set(taglineLetters, { opacity: 0, y: 20, scale: 0.5 });
            gsap.set('.loader-progress-wrap', { opacity: 0, y: 30 });
            gsap.set('.loader-orbit', { opacity: 0, scale: 0.5 });
            gsap.set('.loader-corner', { opacity: 0, scale: 0.8 });
            gsap.set('.loader-orb', { opacity: 0 });

            // Premium entrance animation
            const tl = gsap.timeline();

            tl.to(logoWrap, {
                opacity: 1,
                y: 0,
                scale: 1,
                duration: 1.2,
                ease: 'power4.out'
            })
                .to('.loader-logo', {
                    opacity: 1,
                    scale: 1,
                    duration: 1.0,
                    ease: 'back.out(1.4)'
                }, '-=0.8')
                .to(taglineLetters, {
                    opacity: 1,
                    y: 0,
                    scale: 1,
                    duration: 0.6,
                    stagger: 0.025,
                    ease: 'back.out(2)'
                }, '-=0.8')
                .to('.loader-orbit', {
                    opacity: 1,
                    scale: 1,
                    duration: 0.8,
                    stagger: 0.15,
                    ease: 'power2.out'
                }, '-=1.0')
                .to('.loader-orb', {
                    opacity: 1,
                    duration: 0.6,
                    ease: 'power2.out'
                }, '-=0.8')
                .to('.loader-corner', {
                    opacity: 1,
                    scale: 1,
                    duration: 0.6,
                    stagger: 0.1,
                    ease: 'power2.out'
                }, '-=0.6')
                .to('.loader-progress-wrap', {
                    opacity: 1,
                    y: 0,
                    duration: 0.8,
                    ease: 'power2.out'
                }, '-=0.4');

            // Progress bar animation with smooth easing
            gsap.to(progressBar, {
                width: '100%',
                duration: 3.5,
                delay: 1,
                ease: 'power1.inOut',
                onUpdate: function () {
                    const p = Math.round(this.progress() * 100);
                    if (percentEl) percentEl.textContent = p + '%';
                }
            });

            gsap.delayedCall(5, finish);
        } else {
            progressBar.style.width = '100%';
            if (percentEl) percentEl.textContent = '100%';
            setTimeout(finish, 1000);
        }
    }

    // ============================================
    // THREE.JS SCENE (simplified – no 3D objects if heavy)
    // ============================================
    let threeScene = null;
    let threeObjects = {};
    let threeModeRef = 'coffee';
    let _threeInitDone = false;  // prevents setThreeMode from fighting initThree's opening animation

    // ── Responsive helper: returns camera + object settings per viewport width
    function getResponsive3D() {
        var w = window.innerWidth;
        if (w <= 360) {
            return { fov: 54, cameraZ: 11.5, cameraY: 2.0, scale: 0.52 };
        } else if (w <= 480) {
            return { fov: 52, cameraZ: 10.5, cameraY: 2.1, scale: 0.60 };
        } else if (w <= 640) {
            return { fov: 50, cameraZ: 9.5, cameraY: 2.1, scale: 0.68 };
        } else if (w <= 768) {
            return { fov: 48, cameraZ: 8.8, cameraY: 2.15, scale: 0.78 };
        } else if (w <= 1024) {
            return { fov: 45, cameraZ: 8.0, cameraY: 2.2, scale: 0.90 };
        } else {
            return { fov: 42, cameraZ: 7.0, cameraY: 2.2, scale: 1.00 };
        }
    }

    function initThree(container) {
        if (typeof THREE === 'undefined' || !container) return;
        var r3d = getResponsive3D();
        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(r3d.fov, window.innerWidth / window.innerHeight, 0.1, 100);
        camera.position.set(0, r3d.cameraY, r3d.cameraZ);
        camera.lookAt(0, 0.6, 0);

        const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'high-performance' });
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.setClearColor(0x000000, 0);
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 1.3;
        renderer.outputEncoding = (typeof THREE.sRGBEncoding !== 'undefined') ? THREE.sRGBEncoding : 3001;
        container.appendChild(renderer.domElement);

        // ── Environment map using PMREMGenerator gradient
        if (typeof THREE.PMREMGenerator !== 'undefined') {
            try {
                const pmrem = new THREE.PMREMGenerator(renderer);
                pmrem.compileEquirectangularShader();
                const envScene = new THREE.Scene();
                envScene.background = new THREE.Color(0x111111);
                const envTex = pmrem.fromScene(new (THREE.RoomEnvironment ? THREE.RoomEnvironment : THREE.Scene)()).texture;
                scene.environment = envTex;
                pmrem.dispose();
            } catch (ee) { /* env map optional */ }
        }

        // ── Lights
        const ambient = new THREE.AmbientLight(0xffffff, 0.55);
        scene.add(ambient);

        const keyLight = new THREE.DirectionalLight(0xFFEEDD, 3.0);
        keyLight.position.set(5, 10, 6);
        keyLight.castShadow = true;
        keyLight.shadow.mapSize.set(1024, 1024);
        keyLight.shadow.camera.near = 0.5;
        keyLight.shadow.camera.far = 30;
        keyLight.shadow.bias = -0.001;
        scene.add(keyLight);

        const fillLight = new THREE.DirectionalLight(0xCCDDFF, 1.0);
        fillLight.position.set(-6, 4, -4);
        scene.add(fillLight);

        const rimLight = new THREE.DirectionalLight(0xFFFFFF, 1.6);
        rimLight.position.set(0, -3, -8);
        scene.add(rimLight);

        const accent = new THREE.PointLight(0xD4A574, 5, 20);
        accent.position.set(-4, 4, 4);
        scene.add(accent);

        const back = new THREE.PointLight(0xD4A574, 3.0, 26);
        back.position.set(4, 3, -6);
        scene.add(back);

        // Bottom warm bounce
        const bounce = new THREE.PointLight(0xFF9955, 1.5, 14);
        bounce.position.set(0, -4, 2);
        scene.add(bounce);

        scene.userData = { accentLight: accent, backLight: back, bounceLight: bounce };

        // ── Ground shadow plane
        const shadowGeo = new THREE.PlaneGeometry(10, 10);
        const shadowMat = new THREE.ShadowMaterial({ opacity: 0.22, transparent: true });
        const shadowPlane = new THREE.Mesh(shadowGeo, shadowMat);
        shadowPlane.rotation.x = -Math.PI / 2;
        shadowPlane.position.y = -0.4;
        shadowPlane.receiveShadow = true;
        scene.add(shadowPlane);

        // ── Create objects
        try {
            threeObjects.coffee = typeof window.create3DCoffee === 'function' ? window.create3DCoffee() : createCoffeeCup();
            threeObjects.burger = typeof window.create3DBurger === 'function' ? window.create3DBurger() : createBurger();
            threeObjects.pizza = typeof window.create3DPizza === 'function' ? window.create3DPizza() : createPizza();
            threeObjects.dessert = typeof window.create3DDrink === 'function' ? window.create3DDrink() : createDessert();
        } catch (e) {
            console.error('3D model error:', e);
            threeObjects = { coffee: createCoffeeCup(), burger: createBurger(), pizza: createPizza(), dessert: createDessert() };
        }

        Object.keys(threeObjects).forEach(function (k) {
            const o = threeObjects[k];
            if (!o) return;
            o.visible = false;
            o.scale.set(0, 0, 0);
            o.position.set(0, 0.5, 0);
            // enable shadows on all descendants
            o.traverse(function (c) { if (c.isMesh) { c.castShadow = true; c.receiveShadow = true; } });
            scene.add(o);
        });

        const initial = threeObjects[threeModeRef];
        if (initial) {
            var r3dInit = getResponsive3D();
            var targetScale = r3dInit.scale;
            initial.visible = true;
            if (typeof gsap !== 'undefined') {
                gsap.fromTo(initial.scale,
                    { x: 0, y: 0, z: 0 },
                    { x: targetScale, y: targetScale, z: targetScale, duration: 1.1, ease: 'elastic.out(1, 0.55)' }
                );
            } else {
                initial.scale.set(targetScale, targetScale, targetScale);
            }
        }

        let mouseX = 0, mouseY = 0, targetRotX = 0, targetRotZ = 0;
        function onMouseMove(e) {
            mouseX = (e.clientX / window.innerWidth) * 2 - 1;
            mouseY = -(e.clientY / window.innerHeight) * 2 + 1;
            targetRotX = -mouseY * 0.18;
            targetRotZ = mouseX * 0.12;
        }
        window.addEventListener('mousemove', onMouseMove);

        const clock = new THREE.Clock();
        const lerp = (typeof THREE.MathUtils !== 'undefined' && typeof THREE.MathUtils.lerp === 'function')
            ? THREE.MathUtils.lerp : function (a, b, t) { return a + (b - a) * t; };

        function animate() {
            requestAnimationFrame(animate);
            const t = clock.getElapsedTime();
            Object.keys(threeObjects).forEach(function (k) {
                const obj = threeObjects[k];
                if (!obj || !obj.visible || !obj.scale || obj.scale.x < 0.08) return;
                // Don't fight GSAP during transitions
                if (_transitioning && _transitioning[k]) return;

                // Slow, majestic auto-rotation
                obj.rotation.y += 0.004;

                // Organic floating with subtle wobble
                obj.position.y = 0.5 + Math.sin(t * 0.75) * 0.18 + Math.sin(t * 1.3) * 0.04;

                // Smooth mouse parallax
                obj.rotation.x = lerp(obj.rotation.x, targetRotX, 0.04);
                obj.rotation.z = lerp(obj.rotation.z, targetRotZ, 0.04);

                // Accent light slow orbit
                accent.position.x = Math.sin(t * 0.5) * 5;
                accent.position.z = Math.cos(t * 0.5) * 5;

                // Animate particles (steam/bubbles) on all objects
                obj.children.forEach(function (child) {
                    if (!child.userData || !child.userData.isSteam) return;
                    child.position.y += child.userData.floatSpeed || 0.006;
                    if (child.material && child.material.opacity !== undefined) {
                        child.material.opacity -= 0.0015;
                        if (child.material.opacity <= 0) {
                            child.position.y = (k === 'coffee') ? 1.4 : 0.3;
                            child.material.opacity = 0.18 + Math.random() * 0.15;
                        }
                    }
                    if (child.userData.wobbleSpeed) {
                        child.position.x += Math.sin(t * child.userData.wobbleSpeed * 8) * 0.001;
                    }
                });
            });
            renderer.render(scene, camera);
        }
        animate();

        function onResize() {
            var r3d = getResponsive3D();
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.fov = r3d.fov;
            camera.position.set(0, r3d.cameraY, r3d.cameraZ);
            camera.lookAt(0, 0.6, 0);
            camera.updateProjectionMatrix();
            renderer.setSize(window.innerWidth, window.innerHeight);
            renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
            // Rescale the currently visible object
            Object.keys(threeObjects).forEach(function (k) {
                var obj = threeObjects[k];
                if (!obj || !obj.visible) return;
                var cur = obj.scale.x;
                // Only rescale if not in the middle of a transition and object is fully shown
                if (!(_transitioning && _transitioning[k]) && cur > 0.08) {
                    obj.scale.set(r3d.scale, r3d.scale, r3d.scale);
                }
            });
        }
        window.addEventListener('resize', onResize);

        threeScene = { scene, renderer, container, onMouseMove, onResize };
        return threeScene;
    }

    // Track which object is currently transitioning so animate loop skips it
    let _transitioning = {};

    function setThreeMode(modeId) {
        threeModeRef = modeId;
        if (!threeScene || !threeObjects[modeId]) return;

        // On the very first call right after initThree, initThree already showed
        // the initial object with its own animation — skip to avoid conflict.
        if (!_threeInitDone) {
            _threeInitDone = true;
            return;
        }
        const scene = threeScene.scene;
        const acc = scene.userData.accentLight;
        const back = scene.userData.backLight;
        const bounce = scene.userData.bounceLight;

        // Mode accent colours
        const accentColors = { coffee: 0xD4A574, burger: 0xFFCC00, pizza: 0xFF6B35, dessert: 0xE61A27 };
        const bounceColors = { coffee: 0xFFAA55, burger: 0xFFE066, pizza: 0xFF4400, dessert: 0xFF2244 };
        const targetAccent = new THREE.Color(accentColors[modeId] || 0xD4A574);
        const targetBounce = new THREE.Color(bounceColors[modeId] || 0xFF9955);

        if (typeof gsap === 'undefined') {
            // No GSAP – instant swap
            if (acc) acc.color.copy(targetAccent);
            if (back) back.color.copy(targetAccent);
            if (bounce) bounce.color.copy(targetBounce);
            Object.keys(threeObjects).forEach(function (k) {
                const o = threeObjects[k];
                if (!o) return;
                if (k === modeId) { o.visible = true; o.scale.set(1, 1, 1); }
                else { o.visible = false; o.scale.set(0, 0, 0); }
            });
            return;
        }

        // ── Kill any running tweens on all objects to prevent conflicts
        Object.keys(threeObjects).forEach(function (k) {
            const o = threeObjects[k];
            if (o) { gsap.killTweensOf(o.scale); gsap.killTweensOf(o.rotation); gsap.killTweensOf(o.position); }
        });

        // Collect the currently VISIBLE objects to animate out
        const outObjs = Object.keys(threeObjects).filter(function (k) {
            return k !== modeId && threeObjects[k] && threeObjects[k].visible;
        });
        const inObj = threeObjects[modeId];

        // Mark all objects as transitioning so the animate loop won't fight GSAP
        _transitioning = {};
        outObjs.forEach(function (k) { _transitioning[k] = true; });
        _transitioning[modeId] = true;

        const EXPLODE_DUR = 0.55;
        const IMPLODE_DUR = 1.05;
        const OVERLAP = 0.28;

        const tl = gsap.timeline({
            onComplete: function () { _transitioning = {}; }
        });

        // ── Phase 1: outgoing objects – squash-spin-vanish
        outObjs.forEach(function (k) {
            const obj = threeObjects[k];
            // Freeze its current Y rotation so GSAP controls it
            const startY = obj.rotation.y;
            tl.to(obj.scale, {
                x: 2.2, y: 0.06, z: 2.2,
                duration: EXPLODE_DUR * 0.45,
                ease: 'power3.in',
                overwrite: true
            }, 0);
            tl.to(obj.scale, {
                x: 0, y: 0, z: 0,
                duration: EXPLODE_DUR * 0.55,
                ease: 'power2.in',
                overwrite: true,
                onComplete: function () {
                    obj.visible = false;
                    obj.scale.set(0, 0, 0);
                    obj.rotation.set(0, 0, 0);
                }
            }, EXPLODE_DUR * 0.45);
            tl.to(obj.rotation, {
                y: startY + Math.PI * 2.8,
                duration: EXPLODE_DUR,
                ease: 'power3.in',
                overwrite: true
            }, 0);
        });

        // ── Phase 2: cross-fade lights mid-explosion
        const lr = acc ? acc.color.r : 1, lg = acc ? acc.color.g : 1, lb = acc ? acc.color.b : 1;
        const lightProxy = { r: lr, g: lg, b: lb };
        tl.to(lightProxy, {
            r: targetAccent.r, g: targetAccent.g, b: targetAccent.b,
            duration: 0.65,
            ease: 'power1.inOut',
            overwrite: true,
            onUpdate: function () {
                if (acc) acc.color.setRGB(lightProxy.r, lightProxy.g, lightProxy.b);
                if (back) back.color.setRGB(lightProxy.r, lightProxy.g, lightProxy.b);
            }
        }, EXPLODE_DUR * 0.35);
        if (bounce) {
            tl.to(bounce.color, {
                r: targetBounce.r, g: targetBounce.g, b: targetBounce.b,
                duration: 0.65, overwrite: true
            }, EXPLODE_DUR * 0.35);
        }

        // ── Phase 3: incoming object – spiral up from below, elastic spring land
        const startDelay = Math.max(0, EXPLODE_DUR - OVERLAP);
        inObj.visible = true;
        inObj.scale.set(0, 0, 0);
        inObj.position.set(0, -3.0, 0);
        inObj.rotation.set(0.3, -Math.PI * 1.8, 0.35);

        tl.to(inObj.position, {
            y: 0.5,
            duration: IMPLODE_DUR,
            ease: 'power3.out',
            overwrite: true
        }, startDelay);

        // Squash on the way in, then elastic spring
        var r3dSwitch = getResponsive3D();
        var ts = r3dSwitch.scale; // target (responsive) scale
        tl.to(inObj.scale, {
            x: ts * 1.1, y: ts * 0.85, z: ts * 1.1,
            duration: IMPLODE_DUR * 0.5,
            ease: 'power3.out',
            overwrite: true
        }, startDelay);
        tl.to(inObj.scale, {
            x: ts, y: ts, z: ts,
            duration: IMPLODE_DUR * 0.5,
            ease: 'elastic.out(1.05, 0.5)',
            overwrite: true
        }, startDelay + IMPLODE_DUR * 0.5);

        tl.to(inObj.rotation, {
            x: 0, y: 0, z: 0,
            duration: IMPLODE_DUR,
            ease: 'power2.out',
            overwrite: true
        }, startDelay);
    }

    function createCoffeeCup() {
        const g = new THREE.Group();

        // ── Materials
        const ceramicMat = new THREE.MeshPhysicalMaterial({
            color: 0xF3EDE3, metalness: 0.0, roughness: 0.22,
            clearcoat: 1.0, clearcoatRoughness: 0.08
        });
        const innerMat = new THREE.MeshPhysicalMaterial({
            color: 0x0D0604, roughness: 0.4, metalness: 0.05
        });
        const coffeeLiquid = new THREE.MeshPhysicalMaterial({
            color: 0x2E1305, roughness: 0.05, metalness: 0.1,
            clearcoat: 1.0, clearcoatRoughness: 0.02
        });
        const foamMat = new THREE.MeshPhysicalMaterial({
            color: 0xEDD8A8, roughness: 0.85, metalness: 0.0
        });
        const heartMat = new THREE.MeshPhysicalMaterial({
            color: 0x7A4520, roughness: 0.6
        });

        // ── Saucer
        const saucerBase = new THREE.Mesh(new THREE.CylinderGeometry(1.55, 1.42, 0.1, 48), ceramicMat);
        saucerBase.position.y = -1.18;
        g.add(saucerBase);
        const saucerRim = new THREE.Mesh(new THREE.TorusGeometry(1.42, 0.07, 12, 48), ceramicMat);
        saucerRim.rotation.x = -Math.PI / 2;
        saucerRim.position.y = -1.12;
        g.add(saucerRim);
        const saucerDip = new THREE.Mesh(new THREE.CylinderGeometry(0.72, 0.62, 0.06, 32), ceramicMat);
        saucerDip.position.y = -1.09;
        g.add(saucerDip);

        // ── Cup body (lathe for perfect taper)
        const cupPts = [];
        for (let i = 0; i <= 24; i++) {
            const t = i / 24;
            const y = -0.95 + t * 2.1;
            const r = 0.68 + t * 0.30 + Math.sin(t * Math.PI) * 0.05;
            cupPts.push(new THREE.Vector2(r, y));
        }
        const cupBody = new THREE.Mesh(new THREE.LatheGeometry(cupPts, 48), ceramicMat);
        g.add(cupBody);

        // ── Cup interior (dark lining)
        const innerPts = [];
        for (let i = 0; i <= 20; i++) {
            const t = i / 20;
            const y = -0.92 + t * 1.88;
            const r = 0.60 + t * 0.24;
            innerPts.push(new THREE.Vector2(r, y));
        }
        const cupInner = new THREE.Mesh(new THREE.LatheGeometry(innerPts, 40), innerMat);
        g.add(cupInner);

        // ── Rim torus
        const rim = new THREE.Mesh(new THREE.TorusGeometry(0.975, 0.06, 16, 48), ceramicMat);
        rim.rotation.x = -Math.PI / 2;
        rim.position.y = 1.14;
        g.add(rim);

        // ── Coffee surface
        const coffeeDisc = new THREE.Mesh(new THREE.CircleGeometry(0.90, 48), coffeeLiquid);
        coffeeDisc.rotation.x = -Math.PI / 2;
        coffeeDisc.position.y = 1.09;
        g.add(coffeeDisc);

        // ── Foam base
        const foam = new THREE.Mesh(new THREE.CircleGeometry(0.84, 48), foamMat);
        foam.rotation.x = -Math.PI / 2;
        foam.position.y = 1.10;
        g.add(foam);

        // ── Latte art: heart shape (two circles + v notch)
        const h1 = new THREE.Mesh(new THREE.CircleGeometry(0.20, 24), heartMat);
        h1.rotation.x = -Math.PI / 2;
        h1.position.set(-0.19, 1.115, 0.08);
        g.add(h1);
        const h2 = new THREE.Mesh(new THREE.CircleGeometry(0.20, 24), heartMat);
        h2.rotation.x = -Math.PI / 2;
        h2.position.set(0.19, 1.115, 0.08);
        g.add(h2);
        // Latte art tail drip
        const tail = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.01, 0.38, 12), heartMat);
        tail.rotation.z = 0.3;
        tail.position.set(0.0, 1.115, -0.15);
        tail.rotation.x = Math.PI / 2;
        g.add(tail);

        // ── C-shaped handle (TubeGeometry)
        if (typeof THREE.CatmullRomCurve3 !== 'undefined' && typeof THREE.TubeGeometry !== 'undefined') {
            const handleCurve = new THREE.CatmullRomCurve3([
                new THREE.Vector3(0.96, 0.72, 0),
                new THREE.Vector3(1.58, 0.55, 0),
                new THREE.Vector3(1.74, 0.12, 0),
                new THREE.Vector3(1.72, -0.28, 0),
                new THREE.Vector3(1.54, -0.52, 0),
                new THREE.Vector3(0.96, -0.60, 0),
            ]);
            const handleMesh = new THREE.Mesh(
                new THREE.TubeGeometry(handleCurve, 24, 0.095, 12, false),
                ceramicMat
            );
            g.add(handleMesh);
        }

        // ── Steam particles
        for (let i = 0; i < 7; i++) {
            const s = new THREE.Mesh(
                new THREE.SphereGeometry(0.045 + Math.random() * 0.035, 8, 8),
                new THREE.MeshPhysicalMaterial({ color: 0xFFFFFF, transparent: true, opacity: 0.12 + Math.random() * 0.10 })
            );
            s.position.set((Math.random() - 0.5) * 0.45, 1.45 + Math.random() * 0.7, (Math.random() - 0.5) * 0.35);
            s.userData = { isSteam: true, floatSpeed: 0.004 + Math.random() * 0.005, wobbleSpeed: 0.3 + Math.random() * 0.6 };
            g.add(s);
        }

        g.position.y = 0.15;
        return g;
    }

    function createBurger() {
        const g = new THREE.Group();

        const bunMat = new THREE.MeshPhysicalMaterial({ color: 0xC8803A, roughness: 0.72, clearcoat: 0.2 });
        const bunTopMat = new THREE.MeshPhysicalMaterial({ color: 0xB96E2A, roughness: 0.68, clearcoat: 0.15 });
        const pattyMat = new THREE.MeshPhysicalMaterial({ color: 0x2C1A0E, roughness: 0.92, metalness: 0.05 });
        const cheeseMat = new THREE.MeshPhysicalMaterial({ color: 0xFFCC22, roughness: 0.5, clearcoat: 0.6 });
        const lettuceMat = new THREE.MeshPhysicalMaterial({ color: 0x3AA84B, roughness: 0.8 });
        const tomatoMat = new THREE.MeshPhysicalMaterial({ color: 0xD42020, roughness: 0.55, clearcoat: 0.4 });
        const onionMat = new THREE.MeshPhysicalMaterial({ color: 0xDDAAEE, transparent: true, opacity: 0.85, roughness: 0.4 });
        const sauceMat = new THREE.MeshPhysicalMaterial({ color: 0xCC4411, roughness: 0.3, clearcoat: 0.7 });
        const sesameMat = new THREE.MeshPhysicalMaterial({ color: 0xF5E6C0, roughness: 0.6 });

        let y = -1.1;

        // Bottom bun
        const botBun = new THREE.Mesh(new THREE.CylinderGeometry(1.18, 1.22, 0.32, 48), bunMat);
        botBun.position.y = y; y += 0.32;
        g.add(botBun);

        // Sauce drip on bottom bun
        const sauce = new THREE.Mesh(new THREE.CylinderGeometry(1.14, 1.14, 0.04, 48), sauceMat);
        sauce.position.y = y; y += 0.04;
        g.add(sauce);

        // Patty 1
        const p1 = new THREE.Mesh(new THREE.CylinderGeometry(1.13, 1.15, 0.22, 48), pattyMat);
        p1.position.y = y; y += 0.22;
        g.add(p1);

        // Cheese slice (overhangs slightly)
        const cheese = new THREE.Mesh(new THREE.BoxGeometry(2.42, 0.07, 2.42), cheeseMat);
        cheese.position.y = y; y += 0.07;
        g.add(cheese);

        // Patty 2
        const p2 = new THREE.Mesh(new THREE.CylinderGeometry(1.12, 1.14, 0.19, 48), pattyMat);
        p2.position.y = y; y += 0.19;
        g.add(p2);

        // Tomato slices (3 thin red discs)
        for (let i = 0; i < 3; i++) {
            const tom = new THREE.Mesh(new THREE.CylinderGeometry(1.05, 1.05, 0.06, 32), tomatoMat);
            tom.position.y = y;
            tom.rotation.y = (i / 3) * Math.PI * 2;
            g.add(tom);
        }
        y += 0.06;

        // Onion rings (3 thin tori)
        const onionRing = new THREE.Mesh(new THREE.TorusGeometry(0.72, 0.09, 10, 32), onionMat);
        onionRing.rotation.x = Math.PI / 2;
        onionRing.position.y = y; y += 0.09;
        g.add(onionRing);
        const onionRing2 = new THREE.Mesh(new THREE.TorusGeometry(0.44, 0.08, 10, 32), onionMat);
        onionRing2.rotation.x = Math.PI / 2;
        onionRing2.position.y = y - 0.04;
        g.add(onionRing2);

        // Lettuce (wavy green ring — TorusGeometry scaled in y)
        const lettuce = new THREE.Mesh(new THREE.TorusGeometry(1.08, 0.24, 8, 32), lettuceMat);
        lettuce.rotation.x = Math.PI / 2;
        lettuce.scale.y = 0.22;
        lettuce.position.y = y; y += 0.14;
        g.add(lettuce);

        // Top bun dome
        const topBun = new THREE.Mesh(
            new THREE.SphereGeometry(1.20, 48, 24, 0, Math.PI * 2, 0, Math.PI * 0.52),
            bunTopMat
        );
        topBun.position.y = y;
        g.add(topBun);

        // Sesame seeds on top bun (small ellipsoids)
        const seedPositions = [
            [0, 0.12], [0.45, 0.08], [-0.38, 0.09],
            [0.2, -0.42], [-0.22, -0.38], [0.55, -0.18],
            [-0.52, 0.22], [0.12, 0.48], [-0.14, -0.55]
        ];
        seedPositions.forEach(function (sp) {
            const seed = new THREE.Mesh(new THREE.SphereGeometry(0.07, 8, 6), sesameMat);
            // Map x,z coords onto bun dome surface
            const sx = sp[0], sz = sp[1];
            const dist = Math.sqrt(sx * sx + sz * sz);
            const elev = Math.sqrt(Math.max(0, 1.20 * 1.20 - dist * dist));
            seed.position.set(sx, topBun.position.y + elev * 0.9, sz);
            seed.scale.set(1, 0.45, 1);
            g.add(seed);
        });

        g.position.y = 0.3;
        return g;
    }

    function createPizza() {
        const g = new THREE.Group();

        const crustMat = new THREE.MeshPhysicalMaterial({ color: 0xC8824A, roughness: 0.82, clearcoat: 0.1 });
        const sauceMat = new THREE.MeshPhysicalMaterial({ color: 0xC02020, roughness: 0.6 });
        const cheeseMat = new THREE.MeshPhysicalMaterial({ color: 0xF5E060, roughness: 0.45, clearcoat: 0.55, clearcoatRoughness: 0.3 });
        const pepMat = new THREE.MeshPhysicalMaterial({ color: 0xA01010, roughness: 0.5, clearcoat: 0.4 });
        const tomatoMat = new THREE.MeshPhysicalMaterial({ color: 0xFF2222, roughness: 0.35, clearcoat: 0.8 });
        const basilMat = new THREE.MeshPhysicalMaterial({ color: 0x1E8B2A, roughness: 0.75 });
        const cheeseBubMat = new THREE.MeshPhysicalMaterial({ color: 0xD4A830, roughness: 0.3 });

        // Pizza base disc
        const base = new THREE.Mesh(new THREE.CylinderGeometry(1.85, 1.85, 0.14, 64), crustMat);
        base.position.y = 0;
        g.add(base);

        // Crust ring (raised toroidal outer edge)
        const crust = new THREE.Mesh(new THREE.TorusGeometry(1.72, 0.22, 12, 64), crustMat);
        crust.rotation.x = Math.PI / 2;
        crust.position.y = 0.12;
        g.add(crust);

        // Tomato sauce layer
        const sauce = new THREE.Mesh(new THREE.CylinderGeometry(1.52, 1.52, 0.04, 48), sauceMat);
        sauce.position.y = 0.09;
        g.add(sauce);

        // Cheese layer
        const cheese = new THREE.Mesh(new THREE.CylinderGeometry(1.45, 1.45, 0.06, 48), cheeseMat);
        cheese.position.y = 0.14;
        g.add(cheese);

        // Pepperoni discs (7 scattered)
        const pepPositions = [
            [0, 0], [0.7, 0.3], [-0.65, 0.4], [0.55, -0.65],
            [-0.5, -0.62], [1.0, -0.18], [-0.95, -0.15]
        ];
        pepPositions.forEach(function (pp) {
            const pep = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.24, 0.05, 24), pepMat);
            pep.position.set(pp[0], 0.21, pp[1]);
            g.add(pep);
        });

        // Cherry tomatoes (small red spheres)
        const tomPositions = [[0.3, 0.72], [-0.28, 0.78], [0.82, -0.42], [-0.78, 0.2], [0.2, -0.88]];
        tomPositions.forEach(function (tp) {
            const tom = new THREE.Mesh(new THREE.SphereGeometry(0.12, 14, 10), tomatoMat);
            tom.position.set(tp[0], 0.26, tp[1]);
            g.add(tom);
        });

        // Basil leaf shapes (flat ellipses)
        const basilPos = [[0.48, 0.55], [-0.55, -0.48], [0.0, 0.90]];
        basilPos.forEach(function (bp) {
            const leaf = new THREE.Mesh(new THREE.CircleGeometry(0.13, 8), basilMat);
            leaf.rotation.x = -Math.PI / 2;
            leaf.position.set(bp[0], 0.24, bp[1]);
            g.add(leaf);
        });

        // Cheese bubble highlights (golden bumps)
        for (let i = 0; i < 9; i++) {
            const ang = (i / 9) * Math.PI * 2;
            const rad = 0.55 + Math.random() * 0.6;
            const bub = new THREE.Mesh(new THREE.SphereGeometry(0.07 + Math.random() * 0.05, 8, 8), cheeseBubMat);
            bub.position.set(Math.cos(ang) * rad, 0.18, Math.sin(ang) * rad);
            g.add(bub);
        }

        g.rotation.x = -0.28;
        g.position.y = 0.2;
        return g;
    }

    function createDessert() {
        var g = new THREE.Group();

        // ── Materials ──────────────────────────────────────────────────────
        // Glass: frosted teal tint, high enough opacity to see clearly
        var glassMat = new THREE.MeshPhysicalMaterial({
            color: 0x88DDFF, transparent: true, opacity: 0.50,
            roughness: 0.06, metalness: 0.0,
            clearcoat: 1.0, clearcoatRoughness: 0.02
        });
        // Glass rim highlight ring (opaque white-ish tint)
        var rimMat = new THREE.MeshPhysicalMaterial({
            color: 0xCCEEFF, transparent: true, opacity: 0.82,
            roughness: 0.05, clearcoat: 1.0
        });
        // Cola: warm amber-brown (looks like cola/soda with light)
        var colaMat = new THREE.MeshPhysicalMaterial({
            color: 0xB05A10, transparent: true, opacity: 0.96,
            roughness: 0.08, clearcoat: 0.8
        });
        // Cola surface: lighter amber highlight
        var colaTopMat = new THREE.MeshPhysicalMaterial({
            color: 0xD4751A, roughness: 0.12, metalness: 0.05
        });
        // Ice: glassy blue-white
        var iceMat = new THREE.MeshPhysicalMaterial({
            color: 0xBBDDFF, transparent: true, opacity: 0.72,
            roughness: 0.08, clearcoat: 1.0, clearcoatRoughness: 0.01
        });
        // Straw: bold red-white striped look (alternate segments)
        var strawRedMat = new THREE.MeshPhysicalMaterial({ color: 0xFF2233, roughness: 0.25 });
        var strawWhiteMat = new THREE.MeshPhysicalMaterial({ color: 0xFFFFFF, roughness: 0.25 });
        // Lid: semi-opaque dark plastic
        var lidMat = new THREE.MeshPhysicalMaterial({
            color: 0x181818, transparent: true, opacity: 0.82, roughness: 0.25
        });
        // Bubbles inside the cola
        var bubbleMat = new THREE.MeshPhysicalMaterial({
            color: 0xFFFFFF, transparent: true, opacity: 0.28, roughness: 0.0
        });
        // Condensation droplets on outside of glass
        var dropMat = new THREE.MeshPhysicalMaterial({
            color: 0x88CCEE, transparent: true, opacity: 0.60, roughness: 0.1
        });

        // ── Lathe profile for the tall glass ──────────────────────────────
        var glassPts = [];
        for (var i = 0; i <= 30; i++) {
            var t = i / 30;
            var y = -1.2 + t * 2.6;     // total height ~2.6 units
            var r;
            if (t < 0.05) r = 0.70;               // flat base
            else if (t < 0.15) r = 0.62 - (t - 0.05) * 0.8; // slight taper in
            else r = 0.56 + t * 0.32;   // gentle flare upward
            glassPts.push(new THREE.Vector2(r, y));
        }
        var glass = new THREE.Mesh(new THREE.LatheGeometry(glassPts, 52), glassMat);
        g.add(glass);

        // Rim torus at mouth — makes the top edge clearly visible
        var rimY = glassPts[glassPts.length - 1].y;
        var rimR = glassPts[glassPts.length - 1].x;
        var rim = new THREE.Mesh(new THREE.TorusGeometry(rimR, 0.045, 10, 52), rimMat);
        rim.rotation.x = Math.PI / 2;
        rim.position.y = rimY;
        g.add(rim);

        // Base disc — solid bottom
        var baseMat = new THREE.MeshPhysicalMaterial({ color: 0x66BBDD, transparent: true, opacity: 0.70, roughness: 0.1 });
        var base = new THREE.Mesh(new THREE.CylinderGeometry(glassPts[0].x * 0.92, glassPts[0].x * 0.92, 0.10, 48), baseMat);
        base.position.y = glassPts[0].y + 0.04;
        g.add(base);

        // ── Cola liquid (fills roughly ¾ of glass height) ─────────────────
        var colaMaxIdx = 23;
        var colaPts = glassPts.slice(0, colaMaxIdx).map(function (p) {
            return new THREE.Vector2(p.x * 0.82, p.y + 0.05);
        });
        var cola = new THREE.Mesh(new THREE.LatheGeometry(colaPts, 44), colaMat);
        g.add(cola);

        // Cola top disc (flat amber surface)
        var colaTopY = colaPts[colaPts.length - 1].y;
        var colaTopR = colaPts[colaPts.length - 1].x;
        var colaTop = new THREE.Mesh(new THREE.CircleGeometry(colaTopR, 44), colaTopMat);
        colaTop.rotation.x = -Math.PI / 2;
        colaTop.position.y = colaTopY;
        g.add(colaTop);

        // ── Dome lid ──────────────────────────────────────────────────────
        var lid = new THREE.Mesh(
            new THREE.SphereGeometry(rimR + 0.06, 36, 16, 0, Math.PI * 2, 0, 0.52),
            lidMat
        );
        lid.position.y = rimY - 0.04;
        g.add(lid);

        // Lid outer ring flange
        var lidRing = new THREE.Mesh(new THREE.TorusGeometry(rimR + 0.06, 0.05, 8, 48), lidMat);
        lidRing.rotation.x = Math.PI / 2;
        lidRing.position.y = rimY - 0.04;
        g.add(lidRing);

        // ── Ice cubes ─────────────────────────────────────────────────────
        var iceConfigs = [
            { x: 0.10, y: 0.05, z: 0.12, ry: 0.40 },
            { x: -0.22, y: 0.30, z: -0.08, ry: 1.10 },
            { x: 0.16, y: 0.55, z: -0.20, ry: 0.70 }
        ];
        iceConfigs.forEach(function (ic) {
            var ice = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.30, 0.30), iceMat);
            ice.position.set(ic.x, ic.y, ic.z);
            ice.rotation.set(0.2, ic.ry, 0.15);
            g.add(ice);
        });

        // ── Straw — alternating red/white cylinders, angled ────────────────
        var strawSegments = 7;
        var segH = 0.38;
        for (var s = 0; s < strawSegments; s++) {
            var mat = (s % 2 === 0) ? strawRedMat : strawWhiteMat;
            var seg = new THREE.Mesh(new THREE.CylinderGeometry(0.058, 0.058, segH, 12), mat);
            seg.position.set(0.30, rimY - 0.60 + s * segH, 0.16);
            seg.rotation.z = -0.20;
            seg.rotation.x = 0.08;
            g.add(seg);
        }

        // ── Condensation droplets on outer glass surface ───────────────────
        for (var d = 0; d < 12; d++) {
            var ang = Math.random() * Math.PI * 2;
            var ht = -0.8 + Math.random() * 1.6;
            var tVal = (ht + 1.2) / 2.6;
            var rVal = (tVal < 0.15) ? 0.62 : (0.56 + tVal * 0.32);
            var drop = new THREE.Mesh(new THREE.SphereGeometry(0.028 + Math.random() * 0.022, 7, 7), dropMat);
            drop.position.set(Math.cos(ang) * (rVal + 0.04), ht, Math.sin(ang) * (rVal + 0.04));
            g.add(drop);
        }

        // ── Bubbles rising inside cola ─────────────────────────────────────
        for (var b = 0; b < 12; b++) {
            var bub = new THREE.Mesh(
                new THREE.SphereGeometry(0.028 + Math.random() * 0.022, 8, 8),
                bubbleMat.clone()
            );
            bub.position.set(
                (Math.random() - 0.5) * 0.60,
                -0.50 + Math.random() * 1.20,
                (Math.random() - 0.5) * 0.50
            );
            bub.userData = {
                isSteam: true,
                floatSpeed: 0.005 + Math.random() * 0.007,
                wobbleSpeed: 0.15 + Math.random() * 0.40
            };
            g.add(bub);
        }

        g.rotation.x = -0.15;
        g.position.y = 0.1;
        g.scale.set(1.15, 1.15, 1.15);   // slightly larger so it reads at same visual size as other objects
        return g;
    }

    // ============================================
    // DOM UPDATES (mode-based)
    // ============================================
    function updateNavbar(mode) {
        const nav = document.getElementById('navbar');
        const logo = document.getElementById('nav-logo');
        const logoIcon = document.getElementById('nav-logo-icon');
        const orderBtn = document.getElementById('nav-order-btn');
        const loginBtn = document.getElementById('nav-login-btn');
        const mobileLoginBtn = document.getElementById('nav-login-mobile');
        if (!nav || !logo || !orderBtn) return;
        const accent = mode.accentColor;
        const light = isLightMode(mode.id);

        // Brand + icon
        logo.style.color = accent;
        logo.style.textShadow = '0 0 30px ' + accent + '50';
        if (logoIcon) {
            const svg = (MODE_ICONS[mode.id] || MODE_ICONS.coffee).replace(/stroke="currentColor"/g, 'stroke="' + accent + '"');
            logoIcon.innerHTML = svg;
            logoIcon.style.filter = 'drop-shadow(0 0 8px ' + accent + '60)';
        }

        // Primary "Order" button
        orderBtn.style.background = 'linear-gradient(135deg, ' + accent + ', ' + accent + 'cc)';
        orderBtn.style.color = light ? '#000' : '#fff';
        orderBtn.style.boxShadow = '0 4px 20px ' + accent + '40';
        const cartSvg = orderBtn.querySelector('.cart-icon');
        if (cartSvg) cartSvg.setAttribute('stroke', light ? '#000' : '#fff');

        // Login button (desktop) – keep premium style but sync with active theme
        if (loginBtn) {
            loginBtn.style.borderColor = accent + 'b3'; // ~70% alpha
            loginBtn.style.background = 'linear-gradient(135deg, ' + accent + ', ' + accent + 'cc)';
            loginBtn.style.color = light ? '#000' : '#000';
            loginBtn.style.boxShadow = '0 4px 15px ' + accent + '4d';
        }

        // Login button (mobile dropdown)
        if (mobileLoginBtn) {
            mobileLoginBtn.style.background = 'linear-gradient(135deg, ' + accent + ', ' + accent + 'cc)';
            mobileLoginBtn.style.borderColor = accent + 'b3';
            mobileLoginBtn.style.color = light ? '#000' : '#000';
            const icon = mobileLoginBtn.querySelector('svg');
            if (icon) icon.style.stroke = '#000';
        }
    }

    function updateHero(mode) {
        const home = document.getElementById('home');
        const gradient = document.getElementById('hero-gradient');
        const bgText = document.getElementById('hero-bg-text');
        const badge = document.getElementById('hero-badge');
        const badgeEmoji = document.getElementById('hero-badge-emoji');
        const badgeLabel = document.getElementById('hero-badge-label');
        const h1 = document.getElementById('hero-headline-1');
        const h2 = document.getElementById('hero-headline-2');
        const sub = document.getElementById('hero-subtext');
        const ctaOrder = document.getElementById('hero-cta-order');
        if (!home) return;

        home.style.background = 'linear-gradient(135deg, ' + mode.gradientFrom + ' 0%, ' + mode.bgColor + ' 100%)';
        if (gradient) gradient.style.background = 'radial-gradient(ellipse at center, ' + mode.accentColor + '15 0%, transparent 70%)';
        if (bgText) { bgText.textContent = mode.label; bgText.style.color = mode.accentColor; }
        if (badge) { badge.style.background = mode.accentColor + '15'; badge.style.borderColor = mode.accentColor + '30'; }
        if (badgeEmoji) badgeEmoji.textContent = mode.emoji;
        if (badgeLabel) badgeLabel.textContent = mode.label + ' SPECIAL';
        if (badgeLabel) badgeLabel.style.color = mode.accentColor;

        const words = mode.headline.split(' ');
        const last = words.pop();
        if (h1) h1.textContent = words.join(' ');
        if (h2) { h2.textContent = last; h2.style.color = mode.accentColor; h2.style.textShadow = '0 0 60px ' + mode.accentColor + '80'; }
        if (sub) sub.textContent = mode.subtext;
        if (ctaOrder) {
            ctaOrder.style.background = 'linear-gradient(135deg, ' + mode.accentColor + ', ' + mode.accentColor + 'cc)';
            ctaOrder.style.color = isLightMode(mode.id) ? '#000' : '#fff';
            ctaOrder.style.boxShadow = '0 8px 30px ' + mode.accentColor + '40';
        }

        const container = document.getElementById('mode-buttons');
        if (!container) return;
        container.innerHTML = '';
        MODE_ORDER.forEach(function (m, idx) {
            const data = FOOD_MODES[m];
            const isActive = m === mode.id;
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'rounded-full flex items-center justify-center cursor-pointer transition-all duration-300 hover:scale-110 active:scale-95 min-w-[44px] min-h-[44px] ' + (isActive ? 'w-12 h-12 sm:w-14 sm:h-14 opacity-100' : 'w-10 h-10 sm:w-11 sm:h-11 opacity-85 hover:opacity-100');
            btn.style.background = isActive ? 'linear-gradient(135deg, ' + mode.accentColor + ', ' + mode.bgColor + ')' : 'rgba(255,255,255,0.12)';
            btn.style.border = isActive ? '2px solid ' + mode.accentColor : '2px solid transparent';
            btn.style.boxShadow = isActive ? '0 0 25px ' + mode.accentColor + '60' : 'none';
            btn.setAttribute('aria-label', 'Switch to ' + data.label);
            btn.textContent = data.emoji;  // plain emoji for mode buttons
            btn.dataset.modeIndex = String(idx);
            container.appendChild(btn);
        });
    }

    function updateStats(mode) {
        const section = document.getElementById('stats-section');
        const grid = document.getElementById('stats-grid');
        const gradient = document.getElementById('stats-gradient');
        const marqueeWrap = document.getElementById('stats-marquee-wrap');
        const marqueeInner = document.getElementById('stats-marquee-inner');
        if (!section || !grid) return;

        if (section) section.style.background = mode.bgColor;
        if (gradient) gradient.style.background = 'linear-gradient(180deg, ' + mode.accentColor + '08 0%, transparent 100%)';
        if (marqueeWrap) marqueeWrap.style.background = 'linear-gradient(90deg, ' + mode.accentColor + ', ' + mode.accentColor + 'cc)';

        grid.innerHTML = STATS.map(function (s) {
            return '<div class="stat-item text-center group hover-lift cursor-default rounded-2xl py-3 sm:py-4">' +
                '<div class="text-3xl sm:text-4xl md:text-5xl mb-2 sm:mb-3 hover-icon-wobble inline-block">' + s.icon + '</div>' +
                '<div class="font-serif text-2xl sm:text-3xl md:text-5xl font-bold mb-1 sm:mb-2 stat-number" style="color:' + mode.accentColor + ';text-shadow:0 0 30px ' + mode.accentColor + '40">' + s.number + '</div>' +
                '<div class="text-white/85 text-xs sm:text-sm md:text-base font-medium">' + s.label + '</div></div>';
        }).join('');

        if (marqueeInner) {
            const arr = [].concat(mode.marquee, mode.marquee, mode.marquee, mode.marquee, mode.marquee, mode.marquee);
            const color = isLightMode(mode.id) ? 'rgba(0,0,0,0.8)' : 'rgba(255,255,255,0.9)';
            marqueeInner.innerHTML = arr.map(function (t, i) {
                return '<span class="text-lg sm:text-2xl md:text-4xl mx-4 sm:mx-6 md:mx-10 font-black select-none" style="color:' + color + '">' + t + '</span>';
            }).join('');
        }
    }

    function updateFeatures(mode) {
        const section = document.getElementById('features-section');
        const badge = document.getElementById('features-badge');
        const label = document.getElementById('features-mode-label');
        const grid = document.getElementById('features-grid');
        if (!section || !grid) return;

        section.style.background = 'linear-gradient(180deg, ' + mode.bgColor + ' 0%, ' + mode.gradientFrom + ' 100%)';
        if (badge) { badge.style.background = mode.accentColor + '20'; badge.style.color = mode.accentColor; }
        if (label) { label.textContent = mode.label; label.style.color = mode.accentColor; }

        grid.innerHTML = mode.features.map(function (f) {
            return '<div class="feature-card glass card-shine interactive-card p-5 sm:p-6 md:p-8 rounded-2xl sm:rounded-3xl text-center group cursor-pointer border-animate" style="border:2px solid ' + mode.accentColor + '30">' +
                '<div class="feature-icon w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-4 sm:mb-6 rounded-xl sm:rounded-2xl flex items-center justify-center text-4xl sm:text-5xl group-hover:scale-110 transition-transform duration-300 hover-icon-wobble" style="background:linear-gradient(135deg, ' + mode.accentColor + '30, ' + mode.accentColor + '10)">' + f.icon + '</div>' +
                '<h3 class="font-serif text-xl font-bold mb-3" style="color:' + mode.secondaryColor + '">' + f.title + '</h3>' +
                '<p class="text-white/80 text-sm leading-relaxed">' + f.desc + '</p></div>';
        }).join('');
    }

    function updateMenu(mode) {
        const section = document.getElementById('menu');
        const gradient = document.getElementById('menu-gradient');
        const badge = document.getElementById('menu-badge');
        const label = document.getElementById('menu-mode-label');
        const items = document.getElementById('menu-items');
        const viewFull = document.getElementById('menu-view-full');
        if (!section || !items) return;

        section.style.background = mode.bgColor;
        if (gradient) gradient.style.background = 'radial-gradient(ellipse at top, ' + mode.accentColor + '10 0%, transparent 50%)';
        if (badge) { badge.style.background = mode.accentColor + '20'; badge.style.color = mode.accentColor; }
        if (label) { label.textContent = mode.label; label.style.color = mode.accentColor; }
        if (viewFull) { viewFull.style.borderColor = mode.accentColor; viewFull.style.background = mode.accentColor + '10'; }

        const light = isLightMode(mode.id);
        items.innerHTML = mode.menuItems.map(function (item, i) {
            let popular = '';
            if (item.popular) {
                popular = '<div class="absolute top-2 right-2 sm:top-3 sm:right-3 px-2 py-0.5 sm:px-3 sm:py-1 rounded-full text-[10px] sm:text-xs font-bold animate-subtle-pulse" style="background:' + mode.accentColor + ';color:' + (light ? '#000' : '#fff') + '">POPULAR</div>';
            }
            return '<div class="menu-item menu-card glass p-4 sm:p-5 md:p-6 rounded-xl sm:rounded-2xl flex flex-col sm:flex-row items-center gap-4 sm:gap-6 group cursor-pointer relative overflow-hidden" style="border-left:4px solid ' + mode.accentColor + '">' +
                popular +
                '<div class="w-16 h-16 sm:w-20 sm:h-20 rounded-xl sm:rounded-2xl flex items-center justify-center text-3xl sm:text-4xl shrink-0 group-hover:scale-110 transition-transform duration-300" style="background:' + mode.accentColor + '20">' + mode.emoji + '</div>' +
                '<div class="flex-1 min-w-0 text-center sm:text-left"><h3 class="font-serif text-lg sm:text-xl font-bold text-white mb-1">' + item.name + '</h3><p class="text-white/75 text-xs sm:text-sm mb-2">' + item.desc + '</p></div>' +
                '<div class="flex items-center gap-2 sm:gap-3 shrink-0"><span class="font-bold text-xl sm:text-2xl" style="color:' + mode.accentColor + '">' + item.price + '</span>' +
                '<button type="button" class="menu-add-btn w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center font-bold text-base sm:text-lg transition-colors hover:opacity-90 min-w-[36px] min-h-[36px]" style="background:' + mode.accentColor + ';color:' + (light ? '#000' : '#fff') + '" aria-label="Add to cart">+</button></div></div>';
        }).join('');
    }

    function updateTestimonials(mode) {
        const section = document.getElementById('testimonials-section');
        const badge = document.getElementById('testimonials-badge');
        const accentSpan = document.getElementById('testimonials-accent');
        const grid = document.getElementById('testimonials-grid');
        if (!section || !grid) return;

        section.style.background = 'linear-gradient(180deg, ' + mode.gradientFrom + ' 0%, ' + mode.bgColor + ' 100%)';
        if (badge) { badge.style.background = mode.accentColor + '20'; badge.style.color = mode.accentColor; }
        if (accentSpan) accentSpan.style.color = mode.accentColor;

        grid.innerHTML = TESTIMONIALS.map(function (t) {
            let stars = '';
            for (let i = 0; i < t.rating; i++) stars += '<span class="text-sm sm:text-base" style="color:' + mode.accentColor + '">★</span>';
            return '<div class="testimonial-item testimonial-card glass p-4 sm:p-5 md:p-6 rounded-xl sm:rounded-2xl hover-lift">' +
                '<div class="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4"><div class="w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center text-lg sm:text-2xl shrink-0" style="background:' + mode.accentColor + '20">' + t.avatar + '</div>' +
                '<div class="min-w-0"><h4 class="font-bold text-white text-sm sm:text-base">' + t.name + '</h4><p class="text-white/75 text-xs">' + t.role + '</p></div></div>' +
                '<div class="flex gap-0.5 sm:gap-1 mb-2 sm:mb-3">' + stars + '</div>' +
                '<p class="text-white/90 text-xs sm:text-sm leading-relaxed">"' + t.text + '"</p></div>';
        }).join('');
    }

    function updateQuote(mode) {
        const section = document.getElementById('quote-section');
        const gradient = document.getElementById('quote-gradient');
        const mark = document.getElementById('quote-mark');
        const text = document.getElementById('quote-text');
        const badge = document.getElementById('quote-badge');
        const emoji = document.getElementById('quote-emoji');
        const brand = document.getElementById('quote-brand');
        if (!section) return;

        section.style.background = 'linear-gradient(135deg, ' + mode.bgColor + ' 0%, ' + mode.gradientFrom + ' 100%)';
        if (gradient) gradient.style.background = 'radial-gradient(circle at 50% 50%, ' + mode.accentColor + '20, transparent 60%)';
        if (mark) mark.style.color = mode.accentColor;
        if (text) text.textContent = mode.quote;
        if (badge) { badge.style.background = mode.accentColor + '15'; badge.style.border = '1px solid ' + mode.accentColor + '30'; }
        if (emoji) emoji.textContent = mode.emoji;
        if (brand) brand.style.color = mode.accentColor;
    }

    function updateCTA(mode) {
        const section = document.getElementById('contact');
        const card = document.getElementById('cta-card');
        const banner = document.getElementById('cta-banner');
        const bannerText = document.getElementById('cta-banner-text');
        const gradient = document.getElementById('cta-gradient');
        const emoji = document.getElementById('cta-emoji');
        const accent = document.getElementById('cta-accent');
        const orderBtn = document.getElementById('cta-order-btn');
        const callBtn = document.getElementById('cta-call-btn');
        if (!section || !card) return;

        section.style.background = mode.bgColor;
        if (card) card.style.borderColor = mode.accentColor + '30';
        if (banner) { banner.style.background = 'linear-gradient(90deg, ' + mode.accentColor + 'dd, ' + mode.accentColor + ', ' + mode.accentColor + 'dd)'; banner.style.boxShadow = '0 4px 20px ' + mode.accentColor + '50'; }
        if (bannerText) bannerText.style.color = isLightMode(mode.id) ? '#000' : '#fff';
        if (gradient) gradient.style.background = 'radial-gradient(circle at top, ' + mode.accentColor + '15 0%, transparent 60%)';
        if (emoji) emoji.textContent = mode.emoji;
        if (accent) accent.style.color = mode.accentColor;
        if (orderBtn) { orderBtn.style.background = 'linear-gradient(135deg, ' + mode.accentColor + ', ' + mode.accentColor + 'cc)'; orderBtn.style.color = isLightMode(mode.id) ? '#000' : '#fff'; orderBtn.style.boxShadow = '0 8px 30px ' + mode.accentColor + '40'; }
        if (callBtn) { callBtn.style.borderColor = mode.accentColor; callBtn.style.background = mode.accentColor + '10'; }
    }

    function updateFooter(mode) {
        const emoji = document.getElementById('footer-emoji');
        const hoursTitle = document.getElementById('footer-hours-title');
        const contactTitle = document.getElementById('footer-contact-title');
        const socials = document.querySelectorAll('.footer-social');
        if (emoji) emoji.textContent = mode.emoji;
        if (hoursTitle) hoursTitle.style.color = mode.accentColor;
        if (contactTitle) contactTitle.style.color = mode.accentColor;
        socials.forEach(function (a, i) {
            a.style.background = mode.accentColor + '20';
        });
    }

    function updateAllSections(mode) {
        updateNavbar(mode);
        updateHero(mode);
        updateStats(mode);
        updateFeatures(mode);
        updateMenu(mode);
        updateTestimonials(mode);
        updateQuote(mode);
        updateCTA(mode);
        updateFooter(mode);
        setThreeMode(mode.id);
    }

    function flashOverlay(mode) {
        const el = document.getElementById('flash-overlay');
        if (!el) return;
        el.style.background = 'radial-gradient(circle at center, ' + mode.accentColor + '45, ' + mode.accentColor + '15 40%, transparent 70%)';
        el.style.opacity = '0.5';
        if (typeof gsap !== 'undefined') {
            gsap.to(el, { opacity: 0, duration: 1.5, ease: 'power3.inOut' });
        } else {
            el.style.opacity = '0';
        }
    }

    // ============================================
    // SCROLL TRIGGER
    // ============================================
    function initScrollTrigger() {
        if (typeof ScrollTrigger === 'undefined' || typeof gsap === 'undefined') return;

        // ── Hero Entry – staggered badge + headline reveal ──
        const heroBadge = document.getElementById('hero-badge');
        const heroH1 = document.getElementById('hero-headline-1');
        const heroH2 = document.getElementById('hero-headline-2');
        const heroSub = document.getElementById('hero-subtext');
        const heroCtas = document.querySelectorAll('#home .flex-wrap > a');
        if (heroBadge) {
            const heroTl = gsap.timeline({ delay: 0.2 });
            heroTl.fromTo(heroBadge,
                { y: -30, opacity: 0, scale: 0.8 },
                { y: 0, opacity: 1, scale: 1, duration: 0.8, ease: 'back.out(1.4)' }
            );
            if (heroH1) heroTl.fromTo(heroH1,
                { y: 40, opacity: 0, filter: 'blur(8px)' },
                { y: 0, opacity: 1, filter: 'blur(0px)', duration: 0.9, ease: 'power4.out' }, '-=0.4');
            if (heroH2) heroTl.fromTo(heroH2,
                { y: 50, opacity: 0, scale: 0.85, filter: 'blur(10px)' },
                { y: 0, opacity: 1, scale: 1, filter: 'blur(0px)', duration: 1, ease: 'power4.out' }, '-=0.5');
            if (heroSub) heroTl.fromTo(heroSub,
                { y: 25, opacity: 0 },
                { y: 0, opacity: 1, duration: 0.7, ease: 'power3.out' }, '-=0.4');
            if (heroCtas.length) heroTl.fromTo(heroCtas,
                { y: 30, opacity: 0, scale: 0.9 },
                { y: 0, opacity: 1, scale: 1, duration: 0.6, stagger: 0.12, ease: 'back.out(1.3)' }, '-=0.3');
        }

        // ── Stats – elastic pop with slight rotation ──
        const stats = document.getElementById('stats-section');
        if (stats) {
            ScrollTrigger.create({
                trigger: stats,
                start: 'top 80%',
                once: true,
                onEnter: function () {
                    const items = stats.querySelectorAll('.stat-item');
                    gsap.fromTo(items,
                        { y: 60, opacity: 0, scale: 0.7, rotation: -5 },
                        { y: 0, opacity: 1, scale: 1, rotation: 0, duration: 0.9, stagger: 0.12, ease: 'elastic.out(1, 0.6)' }
                    );
                    // Stat number counter wobble
                    items.forEach(function (item) {
                        const numEl = item.querySelector('.stat-number');
                        if (numEl) {
                            gsap.fromTo(numEl, { scale: 0.5 }, { scale: 1, duration: 0.6, delay: 0.3, ease: 'elastic.out(1.2, 0.5)' });
                        }
                    });
                }
            });
        }

        // ── Features – 3D flip-in card reveal ──
        const features = document.getElementById('features-section');
        if (features) {
            ScrollTrigger.create({
                trigger: features,
                start: 'top 78%',
                once: true,
                onEnter: function () {
                    const cards = features.querySelectorAll('.feature-card');
                    const headers = features.querySelectorAll('.feature-heading');
                    gsap.fromTo(headers,
                        { y: 40, opacity: 0, filter: 'blur(4px)' },
                        { y: 0, opacity: 1, filter: 'blur(0px)', duration: 0.8, stagger: 0.1, ease: 'power4.out' }
                    );
                    gsap.fromTo(cards,
                        { y: 80, opacity: 0, scale: 0.8, rotationX: 15 },
                        { y: 0, opacity: 1, scale: 1, rotationX: 0, duration: 1, stagger: 0.15, ease: 'power4.out', delay: 0.2 }
                    );
                    // Icon pop after cards land
                    const icons = features.querySelectorAll('.feature-icon');
                    gsap.fromTo(icons,
                        { scale: 0, rotation: -180 },
                        { scale: 1, rotation: 0, duration: 0.7, stagger: 0.15, ease: 'back.out(2)', delay: 0.6 }
                    );
                }
            });
        }

        // ── Menu – cascade slide with alternating directions ──
        const menu = document.getElementById('menu');
        if (menu) {
            ScrollTrigger.create({
                trigger: menu,
                start: 'top 78%',
                once: true,
                onEnter: function () {
                    const headers = menu.querySelectorAll('.menu-heading');
                    const items = menu.querySelectorAll('.menu-item');
                    gsap.fromTo(headers,
                        { y: 35, opacity: 0, filter: 'blur(4px)' },
                        { y: 0, opacity: 1, filter: 'blur(0px)', duration: 0.8, stagger: 0.1, ease: 'power4.out' }
                    );
                    items.forEach(function (item, i) {
                        var fromX = (i % 2 === 0) ? -50 : 50;
                        gsap.fromTo(item,
                            { x: fromX, opacity: 0, scale: 0.92 },
                            { x: 0, opacity: 1, scale: 1, duration: 0.8, delay: 0.15 + i * 0.12, ease: 'power4.out' }
                        );
                    });
                }
            });
        }

        // ── Testimonials – wave-pattern stagger reveal ──
        const testimonials = document.getElementById('testimonials-section');
        if (testimonials) {
            ScrollTrigger.create({
                trigger: testimonials,
                start: 'top 78%',
                once: true,
                onEnter: function () {
                    const headers = testimonials.querySelectorAll('.test-heading');
                    const cards = testimonials.querySelectorAll('.testimonial-item');
                    gsap.fromTo(headers,
                        { y: 35, opacity: 0, filter: 'blur(4px)' },
                        { y: 0, opacity: 1, filter: 'blur(0px)', duration: 0.8, stagger: 0.1, ease: 'power4.out' }
                    );
                    cards.forEach(function (card, i) {
                        gsap.fromTo(card,
                            { y: 60 + Math.sin(i * 0.8) * 20, opacity: 0, scale: 0.85 },
                            { y: 0, opacity: 1, scale: 1, duration: 0.9, delay: 0.1 + i * 0.13, ease: 'power4.out' }
                        );
                    });
                }
            });
        }

        // ── Quote – dramatic zoom + scale reveal ──
        const quote = document.getElementById('quote-section');
        if (quote) {
            ScrollTrigger.create({
                trigger: quote,
                start: 'top 82%',
                once: true,
                onEnter: function () {
                    const mark = quote.querySelector('.quote-mark');
                    const text = quote.querySelector('.quote-text');
                    const badge = quote.querySelector('.quote-badge');
                    if (mark) gsap.fromTo(mark,
                        { scale: 0.2, opacity: 0, rotation: -20 },
                        { scale: 1, opacity: 0.3, rotation: 0, duration: 1, ease: 'elastic.out(1, 0.5)' }
                    );
                    if (text) gsap.fromTo(text,
                        { y: 50, opacity: 0, filter: 'blur(6px)', scale: 0.95 },
                        { y: 0, opacity: 1, filter: 'blur(0px)', scale: 1, duration: 1.1, ease: 'power4.out', delay: 0.15 }
                    );
                    if (badge) gsap.fromTo(badge,
                        { y: 30, opacity: 0, scale: 0.8 },
                        { y: 0, opacity: 1, scale: 1, duration: 0.8, ease: 'back.out(1.6)', delay: 0.4 }
                    );
                }
            });
        }

        // ── CTA – cinematic scale with glow burst ──
        const cta = document.getElementById('contact');
        if (cta) {
            ScrollTrigger.create({
                trigger: cta,
                start: 'top 82%',
                once: true,
                onEnter: function () {
                    const card = cta.querySelector('.cta-card');
                    const inner = cta.querySelectorAll('.cta-inner');
                    if (card) {
                        gsap.fromTo(card,
                            { scale: 0.85, opacity: 0, y: 60, filter: 'blur(8px)' },
                            { scale: 1, opacity: 1, y: 0, filter: 'blur(0px)', duration: 1.2, ease: 'power4.out' }
                        );
                        // Glow burst
                        gsap.fromTo(card,
                            { boxShadow: '0 0 0px rgba(255, 165, 0, 0)' },
                            { boxShadow: '0 0 80px rgba(255, 165, 0, 0.15)', duration: 0.8, delay: 0.6, ease: 'power2.out' }
                        );
                    }
                    if (inner && inner.length) {
                        gsap.fromTo(inner,
                            { y: 30, opacity: 0, scale: 0.9 },
                            { y: 0, opacity: 1, scale: 1, duration: 0.7, stagger: 0.12, ease: 'back.out(1.2)', delay: 0.3 }
                        );
                    }
                }
            });
        }

        // ── Footer – bottom-up cascade with enhanced stagger ──
        const footer = document.getElementById('footer');
        if (footer) {
            ScrollTrigger.create({
                trigger: footer,
                start: 'top 92%',
                once: true,
                onEnter: function () {
                    const cols = footer.querySelectorAll('.footer-col');
                    const socials = footer.querySelectorAll('.footer-social');
                    gsap.fromTo(cols,
                        { y: 45, opacity: 0 },
                        { y: 0, opacity: 1, duration: 0.8, stagger: 0.12, ease: 'power4.out' }
                    );
                    if (socials.length) {
                        gsap.fromTo(socials,
                            { scale: 0, opacity: 0, rotation: -180 },
                            { scale: 1, opacity: 1, rotation: 0, duration: 0.7, stagger: 0.08, ease: 'elastic.out(1.1, 0.5)', delay: 0.3 }
                        );
                    }
                }
            });
        }
    }

    // ============================================
    // MAIN APP
    // ============================================
    let modeIndex = 0;
    let modeInterval = null;

    function getMode() {
        return FOOD_MODES[MODE_ORDER[modeIndex]];
    }

    function setModeIndex(i) {
        modeIndex = i;
        const mode = getMode();
        updateAllSections(mode);  // this already calls setThreeMode inside
        flashOverlay(mode);
        if (typeof gsap !== 'undefined') {
            const app = document.getElementById('app');
            if (app) gsap.to(app, { backgroundColor: mode.bgColor, duration: 1.5, ease: 'power2.inOut' });
        }
    }

    function startModeInterval() {
        if (modeInterval) clearInterval(modeInterval);
        modeInterval = setInterval(function () {
            modeIndex = (modeIndex + 1) % MODE_ORDER.length;
            setModeIndex(modeIndex);
        }, SWITCH_INTERVAL);
    }

    function initApp() {
        const app = document.getElementById('app');
        const threeContainer = document.getElementById('three-container');
        const navbar = document.getElementById('navbar');
        const mobileToggle = document.getElementById('nav-mobile-toggle');
        const mobileDropdown = document.getElementById('nav-mobile-dropdown');
        const mobileLinks = document.querySelectorAll('.nav-mobile-link');
        const modeButtons = document.getElementById('mode-buttons');
        const menuItems = document.getElementById('menu-items');

        if (!app) return;

        const mode = getMode();
        app.style.backgroundColor = mode.bgColor;

        // IMPORTANT: initThree MUST run before updateAllSections so that
        // threeObjects are populated when setThreeMode is called inside updateAllSections.
        initThree(threeContainer);
        updateAllSections(mode);
        initScrollTrigger();
        startModeInterval();

        // Mode buttons
        if (modeButtons) {
            modeButtons.addEventListener('click', function (e) {
                const btn = e.target.closest('button[data-mode-index]');
                if (!btn) return;
                const i = parseInt(btn.dataset.modeIndex, 10);
                setModeIndex(i);
                startModeInterval();
            });
        }

        // Menu add buttons
        if (menuItems) {
            menuItems.addEventListener('click', function (e) {
                const btn = e.target.closest('.menu-add-btn');
                if (!btn) return;
                if (typeof gsap !== 'undefined') {
                    gsap.timeline()
                        .to(btn, { scale: 1.4, rotation: 90, duration: 0.2, ease: 'power2.out' })
                        .to(btn, { scale: 1, rotation: 0, duration: 0.5, ease: 'elastic.out(1.2, 0.4)' });
                }
            });
        }

        // Navbar scroll
        window.addEventListener('scroll', function () {
            if (!navbar) return;
            if (window.scrollY > 50) navbar.classList.add('nav-scrolled');
            else navbar.classList.remove('nav-scrolled');
        });

        // Mobile menu
        if (mobileToggle && mobileDropdown) {
            mobileToggle.addEventListener('click', function () {
                const isOpen = mobileDropdown.getAttribute('data-open') === 'true';
                if (isOpen) {
                    mobileDropdown.setAttribute('data-open', 'false');
                    mobileDropdown.classList.add('max-h-0', 'opacity-0');
                    mobileDropdown.classList.remove('max-h-64', 'opacity-100');
                    mobileToggle.querySelectorAll('.nav-hamburger').forEach(function (span, i) {
                        if (i === 0) { span.classList.remove('rotate-45', 'translate-y-[5px]'); }
                        if (i === 1) { span.classList.remove('opacity-0', 'scale-x-0'); }
                        if (i === 2) { span.classList.remove('-rotate-45', '-translate-y-[5px]'); }
                    });
                } else {
                    mobileDropdown.setAttribute('data-open', 'true');
                    mobileDropdown.classList.remove('max-h-0', 'opacity-0');
                    mobileDropdown.classList.add('max-h-64', 'opacity-100');
                    var spans = mobileToggle.querySelectorAll('.nav-hamburger');
                    if (spans[0]) { spans[0].classList.add('rotate-45', 'translate-y-[5px]'); }
                    if (spans[1]) { spans[1].classList.add('opacity-0', 'scale-x-0'); }
                    if (spans[2]) { spans[2].classList.add('-rotate-45', '-translate-y-[5px]'); }
                }
            });
        }
        mobileLinks.forEach(function (a) {
            a.addEventListener('click', function () {
                if (mobileDropdown && mobileDropdown.getAttribute('data-open') === 'true') {
                    mobileDropdown.setAttribute('data-open', 'false');
                    mobileDropdown.classList.add('max-h-0', 'opacity-0');
                    mobileDropdown.classList.remove('max-h-64', 'opacity-100');
                }
                if (mobileToggle) {
                    mobileToggle.querySelectorAll('.nav-hamburger').forEach(function (span, i) {
                        if (i === 0) { span.classList.remove('rotate-45', 'translate-y-[5px]'); }
                        if (i === 1) { span.classList.remove('opacity-0', 'scale-x-0'); }
                        if (i === 2) { span.classList.remove('-rotate-45', '-translate-y-[5px]'); }
                    });
                }
            });
        });

        // ── Premium animated smooth scroll for all in-page anchor links ──────
        (function initSmoothScroll() {
            // Custom GSAP scroll with elite easing – feels like native inertia
            function premiumScrollTo(targetEl) {
                if (!targetEl) return;
                var navH = (navbar ? navbar.offsetHeight : 70) + 8; // offset for fixed navbar
                var targetY = targetEl.getBoundingClientRect().top + window.pageYOffset - navH;

                if (typeof gsap !== 'undefined') {
                    // Kill any ongoing scroll tween first
                    gsap.killTweensOf(window);
                    var startY = window.pageYOffset;
                    var dist = targetY - startY;
                    var duration = Math.min(1.6, Math.max(0.7, Math.abs(dist) / 1000));
                    var proxy = { y: startY };
                    gsap.to(proxy, {
                        y: targetY,
                        duration: duration,
                        ease: 'power3.inOut',
                        onUpdate: function () {
                            window.scrollTo(0, proxy.y);
                        }
                    });
                } else {
                    targetEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
            }

            // Intercept every anchor whose href starts with '#'
            document.addEventListener('click', function (e) {
                var link = e.target.closest('a[href^="#"]');
                if (!link) return;
                var hash = link.getAttribute('href');
                if (!hash || hash === '#') return;
                var target = document.querySelector(hash);
                if (!target) return;
                e.preventDefault();
                premiumScrollTo(target);

                // Close mobile dropdown if open
                if (mobileDropdown && mobileDropdown.getAttribute('data-open') === 'true') {
                    mobileDropdown.setAttribute('data-open', 'false');
                    mobileDropdown.classList.add('max-h-0', 'opacity-0');
                    mobileDropdown.classList.remove('max-h-64', 'opacity-100');
                    if (mobileToggle) {
                        mobileToggle.querySelectorAll('.nav-hamburger').forEach(function (span, i) {
                            if (i === 0) span.classList.remove('rotate-45', 'translate-y-[5px]');
                            if (i === 1) span.classList.remove('opacity-0', 'scale-x-0');
                            if (i === 2) span.classList.remove('-rotate-45', '-translate-y-[5px]');
                        });
                    }
                }
            }, { capture: false });
        })();
    }

    // ============================================
    // BOOT
    // ============================================
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function () {
            initLoader(initApp);
        });
    } else {
        initLoader(initApp);
    }

    // ============================================
    // RMDU MOBILE FOOTER ANIMATIONS
    // Moved from inline <script> in index.html
    // ============================================
    (function () {
        function initRmduFooterAnim() {
            if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') return;

            var footer = document.querySelector('.premium-footer');
            if (!footer) return;

            var brand = footer.querySelector('.footer-brand');
            var logo = footer.querySelector('.footer-logo');
            var tagline = footer.querySelector('.footer-tagline');
            var columns = footer.querySelectorAll('.footer-column');
            var socials = footer.querySelectorAll('.social-link');
            var copyEl = footer.querySelector('.footer-copyright');

            // 1. Parallax on the brand header
            if (brand) {
                gsap.to(brand, {
                    y: -55,
                    ease: 'none',
                    scrollTrigger: {
                        trigger: footer,
                        start: 'top bottom',
                        end: 'bottom top',
                        scrub: 1.2
                    }
                });
            }

            // 2. Logo text reveal
            if (logo) {
                gsap.from(logo, {
                    opacity: 0,
                    scale: 0.75,
                    y: 40,
                    duration: 1.1,
                    ease: 'power4.out',
                    scrollTrigger: {
                        trigger: footer,
                        start: 'top 88%',
                        toggleActions: 'play none none none'
                    }
                });
            }

            if (tagline) {
                gsap.from(tagline, {
                    opacity: 0,
                    y: 18,
                    duration: 0.9,
                    delay: 0.25,
                    ease: 'power3.out',
                    scrollTrigger: {
                        trigger: footer,
                        start: 'top 88%',
                        toggleActions: 'play none none none'
                    }
                });
            }

            // 3. Columns stagger reveal
            if (columns && columns.length) {
                gsap.from(columns, {
                    opacity: 0,
                    y: 50,
                    duration: 0.75,
                    stagger: 0.09,
                    ease: 'power3.out',
                    scrollTrigger: {
                        trigger: footer.querySelector('.footer-content'),
                        start: 'top 90%',
                        toggleActions: 'play none none none'
                    }
                });
            }

            // 4. Column links cascade
            footer.querySelectorAll('.footer-column li').forEach(function (li, i) {
                gsap.from(li, {
                    opacity: 0,
                    x: -14,
                    duration: 0.45,
                    delay: 0.04 * i,
                    ease: 'power2.out',
                    scrollTrigger: {
                        trigger: footer.querySelector('.footer-content'),
                        start: 'top 88%',
                        toggleActions: 'play none none none'
                    }
                });
            });

            // 5. Social icons elastic pop
            if (socials && socials.length) {
                gsap.from(socials, {
                    opacity: 0,
                    scale: 0,
                    duration: 0.6,
                    stagger: 0.08,
                    ease: 'elastic.out(1.1, 0.5)',
                    scrollTrigger: {
                        trigger: footer.querySelector('.footer-bottom'),
                        start: 'top 95%',
                        toggleActions: 'play none none none'
                    }
                });
            }

            // 6. Copyright fade up
            if (copyEl) {
                gsap.from(copyEl, {
                    opacity: 0,
                    y: 20,
                    duration: 0.8,
                    delay: 0.3,
                    ease: 'power2.out',
                    scrollTrigger: {
                        trigger: footer.querySelector('.footer-bottom'),
                        start: 'top 95%',
                        toggleActions: 'play none none none'
                    }
                });
            }
        }

        // Run after main app has booted and ScrollTrigger is registered
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', function () {
                setTimeout(initRmduFooterAnim, 400);
            });
        } else {
            setTimeout(initRmduFooterAnim, 400);
        }
    })();
})();

/* ================================================================
   NAVBAR SMOOTH SCROLL FIX
   The page's only real scroll container is #main-content (html/body
   both have overflow:hidden). Native anchor href="#id" therefore does
   nothing. This IIFE intercepts every [href^="#"] click, uses GSAP to
   animate the scroll inside #main-content, fires a section-entry
   highlight, updates the active nav state, and collapses the mobile
   dropdown.
   ================================================================ */
(function () {
    'use strict';

    /* ── Helpers ──────────────────────────────────────────────── */
    function ready(fn) {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', fn);
        } else {
            fn();
        }
    }

    /* Premium scroll with optional GSAP fallback */
    function premiumScrollTo(container, targetEl, durationSec) {
        var navH = document.getElementById('navbar')
            ? document.getElementById('navbar').offsetHeight
            : 0;
        var targetTop = targetEl.offsetTop - navH;

        if (typeof gsap !== 'undefined') {
            gsap.to(container, {
                scrollTop: targetTop,
                duration: durationSec || 1.05,
                ease: 'power4.inOut',
                overwrite: true
            });
        } else {
            /* Fallback: native smooth scroll */
            container.scrollTo({ top: targetTop, behavior: 'smooth' });
        }
    }

    /* Flash the section with a brief amber radial glow on arrival */
    function sectionEntryFlash(el) {
        if (!el || typeof gsap === 'undefined') return;
        var flash = document.createElement('div');
        flash.style.cssText = [
            'position:absolute',
            'inset:0',
            'pointer-events:none',
            'z-index:5',
            'border-radius:inherit',
            'background:radial-gradient(ellipse at center,' +
            'rgba(255,180,60,0.22) 0%,' +
            'rgba(255,130,0,0.10) 40%,' +
            'transparent 72%)',
            'opacity:0'
        ].join(';');

        var prevPos = getComputedStyle(el).position;
        if (prevPos === 'static') el.style.position = 'relative';
        el.appendChild(flash);

        gsap.timeline({ onComplete: function () { flash.remove(); } })
            .to(flash, { opacity: 1, duration: 0.28, ease: 'power2.out' })
            .to(flash, { opacity: 0, duration: 0.7, ease: 'power2.in' });
    }

    /* Update which nav link looks "active" */
    function setActiveLink(hash) {
        document.querySelectorAll('[data-nav-link]').forEach(function (a) {
            var isActive = a.getAttribute('href') === hash;
            a.classList.toggle('nav-link-active', isActive);
        });
    }

    /* Close mobile dropdown */
    function closeMobileDropdown() {
        var dd = document.getElementById('nav-mobile-dropdown');
        var toggle = document.getElementById('nav-mobile-toggle');
        if (!dd) return;
        dd.style.maxHeight = '0';
        dd.style.opacity = '0';
        dd.setAttribute('data-open', 'false');
        if (toggle) {
            toggle.querySelectorAll('.nav-hamburger').forEach(function (bar, i) {
                bar.style.transform = '';
                bar.style.opacity = '';
            });
        }
    }

    /* ── CSS for the active underline indicator ──────────────── */
    var style = document.createElement('style');
    style.textContent = [
        '/* Navbar active link — animated underline */',
        '[data-nav-link] {',
        '    position: relative;',
        '}',
        '[data-nav-link]::after {',
        '    content: "";',
        '    position: absolute;',
        '    bottom: -2px;',
        '    left: 50%;',
        '    width: 0;',
        '    height: 2px;',
        '    border-radius: 9999px;',
        '    background: linear-gradient(90deg, #ffb800, #ff6600, #ffb800);',
        '    transform: translateX(-50%);',
        '    transition: width 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);',
        '}',
        '[data-nav-link].nav-link-active::after,',
        '[data-nav-link]:hover::after {',
        '    width: 80%;',
        '}',
        '[data-nav-link].nav-link-active {',
        '    opacity: 1 !important;',
        '    color: #ffcc55 !important;',
        '    text-shadow: 0 0 14px rgba(255,176,50,0.55);',
        '}',
        /* Mobile link active */
        '#nav-mobile-dropdown [data-nav-link].nav-link-active {',
        '    background: rgba(255,180,60,0.10) !important;',
        '    border-left: 3px solid #ffb800;',
        '    padding-left: calc(1rem - 3px) !important;',
        '}'
    ].join('\n');
    document.head.appendChild(style);

    /* ── Main init ───────────────────────────────────────────── */
    ready(function () {
        var scroller = document.getElementById('main-content-wrap');
        if (!scroller) return;

        /* Mark all nav anchor links so CSS/JS can target them */
        document.querySelectorAll('nav a[href^="#"], #nav-mobile-dropdown a[href^="#"]')
            .forEach(function (a) { a.setAttribute('data-nav-link', ''); });

        /* ── Intercept clicks ──────────────────────────────────── */
        document.addEventListener('click', function (e) {
            var anchor = e.target.closest('a[href^="#"]');
            if (!anchor) return;

            var hash = anchor.getAttribute('href');
            if (!hash || hash === '#') return;

            var target = document.querySelector(hash);
            if (!target) return;

            e.preventDefault();

            /* Close mobile menu first */
            closeMobileDropdown();

            /* Small GSAP micro-bounce on the clicked link */
            if (typeof gsap !== 'undefined' && anchor.closest('nav')) {
                gsap.fromTo(anchor,
                    { scale: 0.90 },
                    { scale: 1, duration: 0.45, ease: 'elastic.out(1.2, 0.5)' }
                );
            }

            /* Scroll */
            premiumScrollTo(scroller, target, 1.05);

            /* Flash entry after scroll lands */
            setTimeout(function () { sectionEntryFlash(target); }, 900);

            /* Update active link */
            setActiveLink(hash);

            /* Update URL hash without jumping */
            if (history.pushState) {
                history.pushState(null, '', hash);
            }
        }, { passive: false });

        /* ── IntersectionObserver — keep active link in sync while scrolling ── */
        var sections = ['#home', '#stats-section', '#features-section', '#menu',
            '#testimonials-section', '#quote-section', '#contact', '#footer'];

        var ioOptions = {
            root: scroller,
            rootMargin: '-40% 0px -40% 0px',
            threshold: 0
        };

        var io = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (entry.isIntersecting) {
                    /* Map section id to nav href */
                    var sectionId = '#' + entry.target.id;
                    setActiveLink(sectionId);
                }
            });
        }, ioOptions);

        sections.forEach(function (sel) {
            var el = document.querySelector(sel);
            if (el) io.observe(el);
        });

        /* ── Handle mobile hamburger toggle (keep existing behaviour) ── */
        var mobileToggle = document.getElementById('nav-mobile-toggle');
        var mobileDD = document.getElementById('nav-mobile-dropdown');

        if (mobileToggle && mobileDD) {
            /* If the existing app.js already wired this up we don't double-bind.
               We add a guard attribute so we only attach once. */
            if (!mobileToggle.dataset.scrollFixBound) {
                mobileToggle.dataset.scrollFixBound = '1';

                mobileToggle.addEventListener('click', function () {
                    var isOpen = mobileDD.getAttribute('data-open') === 'true';

                    if (isOpen) {
                        /* Close */
                        if (typeof gsap !== 'undefined') {
                            gsap.to(mobileDD, {
                                maxHeight: 0, opacity: 0,
                                duration: 0.3, ease: 'power2.in',
                                onComplete: function () {
                                    mobileDD.setAttribute('data-open', 'false');
                                }
                            });
                        } else {
                            closeMobileDropdown();
                        }
                        mobileToggle.querySelectorAll('.nav-hamburger').forEach(function (bar) {
                            bar.style.transform = '';
                            bar.style.opacity = '';
                        });
                    } else {
                        /* Open */
                        mobileDD.setAttribute('data-open', 'true');
                        var naturalH = mobileDD.scrollHeight;
                        if (typeof gsap !== 'undefined') {
                            gsap.fromTo(mobileDD,
                                { maxHeight: 0, opacity: 0 },
                                {
                                    maxHeight: naturalH + 40, opacity: 1,
                                    duration: 0.35, ease: 'power2.out'
                                }
                            );
                        } else {
                            mobileDD.style.maxHeight = (naturalH + 40) + 'px';
                            mobileDD.style.opacity = '1';
                        }
                        /* Animate hamburger → X */
                        var bars = mobileToggle.querySelectorAll('.nav-hamburger');
                        if (bars[0]) bars[0].style.transform = 'translateY(6px) rotate(45deg)';
                        if (bars[1]) { bars[1].style.opacity = '0'; bars[1].style.transform = 'scaleX(0)'; }
                        if (bars[2]) bars[2].style.transform = 'translateY(-6px) rotate(-45deg)';
                    }
                });
            }
        }

        /* ── Also wire the "Order" button in the navbar ─────── */
        var navOrderBtn = document.getElementById('nav-order-btn');
        if (navOrderBtn) {
            navOrderBtn.setAttribute('data-nav-link', '');
        }

        /* Activate HOME on initial load */
        setActiveLink('#home');
    });
})();
