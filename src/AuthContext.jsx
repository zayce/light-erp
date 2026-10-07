import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  api,
  TOKEN_KEY,
  setUnauthorizedHandler,
  isNetworkError,
} from "./shared/api/axios";
import { readStorage, writeStorage } from "./utils/storage";

const USER_KEY = "hesabla-user";

const AuthContext = createContext(null);

const removeStored = (key) => {
  try {
    window.localStorage.removeItem(key);
  } catch {
    // ignore
  }
};

const readCachedUser = () => {
  try {
    return JSON.parse(readStorage(USER_KEY) || "null");
  } catch {
    return null;
  }
};

export const AuthProvider = ({ children }) => {
  // loading -> authenticated | anonymous
  const [status, setStatus] = useState(() =>
    readStorage(TOKEN_KEY) ? "loading" : "anonymous",
  );
  const [user, setUser] = useState(null);
  // true when the server could not be reached and the cached user is trusted
  const [offline, setOffline] = useState(false);

  const saveSession = useCallback((token, nextUser) => {
    writeStorage(TOKEN_KEY, token);
    writeStorage(USER_KEY, JSON.stringify(nextUser));
    setUser(nextUser);
    setOffline(false);
    setStatus("authenticated");
  }, []);

  const clearSession = useCallback(() => {
    removeStored(TOKEN_KEY);
    removeStored(USER_KEY);
    setUser(null);
    setStatus("anonymous");
  }, []);

  // Restore the session on page load.
  useEffect(() => {
    if (!readStorage(TOKEN_KEY)) return undefined;
    let cancelled = false;

    api
      .get("/auth/me")
      .then((res) => {
        if (cancelled) return;
        writeStorage(USER_KEY, JSON.stringify(res.data.user));
        setUser(res.data.user);
        setStatus("authenticated");
      })
      .catch((err) => {
        if (cancelled) return;
        const cached = readCachedUser();
        if (isNetworkError(err) && cached) {
          // Server is down: keep working from the local cache.
          setUser(cached);
          setOffline(true);
          setStatus("authenticated");
        } else if (!isNetworkError(err)) {
          clearSession();
        } else {
          setStatus("anonymous");
        }
      });

    return () => {
      cancelled = true;
    };
  }, [clearSession]);

  // An expired or revoked token anywhere in the app logs the user out.
  useEffect(() => {
    setUnauthorizedHandler(clearSession);
    return () => setUnauthorizedHandler(null);
  }, [clearSession]);

  const login = useCallback(
    async (email, password) => {
      const res = await api.post("/auth/login", { email, password });
      saveSession(res.data.token, res.data.user);
      return res.data.user;
    },
    [saveSession],
  );

  const register = useCallback(
    async (form) => {
      const res = await api.post("/auth/register", form);
      saveSession(res.data.token, res.data.user);
      return res.data.user;
    },
    [saveSession],
  );

  const updateUser = useCallback((nextUser, token) => {
    if (token) writeStorage(TOKEN_KEY, token);
    writeStorage(USER_KEY, JSON.stringify(nextUser));
    setUser(nextUser);
  }, []);

  const value = useMemo(
    () => ({
      status,
      user,
      offline,
      isAuthenticated: status === "authenticated",
      login,
      register,
      logout: clearSession,
      updateUser,
    }),
    [status, user, offline, login, register, clearSession, updateUser],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
};
