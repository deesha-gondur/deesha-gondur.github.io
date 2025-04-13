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
        camera.position.z = 5;

        // Particle Geometry
        const particleCount = 5000;
        const particlesGeometry = new THREE.BufferGeometry();
        const positions = new Float32Array(particleCount * 3);
        const colors = new Float32Array(particleCount * 3); // Array for colors

        const colorInside = new THREE.Color(0x00ffdd); // Teal/Cyan
        const colorOutside = new THREE.Color(0x0055ff); // Blue

        for (let i = 0; i < particleCount * 3; i += 3) {
            // Position particles within a larger area, some closer, some farther
            positions[i] = (Math.random() - 0.5) * 20; // x
            positions[i + 1] = (Math.random() - 0.5) * 20; // y
            positions[i + 2] = (Math.random() - 0.5) * 10 - 2; // z (spread out in depth)

            // Assign colors based on distance from center (optional, creates a gradient effect)
            const dist = Math.sqrt(positions[i] ** 2 + positions[i + 1] ** 2);
            const mixRatio = Math.min(dist / 10, 1.0); // Normalize distance for mixing
            const mixedColor = colorInside.clone().lerp(colorOutside, mixRatio);

            colors[i] = mixedColor.r;
            colors[i + 1] = mixedColor.g;
            colors[i + 2] = mixedColor.b;
        }

        particlesGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        particlesGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3)); // Set color attribute

        // Particle Material
        const particlesMaterial = new THREE.PointsMaterial({
            size: 0.03,
            sizeAttenuation: true, // Make particles smaller further away
            // color: 0x00aaff, // Base color (can be overridden by vertex colors)
            transparent: true,
            opacity: 0.8,
            blending: THREE.AdditiveBlending, // Brighter where particles overlap
            vertexColors: true // Enable vertex colors
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

        // Animation
        const clock = new THREE.Clock();
        function animate() {
            requestAnimationFrame(animate);

            const elapsedTime = clock.getElapsedTime();

            // Animate particles - subtle floating/drifting
            const positionsAttribute = particleSystem.geometry.attributes.position;
            for (let i = 0; i < particleCount; i++) {
                const i3 = i * 3;
                const x = positionsAttribute.getX(i);
                // Simple upward drift + subtle sine wave movement
                positionsAttribute.setY(i, positionsAttribute.getY(i) + 0.002 + Math.sin(elapsedTime + x * 0.5) * 0.001);

                // Reset particles that go too high
                if (positionsAttribute.getY(i) > 10) {
                    positionsAttribute.setY(i, -10);
                }
            }
            positionsAttribute.needsUpdate = true;


            // Make the particle system subtly react to mouse (rotate slightly)
            const targetRotationX = mouse.y * 0.1;
            const targetRotationY = mouse.x * 0.1;
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


