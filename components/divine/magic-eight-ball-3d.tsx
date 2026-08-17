'use client';

import { Canvas, useFrame } from '@react-three/fiber';
import { useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';

interface MagicEightBall3DProps {
  answer: string;
  ariaLabel: string;
  disabled: boolean;
  onAdvance: () => void;
  step: number;
}

function makeEightTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Unable to draw the 8-ball medallion.');

  context.clearRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = '#090909';
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  context.font = '700 330px Georgia, serif';
  context.fillText('8', 256, 277);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 8;
  texture.needsUpdate = true;
  return texture;
}

function wrapText(
  context: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
) {
  const words = (text || '···').toUpperCase().split(/\s+/);
  const lines: string[] = [];
  let line = '';

  words.forEach((word) => {
    const candidate = `${line} ${word}`.trim();
    if (line && context.measureText(candidate).width > maxWidth) {
      lines.push(line);
      line = word;
    } else {
      line = candidate;
    }
  });
  if (line) lines.push(line);
  return lines.slice(0, 4);
}

function makeAnswerTexture(answer: string) {
  const canvas = document.createElement('canvas');
  canvas.width = 768;
  canvas.height = 768;
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Unable to draw the 8-ball answer.');

  context.clearRect(0, 0, canvas.width, canvas.height);
  const glow = context.createRadialGradient(384, 320, 20, 384, 390, 350);
  glow.addColorStop(0, '#5267d8');
  glow.addColorStop(0.38, '#24358e');
  glow.addColorStop(1, '#080e3b');
  context.beginPath();
  context.moveTo(384, 92);
  context.lineTo(690, 626);
  context.quadraticCurveTo(708, 660, 664, 660);
  context.lineTo(104, 660);
  context.quadraticCurveTo(60, 660, 78, 626);
  context.closePath();
  context.fillStyle = glow;
  context.fill();
  context.strokeStyle = 'rgba(145, 167, 255, .52)';
  context.lineWidth = 8;
  context.stroke();

  context.fillStyle = '#f4f5ff';
  context.shadowColor = '#aab7ff';
  context.shadowBlur = 18;
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  context.font = answer ? '600 54px Arial, sans-serif' : '500 78px Georgia';
  const lines = wrapText(context, answer, 410);
  const lineHeight = answer ? 59 : 80;
  const startY = 455 - ((lines.length - 1) * lineHeight) / 2;
  lines.forEach((line, index) =>
    context.fillText(line, 384, startY + index * lineHeight),
  );

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 8;
  texture.needsUpdate = true;
  return texture;
}

function BallModel({
  answer,
  rotation,
  shaking,
  step,
}: {
  answer: string;
  rotation: [number, number];
  shaking: boolean;
  step: number;
}) {
  const root = useRef<THREE.Group>(null);
  const eightTexture = useMemo(() => makeEightTexture(), []);
  const answerTexture = useMemo(() => makeAnswerTexture(answer), [answer]);

  useEffect(() => () => eightTexture.dispose(), [eightTexture]);
  useEffect(() => () => answerTexture.dispose(), [answerTexture]);

  useFrame((state, delta) => {
    if (!root.current) return;
    const time = state.clock.elapsedTime;
    const revealTurn = step === 0 ? 0 : step === 1 ? 1.28 : Math.PI;
    const shakeX = shaking ? Math.sin(time * 54) * 0.12 : 0;
    const shakeY = shaking ? Math.sin(time * 69) * 0.16 : 0;
    const float = Math.sin(time * 0.72) * 0.035;

    root.current.rotation.x = THREE.MathUtils.damp(
      root.current.rotation.x,
      rotation[0] + shakeX,
      shaking ? 18 : 7,
      delta,
    );
    root.current.rotation.y = THREE.MathUtils.damp(
      root.current.rotation.y,
      revealTurn + rotation[1] + shakeY,
      shaking ? 18 : 6,
      delta,
    );
    root.current.rotation.z = THREE.MathUtils.damp(
      root.current.rotation.z,
      shaking ? Math.sin(time * 61) * 0.08 : 0.035,
      shaking ? 20 : 7,
      delta,
    );
    root.current.position.y = float;
  });

  return (
    <group ref={root} rotation={[-0.08, 0, 0.035]}>
      <mesh castShadow receiveShadow>
        <sphereGeometry args={[1.58, 112, 112]} />
        <meshPhysicalMaterial
          color="#080808"
          roughness={0.16}
          metalness={0.02}
          clearcoat={1}
          clearcoatRoughness={0.1}
          sheen={0.32}
          sheenColor={new THREE.Color('#5c6172')}
        />
      </mesh>

      <mesh position={[0, 0, 1.565]}>
        <circleGeometry args={[0.61, 96]} />
        <meshPhysicalMaterial
          color="#f0f0e9"
          roughness={0.34}
          clearcoat={0.45}
          clearcoatRoughness={0.32}
        />
      </mesh>
      <mesh position={[0, 0, 1.578]}>
        <planeGeometry args={[1.08, 1.08]} />
        <meshBasicMaterial
          map={eightTexture}
          transparent
          depthWrite={false}
          toneMapped={false}
        />
      </mesh>

      <mesh position={[0, 0, -1.57]} rotation={[0, Math.PI, 0]}>
        <circleGeometry args={[0.72, 96]} />
        <meshPhysicalMaterial
          color="#070914"
          roughness={0.16}
          metalness={0.18}
          clearcoat={1}
          clearcoatRoughness={0.08}
        />
      </mesh>
      <mesh position={[0, 0, -1.584]} rotation={[0, Math.PI, 0]}>
        <planeGeometry args={[1.35, 1.35]} />
        <meshBasicMaterial
          map={answerTexture}
          transparent
          depthWrite={false}
          toneMapped={false}
          opacity={step >= 2 ? 1 : 0.34}
        />
      </mesh>
    </group>
  );
}

