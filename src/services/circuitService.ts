import { apiFetch } from './apiClient';
import type { Component, JunctionPoint, Wire } from '../types';

export interface CircuitPayload {
  components: Component[];
  wires: Wire[];
  junctions: JunctionPoint[];
}

export interface CircuitProjectSummary {
  id: string;
  name: string;
  updatedAt: string;
}

export const circuitService = {
  saveMyCircuit: async (payload: CircuitPayload): Promise<void> => {
    await apiFetch('/circuits/me', {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  },

  loadMyCircuit: async (): Promise<CircuitPayload | null> => {
    try {
      const response = await apiFetch('/circuits/me');
      if (!response.ok) return null;
      const data = await response.json();
      return data.item || null;
    } catch {
      return null;
    }
  },

  listProjects: async (): Promise<CircuitProjectSummary[]> => {
    try {
      const response = await apiFetch('/circuits/projects');
      if (!response.ok) return [];
      const data = await response.json();
      return Array.isArray(data.items) ? data.items : [];
    } catch {
      return [];
    }
  },

  createProject: async (name: string): Promise<CircuitProjectSummary | null> => {
    const response = await apiFetch('/circuits/projects', {
      method: 'POST',
      body: JSON.stringify({ name }),
    });
    if (!response.ok) return null;
    const data = await response.json();
    return data.item || null;
  },

  loadProject: async (projectId: string): Promise<{ id: string; name: string; circuit: CircuitPayload } | null> => {
    const response = await apiFetch(`/circuits/projects/${projectId}`);
    if (!response.ok) return null;
    const data = await response.json();
    return data.item || null;
  },

  saveProject: async (projectId: string, payload: CircuitPayload, name?: string): Promise<void> => {
    await apiFetch(`/circuits/projects/${projectId}`, {
      method: 'PUT',
      body: JSON.stringify({ ...payload, ...(name ? { name } : {}) }),
    });
  },

  deleteProject: async (projectId: string): Promise<void> => {
    await apiFetch(`/circuits/projects/${projectId}`, { method: 'DELETE' });
  },
};
