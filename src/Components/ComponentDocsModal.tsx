import { useEffect, useMemo, useState } from 'react';
import resistorDoc from '../docs/components/resistor.md?raw';
import capacitorDoc from '../docs/components/capacitor.md?raw';
import inductorDoc from '../docs/components/inductor.md?raw';
import batteryDoc from '../docs/components/battery.md?raw';
import SimpleMarkdownRenderer from './SimpleMarkdownRenderer';
import ConfirmModal from './ConfirmModal';
import { docsService, type ComponentDocVersion, type CustomDocSummary } from '../services/componentDocs';
import { getComponentCatalog, type ComponentDocItem } from '../services/componentCatalog';
import { preferencesService } from '../services/preferencesService';
import { mediaService } from '../services/mediaService';

interface ComponentDocsModalProps {
  onClose: () => void;
}

const LAST_DOC_COMPONENT_STORAGE_KEY = 'mi-simulador-last-doc-component-v1';
type DocDraftMap = Record<string, string>;
type StudioMode = 'read' | 'edit' | 'split';
type DocEntry = {
  id: string;
  label: string;
  content: string;
  kind: 'component' | 'custom';
  rawId: string;
  relatedComponentId?: string | null;
};

const ComponentDocsModal = ({ onClose }: ComponentDocsModalProps) => {
  const initialComponents: ComponentDocItem[] = [
    { id: 'resistor', label: 'Resistencia', content: resistorDoc },
    { id: 'capacitor', label: 'Capacitor', content: capacitorDoc },
    { id: 'inductor', label: 'Inductor', content: inductorDoc },
    { id: 'battery', label: 'Bateria', content: batteryDoc },
  ];

  const [components, setComponents] = useState<ComponentDocItem[]>(initialComponents);
  const [customDocs, setCustomDocs] = useState<CustomDocSummary[]>([]);
  const [filter, setFilter] = useState('');
  const [isFilterFocused, setIsFilterFocused] = useState(false);
  const [studioMode, setStudioMode] = useState<StudioMode>('split');
  const [editorValue, setEditorValue] = useState('');
  const [docDrafts, setDocDrafts] = useState<DocDraftMap>({});
  const [docMeta, setDocMeta] = useState<{ updatedAt?: string; updatedBy?: string } | null>(null);
  const [selectedId, setSelectedId] = useState(() => localStorage.getItem(LAST_DOC_COMPONENT_STORAGE_KEY) || 'resistor');
  const [history, setHistory] = useState<ComponentDocVersion[]>([]);
  const [newDocTitle, setNewDocTitle] = useState('');
  const [newDocRelatedComponentId, setNewDocRelatedComponentId] = useState('');
  const [confirmAction, setConfirmAction] = useState<{ title: string; message: string; confirmLabel?: string; onConfirm: () => void } | null>(null);

  const entries = useMemo<DocEntry[]>(() => {
    const componentEntries = components.map((c) => ({ id: `component:${c.id}`, label: c.label, content: c.content, kind: 'component' as const, rawId: c.id }));
    const customEntries = customDocs.map((c) => ({
      id: `custom:${c.id}`,
      label: c.title,
      content: '',
      kind: 'custom' as const,
      rawId: c.id,
      relatedComponentId: c.relatedComponentId,
    }));
    return [...componentEntries, ...customEntries];
  }, [components, customDocs]);

  const filtered = useMemo(() => entries.filter((c) => c.label.toLowerCase().includes(filter.toLowerCase())), [entries, filter]);
  const selected = filtered.find((c) => c.id === selectedId) || filtered[0] || entries[0];
  const selectedContent = selected ? (docDrafts[selected.id] ?? selected.content) : '';

  useEffect(() => {
    const load = async () => {
      const catalog = await getComponentCatalog(initialComponents);
      const drafts = await docsService.getDraftMap(catalog.map((item) => item.id));
      const mappedComponentDrafts = Object.fromEntries(
        Object.entries(drafts).map(([id, markdown]) => [`component:${id}`, markdown])
      ) as DocDraftMap;
      const custom = await docsService.listCustomDocs();
      const prefs = await preferencesService.get();
      setComponents(catalog);
      setCustomDocs(custom);
      setDocDrafts(mappedComponentDrafts);
      const preferredComponent = prefs.lastViewedComponentDocId ? `component:${prefs.lastViewedComponentDocId}` : '';
      if (preferredComponent && [...catalog.map((item) => `component:${item.id}`), ...custom.map((item) => `custom:${item.id}`)].includes(preferredComponent)) {
        setSelectedId(preferredComponent);
      }
    };
    void load();
  }, []);

  useEffect(() => {
    if (!selected) return;
    setEditorValue(docDrafts[selected.id] ?? (selected.content || ''));
    void (async () => {
      if (selected.kind === 'component') {
        const details = await docsService.getDocDetails(selected.rawId);
        setDocMeta(details ? { updatedAt: details.updatedAt, updatedBy: details.updatedBy } : null);
        setHistory(await docsService.getDocHistory(selected.rawId));
      } else {
        const details = await docsService.getCustomDoc(selected.rawId);
        if (details) {
          setEditorValue(docDrafts[selected.id] ?? details.markdown);
        }
        setDocMeta(details ? { updatedAt: details.updatedAt, updatedBy: details.updatedBy } : null);
        setHistory(await docsService.getCustomDocHistory(selected.rawId));
      }
    })();
  }, [selected, docDrafts]);

  useEffect(() => {
    if (!selectedId) return;
    localStorage.setItem(LAST_DOC_COMPONENT_STORAGE_KEY, selectedId);
    if (selectedId.startsWith('component:')) {
      void preferencesService.save({ lastViewedComponentDocId: selectedId.replace('component:', '') });
    }
  }, [selectedId]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.ctrlKey && e.key.toLowerCase() === 's') {
        e.preventDefault();
        void handleSaveDraft();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  });

  const handleSaveDraft = async () => {
    if (!selected) return;
    if (selected.kind === 'component') {
      await docsService.saveDraft(selected.rawId, editorValue);
    } else {
      await docsService.saveCustomDoc(selected.rawId, editorValue);
    }
    setDocDrafts((prev) => ({ ...prev, [selected.id]: editorValue }));
    const details = selected.kind === 'component' ? await docsService.getDocDetails(selected.rawId) : await docsService.getCustomDoc(selected.rawId);
    setDocMeta(details ? { updatedAt: details.updatedAt, updatedBy: details.updatedBy } : null);
  };

  const handleResetDraft = async () => {
    if (!selected) return;
    if (selected.kind === 'component') {
      await docsService.resetDraft(selected.rawId);
    }
    setDocDrafts((prev) => {
      const next = { ...prev };
      delete next[selected.id];
      return next;
    });
    setEditorValue(selected.content);
    setDocMeta(null);
  };

  const handleCreateCustomDoc = async () => {
    const title = newDocTitle.trim();
    if (!title) return;
    const relatedComponentId = newDocRelatedComponentId.trim() || undefined;
    const created = await docsService.createCustomDoc(title, relatedComponentId);
    if (!created) return;
    const list = await docsService.listCustomDocs();
    setCustomDocs(list);
    setNewDocTitle('');
    setNewDocRelatedComponentId('');
    setSelectedId(`custom:${created.id}`);
  };

  const handleDeleteSelectedCustomDoc = async () => {
    if (!selected || selected.kind !== 'custom') return;
    const ok = await docsService.deleteCustomDoc(selected.rawId);
    if (!ok) return;
    const list = await docsService.listCustomDocs();
    setCustomDocs(list);
    setDocDrafts((prev) => {
      const next = { ...prev };
      delete next[selected.id];
      return next;
    });
    const fallback = entries.find((entry) => entry.kind === 'component') || entries[0];
    setSelectedId(fallback?.id || '');
  };

  const requestDeleteSelectedCustomDoc = () => {
    if (!selected || selected.kind !== 'custom') return;
    setConfirmAction({
      title: 'Eliminar documento',
      message: `Esta accion eliminara "${selected.label}" y su historial. Deseas continuar?`,
      confirmLabel: 'Eliminar',
      onConfirm: () => {
        setConfirmAction(null);
        void handleDeleteSelectedCustomDoc();
      },
    });
  };

  const requestResetDraft = () => {
    if (!selected) return;
    setConfirmAction({
      title: 'Resetear contenido',
      message: 'Se descartaran cambios no guardados del documento actual. Continuar?',
      confirmLabel: 'Resetear',
      onConfirm: () => {
        setConfirmAction(null);
        void handleResetDraft();
      },
    });
  };

  const insertSnippet = (snippet: string) => {
    setEditorValue((prev) => `${prev}${prev.endsWith('\n') ? '' : '\n'}${snippet}`);
  };

  const handleUploadMedia = async (accept: string, asVideo = false) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = accept;
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;
      const uploaded = await mediaService.uploadFile(file);
      if (!uploaded) return;
      insertSnippet(asVideo ? `<video controls src="${uploaded.url}"></video>` : `![${uploaded.originalName}](${uploaded.url})`);
    };
    input.click();
  };

  return (
    <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 120, padding: 20 }} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div style={{ width: 'min(1180px, 100%)', maxHeight: '88vh', backgroundColor: '#1f2d3a', borderRadius: 12, border: '1px solid #3d5366', boxShadow: '0 12px 38px rgba(0,0,0,0.45)', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', backgroundColor: '#263746', borderBottom: '1px solid #3d5366', color: '#ecf0f1' }}>
          <strong>Documentation Studio</strong>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => setStudioMode('read')} style={{ border: '1px solid #5c7388', background: studioMode === 'read' ? '#2b4458' : 'transparent', color: '#ecf0f1', borderRadius: 6, padding: '6px 10px' }}>Lectura</button>
            <button onClick={() => setStudioMode('edit')} style={{ border: '1px solid #5c7388', background: studioMode === 'edit' ? '#2b4458' : 'transparent', color: '#ecf0f1', borderRadius: 6, padding: '6px 10px' }}>Editor</button>
            <button onClick={() => setStudioMode('split')} style={{ border: '1px solid #5c7388', background: studioMode === 'split' ? '#2b4458' : 'transparent', color: '#ecf0f1', borderRadius: 6, padding: '6px 10px' }}>Split</button>
            <button onClick={onClose} style={{ border: '1px solid #5c7388', background: 'transparent', color: '#ecf0f1', borderRadius: 6, padding: '6px 10px' }}>Cerrar</button>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '250px 1fr 260px', minHeight: 0, flex: 1, overflow: 'hidden' }}>
          <div style={{ borderRight: '1px solid #3d5366', padding: 12, overflow: 'auto', minHeight: 0 }}>
            <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
              <input
                value={newDocTitle}
                onChange={(e) => setNewDocTitle(e.target.value)}
                placeholder="Nueva doc (titulo)"
                style={{ flex: 1, minWidth: 0, boxSizing: 'border-box', padding: '8px 2px', border: 'none', borderBottom: '1px solid #4f6881', backgroundColor: 'transparent', color: '#ecf0f1', outline: 'none' }}
              />
              <button onClick={() => void handleCreateCustomDoc()} style={{ border: '1px solid #5c7388', background: 'transparent', color: '#ecf0f1', borderRadius: 6, padding: '4px 8px' }}>Crear</button>
            </div>
            <select
              value={newDocRelatedComponentId}
              onChange={(e) => setNewDocRelatedComponentId(e.target.value)}
              style={{ width: '100%', boxSizing: 'border-box', marginBottom: 10, padding: '7px 8px', borderRadius: 6, border: '1px solid #4f6881', backgroundColor: '#1a2835', color: '#ecf0f1' }}
            >
              <option value="">Relacion opcional: General</option>
              {components.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.label}
                </option>
              ))}
            </select>
            <input
              type="text"
              placeholder="Buscar documentacion..."
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              onFocus={() => setIsFilterFocused(true)}
              onBlur={() => setIsFilterFocused(false)}
              style={{ width: '100%', boxSizing: 'border-box', padding: '8px 2px', border: 'none', borderBottom: isFilterFocused ? '1px solid #7fb3d5' : '1px solid #4f6881', backgroundColor: 'transparent', color: '#ecf0f1', marginBottom: 10, outline: 'none', transition: 'border-bottom-color 140ms ease' }}
            />
            {filtered.map((item) => (
              <button key={item.id} onClick={() => setSelectedId(item.id)} style={{ width: '100%', boxSizing: 'border-box', textAlign: 'left', padding: '8px 10px', marginBottom: 6, borderRadius: 6, border: selected?.id === item.id ? '1px solid #5dade2' : '1px solid #3d5366', backgroundColor: selected?.id === item.id ? '#2b4458' : '#1f2d3a', color: '#ecf0f1', cursor: 'pointer' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.label}</span>
                  <span style={{ fontSize: 10, borderRadius: 999, padding: '2px 7px', border: '1px solid #577087', color: '#bdd3e4', flexShrink: 0 }}>
                    {item.kind === 'component' ? 'Componente' : 'General'}
                  </span>
                </div>
              </button>
            ))}
          </div>

          <div style={{ padding: '12px 14px', minWidth: 0, display: 'flex', flexDirection: 'column', gap: 10, minHeight: 0, overflow: 'hidden' }}>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
              <button onClick={() => insertSnippet('## Titulo de seccion')} style={{ border: '1px solid #5c7388', background: 'transparent', color: '#ecf0f1', borderRadius: 6, padding: '5px 8px' }}>+ H2</button>
              <button onClick={() => insertSnippet('- Item')} style={{ border: '1px solid #5c7388', background: 'transparent', color: '#ecf0f1', borderRadius: 6, padding: '5px 8px' }}>+ Lista</button>
              <button onClick={() => insertSnippet('$V = I * R$')} style={{ border: '1px solid #5c7388', background: 'transparent', color: '#ecf0f1', borderRadius: 6, padding: '5px 8px' }}>+ Formula</button>
              <button onClick={() => insertSnippet('| Columna A | Columna B |\n| --- | --- |\n| Valor 1 | Valor 2 |')} style={{ border: '1px solid #5c7388', background: 'transparent', color: '#ecf0f1', borderRadius: 6, padding: '5px 8px' }}>+ Tabla</button>
              <button onClick={() => insertSnippet('![alt](https://example.com/image.png)')} style={{ border: '1px solid #5c7388', background: 'transparent', color: '#ecf0f1', borderRadius: 6, padding: '5px 8px' }}>+ Imagen URL</button>
              <button onClick={() => insertSnippet('[video](https://example.com/video.mp4)')} style={{ border: '1px solid #5c7388', background: 'transparent', color: '#ecf0f1', borderRadius: 6, padding: '5px 8px' }}>+ Video URL</button>
              <button onClick={() => void handleUploadMedia('image/*', false)} style={{ border: '1px solid #5c7388', background: 'transparent', color: '#ecf0f1', borderRadius: 6, padding: '5px 8px' }}>Subir imagen</button>
              <button onClick={() => void handleUploadMedia('video/*', true)} style={{ border: '1px solid #5c7388', background: 'transparent', color: '#ecf0f1', borderRadius: 6, padding: '5px 8px' }}>Subir video</button>
              {selected?.kind === 'custom' && <button onClick={requestDeleteSelectedCustomDoc} style={{ border: '1px solid #c0392b', background: 'transparent', color: '#f1c0bb', borderRadius: 6, padding: '5px 8px' }}>Eliminar doc</button>}
              <button onClick={() => void handleSaveDraft()} style={{ border: '1px solid #27ae60', background: '#27ae60', color: '#fff', borderRadius: 6, padding: '5px 10px', marginLeft: 'auto' }}>Guardar</button>
              <button onClick={requestResetDraft} style={{ border: '1px solid #5c7388', background: 'transparent', color: '#ecf0f1', borderRadius: 6, padding: '5px 10px' }}>Reset</button>
            </div>

            <div style={{ color: '#9eb1c2', fontSize: 12 }}>
              {selected ? `${selected.kind === 'component' ? 'Componente' : 'Documento'}: ${selected.label}` : 'Sin documento'}
              {selected?.kind === 'custom' && selected.relatedComponentId ? ` | Relacionado: ${components.find((item) => item.id === selected.relatedComponentId)?.label || selected.relatedComponentId}` : ''}
              {docMeta?.updatedAt ? ` | Actualizado: ${new Date(docMeta.updatedAt).toLocaleString()}` : ''}
              {docMeta?.updatedBy ? ` | Autor: ${docMeta.updatedBy}` : ''}
            </div>

            {studioMode === 'read' && <div style={{ overflow: 'auto', paddingRight: 4, minHeight: 0, flex: 1 }}><SimpleMarkdownRenderer markdown={selectedContent} /></div>}

            {studioMode === 'edit' && (
              <textarea
                value={editorValue}
                onChange={(e) => setEditorValue(e.target.value)}
                style={{ width: '100%', boxSizing: 'border-box', flex: 1, minHeight: 0, backgroundColor: '#182532', color: '#ecf0f1', border: '1px solid #4f6881', borderRadius: 8, padding: 10, outline: 'none', resize: 'none', fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace', fontSize: 12 }}
              />
            )}

            {studioMode === 'split' && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, minHeight: 0, flex: 1 }}>
                <textarea
                  value={editorValue}
                  onChange={(e) => setEditorValue(e.target.value)}
                  style={{ width: '100%', boxSizing: 'border-box', minHeight: 0, height: '100%', backgroundColor: '#182532', color: '#ecf0f1', border: '1px solid #4f6881', borderRadius: 8, padding: 10, outline: 'none', resize: 'none', fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace', fontSize: 12 }}
                />
                <div style={{ overflow: 'auto', border: '1px solid #3d5366', borderRadius: 8, padding: '10px 12px', backgroundColor: '#1a2835' }}>
                  <SimpleMarkdownRenderer markdown={editorValue} />
                </div>
              </div>
            )}
          </div>

          <div style={{ borderLeft: '1px solid #3d5366', padding: '10px 10px 12px 10px', overflow: 'auto' }}>
            <div style={{ color: '#a9bfd1', fontSize: 12, marginBottom: 8 }}>Historial</div>
            {history.length === 0 && <div style={{ color: '#8fa5b8', fontSize: 12 }}>Sin versiones</div>}
            {[...history].reverse().slice(0, 20).map((v, idx) => (
              <button
                key={`${v.updatedAt || 'na'}-${idx}`}
                onClick={() => setEditorValue(v.markdown)}
                style={{ width: '100%', textAlign: 'left', marginBottom: 6, background: '#213344', border: '1px solid #3d5366', borderRadius: 6, color: '#dce7f0', padding: '6px 8px', cursor: 'pointer' }}
                title="Cargar esta version en editor"
              >
                <div style={{ fontSize: 11 }}>{v.updatedAt ? new Date(v.updatedAt).toLocaleString() : 'Sin fecha'}</div>
                <div style={{ fontSize: 10, color: '#9eb1c2' }}>{v.updatedBy || 'usuario'}</div>
              </button>
            ))}
          </div>
        </div>
      </div>
      {confirmAction && (
        <ConfirmModal
          title={confirmAction.title}
          message={confirmAction.message}
          confirmLabel={confirmAction.confirmLabel}
          onConfirm={confirmAction.onConfirm}
          onCancel={() => setConfirmAction(null)}
        />
      )}
    </div>
  );
};

export default ComponentDocsModal;
