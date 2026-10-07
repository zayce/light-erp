import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import toast from "react-hot-toast";
import { api, isNetworkError } from "./shared/api/axios";
import { reducer, normalizeState, useApp } from "./AppContext";
import { useAuth } from "./AuthContext";
import { readStorage, writeStorage } from "./utils/storage";

const SyncContext = createContext(null);

const SAVE_DELAY_MS = 1200;
const RETRY_DELAY_MS = 10000;
const DIRTY_KEY = "hesabla-dirty";

const setDirty = (value) => writeStorage(DIRTY_KEY, value ? "1" : "0");
const wasDirty = () => readStorage(DIRTY_KEY) === "1";

// Keeps the shared workspace on the server in step with this browser:
//  - on login it loads the server copy (or uploads the local one if the server is empty)
//  - every change is saved a moment later
//  - if the server is unreachable the app keeps working from the local cache and retries
//  - if someone else saved first the server copy wins (HTTP 409) and the user is told
export const SyncProvider = ({ children }) => {
  const { state, dispatch } = useApp();
  const { isAuthenticated, user, logout } = useAuth();
  const [status, setStatus] = useState("idle");

  const stateRef = useRef(state);
  const versionRef = useRef(null); // null until the server copy was loaded
  const lastSavedRef = useRef(JSON.stringify(state)); // the cache counts as synced unless flagged dirty
  const savingRef = useRef(false);
  const timerRef = useRef(null);
  const saveRef = useRef(null);
  const hydrateRef = useRef(null);

  const userId = user?.id;

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  const schedule = useCallback((delay) => {
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => saveRef.current?.(), delay);
  }, []);

  const save = useCallback(async () => {
    if (versionRef.current === null || savingRef.current) return;

    const snapshot = stateRef.current;
    const json = JSON.stringify(snapshot);
    if (json === lastSavedRef.current) {
      setDirty(false);
      setStatus("saved");
      return;
    }

    savingRef.current = true;
    setStatus("saving");

    try {
      const res = await api.put("/data", {
        baseVersion: versionRef.current,
        data: snapshot,
      });
      versionRef.current = res.data.version;
      lastSavedRef.current = json;
      setStatus("saved");
    } catch (err) {
      if (err?.response?.status === 409) {
        const { version, data } = err.response.data;
        versionRef.current = version;
        if (data) {
          lastSavedRef.current = JSON.stringify(normalizeState(data));
          dispatch({ type: "REPLACE_DATA", payload: data });
        }
        toast("Məlumat başqa cihazda dəyişdirilmişdi və yeniləndi", {
          id: "sync-conflict",
          icon: "🔄",
        });
        setStatus("saved");
      } else if (isNetworkError(err)) {
        setStatus("offline");
        schedule(RETRY_DELAY_MS);
      } else if (err?.response?.status !== 401) {
        setStatus("error");
        toast.error("Sinxronizasiya xətası", { id: "sync-error" });
        schedule(RETRY_DELAY_MS);
      }
    } finally {
      savingRef.current = false;
      if (
        versionRef.current !== null &&
        JSON.stringify(stateRef.current) !== lastSavedRef.current
      ) {
        setDirty(true);
        schedule(SAVE_DELAY_MS);
      } else {
        setDirty(false);
      }
    }
  }, [dispatch, schedule]);

  useEffect(() => {
    saveRef.current = save;
  }, [save]);

  // Load the server copy after login.
  const hydrate = useCallback(async () => {
    setStatus("loading");
    try {
      const res = await api.get("/data");
      const { version, data } = res.data;
      versionRef.current = version;

      if (!data) {
        // Empty workspace: whatever is in this browser becomes the first server copy.
        lastSavedRef.current = "";
        schedule(0);
        return;
      }

      let useServer = true;
      if (wasDirty() && JSON.stringify(stateRef.current) !== JSON.stringify(normalizeState(data))) {
        useServer = window.confirm(
          "Bu cihazda sinxronlaşdırılmamış dəyişikliklər var.\n\n" +
            "OK - serverdəki məlumatı yüklə (yerli dəyişikliklər itəcək)\n" +
            "Cancel - yerli məlumatı serverə göndər",
        );
      }

      if (useServer) {
        lastSavedRef.current = JSON.stringify(normalizeState(data));
        dispatch({ type: "REPLACE_DATA", payload: data });
        setDirty(false);
        setStatus("saved");
      } else {
        lastSavedRef.current = "";
        schedule(0);
      }
    } catch (err) {
      versionRef.current = null;
      if (err?.response?.status === 401) return;
      setStatus(isNetworkError(err) ? "offline" : "error");
      clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => hydrateRef.current?.(), RETRY_DELAY_MS);
    }
  }, [dispatch, schedule]);

  useEffect(() => {
    hydrateRef.current = hydrate;
  }, [hydrate]);

  useEffect(() => {
    if (!isAuthenticated) {
      versionRef.current = null;
      clearTimeout(timerRef.current);
      setStatus("idle");
      return undefined;
    }

    hydrate();
    return () => clearTimeout(timerRef.current);
  }, [isAuthenticated, userId, hydrate]);

  // Any change: remember it is unsynced, then save shortly.
  useEffect(() => {
    if (JSON.stringify(state) === lastSavedRef.current) return;
    setDirty(true);
    if (versionRef.current !== null) schedule(SAVE_DELAY_MS);
  }, [state, schedule]);

  // Save right away when the tab is hidden or the connection comes back.
  useEffect(() => {
    const flushNow = () => {
      if (versionRef.current !== null) saveRef.current?.();
      else if (isAuthenticated) hydrateRef.current?.();
    };
    const onVisibility = () => {
      if (document.visibilityState === "hidden") flushNow();
    };

    window.addEventListener("online", flushNow);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      window.removeEventListener("online", flushNow);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [isAuthenticated]);

  // Sign out safely: push pending changes first, then wipe the local copy.
  const signOut = useCallback(async () => {
    clearTimeout(timerRef.current);
    if (versionRef.current !== null) await save();

    const pending = JSON.stringify(stateRef.current) !== lastSavedRef.current;
    if (
      pending &&
      !window.confirm(
        "Sinxronlaşdırılmamış dəyişikliklər var və çıxsanız itiriləcək. Davam edilsin?",
      )
    ) {
      if (versionRef.current !== null) schedule(SAVE_DELAY_MS);
      return false;
    }

    const empty = reducer(stateRef.current, { type: "RESET_DATA" });
    lastSavedRef.current = JSON.stringify(empty);
    versionRef.current = null;
    setDirty(false);
    logout();
    dispatch({ type: "RESET_DATA" });
    return true;
  }, [save, schedule, logout, dispatch]);

  const value = useMemo(() => ({ status, signOut }), [status, signOut]);

  return <SyncContext.Provider value={value}>{children}</SyncContext.Provider>;
};

export const useSync = () => {
  const ctx = useContext(SyncContext);
  if (!ctx) throw new Error("useSync must be used inside SyncProvider");
  return ctx;
};
