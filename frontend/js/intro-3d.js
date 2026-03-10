/**
 * Epic 3D Cinematic Intro Animation
 * Features: Burger falling from sky, landing with smoke, knife slice, cafe name reveal
 */

(function() {
    'use strict';

    // Configuration
    const CONFIG = {
        duration: {
            burgerFall: 2000,
            landing: 500,
            smoke: 1500,
            knifeSlice: 1200,
            nameReveal: 2000,
            total: 8000
        },
        physics: {
            gravity: 0.0015,
            bounce: 0.3,
            rotation: 0.02
        },
        foodTypes: ['coffee', 'burger', 'pizza', 'drink'],
        currentFoodType: null
    };

    let scene, camera, renderer, currentFood, knife, smokeParticles = [];
    let animationStage = 0;
    let startTime = Date.now();

    // Initialize 3D Scene
    function init3DScene() {
        const canvas = document.getElementById('intro-canvas');
        if (!canvas || typeof THREE === 'undefined') {
            console.warn('Three.js not loaded or canvas not found');
            return false;
        }

        // Scene setup
        scene = new THREE.Scene();
        scene.fog = new THREE.Fog(0x0a0505, 10, 50);

        // Camera setup - centered view for better visibility
        camera = new THREE.PerspectiveCamera(
            50,
            window.innerWidth / window.innerHeight,
            0.1,
            1000
        );
        camera.position.set(0, 3, 12);
        camera.lookAt(0, 1, 0);

        // Renderer setup
        renderer = new THREE.WebGLRenderer({
            canvas: canvas,
            antialias: true,
            alpha: true
        });
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;

        // Lighting
        setupLighting();

        // Create 3D objects - cycle through food types
        createCurrentFood();
        createKnife();
        createGround();

        return true;
    }

    function createCurrentFood() {
        // Remove previous food if exists
        if (currentFood) {
            scene.remove(currentFood);
        }

        // Randomly select a food type if not already set
        if (!CONFIG.currentFoodType) {
            CONFIG.currentFoodType = CONFIG.foodTypes[Math.floor(Math.random() * CONFIG.foodTypes.length)];
        }
        
        const foodType = CONFIG.currentFoodType;
        
        if (typeof window['create3D' + capitalize(foodType)] === 'function') {
            currentFood = window['create3D' + capitalize(foodType)]();
        } else {
            // Fallback to burger if function doesn't exist
            currentFood = create3DBurger();
        }
        
        // Add to scene
        if (currentFood) {
            currentFood.position.set(0, 30, 0);
            scene.add(currentFood);
        }
    }

    function capitalize(str) {
        return str.charAt(0).toUpperCase() + str.slice(1);
    }

    function create3DBurger() {
        // Fallback burger creation (simplified)
        const burger = new THREE.Group();
        const geometry = new THREE.BoxGeometry(1, 1, 1);
        const material = new THREE.MeshStandardMaterial({ color: 0xD4A574 });
        const mesh = new THREE.Mesh(geometry, material);
        burger.add(mesh);
        return burger;
    }

    function setupLighting() {
        // Ambient light for overall illumination
        const ambient = new THREE.AmbientLight(0xffffff, 0.5);
        scene.add(ambient);

        // Main key light (spotlight from above-front)
        const keyLight = new THREE.SpotLight(0xffffff, 3);
        keyLight.position.set(5, 25, 10);
        keyLight.angle = Math.PI / 3;
        keyLight.penumbra = 0.4;
        keyLight.decay = 2;
        keyLight.distance = 60;
        keyLight.castShadow = true;
        keyLight.shadow.mapSize.width = 2048;
        keyLight.shadow.mapSize.height = 2048;
        keyLight.shadow.camera.near = 1;
        keyLight.shadow.camera.far = 60;
        scene.add(keyLight);

        // Fill light (softer, from the side)
        const fillLight = new THREE.DirectionalLight(0xffffff, 1.2);
        fillLight.position.set(-10, 15, 5);
        fillLight.castShadow = true;
        fillLight.shadow.mapSize.width = 1024;
        fillLight.shadow.mapSize.height = 1024;
        scene.add(fillLight);

        // Rim lights for depth (golden accent)
        const rimLight1 = new THREE.PointLight(0xFFD700, 2, 40);
        rimLight1.position.set(-10, 8, 8);
        scene.add(rimLight1);

        const rimLight2 = new THREE.PointLight(0xD4A574, 2, 40);
        rimLight2.position.set(10, 8, 8);
        scene.add(rimLight2);

        // Back light for separation
        const backLight = new THREE.DirectionalLight(0xFFA500, 1);
        backLight.position.set(0, 10, -15);
        scene.add(backLight);

        // Bottom bounce light
        const bounceLight = new THREE.PointLight(0xD4A574, 0.8, 30);
        bounceLight.position.set(0, -2, 0);
        scene.add(bounceLight);
    }

    function createKnife() {
        knife = new THREE.Group();

        // Blade with realistic metallic look - LONGER for full screen coverage
        const bladeGeometry = new THREE.BoxGeometry(0.15, 6, 0.6);
        const bladeMaterial = new THREE.MeshStandardMaterial({
            color: 0xE8E8E8,
            metalness: 0.95,
            roughness: 0.15,
            emissive: 0x444444,
            emissiveIntensity: 0.1
        });
        const blade = new THREE.Mesh(bladeGeometry, bladeMaterial);
        blade.castShadow = true;
        blade.receiveShadow = true;
        knife.add(blade);

        // Blade edge (sharper look) - LONGER
        const edgeGeometry = new THREE.BoxGeometry(0.05, 6, 0.6);
        const edgeMaterial = new THREE.MeshStandardMaterial({
            color: 0xFFFFFF,
            metalness: 1,
            roughness: 0.05,
            emissive: 0x888888,
            emissiveIntensity: 0.2
        });
        const edge = new THREE.Mesh(edgeGeometry, edgeMaterial);
        edge.position.x = 0.1;
        edge.castShadow = true;
        knife.add(edge);

        // Handle with wood texture
        const handleGeometry = new THREE.CylinderGeometry(0.2, 0.2, 1.2, 16);
        const handleMaterial = new THREE.MeshStandardMaterial({
            color: 0x3D2817,
            roughness: 0.7,
            metalness: 0.1,
            bumpScale: 0.05
        });
        const handle = new THREE.Mesh(handleGeometry, handleMaterial);
        handle.position.y = -3.6;
        handle.castShadow = true;
        knife.add(handle);

        // Handle rings (decorative)
        for (let i = 0; i < 3; i++) {
            const ringGeometry = new THREE.TorusGeometry(0.22, 0.03, 8, 16);
            const ringMaterial = new THREE.MeshStandardMaterial({
                color: 0xC0C0C0,
                metalness: 0.9,
                roughness: 0.2
            });
            const ring = new THREE.Mesh(ringGeometry, ringMaterial);
            ring.position.y = -3.2 - (i * 0.3);
            ring.rotation.x = Math.PI / 2;
            ring.castShadow = true;
            knife.add(ring);
        }

        // Start position (off-screen right, higher up)
        const aspect = window.innerWidth / window.innerHeight;
        const distance = 12;
        const vFOV = (50 * Math.PI) / 180; // camera FOV
        const height = 2 * Math.tan(vFOV / 2) * distance;
        const width = height * aspect;
        
        knife.position.set(width / 2 + 3, 4, 0);
        knife.rotation.z = Math.PI / 4;
        knife.scale.set(1.3, 1.3, 1.3);
        knife.visible = false;

        scene.add(knife);
    }

    function createGround() {
        const geometry = new THREE.PlaneGeometry(50, 50);
        const material = new THREE.ShadowMaterial({
            opacity: 0.3
        });
        const ground = new THREE.Mesh(geometry, material);
        ground.rotation.x = -Math.PI / 2;
        ground.position.y = -0.5;
        ground.receiveShadow = true;
        scene.add(ground);
    }

    function createSmokeParticle(x, y, z) {
        const geometry = new THREE.SphereGeometry(0.3, 8, 8);
        const material = new THREE.MeshBasicMaterial({
            color: 0xffffff,
            transparent: true,
            opacity: 0.6
        });
        const particle = new THREE.Mesh(geometry, material);
        particle.position.set(x, y, z);
        particle.userData = {
            velocity: {
                x: (Math.random() - 0.5) * 0.02,
                y: Math.random() * 0.03 + 0.02,
                z: (Math.random() - 0.5) * 0.02
            },
            life: 1.0
        };
        scene.add(particle);
        smokeParticles.push(particle);
    }

    function updateSmokeParticles() {
        for (let i = smokeParticles.length - 1; i >= 0; i--) {
            const particle = smokeParticles[i];
            particle.position.x += particle.userData.velocity.x;
            particle.position.y += particle.userData.velocity.y;
            particle.position.z += particle.userData.velocity.z;
            
            particle.userData.life -= 0.01;
            particle.material.opacity = particle.userData.life * 0.6;
            particle.scale.set(
                1 + (1 - particle.userData.life),
                1 + (1 - particle.userData.life),
                1 + (1 - particle.userData.life)
            );

            if (particle.userData.life <= 0) {
                scene.remove(particle);
                smokeParticles.splice(i, 1);
            }
        }
    }

    // Animation stages
    function animateFoodFall(progress) {
        if (!currentFood) return;

        const fallProgress = Math.min(progress / CONFIG.duration.burgerFall, 1);
        const easeProgress = 1 - Math.pow(1 - fallProgress, 3); // Ease out cubic

        // Fall to center-bottom area (away from top text)
        currentFood.position.y = 30 - (easeProgress * 30);
        currentFood.position.x = -2 + (easeProgress * 2); // Move to center
        currentFood.rotation.x += CONFIG.physics.rotation;
        currentFood.rotation.y += CONFIG.physics.rotation * 0.7;
        currentFood.rotation.z += CONFIG.physics.rotation * 0.5;

        // Landing impact
        if (currentFood.position.y <= 0 && animationStage === 0) {
            currentFood.position.y = 0;
            currentFood.position.x = 0;
            animationStage = 1;
            
            // Create smoke on landing
            for (let i = 0; i < 30; i++) {
                setTimeout(() => {
                    const angle = (i / 30) * Math.PI * 2;
                    const radius = Math.random() * 2;
                    createSmokeParticle(
                        Math.cos(angle) * radius,
                        0.2,
                        Math.sin(angle) * radius
                    );
                }, i * 30);
            }

            // Camera shake effect
            if (typeof gsap !== 'undefined') {
                gsap.to(camera.position, {
                    y: '+=0.3',
                    duration: 0.1,
                    yoyo: true,
                    repeat: 3,
                    ease: 'power2.inOut'
                });
            }
        }
    }

    function animateKnifeSlice(progress) {
        if (!knife || animationStage < 2) return;

        knife.visible = true;
        const sliceProgress = Math.min((progress - 3500) / CONFIG.duration.knifeSlice, 1);
        const easeProgress = sliceProgress < 0.5 
            ? 2 * sliceProgress * sliceProgress 
            : 1 - Math.pow(-2 * sliceProgress + 2, 2) / 2;

        // Calculate screen width in 3D space based on camera FOV and distance
        const aspect = window.innerWidth / window.innerHeight;
        const distance = 12; // camera z position
        const vFOV = (camera.fov * Math.PI) / 180;
        const height = 2 * Math.tan(vFOV / 2) * distance;
        const width = height * aspect;
        
        // Knife swooshes from far right edge to far left edge (full screen width)
        const startX = width / 2 + 3; // Start beyond right edge
        const endX = -width / 2 - 3; // End beyond left edge
        knife.position.x = startX + (easeProgress * (endX - startX));
        knife.position.y = 2 - (easeProgress * 0.5);
        knife.rotation.z = Math.PI / 4 - (easeProgress * Math.PI / 2);

        // Split food when knife passes through center
        if (sliceProgress > 0.4 && sliceProgress < 0.6 && currentFood) {
            currentFood.children.forEach((part, index) => {
                if (index < currentFood.children.length / 2) {
                    part.position.x -= 0.015;
                } else {
                    part.position.x += 0.015;
                }
            });
        }
    }

    function animate() {
        requestAnimationFrame(animate);

        const elapsed = Date.now() - startTime;
        const progress = elapsed;

        // Stage 0-1: Food falls and lands
        if (progress < 3500) {
            animateFoodFall(progress);
        }

        // Stage 2: Knife slice
        if (progress >= 3500 && progress < 5000) {
            if (animationStage === 1) {
                animationStage = 2;
            }
            animateKnifeSlice(progress);
        }

        // Update smoke particles
        updateSmokeParticles();

        // Render scene
        if (renderer && scene && camera) {
            renderer.render(scene, camera);
        }
    }

    // Text animations
    function animateTextSequence() {
        const welcomeText = document.getElementById('welcome-text');
        const cafeName = document.getElementById('cafe-name');
        const finalMessage = document.getElementById('final-message');

        if (typeof gsap === 'undefined') return;

        const tl = gsap.timeline();

        // Welcome text
        tl.to(welcomeText, {
            opacity: 1,
            y: 0,
            duration: 1,
            ease: 'power2.out',
            delay: 0.5
        })
        .to(welcomeText, {
            opacity: 0,
            y: -50,
            duration: 0.8,
            ease: 'power2.in',
            delay: 1.5
        });

        // Cafe name (after knife slice)
        tl.to(cafeName, {
            opacity: 1,
            duration: 0.5,
            delay: 2.5
        }, '+=0');

        // Animate each letter
        const letters = document.querySelectorAll('.cafe-letter');
        letters.forEach((letter, index) => {
            tl.fromTo(letter, 
                {
                    opacity: 0,
                    y: 100,
                    rotationX: -90,
                    scale: 0.5
                },
                {
                    opacity: 1,
                    y: 0,
                    rotationX: 0,
                    scale: 1,
                    duration: 0.6,
                    ease: 'back.out(2)'
                },
                `-=${index === 0 ? 0 : 0.5}`
            );
        });

        // Tagline words
        const taglineWords = document.querySelectorAll('.tagline-word');
        tl.fromTo(taglineWords,
            {
                opacity: 0,
                y: 30
            },
            {
                opacity: 1,
                y: 0,
                duration: 0.8,
                stagger: 0.2,
                ease: 'power2.out'
            },
            '-=0.3'
        );

        // Final message
        tl.to(cafeName, {
            opacity: 0,
            scale: 0.9,
            duration: 0.8,
            ease: 'power2.in',
            delay: 1.5
        })
        .to(finalMessage, {
            opacity: 1,
            y: 0,
            duration: 1.2,
            ease: 'power2.out'
        }, '-=0.4');
    }

    // Progress bar animation
    function animateProgress() {
        const progressFill = document.getElementById('progress-fill-3d');
        const progressText = document.getElementById('progress-text-3d');

        if (typeof gsap !== 'undefined') {
            gsap.to(progressFill, {
                width: '100%',
                duration: CONFIG.duration.total / 1000,
                ease: 'linear',
                onUpdate: function() {
                    const percent = Math.round(this.progress() * 100);
                    if (progressText) {
                        progressText.textContent = `Loading Experience... ${percent}%`;
                    }
                }
            });
        }
    }

    // Main initialization
    function initCinematicIntro(onComplete) {
        const loaderWrap = document.getElementById('loader-wrap');
        const appEl = document.getElementById('app');

        if (!loaderWrap || !appEl) return;

        // Prevent scroll during intro
        document.documentElement.classList.add('intro-active');
        document.body.classList.add('intro-active');

        // Ensure app is ready but hidden
        appEl.style.display = 'block';
        appEl.style.opacity = '0';
        appEl.style.position = 'fixed';
        appEl.style.inset = '0';
        appEl.style.zIndex = '1';
        
        // Loader stays on top
        loaderWrap.style.zIndex = '99999';

        // Initialize 3D scene
        const sceneInitialized = init3DScene();
        
        if (sceneInitialized) {
            animate();
        }

        // Start text animations
        animateTextSequence();
        animateProgress();

        // Auto finish after duration
        setTimeout(finishIntro, CONFIG.duration.total);

        function finishIntro() {
            if (typeof gsap === 'undefined') {
                // Fallback without GSAP - smooth crossfade
                appEl.style.opacity = '0';
                appEl.style.filter = 'blur(10px)';
                
                // Fade out loader
                loaderWrap.style.transition = 'opacity 1.2s ease-out, filter 1.2s ease-out';
                loaderWrap.style.opacity = '0';
                loaderWrap.style.filter = 'blur(10px)';
                
                // Start fading in app halfway through loader fade
                setTimeout(() => {
                    appEl.style.transition = 'opacity 1.2s ease-in, filter 1.2s ease-in';
                    appEl.style.opacity = '1';
                    appEl.style.filter = 'blur(0)';
                }, 400);
                
                // Clean up after transitions complete
                setTimeout(() => {
                    loaderWrap.style.display = 'none';
                    appEl.style.position = 'relative';
                    appEl.style.zIndex = 'auto';
                    // Re-enable scroll
                    document.documentElement.classList.remove('intro-active');
                    document.body.classList.remove('intro-active');
                    if (onComplete) onComplete();
                }, 1600);
                return;
            }

            // Premium GSAP crossfade - ultra smooth, no black screen
            const tl = gsap.timeline({
                onComplete: () => {
                    loaderWrap.style.display = 'none';
                    appEl.style.position = 'relative';
                    appEl.style.zIndex = 'auto';
                    // Re-enable scroll
                    document.documentElement.classList.remove('intro-active');
                    document.body.classList.remove('intro-active');
                    if (onComplete) onComplete();
                }
            });
            
            // Stage 1: Fade out intro UI elements (0.8s)
            tl.to('.intro-text-container, .intro-progress', {
                opacity: 0,
                y: -30,
                duration: 0.8,
                ease: 'power2.in',
                stagger: 0.1
            })
            // Stage 2: Fade out light effects (0.6s, overlapping)
            .to('.light-rays, .cinematic-grain, .cinematic-vignette', {
                opacity: 0,
                duration: 0.6,
                ease: 'power2.in'
            }, '-=0.5')
            // Stage 3: Start fading in app while canvas is still visible (1.2s)
            .to(appEl, {
                opacity: 1,
                scale: 1,
                filter: 'blur(0px)',
                duration: 1.2,
                ease: 'power2.out'
            }, '-=0.4')
            // Stage 4: Fade out 3D canvas (1s, heavy overlap with app fade-in)
            .to('#intro-canvas', {
                opacity: 0,
                scale: 1.05,
                filter: 'blur(20px)',
                duration: 1,
                ease: 'power2.inOut'
            }, '-=1')
            // Stage 5: Final fade of loader background (0.8s)
            .to(loaderWrap, {
                opacity: 0,
                duration: 0.8,
                ease: 'power2.inOut'
            }, '-=0.6');
        }
    }

    // Handle window resize
    function onWindowResize() {
        if (camera && renderer) {
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(window.innerWidth, window.innerHeight);
        }
    }

    window.addEventListener('resize', onWindowResize);

    // Export to global scope
    window.initCinematicIntro = initCinematicIntro;

})();
