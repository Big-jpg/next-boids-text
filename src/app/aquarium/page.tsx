"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

/**
 * A simple 3D aquarium full of flocking boids.
 * This uses a naive O(n^2) neighbor search, intended as a
 * stepping stone toward the full Sebastian Lague translation.
 */
export default function AquariumPage() {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!mountRef.current) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0b0f13);

    const camera = new THREE.PerspectiveCamera(
      60,
      window.innerWidth / window.innerHeight,
      1,
      2000
    );
    camera.position.set(0, 200, 400);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    mountRef.current.appendChild(renderer.domElement);

    // lights
    scene.add(new THREE.HemisphereLight(0xffffff, 0x444444, 0.6));
    const dir = new THREE.DirectionalLight(0xffffff, 0.8);
    dir.position.set(200, 500, 300);
    scene.add(dir);

    // aquarium bounds
    const bounds = new THREE.Box3(
      new THREE.Vector3(-300, -150, -300),
      new THREE.Vector3(300, 150, 300)
    );

    // boid data
    const numBoids = 150;
    const boids: {
      mesh: THREE.Mesh;
      vel: THREE.Vector3;
      acc: THREE.Vector3;
    }[] = [];

    const geom = new THREE.ConeGeometry(4, 12, 8);
    const mat = new THREE.MeshPhongMaterial({ color: 0x1abc9c });

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
      speed: 2,
      maxForce: 0.05,
      neighborRadius: 50,
      separationDist: 15,
    };

    const animate = () => {
      requestAnimationFrame(animate);
      for (let i = 0; i < boids.length; i) {
        const b = boids[i];
        const pos = b.mesh.position;
        const vel = b.vel;
        const acc = b.acc;
        acc.set(0, 0, 0);

        // flock
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
              const diff = pos.clone().sub(other).normalize().divideScalar(d);
              sep.add(diff);
            }
          }
        }
        if (count > 0) {
          align.divideScalar(count).setLength(params.speed).sub(vel).clampLength(0, params.maxForce);
          coh.divideScalar(count).sub(pos).setLength(params.speed).sub(vel).clampLength(0, params.maxForce);
          sep.divideScalar(count).setLength(params.speed).sub(vel).clampLength(0, params.maxForce);
          acc.add(align.multiplyScalar(1.0));
          acc.add(coh.multiplyScalar(0.6));
          acc.add(sep.multiplyScalar(1.2));
        }

        // update
        vel.add(acc).clampLength(0, params.speed);
        pos.add(vel);

        // keep in bounds
        if (!bounds.containsPoint(pos)) {
          vel.add(pos.clone().clamp(bounds.min, bounds.max).sub(pos).multiplyScalar(0.02));
        }

        b.mesh.rotation.y = Math.atan2(vel.x, vel.z);
      }
      renderer.render(scene, camera);
    };
    animate();

    return () => {
      mountRef.current?.removeChild(renderer.domElement);
    };
  }, []);

  return <div ref={mountRef} className="w-full h-full fixed inset-0" />;
}