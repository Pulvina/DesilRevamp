import React, { useRef, useEffect } from "react";

interface EditablePolygonProps {
  points: number[][];
  onChange: (newPoints: number[][]) => void;
  color: string;
  isActive: boolean;
  setActive: () => void;
  onActivePointChange: (index: number) => void;
  isLine?: boolean;
  type: 'walls' | 'doors' | 'windows';
}

interface Point {
  x: number;
  y: number;
}

const HANDLE_SIZE = 20;

const EditablePolygon: React.FC<EditablePolygonProps> = ({
  points,
  onChange,
  color,
  isActive,
  setActive,
  onActivePointChange,
  isLine = false,
  type
}) => {
  const activePointIndexRef = useRef<number>(-1);
  const isDraggingWholePolygonRef = useRef<boolean>(false);
  const lastMousePositionRef = useRef<Point | null>(null);

  useEffect(() => {
    onActivePointChange(activePointIndexRef.current);
  }, [activePointIndexRef.current]);

  const updatePolygon = (newPoints: number[][]) => {
    onChange(newPoints);
  };

  const handleMouseDown = (e: React.MouseEvent<SVGGElement>) => {
    setActive();
    const svgRect = (e.currentTarget.ownerSVGElement as SVGSVGElement).getBoundingClientRect();
    const mouseX = e.clientX - svgRect.left;
    const mouseY = e.clientY - svgRect.top;

    const touchedPointIndex = points.findIndex(
      point => 
        Math.abs(point[0] - mouseX) < HANDLE_SIZE / 2 &&
        Math.abs(point[1] - mouseY) < HANDLE_SIZE / 2
    );
    
    if (touchedPointIndex !== -1) {
      activePointIndexRef.current = touchedPointIndex;
      isDraggingWholePolygonRef.current = false;
    } else {
      isDraggingWholePolygonRef.current = true;
    }
    
    lastMousePositionRef.current = { x: mouseX, y: mouseY };
  };

  const handleMouseMove = (e: React.MouseEvent<SVGGElement>) => {
    if (!isActive) return;

    const svgRect = (e.currentTarget.ownerSVGElement as SVGSVGElement).getBoundingClientRect();
    const mouseX = e.clientX - svgRect.left;
    const mouseY = e.clientY - svgRect.top;
    
    if (isDraggingWholePolygonRef.current && lastMousePositionRef.current) {
      const dx = mouseX - lastMousePositionRef.current.x;
      const dy = mouseY - lastMousePositionRef.current.y;
      
      const newPoints = points.map(point => [
        point[0] + dx,
        point[1] + dy,
      ]);
      
      updatePolygon(newPoints);
    } else if (activePointIndexRef.current !== -1) {
      const newPoints = [...points];
      newPoints[activePointIndexRef.current] = [mouseX, mouseY];
      updatePolygon(newPoints);
    }

    lastMousePositionRef.current = { x: mouseX, y: mouseY };
  };

  const handleMouseUp = () => {
    activePointIndexRef.current = -1;
    isDraggingWholePolygonRef.current = false;
    lastMousePositionRef.current = null;
  };

  const getColor = () => {
    switch (type) {
      case 'doors':
        return "rgb(139, 69, 19)";
      case 'windows':
        return "rgb(135, 206, 235)";
      default:
        return color;
    }
  };

  return (
    <g
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      {isLine ? (
        <line
          x1={points[0][0]}
          y1={points[0][1]}
          x2={points[1][0]}
          y2={points[1][1]}
          stroke={getColor()}
          strokeWidth="4"
        />
      ) : (
        <polygon
          points={points.map(p => p.join(',')).join(' ')}
          fill={`${getColor()}33`}
          stroke={getColor()}
          strokeWidth="2"
          opacity={0.6}
        />
      )}
      {isActive && points.map((point, index) => (
        <circle
          key={index}
          cx={point[0]}
          cy={point[1]}
          r={HANDLE_SIZE / 2}
          fill={activePointIndexRef.current === index ? 'yellow' : 'white'}
          stroke="black"
        />
      ))}
    </g>
  );
};

export default EditablePolygon;