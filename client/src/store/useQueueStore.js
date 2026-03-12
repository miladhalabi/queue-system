import { create } from 'zustand';
import axios from 'axios';
import { io } from 'socket.io-client';

const isProd = import.meta.env.PROD;
const API_URL = import.meta.env.VITE_API_URL || (isProd ? window.location.origin : 'http://localhost:3001');
const socket = io(API_URL);

// Axios interceptor for Auth
axios.interceptors.request.use((config) => {
  const token = localStorage.getItem('adminToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const useQueueStore = create((set, get) => ({
  entries: [],
  history: [],
  myEntry: JSON.parse(localStorage.getItem('myEntry')) || null,
  stats: { totalServed: 0, currentWait: 0 },
  isAdmin: false,
  adminUser: JSON.parse(localStorage.getItem('adminUser')) || null,
  adminToken: localStorage.getItem('adminToken') || null,
  theme: localStorage.getItem('theme') || 'light',

  setEntries: (entries) => set({ entries }),
  setAdmin: (isAdmin) => set({ isAdmin }),
  
  toggleTheme: () => {
    const nextTheme = get().theme === 'light' ? 'dark' : 'light';
    set({ theme: nextTheme });
    localStorage.setItem('theme', nextTheme);
    document.documentElement.classList.toggle('dark', nextTheme === 'dark');
  },

  login: async (username, password) => {
    try {
      const res = await axios.post(`${API_URL}/api/auth/login`, { username, password });
      const { token, user } = res.data;
      set({ adminToken: token, adminUser: user });
      localStorage.setItem('adminToken', token);
      localStorage.setItem('adminUser', JSON.stringify(user));
      
      // Fetch initial data after login
      get().fetchActive();
      get().fetchHistory();
      get().fetchStats();
      
      return true;
    } catch (err) {
      console.error('Login failed', err);
      throw err;
    }
  },

  logout: () => {
    set({ adminToken: null, adminUser: null, entries: [], history: [] });
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUser');
  },

  fetchActive: async () => {
    if (!get().adminToken) return;
    try {
      const res = await axios.get(`${API_URL}/api/queue/active`);
      set({ entries: res.data });
    } catch (err) {
      if (err.response?.status === 401 || err.response?.status === 403) {
        get().logout();
      }
      console.error('Fetch active failed', err);
    }
  },

  fetchHistory: async () => {
    if (!get().adminToken) return;
    try {
      const res = await axios.get(`${API_URL}/api/queue/history`);
      set({ history: res.data });
    } catch (err) {
      console.error('Fetch history failed', err);
    }
  },

  fetchStats: async () => {
    if (!get().adminToken) return;
    try {
      const res = await axios.get(`${API_URL}/api/queue/stats`);
      set({ stats: res.data });
    } catch (err) {
      console.error('Fetch stats failed', err);
    }
  },

  joinQueue: async (name, phone) => {
    try {
      const res = await axios.post(`${API_URL}/api/queue/join`, { name, phone });
      set({ myEntry: res.data });
      localStorage.setItem('myEntry', JSON.stringify(res.data));
      return res.data;
    } catch (err) {
      console.error('Join failed', err);
      throw err;
    }
  },

  leaveQueue: async () => {
    const { myEntry } = get();
    if (!myEntry) return;
    try {
      await axios.delete(`${API_URL}/api/queue/leave/${myEntry.id}`);
      set({ myEntry: null });
      localStorage.removeItem('myEntry');
    } catch (err) {
      console.error('Leave failed', err);
    }
  },

  callNext: async () => {
    try {
      await axios.post(`${API_URL}/api/queue/call-next`);
    } catch (err) {
      console.error('Call next failed', err);
    }
  },

  skipEntry: async (id, reason) => {
    try {
      await axios.post(`${API_URL}/api/queue/skip/${id}`, { reason });
    } catch (err) {
      console.error('Skip failed', err);
    }
  },

  initSocket: () => {
    socket.on('queue_update', (updatedEntries) => {
      // Only set entries if logged in
      if (get().adminToken) {
        set({ entries: updatedEntries });
        get().fetchStats();
        get().fetchHistory(); // Refresh history on updates
      }
      
      const { myEntry } = get();
      if (myEntry) {
        const found = updatedEntries.find(e => e.id === myEntry.id);
        if (found) {
          set({ myEntry: found });
          localStorage.setItem('myEntry', JSON.stringify(found));
        } else if (myEntry.status === 'waiting' || myEntry.status === 'called') {
          get().refreshMyStatus();
        }
      }
    });

    socket.on('connect', () => console.log('Connected to WebSocket'));
  },

  refreshMyStatus: async () => {
    const { myEntry } = get();
    if (!myEntry) return;
    try {
      const res = await axios.get(`${API_URL}/api/queue/status/${myEntry.id}`);
      set({ myEntry: res.data });
      localStorage.setItem('myEntry', JSON.stringify(res.data));
    } catch (err) {
      if (err.response?.status === 404) {
        set({ myEntry: null });
        localStorage.removeItem('myEntry');
      }
    }
  }
}));