export function MagicEightBall3D({
  answer,
  ariaLabel,
  disabled,
  onAdvance,
  step,
}: MagicEightBall3DProps) {
  const [rotation, setRotation] = useState<[number, number]>([-0.08, 0]);
  const gesture = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    x: number;
    y: number;
    moved: boolean;
  } | null>(null);
  const suppressClick = useRef(false);

  return (
    <div className={`magic-eight-ball-3d object-step-${step}`}>
      <Canvas
        dpr={[1, 1.75]}
        camera={{ position: [0, 0.08, 5.9], fov: 34, near: 0.1, far: 30 }}
        gl={{
          alpha: true,
          antialias: true,
          powerPreference: 'high-performance',
        }}
        shadows
        fallback={<span className="object-webgl-fallback" />}
      >
        <ambientLight intensity={0.34} />
        <hemisphereLight args={['#f5f0e8', '#090711', 0.9]} />
        <spotLight
          position={[-4.5, 6, 5.5]}
          intensity={94}
          angle={0.38}
          penumbra={0.92}
          decay={2}
          castShadow
        />
        <pointLight position={[4.2, 0.5, 4]} color="#a7b3ff" intensity={15} />
        <pointLight position={[-3, -2, 2]} color="#d7a66c" intensity={7} />
        <BallModel
          answer={step >= 3 ? answer : ''}
          rotation={rotation}
          shaking={disabled}
          step={step}
        />
        <mesh
          position={[0, -1.7, 0]}
          rotation={[-Math.PI / 2, 0, 0]}
          receiveShadow
        >
          <planeGeometry args={[6.4, 6.4]} />
          <shadowMaterial transparent opacity={0.26} />
        </mesh>
      </Canvas>
      <button
        type="button"
        className="magic-eight-ball-interaction"
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
            startX: event.clientX,
            startY: event.clientY,
            x: event.clientX,
            y: event.clientY,
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
          if (Math.hypot(totalX, totalY) > 3) current.moved = true;
          current.x = event.clientX;
          current.y = event.clientY;
          setRotation(([x, y]) => [
            THREE.MathUtils.clamp(x + dy * 0.008, -0.48, 0.48),
            THREE.MathUtils.clamp(y + dx * 0.009, -0.52, 0.52),
          ]);
        }}
        onPointerUp={(event) => {
          const current = gesture.current;
          if (!current || current.pointerId !== event.pointerId) return;
          if (event.currentTarget.hasPointerCapture(event.pointerId)) {
            event.currentTarget.releasePointerCapture(event.pointerId);
          }
          suppressClick.current = current.moved;
          if (
            current.moved &&
            Math.hypot(
              event.clientX - current.startX,
              event.clientY - current.startY,
            ) >= 32 &&
            !disabled
          ) {
            onAdvance();
          }
          window.setTimeout(() => {
            suppressClick.current = false;
          }, 0);
          gesture.current = null;
        }}
        onPointerCancel={() => {
          gesture.current = null;
        }}
      />
    </div>
  );
}
