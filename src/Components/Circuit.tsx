import { useEffect, useMemo, useRef, useState } from 'react';
import { Stage, Layer, Line } from 'react-konva';
import { useCircuitStore } from '../hooks/useCircuitStore';
import { ComponentMap } from './ViewRegistry';
import { getPinGlobalPosition, handleDragMove, handleDragEnd } from '../utils/circuit-functions';
import FloatingAlert from './FloatingAlert';
import { doesWireIntersectComponents, findOrthogonalRoute } from '../utils/wire-routing';
import { COMPONENTS_CONFIG } from '../config/components';

type Selection =
  | { type: 'component'; id: string }
  | { type: 'wire'; id: string }
  | null;

interface WirePoint {
  x: number;
  y: number;
}

interface PinAnchor {
  pinPoint: WirePoint;
  exitPoint: WirePoint;
  componentId: string;
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

const getPinDirection = (pinId: string, components: any[]) => {
  const [componentId, pinName] = pinId.split(':');
  const component = components.find((comp) => comp.id === componentId);
  if (!component) return { x: 1, y: 0 };

  const config = COMPONENTS_CONFIG[component.type];
  const pinOffset = config?.pins?.[pinName];
  if (!config || !pinOffset) return { x: 1, y: 0 };

  const width = config.width || 0;
  const height = config.height || 0;
  const tolerance = 0.001;

  if (Math.abs(pinOffset.x) <= tolerance) return { x: -1, y: 0 };
  if (Math.abs(pinOffset.x - width) <= tolerance) return { x: 1, y: 0 };
  if (Math.abs(pinOffset.y) <= tolerance) return { x: 0, y: -1 };
  if (Math.abs(pinOffset.y - height) <= tolerance) return { x: 0, y: 1 };

  const distances = [
    { side: 'left', value: pinOffset.x },
    { side: 'right', value: Math.abs(width - pinOffset.x) },
    { side: 'top', value: pinOffset.y },
    { side: 'bottom', value: Math.abs(height - pinOffset.y) },
  ];

  distances.sort((a, b) => a.value - b.value);
  const nearest = distances[0]?.side;

  if (nearest === 'left') return { x: -1, y: 0 };
  if (nearest === 'right') return { x: 1, y: 0 };
  if (nearest === 'top') return { x: 0, y: -1 };
  return { x: 0, y: 1 };
};

const getPinAnchor = (pinId: string, components: any[], gridSize: number, leadCells = 2): PinAnchor => {
  const pinPoint = getPinGlobalPosition(pinId, components);
  const [componentId] = pinId.split(':');
  const direction = getPinDirection(pinId, components);
  const leadDistance = gridSize * leadCells;
  const exitPoint = snapPointToGrid(
    {
      x: pinPoint.x + direction.x * leadDistance,
      y: pinPoint.y + direction.y * leadDistance,
    },
    gridSize
  );

  return { pinPoint, exitPoint, componentId };
};

const toPointObjects = (flatPoints: number[]): WirePoint[] => {
  const points: WirePoint[] = [];
  for (let i = 0; i < flatPoints.length; i += 2) {
    points.push({ x: flatPoints[i], y: flatPoints[i + 1] });
  }
  return points;
};

const isWireConnectedToComponent = (wire: any, componentId: string) =>
  wire.from.startsWith(`${componentId}:`) || wire.to.startsWith(`${componentId}:`);

const Circuit = () => {
  const gridSize = 10;
  const stageWidth = window.innerWidth - 200;
  const stageHeight = window.innerHeight;
  const { components, wires, updateComponentPos, addWire, removeWire, removeComponent } = useCircuitStore();
  const [dragLine, setDragLine] = useState<{ fromPin: string; mousePos: WirePoint; bendPoints: WirePoint[] } | null>(null);
  const [alertMessage, setAlertMessage] = useState('');
  const [showAlert, setShowAlert] = useState(false);
  const [selected, setSelected] = useState<Selection>(null);
  const [draggingComponentId, setDraggingComponentId] = useState<string | null>(null);
  const alertTimeoutRef = useRef<number | null>(null);
  const stableRoutedWirePointsRef = useRef<Map<string, number[]>>(new Map());

  const getRoutedWirePoints = (wire: any) => {
    const fromAnchor = getPinAnchor(wire.from, components, gridSize);
    const toAnchor = getPinAnchor(wire.to, components, gridSize);
    const rawPoints = buildWirePoints(
      fromAnchor.pinPoint,
      [fromAnchor.exitPoint, ...(wire.bendPoints || []), toAnchor.exitPoint],
      toAnchor.pinPoint
    );
    const ignored = new Set<string>([fromAnchor.componentId, toAnchor.componentId]);

    const intersects = doesWireIntersectComponents(
      toPointObjects(rawPoints),
      components,
      ignored
    );

    if (!intersects) return rawPoints;

    const reroutedPoints = findOrthogonalRoute(
      fromAnchor.exitPoint,
      toAnchor.exitPoint,
      components,
      gridSize,
      { width: stageWidth, height: stageHeight },
      ignored
    );

    if (!reroutedPoints || reroutedPoints.length < 2) return rawPoints;

    const flatPoints: number[] = [fromAnchor.pinPoint.x, fromAnchor.pinPoint.y];
    reroutedPoints.forEach((point) => {
      flatPoints.push(point.x, point.y);
    });
    flatPoints.push(toAnchor.pinPoint.x, toAnchor.pinPoint.y);
    return flatPoints;
  };

  const fullyRoutedWirePointsById = useMemo(() => {
    const routed = new Map<string, number[]>();
    wires.forEach((wire) => {
      routed.set(wire.id, getRoutedWirePoints(wire));
    });
    return routed;
  }, [wires, components, stageWidth, stageHeight, gridSize]);

  const routedWirePointsById = useMemo(() => {
    if (!draggingComponentId) return fullyRoutedWirePointsById;

    const routed = new Map<string, number[]>();
    wires.forEach((wire) => {
      if (isWireConnectedToComponent(wire, draggingComponentId)) {
        routed.set(wire.id, getRoutedWirePoints(wire));
        return;
      }

      const frozenPoints = stableRoutedWirePointsRef.current.get(wire.id);
      routed.set(wire.id, frozenPoints || fullyRoutedWirePointsById.get(wire.id) || []);
    });

    return routed;
  }, [wires, draggingComponentId, fullyRoutedWirePointsById, components, stageWidth, stageHeight, gridSize]);

  useEffect(() => {
    if (draggingComponentId) return;
    stableRoutedWirePointsRef.current = new Map(fullyRoutedWirePointsById);
  }, [fullyRoutedWirePointsById, draggingComponentId]);

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

  const handleComponentDragMove = (e: any, componentId: string) => {
    if (draggingComponentId !== componentId) {
      setDraggingComponentId(componentId);
    }
    handleDragMove(e, componentId, updateComponentPos);
  };

  const handleComponentDragEnd = (e: any, componentId: string) => {
    handleDragEnd(e, componentId, updateComponentPos);
    setDraggingComponentId(null);
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
            const points = routedWirePointsById.get(wire.id) || [];
            return (
              <Line
                key={wire.id}
                points={points}
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
            (() => {
              const fromAnchor = getPinAnchor(dragLine.fromPin, components, gridSize);
              return (
                <Line
                  points={buildWirePoints(
                    fromAnchor.pinPoint,
                    [fromAnchor.exitPoint, ...dragLine.bendPoints],
                    dragLine.mousePos
                  )}
                  stroke="#3498db"
                  strokeWidth={2}
                  dash={[5, 5]}
                />
              );
            })()
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
                onDragMove={(e: any) => handleComponentDragMove(e, comp.id)}
                onDragEnd={(e: any) => handleComponentDragEnd(e, comp.id)}
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
