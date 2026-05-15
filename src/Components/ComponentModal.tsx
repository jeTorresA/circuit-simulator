import { useState, useEffect, useRef } from 'react';

interface ComponentModalProps {
  componentId: string;
  componentType: string;
  currentValue: number;
  onSave: (id: string, value: number) => void;
  onClose: () => void;
}

const TYPE_LABELS: Record<string, string> = {
  resistor: 'Resistencia',
  capacitor: 'Capacitor',
  inductor: 'Inductor',
  battery: 'Batería',
};

const TYPE_UNITS: Record<string, string> = {
  resistor: 'Ω',
  capacitor: 'F',
  inductor: 'H',
  battery: 'V',
};

const ComponentModal = ({ componentId, componentType, currentValue, onSave, onClose }: ComponentModalProps) => {
  const [value, setValue] = useState(String(currentValue));
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
    inputRef.current?.select();
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const handleSave = () => {
    const parsed = parseFloat(value);
    if (!isNaN(parsed) && parsed >= 0) {
      onSave(componentId, parsed);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0,0,0,0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 100,
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        style={{
          backgroundColor: '#2c3e50',
          padding: '24px',
          borderRadius: '12px',
          color: 'white',
          minWidth: '280px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3 style={{ margin: '0 0 4px 0', fontSize: '16px' }}>Editar componente</h3>
        <div style={{ fontSize: '12px', color: '#bdc3c7', marginBottom: '16px' }}>
          {TYPE_LABELS[componentType] || componentType} &middot; {componentId}
        </div>

        <label style={{ fontSize: '13px', display: 'block', marginBottom: '6px' }}>
          Valor
        </label>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <input
            ref={inputRef}
            type="number"
            step="any"
            min="0"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSave();
            }}
            style={{
              flex: 1,
              padding: '8px 10px',
              borderRadius: '6px',
              border: '1px solid #5a6a7a',
              backgroundColor: '#1a252f',
              color: 'white',
              fontSize: '14px',
              outline: 'none',
            }}
          />
          <span style={{ fontSize: '14px', fontWeight: 'bold', color: '#85c1e9', minWidth: '20px' }}>
            {TYPE_UNITS[componentType] || ''}
          </span>
        </div>

        <div style={{ display: 'flex', gap: '8px', marginTop: '20px', justifyContent: 'flex-end' }}>
          <button
            onClick={onClose}
            style={{
              padding: '8px 16px',
              borderRadius: '6px',
              border: '1px solid #5a6a7a',
              backgroundColor: 'transparent',
              color: 'white',
              cursor: 'pointer',
              fontSize: '13px',
            }}
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            style={{
              padding: '8px 16px',
              borderRadius: '6px',
              border: 'none',
              backgroundColor: '#27ae60',
              color: 'white',
              cursor: 'pointer',
              fontWeight: 'bold',
              fontSize: '13px',
            }}
          >
            Guardar
          </button>
        </div>
      </div>
    </div>
  );
};

export default ComponentModal;
