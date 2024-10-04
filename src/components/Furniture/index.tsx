
'use client'
import React, { useState } from 'react';

const BottleShapeGenerator = () => {
  const [sections, setSections] = useState([
    { id: 1, name: 'Bottom', height: 40, diameter: 50 },
    { id: 2, name: 'Middle', height: 80, diameter: 40 },
    { id: 3, name: 'Top', height: 30, diameter: 20 },
  ]);

  const [generatedCode, setGeneratedCode] = useState('');
  const [codeType, setCodeType] = useState('OpenSCAD');
  const [unit, setUnit] = useState('mm');

  const styles = {
    container: {
      maxWidth: '600px',
      margin: '0 auto',
      padding: '20px',
      fontFamily: 'Arial, sans-serif',
    },
    title: {
      fontSize: '24px',
      fontWeight: 'bold',
      marginBottom: '20px',
    },
    sectionContainer: {
      border: '1px solid #ccc',
      borderRadius: '4px',
      padding: '15px',
      marginBottom: '15px',
    },
    sectionHeader: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '10px',
    },
    input: {
      width: '100%',
      padding: '5px',
      marginBottom: '10px',
      border: '1px solid #ccc',
      borderRadius: '4px',
    },
    button: {
      padding: '10px 15px',
      border: 'none',
      borderRadius: '4px',
      cursor: 'pointer',
      color: 'white',
      fontWeight: 'bold',
    },
    addButton: {
      backgroundColor: '#4CAF50',
    },
    deleteButton: {
      backgroundColor: '#f44336',
    },
    generateButton: {
      backgroundColor: '#2196F3',
    },
    toggleButton: {
      backgroundColor: '#FF9800',
    },
    buttonContainer: {
      display: 'flex',
      justifyContent: 'space-between',
      marginTop: '15px',
    },
    codeContainer: {
      marginTop: '20px',
      border: '1px solid #ccc',
      borderRadius: '4px',
      padding: '15px',
    },
    pre: {
      backgroundColor: '#f5f5f5',
      padding: '15px',
      borderRadius: '4px',
      overflowX: 'auto',
    },
  };

  //@ts-ignore
  const handleInputChange = (id, property, value) => {
    setSections(prev => prev.map(section => 
      section.id === id ? { ...section, [property]: property === 'name' ? value : parseFloat(value) } : section
    ));
  };

  const addSection = () => {
    const newId = Math.max(...sections.map(s => s.id)) + 1;
    setSections([...sections, { id: newId, name: `Section ${newId}`, height: 30, diameter: 30 }]);
  };

  //@ts-ignore
  const removeSection = (id) => {
    if (sections.length > 1) {
      setSections(sections.filter(section => section.id !== id));
    }
  };

  const toggleUnit = () => {
    const newUnit = unit === 'mm' ? 'cm' : 'mm';
    const scale = newUnit === 'cm' ? 0.1 : 10;
    setUnit(newUnit);
    setSections(sections.map(section => ({
      ...section,
      height: section.height * scale,
      diameter: section.diameter * scale
    })));
  };

  const generateOpenSCADCode = () => {
    let code = `
module bottle() {
  ${sections.map((section, index) => `
  // ${section.name}
  translate([0, 0, ${index === 0 ? '0' : sections.slice(0, index).reduce((sum, s) => sum + s.height, 0)}])
    cylinder(h=${section.height}, d1=${section.diameter}, d2=${
      index === sections.length - 1 ? section.diameter * 0.8 : sections[index + 1].diameter
    }, $fn=100);`).join('\n')}
}

bottle();
    `;
    setGeneratedCode(code);
    setCodeType('OpenSCAD');
  };

  const generateBlenderCode = () => {
    let code = `
import bpy
import math

def create_bottle():
    sections = [
${sections.map(section => `        {"name": "${section.name}", "height": ${section.height}, "diameter": ${section.diameter}},`).join('\n')}
    ]
    
    vertices = []
    faces = []
    current_height = 0
    
    for i, section in enumerate(sections):
        radius = section["diameter"] / 2
        next_radius = sections[i+1]["diameter"] / 2 if i < len(sections) - 1 else radius * 0.8
        
        for angle in range(0, 360, 10):
            x = radius * math.cos(math.radians(angle))
            y = radius * math.sin(math.radians(angle))
            vertices.append((x, y, current_height))
            
            x = next_radius * math.cos(math.radians(angle))
            y = next_radius * math.sin(math.radians(angle))
            vertices.append((x, y, current_height + section["height"]))
        
        current_height += section["height"]
    
    for i in range(0, len(vertices) - 2, 2):
        faces.append((i, i+1, i+3, i+2))
    
    mesh = bpy.data.meshes.new(name="Bottle")
    mesh.from_pydata(vertices, [], faces)
    mesh.update()
    
    obj = bpy.data.objects.new("Bottle", mesh)
    bpy.context.collection.objects.link(obj)

create_bottle()
    `;
    setGeneratedCode(code);
    setCodeType('Blender');
  };

  //@ts-ignore
  const SectionInput = ({ section }) => (
    <div style={styles.sectionContainer}>
      <div style={styles.sectionHeader}>
        <input
          type="text"
          value={section.name}
          onChange={(e) => handleInputChange(section.id, 'name', e.target.value)}
          style={{ ...styles.input, fontWeight: 'bold', width: 'auto' }}
        />
        <button 
          onClick={() => removeSection(section.id)}
          disabled={sections.length === 1}
          style={{ ...styles.button, ...styles.deleteButton }}
        >
          Delete
        </button>
      </div>
      <div>
        <label>Height ({unit})</label>
        <input
          type="number"
          value={section.height}
          onChange={(e) => handleInputChange(section.id, 'height', e.target.value)}
          style={styles.input}
        />
      </div>
      <div>
        <label>Diameter ({unit})</label>
        <input
          type="number"
          value={section.diameter}
          onChange={(e) => handleInputChange(section.id, 'diameter', e.target.value)}
          style={styles.input}
        />
      </div>
    </div>
  );

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>3D Bottle Shape Generator</h1>
      <div>
        {sections.map(section => (
          <SectionInput key={section.id} section={section} />
        ))}
      </div>
      <div style={styles.buttonContainer}>
        <button onClick={addSection} style={{ ...styles.button, ...styles.addButton }}>
          Add Section
        </button>
        <button onClick={toggleUnit} style={{ ...styles.button, ...styles.toggleButton }}>
          Toggle {unit === 'mm' ? 'cm' : 'mm'}
        </button>
      </div>
      <div style={styles.buttonContainer}>
        <button onClick={generateOpenSCADCode} style={{ ...styles.button, ...styles.generateButton }}>Generate OpenSCAD Code</button>
        <button onClick={generateBlenderCode} style={{ ...styles.button, ...styles.generateButton }}>Generate Blender Code</button>
      </div>
      {generatedCode && (
        <div style={styles.codeContainer}>
          <h2 style={{ ...styles.title, fontSize: '20px' }}>Generated {codeType} Code</h2>
          {/* 
// @ts-ignore */}
          <pre style={styles.pre}>
            <code>{generatedCode}</code>
          </pre>
        </div>
      )}
    </div>
  );
};

export default BottleShapeGenerator;