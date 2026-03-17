import { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Line, Ring } from '@react-three/drei';
import * as THREE from 'three';

const RadarLine = () => {
  const lineRef = useRef();

  useFrame(() => {
    if (lineRef.current) {
      lineRef.current.rotation.z -= 0.05;
    }
  });

  const points = useMemo(() => [
    new THREE.Vector3(0, 0, 0),
    new THREE.Vector3(0, 2.5, 0)
  ], []);

  return (
    <group ref={lineRef}>
      <Line points={points} color="#00e0ff" lineWidth={3} transparent opacity={0.8} />
    </group>
  );
};

const RadarScanner = () => {
  return (
    <div className="w-full h-[250px] sm:h-[300px] flex justify-center items-center overflow-hidden mb-8">
      <div className="w-[250px] h-[250px] sm:w-[300px] sm:h-[300px] rounded-full shadow-[0_0_50px_rgba(0,224,255,0.2)] bg-[rgba(0,224,255,0.02)] border border-[rgba(0,224,255,0.2)]">
        <Canvas camera={{ position: [0, 0, 6] }}>
          <ambientLight intensity={0.5} />
          <group>
            {/* Grid circles */}
            <Ring args={[2.4, 2.45, 64]} material-color="#00e0ff" material-transparent material-opacity={0.4} />
            <Ring args={[1.6, 1.63, 64]} material-color="#00e0ff" material-transparent material-opacity={0.2} />
            <Ring args={[0.8, 0.82, 64]} material-color="#00e0ff" material-transparent material-opacity={0.1} />
            <RadarLine />
            {/* Base scan area */}
            <mesh>
              <circleGeometry args={[2.45, 64]} />
              <meshBasicMaterial color="#00e0ff" transparent opacity={0.05} />
            </mesh>
          </group>
        </Canvas>
      </div>
    </div>
  );
};

export default RadarScanner;
