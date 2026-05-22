import { apiFetch } from './apiClient';

export interface UserPreferences {
  activeViewProfile?: 'symbolic_iec' | 'symbolic_ansi' | 'realistic_2d';
  lastViewedComponentDocId?: string;
  lastProjectId?: string;
}

export const preferencesService = {
  get: async (): Promise<UserPreferences> => {
    try {
      const response = await apiFetch('/users/me/preferences');
      if (!response.ok) return {};
      const data = await response.json();
      return data.item || {};
    } catch {
      return {};
    }
  },

  save: async (patch: UserPreferences): Promise<void> => {
    try {
      await apiFetch('/users/me/preferences', {
        method: 'PUT',
        body: JSON.stringify(patch),
      });
    } catch {
      // noop
    }
  },
};
