import { useState } from 'react';
import type { ReactNode } from 'react';
import type { ComponentViewProfile } from '../types';
import type { CircuitProjectSummary } from '../services/circuitService';

interface TopMenuBarProps {
  showToolbar: boolean;
  onToggleToolbar: () => void;
  userName?: string;
  onOpenAuth: () => void;
  onOpenProfile: () => void;
  onLogout: () => void;
  onSaveCloudCircuit: () => void;
  onLoadCloudCircuit: () => void;
  autoSyncEnabled: boolean;
  onToggleAutoSync: () => void;
  activeViewProfile: ComponentViewProfile;
  onChangeViewProfile: (profile: ComponentViewProfile) => void;
  projects: CircuitProjectSummary[];
  selectedProjectId: string;
  onSelectProject: (projectId: string) => void;
  onCreateProject: () => void;
  onRenameProject: () => void;
  onSaveProject: () => void;
  onLoadProject: () => void;
  onDeleteProject: () => void;
}

const menuButtonStyle = {
  background: 'transparent',
  border: 'none',
  color: '#cfd9e2',
  fontSize: '12px',
  padding: '7px 10px',
  cursor: 'pointer',
};

const itemStyle = {
  display: 'block',
  width: '100%',
  textAlign: 'left' as const,
  border: 'none',
  background: 'transparent',
  color: '#dfe8ef',
  fontSize: '12px',
  padding: '7px 10px',
  cursor: 'pointer',
};

