import { useEffect, useSyncExternalStore } from 'react';
import { v4 as uuidv4 } from 'uuid';

const STORAGE_KEY = 'mi-simulador-circuitos-v1';

interface CircuitState {
  components: any[];
  wires: any[];
}

interface WirePoint {
  x: number;
  y: number;
}

type Listener = () => void;

const listeners = new Set<Listener>();

const loadInitialState = (): CircuitState => {
  const savedData = localStorage.getItem(STORAGE_KEY);
  if (!savedData) return { components: [], wires: [] };

  try {
    const parsed = JSON.parse(savedData);
    return {
      components: parsed.components || [],
      wires: parsed.wires || [],
    };
  } catch {
    return { components: [], wires: [] };
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

  const addComponent = (type: string) => {
    const newComp = {
      id: `${type}-${uuidv4().slice(0, 4)}`,
      type,
      x: 100,
      y: 100,
    };

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
    const isDuplicate = state.wires.some(w => 
      (w.from === from && w.to === to) || (w.from === to && w.to === from)
    );
    
    if (isDuplicate || from === to) return state; // No hace nada si es duplicado

    const newWire = { id: uuidv4(), from, to, bendPoints };
    setStore((prev) => ({
      ...prev,
      wires: [...prev.wires, newWire],
    }));
  };

  const removeWire = (wireId: string) => {
    setStore((prev) => ({
      ...prev,
      wires: prev.wires.filter((wire) => wire.id !== wireId),
    }));
  };

  const removeComponent = (componentId: string) => {
    setStore((prev) => ({
      ...prev,
      components: prev.components.filter((component) => component.id !== componentId),
      wires: prev.wires.filter(
        (wire) =>
          !wire.from.startsWith(`${componentId}:`) &&
          !wire.to.startsWith(`${componentId}:`)
      ),
    }));
  };

  const clearCircuit = () => {
    store = { components: [], wires: [] };
    localStorage.removeItem(STORAGE_KEY);
    emit();
  };

  return {
    components: state.components,
    wires: state.wires,
    addComponent,
    updateComponentPos,
    addWire,
    removeWire,
    removeComponent,
    clearCircuit,
  };
};
