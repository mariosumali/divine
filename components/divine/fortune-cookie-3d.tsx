'use client';

import { Canvas, useFrame, useLoader } from '@react-three/fiber';
import { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

interface FortuneCookie3DProps {
  step: number;
  disabled: boolean;
  ariaLabel: string;
  onAdvance: () => void;
  onGestureProgress: (progress: number) => void;
  gestureProgress: number;
}

function seededRandom(seed: number) {
  let value = seed >>> 0;
  return () => {
    value = (value * 1664525 + 1013904223) >>> 0;
    return value / 4294967296;
  };
}

function makeCookieMaps() {
  const size = 384;
  const colorData = new Uint8Array(size * size * 4);
  const bumpData = new Uint8Array(size * size);
  const random = seededRandom(824113);

  for (let index = 0; index < size * size; index += 1) {
    const broadGrain = (random() - 0.5) * 20;
    const fineGrain = (random() - 0.5) * 8;
    const pore = random() < 0.012;
    const toast = random() < 0.055;
    const shade = pore ? -76 : toast ? -25 : broadGrain;
    const offset = index * 4;
    colorData[offset] = Math.max(0, Math.min(255, 224 + shade + fineGrain));
    colorData[offset + 1] = Math.max(
      0,
      Math.min(255, 169 + shade * 0.72 + fineGrain),
    );
    colorData[offset + 2] = Math.max(
      0,
      Math.min(255, 91 + shade * 0.42 + fineGrain),
    );
    colorData[offset + 3] = 255;
    bumpData[index] = pore
      ? 22 + Math.floor(random() * 18)
      : Math.max(58, Math.min(232, 142 + broadGrain * 3));
  }

  const color = new THREE.DataTexture(colorData, size, size, THREE.RGBAFormat);
  color.colorSpace = THREE.SRGBColorSpace;
  color.wrapS = color.wrapT = THREE.RepeatWrapping;
  color.repeat.set(4.2, 4.2);
  color.needsUpdate = true;

  const bump = new THREE.DataTexture(bumpData, size, size, THREE.RedFormat);
  bump.wrapS = bump.wrapT = THREE.RepeatWrapping;
  bump.repeat.set(5.4, 5.4);
  bump.needsUpdate = true;

  return { color, bump };
}

function cloneWorldGeometry(mesh: THREE.Mesh) {
  const geometry = mesh.geometry.clone();
  geometry.applyMatrix4(mesh.matrixWorld);
  geometry.computeBoundingBox();
  geometry.computeVertexNormals();
  return geometry;
}

function CookieModel({
  step,
  rotation,
  reducedMotion,
  gestureProgress,
}: {
  step: number;
  rotation: [number, number];
  reducedMotion: boolean;
  gestureProgress: number;
}) {
  const gltf = useLoader(GLTFLoader, '/models/fortune-cookie.glb');
  const root = useRef<THREE.Group>(null);
  const left = useRef<THREE.Group>(null);
  const right = useRef<THREE.Group>(null);
  const crumbs = useRef<THREE.Group>(null);

  const prepared = useMemo(() => {
    gltf.scene.updateMatrixWorld(true);
    const leftSource = gltf.scene.getObjectByName('CookieLeft');
    const rightSource = gltf.scene.getObjectByName('CookieRight');
    if (
      !leftSource ||
      !rightSource ||
      !('isMesh' in leftSource) ||
      !('isMesh' in rightSource) ||
      !leftSource.isMesh ||
      !rightSource.isMesh
    ) {
      throw new Error('The fortune-cookie model is missing its split shells.');
    }

    const leftGeometry = cloneWorldGeometry(leftSource as THREE.Mesh);
    const rightGeometry = cloneWorldGeometry(rightSource as THREE.Mesh);
    const bounds = new THREE.Box3();
    if (leftGeometry.boundingBox) bounds.union(leftGeometry.boundingBox);
    if (rightGeometry.boundingBox) bounds.union(rightGeometry.boundingBox);
    const center = bounds.getCenter(new THREE.Vector3());
    const size = bounds.getSize(new THREE.Vector3());
    leftGeometry.translate(-center.x, -center.y, -center.z);
    rightGeometry.translate(-center.x, -center.y, -center.z);

    const maps = makeCookieMaps();
    const material = new THREE.MeshPhysicalMaterial({
      color: '#fff0d0',
      map: maps.color,
      bumpMap: maps.bump,
      bumpScale: 0.55,
      roughness: 0.82,
      metalness: 0,
      clearcoat: 0.12,
      clearcoatRoughness: 0.78,
      sheen: 0.1,
      sheenColor: new THREE.Color('#ffe3ad'),
      side: THREE.DoubleSide,
    });

    return {
      leftGeometry,
      rightGeometry,
      material,
      maps,
      scale: 3.75 / Math.max(size.x, size.y, size.z),
    };
  }, [gltf]);

  useEffect(
    () => () => {
      prepared.leftGeometry.dispose();
      prepared.rightGeometry.dispose();
      prepared.material.dispose();
      prepared.maps.color.dispose();
      prepared.maps.bump.dispose();
    },
    [prepared],
  );

  useFrame((state, delta) => {
    const time = state.clock.elapsedTime;
    const visualStep = Math.min(step, 3);
    const separations = [0, 0.65, 3.4, 16.5];
    const separation = THREE.MathUtils.lerp(
      separations[visualStep],
      separations[Math.min(visualStep + 1, 3)],
      gestureProgress,
    );
    const turn = visualStep === 3 ? 0.24 : visualStep === 2 ? 0.035 : 0;
    const depth = visualStep === 3 ? 4.5 : 0;

    if (root.current) {
      root.current.rotation.x = THREE.MathUtils.damp(
        root.current.rotation.x,
        rotation[0] + (reducedMotion ? 0 : Math.sin(time * 0.68) * 0.018),
        reducedMotion ? 18 : 8,
        delta,
      );
      root.current.rotation.y = THREE.MathUtils.damp(
        root.current.rotation.y,
        rotation[1] + (reducedMotion ? 0 : Math.sin(time * 0.46) * 0.035),
        reducedMotion ? 18 : 8,
        delta,
      );
      root.current.position.y = reducedMotion
        ? 0
        : Math.sin(time * 0.7) * 0.035;
    }
    if (left.current) {
      left.current.position.x = THREE.MathUtils.damp(
        left.current.position.x,
        -separation,
        6,
        delta,
      );
      left.current.position.z = THREE.MathUtils.damp(
        left.current.position.z,
        depth,
        6,
        delta,
      );
      left.current.rotation.z = THREE.MathUtils.damp(
        left.current.rotation.z,
        turn,
        6,
        delta,
      );
      left.current.rotation.y = THREE.MathUtils.damp(
        left.current.rotation.y,
        turn * 0.72,
        6,
        delta,
      );
    }
    if (right.current) {
      right.current.position.x = THREE.MathUtils.damp(
        right.current.position.x,
        separation,
        6,
        delta,
      );
      right.current.position.z = THREE.MathUtils.damp(
        right.current.position.z,
        -depth,
        6,
        delta,
      );
      right.current.rotation.z = THREE.MathUtils.damp(
        right.current.rotation.z,
        -turn,
        6,
        delta,
      );
      right.current.rotation.y = THREE.MathUtils.damp(
        right.current.rotation.y,
        -turn * 0.72,
        6,
        delta,
      );
    }
    if (crumbs.current) {
      crumbs.current.visible = visualStep === 3;
      crumbs.current.rotation.y += delta * 0.3;
    }
  });

  return (
    <group ref={root} rotation={[0.24, -0.58, -0.04]}>
      <group scale={prepared.scale}>
        <group ref={left}>
          <mesh
            geometry={prepared.leftGeometry}
            material={prepared.material}
            castShadow
            receiveShadow
          />
        </group>
        <group ref={right}>
          <mesh
            geometry={prepared.rightGeometry}
            material={prepared.material}
            castShadow
            receiveShadow
          />
        </group>
      </group>
      <group ref={crumbs} visible={false}>
        {[
          [-0.34, -0.12, 0.32, 0.08],
          [0.28, -0.22, 0.16, 0.065],
          [-0.12, 0.06, 0.48, 0.05],
          [0.16, 0.12, -0.18, 0.055],
        ].map(([x, y, z, size], index) => (
          <mesh
            key={index}
            position={[x, y, z]}
            rotation={[x, z, y]}
            castShadow
          >
            <tetrahedronGeometry args={[size, 0]} />
            <meshStandardMaterial color="#b97934" roughness={0.95} />
          </mesh>
        ))}
      </group>
    </group>
  );
}

useLoader.preload(GLTFLoader, '/models/fortune-cookie.glb');

export function FortuneCookie3D({
  step,
  disabled,
  ariaLabel,
  onAdvance,
  onGestureProgress,
  gestureProgress,
}: FortuneCookie3DProps) {
  const [rotation, setRotation] = useState<[number, number]>([0.24, -0.58]);
  const [reducedMotion, setReducedMotion] = useState(false);
  const gesture = useRef<{
    pointerId: number;
    x: number;
    y: number;
    startX: number;
    startY: number;
    moved: boolean;
  } | null>(null);
  const suppressClick = useRef(false);

  const updateGestureProgress = (progress: number) => {
    onGestureProgress(progress);
  };

  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)');
    const sync = () => setReducedMotion(query.matches);
    sync();
    query.addEventListener('change', sync);
    return () => query.removeEventListener('change', sync);
  }, []);

  return (
    <div className="fortune-cookie-3d">
      <Canvas
        dpr={[1, 1.75]}
        camera={{ position: [0, 0.06, 5.35], fov: 33, near: 0.1, far: 30 }}
        gl={{
          alpha: true,
          antialias: true,
          powerPreference: 'high-performance',
        }}
        shadows
        fallback={<span className="cookie-webgl-fallback" />}
      >
        <ambientLight intensity={0.82} />
        <hemisphereLight args={['#fff2d9', '#28170d', 1.55]} />
        <spotLight
          position={[-4, 6, 6]}
          intensity={72}
          angle={0.34}
          penumbra={0.96}
          decay={2}
          castShadow
        />
        <pointLight position={[4, 1, 4]} color="#ffc978" intensity={23} />
        <pointLight position={[0, -3, 2]} color="#8a552b" intensity={10} />
        <Suspense fallback={null}>
          <CookieModel
            step={step}
            rotation={rotation}
            reducedMotion={reducedMotion}
            gestureProgress={gestureProgress}
          />
        </Suspense>
      </Canvas>
      <button
        type="button"
        className="fortune-cookie-interaction"
        disabled={disabled}
        aria-label={ariaLabel}
        onKeyDown={(event) => {
          if (!disabled && (event.key === 'Enter' || event.key === ' ')) {
            event.preventDefault();
            onAdvance();
          }
        }}
        onClick={() => {
          if (suppressClick.current) {
            suppressClick.current = false;
            return;
          }
          if (!disabled) onAdvance();
        }}
        onPointerDown={(event) => {
          if (disabled) return;
          event.currentTarget.setPointerCapture(event.pointerId);
          gesture.current = {
            pointerId: event.pointerId,
            x: event.clientX,
            y: event.clientY,
            startX: event.clientX,
            startY: event.clientY,
            moved: false,
          };
        }}
        onPointerMove={(event) => {
          const current = gesture.current;
          if (!current || current.pointerId !== event.pointerId || disabled)
            return;
          const dx = event.clientX - current.x;
          const dy = event.clientY - current.y;
          const totalX = event.clientX - current.startX;
          const totalY = event.clientY - current.startY;
          const progress =
            step >= 3
              ? Math.max(0, Math.min(1, totalX / 120))
              : Math.max(
                  0,
                  Math.min(1, (Math.abs(totalX) + Math.max(0, -totalY)) / 125),
                );
          if (Math.hypot(totalX, totalY) > 3) current.moved = true;
          current.x = event.clientX;
          current.y = event.clientY;
          updateGestureProgress(progress);
          setRotation(([x, y]) => [
            Math.max(-1.05, Math.min(0.92, x + dy * 0.008)),
            y + dx * 0.009,
          ]);
        }}
        onPointerUp={(event) => {
          const current = gesture.current;
          if (!current || current.pointerId !== event.pointerId) return;
          if (event.currentTarget.hasPointerCapture(event.pointerId)) {
            event.currentTarget.releasePointerCapture(event.pointerId);
          }
          suppressClick.current = current.moved;
          if (current.moved) {
            const totalX = event.clientX - current.startX;
            const totalY = event.clientY - current.startY;
            const progress =
              step >= 3
                ? Math.max(0, totalX / 120)
                : (Math.abs(totalX) + Math.max(0, -totalY)) / 125;
            if (progress >= 0.38 && !disabled) onAdvance();
            else updateGestureProgress(0);
            window.setTimeout(() => {
              suppressClick.current = false;
            }, 0);
          }
          gesture.current = null;
        }}
        onPointerCancel={() => {
          updateGestureProgress(0);
          gesture.current = null;
        }}
      />
    </div>
  );
}
