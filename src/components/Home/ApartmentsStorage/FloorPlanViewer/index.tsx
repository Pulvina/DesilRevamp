import React, { useState, useRef, useEffect } from 'react';

import { Floor } from 'redux-storage/reducers/apartments';
import Apartments from './Apartments';
import EditablePolygon from './EditablePolygon';
import EditPanel from './EditPanel';

import threeDModel from './3d-model.png';

import './styles.scss';

interface FloorPlanViewerProps {
  floor: Floor;
  onClose: () => void;
  onSaveAnnotations?: (annotations: number[][][]) => void;
}

const FloorPlanViewer: React.FC<FloorPlanViewerProps> = ({ floor, onClose, onSaveAnnotations }) => {
  const [annotations, setAnnotations] = useState<number[][][]>(floor.data || []);
  const [activeAnnotationIndex, setActiveAnnotationIndex] = useState<number | null>(null);
  const [activePointIndex, setActivePointIndex] = useState<number>(-1);
  const [imageSize, setImageSize] = useState<{ width: number; height: number } | null>(null);
  const [isAddPointMode, setIsAddPointMode] = useState(false);
  const [open3DModel, setOpen3DModel] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    const updateImageSize = () => {
      if (imgRef.current) {
        setImageSize({
          width: imgRef.current.width,
          height: imgRef.current.height,
        });
      }
    };

    window.addEventListener('resize', updateImageSize);
    return () => window.removeEventListener('resize', updateImageSize);
  }, []);

  const handleAnnotationChange = (index: number, newPoints: number[][]) => {
    setAnnotations(prev => {
      const newAnnotations = [...prev];
      newAnnotations[index] = newPoints;
      return newAnnotations;
    });
  };

  const handleDeletePoint = (pointIndex: number) => {
    if (activeAnnotationIndex === null) return;
    
    setAnnotations(prev => {
      const newAnnotations = [...prev];
      const activeAnnotation = [...newAnnotations[activeAnnotationIndex]];
      activeAnnotation.splice(pointIndex, 1);
      newAnnotations[activeAnnotationIndex] = activeAnnotation;
      return newAnnotations;
    });
    setActivePointIndex(-1);
  };

  const handleSave = () => {
    if (onSaveAnnotations) {
      onSaveAnnotations(annotations);
    }
    onClose();
  };

  const handleImageClick = (event: React.MouseEvent<SVGSVGElement>) => {
    if (!isAddPointMode || activeAnnotationIndex === null) return;

    const svgRect = svgRef.current?.getBoundingClientRect();
    if (!svgRect) return;

    const x = event.clientX - svgRect.left;
    const y = event.clientY - svgRect.top;

    setAnnotations(prev => {
      const newAnnotations = [...prev];
      const activeAnnotation = [...newAnnotations[activeAnnotationIndex]];
      
      let insertIndex = 0;
      let minDistance = Infinity;
      
      for (let i = 0; i < activeAnnotation.length; i++) {
        const [x1, y1] = activeAnnotation[i];
        const [x2, y2] = activeAnnotation[(i + 1) % activeAnnotation.length];
        
        const distance = pointToLineDistance(x, y, x1, y1, x2, y2);
        
        if (distance < minDistance) {
          minDistance = distance;
          insertIndex = i + 1;
        }
      }
      
      activeAnnotation.splice(insertIndex, 0, [x, y]);
      newAnnotations[activeAnnotationIndex] = activeAnnotation;
      
      return newAnnotations;
    });

    setIsAddPointMode(false);
  };

  const pointToLineDistance = (x: number, y: number, x1: number, y1: number, x2: number, y2: number) => {
    const A = x - x1;
    const B = y - y1;
    const C = x2 - x1;
    const D = y2 - y1;

    const dot = A * C + B * D;
    const lenSq = C * C + D * D;
    let param = -1;
    if (lenSq !== 0) param = dot / lenSq;

    let xx, yy;

    if (param < 0) {
      xx = x1;
      yy = y1;
    } else if (param > 1) {
      xx = x2;
      yy = y2;
    } else {
      xx = x1 + param * C;
      yy = y1 + param * D;
    }

    const dx = x - xx;
    const dy = y - yy;
    return Math.sqrt(dx * dx + dy * dy);
  };

  

  const handleAddPolygon = () => {
    const defaultSize = 50;
    const centerX = imageSize ? imageSize.width / 2 : 100;
    const centerY = imageSize ? imageSize.height / 2 : 100;
    const newPolygon = [
      [centerX - defaultSize, centerY - defaultSize],
      [centerX + defaultSize, centerY - defaultSize],
      [centerX + defaultSize, centerY + defaultSize],
      [centerX - defaultSize, centerY + defaultSize],
    ];
    setAnnotations(prev => [...prev, newPolygon]);
    setActiveAnnotationIndex(annotations.length);
  };

  const handleDeletePolygon = () => {
    if (activeAnnotationIndex === null) return;
    
    setAnnotations(prev => {
      const newAnnotations = [...prev];
      newAnnotations.splice(activeAnnotationIndex, 1);
      return newAnnotations;
    });
    setActiveAnnotationIndex(null);
    setActivePointIndex(-1);
  };

  return (
    <div className="floor-plan-viewer__overlay" onClick={onClose}>
      <div className="floor-plan-viewer__content" onClick={(e) => e.stopPropagation()}>
        <div className='floor-plan-viewer__menu'>
          <img
            src={threeDModel}
            onClick={() => setOpen3DModel(!open3DModel)}
            className={`floor-plan-viewer__menu_button ${open3DModel ? 'active' : ''}`}
          />
        </div>

        <div className='floor-plan-viewer__block'>
          <div className="floor-plan-viewer__main">
            <div style={{ position: 'relative' }}>
              <img 
                ref={imgRef}
                src={floor.picture} 
                alt="Floor plan"
                className="floor-plan-viewer__image"
                onLoad={() => {
                  if (imgRef.current) {
                    setImageSize({
                      width: imgRef.current.width,
                      height: imgRef.current.height,
                    });
                  }
                }}
              />
              {imageSize && (
                <svg
                  ref={svgRef}
                  style={{
                    position: 'absolute',
                    left: 0,
                    top: 0,
                    width: imageSize.width,
                    height: imageSize.height,
                  }}
                  onClick={handleImageClick}
                >
                  {annotations.map((points, index) => (
                    <EditablePolygon
                      key={index}
                      points={points}
                      onChange={(newPoints) => handleAnnotationChange(index, newPoints)}
                      color="rgb(98, 130, 255)"
                      isActive={activeAnnotationIndex === index}
                      setActive={() => setActiveAnnotationIndex(index)}
                      onActivePointChange={(index) => setActivePointIndex(index)}
                    />
                  ))}
                </svg>
              )}
            </div>
            
            <button className="floor-plan-viewer__close" onClick={onClose}>×</button>
            <button className="floor-plan-viewer__save" onClick={handleSave}>Save Changes</button>
          </div>

          <div className="floor-plan-viewer__edit-panel">
            <h3>Annotations</h3>
            {annotations.map((points, index) => (
              <div key={index} className="floor-plan-viewer__annotation-item">
                <button 
                  onClick={() => setActiveAnnotationIndex(index)}
                  className={`floor-plan-viewer__annotation-button ${activeAnnotationIndex === index ? 'active' : ''}`}
                >
                  Annotation {index + 1}
                </button>
                {activeAnnotationIndex === index && (
                  <EditPanel 
                    points={points}
                    onChange={(newPoints) => handleAnnotationChange(index, newPoints)}
                    isAddPointMode={isAddPointMode}
                    onAddPointModeChange={setIsAddPointMode}
                    activePointIndex={activePointIndex}
                    onDeletePoint={handleDeletePoint}
                    onAddPolygon={handleAddPolygon}
                    onDeletePolygon={handleDeletePolygon}
                  />
                )}
              </div>
            ))}
          </div>
        </div>
        
        {open3DModel ?
          <div>
            <Apartments annotations={annotations} />
          </div> : null
        }
      </div>

    </div>
  );
};

export default FloorPlanViewer;