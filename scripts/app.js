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
        const renderer = new THREE.WebGLRenderer({ canvas, alpha: true });

        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(window.devicePixelRatio);
        camera.position.z = 5;

        const particleCount = 5000;
        const particlesGeometry = new THREE.BufferGeometry();
        const positions = new Float32Array(particleCount * 3);
        const targetPositions = new Float32Array(particleCount * 3);
        const initialPositions = new Float32Array(particleCount * 3);
        const colors = new Float32Array(particleCount * 3);

        const colorInside = new THREE.Color(0x00ffdd);
        const colorOutside = new THREE.Color(0x0055ff);

        for (let i = 0; i < particleCount; i++) {
            const i3 = i * 3;
            const x = (Math.random() - 0.5) * 20;
            const y = (Math.random() - 0.5) * 20;
            const z = (Math.random() - 0.5) * 10 - 2;
            targetPositions[i3] = x;
            targetPositions[i3 + 1] = y;
            targetPositions[i3 + 2] = z;

            initialPositions[i3] = (Math.random() - 0.5) * 0.1;
            initialPositions[i3 + 1] = (Math.random() - 0.5) * 0.1;
            initialPositions[i3 + 2] = (Math.random() - 0.5) * 0.1;

            positions[i3] = initialPositions[i3];
            positions[i3 + 1] = initialPositions[i3 + 1];
            positions[i3 + 2] = initialPositions[i3 + 2];

            const dist = Math.sqrt(x ** 2 + y ** 2);
            const mixRatio = Math.min(dist / 10, 1.0);
            const mixedColor = colorInside.clone().lerp(colorOutside, mixRatio);

            colors[i3] = mixedColor.r;
            colors[i3 + 1] = mixedColor.g;
            colors[i3 + 2] = mixedColor.b;
        }

        particlesGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        particlesGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

        const particlesMaterial = new THREE.PointsMaterial({
            size: 0.03,
            sizeAttenuation: true,
            transparent: true,
            opacity: 0.8,
            blending: THREE.AdditiveBlending,
            vertexColors: true
        });

        const particleSystem = new THREE.Points(particlesGeometry, particlesMaterial);
        scene.add(particleSystem);

        const mouse = new THREE.Vector2();
        window.addEventListener('mousemove', (event) => {
            mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
            mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
        });

        const clock = new THREE.Clock();

        // Detect if current page is index (root or index.html)
        const isIndexPage = (
            (window.location.pathname === '/' ||
            window.location.pathname.match(/\/index(\.html)?$/)) &&
            !window.location.hash
        );

        let explosionComplete = !isIndexPage; // Skip explosion if not index
        const explosionDuration = 2.0;
        let explosionTime = 0;

        function easeOutCubic(t) {
            return (--t) * t * t + 1;
        }

        function animate() {
            requestAnimationFrame(animate);

            const deltaTime = clock.getDelta();
            const elapsedTime = clock.getElapsedTime();
            const positionsAttribute = particleSystem.geometry.attributes.position;

            if (!explosionComplete) {
                explosionTime += deltaTime;
                const progress = Math.min(explosionTime / explosionDuration, 1.0);
                const easedProgress = easeOutCubic(progress);

                for (let i = 0; i < particleCount; i++) {
                    const i3 = i * 3;
                    positionsAttribute.setX(i, initialPositions[i3] + (targetPositions[i3] - initialPositions[i3]) * easedProgress);
                    positionsAttribute.setY(i, initialPositions[i3 + 1] + (targetPositions[i3 + 1] - initialPositions[i3 + 1]) * easedProgress);
                    positionsAttribute.setZ(i, initialPositions[i3 + 2] + (targetPositions[i3 + 2] - initialPositions[i3 + 2]) * easedProgress);
                }

                if (progress >= 1.0) {
                    explosionComplete = true;
                    for (let i = 0; i < particleCount; i++) {
                        const i3 = i * 3;
                        positionsAttribute.setXYZ(i, targetPositions[i3], targetPositions[i3+1], targetPositions[i3+2]);
                    }
                }
            } else {
                for (let i = 0; i < particleCount; i++) {
                    const i3 = i * 3;
                    const x = targetPositions[i3];
                    const currentY = positionsAttribute.getY(i);

                    let newY = currentY + 0.002 + Math.sin(elapsedTime * 0.5 + x * 0.5) * 0.001;

                    if (newY > 10) {
                        newY = -10;
                        targetPositions[i3 + 1] = newY - ((Math.random() - 0.5) * 2);
                    }
                    positionsAttribute.setY(i, newY);
                    if (newY > -10) {
                        targetPositions[i3 + 1] = newY;
                    }
                }
            }

            positionsAttribute.needsUpdate = true;

            const targetRotationX = mouse.y * 0.1;
            const targetRotationY = mouse.x * 0.1;
            particleSystem.rotation.x += (targetRotationX - particleSystem.rotation.x) * 0.05;
            particleSystem.rotation.y += (targetRotationY - particleSystem.rotation.y) * 0.05;

            renderer.render(scene, camera);
        }

        // If not index, set positions directly to target (skip explosion)
        if (!isIndexPage) {
            const positionsAttribute = particlesGeometry.attributes.position;
            for (let i = 0; i < particleCount; i++) {
                const i3 = i * 3;
                positionsAttribute.setXYZ(i, targetPositions[i3], targetPositions[i3+1], targetPositions[i3+2]);
            }
            positionsAttribute.needsUpdate = true;
        }

        animate();

        window.addEventListener('resize', () => {
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(window.innerWidth, window.innerHeight);
            renderer.setPixelRatio(window.devicePixelRatio);
        });
    } else {
        console.error("Canvas element with id 'bg-canvas' not found.");
    }
};


