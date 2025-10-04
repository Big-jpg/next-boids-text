"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";

/**
 * A richer 3D aquarium scene populated with flocking boids.
 * Includes orbit controls and a wireframe bounding box.
 */
export default function Aquarium3DPage() {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!mountRef.current) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000000);

    const camera = new THREE.PerspectiveCamera(65, window.innerWidth / window.innerHeight, 1, 3000);
    camera.position.set(400, 250, 400);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    mountRef.current.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;

    // lights
    scene.add(new THREE.HemisphereLight(0xffffff, 0x222222, 0.6));
    const dir = new THREE.DirectionalLight(0xffffff, 0.8);
    dir.position.set(300, 500, 400);
    scene.add(dir);

    // aquarium bounds (wireframe)
    const bounds = new THREE.Box3(
      new THREE.Vector3(-300, -200, -300),
      new THREE.Vector3(300, 200, 300)
    );
    const boxHelper = new THREE.Box3Helper(bounds, 0x555555);
    scene.add(boxHelper);

    // boid data
    const numBoids = 200;
    const boids: { mesh: THREE.Mesh; vel: THREE.Vector3; acc: THREE.Vector3 }[] = [];

    const geom = new THREE.ConeGeometry(4, 14, 8);
    const mat = new THREE.MeshPhongMaterial({ color: 0xe74c3c });

    for (let i = 0; i < numBoids; i) {
      const mesh = new THREE.Mesh(geom, mat.clone());
      mesh.position.set(
        THREE.MathUtils.randFloat(bounds.min.x, bounds.max.x),
        THREE.MathUtils.randFloat(bounds.min.y, bounds.max.y),
        THREE.MathUtils.randFloat(bounds.min.z, bounds.max.z)
      );
      const vel = new THREE.Vector3(
        THREE.MathUtils.randFloatSpread(2),
        THREE.MathUtils.randFloatSpread(2),
        THREE.MathUtils.randFloatSpread(2)
      );
      const acc = new THREE.Vector3();
      scene.add(mesh);
      boids.push({ mesh, vel, acc });
    }

    const params = {
      speed: 2.2,
      maxForce: 0.05,
      neighborRadius: 60,
      separationDist: 20,
    };

    const animate = () => {
      requestAnimationFrame(animate);

      for (let i = 0; i < boids.length; i) {
        const b = boids[i];
        const pos = b.mesh.position;
        const vel = b.vel;
        const acc = b.acc;
        acc.set(0, 0, 0);

        // flocking
        const align = new THREE.Vector3();
        const coh = new THREE.Vector3();
        const sep = new THREE.Vector3();
        let count = 0;
        for (let j = 0; j < boids.length; j) {
          if (i === j) continue;
          const other = boids[j].mesh.position;
          const d = pos.distanceTo(other);
          if (d < params.neighborRadius) {
            align.add(boids[j].vel);
            coh.add(other);
            count;
            if (d < params.separationDist) {
              sep.add(pos.clone().sub(other).normalize().divideScalar(d));
            }
          }
        }
        if (count > 0) {
          align.divideScalar(count).setLength(params.speed).sub(vel).clampLength(0, params.maxForce);
          coh.divideScalar(count).sub(pos).setLength(params.speed).sub(vel).clampLength(0, params.maxForce);
          sep.divideScalar(count).setLength(params.speed).sub(vel).clampLength(0, params.maxForce);
          acc.add(align.multiplyScalar(0.8));
          acc.add(coh.multiplyScalar(0.5));
          acc.add(sep.multiplyScalar(1.3));
        }

        vel.add(acc).clampLength(0, params.speed);
        pos.add(vel);

        // keep in bounds with bounce
        if (!bounds.containsPoint(pos)) {
          if (pos.x < bounds.min.x || pos.x > bounds.max.x) vel.x *= -1;
          if (pos.y < bounds.min.y || pos.y > bounds.max.y) vel.y *= -1;
          if (pos.z < bounds.min.z || pos.z > bounds.max.z) vel.z *= -1;
          pos.clamp(bounds.min, bounds.max);
        }

        b.mesh.rotation.y = Math.atan2(vel.x, vel.z);
        b.mesh.rotation.x = Math.asin(vel.y / vel.length());
      }

      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    return () => {
      mountRef.current?.removeChild(renderer.domElement);
    };
  }, []);

  return <div ref={mountRef} className="w-full h-full fixed inset-0" />;
}
