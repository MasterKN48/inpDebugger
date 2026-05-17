import { useState, useEffect } from 'preact/hooks';

// Custom Zustand-like lightweight reactive store creator with Zero Dependencies (Ref-Optimized)
function createStore(initializer) {
  let state = {};
  const listeners = new Set();

  const getState = () => state;
  const setState = (nextStateOrUpdater) => {
    const nextState = typeof nextStateOrUpdater === 'function'
      ? nextStateOrUpdater(state)
      : nextStateOrUpdater;

    if (nextState !== state) {
      state = { ...state, ...nextState };
      listeners.forEach(listener => listener(state));
    }
  };

  const subscribe = (listener) => {
    listeners.add(listener);
    return () => listeners.delete(listener);
  };

  const api = { getState, setState, subscribe };
  state = initializer(setState, getState, api);

  return function useStore(selector = (s) => s) {
    const [slice, setSlice] = useState(() => selector(state));

    useEffect(() => {
      const unsubscribe = subscribe((newState) => {
        const nextSlice = selector(newState);
        setSlice(() => nextSlice);
      });
      return unsubscribe;
    }, [selector]);

    return slice;
  };
}

// REST API Host & Authentication Configuration
const API_BASE = import.meta.env?.VITE_API_BASE || 'http://localhost:3000';
const API_KEY = import.meta.env?.VITE_API_KEY || 'inp_debugger_secret_key_2026';

/**
 * Builds request headers pre-populated with secure server authorization key.
 */
const getHeaders = (extra = {}) => ({
  'X-API-Key': API_KEY,
  ...extra
});

// Persisted Key names
const PERSIST_KEY_DEVICE = 'inpdebugger_device_profile';
const PERSIST_KEY_LAST_URL = 'inpdebugger_last_url';

