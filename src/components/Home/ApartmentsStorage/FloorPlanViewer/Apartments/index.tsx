import React, { useState, useMemo, useEffect } from 'react';
import ApartmentViewer from './ApartmentViewer';

import './styles.scss'

interface ApartmentProps {
  annotations: number[][][];
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
  points?: number[][];
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

  const [rooms, setRooms] = useState<Room[]>([]);
  const [windows, setWindows] = useState<Window[]>([]);
  const [doors, setDoors] = useState<Door[]>([]);
  const [openScadCode, setOpenScadCode] = useState<string>('');
  const [blenderPythonCode, setBlenderPythonCode] = useState<string>('');
  const [copiedOpenScad, setCopiedOpenScad] = useState<boolean>(false);
  const [copiedBlenderPython, setCopiedBlenderPython] = useState<boolean>(false);

  useEffect(() => {
    if (annotations.length > 0) {
      const newRooms = annotations.map((roomAnnotation, index) => {
        const xCoords = roomAnnotation.map(point => point[0]);
        const zCoords = roomAnnotation.map(point => point[1]);
      
        
        const minX = Math.min(...xCoords);
        const maxX = Math.max(...xCoords);
        const minZ = Math.min(...zCoords);
        const maxZ = Math.max(...zCoords);
        
        const width = maxX - minX;
        const length = maxZ - minZ;
        
        return {
          name: `Room ${index + 1}`,
          width,
          length,
          height: apartmentDetails.height,
          floorLevel: 1,
          flooringType: 'wood',
          flooringThickness: 0.75,
          wallColor: '#FFFFFF',
          hasCeilingMoulding: false,
          hasBaseboards: true,
          windowTrim: 'standard',
          doorTrim: 'standard',
          positionX: minX,
          positionY: 0,
          positionZ: minZ,
          points: roomAnnotation
        };
      });
      
      setRooms(newRooms);
    }
  }, [annotations, apartmentDetails.height]);

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

  const convertedRooms = useMemo(() => 
    rooms.map(room => convertObject(room, apartmentDetails.unit)),
    [rooms, apartmentDetails.unit]
  );

  const convertedWindows = useMemo(() => 
    windows.map(window => convertObject(window, apartmentDetails.unit)),
    [windows, apartmentDetails.unit]
  );

  const convertedDoors = useMemo(() => 
    doors.map(door => convertObject(door, apartmentDetails.unit)),
    [doors, apartmentDetails.unit]
  );

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
    code += convertedRooms.flatMap(room => room.points || []).map(point => `        translate([${point[0]}, ${point[1]}]) circle(r=0.1);\n`).join('');
    code += `      }\n\n`;
  
    // Walls
    code += `  // Walls\n`;
    convertedRooms.forEach((room, index) => {
      if (room.points && room.points.length > 2) {
        code += `  // Room ${index + 1}: ${room.name}\n`;
        code += `  color("${room.wallColor}") {\n`;
        
        for (let i = 0; i < room.points.length; i++) {
          const start = room.points[i];
          const end = room.points[(i + 1) % room.points.length];
          const length = Math.sqrt(Math.pow(end[0] - start[0], 2) + Math.pow(end[1] - start[1], 2));
          const angle = Math.atan2(end[1] - start[1], end[0] - start[0]) * 180 / Math.PI;
          
          code += `    translate([${(start[0] + end[0]) / 2}, ${(start[1] + end[1]) / 2}, ${wallHeight / 2}])\n`;
          code += `      rotate([0, 0, ${angle}])\n`;
          code += `        cube([${length}, ${wallThickness}, ${wallHeight}], center = true);\n`;
        }
        
        code += `  }\n\n`;
      }
    });
  
    // Windows
    code += `  // Windows\n`;
    convertedWindows.forEach((window, index) => {
      code += `  color("SkyBlue", 0.7)\n`;
      code += `    translate([${window.positionX}, ${window.positionZ}, ${window.positionY + window.height / 2}])\n`;
      code += `      cube([${window.width}, ${wallThickness * 2}, ${window.height}], center = true);\n`;
    });
  
