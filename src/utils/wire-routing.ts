import { COMPONENTS_CONFIG } from '../config/components';

interface Point {
  x: number;
  y: number;
}

interface ComponentLike {
  id: string;
  type: string;
  x: number;
  y: number;
  rotation?: number;
}

interface Bounds {
  width: number;
  height: number;
}

interface Cell {
  col: number;
  row: number;
}

const keyOf = (cell: Cell) => `${cell.col},${cell.row}`;

const toCell = (point: Point, gridSize: number): Cell => ({
  col: Math.round(point.x / gridSize),
  row: Math.round(point.y / gridSize),
});

const toPoint = (cell: Cell, gridSize: number): Point => ({
  x: cell.col * gridSize,
  y: cell.row * gridSize,
});

const pointInsideRect = (point: Point, rect: { left: number; right: number; top: number; bottom: number }) =>
  point.x >= rect.left && point.x <= rect.right && point.y >= rect.top && point.y <= rect.bottom;

const segmentIntersectsRect = (
  a: Point,
  b: Point,
  rect: { left: number; right: number; top: number; bottom: number }
) => {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const length = Math.max(Math.abs(dx), Math.abs(dy));

  if (length === 0) return pointInsideRect(a, rect);

  const steps = Math.max(2, Math.ceil(length / 4));
  for (let i = 0; i <= steps; i += 1) {
    const t = i / steps;
    const sample = { x: a.x + dx * t, y: a.y + dy * t };
    if (pointInsideRect(sample, rect)) return true;
  }
  return false;
};

const simplifyPath = (points: Point[]) => {
  if (points.length <= 2) return points;

  const simplified: Point[] = [points[0]];
  for (let i = 1; i < points.length - 1; i += 1) {
    const prev = simplified[simplified.length - 1];
    const current = points[i];
    const next = points[i + 1];

    const sameVertical = prev.x === current.x && current.x === next.x;
    const sameHorizontal = prev.y === current.y && current.y === next.y;
    if (sameVertical || sameHorizontal) continue;

    simplified.push(current);
  }
  simplified.push(points[points.length - 1]);
  return simplified;
};

const getComponentRect = (component: ComponentLike, margin: number) => {
  const cfg = COMPONENTS_CONFIG[component.type];
  if (!cfg) return null;

  const rot = component.rotation || 0;
  const isSwapped = rot === 90 || rot === 270;
  const w = isSwapped ? cfg.height : cfg.width;
  const h = isSwapped ? cfg.width : cfg.height;

  return {
    left: component.x - margin,
    right: component.x + w + margin,
    top: component.y - margin,
    bottom: component.y + h + margin,
  };
};

export const doesWireIntersectComponents = (
  points: Point[],
  components: ComponentLike[],
  ignoredComponentIds: Set<string>,
  margin = 2
) => {
  for (let i = 0; i < points.length - 1; i += 1) {
    const start = points[i];
    const end = points[i + 1];

    for (const component of components) {
      if (ignoredComponentIds.has(component.id)) continue;
      const rect = getComponentRect(component, margin);
      if (!rect) continue;

      if (segmentIntersectsRect(start, end, rect)) return true;
    }
  }

  return false;
};

export const findOrthogonalRoute = (
  start: Point,
  end: Point,
  components: ComponentLike[],
  gridSize: number,
  bounds: Bounds,
  ignoredComponentIds: Set<string>
): Point[] | null => {
  const maxCol = Math.ceil(bounds.width / gridSize);
  const maxRow = Math.ceil(bounds.height / gridSize);
  const blocked = new Set<string>();
  const obstaclePadding = gridSize / 2;

  components.forEach((component) => {
    if (ignoredComponentIds.has(component.id)) return;
    const rect = getComponentRect(component, obstaclePadding);
    if (!rect) return;

    const minCol = Math.floor(rect.left / gridSize);
    const maxRectCol = Math.ceil(rect.right / gridSize);
    const minRow = Math.floor(rect.top / gridSize);
    const maxRectRow = Math.ceil(rect.bottom / gridSize);

    for (let col = minCol; col <= maxRectCol; col += 1) {
      for (let row = minRow; row <= maxRectRow; row += 1) {
        if (col < 0 || row < 0 || col > maxCol || row > maxRow) continue;
        blocked.add(keyOf({ col, row }));
      }
    }
  });

  const startCell = toCell(start, gridSize);
  const endCell = toCell(end, gridSize);
  blocked.delete(keyOf(startCell));
  blocked.delete(keyOf(endCell));

  const queue: Cell[] = [startCell];
  const visited = new Set<string>([keyOf(startCell)]);
  const parent = new Map<string, string>();
  const dirs: Cell[] = [
    { col: 1, row: 0 },
    { col: -1, row: 0 },
    { col: 0, row: 1 },
    { col: 0, row: -1 },
  ];

  while (queue.length > 0) {
    const current = queue.shift()!;
    if (current.col === endCell.col && current.row === endCell.row) {
      const routeCells: Cell[] = [];
      let currentKey = keyOf(current);

      while (currentKey) {
        const [colStr, rowStr] = currentKey.split(',');
        routeCells.push({ col: Number(colStr), row: Number(rowStr) });
        currentKey = parent.get(currentKey) || '';
      }

      routeCells.reverse();
      const routePoints = routeCells.map((cell) => toPoint(cell, gridSize));
      const simplified = simplifyPath(routePoints);
      simplified[0] = start;
      simplified[simplified.length - 1] = end;
      return simplified;
    }

    dirs.forEach((dir) => {
      const next: Cell = { col: current.col + dir.col, row: current.row + dir.row };
      if (next.col < 0 || next.row < 0 || next.col > maxCol || next.row > maxRow) return;

      const nextKey = keyOf(next);
      if (visited.has(nextKey)) return;
      if (blocked.has(nextKey)) return;

      visited.add(nextKey);
      parent.set(nextKey, keyOf(current));
      queue.push(next);
    });
  }

  return null;
};
