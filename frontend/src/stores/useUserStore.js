// frontend/src/stores/useUserStore.js
import { create } from "zustand";
import axios from "../lib/axios";
import { toast } from "react-hot-toast";

const getErr = (e, fb = "An error occurred") => e?.response?.data?.message || fb;

export const useUserStore = create((set, get) => ({
  user: null,
  loading: false,
  checkingAuth: true,

  signup: async ({ name, email, password, confirmPassword }) => {
    set({ loading: true });

    if (password !== confirmPassword) {
      set({ loading: false });
      return toast.error("Passwords do not match");
    }

    try {
      const res = await axios.post("/auth/signup", { name, email, password });
      set({ user: res.data, loading: false });
    } catch (error) {
      set({ loading: false });
      toast.error(getErr(error, "Failed to sign up"));
    }
  },

  login: async (email, password) => {
    set({ loading: true });
    try {
      const res = await axios.post("/auth/login", { email, password });
      set({ user: res.data, loading: false });
    } catch (error) {
      set({ loading: false });
      toast.error(getErr(error, "Login failed"));
    }
  },

  logout: async () => {
    try {
      await axios.post("/auth/logout");
    } catch (error) {
      // If the server already invalidated the cookie, this can 401—don’t spam the user
      // Still proceed with local logout to keep UX consistent.
      // Optional toast for visibility:
      // toast.error(getErr(error, "An error occurred during logout"));
    } finally {
      set({ user: null });
    }
  },

  checkAuth: async () => {
    set({ checkingAuth: true });
    try {
      const { data } = await axios.get("/auth/profile");
      set({ user: data, checkingAuth: false });
    } catch (error) {
      // silent fail → user stays logged out
      set({ checkingAuth: false, user: null });
    }
  },

  // Called by the interceptor; keeps cookies-only flow
  refreshToken: async () => {
    // Prevent multiple simultaneous refresh attempts from this store method.
    if (get().checkingAuth) return;

    set({ checkingAuth: true });
    try {
      const { data } = await axios.post("/auth/refresh-token");
      // refresh-token endpoint sets cookie; nothing else to store.
      set({ checkingAuth: false });
      return data;
    } catch (error) {
      set({ user: null, checkingAuth: false });
      throw error;
    }
  },
}));

// ========= Axios interceptor for token refresh =========
// One in-flight refresh at a time across the app:
let refreshPromise = null;

axios.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error?.config;

    // If we don't have a response or config, just reject
    if (!error?.response || !originalRequest) {
      return Promise.reject(error);
    }

    const status = error.response.status;

    // Don’t try to refresh on these, just bubble up
    if (status !== 401) {
      return Promise.reject(error);
    }

    // Avoid retrying the refresh endpoint itself or logout call
    const url = originalRequest.url || "";
    if (
      originalRequest._retry || // already retried
      url.includes("/auth/refresh-token") ||
      url.includes("/auth/logout")
    ) {
      return Promise.reject(error);
    }

    // Mark request so we don't loop
    originalRequest._retry = true;

    try {
      // If a refresh is already happening, wait for it
      if (refreshPromise) {
        await refreshPromise;
        return axios(originalRequest);
      }

      // Kick off a new refresh
      refreshPromise = useUserStore.getState().refreshToken();
      await refreshPromise;
      refreshPromise = null;

      // Replay the original request now that cookies are fresh
      return axios(originalRequest);
    } catch (refreshError) {
      refreshPromise = null;
      // If refresh fails, clear local user and stop retrying
      try {
        // local logout (won't loop because we blocked /auth/logout above)
        await useUserStore.getState().logout();
      } catch {
        useUserStore.setState({ user: null });
      }
      return Promise.reject(refreshError);
    }
  }
);