    // Doors
    code += `  // Doors\n`;
    convertedDoors.forEach((door, index) => {
      code += `  color("${door.color}")\n`;
      code += `    translate([${door.positionX}, ${door.positionZ}, ${door.positionY + door.height / 2}])\n`;
      code += `      cube([${door.width}, ${door.thickness}, ${door.height}], center = true);\n`;
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

def create_floor(room):
    bm = bmesh.new()
    for point in room['points']:
        bm.verts.new((point[0], point[1], 0))
    bm.faces.new(bm.verts)
    mesh = bpy.data.meshes.new(f"{room['name']}_Floor")
    bm.to_mesh(mesh)
    bm.free()
    floor = bpy.data.objects.new(f"{room['name']}_Floor", mesh)
    bpy.context.collection.objects.link(floor)
    return floor

def create_walls(room):
    wall_height = room['height']
    walls = []
    for i in range(len(room['points'])):
        start = room['points'][i]
        end = room['points'][(i + 1) % len(room['points'])]
        
        wall_length = math.sqrt((end[0] - start[0])**2 + (end[1] - start[1])**2)
        wall_angle = math.atan2(end[1] - start[1], end[0] - start[0])
        
        bpy.ops.mesh.primitive_cube_add(size=1)
        wall = bpy.context.active_object
        wall.name = f"{room['name']}_Wall_{i}"
        wall.scale = (wall_length, room['wallThickness'], wall_height)
        wall.rotation_euler[2] = wall_angle
        wall.location = ((start[0] + end[0]) / 2, (start[1] + end[1]) / 2, wall_height / 2)
        
        walls.append(wall)
    return walls

def create_window(window):
    bpy.ops.mesh.primitive_cube_add(size=1)
    window_obj = bpy.context.active_object
    window_obj.name = f"Window_{window['roomId']}"
    window_obj.scale = (window['width'], 0.1, window['height'])
    window_obj.location = (window['positionX'], window['positionZ'], window['positionY'] + window['height'] / 2)
    return window_obj

def create_door(door):
    bpy.ops.mesh.primitive_cube_add(size=1)
    door_obj = bpy.context.active_object
    door_obj.name = f"Door_{door['roomId']}"
    door_obj.scale = (door['width'], door['thickness'], door['height'])
    door_obj.location = (door['positionX'], door['positionZ'], door['positionY'] + door['height'] / 2)
    return door_obj

def generate_apartment(apartment_details, rooms, windows, doors):
    clear_scene()
    
    wall_material = create_material("Wall", (0.8, 0.8, 0.8))
    floor_material = create_material("Floor", (0.5, 0.5, 0.5))
    window_material = create_material("Window", (0.9, 0.9, 1))
    door_material = create_material("Door", (0.6, 0.4, 0.2))
    
    for room in rooms:
        floor = create_floor(room)
        floor.data.materials.append(floor_material)
        
        walls = create_walls(room)
        for wall in walls:
            wall.data.materials.append(wall_material)
    
    for window in windows:
        window_obj = create_window(window)
        window_obj.data.materials.append(window_material)
    
    for door in doors:
        door_obj = create_door(door)
        door_obj.data.materials.append(door_material)
    
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
  
    code += `# Rooms\n`;
    code += `rooms = [\n`;
    rooms.forEach((room, index) => {
      code += `    {\n`;
      code += `        'name': '${room.name}',\n`;
      code += `        'width': ${room.width * scale},\n`;
      code += `        'length': ${room.length * scale},\n`;
      code += `        'height': ${room.height * scale},\n`;
      code += `        'wallThickness': ${apartmentDetails.wallThickness * scale},\n`;
      code += `        'points': ${JSON.stringify(room.points?.map(point => [point[0] * scale, point[1] * scale]))}\n`;
      code += `    }${index < rooms.length - 1 ? ',' : ''}\n`;
    });
    code += `]\n\n`;
  
    code += `# Windows\n`;
    code += `windows = [\n`;
    windows.forEach((window, index) => {
      code += `    {\n`;
      code += `        'width': ${window.width * scale},\n`;
      code += `        'height': ${window.height * scale},\n`;
      code += `        'positionX': ${window.positionX * scale},\n`;
      code += `        'positionY': ${window.positionY * scale},\n`;
      code += `        'positionZ': ${window.positionZ * scale},\n`;
      code += `        'roomId': '${window.roomId}'\n`;
      code += `    }${index < windows.length - 1 ? ',' : ''}\n`;
    });
    code += `]\n\n`;
  
    code += `# Doors\n`;
    code += `doors = [\n`;
    doors.forEach((door, index) => {
      code += `    {\n`;
      code += `        'width': ${door.width * scale},\n`;
      code += `        'height': ${door.height * scale},\n`;
      code += `        'thickness': ${door.thickness * scale},\n`;
      code += `        'positionX': ${door.positionX * scale},\n`;
      code += `        'positionY': ${door.positionY * scale},\n`;
      code += `        'positionZ': ${door.positionZ * scale},\n`;
      code += `        'roomId': '${door.roomId}'\n`;
      code += `    }${index < doors.length - 1 ? ',' : ''}\n`;
    });
    code += `]\n\n`;
  
    code += `generate_apartment(apartment_details, rooms, windows, doors)\n`;
  
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
          rooms={convertedRooms}
          windows={convertedWindows}
          doors={convertedDoors}
        />
      </div>
    </div>
  );
};

export default Apartments;