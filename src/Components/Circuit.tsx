import { useEffect, useMemo, useRef, useState } from 'react';
import { Stage, Layer, Line, Circle, Group } from 'react-konva';
import { useCircuitStore } from '../hooks/useCircuitStore';
import { ComponentMap } from './ViewRegistry';
import { getPinGlobalPosition, getNodePosition, handleDragMove, handleDragEnd } from '../utils/circuit-functions';
import FloatingAlert from './FloatingAlert';
import ComponentModal from './ComponentModal';
import { doesWireIntersectComponents, findOrthogonalRoute } from '../utils/wire-routing';
import { COMPONENTS_CONFIG } from '../config/components';
import type { JunctionPoint } from '../types';

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

const getNodeAnchor = (nodeId: string, components: any[], junctions: JunctionPoint[], gridSize: number, leadCells = 2): PinAnchor => {
  if (nodeId.startsWith('jct:')) {
    const pos = getNodePosition(nodeId, components, junctions);
    return { pinPoint: pos, exitPoint: pos, componentId: '' };
  }
  const pinPoint = getPinGlobalPosition(nodeId, components);
  const [componentId] = nodeId.split(':');
  const direction = getPinDirection(nodeId, components);
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

const findJunctionNear = (x: number, y: number, junctions: JunctionPoint[], tolerance: number): JunctionPoint | undefined => {
  return junctions.find(j => Math.abs(j.x - x) <= tolerance && Math.abs(j.y - y) <= tolerance);
};

interface CircuitProps {
  bottomOffset?: number;
}

const Circuit = ({ bottomOffset = 0 }: CircuitProps) => {
  const gridSize = 10;
  const stageWidth = window.innerWidth - 200;
  const stageHeight = window.innerHeight - bottomOffset;
  const { components, wires, junctions, updateComponentPos, updateComponentValue, addWire, removeWire, removeComponent, addJunction, rotateComponent } = useCircuitStore();
  const [dragLine, setDragLine] = useState<{ fromNode: string; mousePos: WirePoint; bendPoints: WirePoint[] } | null>(null);
  const [alertMessage, setAlertMessage] = useState('');
  const [showAlert, setShowAlert] = useState(false);
  const [selected, setSelected] = useState<Selection>(null);
  const [draggingComponentId, setDraggingComponentId] = useState<string | null>(null);
  const [editingComponentId, setEditingComponentId] = useState<string | null>(null);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const alertTimeoutRef = useRef<number | null>(null);
  const stableRoutedWirePointsRef = useRef<Map<string, number[]>>(new Map());
  const containerRef = useRef<HTMLDivElement>(null);
  const isPanningRef = useRef(false);
  const panStartRef = useRef<{ startX: number; startY: number; offsetX: number; offsetY: number } | null>(null);
  const spaceHeldRef = useRef(false);
  const [spaceHeld, setSpaceHeld] = useState(false);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === ' ' || e.code === 'Space') {
        e.preventDefault();
        spaceHeldRef.current = true;
        setSpaceHeld(true);
      }
    };
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.key === ' ' || e.code === 'Space') {
        spaceHeldRef.current = false;
        setSpaceHeld(false);
        if (!isPanningRef.current && containerRef.current) {
          containerRef.current.style.cursor = 'default';
        }
      }
    };
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, []);

  const getRoutedWirePoints = (wire: any) => {
    const fromAnchor = getNodeAnchor(wire.from, components, junctions, gridSize);
    const toAnchor = getNodeAnchor(wire.to, components, junctions, gridSize);
    const rawPoints = buildWirePoints(
      fromAnchor.pinPoint,
      [fromAnchor.exitPoint, ...(wire.bendPoints || []), toAnchor.exitPoint],
      toAnchor.pinPoint
    );
    const ignored = new Set<string>();
    if (fromAnchor.componentId) ignored.add(fromAnchor.componentId);
    if (toAnchor.componentId) ignored.add(toAnchor.componentId);

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
  }, [wires, components, junctions, stageWidth, stageHeight, gridSize]);

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
  }, [wires, draggingComponentId, fullyRoutedWirePointsById, components, junctions, stageWidth, stageHeight, gridSize]);

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
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) return;
      if (!selected) return;

      if (event.key === 'Delete' || event.key === 'Backspace') {
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
        return;
      }

      if (selected.type === 'component' && (event.key === 'r' || event.key === 'R')) {
        event.preventDefault();
        rotateComponent(selected.id);
        triggerAlert('Componente rotado 90°.');
        return;
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [selected, removeWire, removeComponent, rotateComponent]);

  const screenToWorld = (sx: number, sy: number): WirePoint => ({
    x: sx - panOffset.x,
    y: sy - panOffset.y,
  });

  const handleNodeClick = (nodeId: string) => {
    if (!dragLine) {
      const pos = nodeId.startsWith('jct:')
        ? getNodePosition(nodeId, components, junctions)
        : getPinGlobalPosition(nodeId, components);
      setDragLine({ fromNode: nodeId, mousePos: pos, bendPoints: [] });
      setSelected(null);
      return;
    }

    if (dragLine.fromNode === nodeId) {
      triggerAlert('No puedes conectar un punto consigo mismo.');
      setDragLine(null);
      return;
    }

    const existingWire = wires.find(
      (wire) =>
        (wire.from === dragLine.fromNode && wire.to === nodeId) ||
        (wire.from === nodeId && wire.to === dragLine.fromNode)
    );

    if (existingWire) {
      triggerAlert('Esa conexión ya existe.');
      setDragLine(null);
      return;
    }

    addWire(dragLine.fromNode, nodeId, dragLine.bendPoints);
    setDragLine(null);
  };

  const handleWireClick = (e: any, wire: any) => {
    e.cancelBubble = true;

    if (!dragLine) {
      setSelected({ type: 'wire', id: wire.id });
      return;
    }

    const stage = e.target.getStage();
    const pointerPos = stage.getPointerPosition();
    if (!pointerPos) return;

    const worldPos = screenToWorld(pointerPos.x, pointerPos.y);
    const pos = snapPointToGrid(worldPos, gridSize);

    const existing = findJunctionNear(pos.x, pos.y, junctions, gridSize);
    if (existing) {
      handleNodeClick(existing.id);
      return;
    }

    const jctId = addJunction(pos.x, pos.y);
    addWire(dragLine.fromNode, jctId, dragLine.bendPoints);
    setDragLine(null);
  };

  const handleMouseDown = (e: any) => {
    if (spaceHeldRef.current && e.target === e.target.getStage()) {
      isPanningRef.current = true;
      panStartRef.current = {
        startX: e.evt.clientX,
        startY: e.evt.clientY,
        offsetX: panOffset.x,
        offsetY: panOffset.y,
      };
      setDragLine(null);
      if (containerRef.current) {
        containerRef.current.style.cursor = 'grabbing';
      }
    }
  };

  const handleMouseMove = (e: any) => {
    if (isPanningRef.current && panStartRef.current) {
      const dx = e.evt.clientX - panStartRef.current.startX;
      const dy = e.evt.clientY - panStartRef.current.startY;
      setPanOffset({
        x: panStartRef.current.offsetX + dx,
        y: panStartRef.current.offsetY + dy,
      });
      return;
    }

    if (!dragLine) return;

    const stage = e.target.getStage();
    const pointerPos = stage.getPointerPosition();
    if (pointerPos) {
      const worldPos = screenToWorld(pointerPos.x, pointerPos.y);
      setDragLine({
        ...dragLine,
        mousePos: snapPointToGrid(worldPos, gridSize),
      });
    }
  };

  const handleMouseUp = () => {
    if (isPanningRef.current) {
      isPanningRef.current = false;
      panStartRef.current = null;
      if (containerRef.current) {
        containerRef.current.style.cursor = spaceHeldRef.current ? 'grab' : 'default';
      }
    }
  };

  const handleMouseLeave = () => {
    if (isPanningRef.current) {
      isPanningRef.current = false;
      panStartRef.current = null;
      if (containerRef.current) {
        containerRef.current.style.cursor = 'default';
      }
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

  const visibleWorldXStart = Math.floor(-panOffset.x / gridSize) * gridSize;
  const visibleWorldXEnd = Math.ceil((stageWidth - panOffset.x) / gridSize) * gridSize;
  const visibleWorldYStart = Math.floor(-panOffset.y / gridSize) * gridSize;
  const visibleWorldYEnd = Math.ceil((stageHeight - panOffset.y) / gridSize) * gridSize;
  const numXLines = Math.round((visibleWorldXEnd - visibleWorldXStart) / gridSize) + 1;
  const numYLines = Math.round((visibleWorldYEnd - visibleWorldYStart) / gridSize) + 1;

  return (
    <div
      ref={containerRef}
      style={{
        flexGrow: 1,
        backgroundColor: '#ecf0f1',
        position: 'relative',
        cursor: spaceHeld && !isPanningRef.current ? 'grab' : undefined,
      }}
    >
      <FloatingAlert message={alertMessage} visible={showAlert} />
      {editingComponentId && (() => {
        const comp = components.find(c => c.id === editingComponentId);
        if (!comp) return null;
        return (
          <ComponentModal
            componentId={comp.id}
            componentType={comp.type}
            currentValue={comp.value}
            onSave={(id, value) => {
              updateComponentValue(id, value);
              setEditingComponentId(null);
            }}
            onClose={() => setEditingComponentId(null)}
          />
        );
      })()}
      <Stage
        width={stageWidth}
        height={stageHeight}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        onClick={(e) => {
          if (e.target === e.target.getStage()) {
            if (e.evt.ctrlKey && dragLine) {
              const stage = e.target.getStage();
              const pointerPos = stage?.getPointerPosition();
              if (pointerPos) {
                const worldPos = screenToWorld(pointerPos.x, pointerPos.y);
                const snappedPoint = snapPointToGrid(worldPos, gridSize);
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
          <Group x={panOffset.x} y={panOffset.y} listening={false}>
            {Array.from({ length: numXLines }).map((_, index) => {
              const x = visibleWorldXStart + index * gridSize;
              return (
                <Line
                  key={`gv-${index}`}
                  points={[x, visibleWorldYStart, x, visibleWorldYEnd]}
                  stroke="#d9dee3"
                  strokeWidth={1}
                />
              );
            })}
            {Array.from({ length: numYLines }).map((_, index) => {
              const y = visibleWorldYStart + index * gridSize;
              return (
                <Line
                  key={`gh-${index}`}
                  points={[visibleWorldXStart, y, visibleWorldXEnd, y]}
                  stroke="#d9dee3"
                  strokeWidth={1}
                />
              );
            })}
          </Group>
        </Layer>
        <Layer>
          <Group x={panOffset.x} y={panOffset.y}>
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
                  onClick={(e) => handleWireClick(e, wire)}
                />
              );
            })}

            {dragLine && (
              (() => {
                const fromAnchor = getNodeAnchor(dragLine.fromNode, components, junctions, gridSize);
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

            {junctions.map((jct) => (
              <Circle
                key={jct.id}
                id={jct.id}
                x={jct.x}
                y={jct.y}
                radius={4}
                fill="#2c3e50"
                stroke="#ecf0f1"
                strokeWidth={1}
                hitStrokeWidth={10}
                onClick={(e) => {
                  e.cancelBubble = true;
                  handleNodeClick(jct.id);
                }}
              />
            ))}

            {components.map((comp) => {
              const ComponentView = ComponentMap[comp.type];
              if (!ComponentView) return null;

              return (
                <ComponentView
                  key={comp.id}
                  id={comp.id}
                  x={comp.x}
                  y={comp.y}
                  onPinClick={handleNodeClick}
                  onDragMove={(e: any) => handleComponentDragMove(e, comp.id)}
                  onDragEnd={(e: any) => handleComponentDragEnd(e, comp.id)}
                  onSelect={(id: string) => setSelected({ type: 'component', id })}
                  onDblClick={(id: string) => setEditingComponentId(id)}
                  isSelected={selected?.type === 'component' && selected.id === comp.id}
                  rotation={comp.rotation}
                />
              );
            })}
          </Group>
        </Layer>
      </Stage>
    </div>
  );
};

export default Circuit;
