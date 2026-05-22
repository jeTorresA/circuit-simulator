import { COMPONENTS_CONFIG } from '../config/components';
import type { Component, JunctionPoint, Wire } from '../types';

const GMIN = 1e-12;

// --- Public types ---

export interface ComponentResult {
  id: string;
  type: string;
  voltage: number;
  current: number;
  power: number;
  value: number;
}

export interface SimulationResult {
  nodeVoltages: number[];
  components: ComponentResult[];
  totalPower: number;
  nodeCount: number;
}

// --- Netlist builder ---

interface SimComponent {
  id: string;
  type: string;
  nodeA: number;
  nodeB: number;
  value: number;
}

function buildNetlist(
  components: Component[],
  wires: Wire[],
  junctions: JunctionPoint[]
): SimComponent[] {
  const vertices = new Set<string>();

  for (const comp of components) {
    const config = COMPONENTS_CONFIG[comp.type];
    if (config?.pins) {
      for (const pinName of Object.keys(config.pins)) {
        vertices.add(`${comp.id}:${pinName}`);
      }
    }
  }

  for (const jct of junctions) {
    vertices.add(jct.id);
  }

  const adj = new Map<string, string[]>();
  for (const v of vertices) adj.set(v, []);

  for (const wire of wires) {
    if (vertices.has(wire.from) && vertices.has(wire.to)) {
      adj.get(wire.from)!.push(wire.to);
      adj.get(wire.to)!.push(wire.from);
    }
  }

  const nodeOfVertex = new Map<string, number>();
  let nextNode = 0;
  const visited = new Set<string>();

  for (const v of vertices) {
    if (visited.has(v)) continue;
    const queue = [v];
    visited.add(v);
    while (queue.length > 0) {
      const current = queue.shift()!;
      nodeOfVertex.set(current, nextNode);
      for (const neighbor of adj.get(current) || []) {
        if (!visited.has(neighbor)) {
          visited.add(neighbor);
          queue.push(neighbor);
        }
      }
    }
    nextNode++;
  }

  const simComponents: SimComponent[] = [];

  for (const comp of components) {
    const config = COMPONENTS_CONFIG[comp.type];
    if (!config?.pins) continue;
    const pinNames = Object.keys(config.pins);
    if (pinNames.length < 2) continue;

    const nodeA = nodeOfVertex.get(`${comp.id}:${pinNames[0]}`) ?? 0;
    const nodeB = nodeOfVertex.get(`${comp.id}:${pinNames[1]}`) ?? 0;

    simComponents.push({
      id: comp.id,
      type: comp.type,
      nodeA,
      nodeB,
      value: comp.value,
    });
  }

  return simComponents;
}

// --- Linear solver ---

function gaussElimination(A: number[][], b: number[]): number[] {
  const n = b.length;
  const aug = A.map((row, i) => [...row, b[i]]);

  for (let col = 0; col < n; col++) {
    let maxVal = Math.abs(aug[col][col]);
    let maxRow = col;
    for (let row = col + 1; row < n; row++) {
      if (Math.abs(aug[row][col]) > maxVal) {
        maxVal = Math.abs(aug[row][col]);
        maxRow = row;
      }
    }

    [aug[col], aug[maxRow]] = [aug[maxRow], aug[col]];

    if (Math.abs(aug[col][col]) < 1e-18) continue;

    for (let row = col + 1; row < n; row++) {
      const factor = aug[row][col] / aug[col][col];
      for (let j = col; j <= n; j++) {
        aug[row][j] -= factor * aug[col][j];
      }
    }
  }

  const x = new Array(n).fill(0);
  for (let i = n - 1; i >= 0; i--) {
    if (Math.abs(aug[i][i]) < 1e-18) continue;
    let s = aug[i][n];
    for (let j = i + 1; j < n; j++) {
      s -= aug[i][j] * x[j];
    }
    x[i] = s / aug[i][i];
  }

  return x;
}

// --- MNA stamps ---

function stampConductance(A: number[][], a: number, b: number, g: number) {
  const ra = a > 0 ? a - 1 : null;
  const rb = b > 0 ? b - 1 : null;

  if (ra !== null) A[ra][ra] += g;
  if (rb !== null) A[rb][rb] += g;
  if (ra !== null && rb !== null) {
    A[ra][rb] -= g;
    A[rb][ra] -= g;
  }
}

