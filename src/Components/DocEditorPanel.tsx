interface DocEditorPanelProps {
  value: string;
  onChange: (value: string) => void;
  onSave: () => void;
  onReset: () => void;
}

const DocEditorPanel = ({ value, onChange, onSave, onReset }: DocEditorPanelProps) => {
  return (
    <>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          width: '100%',
          boxSizing: 'border-box',
          minHeight: '340px',
          backgroundColor: '#182532',
          color: '#ecf0f1',
          border: '1px solid #4f6881',
          borderRadius: '8px',
          padding: '10px',
          outline: 'none',
          resize: 'vertical',
          fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
          fontSize: '12px',
        }}
      />
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '10px' }}>
        <button
          onClick={onReset}
          style={{
            border: '1px solid #5c7388',
            background: 'transparent',
            color: '#ecf0f1',
            borderRadius: '6px',
            padding: '6px 10px',
            cursor: 'pointer',
          }}
        >
          Reset
        </button>
        <button
          onClick={onSave}
          style={{
            border: '1px solid #27ae60',
            background: '#27ae60',
            color: '#fff',
            borderRadius: '6px',
            padding: '6px 10px',
            cursor: 'pointer',
          }}
        >
          Guardar borrador
        </button>
      </div>
    </>
  );
};

export default DocEditorPanel;
