import { useState, useEffect, useRef } from 'react';
import { useCircuitStore } from './hooks/useCircuitStore';
import { solveDC } from './core/Solver';
import Toolbar from './Components/Toolbar';
import TopMenuBar from './Components/TopMenuBar';
import Circuit from './Components/Circuit';
import SimulationPanel from './Components/SimulationPanel';
import ComponentDocsModal from './Components/ComponentDocsModal';
import AuthModal from './Components/AuthModal';
import ProfileModal from './Components/ProfileModal';
import ConfirmModal from './Components/ConfirmModal';
import ProjectNameModal from './Components/ProjectNameModal';
import type { SimulationResult } from './core/Solver';
import type { ComponentViewProfile } from './types';
import { authService, getStoredUser, type AuthUser } from './services/authService';
import { preferencesService } from './services/preferencesService';
import { circuitService, type CircuitProjectSummary } from './services/circuitService';

const PANEL_HEIGHT = 160;
const TAB_HEIGHT = 28;
const MIN_TOOLBAR = 160;
const MAX_TOOLBAR = 500;
const VIEW_PROFILE_STORAGE_KEY = 'mi-simulador-view-profile-v1';

const getInitialViewProfile = (): ComponentViewProfile => {
  const saved = localStorage.getItem(VIEW_PROFILE_STORAGE_KEY);
  if (saved === 'symbolic_iec' || saved === 'symbolic_ansi' || saved === 'realistic_2d') return saved;
  return 'symbolic_iec';
};

