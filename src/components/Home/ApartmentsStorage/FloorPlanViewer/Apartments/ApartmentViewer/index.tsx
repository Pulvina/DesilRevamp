import React, { useRef, useEffect, useMemo } from 'react';
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

const ApartmentModel: React.FC<ApartmentModelProps> = React.memo(({ apartmentDetails, annotations }) => {
  const groupRef = useRef<THREE.Group>(null);
  const { scene } = useThree();

  const materials = useMemo(() => ({
    walls: new THREE.MeshStandardMaterial({ color: 'lightgray', side: THREE.DoubleSide }),
  }), []);

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


      // if (annotations.doors) {
      //   annotations.doors.forEach(doorPoints => {
      //     if (doorPoints.length === 2) {
      //       const smileyEye1Path = new THREE.Path();
      //       smileyEye1Path.moveTo( 35, 20 );
      //       smileyEye1Path.absellipse( 25, 20, 10, 10, 0, Math.PI * 2, true );
      //       wallShape.holes.push( smileyEye1Path );

      //       // const [[x1, y1], [x2, y2]] = doorPoints;
      //       // const doorPath = new THREE.Path();
            
      //       // const centerX = (x1 + x2) / 2 * SCALE_FACTOR;
      //       // const centerY = (y1 + y2) / 2 * SCALE_FACTOR;
      //       // const doorWidth = Math.abs(x2 - x1) * SCALE_FACTOR;
      //       // const doorHeight = 2.0 * SCALE_FACTOR;
            
      //       // doorPath.absellipse(centerX, centerY, doorWidth / 2, doorHeight / 2, 0, Math.PI * 2, true);
      //       // wallShape.holes.push(doorPath);
      //     }
      //   });
      // }

      // const makeAHole = () => {

      //   let width = building.userData.size.width * 0.5;
      //   let height = building.userData.size.height * 0.5;
      //   let depth = building.userData.size.depth * 0.5;
      //   let shape = new THREE.Shape();
      //   shape.moveTo(-width, height);
      //   shape.lineTo(-width, -height);
      //   shape.lineTo(width, -height);
      //   shape.lineTo(width, height);
      //   shape.lineTo(-width, height);
      
      //   let pointAtWall = _window.position.clone();
      //   building.worldToLocal(pointAtWall);
      //   let wWidth = _window.geometry.parameters.width * 0.5;
      //   let wHeight = _window.geometry.parameters.height * 0.5;
      //   let hole = new THREE.Path();
      //   hole.moveTo(pointAtWall.x - wWidth, pointAtWall.y + wHeight);
      //   hole.lineTo(pointAtWall.x - wWidth, pointAtWall.y - wHeight);
      //   hole.lineTo(pointAtWall.x + wWidth, pointAtWall.y - wHeight);
      //   hole.lineTo(pointAtWall.x + wWidth, pointAtWall.y + wHeight);
      //   hole.lineTo(pointAtWall.x - wWidth, pointAtWall.y + wHeight);
      
      //   shape.holes.push(hole);
      //   let extrudeSettings = {
      //     amount: depth * 2,
      //     bevelEnabled: false
      //   };
      //   let extrudeGeometry = new THREE.ExtrudeBufferGeometry(shape, extrudeSettings);
      //   extrudeGeometry.translate(0, 0, -depth);
      //   building.geometry.dispose();
      //   building.geometry = extrudeGeometry;
      // }

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

  }, [apartmentDetails, annotations, materials, scene]);

  return <group ref={groupRef} />;
});

const ApartmentViewer: React.FC<ApartmentModelProps> = ({ apartmentDetails, annotations }) => {
  return (
    <Canvas 
      shadows
      camera={{ 
        position: [0, apartmentDetails.height * SCALE_FACTOR * 2, apartmentDetails.length * SCALE_FACTOR], 
        fov: 60 
      }} 
      style={{ width: '1000px', height: "750px", border: '1px solid black' }}
    >
      <ambientLight intensity={0.5} />
      <directionalLight position={[5, 5, 5]} intensity={0.5} castShadow />
      <ApartmentModel apartmentDetails={apartmentDetails} annotations={annotations} />
      <OrbitControls />
      <gridHelper args={[10, 10]} />
    </Canvas>
  );
};

export default ApartmentViewer;