import { useEffect, useRef } from 'react';
import { Matrix3, PerspectiveCamera, Scene, Timer, Vector3, WebGLRenderer } from 'three';
import { attachPointerSplats, FluidSimulation } from 'three-fluid-fx';
import { createFlowParticles } from '../lib/flowParticles';

// All knobs in one place. Fluid solver fields go to FluidSimulation;
// the rest are particle-system parameters consumed by particles.step().
// Values mirror the three-fluid-fx "particles-3d" minimal example.
const DEFAULTS = {
  // Fluid solver
  splatRadius: 0.001,
  splatForce: 6,
  reflectWalls: false,
  // Field → particle response (3D mode uses depthLift + perpendicularAngle)
  flowStrength: 1.05,
  depthLift: 1.45,
  flowThreshold: 0.02,
  maxFlowSpeed: 12,
  responseGamma: 2,
  perpendicularAngle: 1.5,
  sideVariation: 1,
  depthAttenuationScale: 2,
  // Particle physics
  spring: 1.55,
  zeta: 1.15,
  dragLin: 0.28,
  dragQuad: 0.05,
  aMax: 24,
  vMaxScale: 1,
  // Render / motion
  pointSize: 10,
  rotationSpeed: 0.12,
};

function supportsWebGL2() {
  try {
    const canvas = document.createElement('canvas');
    return !!canvas.getContext('webgl2');
  } catch {
    return false;
  }
}

/**
 * GPGPU flow-particle field (three-fluid-fx). A Fibonacci-sphere particle
 * cloud slowly rotates and is advected by a pointer-driven 2D Stable-Fluids
 * velocity field. Rendered on a transparent, fixed, full-viewport canvas so
 * it sits over the page background and under the page content.
 *
 * `interactionRef` — element whose pointer movement feeds the fluid. Pass the
 * outer page container so the whole hero drives the flow, even where content
 * overlays the canvas (which is pointer-events: none).
 */
export default function FluidParticles({ interactionRef, active = true }) {
  const mountRef = useRef(null);
  const activeRef = useRef(active);

  // Keep the loop's view of `active` current without re-running the WebGL setup.
  useEffect(() => {
    activeRef.current = active;
  }, [active]);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return undefined;

    const prefersReduced =
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const isSmallScreen = window.innerWidth <= 768;
    if (prefersReduced || isSmallScreen || !supportsWebGL2()) return undefined;

    let disposed = false;
    const renderer = new WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setClearColor(0x000000, 0); // transparent — page background shows through
    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = '100%';
    renderer.domElement.style.display = 'block';
    mount.appendChild(renderer.domElement);

    const scene = new Scene();
    const camera = new PerspectiveCamera(45, 1, 0.1, 100);
    // Elevated, looking down at the origin — a tilted top view of the spinning
    // galaxy disc (which lives in the XZ plane and spins around Y).
    camera.position.set(0, 3.2, 5.4);
    camera.lookAt(0, 0, 0);
    camera.updateMatrixWorld(true);

    const fluid = new FluidSimulation(renderer, {
      profile: 'balanced',
      splatRadius: DEFAULTS.splatRadius,
      splatForce: DEFAULTS.splatForce,
      reflectWalls: DEFAULTS.reflectWalls,
    });
    // Drive the fluid from pointer movement over the whole page container.
    const splatTarget = interactionRef?.current ?? renderer.domElement;
    const detachPointer = attachPointerSplats(splatTarget, fluid);

    // Spiral galaxy particle cloud spinning around Y. fluid.velocityTexture
    // (a 2D screen-space field) is sampled per-particle by projecting each
    // particle's world position into NDC. Palette follows the app theme:
    // the mid stop is driven by the CSS `--primary` variable when present.
    const cssPrimary = getComputedStyle(document.documentElement)
      .getPropertyValue('--primary')
      .trim();
    // Bold blue <-> purple stops, well separated. First stop follows the theme.
    const paletteStops = ['#2563eb', '#9333ea', '#0ea5e9', '#7c3aed'];
    if (cssPrimary) paletteStops[0] = cssPrimary;
    const particles = createFlowParticles(renderer, {
      mode: 'cloud3d',
      size: 64,
      colors: paletteStops,
    });
    // Anchor the galaxy behind the hero image (right side). The statue (page
    // content, z-index 2) sits in front of the canvas, so the galaxy swirls
    // around it as a halo — one focal point on the right, clean copy on the left.
    particles.points.position.set(2.0, 0, 0);
    scene.add(particles.points);

    const cameraRight = new Vector3(1, 0, 0);
    const cameraUp = new Vector3(0, 1, 0);
    const modelRotation = new Matrix3();
    let spinAngle = 0;

    const resize = () => {
      const w = Math.max(1, mount.clientWidth);
      const h = Math.max(1, mount.clientHeight);
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      fluid.resize(w, h);
    };
    resize();
    window.addEventListener('resize', resize);

    const clock = new Timer();
    renderer.setAnimationLoop(() => {
      if (disposed) return;
      // Off the hero section: stop stepping/rendering (saves GPU); the div also
      // fades out via CSS so it never competes with Plans/Blog content.
      if (!activeRef.current) return;
      clock.update();
      const dt = Math.min(Math.max(clock.getDelta(), 1e-6), 1 / 30);
      const fluidDt = Math.min(dt, 1 / 60);
      fluid.step(fluidDt);

      // Rotate the points object — uModelRotation in the velocity shader
      // compensates so fluid sampling stays correct in world space.
      spinAngle += DEFAULTS.rotationSpeed * dt;
      particles.points.rotation.y = spinAngle;
      particles.points.updateMatrixWorld(true);
      modelRotation.setFromMatrix4(particles.points.matrixWorld);

      cameraRight.setFromMatrixColumn(camera.matrixWorld, 0);
      cameraUp.setFromMatrixColumn(camera.matrixWorld, 1);
      particles.step({
        ...DEFAULTS,
        dt,
        dpr: renderer.getPixelRatio(),
        velocityField: fluid.velocityTexture,
        viewMatrix: camera.matrixWorldInverse,
        projectionMatrix: camera.projectionMatrix,
        cameraRight,
        cameraUp,
        modelRotation,
      });

      renderer.render(scene, camera);
    });

    return () => {
      disposed = true;
      renderer.setAnimationLoop(null);
      window.removeEventListener('resize', resize);
      detachPointer();
      particles.dispose();
      fluid.dispose();
      renderer.dispose();
      if (renderer.domElement.parentNode === mount) {
        mount.removeChild(renderer.domElement);
      }
    };
  }, [interactionRef]);

  return (
    <div
      className="fluid-particles"
      ref={mountRef}
      aria-hidden="true"
      style={{ opacity: active ? 1 : 0 }}
    />
  );
}