function stampVoltageSource(
  A: number[][],
  rhs: number[],
  a: number,
  b: number,
  V: number,
  k: number,
  numNonGround: number
) {
  const row = numNonGround + k;
  const ra = a > 0 ? a - 1 : null;
  const rb = b > 0 ? b - 1 : null;

  if (ra !== null) {
    A[ra][row] = 1;
    A[row][ra] = 1;
  }
  if (rb !== null) {
    A[rb][row] = -1;
    A[row][rb] = -1;
  }

  rhs[row] = V;
}

// --- Public API ---

export function solveDC(
  components: Component[],
  wires: Wire[],
  junctions: JunctionPoint[]
): SimulationResult {
  const simComps = buildNetlist(components, wires, junctions);

  if (simComps.length === 0) {
    return { nodeVoltages: [0], components: [], totalPower: 0, nodeCount: 1 };
  }

  const numNodes = Math.max(...simComps.map(c => Math.max(c.nodeA, c.nodeB))) + 1;
  const voltageSources = simComps.filter(c => c.type === 'battery');
  const passives = simComps.filter(c => c.type !== 'battery');
  const numVs = voltageSources.length;
  const numNonGround = numNodes - 1;
  const size = numNonGround + numVs;

  if (size === 0) {
    const comps = simComps.map(c => ({
      id: c.id,
      type: c.type,
      voltage: 0,
      current: 0,
      power: 0,
      value: c.value,
    }));
    return { nodeVoltages: [0], components: comps, totalPower: 0, nodeCount: 1 };
  }

  const A: number[][] = Array.from({ length: size }, () => new Array(size).fill(0));
  const rhs: number[] = new Array(size).fill(0);

  // Stamp passives
  for (const pc of passives) {
    let g = 0;
    switch (pc.type) {
      case 'resistor':
        g = pc.value > 0 ? 1 / pc.value : 1e6;
        break;
      case 'capacitor':
        g = GMIN;
        break;
      case 'inductor':
        g = 1e6;
        break;
    }
    stampConductance(A, pc.nodeA, pc.nodeB, g);
  }

  // Stamp voltage sources
  for (let k = 0; k < numVs; k++) {
    const vs = voltageSources[k];
    stampVoltageSource(A, rhs, vs.nodeA, vs.nodeB, vs.value, k, numNonGround);
  }

  // GMIN to ground for every non-ground node
  for (let i = 0; i < numNonGround; i++) {
    A[i][i] += GMIN;
  }

  // Solve
  const x = gaussElimination(A, rhs);
  if (x.some(v => !isFinite(v) || isNaN(v))) {
    const comps = simComps.map(c => ({
      id: c.id,
      type: c.type,
      voltage: 0,
      current: 0,
      power: 0,
      value: c.value,
    }));
    return { nodeVoltages: new Array(numNodes).fill(0), components: comps, totalPower: 0, nodeCount: numNodes };
  }

  // Extract results
  const nodeVoltages: number[] = new Array(numNodes).fill(0);
  for (let i = 0; i < numNonGround; i++) {
    nodeVoltages[i + 1] = x[i];
  }

  const vsCurrents = new Map<string, number>();
  for (let k = 0; k < numVs; k++) {
    vsCurrents.set(voltageSources[k].id, x[numNonGround + k]);
  }

  const componentResults: ComponentResult[] = [];
  let totalPower = 0;

  for (const sc of simComps) {
    const vA = nodeVoltages[sc.nodeA];
    const vB = nodeVoltages[sc.nodeB];
    const vDiff = vA - vB;
    let current = 0;

    switch (sc.type) {
      case 'resistor':
        current = sc.value > 0 ? vDiff / sc.value : 0;
        break;
      case 'capacitor':
        current = 0;
        break;
      case 'inductor':
        current = 1e6 * vDiff;
        break;
      case 'battery':
        current = vsCurrents.get(sc.id) ?? 0;
        break;
    }

    const power = current * (sc.type === 'battery' ? -vDiff : vDiff);
    totalPower += Math.abs(power);

    componentResults.push({
      id: sc.id,
      type: sc.type,
      voltage: vDiff,
      current,
      power: Math.abs(power),
      value: sc.value,
    });
  }

  return {
    nodeVoltages,
    components: componentResults,
    totalPower,
    nodeCount: numNodes,
  };
}
