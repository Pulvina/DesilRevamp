import bpy
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

# Apartment details
apartment_details = {
    'unit': 'in',
    'shape': 'rectangle',
    'width': 2,
    'length': 1.6,
    'height': 1,
    'wallThickness': 0.08
}

# Rooms
rooms = [
    {
        'name': 'Room 1',
        'width': 2.2524569702148436,
        'length': 0.7572451782226562,
        'height': 1,
        'wallThickness': 0.08,
        'points': [[3.274460754394531,2.8687942504882815],[5.526917724609375,2.8687942504882815],[5.526917724609375,3.6260394287109374],[3.274460754394531,3.6260394287109374]]
    },
    {
        'name': 'Room 2',
        'width': 1.4644628906250001,
        'length': 3.347723503112793,
        'height': 1,
        'wallThickness': 0.08,
        'points': [[2.87,3.261875],[3.767675476074219,2.3602049636840823],[3.767675476074219,5.707928466796875],[2.3032125854492187,5.707928466796875]]
    },
    {
        'name': 'Room 3',
        'width': 1.425618896484375,
        'length': 2.1539485168457033,
        'height': 1,
        'wallThickness': 0.08,
        'points': [[5.569212646484375,0.2876054382324219],[6.99483154296875,0.2876054382324219],[6.99483154296875,2.441553955078125],[5.569212646484375,2.441553955078125]]
    },
    {
        'name': 'Room 4',
        'width': 1.4184588623046874,
        'length': 1.1221524047851563,
        'height': 1,
        'wallThickness': 0.08,
        'points': [[5.569974365234375,2.5031747436523437],[6.988433227539063,2.5031747436523437],[6.988433227539063,3.6253271484375],[5.569974365234375,3.6253271484375]]
    },
    {
        'name': 'Room 5',
        'width': 0.3211639404296875,
        'length': 0.7427365112304688,
        'height': 1,
        'wallThickness': 0.08,
        'points': [[2.9084124755859375,2.882598571777344],[3.2295764160156253,2.882598571777344],[3.2295764160156253,3.6253350830078124],[2.9084124755859375,3.6253350830078124]]
    },
    {
        'name': 'Room 6',
        'width': 2.05,
        'length': 2.05984375,
        'height': 1,
        'wallThickness': 0.08,
        'points': [[3.65,3.435],[4.65,3.435],[5.7,5.49484375],[4.65,4.4350000000000005],[3.65,4.4350000000000005]]
    }
]

# Windows
windows = [
]

# Doors
doors = [
]

generate_apartment(apartment_details, rooms, windows, doors)
