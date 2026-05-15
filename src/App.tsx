import { useState, useEffect } from 'react';
import Toolbar from './Components/Toolbar';
import Circuit from './Components/Circuit';
import SimulationPanel from './Components/SimulationPanel';
import type { SimulationResult } from './core/Solver';

const PANEL_HEIGHT = 160;
const TAB_HEIGHT = 28;

const App = () => {
  const [simResult, setSimResult] = useState<SimulationResult | null>(null);
  const [simError, setSimError] = useState<string | null>(null);
  const [showSimPanel, setShowSimPanel] = useState(true);

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

  const handleSimulationResult = (result: SimulationResult | null, error?: string) => {
    setSimResult(result);
    setSimError(error || null);
    if (result && result.components.length > 0) {
      setShowSimPanel(true);
    }
  };

  const bottomOffset = showSimPanel ? PANEL_HEIGHT : TAB_HEIGHT;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', width: '100vw', overflow: 'hidden' }}>
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        <Toolbar onSimulationResult={handleSimulationResult} />
        <Circuit bottomOffset={bottomOffset} />
      </div>
      <SimulationPanel
        simResult={simResult}
        simError={simError}
        visible={showSimPanel}
        onToggle={() => setShowSimPanel(p => !p)}
      />
    </div>
  );
};

export default App;
