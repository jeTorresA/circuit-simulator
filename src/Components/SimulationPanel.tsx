import type { SimulationResult } from '../core/Solver';

interface SimulationPanelProps {
  simResult: SimulationResult | null;
  simError: string | null;
  visible: boolean;
  onToggle: () => void;
  onSimulate: () => void;
}

function formatCurrent(A: number): string {
  const abs = Math.abs(A);
  if (abs >= 1) return `${A.toFixed(3)} A`;
  if (abs >= 1e-3) return `${(A * 1e3).toFixed(2)} mA`;
  if (abs >= 1e-6) return `${(A * 1e6).toFixed(2)} µA`;
  return `${(A * 1e9).toFixed(2)} nA`;
}

function formatPower(W: number): string {
  if (W >= 1) return `${W.toFixed(2)} W`;
  if (W >= 1e-3) return `${(W * 1e3).toFixed(2)} mW`;
  if (W >= 1e-6) return `${(W * 1e6).toFixed(2)} µW`;
  return `${(W * 1e9).toFixed(2)} nW`;
}

function formatVoltage(V: number): string {
  const abs = Math.abs(V);
  if (abs >= 1) return `${V.toFixed(2)} V`;
  if (abs >= 1e-3) return `${(V * 1e3).toFixed(1)} mV`;
  if (abs >= 1e-6) return `${(V * 1e6).toFixed(1)} µV`;
  return `${(V * 1e9).toFixed(1)} nV`;
}

const simulateBtnStyle: React.CSSProperties = {
  padding: '5px 14px',
  cursor: 'pointer',
  backgroundColor: '#27ae60',
  border: 'none',
  color: 'white',
  fontWeight: 'bold',
  borderRadius: '4px',
  fontSize: '12px',
  whiteSpace: 'nowrap',
  display: 'flex',
  alignItems: 'center',
  gap: '4px',
  flexShrink: 0,
};

const SimulationPanel = ({ simResult, simError, visible, onToggle, onSimulate }: SimulationPanelProps) => {
  if (!visible) {
    return (
      <div
        style={{
          height: 28,
          backgroundColor: '#2c3e50',
          borderTop: '1px solid #445566',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          padding: '0 10px',
          userSelect: 'none',
          flexShrink: 0,
          gap: '6px',
        }}
      >
        <span onClick={onToggle} style={{ display: 'flex', alignItems: 'center', gap: 6, flex: 1, height: '100%' }}>
          <span style={{ fontSize: 11, color: '#95a5a6' }}>▲</span>
          <span style={{ fontSize: 12, color: '#bdc3c7' }}>Resultados DC</span>
        </span>
        <button onClick={(e) => { e.stopPropagation(); onSimulate(); }} style={simulateBtnStyle}>
          ▶ Simular DC
        </button>
        <span style={{ fontSize: 10, color: '#5a6a7a' }}>Ctrl+J</span>
      </div>
    );
  }

  return (
    <div
      style={{
        height: 160,
        backgroundColor: '#2c3e50',
        borderTop: '2px solid #27ae60',
        display: 'flex',
        flexDirection: 'column',
        flexShrink: 0,
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          padding: '5px 14px',
          borderBottom: '1px solid #445566',
          flexShrink: 0,
          gap: 8,
        }}
      >
        <span style={{ fontWeight: 'bold', fontSize: 13, color: '#ecf0f1' }}>Resultados DC</span>
        <div style={{ flex: 1 }} />
        <button onClick={onSimulate} style={simulateBtnStyle}>
          ▶ Simular DC
        </button>
        <span
          onClick={onToggle}
          style={{ cursor: 'pointer', fontSize: 11, color: '#95a5a6' }}
        >
          ▼ Ocultar
        </span>
        <span style={{ fontSize: 10, color: '#5a6a7a' }}>Ctrl+J</span>
      </div>

      <div
        style={{
          flex: 1,
          overflow: 'auto',
          padding: '8px 14px',
          display: 'flex',
          gap: 10,
          flexWrap: 'wrap',
          alignContent: 'flex-start',
        }}
      >
        {simError && (
          <div style={{ fontSize: 12, color: '#e74c3c', padding: '8px' }}>
            {simError}
          </div>
        )}

        {!simResult && !simError && (
          <div style={{ fontSize: 12, color: '#7f8c8d', padding: '8px' }}>
            Presiona <strong>Simular DC</strong> para comenzar.
          </div>
        )}

        {simResult && simResult.components.map((r) => (
          <div
            key={r.id}
            style={{
              backgroundColor: '#34495e',
              borderRadius: 6,
              padding: '6px 10px',
              minWidth: 150,
            }}
          >
            <div style={{ fontSize: 10, color: '#95a5a6', marginBottom: 2 }}>{r.id}</div>
            <div style={{ fontSize: 12, fontFamily: 'monospace', lineHeight: 1.6 }}>
              <span style={{ color: '#85c1e9' }}>{formatVoltage(r.voltage)}</span>
              {' '}
              <span style={{ color: '#82e0aa' }}>{formatCurrent(r.current)}</span>
              {' '}
              <span style={{ color: '#f8c471' }}>{formatPower(r.power)}</span>
            </div>
          </div>
        ))}

        {simResult && simResult.components.length > 0 && (
          <div
            style={{
              backgroundColor: '#34495e',
              borderRadius: 6,
              padding: '6px 10px',
              minWidth: 100,
              border: '1px solid #5a6a7a',
            }}
          >
            <div style={{ fontSize: 10, color: '#95a5a6', marginBottom: 2 }}>Total</div>
            <div style={{ fontSize: 12, fontFamily: 'monospace', color: '#f8c471' }}>
              {formatPower(simResult.totalPower)}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SimulationPanel;