const TopMenuBar = ({
  showToolbar,
  onToggleToolbar,
  userName,
  onOpenAuth,
  onOpenProfile,
  onLogout,
  onSaveCloudCircuit,
  onLoadCloudCircuit,
  autoSyncEnabled,
  onToggleAutoSync,
  activeViewProfile,
  onChangeViewProfile,
  projects,
  selectedProjectId,
  onSelectProject,
  onCreateProject,
  onRenameProject,
  onSaveProject,
  onLoadProject,
  onDeleteProject,
}: TopMenuBarProps) => {
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [hoveredTop, setHoveredTop] = useState<string | null>(null);
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);

  const topButtonStyle = (id: string) => ({
    ...menuButtonStyle,
    color: hoveredTop === id || openMenu === id ? '#eef4f8' : '#cfd9e2',
    borderBottom: hoveredTop === id || openMenu === id ? '2px solid #6ea7d1' : '2px solid transparent',
    outline: 'none',
  });

  const menuItemStyle = (id: string, baseColor = '#dfe8ef') => ({
    ...itemStyle,
    color: hoveredItem === id ? '#ffffff' : baseColor,
    backgroundColor: hoveredItem === id ? '#2b4357' : 'transparent',
    outline: 'none',
  });

  const menu = (id: string, label: string, content: ReactNode, minWidth = 200) => (
    <div onMouseEnter={() => setOpenMenu(id)} onMouseLeave={() => setOpenMenu((curr) => (curr === id ? null : curr))} style={{ position: 'relative' }}>
      <button
        style={topButtonStyle(id)}
        onMouseEnter={() => setHoveredTop(id)}
        onMouseLeave={() => setHoveredTop((curr) => (curr === id ? null : curr))}
      >
        {label}
      </button>
      {openMenu === id && (
        <div style={{ position: 'absolute', top: '100%', left: 0, minWidth, backgroundColor: '#223240', border: '1px solid #3d5366', borderRadius: 8, boxShadow: '0 10px 24px rgba(0,0,0,0.28)', zIndex: 50, padding: '4px 0' }}>
          {content}
        </div>
      )}
    </div>
  );

  return (
    <div style={{ height: 34, backgroundColor: '#1b2a36', borderBottom: '1px solid #34495e', display: 'flex', alignItems: 'center', padding: '0 8px', gap: 4 }}>
      <button
        onClick={onToggleToolbar}
        style={{ ...topButtonStyle('sidebar'), color: hoveredTop === 'sidebar' ? '#eef4f8' : '#b8c9d6' }}
        onMouseEnter={() => setHoveredTop('sidebar')}
        onMouseLeave={() => setHoveredTop((curr) => (curr === 'sidebar' ? null : curr))}
      >
        {showToolbar ? 'Ocultar panel' : 'Mostrar panel'}
      </button>

      {menu(
        'view',
        'Vista',
        <>
          <button style={menuItemStyle('view-iec')} onMouseEnter={() => setHoveredItem('view-iec')} onMouseLeave={() => setHoveredItem(null)} onClick={() => onChangeViewProfile('symbolic_iec')}>{activeViewProfile === 'symbolic_iec' ? '• ' : ''}Simbolica IEC</button>
          <button style={menuItemStyle('view-ansi')} onMouseEnter={() => setHoveredItem('view-ansi')} onMouseLeave={() => setHoveredItem(null)} onClick={() => onChangeViewProfile('symbolic_ansi')}>{activeViewProfile === 'symbolic_ansi' ? '• ' : ''}Simbolica ANSI</button>
          <button style={menuItemStyle('view-real')} onMouseEnter={() => setHoveredItem('view-real')} onMouseLeave={() => setHoveredItem(null)} onClick={() => onChangeViewProfile('realistic_2d')}>{activeViewProfile === 'realistic_2d' ? '• ' : ''}Realista 2D</button>
        </>
      )}

      {menu(
        'cloud',
        'Nube',
        <>
          <button style={menuItemStyle('cloud-save')} onMouseEnter={() => setHoveredItem('cloud-save')} onMouseLeave={() => setHoveredItem(null)} onClick={onSaveCloudCircuit}>Guardar circuito en nube</button>
          <button style={menuItemStyle('cloud-load')} onMouseEnter={() => setHoveredItem('cloud-load')} onMouseLeave={() => setHoveredItem(null)} onClick={onLoadCloudCircuit}>Cargar circuito de nube</button>
          <button
            style={menuItemStyle('cloud-autosync', autoSyncEnabled ? '#7ee0a0' : '#ff9f9f')}
            onMouseEnter={() => setHoveredItem('cloud-autosync')}
            onMouseLeave={() => setHoveredItem(null)}
            onClick={onToggleAutoSync}
          >
            Auto-sync: {autoSyncEnabled ? 'ON' : 'OFF'}
          </button>
        </>
      )}

      {menu(
        'projects',
        `Proyectos${selectedProjectId ? '' : ' (sin seleccionar)'}`,
        <>
          <button style={menuItemStyle('prj-new')} onMouseEnter={() => setHoveredItem('prj-new')} onMouseLeave={() => setHoveredItem(null)} onClick={onCreateProject}>Nuevo proyecto</button>
          <button style={menuItemStyle('prj-rename')} onMouseEnter={() => setHoveredItem('prj-rename')} onMouseLeave={() => setHoveredItem(null)} onClick={onRenameProject}>Renombrar proyecto</button>
          <button style={menuItemStyle('prj-save')} onMouseEnter={() => setHoveredItem('prj-save')} onMouseLeave={() => setHoveredItem(null)} onClick={onSaveProject}>Guardar proyecto</button>
          <button style={menuItemStyle('prj-load')} onMouseEnter={() => setHoveredItem('prj-load')} onMouseLeave={() => setHoveredItem(null)} onClick={onLoadProject}>Cargar proyecto</button>
          <button style={menuItemStyle('prj-delete', '#ffb7b7')} onMouseEnter={() => setHoveredItem('prj-delete')} onMouseLeave={() => setHoveredItem(null)} onClick={onDeleteProject}>Borrar proyecto</button>
          <div style={{ borderTop: '1px solid #3d5366', margin: '4px 0' }} />
          <div style={{ padding: '4px 10px', color: '#90a4b5', fontSize: '11px' }}>Seleccionar:</div>
          {projects.length === 0 && <div style={{ padding: '4px 10px', color: '#90a4b5', fontSize: '11px' }}>No hay proyectos</div>}
          {projects.slice(0, 8).map((p) => (
            <button key={p.id} style={menuItemStyle(`prj-sel-${p.id}`)} onMouseEnter={() => setHoveredItem(`prj-sel-${p.id}`)} onMouseLeave={() => setHoveredItem(null)} onClick={() => onSelectProject(p.id)}>{selectedProjectId === p.id ? '• ' : ''}{p.name}</button>
          ))}
        </>,
        240
      )}

      <div style={{ marginLeft: 'auto' }}>
        {menu(
          'account',
          userName ? `Cuenta: ${userName}` : 'Cuenta',
          userName ? (
            <>
              <button style={menuItemStyle('acc-profile')} onMouseEnter={() => setHoveredItem('acc-profile')} onMouseLeave={() => setHoveredItem(null)} onClick={onOpenProfile}>Ver perfil</button>
              <button style={menuItemStyle('acc-logout')} onMouseEnter={() => setHoveredItem('acc-logout')} onMouseLeave={() => setHoveredItem(null)} onClick={onLogout}>Cerrar sesion</button>
            </>
          ) : (
            <button style={menuItemStyle('acc-login')} onMouseEnter={() => setHoveredItem('acc-login')} onMouseLeave={() => setHoveredItem(null)} onClick={onOpenAuth}>Login / Registro</button>
          ),
          180
        )}
      </div>
    </div>
  );
};

export default TopMenuBar;
