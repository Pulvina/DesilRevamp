import React, { useRef, useEffect } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';

const SCALE_FACTOR = 0.01;

interface ApartmentDetails {
  unit: string;
  shape: string;
  width: number;
  length: number;
  height: number;
  floors: number;
  wallThickness: number;
  foundationDepth: number;
  exteriorFinish: string;
  insulationType: string;
  insulationThickness: number;
}

interface Annotations {
  [key: string]: number[][][];
}

interface ApartmentModelProps {
  apartmentDetails: ApartmentDetails;
  annotations: Annotations;
}

const ApartmentModel: React.FC<ApartmentModelProps> = ({ apartmentDetails, annotations }) => {
  const groupRef = useRef<THREE.Group>(null);
  const { scene } = useThree();

  const materials = {
    walls: new THREE.MeshStandardMaterial({ color: 'lightgray', side: THREE.DoubleSide }),
  };

  useEffect(() => {
    if (!groupRef.current) return;

    while (groupRef.current.children.length) {
      groupRef.current.remove(groupRef.current.children[0]);
    }

    if (annotations.walls) {
      const allPoints = annotations.walls.flat();
      
      const minX = Math.min(...allPoints.map(p => p[0]));
      const maxX = Math.max(...allPoints.map(p => p[0]));
      const minY = Math.min(...allPoints.map(p => p[1]));
      const maxY = Math.max(...allPoints.map(p => p[1]));

      const outerPoints = [
        [minX, minY],
        [maxX, minY],
        [maxX, maxY],
        [minX, maxY],
      ];

      const wallShape = new THREE.Shape();
      
      outerPoints.forEach((point, index) => {
        const [x, y] = point;
        if (index === 0) {
          wallShape.moveTo(x * SCALE_FACTOR, y * SCALE_FACTOR);
        } else {
          wallShape.lineTo(x * SCALE_FACTOR, y * SCALE_FACTOR);
        }
      });
      wallShape.closePath();

      annotations.walls.forEach(wallSegment => {
        if (wallSegment.length > 2) {
          const holePath = new THREE.Path();
          wallSegment.forEach((point, index) => {
            const [x, y] = point;
            if (index === 0) {
              holePath.moveTo(x * SCALE_FACTOR, y * SCALE_FACTOR);
            } else {
              holePath.lineTo(x * SCALE_FACTOR, y * SCALE_FACTOR);
            }
          });
          holePath.closePath();
          wallShape.holes.push(holePath);
        }
      });

      const extrudeSettings = {
        steps: 1,
        depth: apartmentDetails.height * SCALE_FACTOR,
        bevelEnabled: false,
      };

      const geometry = new THREE.ExtrudeGeometry(wallShape, extrudeSettings);
      const wallMesh = new THREE.Mesh(geometry, materials.walls);
      
      wallMesh.rotation.x = -Math.PI / 2;
      groupRef.current.add(wallMesh);
    }

    scene.updateMatrixWorld(true);

  }, [apartmentDetails, annotations, scene]);

  return <group ref={groupRef} />;
};

const ApartmentViewer: React.FC<ApartmentModelProps> = ({ apartmentDetails, annotations }) => {
  const getModelSize = () => {
    if (annotations.walls) {
      const allPoints = annotations.walls.flat();
      const minX = Math.min(...allPoints.map(p => p[0]));
      const maxX = Math.max(...allPoints.map(p => p[0]));
      const minY = Math.min(...allPoints.map(p => p[1]));
      const maxY = Math.max(...allPoints.map(p => p[1]));
      
      return {
        width: (maxX - minX) * SCALE_FACTOR,
        length: (maxY - minY) * SCALE_FACTOR,
        height: apartmentDetails.height * SCALE_FACTOR,
        centerX: ((minX + maxX) / 2) * SCALE_FACTOR,
        centerY: ((minY + maxY) / 2) * SCALE_FACTOR
      };
    }
    return { width: 0, length: 0, height: 0, centerX: 0, centerY: 0 };
  };

  const modelSize = getModelSize();
  const maxDimension = Math.max(modelSize.width, modelSize.length, modelSize.height);
  const cameraPosition: [number, number, number] = [
    modelSize.centerX,
    maxDimension * 2,
    modelSize.centerY + modelSize.length
  ];

  return (
    <Canvas 
      shadows
      camera={{ 
        position: cameraPosition, 
        fov: 60 
      }} 
      style={{ width: '100%', height: "50vh" }}
    >
      <ambientLight intensity={0.5} />
      <directionalLight position={[5, 5, 5]} intensity={0.5} castShadow />
      <ApartmentModel apartmentDetails={apartmentDetails} annotations={annotations} />
      <OrbitControls target={new THREE.Vector3(modelSize.centerX, 0, modelSize.centerY)} />
    </Canvas>
  );
};

export default ApartmentViewer;