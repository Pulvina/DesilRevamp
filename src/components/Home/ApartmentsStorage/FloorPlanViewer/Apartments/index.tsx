import React, { useState, useMemo, useEffect } from 'react';
import { Annotations } from 'redux-storage/reducers/apartments';
import ApartmentViewer from './ApartmentViewer';

import './styles.scss'

interface ApartmentProps {
  annotations: Annotations;
}

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

const Apartments: React.FC<ApartmentProps> = ({ annotations }) => {
  const [apartmentDetails, setApartmentDetails] = useState<ApartmentDetails>({
    unit: 'in',
    shape: 'rectangle',
    width: 200,
    length: 160,
    height: 100,
    floors: 1,
    wallThickness: 8,
    foundationDepth: 40,
    exteriorFinish: 'paint',
    insulationType: 'fiberglass',
    insulationThickness: 4,
  });

  const [openScadCode, setOpenScadCode] = useState<string>('');
  const [blenderPythonCode, setBlenderPythonCode] = useState<string>('');
  const [copiedOpenScad, setCopiedOpenScad] = useState<boolean>(false);
  const [copiedBlenderPython, setCopiedBlenderPython] = useState<boolean>(false);

  const updateApartmentDetail = (key: keyof ApartmentDetails, value: string | number) => {
    setApartmentDetails(prev => ({ ...prev, [key]: value }));
  };

  const convertToPx = (value: number, unit: string): number => {
    switch (unit) {
      case 'cm':
        return value;
      case 'm':
        return value * 100;
      case 'in':
        return value * 2.54;
      case 'ft':
        return value * 30.48;
      default:
        return value;
    }
  };

  const convertObject = <T extends Record<string, any>>(obj: T, unit: string): T => {
    return Object.fromEntries(
      Object.entries(obj).map(([key, value]) => 
        typeof value === 'number' ? [key, convertToPx(value, unit)] : [key, value]
      )
    ) as T;
  };

  const convertedApartmentDetails = useMemo(() => 
    convertObject(apartmentDetails, apartmentDetails.unit),
    [apartmentDetails]
  );

  const convertedAnnotations = useMemo(() => {
    return Object.fromEntries(
      Object.entries(annotations).map(([key, value]) => [
        key,
        value.map(annotation => 
          annotation.map(point => 
            point.map(coord => convertToPx(coord, apartmentDetails.unit))
          )
        )
      ])
    );
  }, [annotations, apartmentDetails.unit]);

  const generateOpenScadCode = () => {
    let code = `// Advanced Apartment Model\n`;
    code += `// Units: ${apartmentDetails.unit}\n\n`;
  
    const wallHeight = convertedApartmentDetails.height;
    const wallThickness = convertedApartmentDetails.wallThickness;
  
    code += `module apartment() {\n`;
    
    // Solid Floor
    code += `  // Floor\n`;
    code += `  color("LightGray")\n`;
    code += `    linear_extrude(height = 1)\n`;
    code += `      hull() {\n`;
    code += Object.values(convertedAnnotations).flat().flatMap(points => 
      points.map(point => `        translate([${point[0]}, ${point[1]}]) circle(r=0.1);\n`)
    ).join('');
    code += `      }\n\n`;
  
    // Walls
    code += `  // Walls\n`;
    Object.entries(convertedAnnotations).forEach(([type, annotations], typeIndex) => {
      annotations.forEach((points, index) => {
        if (points.length > 2) {
          code += `  // ${type} ${index + 1}\n`;
          code += `  color("${['#FFFFFF', '#F0F0F0', '#E0E0E0'][typeIndex % 3]}") {\n`;
          
          for (let i = 0; i < points.length; i++) {
            const start = points[i];
            const end = points[(i + 1) % points.length];
            const length = Math.sqrt(Math.pow(end[0] - start[0], 2) + Math.pow(end[1] - start[1], 2));
            const angle = Math.atan2(end[1] - start[1], end[0] - start[0]) * 180 / Math.PI;
            
            code += `    translate([${(start[0] + end[0]) / 2}, ${(start[1] + end[1]) / 2}, ${wallHeight / 2}])\n`;
            code += `      rotate([0, 0, ${angle}])\n`;
            code += `        cube([${length}, ${wallThickness}, ${wallHeight}], center = true);\n`;
          }
          
          code += `  }\n\n`;
        }
      });
    });
  
    code += `}\n\n`;
    code += `apartment();\n`;
  
    setOpenScadCode(code);
  };
  
  const generateBlenderPythonCode = () => {
    let code = `import bpy
import bmesh
import math
  
def clear_scene():
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete()

def create_material(name, color):
    material = bpy.data.materials.new(name=name)
    material.use_nodes = True
    material.node_tree.nodes["Principled BSDF"].inputs[0].default_value = (*color, 1)
    return material

def create_floor(points):
    bm = bmesh.new()
    for point in points:
        bm.verts.new((point[0], point[1], 0))
    bm.faces.new(bm.verts)
    mesh = bpy.data.meshes.new("Floor")
    bm.to_mesh(mesh)
    bm.free()
    floor = bpy.data.objects.new("Floor", mesh)
    bpy.context.collection.objects.link(floor)
    return floor

def create_walls(points, wall_height, wall_thickness):
    walls = []
    for i in range(len(points)):
        start = points[i]
        end = points[(i + 1) % len(points)]
        
        wall_length = math.sqrt((end[0] - start[0])**2 + (end[1] - start[1])**2)
        wall_angle = math.atan2(end[1] - start[1], end[0] - start[0])
        
        bpy.ops.mesh.primitive_cube_add(size=1)
        wall = bpy.context.active_object
        wall.name = f"Wall_{i}"
        wall.scale = (wall_length, wall_thickness, wall_height)
        wall.rotation_euler[2] = wall_angle
        wall.location = ((start[0] + end[0]) / 2, (start[1] + end[1]) / 2, wall_height / 2)
        
        walls.append(wall)
    return walls

def generate_apartment(apartment_details, annotations):
    clear_scene()
    
    wall_material = create_material("Wall", (0.8, 0.8, 0.8))
    floor_material = create_material("Floor", (0.5, 0.5, 0.5))
    
    all_points = [point for annotation_group in annotations.values() for annotation in annotation_group for point in annotation]
    floor = create_floor(all_points)
    floor.data.materials.append(floor_material)
    
    for annotation_type, annotation_group in annotations.items():
        for annotation in annotation_group:
            walls = create_walls(annotation, apartment_details['height'], apartment_details['wallThickness'])
            for wall in walls:
                wall.data.materials.append(wall_material)
    
    bpy.ops.object.camera_add(location=(0, -5, 2.5), rotation=(math.radians(80), 0, 0))
    bpy.context.scene.camera = bpy.context.object
    
    bpy.ops.object.light_add(type='SUN', location=(2.5, 2.5, 5))
    sun = bpy.context.object
    sun.data.energy = 2

`;
  
    const scale = 0.01;
  
    code += `# Apartment details\n`;
    code += `apartment_details = {\n`;
    code += `    'unit': '${apartmentDetails.unit}',\n`;
    code += `    'shape': '${apartmentDetails.shape}',\n`;
    code += `    'width': ${apartmentDetails.width * scale},\n`;
    code += `    'length': ${apartmentDetails.length * scale},\n`;
    code += `    'height': ${apartmentDetails.height * scale},\n`;
    code += `    'wallThickness': ${apartmentDetails.wallThickness * scale}\n`;
    code += `}\n\n`;
  
    code += `# Annotations\n`;
    code += `annotations = {\n`;
    Object.entries(convertedAnnotations).forEach(([key, value], index) => {
      code += `    '${key}': [\n`;
      value.forEach((annotation, annotationIndex) => {
        code += `        ${JSON.stringify(annotation.map(point => [point[0] * scale, point[1] * scale]))}${annotationIndex < value.length - 1 ? ',' : ''}\n`;
      });
      code += `    ]${index < Object.entries(convertedAnnotations).length - 1 ? ',' : ''}\n`;
    });
    code += `}\n\n`;
  
    code += `generate_apartment(apartment_details, annotations)\n`;
  
    setBlenderPythonCode(code);
  };

  const copyToClipboard = (text: string, type: 'OpenSCAD' | 'Blender Python') => {
    navigator.clipboard.writeText(text).then(() => {
      if (type === 'OpenSCAD') {
        setCopiedOpenScad(true);
      } else if (type === 'Blender Python') {
        setCopiedBlenderPython(true);
      }
      setTimeout(() => {
        setCopiedOpenScad(false);
        setCopiedBlenderPython(false);
      }, 3000);
    }, (err) => {
      console.error('Could not copy text: ', err);
    });
  };

  useEffect(() => {
    setCopiedOpenScad(false);
  }, [openScadCode]);

  useEffect(() => {
    setCopiedBlenderPython(false);
  }, [blenderPythonCode]);

  return (
    <div className="card">
      <header className="card-header">
        <h1>Advanced Apartment Designer</h1>
      </header>
      <div className="card-content">
        <div className="code-generation">
          <div className="button-group">
            <button className="primary-button" onClick={generateOpenScadCode}>
              Generate OpenSCAD Code
            </button>
            <button 
              className={`secondary-button ${copiedOpenScad ? 'success' : ''}`}
              onClick={() => copyToClipboard(openScadCode, 'OpenSCAD')}
              disabled={!openScadCode}
            >
              {copiedOpenScad ? "Copied!" : "Copy"}
            </button>
          </div>
          {openScadCode && (
            <textarea
              value={openScadCode}
              readOnly
              className="code-textarea"
              rows={20}
            />
          )}
          <div className="button-group">
            <button className="primary-button" onClick={generateBlenderPythonCode}>
              Generate Blender Python Code
            </button>
            <button 
              className={`secondary-button ${copiedBlenderPython ? 'success' : ''}`}
              onClick={() => copyToClipboard(blenderPythonCode, 'Blender Python')}
              disabled={!blenderPythonCode}
            >
              {copiedBlenderPython ? "Copied!" : "Copy"}
            </button>
          </div>
          {blenderPythonCode && (
            <textarea
              value={blenderPythonCode}
              readOnly
              className="code-textarea"
              rows={20}
            />
          )}
        </div>

        <ApartmentViewer
          apartmentDetails={convertedApartmentDetails}
          //@ts-ignore
          annotations={convertedAnnotations}
        />
      </div>
    </div>
  );
};

export default Apartments;