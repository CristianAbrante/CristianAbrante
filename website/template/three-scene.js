import * as THREE from 'three';

const canvas = document.getElementById('hero-canvas');
if (canvas) initScene(canvas);

function initScene(canvas) {
    const wrap = canvas.parentElement;
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const scene = new THREE.Scene();

    const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100);
    camera.position.set(0, 0, 8);

    const renderer = new THREE.WebGLRenderer({
        canvas,
        alpha: true,
        antialias: true,
        powerPreference: 'low-power',
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
    renderer.setClearColor(0x000000, 0);
    renderer.outputColorSpace = THREE.SRGBColorSpace;

    const palette = {
        peach: 0xf5c9b0,
        apricot: 0xf4b48a,
        sage: 0xc8d3bb,
        powder: 0xc8d6df,
        lilac: 0xd9cfe2,
        espresso: 0x2b180a,
    };

    const key = new THREE.DirectionalLight(0xfff2e0, 1.15);
    key.position.set(4, 5, 6);
    scene.add(key);

    const rim = new THREE.DirectionalLight(0xd9cfe2, 0.55);
    rim.position.set(-5, -2, 3);
    scene.add(rim);

    scene.add(new THREE.AmbientLight(0xfcf6ef, 0.65));

    const group = new THREE.Group();
    scene.add(group);

    const mat = (color, opts = {}) =>
        new THREE.MeshStandardMaterial({
            color,
            roughness: opts.roughness ?? 0.6,
            metalness: opts.metalness ?? 0.05,
        });

    const shapes = [];

    const sphereBig = new THREE.Mesh(
        new THREE.SphereGeometry(1.35, 64, 64),
        mat(palette.peach, { roughness: 0.45 })
    );
    sphereBig.position.set(-1.9, 0.1, 0);
    shapes.push({ mesh: sphereBig, spin: [0.001, 0.0015, 0], float: { amp: 0.16, speed: 0.5, phase: 0 } });

    const knot = new THREE.Mesh(
        new THREE.TorusKnotGeometry(0.72, 0.22, 200, 28),
        mat(palette.apricot, { roughness: 0.5 })
    );
    knot.position.set(2.1, 0.3, -0.4);
    shapes.push({ mesh: knot, spin: [0.0025, 0.003, 0.001], float: { amp: 0.2, speed: 0.55, phase: 1.6 } });

    const ico = new THREE.Mesh(
        new THREE.IcosahedronGeometry(0.55, 0),
        mat(palette.sage, { roughness: 0.55 })
    );
    ico.position.set(0.4, 1.55, -0.5);
    shapes.push({ mesh: ico, spin: [0.003, 0.0025, 0.002], float: { amp: 0.28, speed: 0.7, phase: 3.1 } });

    const spherePowder = new THREE.Mesh(
        new THREE.SphereGeometry(0.42, 40, 40),
        mat(palette.powder, { roughness: 0.4 })
    );
    spherePowder.position.set(-0.6, -1.55, 0.3);
    shapes.push({ mesh: spherePowder, spin: [0.001, 0.002, 0], float: { amp: 0.26, speed: 0.6, phase: 2.2 } });

    const ring = new THREE.Mesh(
        new THREE.TorusGeometry(0.5, 0.06, 24, 100),
        new THREE.MeshStandardMaterial({ color: palette.espresso, roughness: 0.35, metalness: 0.5 })
    );
    ring.position.set(2.6, -1.3, -1);
    ring.rotation.x = Math.PI / 2.6;
    shapes.push({ mesh: ring, spin: [0.001, 0.004, 0], float: { amp: 0.14, speed: 0.5, phase: 0.7 } });

    const lilacBlob = new THREE.Mesh(
        new THREE.IcosahedronGeometry(0.75, 1),
        mat(palette.lilac, { roughness: 0.65 })
    );
    lilacBlob.position.set(-2.6, -1.4, -0.6);
    shapes.push({ mesh: lilacBlob, spin: [0.0015, 0.001, 0.0008], float: { amp: 0.22, speed: 0.42, phase: 1.1 } });

    shapes.forEach((s) => group.add(s.mesh));

    const target = { x: 0, y: 0 };
    const current = { x: 0, y: 0 };

    function onPointer(e) {
        const rect = wrap.getBoundingClientRect();
        const cx = (e.clientX - rect.left) / rect.width - 0.5;
        const cy = (e.clientY - rect.top) / rect.height - 0.5;
        target.x = cx * 0.35;
        target.y = -cy * 0.25;
    }
    wrap.addEventListener('pointermove', onPointer);

    function resize() {
        const w = wrap.clientWidth;
        const h = wrap.clientHeight;
        renderer.setSize(w, h, false);
        camera.aspect = w / h;
        const narrow = w < 900;
        group.scale.setScalar(narrow ? 0.65 : 0.9);
        group.position.x = narrow ? 0 : 2.2;
        group.position.y = narrow ? 0 : -0.2;
        camera.updateProjectionMatrix();
    }
    resize();
    window.addEventListener('resize', resize);

    let running = true;
    document.addEventListener('visibilitychange', () => {
        running = !document.hidden;
        if (running) requestAnimationFrame(tick);
    });

    const clock = new THREE.Clock();

    function tick() {
        if (!running) return;
        const t = clock.getElapsedTime();

        current.x += (target.x - current.x) * 0.05;
        current.y += (target.y - current.y) * 0.05;
        group.rotation.y = current.x;
        group.rotation.x = current.y;

        for (const s of shapes) {
            s.mesh.rotation.x += s.spin[0];
            s.mesh.rotation.y += s.spin[1];
            s.mesh.rotation.z += s.spin[2];
            const base = s.mesh.userData.baseY ?? (s.mesh.userData.baseY = s.mesh.position.y);
            s.mesh.position.y = base + Math.sin(t * s.float.speed + s.float.phase) * s.float.amp;
        }

        renderer.render(scene, camera);
        if (!reduceMotion) requestAnimationFrame(tick);
    }

    if (reduceMotion) {
        renderer.render(scene, camera);
    } else {
        requestAnimationFrame(tick);
    }
}
