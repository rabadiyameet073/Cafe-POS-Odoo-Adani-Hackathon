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

        function finish() {
            if (typeof gsap === 'undefined') {
                wrap.style.display = 'none';
                appEl.style.display = 'block';
                onComplete();
                return;
            }
            gsap.timeline()
                .to(logoWrap, { scale: 1.1, opacity: 0, duration: 0.8, ease: 'power2.in' })
                .to('.loader-orbit, .loader-orb, .loader-corner', { opacity: 0, scale: 0.8, duration: 0.5, ease: 'power2.in' }, '-=0.6')
                .to(wrap, { clipPath: 'circle(0% at 50% 50%)', duration: 1, ease: 'power3.inOut' }, '-=0.3')
                .call(function () {
                    wrap.style.display = 'none';
                    appEl.style.display = 'block';
                    onComplete();
                });
        }

        skipBtn.style.display = 'none';
        setTimeout(function () {
            skipBtn.style.display = 'block';
            skipBtn.onclick = finish;
        }, 1000);

        if (typeof gsap !== 'undefined') {
            gsap.set(logoWrap, { opacity: 0, y: 60, scale: 0.7, rotationX: -30 });
            gsap.set(taglineLetters, { opacity: 0, y: 20, scale: 0.5 });
            gsap.set('.loader-progress-wrap', { opacity: 0, y: 20 });

            gsap.timeline()
                .to(logoWrap, { opacity: 1, y: 0, scale: 1, rotationX: 0, duration: 1.6, ease: 'power4.out' })
                .to(taglineLetters, { opacity: 1, y: 0, scale: 1, duration: 0.5, stagger: 0.03, ease: 'back.out(1.7)' }, '-=1')
                .to('.loader-progress-wrap', { opacity: 1, y: 0, duration: 0.6, ease: 'power2.out' }, '-=0.6');

            gsap.to(progressBar, {
                width: '100%',
                duration: 2.8,
                delay: 0.8,
                ease: 'power2.inOut',
                onUpdate: function () {
                    const p = Math.round(this.progress() * 100);
                    if (percentEl) percentEl.textContent = p + '%';
                }
            });

            gsap.delayedCall(4, finish);
        } else {
            progressBar.style.width = '100%';
            if (percentEl) percentEl.textContent = '100%';
            setTimeout(finish, 500);
        }
    }

    // ============================================
    // THREE.JS SCENE (simplified – no 3D objects if heavy)
    // ============================================
    let threeScene = null;
    let threeObjects = {};
    let threeModeRef = 'coffee';

    function initThree(container) {
        if (typeof THREE === 'undefined' || !container) return;
        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 100);
        camera.position.set(0, 2, 7);
        camera.lookAt(0, 0.5, 0);

        const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.setClearColor(0x000000, 0);
        container.appendChild(renderer.domElement);

        const ambient = new THREE.AmbientLight(0xffffff, 0.65);
        scene.add(ambient);
        const mainLight = new THREE.DirectionalLight(0xffffff, 2.4);
        mainLight.position.set(5, 10, 5);
        scene.add(mainLight);
        const fill = new THREE.DirectionalLight(0xffffff, 0.8);
        fill.position.set(-5, 5, -5);
        scene.add(fill);

        const accent = new THREE.PointLight(0xD4A574, 4, 22);
        accent.position.set(-4, 4, 4);
        scene.add(accent);
        const back = new THREE.PointLight(0xD4A574, 2.5, 28);
        back.position.set(4, 3, -6);
        scene.add(back);

        scene.userData = { accentLight: accent, backLight: back };

        try {
            threeObjects = {
                coffee: createCoffeeCup(),
                burger: createBurger(),
                pizza: createPizza(),
                dessert: createDessert()
            };
        } catch (e) {
            threeObjects = {};
        }

        Object.keys(threeObjects).forEach(function (k) {
            const o = threeObjects[k];
            o.visible = false;
            o.scale.set(0, 0, 0);
            scene.add(o);
        });

        const initial = threeObjects[threeModeRef];
        if (initial) {
            initial.visible = true;
            initial.scale.set(1, 1, 1);
        }

        let mouseX = 0, mouseY = 0;
        function onMouseMove(e) {
            mouseX = (e.clientX / window.innerWidth) * 2 - 1;
            mouseY = -(e.clientY / window.innerHeight) * 2 + 1;
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
                if (!obj || !obj.visible || !obj.scale || obj.scale.x < 0.1) return;
                obj.rotation.y += 0.003;
                obj.position.y = 0.8 + Math.sin(t * 0.6) * 0.15;
                obj.rotation.x = lerp(obj.rotation.x, -mouseY * 0.12, 0.03);
                obj.rotation.z = lerp(obj.rotation.z, mouseX * 0.08, 0.03);
            });
            renderer.render(scene, camera);
        }
        animate();

        function onResize() {
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(window.innerWidth, window.innerHeight);
        }
        window.addEventListener('resize', onResize);

        threeScene = { scene, renderer, container, onMouseMove, onResize };
        return threeScene;
    }

    function setThreeMode(modeId) {
        threeModeRef = modeId;
        if (!threeScene || !threeObjects[modeId]) return;
        const scene = threeScene.scene;
        const acc = scene.userData.accentLight;
        const back = scene.userData.backLight;
        const colors = { coffee: 0xD4A574, burger: 0xFFD700, pizza: 0xFF6B35, dessert: 0xE61A27 };
        const c = new THREE.Color(colors[modeId] || 0xD4A574);
        if (acc) acc.color.copy(c);
        if (back) back.color.copy(c);

        Object.keys(threeObjects).forEach(function (k) {
            const obj = threeObjects[k];
            if (k === modeId) {
                obj.visible = true;
                obj.scale.set(1, 1, 1);
            } else if (obj.visible) {
                obj.visible = false;
                obj.scale.set(0, 0, 0);
            }
        });
    }

    function createCoffeeCup() {
        const g = new THREE.Group();
        const cupMat = new THREE.MeshPhysicalMaterial({ color: 0xF5F0E6, metalness: 0.05, roughness: 0.3, clearcoat: 0.9 });
        const body = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 0.7, 1.8, 32), cupMat);
        g.add(body);
        const inner = new THREE.Mesh(new THREE.CylinderGeometry(0.85, 0.65, 1.75, 32), new THREE.MeshPhysicalMaterial({ color: 0x1A0A05 }));
        inner.position.y = 0.05;
        g.add(inner);
        const rim = new THREE.Mesh(new THREE.TorusGeometry(0.9, 0.05, 16, 32), cupMat);
        rim.rotation.x = -Math.PI / 2;
        rim.position.y = 0.9;
        g.add(rim);
        const base = new THREE.Mesh(new THREE.CylinderGeometry(1.5, 1.4, 0.08, 32), cupMat);
        base.position.y = -1.0;
        g.add(base);
        return g;
    }

    function createBurger() {
        const g = new THREE.Group();
        const bunMat = new THREE.MeshPhysicalMaterial({ color: 0xD4956B, roughness: 0.7 });
        const pattyMat = new THREE.MeshPhysicalMaterial({ color: 0x3D2817, roughness: 0.9 });
        const bottom = new THREE.Mesh(new THREE.CylinderGeometry(1.15, 1.2, 0.35, 32), bunMat);
        bottom.position.y = -0.85;
        g.add(bottom);
        const patty = new THREE.Mesh(new THREE.CylinderGeometry(1.1, 1.1, 0.2, 32), pattyMat);
        patty.position.y = -0.5;
        g.add(patty);
        const top = new THREE.Mesh(new THREE.SphereGeometry(1.15, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2), bunMat);
        top.position.y = 0.65;
        g.add(top);
        g.position.y = 0.2;
        return g;
    }

    function createPizza() {
        const g = new THREE.Group();
        const crust = new THREE.MeshPhysicalMaterial({ color: 0xD4956B, roughness: 0.8 });
        const base = new THREE.Mesh(new THREE.CylinderGeometry(1.8, 1.8, 0.12, 32), crust);
        base.position.y = -0.1;
        g.add(base);
        const sauce = new THREE.Mesh(new THREE.CylinderGeometry(1.5, 1.5, 0.03, 32), new THREE.MeshPhysicalMaterial({ color: 0xC62828 }));
        g.add(sauce);
        const cheese = new THREE.Mesh(new THREE.CylinderGeometry(1.55, 1.55, 0.05, 32), new THREE.MeshPhysicalMaterial({ color: 0xFFF59D }));
        cheese.position.y = 0.04;
        g.add(cheese);
        g.rotation.x = -0.15;
        g.position.y = 0.3;
        return g;
    }

    function createDessert() {
        const g = new THREE.Group();
        const glassMat = new THREE.MeshPhysicalMaterial({ color: 0xffffff, transparent: true, opacity: 0.25, roughness: 0.05, clearcoat: 1 });
        const pts = [];
        for (let i = 0; i <= 20; i++) {
            const t = i / 20;
            const y = t * 2 - 1;
            let r = 0.4 + 0.15 * Math.sin(t * Math.PI);
            if (t < 0.15) r = 0.35 + t * 0.3;
            if (t > 0.85) r = 0.5 - (t - 0.85) * 0.5;
            pts.push(new THREE.Vector2(r, y));
        }
        const glass = new THREE.Mesh(new THREE.LatheGeometry(pts, 32), glassMat);
        g.add(glass);
        const colaMat = new THREE.MeshPhysicalMaterial({ color: 0x1A0A03, transparent: true, opacity: 0.9 });
        const colaPts = pts.map(function (p) { return new THREE.Vector2(p.x * 0.9, p.y * 0.9); });
        const cola = new THREE.Mesh(new THREE.LatheGeometry(colaPts, 32), colaMat);
        g.add(cola);
        const straw = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 2.5, 12), new THREE.MeshPhysicalMaterial({ color: 0xE61A27 }));
        straw.position.set(0.2, 0.8, 0.1);
        straw.rotation.z = 0.12;
        g.add(straw);
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
        if (!nav || !logo || !orderBtn) return;
        const accent = mode.accentColor;
        const light = isLightMode(mode.id);
        logo.style.color = accent;
        logo.style.textShadow = '0 0 30px ' + accent + '50';
        if (logoIcon) {
            const svg = (MODE_ICONS[mode.id] || MODE_ICONS.coffee).replace(/stroke="currentColor"/g, 'stroke="' + accent + '"');
            logoIcon.innerHTML = svg;
            logoIcon.style.filter = 'drop-shadow(0 0 8px ' + accent + '60)';
        }
        orderBtn.style.background = 'linear-gradient(135deg, ' + accent + ', ' + accent + 'cc)';
        orderBtn.style.color = light ? '#000' : '#fff';
        orderBtn.style.boxShadow = '0 4px 20px ' + accent + '40';
        const cartSvg = orderBtn.querySelector('.cart-icon');
        if (cartSvg) cartSvg.setAttribute('stroke', light ? '#000' : '#fff');
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
            btn.textContent = data.emoji;
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
            const arr = [].concat(mode.marquee, mode.marquee, mode.marquee, mode.marquee);
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
        el.style.background = 'radial-gradient(circle at center, ' + mode.accentColor + '30, transparent 70%)';
        el.style.opacity = '0.3';
        if (typeof gsap !== 'undefined') {
            gsap.to(el, { opacity: 0, duration: 1.2, ease: 'power2.inOut' });
        } else {
            el.style.opacity = '0';
        }
    }

    // ============================================
    // SCROLL TRIGGER
    // ============================================
    function initScrollTrigger() {
        if (typeof ScrollTrigger === 'undefined' || typeof gsap === 'undefined') return;

        const stats = document.getElementById('stats-section');
        if (stats) {
            ScrollTrigger.create({
                trigger: stats,
                start: 'top 80%',
                onEnter: function () {
                    const items = stats.querySelectorAll('.stat-item');
                    gsap.fromTo(items, { y: 40, opacity: 0, scale: 0.9 }, { y: 0, opacity: 1, scale: 1, duration: 0.7, stagger: 0.1, ease: 'back.out(1.1)' });
                }
            });
        }

        const features = document.getElementById('features-section');
        if (features) {
            ScrollTrigger.create({
                trigger: features,
                start: 'top 78%',
                onEnter: function () {
                    const cards = features.querySelectorAll('.feature-card');
                    const headers = features.querySelectorAll('.feature-heading');
                    gsap.fromTo(headers, { y: 24, opacity: 0 }, { y: 0, opacity: 1, duration: 0.6, stagger: 0.08, ease: 'power3.out' });
                    gsap.fromTo(cards, { y: 50, opacity: 0, scale: 0.92 }, { y: 0, opacity: 1, scale: 1, duration: 0.75, stagger: 0.1, ease: 'back.out(1.08)', delay: 0.15 });
                }
            });
        }

        const menu = document.getElementById('menu');
        if (menu) {
            ScrollTrigger.create({
                trigger: menu,
                start: 'top 78%',
                onEnter: function () {
                    const headers = menu.querySelectorAll('.menu-heading');
                    const items = menu.querySelectorAll('.menu-item');
                    gsap.fromTo(headers, { y: 24, opacity: 0 }, { y: 0, opacity: 1, duration: 0.6, stagger: 0.08, ease: 'power3.out' });
                    gsap.fromTo(items, { x: -24, opacity: 0 }, { x: 0, opacity: 1, duration: 0.65, stagger: 0.09, ease: 'power3.out', delay: 0.12 });
                }
            });
        }

        const testimonials = document.getElementById('testimonials-section');
        if (testimonials) {
            ScrollTrigger.create({
                trigger: testimonials,
                start: 'top 78%',
                onEnter: function () {
                    const headers = testimonials.querySelectorAll('.test-heading');
                    const cards = testimonials.querySelectorAll('.testimonial-item');
                    gsap.fromTo(headers, { y: 24, opacity: 0 }, { y: 0, opacity: 1, duration: 0.6, stagger: 0.08, ease: 'power3.out' });
                    gsap.fromTo(cards, { y: 36, opacity: 0 }, { y: 0, opacity: 1, duration: 0.7, stagger: 0.1, ease: 'power3.out', delay: 0.1 });
                }
            });
        }

        const quote = document.getElementById('quote-section');
        if (quote) {
            ScrollTrigger.create({
                trigger: quote,
                start: 'top 82%',
                onEnter: function () {
                    const mark = quote.querySelector('.quote-mark');
                    const text = quote.querySelector('.quote-text');
                    const badge = quote.querySelector('.quote-badge');
                    if (mark) gsap.fromTo(mark, { scale: 0.5, opacity: 0 }, { scale: 1, opacity: 0.3, duration: 0.6, ease: 'back.out(1.4)' });
                    if (text) gsap.fromTo(text, { y: 32, opacity: 0 }, { y: 0, opacity: 1, duration: 0.7, ease: 'power3.out', delay: 0.1 });
                    if (badge) gsap.fromTo(badge, { y: 20, opacity: 0 }, { y: 0, opacity: 1, duration: 0.6, ease: 'power3.out', delay: 0.25 });
                }
            });
        }

        const cta = document.getElementById('contact');
        if (cta) {
            ScrollTrigger.create({
                trigger: cta,
                start: 'top 82%',
                onEnter: function () {
                    const card = cta.querySelector('.cta-card');
                    const inner = cta.querySelectorAll('.cta-inner');
                    if (card) gsap.fromTo(card, { scale: 0.92, opacity: 0, y: 40 }, { scale: 1, opacity: 1, y: 0, duration: 0.8, ease: 'back.out(1.1)' });
                    if (inner && inner.length) gsap.fromTo(inner, { y: 16, opacity: 0 }, { y: 0, opacity: 1, duration: 0.5, stagger: 0.1, ease: 'power3.out', delay: 0.2 });
                }
            });
        }

        const footer = document.getElementById('footer');
        if (footer) {
            ScrollTrigger.create({
                trigger: footer,
                start: 'top 92%',
                onEnter: function () {
                    const cols = footer.querySelectorAll('.footer-col');
                    gsap.fromTo(cols, { y: 28, opacity: 0 }, { y: 0, opacity: 1, duration: 0.6, stagger: 0.1, ease: 'power3.out' });
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
        updateAllSections(mode);
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
        updateAllSections(mode);

        initThree(threeContainer);
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
                if (typeof gsap !== 'undefined') gsap.fromTo(btn, { scale: 1.3 }, { scale: 1, duration: 0.45, ease: 'back.out(2)' });
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
})();
