import { useEffect, useMemo, useState } from 'react';
import resistorDoc from '../docs/components/resistor.md?raw';
import capacitorDoc from '../docs/components/capacitor.md?raw';
import inductorDoc from '../docs/components/inductor.md?raw';
import batteryDoc from '../docs/components/battery.md?raw';

interface ComponentDocsModalProps {
  onClose: () => void;
}

const ComponentDocsModal = ({ onClose }: ComponentDocsModalProps) => {
  const components = [
    { id: 'resistor', label: 'Resistencia', content: resistorDoc },
    { id: 'capacitor', label: 'Capacitor', content: capacitorDoc },
    { id: 'inductor', label: 'Inductor', content: inductorDoc },
    { id: 'battery', label: 'Bateria', content: batteryDoc },
  ];

  const [filter, setFilter] = useState('');
  const [selectedId, setSelectedId] = useState('resistor');

  const filtered = useMemo(
    () => components.filter((c) => c.label.toLowerCase().includes(filter.toLowerCase())),
    [components, filter]
  );

  const selected = filtered.find((c) => c.id === selectedId) || filtered[0] || components[0];

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  useEffect(() => {
    if (!filtered.some((c) => c.id === selectedId) && filtered[0]) {
      setSelectedId(filtered[0].id);
    }
  }, [filtered, selectedId]);

  const renderInlineCode = (text: string) => {
    const parts = text.split(/(`[^`]+`)/g);
    return parts.map((part, idx) => {
      if (part.startsWith('`') && part.endsWith('`')) {
        return (
          <code
            key={`${part}-${idx}`}
            style={{
              backgroundColor: '#2d4255',
              border: '1px solid #476079',
              borderRadius: '4px',
              padding: '1px 5px',
              color: '#f8f3c2',
              fontSize: '12px',
            }}
          >
            {part.slice(1, -1)}
          </code>
        );
      }
      return <span key={`${part}-${idx}`}>{part}</span>;
    });
  };

  const renderMarkdown = (markdown: string) => {
    const lines = markdown.split('\n').filter((line) => line.trim().length > 0);
    return lines.map((line, idx) => {
      if (line.startsWith('# ')) {
        return <h2 key={idx} style={{ margin: '0 0 10px 0', color: '#ecf0f1' }}>{line.slice(2)}</h2>;
      }
      if (line.startsWith('## ')) {
        return <h3 key={idx} style={{ margin: '18px 0 8px 0', color: '#85c1e9' }}>{line.slice(3)}</h3>;
      }
      if (line.startsWith('- ')) {
        return (
          <div key={idx} style={{ margin: '4px 0', color: '#dfe6eb' }}>
            {'- '}
            {renderInlineCode(line.slice(2))}
          </div>
        );
      }
      return (
        <p key={idx} style={{ margin: '8px 0', color: '#dfe6eb' }}>
          {renderInlineCode(line)}
        </p>
      );
    });
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0,0,0,0.55)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 120,
        padding: '20px',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        style={{
          width: 'min(980px, 100%)',
          maxHeight: '85vh',
          backgroundColor: '#1f2d3a',
          borderRadius: '12px',
          border: '1px solid #3d5366',
          boxShadow: '0 12px 38px rgba(0,0,0,0.45)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '12px 14px',
            backgroundColor: '#263746',
            borderBottom: '1px solid #3d5366',
            color: '#ecf0f1',
          }}
        >
          <strong>Documentacion de componentes</strong>
          <button
            onClick={onClose}
            style={{
              border: '1px solid #5c7388',
              background: 'transparent',
              color: '#ecf0f1',
              borderRadius: '6px',
              padding: '6px 10px',
              cursor: 'pointer',
            }}
          >
            Cerrar
          </button>
        </div>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '240px 1fr',
            minHeight: 0,
            flex: 1,
          }}
        >
          <div style={{ borderRight: '1px solid #3d5366', padding: '12px', overflow: 'auto' }}>
            <input
              type="text"
              placeholder="Buscar componente..."
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              style={{
                width: '100%',
                padding: '8px',
                borderRadius: '6px',
                border: '1px solid #4f6881',
                backgroundColor: '#243646',
                color: '#ecf0f1',
                marginBottom: '10px',
                outline: 'none',
              }}
            />
            {filtered.map((item) => (
              <button
                key={item.id}
                onClick={() => setSelectedId(item.id)}
                style={{
                  width: '100%',
                  textAlign: 'left',
                  padding: '8px 10px',
                  marginBottom: '6px',
                  borderRadius: '6px',
                  border: selected?.id === item.id ? '1px solid #5dade2' : '1px solid #3d5366',
                  backgroundColor: selected?.id === item.id ? '#2b4458' : '#1f2d3a',
                  color: '#ecf0f1',
                  cursor: 'pointer',
                }}
              >
                {item.label}
              </button>
            ))}
            {filtered.length === 0 && <div style={{ color: '#aebcc9', fontSize: '12px' }}>Sin resultados.</div>}
          </div>
          <div style={{ padding: '16px 18px', overflow: 'auto', fontSize: '14px', lineHeight: 1.55 }}>
            {selected ? renderMarkdown(selected.content) : <div style={{ color: '#aebcc9' }}>Selecciona un componente.</div>}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ComponentDocsModal;
