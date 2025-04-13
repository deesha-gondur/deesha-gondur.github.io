document.addEventListener('alpine:init', () => {
    Alpine.data('sidemenu', () => ({
        menus: [
            { name: 'Home', icon: 'fa fa-home', id: 'home', url: '#home' },
            { name: 'About Me', icon: 'fa fa-user', id: 'about', url: '#about' },
            { name: 'Portfolio', icon: 'fa fa-palette', id: 'portfolio', url: '#portfolio' },
            { name: 'Blog', icon: 'fa fa-blog', id: 'blog', url: '#blog' },
            { name: 'Contact', icon: 'fa fa-envelope', id: 'contact', url: '#contact' },
            { name: 'Resume', icon: 'fa fa-file', id: 'resume', url: '#resume' }
        ],
        activeMenu: 'home',
        setActiveMenu(menu) {
            this.activeMenu = menu;
            this.$dispatch('menu-selected', { activeMenu: this.activeMenu });
        }
    }))
});



window.onload = function () {
    const canvas = document.getElementById('bg-canvas');
    if (canvas) {
        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        const renderer = new THREE.WebGLRenderer({ canvas, alpha: true }); // Ensure alpha for transparency

        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(window.devicePixelRatio);
        camera.position.z = 5; // Keep camera position fixed initially

        // Particle Geometry
        const particleCount = 5000;
        const particlesGeometry = new THREE.BufferGeometry();
        const positions = new Float32Array(particleCount * 3); // Current positions
        const targetPositions = new Float32Array(particleCount * 3); // Final target positions for flow
        const initialPositions = new Float32Array(particleCount * 3); // Starting positions (center) for explosion
        const colors = new Float32Array(particleCount * 3); // Array for colors

        const colorInside = new THREE.Color(0x00ffdd); // Teal/Cyan
        const colorOutside = new THREE.Color(0x0055ff); // Blue

        for (let i = 0; i < particleCount; i++) {
            const i3 = i * 3;

            // Target positions (where particles will float)
            const x = (Math.random() - 0.5) * 20;
            const y = (Math.random() - 0.5) * 20;
            const z = (Math.random() - 0.5) * 10 - 2; // z range: -7 to 3 (well below 10)
            targetPositions[i3] = x;
            targetPositions[i3 + 1] = y;
            targetPositions[i3 + 2] = z;

            // Initial positions (start near center for explosion)
            initialPositions[i3] = (Math.random() - 0.5) * 0.1;
            initialPositions[i3 + 1] = (Math.random() - 0.5) * 0.1;
            initialPositions[i3 + 2] = (Math.random() - 0.5) * 0.1;

            // Set initial positions in the geometry
            positions[i3] = initialPositions[i3];
            positions[i3 + 1] = initialPositions[i3 + 1];
            positions[i3 + 2] = initialPositions[i3 + 2];


            // Assign colors based on target distance from center
            const dist = Math.sqrt(x ** 2 + y ** 2);
            const mixRatio = Math.min(dist / 10, 1.0); // Normalize distance for mixing
            const mixedColor = colorInside.clone().lerp(colorOutside, mixRatio);

            colors[i3] = mixedColor.r;
            colors[i3 + 1] = mixedColor.g;
            colors[i3 + 2] = mixedColor.b;
        }

        particlesGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        particlesGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3)); // Set color attribute

        // Particle Material
        const particlesMaterial = new THREE.PointsMaterial({
            size: 0.03,
            sizeAttenuation: true,
            transparent: true,
            opacity: 0.8,
            blending: THREE.AdditiveBlending,
            vertexColors: true
        });

        // Particle System
        const particleSystem = new THREE.Points(particlesGeometry, particlesMaterial);
        scene.add(particleSystem);

        // Mouse tracking
        const mouse = new THREE.Vector2();
        window.addEventListener('mousemove', (event) => {
            mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
            mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
        });

        // Animation State
        const clock = new THREE.Clock();
        let explosionComplete = false;
        const explosionDuration = 2.0; // seconds
        let explosionTime = 0;

        function easeOutCubic(t) {
            return (--t) * t * t + 1;
        }


        function animate() {
            requestAnimationFrame(animate);

            const deltaTime = clock.getDelta();
            const elapsedTime = clock.getElapsedTime();
            const positionsAttribute = particleSystem.geometry.attributes.position;

            // --- Explosion Phase ---
            if (!explosionComplete) {
                explosionTime += deltaTime;
                const progress = Math.min(explosionTime / explosionDuration, 1.0);
                const easedProgress = easeOutCubic(progress); // Apply easing

                for (let i = 0; i < particleCount; i++) {
                    const i3 = i * 3;

                    // Interpolate from initial (center) to target position
                    positionsAttribute.setX(i, initialPositions[i3] + (targetPositions[i3] - initialPositions[i3]) * easedProgress);
                    positionsAttribute.setY(i, initialPositions[i3 + 1] + (targetPositions[i3 + 1] - initialPositions[i3 + 1]) * easedProgress);
                    positionsAttribute.setZ(i, initialPositions[i3 + 2] + (targetPositions[i3 + 2] - initialPositions[i3 + 2]) * easedProgress);
                }

                if (progress >= 1.0) {
                    explosionComplete = true;
                    // Ensure final positions match target positions exactly after explosion
                     for (let i = 0; i < particleCount; i++) {
                        const i3 = i * 3;
                        positionsAttribute.setXYZ(i, targetPositions[i3], targetPositions[i3+1], targetPositions[i3+2]);
                     }
                }
            }
            // --- Flowing Phase ---
            else {
                 // Animate particles - subtle floating/drifting (using targetPositions as base for drift)
                for (let i = 0; i < particleCount; i++) {
                    const i3 = i * 3;
                    const x = targetPositions[i3]; // Use target X for sine wave consistency
                    const currentY = positionsAttribute.getY(i);

                    // Simple upward drift + subtle sine wave movement based on original x and time
                    let newY = currentY + 0.002 + Math.sin(elapsedTime * 0.5 + x * 0.5) * 0.001;

                    // Reset particles that go too high (relative to their target Y)
                    if (newY > 10) { // If particle drifts 10 units above origin
                         newY = -10; // Reset below origin
                         // Also reset target Y to maintain relative position after reset
                         targetPositions[i3 + 1] = newY - ((Math.random() - 0.5) * 2); // Reset target Y around the new position
                    }
                     positionsAttribute.setY(i, newY);
                     // Update target Y to match current Y if not resetting, so drift continues from current spot
                     if (newY > -10) { // Avoid updating target immediately after reset
                        targetPositions[i3 + 1] = newY;
                     }
                }
            }

            positionsAttribute.needsUpdate = true;


            // Make the particle system subtly react to mouse (rotate slightly)
            const targetRotationX = mouse.y * 0.1;
            const targetRotationY = mouse.x * 0.1;
            // Smooth rotation towards target
            particleSystem.rotation.x += (targetRotationX - particleSystem.rotation.x) * 0.05;
            particleSystem.rotation.y += (targetRotationY - particleSystem.rotation.y) * 0.05;


            renderer.render(scene, camera);
        }

        animate();

        // Resize handling
        window.addEventListener('resize', () => {
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(window.innerWidth, window.innerHeight);
            renderer.setPixelRatio(window.devicePixelRatio); // Update pixel ratio on resize
        });
    } else {
        console.error("Canvas element with id 'bg-canvas' not found.");
    }

};


