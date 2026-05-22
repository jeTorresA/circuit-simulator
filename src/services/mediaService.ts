import { getApiBaseUrl, getAuthToken } from './apiClient';

export interface UploadedMediaItem {
  id: string;
  url: string;
  originalName: string;
  mimeType: string;
}

export const mediaService = {
  uploadFile: async (file: File): Promise<UploadedMediaItem | null> => {
    const formData = new FormData();
    formData.append('file', file);
    try {
      const headers = new Headers();
      const token = getAuthToken();
      if (token) headers.set('Authorization', `Bearer ${token}`);
      const response = await fetch(`${getApiBaseUrl()}/media/upload`, {
        method: 'POST',
        headers,
        body: formData,
      });
      if (!response.ok) return null;
      const data = await response.json();
      if (!data?.item) return null;
      const absoluteUrl = data.item.url.startsWith('http') ? data.item.url : `${getApiBaseUrl()}${data.item.url}`;
      return { ...data.item, url: absoluteUrl };
    } catch {
      return null;
    }
  },
};
