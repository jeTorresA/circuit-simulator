import { useEffect, useRef, useState } from 'react';
import { Stage, Layer, Line } from 'react-konva';
import { useCircuitStore } from '../hooks/useCircuitStore';
import { ComponentMap } from './ViewRegistry';
import { getPinGlobalPosition, handleDragMove, handleDragEnd } from '../utils/circuit-functions';
import FloatingAlert from './FloatingAlert';

type Selection =
  | { type: 'component'; id: string }
  | { type: 'wire'; id: string }
  | null;

interface WirePoint {
  x: number;
  y: number;
}

const snapToGrid = (value: number, gridSize: number) => Math.round(value / gridSize) * gridSize;

const snapPointToGrid = (point: WirePoint, gridSize: number): WirePoint => ({
  x: snapToGrid(point.x, gridSize),
  y: snapToGrid(point.y, gridSize),
});

const buildWirePoints = (start: WirePoint, bendPoints: WirePoint[], end: WirePoint): number[] => {
  const points: number[] = [start.x, start.y];
  bendPoints.forEach((point) => {
    points.push(point.x, point.y);
  });
  points.push(end.x, end.y);
  return points;
};

const Circuit = () => {
  const gridSize = 10;
  const stageWidth = window.innerWidth - 200;
  const stageHeight = window.innerHeight;
  const { components, wires, updateComponentPos, addWire, removeWire, removeComponent } = useCircuitStore();
  const [dragLine, setDragLine] = useState<{ fromPin: string; mousePos: WirePoint; bendPoints: WirePoint[] } | null>(null);
  const [alertMessage, setAlertMessage] = useState('');
  const [showAlert, setShowAlert] = useState(false);
  const [selected, setSelected] = useState<Selection>(null);
  const alertTimeoutRef = useRef<number | null>(null);

  const triggerAlert = (message: string) => {
    if (alertTimeoutRef.current) {
      window.clearTimeout(alertTimeoutRef.current);
    }

    setAlertMessage(message);
    setShowAlert(true);

    alertTimeoutRef.current = window.setTimeout(() => {
      setShowAlert(false);
    }, 1600);
  };

  useEffect(() => {
    return () => {
      if (alertTimeoutRef.current) {
        window.clearTimeout(alertTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (!selected) return;
      if (event.key !== 'Delete' && event.key !== 'Backspace') return;

      event.preventDefault();

      if (selected.type === 'wire') {
        removeWire(selected.id);
        triggerAlert('Cable eliminado.');
      } else {
        removeComponent(selected.id);
        triggerAlert('Componente eliminado.');
      }

      setSelected(null);
      setDragLine(null);
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [selected, removeWire, removeComponent]);

  const handlePinClick = (pinId: string) => {
    if (!dragLine) {
      setDragLine({
        fromPin: pinId,
        mousePos: getPinGlobalPosition(pinId, components),
        bendPoints: [],
      });
      setSelected(null);
      return;
    }

    if (dragLine.fromPin === pinId) {
      triggerAlert('No puedes conectar un pin consigo mismo.');
      setDragLine(null);
      return;
    }

    const existingWire = wires.find(
      (wire) =>
        (wire.from === dragLine.fromPin && wire.to === pinId) ||
        (wire.from === pinId && wire.to === dragLine.fromPin)
    );

    if (existingWire) {
      triggerAlert('Ese cable ya existe.');
      setDragLine(null);
      return;
    }

    addWire(dragLine.fromPin, pinId, dragLine.bendPoints);
    setDragLine(null);
  };

  const handleMouseMove = (e: any) => {
    if (!dragLine) return;

    const stage = e.target.getStage();
    const pointerPos = stage.getPointerPosition();
    if (pointerPos) {
      setDragLine({
        ...dragLine,
        mousePos: snapPointToGrid({ x: pointerPos.x, y: pointerPos.y }, gridSize),
      });
    }
  };

  return (
    <div style={{ flexGrow: 1, backgroundColor: '#ecf0f1', position: 'relative' }}>
      <FloatingAlert message={alertMessage} visible={showAlert} />
      <Stage
        width={stageWidth}
        height={stageHeight}
        onMouseMove={handleMouseMove}
        onClick={(e) => {
          if (e.target === e.target.getStage()) {
            if (e.evt.ctrlKey && dragLine) {
              const stage = e.target.getStage();
              const pointerPos = stage?.getPointerPosition();
              if (pointerPos) {
                const snappedPoint = snapPointToGrid({ x: pointerPos.x, y: pointerPos.y }, gridSize);
                setDragLine((prev) => {
                  if (!prev) return prev;
                  return {
                    ...prev,
                    bendPoints: [...prev.bendPoints, snappedPoint],
                    mousePos: snappedPoint,
                  };
                });
              }
              return;
            }

            setDragLine(null);
            setSelected(null);
          }
        }}
      >
        <Layer listening={false}>
          {Array.from({ length: Math.ceil(stageWidth / gridSize) + 1 }).map((_, index) => {
            const x = index * gridSize;
            return (
              <Line
                key={`grid-v-${index}`}
                points={[x, 0, x, stageHeight]}
                stroke="#d9dee3"
                strokeWidth={1}
              />
            );
          })}
          {Array.from({ length: Math.ceil(stageHeight / gridSize) + 1 }).map((_, index) => {
            const y = index * gridSize;
            return (
              <Line
                key={`grid-h-${index}`}
                points={[0, y, stageWidth, y]}
                stroke="#d9dee3"
                strokeWidth={1}
              />
            );
          })}
        </Layer>
        <Layer>
          {wires.map((wire) => {
            const start = getPinGlobalPosition(wire.from, components);
            const end = getPinGlobalPosition(wire.to, components);
            const bendPoints = wire.bendPoints || [];
            return (
              <Line
                key={wire.id}
                points={buildWirePoints(start, bendPoints, end)}
                stroke={selected?.type === 'wire' && selected.id === wire.id ? '#f1c40f' : '#2c3e50'}
                strokeWidth={selected?.type === 'wire' && selected.id === wire.id ? 5 : 3}
                lineCap="round"
                hitStrokeWidth={14}
                onClick={(e) => {
                  e.cancelBubble = true;
                  setSelected({ type: 'wire', id: wire.id });
                }}
              />
            );
          })}

          {dragLine && (
            <Line
              points={buildWirePoints(
                getPinGlobalPosition(dragLine.fromPin, components),
                dragLine.bendPoints,
                dragLine.mousePos
              )}
              stroke="#3498db"
              strokeWidth={2}
              dash={[5, 5]}
            />
          )}

          {components.map((comp) => {
            const ComponentView = ComponentMap[comp.type];
            if (!ComponentView) return null;

            return (
              <ComponentView
                key={comp.id}
                id={comp.id}
                x={comp.x}
                y={comp.y}
                onPinClick={handlePinClick}
                onDragMove={(e: any) => handleDragMove(e, comp.id, updateComponentPos)}
                onDragEnd={(e: any) => handleDragEnd(e, comp.id, updateComponentPos)}
                onSelect={(id: string) => setSelected({ type: 'component', id })}
                isSelected={selected?.type === 'component' && selected.id === comp.id}
              />
            );
          })}
        </Layer>
      </Stage>
    </div>
  );
};

export default Circuit;
