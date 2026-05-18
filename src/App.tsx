import { useState, useEffect, useRef } from 'react';
import { useCircuitStore } from './hooks/useCircuitStore';
import { solveDC } from './core/Solver';
import Toolbar from './Components/Toolbar';
import Circuit from './Components/Circuit';
import SimulationPanel from './Components/SimulationPanel';
import type { SimulationResult } from './core/Solver';

const PANEL_HEIGHT = 160;
const TAB_HEIGHT = 28;
const MIN_TOOLBAR = 160;
const MAX_TOOLBAR = 500;

const App = () => {
  const { components, wires, junctions } = useCircuitStore();
  const [simResult, setSimResult] = useState<SimulationResult | null>(null);
  const [simError, setSimError] = useState<string | null>(null);
  const [showSimPanel, setShowSimPanel] = useState(true);
  const [showToolbar, setShowToolbar] = useState(true);
  const [toolbarWidth, setToolbarWidth] = useState(260);
  const isResizing = useRef(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === 'j') {
        e.preventDefault();
        setShowSimPanel(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleSimulate = () => {
    try {
      const result = solveDC(components, wires, junctions);
      setSimResult(result);
      setSimError(result.components.length === 0 ? 'No hay componentes para simular.' : null);
      if (result.components.length > 0) {
        setShowSimPanel(true);
      }
    } catch {
      setSimResult(null);
      setSimError('Error al resolver el circuito.');
    }
  };

  const handleResizeStart = (e: React.MouseEvent) => {
    e.preventDefault();
    isResizing.current = true;
    const startX = e.clientX;
    const startWidth = toolbarWidth;

    const onMove = (e: MouseEvent) => {
      if (!isResizing.current) return;
      const newWidth = Math.max(MIN_TOOLBAR, Math.min(MAX_TOOLBAR, startWidth + (e.clientX - startX)));
      setToolbarWidth(newWidth);
    };

    const onUp = () => {
      isResizing.current = false;
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
    };

    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  };

  const bottomOffset = showSimPanel ? PANEL_HEIGHT : TAB_HEIGHT;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', width: '100vw', overflow: 'hidden' }}>
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {showToolbar ? (
          <>
            <Toolbar width={toolbarWidth} onToggle={() => setShowToolbar(false)} />
            <div
              onMouseDown={handleResizeStart}
              style={{
                width: 5,
                cursor: 'col-resize',
                backgroundColor: '#1a252f',
                flexShrink: 0,
                zIndex: 11,
              }}
            />
          </>
        ) : (
          <div
            onClick={() => setShowToolbar(true)}
            style={{
              width: 22,
              backgroundColor: '#2c3e50',
              flexShrink: 0,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 10,
            }}
            title="Mostrar panel"
          >
            <span style={{ fontSize: 12, color: '#95a5a6' }}>▶</span>
          </div>
        )}
        <Circuit bottomOffset={bottomOffset} />
      </div>
      <SimulationPanel
        simResult={simResult}
        simError={simError}
        visible={showSimPanel}
        onToggle={() => setShowSimPanel(p => !p)}
        onSimulate={handleSimulate}
      />
    </div>
  );
};

export default App;
