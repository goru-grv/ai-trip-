import React, { Suspense, useEffect, useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { useTexture, Cloud, Stars } from '@react-three/drei';
import { SRGBColorSpace } from 'three';

const TEXTURE_BASE =
  'https://cdn.jsdelivr.net/gh/mrdoob/three.js@r184/examples/textures/planets';
const EARTH_COLOR = `${TEXTURE_BASE}/earth_atmos_2048.jpg`;
const EARTH_NORMAL = `${TEXTURE_BASE}/earth_normal_2048.jpg`;

const Airplane = () => {
  const tiltRef = useRef();
  const orbitRef = useRef();

  useFrame(({ clock }) => {
    if (!tiltRef.current || !orbitRef.current) return;
    const t = clock.getElapsedTime();
    // Tilt the whole orbit ring
    tiltRef.current.rotation.x = Math.sin(t * 0.2) * 0.3 + 0.2;
    tiltRef.current.rotation.z = Math.cos(t * 0.2) * 0.1;

    // Fly the plane along the orbit
    orbitRef.current.rotation.y = -t * 0.4;
  });

  const trailDots = React.useMemo(() => {
    const pts = [];
    const numDots = 35;
    for (let i = 1; i <= numDots; i++) {
      // Trail length (about a third of the way around the earth)
      const angle = -(i / numDots) * (Math.PI / 1.2);
      // Fade out opacity towards the end of the tail
      const opacity = Math.max(0, 1 - (i / numDots));
      pts.push({
        pos: [Math.cos(angle) * 1.06, 0, Math.sin(angle) * 1.06],
        opacity: opacity * 0.8
      });
    }
    return pts;
  }, []);

  return (
    <group ref={tiltRef}>
      {/* Plane orbiting */}
      <group ref={orbitRef}>
        {/* Dotted Trail following behind the plane */}
        {trailDots.map((dot, i) => (
          <mesh key={i} position={dot.pos}>
            <sphereGeometry args={[0.0035, 4, 4]} />
            <meshBasicMaterial color="#efe9e9ff" transparent opacity={dot.opacity} />
          </mesh>
        ))}

        <group position={[1.06, 0, 0]}>
          <group rotation={[Math.PI / 2, 0, 0]}>
            {/* Fuselage */}
            <mesh>
              <cylinderGeometry args={[0.01, 0.01, 0.12, 16]} />
              <meshStandardMaterial color="#ffffff" roughness={0.2} metalness={0.5} />
            </mesh>
            {/* Nose */}
            <mesh position={[0, 0.06, 0]}>
              <sphereGeometry args={[0.01, 16, 16]} />
              <meshStandardMaterial color="#ffffff" roughness={0.2} metalness={0.5} />
            </mesh>
            {/* Tail */}
            <mesh position={[0, -0.06, 0]}>
              <cylinderGeometry args={[0.01, 0.003, 0.04, 16]} />
              <meshStandardMaterial color="#ffffff" roughness={0.2} metalness={0.5} />
            </mesh>

            {/* Main Wings */}
            <mesh position={[0, -0.01, 0]}>
              <boxGeometry args={[0.2, 0.025, 0.004]} />
              <meshStandardMaterial color="#d946ef" roughness={0.2} />
            </mesh>

            {/* Tail Wings */}
            <mesh position={[0, -0.07, 0]}>
              <boxGeometry args={[0.07, 0.015, 0.003]} />
              <meshStandardMaterial color="#d946ef" roughness={0.2} />
            </mesh>

            {/* Vertical Fin */}
            <mesh position={[0, -0.07, -0.012]} rotation={[0, Math.PI / 2, 0]}>
              <boxGeometry args={[0.03, 0.015, 0.003]} />
              <meshStandardMaterial color="#00f0ff" roughness={0.2} />
            </mesh>

            {/* Engines */}
            <mesh position={[0.04, -0.01, 0.006]}>
              <cylinderGeometry args={[0.005, 0.005, 0.02, 12]} />
              <meshStandardMaterial color="#8b5cf6" roughness={0.4} />
            </mesh>
            <mesh position={[-0.04, -0.01, 0.006]}>
              <cylinderGeometry args={[0.005, 0.005, 0.02, 12]} />
              <meshStandardMaterial color="#8b5cf6" roughness={0.4} />
            </mesh>
          </group>
        </group>
      </group>
    </group>
  );
};

const Earth = () => {
  const meshRef = useRef(null);
  const mouseRef = useRef({ x: 0, y: 0 });
  const [hovered, setHovered] = useState(false);

  useEffect(() => {
    if (hovered) {
      document.body.style.cursor = `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='28' height='28' viewBox='0 0 24 24' fill='%230ea5e9' stroke='white' stroke-width='1.5'><path d='M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z'/></svg>") 14 14, auto`;
    } else {
      document.body.style.cursor = 'auto';
    }
  }, [hovered]);

  useEffect(() => {
    const onMouseMove = (e) => {
      // Normalize mouse coordinates from -1 to 1
      mouseRef.current.x = (e.clientX / window.innerWidth) * 2 - 1;
      mouseRef.current.y = -(e.clientY / window.innerHeight) * 2 + 1;
    };

    window.addEventListener('mousemove', onMouseMove, { passive: true });

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
    };
  }, []);

  const maps = useTexture([EARTH_COLOR, EARTH_NORMAL]);
  const [colorMap, normalMap] = maps;
  colorMap.colorSpace = SRGBColorSpace;

  useFrame(({ clock }) => {
    if (!meshRef.current) return;
    const t = clock.getElapsedTime();

    // Apply mouse tracking globally
    const mouseInfluenceX = mouseRef.current.x * 0.6;
    const mouseInfluenceY = mouseRef.current.y * 0.4;

    const targetY = t * 0.035 + mouseInfluenceX;
    const targetX = 0.12 - mouseInfluenceY;

    // Smooth lerp for a premium interactive feel
    meshRef.current.rotation.y += (targetY - meshRef.current.rotation.y) * 0.05;
    meshRef.current.rotation.x += (targetX - meshRef.current.rotation.x) * 0.05;
  });

  return (
    <mesh
      ref={meshRef}
      position={[0, -0.2, 0]}
      scale={5.5}
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
    >
      <sphereGeometry args={[1, 64, 64]} />
      <meshStandardMaterial
        map={colorMap}
        normalMap={normalMap}
        normalScale={[0.5, 0.5]}
        roughness={0.25}
        metalness={0.2}
        emissive="#2e1065"
        emissiveIntensity={0.7}
      />
      <Airplane />
    </mesh>
  );
};

const Background3D = () => {
  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: -1,
        backgroundColor: '#040209', // Fallback for cosmic space black
      }}
    >
      <Canvas camera={{ position: [0, 0, 13.5], fov: 48 }}>
        {/* Twinkling Stars in Deep Space */}
        <Stars radius={100} depth={50} count={4000} factor={6} saturation={0.5} fade speed={2} />

        {/* Glowing Space-Dust Nebula Clouds */}
        <Cloud position={[-10, 5, -20]} speed={0.4} opacity={0.3} scale={3} color="#a78bfa" />
        <Cloud position={[10, -5, -25]} speed={0.3} opacity={0.2} scale={3.5} color="#d946ef" />
        <Cloud position={[0, 8, -22]} speed={0.3} opacity={0.25} scale={2.5} color="#6366f1" />

        <hemisphereLight color="#c084fc" groundColor="#040209" intensity={2.2} />
        <ambientLight intensity={1.8} />
        <directionalLight position={[8, 6, 8]} intensity={4.0} color="#ffffff" />
        <directionalLight position={[-6, -2, -6]} intensity={3.5} color="#d946ef" />
        <Suspense fallback={null}>
          <Earth />
        </Suspense>
      </Canvas>
    </div>
  );
};

export default Background3D;
