import React from 'react';

import './styles.scss'

interface EditPanelProps {
  points: number[][];
  onChange: (newPoints: number[][]) => void;
  activePointIndex: number;
  onActivePointChange: (index: number) => void;
  getScaleFactor: () => number;
}

const EditPanel: React.FC<EditPanelProps> = ({ 
  points, 
  onChange, 
  activePointIndex,
  onActivePointChange,
  getScaleFactor,
}) => {
  const scaleFactor = getScaleFactor();

  const unscalePoint = (point: number[]): number[] => {
    return [point[0] / scaleFactor, point[1] / scaleFactor];
  };

  const scalePoint = (point: number[]): number[] => {
    return [point[0] * scaleFactor, point[1] * scaleFactor];
  };

  const handlePointChange = (index: number, axis: 'x' | 'y', value: string) => {
    const newValue = parseFloat(value);
    if (isNaN(newValue)) return;

    const newPoints = points.map((point, i) => {
      if (i === index) {
        const unscaledPoint = unscalePoint(point);
        const updatedPoint = axis === 'x' 
          ? [newValue, unscaledPoint[1]] 
          : [unscaledPoint[0], newValue];
        return scalePoint(updatedPoint);
      }
      return point;
    });
    onChange(newPoints);
  };

  return (
    <div className="edit-panel">
      <h4>Edit Points</h4>
      {points.map((point, index) => {
        const [unscaledX, unscaledY] = unscalePoint(point);
        return (
          <div 
            key={index} 
            className={`edit-panel__point ${index === activePointIndex ? 'active' : ''}`}
            onClick={() => onActivePointChange(index)}
          >
            <span>Point {index + 1}:</span>
            <input
              type="number"
              value={unscaledX.toFixed(2)}
              onChange={(e) => handlePointChange(index, 'x', e.target.value)}
              step="any"
            />
            <input
              type="number"
              value={unscaledY.toFixed(2)}
              onChange={(e) => handlePointChange(index, 'y', e.target.value)}
              step="any"
            />
          </div>
        );
      })}
    </div>
  );
};

export default EditPanel;