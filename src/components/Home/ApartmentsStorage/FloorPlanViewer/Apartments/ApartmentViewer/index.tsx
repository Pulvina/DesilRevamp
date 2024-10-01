import React, { useRef, useEffect, useMemo } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';

const SCALE_FACTOR = 0.01;
const WALL_THICKNESS = 10 * SCALE_FACTOR;

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

interface Room {
  name: string;
  width: number;
  length: number;
  height: number;
  floorLevel: number;
  flooringType: string;
  flooringThickness: number;
  wallColor: string;
  hasCeilingMoulding: boolean;
  hasBaseboards: boolean;
  windowTrim: string;
  doorTrim: string;
  positionX: number;
  positionY: number;
  positionZ: number;
  points: [number, number][];
}

interface Window {
  width: number;
  height: number;
  sillHeight: number;
  type: string;
  glazingLayers: number;
  frameColor: string;
  hasScreen: boolean;
  hasCurtains: boolean;
  curtainColor: string;
  roomId: string;
  wallPosition: string;
  positionX: number;
  positionY: number;
  positionZ: number;
  rotation: number;
}

interface Door {
  width: number;
  height: number;
  thickness: number;
  type: string;
  material: string;
  color: string;
  hasGlass: boolean;
  glassType: string;
  handleType: string;
  handleFinish: string;
  roomId: string;
  wallPosition: string;
  swingDirection: string;
  positionX: number;
  positionY: number;
  positionZ: number;
}

interface ApartmentModelProps {
  apartmentDetails: ApartmentDetails;
  rooms: Room[];
  windows: Window[];
  doors: Door[];
}

const ApartmentModel: React.FC<ApartmentModelProps> = React.memo(({ apartmentDetails, rooms, windows, doors }) => {
  const groupRef = useRef<THREE.Group>(null);
  const { scene } = useThree();

  const geometries = useMemo(() => ({
    box: new THREE.BoxGeometry(1, 1, 1),
  }), []);

  const materials = useMemo(() => ({
    walls: new THREE.MeshStandardMaterial({ color: 'lightblue', side: THREE.DoubleSide }),
    room: new THREE.MeshStandardMaterial({ transparent: true, opacity: 0.5 }),
    window: new THREE.MeshStandardMaterial({ color: 'skyblue', transparent: true, opacity: 0.7 }),
    door: new THREE.MeshStandardMaterial(),
  }), []);

  useEffect(() => {
    if (!groupRef.current) return;

    while (groupRef.current.children.length) {
      groupRef.current.remove(groupRef.current.children[0]);
    }

    rooms.forEach((room) => {
      if (room.points && room.points.length > 2) {
        const wallMaterial = materials.walls.clone();
        wallMaterial.color.setStyle(room.wallColor);

        for (let i = 0; i < room.points.length; i++) {
          const startPoint = room.points[i];
          const endPoint = room.points[(i + 1) % room.points.length];

          const wallLength = Math.sqrt(
            Math.pow((endPoint[0] - startPoint[0]) * SCALE_FACTOR, 2) +
            Math.pow((endPoint[1] - startPoint[1]) * SCALE_FACTOR, 2)
          );

          const wallGeometry = new THREE.BoxGeometry(wallLength, room.height * SCALE_FACTOR, WALL_THICKNESS);
          const wall = new THREE.Mesh(wallGeometry, wallMaterial);

          const midX = (startPoint[0] + endPoint[0]) / 2 * SCALE_FACTOR;
          const midY = (startPoint[1] + endPoint[1]) / 2 * SCALE_FACTOR;
          wall.position.set(midX, room.height * SCALE_FACTOR / 2, midY);

          const angle = Math.atan2(endPoint[1] - startPoint[1], endPoint[0] - startPoint[0]);
          wall.rotation.y = -angle;

          groupRef.current?.add(wall);
        }
      }
    });

    windows.forEach((window) => {
      const windowMesh = new THREE.Mesh(geometries.box, materials.window);
      windowMesh.scale.set(
        window.width * SCALE_FACTOR,
        window.height * SCALE_FACTOR,
        WALL_THICKNESS
      );
      windowMesh.position.set(
        window.positionX * SCALE_FACTOR,
        (window.positionY + window.height / 2) * SCALE_FACTOR,
        window.positionZ * SCALE_FACTOR
      );
      groupRef.current?.add(windowMesh);
    });

    doors.forEach((door) => {
      const doorMesh = new THREE.Mesh(geometries.box, materials.door.clone());
      doorMesh.scale.set(
        door.width * SCALE_FACTOR,
        door.height * SCALE_FACTOR,
        door.thickness * SCALE_FACTOR
      );
      doorMesh.position.set(
        door.positionX * SCALE_FACTOR,
        (door.positionY + door.height / 2) * SCALE_FACTOR,
        door.positionZ * SCALE_FACTOR
      );
      (doorMesh.material as THREE.MeshStandardMaterial).color.setStyle(door.color);
      groupRef.current?.add(doorMesh);
    });

    scene.updateMatrixWorld(true);

  }, [apartmentDetails, rooms, windows, doors, geometries, materials, scene]);

  return <group ref={groupRef} />;
});

const ApartmentViewer: React.FC<ApartmentModelProps> = ({ apartmentDetails, rooms, windows, doors }) => {
  return (
    <Canvas 
      shadows
      camera={{ 
        position: [0, apartmentDetails.height * SCALE_FACTOR * 2, apartmentDetails.length * SCALE_FACTOR], 
        fov: 60 
      }} 
      style={{ width: '1000px', height: "750px", border: '1px solid black' }}
    >
      <ambientLight intensity={0.2} />
      
      <directionalLight
        position={[0, apartmentDetails.height * SCALE_FACTOR * 2, 0]}
        intensity={0.5}
        castShadow
      />
      
      <hemisphereLight 
        groundColor={0x444444}
        intensity={0.3}
      />
      
      <ApartmentModel
        apartmentDetails={apartmentDetails}
        rooms={rooms}
        windows={windows}
        doors={doors}
      />
      <OrbitControls />
    </Canvas>
  );
};

export default ApartmentViewer;