'use client'
import React, { useState } from 'react';

import ThreeJSViewer from './ThreeJSViewer';

import './style.scss'

interface Section {
  id: number;
  name: string;
  height: number;
  diameter: number;
}

const BottleShapeGenerator: React.FC = () => {
  const [sections, setSections] = useState<Section[]>([
    { id: 1, name: 'Bottom', height: 40, diameter: 50 },
    { id: 2, name: 'Middle', height: 80, diameter: 40 },
    { id: 3, name: 'Top', height: 30, diameter: 20 },
  ]);

  const [generatedCode, setGeneratedCode] = useState<string>('');
  const [codeType, setCodeType] = useState<'OpenSCAD' | 'Blender'>('OpenSCAD');
  const [unit, setUnit] = useState<'mm' | 'cm'>('mm');

  const handleInputChange = (id: number, property: keyof Section, value: string) => {
    setSections(prev => prev.map(section => 
      section.id === id ? { ...section, [property]: property === 'name' ? value : parseFloat(value) } : section
    ));
  };

  const addSection = () => {
    const newId = Math.max(...sections.map(s => s.id)) + 1;
    setSections([...sections, { id: newId, name: `Section ${newId}`, height: 30, diameter: 30 }]);
  };

  const removeSection = (id: number) => {
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
            
            x_next = next_radius * math.cos(math.radians(angle))
            y_next = next_radius * math.sin(math.radians(angle))
            vertices.append((x_next, y_next, current_height + section["height"]))
        
        current_height += section["height"]
    
    # Create faces
    for i in range(0, len(vertices) - 2, 2):
        faces.append((i, i+1, (i+3) % len(vertices), (i+2) % len(vertices)))
    
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

  const SectionInput: React.FC<{ section: Section }> = ({ section }) => (
    <div className="bottle-generator__section-container">
      <div className="bottle-generator__section-header">
        <input
          type="text"
          value={section.name}
          onChange={(e) => handleInputChange(section.id, 'name', e.target.value)}
          className="bottle-generator__input bottle-generator__input--bold"
        />
        <button 
          onClick={() => removeSection(section.id)}
          disabled={sections.length === 1}
          className="bottle-generator__button bottle-generator__button--delete"
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
          className="bottle-generator__input"
        />
      </div>
      <div>
        <label>Diameter ({unit})</label>
        <input
          type="number"
          value={section.diameter}
          onChange={(e) => handleInputChange(section.id, 'diameter', e.target.value)}
          className="bottle-generator__input"
        />
      </div>
    </div>
  );

  return (
    <div className="bottle-generator__container">
      <h1 className="bottle-generator__title">3D Bottle Shape Generator</h1>
      <div className="bottle-generator__layout">
        <div className="bottle-generator__input-section">
          {sections.map(section => (
            <SectionInput key={section.id} section={section} />
          ))}
          <div className="bottle-generator__button-container">
            <button onClick={addSection} className="bottle-generator__button bottle-generator__button--add">
              Add Section
            </button>
            <button onClick={toggleUnit} className="bottle-generator__button bottle-generator__button--toggle">
              Toggle {unit === 'mm' ? 'cm' : 'mm'}
            </button>
          </div>
          <div className="bottle-generator__button-container">
            <button onClick={generateOpenSCADCode} className="bottle-generator__button bottle-generator__button--generate">Generate OpenSCAD Code</button>
            <button onClick={generateBlenderCode} className="bottle-generator__button bottle-generator__button--generate">Generate Blender Code</button>
          </div>
          {generatedCode && (
            <div className="bottle-generator__code-container">
              <h2 className="bottle-generator__subtitle">Generated {codeType} Code</h2>
              <pre className="bottle-generator__pre">
                <code>{generatedCode}</code>
              </pre>
            </div>
          )}
        </div>
        <div className="bottle-generator__viewer-section">
          <ThreeJSViewer sections={sections} />
        </div>
      </div>
    </div>
  );
};


export default BottleShapeGenerator;