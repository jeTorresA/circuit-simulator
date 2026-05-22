import { useState } from 'react';

interface AuthModalProps {
  onClose: () => void;
  onLogin: (email: string, password: string) => Promise<void>;
  onRegister: (email: string, password: string, name: string) => Promise<void>;
}

const AuthModal = ({ onClose, onLogin, onRegister }: AuthModalProps) => {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const submit = async () => {
    setError('');
    try {
      if (mode === 'login') await onLogin(email, password);
      else await onRegister(email, password, name || 'Usuario');
      onClose();
    } catch (e: any) {
      setError(e?.message || 'Error de autenticacion');
    }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 130 }}>
      <div style={{ width: 'min(360px, calc(100vw - 24px))', backgroundColor: '#1f2d3a', border: '1px solid #3d5366', borderRadius: 10, padding: 16, boxSizing: 'border-box' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <strong style={{ color: '#ecf0f1' }}>{mode === 'login' ? 'Iniciar sesion' : 'Crear cuenta'}</strong>
          <button onClick={onClose} style={{ background: 'transparent', border: '1px solid #5c7388', color: '#ecf0f1', borderRadius: 6, padding: '4px 8px' }}>Cerrar</button>
        </div>
        {mode === 'register' && <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nombre" style={{ width: '100%', boxSizing: 'border-box', marginBottom: 8, padding: 8, borderRadius: 6, border: '1px solid #4f6881', background: '#243646', color: '#ecf0f1' }} />}
        <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" style={{ width: '100%', boxSizing: 'border-box', marginBottom: 8, padding: 8, borderRadius: 6, border: '1px solid #4f6881', background: '#243646', color: '#ecf0f1' }} />
        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" style={{ width: '100%', boxSizing: 'border-box', marginBottom: 8, padding: 8, borderRadius: 6, border: '1px solid #4f6881', background: '#243646', color: '#ecf0f1' }} />
        {error && <div style={{ color: '#ff9e9e', fontSize: 12, marginBottom: 8 }}>{error}</div>}
        <button onClick={() => void submit()} style={{ width: '100%', boxSizing: 'border-box', padding: 8, border: 'none', borderRadius: 6, backgroundColor: '#27ae60', color: '#fff', marginBottom: 8 }}>
          {mode === 'login' ? 'Entrar' : 'Registrarme'}
        </button>
        <button onClick={() => setMode(mode === 'login' ? 'register' : 'login')} style={{ width: '100%', boxSizing: 'border-box', padding: 8, border: '1px solid #5c7388', borderRadius: 6, background: 'transparent', color: '#ecf0f1' }}>
          {mode === 'login' ? 'Crear cuenta' : 'Ya tengo cuenta'}
        </button>
      </div>
    </div>
  );
};

export default AuthModal;
