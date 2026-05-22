import { apiFetch } from './apiClient';

export interface ComponentDocItem {
  id: string;
  label: string;
  content: string;
}

export const getComponentCatalog = async (items: ComponentDocItem[]): Promise<ComponentDocItem[]> => {
  try {
    const response = await apiFetch('/components-definitions');
    if (!response.ok) return items;

    const data = await response.json();
    const labelsById = new Map<string, string>();
    for (const item of data.items || []) {
      labelsById.set(item.id, item.label);
    }

    return items.map((item) => ({
      ...item,
      label: labelsById.get(item.id) || item.label,
    }));
  } catch {
    return items;
  }
};
