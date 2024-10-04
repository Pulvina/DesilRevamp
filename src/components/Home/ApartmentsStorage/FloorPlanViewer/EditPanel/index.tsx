import React from 'react';

import './styles.scss'

interface EditPanelProps {
  points: number[][];
  onChange: (newPoints: number[][]) => void;
  activePointIndex: number;
  onActivePointChange: (index: number) => void;
}

const EditPanel: React.FC<EditPanelProps> = ({ 
  points, 
  onChange, 
  activePointIndex,
  onActivePointChange,
}) => {
  const handlePointChange = (index: number, axis: 'x' | 'y', value: string) => {
    const newValue = parseFloat(value);
    if (isNaN(newValue)) return;

    const newPoints = points.map((point, i) => 
      i === index ? [axis === 'x' ? newValue : point[0], axis === 'y' ? newValue : point[1]] : point
    );
    onChange(newPoints);
  };

  return (
    <div className="edit-panel">
      <h4>Edit Points</h4>
      {points.map((point, index) => (
        <div 
          key={index} 
          className={`edit-panel__point ${index === activePointIndex ? 'active' : ''}`}
          onClick={() => onActivePointChange(index)}
        >
          <span>Point {index + 1}:</span>
          <input
            type="number"
            value={point[0]}
            onChange={(e) => handlePointChange(index, 'x', e.target.value)}
            step="any"
          />
          <input
            type="number"
            value={point[1]}
            onChange={(e) => handlePointChange(index, 'y', e.target.value)}
            step="any"
          />
        </div>
      ))}
    </div>
  );
};

export default EditPanel;