export const useAuditStore = createStore((set, get) => {
  // Load persisted states from localStorage safely
  let savedDevice = null;
  let savedLastUrl = null;
  
  try {
    if (typeof localStorage !== 'undefined') {
      savedDevice = localStorage.getItem(PERSIST_KEY_DEVICE);
      savedLastUrl = localStorage.getItem(PERSIST_KEY_LAST_URL);
    }
  } catch (e) {
    console.warn('⚠️ localStorage is blocked or restricted in this browser context:', e);
  }

  return {
    // ------------------------------------
    // State
    // ------------------------------------
    history: [],
    activeJobId: null,
    jobStatus: 'idle', // 'idle' | 'pending' | 'running' | 'completed' | 'failed'
    jobProgress: [],
    activeResult: null,
    analytics: null,
    deviceProfile: savedDevice || 'desktop',
    lastAuditedUrl: savedLastUrl || '',
    errorMsg: null,

    // ------------------------------------
    // Actions
    // ------------------------------------
    setDeviceProfile: (profile) => {
      set({ deviceProfile: profile });
      try {
        if (typeof localStorage !== 'undefined') {
          localStorage.setItem(PERSIST_KEY_DEVICE, profile);
        }
      } catch (e) {
        console.warn('⚠️ localStorage.setItem failed (blocked or disabled):', e);
      }
    },

    setLastAuditedUrl: (url) => {
      set({ lastAuditedUrl: url });
      try {
        if (typeof localStorage !== 'undefined') {
          localStorage.setItem(PERSIST_KEY_LAST_URL, url);
        }
      } catch (e) {
        console.warn('⚠️ localStorage.setItem failed (blocked or disabled):', e);
      }
    },

    clearActiveJob: () => {
      set({ activeJobId: null, jobStatus: 'idle', jobProgress: [], errorMsg: null });
    },

    // Fetch Paginated Audits History from Elysia Backend
    fetchHistory: async () => {
      try {
        const res = await fetch(`${API_BASE}/api/history`, {
          headers: getHeaders()
        });
        if (!res.ok) throw new Error('Failed to load audits history.');
        const resJson = await res.json();
        
        if (resJson.success) {
          set({ history: resJson.data || [] });
        } else {
          throw new Error(resJson.message || 'Failed to parse audits history.');
        }
      } catch (err) {
        console.error('History Fetch Error:', err);
      }
    },

    // Fetch Aggregated Slow Selector Bottlenecks
    fetchAnalytics: async (url) => {
      if (!url) return;
      try {
        const res = await fetch(`${API_BASE}/api/analytics?url=${encodeURIComponent(url)}`, {
          headers: getHeaders()
        });
        if (!res.ok) throw new Error('Failed to load aggregated analytics.');
        const resJson = await res.json();
        
        if (resJson.success) {
          set({ analytics: resJson.data });
        } else {
          throw new Error(resJson.message || 'Failed to parse analytics.');
        }
      } catch (err) {
        console.error('Analytics Fetch Error:', err);
      }
    },

    // Load full details for a previous completed audit run
    loadResult: async (jobId) => {
      set({ jobStatus: 'pending', errorMsg: null });
      try {
        const res = await fetch(`${API_BASE}/api/results/${jobId}`, {
          headers: getHeaders()
        });
        if (!res.ok) throw new Error(`Could not load audit "${jobId}".`);
        const resJson = await res.json();
        
        if (!resJson.success) {
          throw new Error(resJson.message || `Could not load audit "${jobId}".`);
        }

        const data = resJson.data;
        if (data && data.status === 'completed') {
          set({
            activeResult: data.result,
            jobStatus: 'idle',
            activeJobId: null
          });
          // Refresh analytics for the URL loaded
          get().fetchAnalytics(data.result.url);
        } else {
          throw new Error('Audit run is not fully completed yet.');
        }
      } catch (err) {
        set({ jobStatus: 'failed', errorMsg: err.message });
      }
    },

    // Delete a past run (Cascade cleanups)
    deleteResult: async (jobId) => {
      try {
        const res = await fetch(`${API_BASE}/api/results/${jobId}`, {
          method: 'DELETE',
          headers: getHeaders()
        });
        if (!res.ok) throw new Error('Deletion request failed on server.');
        
        const resJson = await res.json();
        if (!resJson.success) {
          throw new Error(resJson.message || 'Deletion failed.');
        }

        // Update local state list
        const updatedHistory = get().history.filter(item => item.id !== jobId);
        set({ history: updatedHistory });

        // If the deleted job was the active display, clear it
        if (get().activeResult?.id === jobId) {
          set({ activeResult: null, analytics: null });
        }
      } catch (err) {
        console.error('Delete Run Error:', err);
      }
    },

    // Trigger a new background audit
    triggerAudit: async (url) => {
      if (!url) return;
      
      const cleanUrl = url.trim();
      get().setLastAuditedUrl(cleanUrl);
      
      set({
        jobStatus: 'pending',
        activeJobId: null,
        jobProgress: [],
        activeResult: null,
        analytics: null,
        errorMsg: null
      });

      try {
        const res = await fetch(`${API_BASE}/api/analyze`, {
          method: 'POST',
          headers: getHeaders({ 'Content-Type': 'application/json' }),
          body: JSON.stringify({
            url: cleanUrl,
            profile: get().deviceProfile
          })
        });

        if (!res.ok) throw new Error('Failed to schedule backend audit task.');
        const resJson = await res.json();

        if (!resJson.success) {
          throw new Error(resJson.message || 'Failed to schedule backend audit task.');
        }

        const data = resJson.data;
        set({
          activeJobId: data.jobId,
          jobStatus: 'running',
          jobProgress: [{ phase: 'initialized', message: 'Job queue registered.', timestamp: Date.now() }]
        });

        // Start real-time background polling loop
        get().pollJobStatus(data.jobId);
      } catch (err) {
        set({ jobStatus: 'failed', errorMsg: err.message });
      }
    },

    // Background job polling recursive runner
    pollJobStatus: async (jobId) => {
      const poll = async () => {
        // Exit if user has cancelled or started another run
        if (get().activeJobId !== jobId) return;

        try {
          const res = await fetch(`${API_BASE}/api/results/${jobId}`, {
            headers: getHeaders()
          });
          if (!res.ok) throw new Error('Lost connection to progress stream.');
          const resJson = await res.json();
          
          if (!resJson.success) {
            throw new Error(resJson.message || 'Lost connection to progress stream.');
          }

          const data = resJson.data;

          // Append updated progress stages
          if (data && data.progress) {
            set({ jobProgress: data.progress });
          }

          if (data && data.status === 'completed') {
            set({
              activeResult: data.result,
              jobStatus: 'idle',
              activeJobId: null
            });
            // Refresh history table & analytics overview
            get().fetchHistory();
            get().fetchAnalytics(data.result.url);
          } else if (data && data.status === 'failed') {
            set({
              jobStatus: 'failed',
              errorMsg: data.error || 'Measurement execution failed.'
            });
            get().fetchHistory();
          } else {
            // Recurse after 800ms
            setTimeout(poll, 800);
          }
        } catch (err) {
          set({
            jobStatus: 'failed',
            errorMsg: err.message
          });
        }
      };

      // Initial execution
      setTimeout(poll, 400);
    }
  };
});
