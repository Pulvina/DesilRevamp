import React, { useState, useRef, useEffect } from 'react';

import { Annotations, Floor } from 'redux-storage/reducers/apartments';
import Apartments from './Apartments';
import EditablePolygon from './EditablePolygon';
import EditPanel from './EditPanel';

import threeDModel from './3d-model.png';

import './styles.scss';

interface FloorPlanViewerProps {
  floor: Floor;
  onClose: () => void;
  onSaveAnnotations?: (annotations: Annotations) => void;
}

const FloorPlanViewer: React.FC<FloorPlanViewerProps> = ({ floor, onClose, onSaveAnnotations }) => {
  const [annotations, setAnnotations] = useState<Annotations>(floor.annotations || { walls: [] });
  const [activeAnnotationType, setActiveAnnotationType] = useState<string>('walls');
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
    setAnnotations(prev => ({
      ...prev,
      [activeAnnotationType]: prev[activeAnnotationType].map((annotation, i) => 
        i === index ? newPoints : annotation
      )
    }));
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

    setAnnotations(prev => ({
      ...prev,
      [activeAnnotationType]: prev[activeAnnotationType].map((annotation, i) => {
        if (i !== activeAnnotationIndex) return annotation;
        
        let insertIndex = 0;
        let minDistance = Infinity;
        
        for (let i = 0; i < annotation.length; i++) {
          const [x1, y1] = annotation[i];
          const [x2, y2] = annotation[(i + 1) % annotation.length];
          
          const distance = pointToLineDistance(x, y, x1, y1, x2, y2);
          
          if (distance < minDistance) {
            minDistance = distance;
            insertIndex = i + 1;
          }
        }
        
        const newAnnotation = [...annotation];
        newAnnotation.splice(insertIndex, 0, [x, y]);
        return newAnnotation;
      })
    }));

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
    let newAnnotation: number[][];

    if (activeAnnotationType === 'doors' || activeAnnotationType === 'windows') {
      newAnnotation = [
        [centerX - defaultSize / 2, centerY],
        [centerX + defaultSize / 2, centerY]
      ];
    } else {
      newAnnotation = [
        [centerX - defaultSize, centerY - defaultSize],
        [centerX + defaultSize, centerY - defaultSize],
        [centerX + defaultSize, centerY + defaultSize],
        [centerX - defaultSize, centerY + defaultSize],
      ];
    }

    setAnnotations(prev => ({
      ...prev,
      [activeAnnotationType]: [...prev[activeAnnotationType], newAnnotation]
    }));
    setActiveAnnotationIndex(annotations[activeAnnotationType].length);
  };

  const handleAddAnnotation = () => {
    const defaultSize = 50;
    const centerX = imageSize ? imageSize.width / 2 : 100;
    const centerY = imageSize ? imageSize.height / 2 : 100;
    let newAnnotation: number[][];

    if (activeAnnotationType === 'doors' || activeAnnotationType === 'windows') {
      newAnnotation = [
        [centerX - defaultSize / 2, centerY],
        [centerX + defaultSize / 2, centerY]
      ];
    } else {
      newAnnotation = [
        [centerX - defaultSize, centerY - defaultSize],
        [centerX + defaultSize, centerY - defaultSize],
        [centerX + defaultSize, centerY + defaultSize],
        [centerX - defaultSize, centerY + defaultSize],
      ];
    }

    setAnnotations(prev => ({
      ...prev,
      [activeAnnotationType]: [...prev[activeAnnotationType], newAnnotation]
    }));
    setActiveAnnotationIndex(annotations[activeAnnotationType].length);
  };

  const handleDeleteAnnotation = () => {
    if (activeAnnotationIndex === null) return;
    
    setAnnotations(prev => ({
      ...prev,
      [activeAnnotationType]: prev[activeAnnotationType].filter((_, index) => index !== activeAnnotationIndex)
    }));
    setActiveAnnotationIndex(null);
    setActivePointIndex(-1);
  };

  const toggleAddPointMode = () => {
    if (activeAnnotationType !== 'doors' && activeAnnotationType !== 'windows') {
      setIsAddPointMode(!isAddPointMode);
    }
  };

  const handleDeletePoint = () => {
    if (activeAnnotationIndex === null || activePointIndex === -1) return;
    
    setAnnotations(prev => ({
      ...prev,
      [activeAnnotationType]: prev[activeAnnotationType].map((annotation, i) => 
        i === activeAnnotationIndex ? annotation.filter((_, index) => index !== activePointIndex) : annotation
      )
    }));
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
                    width: imageSize?.width,
                    height: imageSize?.height,
                  }}
                  onClick={handleImageClick}
                >
                  {['walls', 'windows', 'doors'].flatMap(type => 
                    annotations[type].map((points, index) => (
                      <EditablePolygon
                        key={`${type}-${index}`}
                        points={points}
                        onChange={(newPoints) => handleAnnotationChange(index, newPoints)}
                        color={type === 'walls' ? "rgb(98, 130, 255)" : type === 'doors' ? "rgb(139, 69, 19)" : "rgb(135, 206, 235)"}
                        isActive={activeAnnotationType === type && activeAnnotationIndex === index}
                        setActive={() => {
                          setActiveAnnotationType(type);
                          setActiveAnnotationIndex(index);
                        }}
                        onActivePointChange={(index) => setActivePointIndex(index)}
                        isLine={type === 'doors' || type === 'windows'}
                        type={type as 'walls' | 'doors' | 'windows'}
                      />
                    ))
                  )}
                </svg>
              )}
            </div>
            
            <button className="floor-plan-viewer__close" onClick={onClose}>×</button>
            <button className="floor-plan-viewer__save" onClick={handleSave}>Save Changes</button>
          </div>

          <div className="floor-plan-viewer__edit-panel">
            <h3>Annotations</h3>
            <div className="floor-plan-viewer__annotation-types">
              {['walls', 'doors', 'windows'].map((type) => (
                <button
                  key={type}
                  onClick={() => setActiveAnnotationType(type)}
                  className={`floor-plan-viewer__type-button ${activeAnnotationType === type ? 'active' : ''}`}
                >
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </button>
              ))}
            </div>
            <div className="floor-plan-viewer__annotation-controls">
              <button onClick={handleAddAnnotation}>
                Add New {activeAnnotationType === 'walls' ? 'Polygon' : 'Line'}
              </button>
              <button 
                onClick={handleDeleteAnnotation}
                disabled={activeAnnotationIndex === null}
              >
                Delete Selected {activeAnnotationType === 'walls' ? 'Polygon' : 'Line'}
              </button>
              {activeAnnotationType === 'walls' && (
                <button 
                  onClick={toggleAddPointMode}
                  className={isAddPointMode ? 'active' : ''}
                >
                  {isAddPointMode ? 'Disable' : 'Enable'} Add Point Mode
                </button>
              )}
              <button 
                onClick={handleDeletePoint}
                disabled={activePointIndex === -1}
              >
                Delete Selected Point
              </button>
            </div>
            {Object.entries(annotations).map(([type, polygons]) => (
              <div key={type} style={{ display: activeAnnotationType === type ? 'block' : 'none' }}>
                <h4>{type}</h4>
                {polygons.map((points, index) => (
                  <div key={`${type}-${index}`} className="floor-plan-viewer__annotation-item">
                    <button 
                      onClick={() => {
                        setActiveAnnotationType(type);
                        setActiveAnnotationIndex(index);
                      }}
                      className={`floor-plan-viewer__annotation-button ${activeAnnotationType === type && activeAnnotationIndex === index ? 'active' : ''}`}
                    >
                      {type} {index + 1}
                    </button>
                    {activeAnnotationType === type && activeAnnotationIndex === index && (
                      <EditPanel 
                        points={points}
                        onChange={(newPoints) => handleAnnotationChange(index, newPoints)}
                        activePointIndex={activePointIndex}
                        onActivePointChange={(index) => setActivePointIndex(index)}
                      />
                    )}
                  </div>
                ))}
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
