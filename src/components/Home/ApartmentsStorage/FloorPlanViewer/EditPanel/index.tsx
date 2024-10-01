import React, { useEffect } from 'react';

import './styles.scss'

interface EditPanelProps {
  points: number[][];
  onChange: (newPoints: number[][]) => void;
  isAddPointMode: boolean;
  onAddPointModeChange: (isActive: boolean) => void;
  activePointIndex: number;
  onDeletePoint: (index: number) => void;
  onAddPolygon: () => void;
  onDeletePolygon: () => void;
}

const EditPanel: React.FC<EditPanelProps> = ({ 
  points, 
  onChange, 
  isAddPointMode, 
  onAddPointModeChange, 
  activePointIndex,
  onDeletePoint,
  onAddPolygon,
  onDeletePolygon,
}) => {
  const handlePointChange = (index: number, axis: 'x' | 'y', value: string) => {
    const newValue = parseFloat(value);
    if (isNaN(newValue)) return;

    const newPoints = points.map((point, i) => 
      i === index ? [axis === 'x' ? newValue : point[0], axis === 'y' ? newValue : point[1]] : point
    );
    onChange(newPoints);
  };

  const toggleAddPointMode = () => {
    onAddPointModeChange(!isAddPointMode);
  };

  const handleDeletePoint = () => {
    if (activePointIndex !== -1 && points.length > 3) {
      onDeletePoint(activePointIndex);
    }
  };

  return (
    <div className="edit-panel">
      <h4>Polygon Points</h4>
      {points.map((point, index) => (
        <div key={index} className="edit-panel__point">
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
      <button 
        onClick={toggleAddPointMode}
        className={`edit-panel__add-point-button ${isAddPointMode ? 'active' : ''}`}
      >
        {isAddPointMode ? 'Disable' : 'Enable'} Add Point Mode
      </button>
      <button 
        onClick={handleDeletePoint}
        className="edit-panel__delete-point-button"
        disabled={activePointIndex === -1 || points.length <= 3}
      >
        Delete Active Point
      </button>
      <button 
        onClick={onAddPolygon}
        className="edit-panel__add-polygon-button"
      >
        Add New Polygon
      </button>
      <button 
        onClick={onDeletePolygon}
        className="edit-panel__delete-polygon-button"
      >
        Delete This Polygon
      </button>
    </div>
  );
};

export default EditPanel;