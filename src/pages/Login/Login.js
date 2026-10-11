import { useEffect, useState } from "react";
import { Navigate, NavLink, useLocation } from "react-router-dom";
import "@fontsource-variable/archivo/wdth.css";
import { api, errorMessage } from "../../shared/api/axios";
import { useAuth } from "../../AuthContext";
import "./Login.scss";

const emptyForm = { firstName: "", lastName: "", email: "", password: "" };

// Tally marks: "hesabla" means "count it". Four strokes and a slash make one bundle of five,
// then two more. The paths are deliberately a little uneven, like marker on paper.
const TALLY_STROKES = [
  "M20 8 Q23 34 19 62",
  "M50 10 Q47 36 51 63",
  "M80 7 Q83 36 79 61",
  "M110 9 Q107 35 111 62",
  "M4 54 Q62 33 128 12",
  "M154 9 Q157 35 153 62",
  "M184 10 Q181 36 185 61",
];

const Tally = () => (
  <svg
    className="Tally"
    viewBox="0 0 200 72"
    aria-hidden="true"
    focusable="false"
  >
    {TALLY_STROKES.map((d, i) => (
      <path key={d} d={d} pathLength="1" style={{ "--i": i }} />
    ))}
  </svg>
);

const todayLabel = () =>
  new Intl.DateTimeFormat("az-AZ", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date());

export const Login = () => {
  const { isAuthenticated, login, register } = useAuth();
  const location = useLocation();

  const [hasUsers, setHasUsers] = useState(null); // null = still checking
  const [serverDown, setServerDown] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [capsLock, setCapsLock] = useState(false);

  const loadStatus = () => {
    setServerDown(false);
    api
      .get("/auth/status")
      .then((res) => setHasUsers(res.data.hasUsers))
      .catch(() => {
        setServerDown(true);
        setHasUsers(true);
      });
  };

  useEffect(loadStatus, []);

  if (isAuthenticated) {
    return (
      <Navigate to={location.state?.from?.pathname || "/dashboard"} replace />
    );
  }

  const setupMode = hasUsers === false;
  const change = (key) => (e) => {
    setError("");
    setForm((prev) => ({ ...prev, [key]: e.target.value }));
  };

  const submit = async (e) => {
    e.preventDefault();
    setError("");

    if (!form.email.trim() || !form.password) {
      return setError("E-poçt və şifrəni daxil edin");
    }
    if (setupMode && (!form.firstName.trim() || !form.lastName.trim())) {
      return setError("Ad və soyadı daxil edin");
    }
    if (setupMode && form.password.length < 6) {
      return setError("Şifrə ən az 6 simvol olmalıdır");
    }

    try {
      setBusy(true);
      if (setupMode) await register(form);
      else await login(form.email, form.password);
    } catch (err) {
      setError(errorMessage(err, "Giriş alınmadı"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="Login-Page">
      <section className="Login-Intro">
        <div className="Login-Date">{todayLabel()}</div>
        <div className="Login-Wordmark">Hesabla</div>
        <Tally />
        <p className="Login-Lead">
          Anbar, alış və kassa. Kağız dəftərin yerinə.
        </p>
        <p className="Login-Note">Məlumatlar öz serverinizdə saxlanılır.</p>
      </section>

      <main className="Login-Sheet">
        <form className="Login-Form" onSubmit={submit} noValidate>
          <h1>{setupMode ? "İlk hesabı yaradın" : "Daxil olun"}</h1>
          <p className="Login-Sub">
            {setupMode
              ? "Bu hesab admin olacaq və digər istifadəçiləri əlavə edə biləcək."
              : "E-poçt və şifrənizlə davam edin."}
          </p>

          {serverDown && (
            <div className="Login-Alert warn" role="status">
              Server əlçatan deyil.{" "}
              <button type="button" onClick={loadStatus}>
                Yenidən yoxla
              </button>
            </div>
          )}
          {error && (
            <div className="Login-Alert error" role="alert">
              {error}
            </div>
          )}

          {setupMode && (
            <div className="Login-Row">
              <div className="Login-Field">
                <label htmlFor="login-first">Ad</label>
                <input
                  id="login-first"
                  value={form.firstName}
                  onChange={change("firstName")}
                  autoComplete="given-name"
                />
              </div>
              <div className="Login-Field">
                <label htmlFor="login-last">Soyad</label>
                <input
                  id="login-last"
                  value={form.lastName}
                  onChange={change("lastName")}
                  autoComplete="family-name"
                />
              </div>
            </div>
          )}

          <div className="Login-Field">
            <label htmlFor="login-email">E-poçt</label>
            <input
              id="login-email"
              type="email"
              value={form.email}
              onChange={change("email")}
              placeholder="ad@sirket.az"
              autoComplete="username"
              autoFocus
            />
          </div>

          <div className="Login-Field">
            <label htmlFor="login-password">Şifrə</label>
            <div className="Login-Password">
              <input
                id="login-password"
                type={showPassword ? "text" : "password"}
                value={form.password}
                onChange={change("password")}
                onKeyUp={(e) =>
                  setCapsLock(e.getModifierState?.("CapsLock") || false)
                }
                onBlur={() => setCapsLock(false)}
                autoComplete={setupMode ? "new-password" : "current-password"}
              />
              <button
                type="button"
                className="Login-Show"
                onClick={() => setShowPassword((v) => !v)}
                aria-pressed={showPassword}
              >
                {showPassword ? "gizlət" : "göstər"}
              </button>
            </div>
            {capsLock && (
              <small className="Login-Hint">Caps Lock açıqdır</small>
            )}
            {setupMode && !capsLock && (
              <small className="Login-Hint">Ən az 6 simvol</small>
            )}
          </div>

          <button
            className="Login-Submit"
            type="submit"
            disabled={busy || hasUsers === null}
          >
            {busy ? "Gözləyin..." : setupMode ? "Hesab yarat" : "Daxil ol"}
          </button>

          <NavLink to="/" className="Login-Back">
            Əsas səhifəyə qayıt
          </NavLink>
        </form>
      </main>
    </div>
  );
};
