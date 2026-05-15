import { useEffect, useSyncExternalStore } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { createComponent } from '../core/Component';
import type { ComponentType, Component, JunctionPoint } from '../types';

const STORAGE_KEY = 'mi-simulador-circuitos-v1';

interface CircuitState {
  components: Component[];
  wires: any[];
  junctions: JunctionPoint[];
}

interface WirePoint {
  x: number;
  y: number;
}

type Listener = () => void;

const listeners = new Set<Listener>();

const loadInitialState = (): CircuitState => {
  const savedData = localStorage.getItem(STORAGE_KEY);
  if (!savedData) return { components: [], wires: [], junctions: [] };

  try {
    const parsed = JSON.parse(savedData);
    return {
      components: parsed.components || [],
      wires: parsed.wires || [],
      junctions: parsed.junctions || [],
    };
  } catch {
    return { components: [], wires: [], junctions: [] };
  }
};

let store: CircuitState = loadInitialState();

const emit = () => {
  listeners.forEach((listener) => listener());
};

const setStore = (updater: (prev: CircuitState) => CircuitState) => {
  store = updater(store);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  emit();
};

const subscribe = (listener: Listener) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

const getSnapshot = () => store;

export const useCircuitStore = () => {
  const state = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (event.key !== STORAGE_KEY) return;
      store = loadInitialState();
      emit();
    };

    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const addComponent = (type: ComponentType) => {
    const newComp = createComponent(type);

    setStore((prev) => ({
      ...prev,
      components: [...prev.components, newComp],
    }));
  };

  const updateComponentPos = (id: string, x: number, y: number) => {
    setStore((prev) => ({
      ...prev,
      components: prev.components.map((c) => (c.id === id ? { ...c, x, y } : c)),
    }));
  };

  const addWire = (from: string, to: string, bendPoints: WirePoint[] = []) => {
    const isDuplicate = store.wires.some(w => 
      (w.from === from && w.to === to) || (w.from === to && w.to === from)
    );
    
    if (isDuplicate || from === to) return;

    const newWire = { id: uuidv4(), from, to, bendPoints };
    setStore((prev) => ({
      ...prev,
      wires: [...prev.wires, newWire],
    }));
  };

  const removeWire = (wireId: string) => {
    setStore((prev) => {
      const remainingWires = prev.wires.filter((wire) => wire.id !== wireId);
      const referencedJunctionIds = new Set<string>();
      remainingWires.forEach((w: any) => {
        if (typeof w.from === 'string' && w.from.startsWith('jct:')) referencedJunctionIds.add(w.from);
        if (typeof w.to === 'string' && w.to.startsWith('jct:')) referencedJunctionIds.add(w.to);
      });
      const remainingJunctions = prev.junctions.filter((j) => referencedJunctionIds.has(j.id));
      return { ...prev, wires: remainingWires, junctions: remainingJunctions };
    });
  };

  const removeComponent = (componentId: string) => {
    setStore((prev) => {
      const remainingWires = prev.wires.filter(
        (wire: any) =>
          !wire.from.startsWith(`${componentId}:`) &&
          !wire.to.startsWith(`${componentId}:`)
      );
      const referencedJunctionIds = new Set<string>();
      remainingWires.forEach((w: any) => {
        if (typeof w.from === 'string' && w.from.startsWith('jct:')) referencedJunctionIds.add(w.from);
        if (typeof w.to === 'string' && w.to.startsWith('jct:')) referencedJunctionIds.add(w.to);
      });
      const remainingJunctions = prev.junctions.filter((j) => referencedJunctionIds.has(j.id));
      return {
        ...prev,
        components: prev.components.filter((c) => c.id !== componentId),
        wires: remainingWires,
        junctions: remainingJunctions,
      };
    });
  };

  const updateComponentValue = (id: string, value: number) => {
    setStore((prev) => ({
      ...prev,
      components: prev.components.map((c) => (c.id === id ? { ...c, value } : c)),
    }));
  };

  const addJunction = (x: number, y: number): string => {
    const id = `jct:${uuidv4().slice(0, 8)}`;
    setStore((prev) => ({
      ...prev,
      junctions: [...prev.junctions, { id, x, y }],
    }));
    return id;
  };

  const removeJunction = (id: string) => {
    setStore((prev) => ({
      ...prev,
      junctions: prev.junctions.filter((j) => j.id !== id),
      wires: prev.wires.filter(
        (w: any) => w.from !== id && w.to !== id
      ),
    }));
  };

  const clearCircuit = () => {
    store = { components: [], wires: [], junctions: [] };
    localStorage.removeItem(STORAGE_KEY);
    emit();
  };

  return {
    components: state.components,
    wires: state.wires,
    junctions: state.junctions,
    addComponent,
    updateComponentPos,
    updateComponentValue,
    addWire,
    removeWire,
    removeComponent,
    addJunction,
    removeJunction,
    clearCircuit,
  };
};
