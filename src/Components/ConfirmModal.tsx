interface ConfirmModalProps {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

const ConfirmModal = ({ title, message, confirmLabel = 'Confirmar', cancelLabel = 'Cancelar', onConfirm, onCancel }: ConfirmModalProps) => {
  return (
    <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 140 }}>
      <div style={{ width: 'min(420px, calc(100vw - 24px))', backgroundColor: '#1f2d3a', border: '1px solid #3d5366', borderRadius: 10, padding: 16, boxSizing: 'border-box' }}>
        <strong style={{ color: '#ecf0f1' }}>{title}</strong>
        <div style={{ color: '#d7e4ef', fontSize: 13, marginTop: 10, marginBottom: 14 }}>{message}</div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <button onClick={onCancel} style={{ border: '1px solid #5c7388', background: 'transparent', color: '#ecf0f1', borderRadius: 6, padding: '6px 10px' }}>{cancelLabel}</button>
          <button onClick={onConfirm} style={{ border: '1px solid #27ae60', background: '#27ae60', color: '#fff', borderRadius: 6, padding: '6px 10px' }}>{confirmLabel}</button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;
