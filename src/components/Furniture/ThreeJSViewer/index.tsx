import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

interface Section {
  id: number;
  name: string;
  height: number;
  diameter: number;
}

interface ThreeJSViewerProps {
  sections: Section[];
}

const ThreeJSViewer: React.FC<ThreeJSViewerProps> = ({ sections }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf0f0f0);
    
    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 1000);
    camera.position.set(200, 200, 200);

    const renderer = new THREE.WebGLRenderer({ canvas: canvasRef.current, antialias: true });
    renderer.setSize(400, 400);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.25;
    controls.enableZoom = true;

    const ambientLight = new THREE.AmbientLight(0x404040, 1);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
    directionalLight.position.set(1, 1, 1).normalize();
    scene.add(directionalLight);

    const updateBottle = () => {
      const existingBottle = scene.getObjectByName('bottle');
      if (existingBottle) {
        scene.remove(existingBottle);
      }

      const points: THREE.Vector2[] = [];
      let currentHeight = 0;

      // Add bottom point
      points.push(new THREE.Vector2(0, 0));

      sections.forEach((section, index) => {
        const radius = section.diameter / 2;
        const nextRadius = index < sections.length - 1 
          ? sections[index + 1].diameter / 2 
          : radius * 0.8;

        points.push(new THREE.Vector2(radius, currentHeight));
        currentHeight += section.height;
        points.push(new THREE.Vector2(nextRadius, currentHeight));
      });

      // Add top point
      points.push(new THREE.Vector2(0, currentHeight));

      const geometry = new THREE.LatheGeometry(points, 100);
      const material = new THREE.MeshPhongMaterial({
        color: 0x44aa88,
        shininess: 100,
        specular: 0x111111
      });
      
      const bottleMesh = new THREE.Mesh(geometry, material);
      bottleMesh.name = 'bottle';
      scene.add(bottleMesh);

      // Center and fit camera
      const boundingBox = new THREE.Box3().setFromObject(bottleMesh);
      const center = boundingBox.getCenter(new THREE.Vector3());
      const size = boundingBox.getSize(new THREE.Vector3());

      const maxDim = Math.max(size.x, size.y, size.z);
      const fov = camera.fov * (Math.PI / 180);
      let cameraZ = Math.abs(maxDim / Math.tan(fov / 2));

      cameraZ *= 1.5;

      camera.position.set(cameraZ, cameraZ, cameraZ);
      controls.target.set(center.x, center.y, center.z);
      camera.updateProjectionMatrix();
    };

    const animate = () => {
      requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };

    updateBottle();
    animate();

    const handleResize = () => {
      const width = 400;
      const height = 400;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
    };
  }, [sections]);

  return <canvas ref={canvasRef} className="bottle-generator__canvas" />;
};

export default ThreeJSViewer;