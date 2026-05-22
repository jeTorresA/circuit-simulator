import { apiFetch, clearAuthToken, setAuthToken } from './apiClient';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
}

const AUTH_USER_KEY = 'mi-simulador-auth-user-v1';

export const getStoredUser = (): AuthUser | null => {
  try {
    const raw = localStorage.getItem(AUTH_USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

const storeUser = (user: AuthUser) => {
  localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
};

export const clearStoredUser = () => {
  localStorage.removeItem(AUTH_USER_KEY);
};

export const authService = {
  register: async (email: string, password: string, name: string) => {
    const response = await apiFetch('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, name }),
    });
    if (!response.ok) throw new Error('No se pudo registrar usuario');
    const data = await response.json();
    setAuthToken(data.token);
    storeUser(data.user);
    return data.user as AuthUser;
  },

  login: async (email: string, password: string) => {
    const response = await apiFetch('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    if (!response.ok) throw new Error('Credenciales invalidas');
    const data = await response.json();
    setAuthToken(data.token);
    storeUser(data.user);
    return data.user as AuthUser;
  },

  logout: () => {
    clearAuthToken();
    clearStoredUser();
  },
};
