import type { AuthUser } from '../services/authService';

interface ProfileModalProps {
  user: AuthUser;
  onClose: () => void;
}

const ProfileModal = ({ user, onClose }: ProfileModalProps) => {
  return (
    <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 130 }}>
      <div style={{ width: 380, backgroundColor: '#1f2d3a', border: '1px solid #3d5366', borderRadius: 10, padding: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <strong style={{ color: '#ecf0f1' }}>Perfil</strong>
          <button onClick={onClose} style={{ background: 'transparent', border: '1px solid #5c7388', color: '#ecf0f1', borderRadius: 6, padding: '4px 8px' }}>Cerrar</button>
        </div>
        <div style={{ color: '#d7e4ef', fontSize: 13, lineHeight: 1.8 }}>
          <div><strong>ID:</strong> {user.id}</div>
          <div><strong>Nombre:</strong> {user.name}</div>
          <div><strong>Email:</strong> {user.email}</div>
        </div>
      </div>
    </div>
  );
};

export default ProfileModal;
