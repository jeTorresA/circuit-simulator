import { apiFetch } from './apiClient';

const DOC_DRAFTS_STORAGE_KEY = 'mi-simulador-doc-drafts-v1';

type DocDraftMap = Record<string, string>;

export interface ComponentDocDetails {
  markdown: string;
  updatedAt?: string;
  updatedBy?: string;
}

export interface ComponentDocVersion {
  markdown: string;
  updatedAt?: string;
  updatedBy?: string;
}

export interface CustomDocSummary {
  id: string;
  title: string;
  relatedComponentId?: string | null;
  updatedAt?: string;
}

const readDraftMap = (): DocDraftMap => {
  try {
    const raw = localStorage.getItem(DOC_DRAFTS_STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
};

const writeDraftMap = (value: DocDraftMap) => {
  localStorage.setItem(DOC_DRAFTS_STORAGE_KEY, JSON.stringify(value));
};

export const docsService = {
  getDraftMap: async (componentIds?: string[]): Promise<DocDraftMap> => {
    const localDrafts = readDraftMap();
    if (!componentIds || componentIds.length === 0) return localDrafts;

    try {
      const remoteEntries = await Promise.all(
        componentIds.map(async (componentId) => {
          const response = await apiFetch(`/components-definitions/${componentId}/docs`);
          if (!response.ok) return null;
          const data = await response.json();
          const markdown = data?.item?.markdown;
          return typeof markdown === 'string' ? [componentId, markdown] as const : null;
        })
      );

      const remoteDrafts: DocDraftMap = {};
      for (const entry of remoteEntries) {
        if (entry) remoteDrafts[entry[0]] = entry[1];
      }
      const merged = { ...localDrafts, ...remoteDrafts };
      writeDraftMap(merged);
      return merged;
    } catch {
      return localDrafts;
    }
  },

  saveDraft: async (componentId: string, markdown: string): Promise<void> => {
    const map = readDraftMap();
    map[componentId] = markdown;
    writeDraftMap(map);

    try {
      await apiFetch(`/components-definitions/${componentId}/docs`, {
        method: 'PUT',
        body: JSON.stringify({ markdown }),
      });
    } catch {
      // keep local draft as fallback
    }
  },

  getDocDetails: async (componentId: string): Promise<ComponentDocDetails | null> => {
    try {
      const response = await apiFetch(`/components-definitions/${componentId}/docs`);
      if (!response.ok) return null;
      const data = await response.json();
      if (!data?.item?.markdown) return null;
      return {
        markdown: data.item.markdown,
        updatedAt: data.item.updatedAt,
        updatedBy: data.item.updatedBy,
      };
    } catch {
      return null;
    }
  },

  getDocHistory: async (componentId: string): Promise<ComponentDocVersion[]> => {
    try {
      const response = await apiFetch(`/components-definitions/${componentId}/docs/history`);
      if (!response.ok) return [];
      const data = await response.json();
      return Array.isArray(data.items) ? data.items : [];
    } catch {
      return [];
    }
  },

  resetDraft: async (componentId: string): Promise<void> => {
    const map = readDraftMap();
    delete map[componentId];
    writeDraftMap(map);

    try {
      await apiFetch(`/components-definitions/${componentId}/docs`, {
        method: 'DELETE',
      });
    } catch {
      // local reset already applied
    }
  },

  listCustomDocs: async (): Promise<CustomDocSummary[]> => {
    try {
      const response = await apiFetch('/docs/custom');
      if (!response.ok) return [];
      const data = await response.json();
      return Array.isArray(data.items) ? data.items : [];
    } catch {
      return [];
    }
  },

  createCustomDoc: async (title: string, relatedComponentId?: string): Promise<CustomDocSummary | null> => {
    try {
      const response = await apiFetch('/docs/custom', {
        method: 'POST',
        body: JSON.stringify({ title, relatedComponentId }),
      });
      if (!response.ok) return null;
      const data = await response.json();
      return data.item || null;
    } catch {
      return null;
    }
  },

  getCustomDoc: async (customDocId: string): Promise<ComponentDocDetails | null> => {
    try {
      const response = await apiFetch(`/docs/custom/${customDocId}`);
      if (!response.ok) return null;
      const data = await response.json();
      if (!data?.item) return null;
      return {
        markdown: data.item.markdown || '',
        updatedAt: data.item.updatedAt,
        updatedBy: data.item.updatedBy,
      };
    } catch {
      return null;
    }
  },

  saveCustomDoc: async (customDocId: string, markdown: string): Promise<ComponentDocDetails | null> => {
    try {
      const response = await apiFetch(`/docs/custom/${customDocId}`, {
        method: 'PUT',
        body: JSON.stringify({ markdown }),
      });
      if (!response.ok) return null;
      const data = await response.json();
      if (!data?.item) return null;
      return {
        markdown: data.item.markdown || '',
        updatedAt: data.item.updatedAt,
        updatedBy: data.item.updatedBy,
      };
    } catch {
      return null;
    }
  },

  getCustomDocHistory: async (customDocId: string): Promise<ComponentDocVersion[]> => {
    try {
      const response = await apiFetch(`/docs/custom/${customDocId}/history`);
      if (!response.ok) return [];
      const data = await response.json();
      return Array.isArray(data.items) ? data.items : [];
    } catch {
      return [];
    }
  },

  deleteCustomDoc: async (customDocId: string): Promise<boolean> => {
    try {
      const response = await apiFetch(`/docs/custom/${customDocId}`, {
        method: 'DELETE',
      });
      return response.ok;
    } catch {
      return false;
    }
  },
};