const App = () => {
  const { components, wires, junctions, replaceCircuit, getCircuitSnapshot } = useCircuitStore();
  const [simResult, setSimResult] = useState<SimulationResult | null>(null);
  const [simError, setSimError] = useState<string | null>(null);
  const [showSimPanel, setShowSimPanel] = useState(true);
  const [showToolbar, setShowToolbar] = useState(true);
  const [toolbarWidth, setToolbarWidth] = useState(260);
  const [showDocs, setShowDocs] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [activeViewProfile, setActiveViewProfile] = useState<ComponentViewProfile>(getInitialViewProfile);
  const [user, setUser] = useState<AuthUser | null>(getStoredUser());
  const [autoSyncEnabled, setAutoSyncEnabled] = useState(false);
  const [projects, setProjects] = useState<CircuitProjectSummary[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [projectNameModal, setProjectNameModal] = useState<{ mode: 'create' | 'rename'; initial: string } | null>(null);
  const [confirmAction, setConfirmAction] = useState<{ title: string; message: string; onConfirm: () => void } | null>(null);
  const isResizing = useRef(false);
  const autoSyncTimerRef = useRef<number | null>(null);

  useEffect(() => {
    localStorage.setItem(VIEW_PROFILE_STORAGE_KEY, activeViewProfile);
    void preferencesService.save({ activeViewProfile });
  }, [activeViewProfile]);

  useEffect(() => {
    const syncPrefsAndProjects = async () => {
      const prefs = await preferencesService.get();
      if (prefs.activeViewProfile) setActiveViewProfile(prefs.activeViewProfile);
      if (prefs.lastProjectId) setSelectedProjectId(prefs.lastProjectId);
      if (user) {
        const list = await circuitService.listProjects();
        setProjects(list);
      }
    };
    void syncPrefsAndProjects();
  }, [user?.id]);

  useEffect(() => {
    if (!user) return;
    void preferencesService.save({ lastProjectId: selectedProjectId });
  }, [selectedProjectId, user?.id]);

  const handleLogin = async (email: string, password: string) => {
    setUser(await authService.login(email, password));
  };

  const handleRegister = async (email: string, password: string, name: string) => {
    setUser(await authService.register(email, password, name));
  };

  const handleLogout = () => {
    authService.logout();
    setUser(null);
    setProjects([]);
    setSelectedProjectId('');
  };

  const confirmReplaceWith = (title: string, message: string, remote: { components: any[]; wires: any[]; junctions: any[] }) => {
    const local = getCircuitSnapshot();
    const hasLocalData = local.components.length > 0 || local.wires.length > 0 || local.junctions.length > 0;
    const differs = JSON.stringify(local) !== JSON.stringify(remote);
    if (hasLocalData && differs) {
      setConfirmAction({
        title,
        message,
        onConfirm: () => {
          replaceCircuit(remote);
          setConfirmAction(null);
        },
      });
      return;
    }
    replaceCircuit(remote);
  };

  const handleSaveCloudCircuit = async () => {
    if (!user) return;
    await circuitService.saveMyCircuit(getCircuitSnapshot());
  };

  const handleLoadCloudCircuit = async () => {
    if (!user) return;
    const remote = await circuitService.loadMyCircuit();
    if (!remote) return;
    confirmReplaceWith('Conflicto local vs nube', 'Hay cambios locales distintos. Deseas reemplazarlos con la version en nube?', remote);
  };

  useEffect(() => {
    if (!user || !autoSyncEnabled) return;
    if (autoSyncTimerRef.current) window.clearTimeout(autoSyncTimerRef.current);
    autoSyncTimerRef.current = window.setTimeout(() => {
      void circuitService.saveMyCircuit(getCircuitSnapshot());
    }, 1200);
    return () => {
      if (autoSyncTimerRef.current) window.clearTimeout(autoSyncTimerRef.current);
    };
  }, [components, wires, junctions, autoSyncEnabled, user?.id]);

  const handleCreateProject = () => {
    if (!user) return;
    setProjectNameModal({ mode: 'create', initial: `Proyecto ${projects.length + 1}` });
  };

  const handleRenameProject = () => {
    if (!user || !selectedProjectId) return;
    const current = projects.find((p) => p.id === selectedProjectId);
    setProjectNameModal({ mode: 'rename', initial: current?.name || '' });
  };

  const handleSubmitProjectName = async (name: string) => {
    const trimmed = name.trim();
    if (!trimmed || !user) {
      setProjectNameModal(null);
      return;
    }
    if (projectNameModal?.mode === 'create') {
      const created = await circuitService.createProject(trimmed);
      if (created) {
        setProjects(await circuitService.listProjects());
        setSelectedProjectId(created.id);
      }
    } else if (selectedProjectId) {
      await circuitService.saveProject(selectedProjectId, getCircuitSnapshot(), trimmed);
      setProjects(await circuitService.listProjects());
    }
    setProjectNameModal(null);
  };

  const handleSaveProject = async () => {
    if (!user || !selectedProjectId) return;
    await circuitService.saveProject(selectedProjectId, getCircuitSnapshot());
    setProjects(await circuitService.listProjects());
  };

  const handleLoadProject = async () => {
    if (!user || !selectedProjectId) return;
    const loaded = await circuitService.loadProject(selectedProjectId);
    if (!loaded) return;
    confirmReplaceWith('Cargar proyecto', 'El proyecto a cargar reemplazara el circuito local actual. Continuar?', loaded.circuit);
  };

  const handleDeleteProject = async () => {
    if (!user || !selectedProjectId) return;
    setConfirmAction({
      title: 'Borrar proyecto',
      message: 'Deseas borrar el proyecto seleccionado?',
      onConfirm: () => {
        void (async () => {
          await circuitService.deleteProject(selectedProjectId);
          const list = await circuitService.listProjects();
          setProjects(list);
          setSelectedProjectId(list[0]?.id || '');
          setConfirmAction(null);
        })();
      },
    });
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === 'j') {
        e.preventDefault();
        setShowSimPanel((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleSimulate = () => {
    try {
      const result = solveDC(components, wires, junctions);
      setSimResult(result);
      setSimError(result.components.length === 0 ? 'No hay componentes para simular.' : null);
      if (result.components.length > 0) setShowSimPanel(true);
    } catch {
      setSimResult(null);
      setSimError('Error al resolver el circuito.');
    }
  };

  const handleResizeStart = (e: React.MouseEvent) => {
    e.preventDefault();
    isResizing.current = true;
    const startX = e.clientX;
    const startWidth = toolbarWidth;
    const onMove = (evt: MouseEvent) => {
      if (!isResizing.current) return;
      const newWidth = Math.max(MIN_TOOLBAR, Math.min(MAX_TOOLBAR, startWidth + (evt.clientX - startX)));
      setToolbarWidth(newWidth);
    };
    const onUp = () => {
      isResizing.current = false;
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
    };
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  };

  const bottomOffset = showSimPanel ? PANEL_HEIGHT : TAB_HEIGHT;
  const sideOffset = showToolbar ? toolbarWidth + 5 : 22;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', width: '100vw', overflow: 'hidden' }}>
      <TopMenuBar
        showToolbar={showToolbar}
        onToggleToolbar={() => setShowToolbar((prev) => !prev)}
        userName={user?.name}
        onOpenAuth={() => setShowAuth(true)}
        onOpenProfile={() => setShowProfile(true)}
        onLogout={handleLogout}
        onSaveCloudCircuit={() => void handleSaveCloudCircuit()}
        onLoadCloudCircuit={() => void handleLoadCloudCircuit()}
        autoSyncEnabled={autoSyncEnabled}
        onToggleAutoSync={() => setAutoSyncEnabled((prev) => !prev)}
        activeViewProfile={activeViewProfile}
        onChangeViewProfile={setActiveViewProfile}
        projects={projects}
        selectedProjectId={selectedProjectId}
        onSelectProject={setSelectedProjectId}
        onCreateProject={handleCreateProject}
        onRenameProject={handleRenameProject}
        onSaveProject={() => void handleSaveProject()}
        onLoadProject={() => void handleLoadProject()}
        onDeleteProject={() => void handleDeleteProject()}
      />
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {showToolbar ? (
          <>
            <Toolbar
              width={toolbarWidth}
              onToggle={() => setShowToolbar(false)}
              onOpenDocs={() => setShowDocs(true)}
            />
            <div onMouseDown={handleResizeStart} style={{ width: 5, cursor: 'col-resize', backgroundColor: '#1a252f', flexShrink: 0, zIndex: 11 }} />
          </>
        ) : (
          <div onClick={() => setShowToolbar(true)} style={{ width: 22, backgroundColor: '#2c3e50', flexShrink: 0, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10 }} title="Mostrar panel">
            <span style={{ fontSize: 12, color: '#95a5a6' }}>▶</span>
          </div>
        )}
        <Circuit bottomOffset={bottomOffset} activeViewProfile={activeViewProfile} sideOffset={sideOffset} />
      </div>
      <SimulationPanel simResult={simResult} simError={simError} visible={showSimPanel} onToggle={() => setShowSimPanel((p) => !p)} onSimulate={handleSimulate} />
      {showDocs && <ComponentDocsModal onClose={() => setShowDocs(false)} />}
      {showAuth && <AuthModal onClose={() => setShowAuth(false)} onLogin={handleLogin} onRegister={handleRegister} />}
      {showProfile && user && <ProfileModal user={user} onClose={() => setShowProfile(false)} />}
      {projectNameModal && (
        <ProjectNameModal
          title={projectNameModal.mode === 'create' ? 'Nuevo proyecto' : 'Renombrar proyecto'}
          initialValue={projectNameModal.initial}
          onSubmit={(name) => void handleSubmitProjectName(name)}
          onCancel={() => setProjectNameModal(null)}
        />
      )}
      {confirmAction && <ConfirmModal title={confirmAction.title} message={confirmAction.message} onConfirm={confirmAction.onConfirm} onCancel={() => setConfirmAction(null)} />}
    </div>
  );
};

export default App;
