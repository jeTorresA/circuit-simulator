import { useCircuitStore } from "../hooks/useCircuitStore";
import { solveDC } from "../core/Solver";
import type { SimulationResult } from "../core/Solver";

interface ToolbarProps {
  onSimulationResult?: (result: SimulationResult | null, error?: string) => void;
}

const Toolbar = ({ onSimulationResult }: ToolbarProps) => {
    const { components, wires, junctions, addComponent } = useCircuitStore();

    const handleSimulate = () => {
      try {
        const result = solveDC(components, wires, junctions);
        onSimulationResult?.(result, result.components.length === 0 ? 'No hay componentes para simular.' : undefined);
      } catch {
        onSimulationResult?.(null, 'Error al resolver el circuito.');
      }
    };

    return (
        <div style={{ 
            width: '220px', 
            backgroundColor: '#2c3e50', 
            padding: '20px', 
            color: 'white',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
            zIndex: 10,
            overflowY: 'auto',
          }}>
            <h3 style={{ margin: '0 0 10px 0', fontSize: '16px' }}>Componentes</h3>
            
            <button 
              onClick={() => addComponent('resistor')}
              style={{
                padding: '8px',
                cursor: 'pointer',
                backgroundColor: '#f39c12',
                border: 'none',
                color: 'white',
                fontWeight: 'bold',
                borderRadius: '4px',
                fontSize: '13px',
              }}
            >
              + Resistencia
            </button>

            <button 
              onClick={() => addComponent('capacitor')}
              style={{
                padding: '8px',
                cursor: 'pointer',
                backgroundColor: '#3498db',
                border: 'none',
                color: 'white',
                fontWeight: 'bold',
                borderRadius: '4px',
                fontSize: '13px',
              }}
            >
              + Capacitor
            </button>

            <button 
              onClick={() => addComponent('inductor')}
              style={{
                padding: '8px',
                cursor: 'pointer',
                backgroundColor: '#9b59b6',
                border: 'none',
                color: 'white',
                fontWeight: 'bold',
                borderRadius: '4px',
                fontSize: '13px',
              }}
            >
              + Inductor
            </button>

            <button 
              onClick={() => addComponent('battery')}
              style={{
                padding: '8px',
                cursor: 'pointer',
                backgroundColor: '#e67e22',
                border: 'none',
                color: 'white',
                fontWeight: 'bold',
                borderRadius: '4px',
                fontSize: '13px',
              }}
            >
              + Batería
            </button>

            <hr style={{ border: 'none', borderTop: '1px solid #445566', margin: '10px 0' }} />

            <button
              onClick={handleSimulate}
              style={{
                padding: '10px',
                cursor: 'pointer',
                backgroundColor: '#27ae60',
                border: 'none',
                color: 'white',
                fontWeight: 'bold',
                borderRadius: '4px',
                fontSize: '14px',
              }}
            >
              ▶ Simular DC
            </button>

            <div style={{ marginTop: 'auto', fontSize: '11px', color: '#bdc3c7' }}>
              Componentes: {components.length}<br/>
              Cables: {wires.length}
            </div>
          </div>
    );
};

export default Toolbar;
