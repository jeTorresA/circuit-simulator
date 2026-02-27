interface FloatingAlertProps {
  message: string;
  visible: boolean;
}

const FloatingAlert = ({ message, visible }: FloatingAlertProps) => {
  if (!visible) return null;

  return (
    <div
      style={{
        position: 'absolute',
        top: '16px',
        right: '16px',
        zIndex: 20,
        padding: '10px 14px',
        borderRadius: '8px',
        backgroundColor: '#e74c3c',
        color: '#fff',
        fontWeight: 600,
        boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
        pointerEvents: 'none',
      }}
      role="alert"
      aria-live="polite"
    >
      {message}
    </div>
  );
};

export default FloatingAlert;
