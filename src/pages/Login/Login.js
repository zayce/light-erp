import { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { Box } from "lucide-react";
import { api, errorMessage } from "../../shared/api/axios";
import { useAuth } from "../../AuthContext";
import "./Login.scss";

const emptyForm = { firstName: "", lastName: "", email: "", password: "" };

export const Login = () => {
  const { isAuthenticated, login, register } = useAuth();
  const location = useLocation();

  const [hasUsers, setHasUsers] = useState(null); // null = still checking
  const [serverDown, setServerDown] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

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
    return <Navigate to={location.state?.from?.pathname || "/dashboard"} replace />;
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
    <div className="Login-Wrapper">
      <form className="Login-Card" onSubmit={submit} noValidate>
        <div className="Login-Logo">
          <Box size={34} />
          <span>Hesabla</span>
        </div>

        <h1>{setupMode ? "İlk hesabı yaradın" : "Daxil olun"}</h1>
        <p className="Login-Sub">
          {setupMode
            ? "Bu hesab admin olacaq və digər istifadəçiləri əlavə edə biləcək."
            : "Anbar və pul axını sisteminə giriş."}
        </p>

        {serverDown && (
          <div className="Login-Alert">
            Server əlçatan deyil.{" "}
            <button type="button" onClick={loadStatus}>
              Yenidən yoxla
            </button>
          </div>
        )}
        {error && <div className="Login-Alert error">{error}</div>}

        {setupMode && (
          <div className="Login-Row">
            <label>
              Ad
              <input value={form.firstName} onChange={change("firstName")} autoComplete="given-name" />
            </label>
            <label>
              Soyad
              <input value={form.lastName} onChange={change("lastName")} autoComplete="family-name" />
            </label>
          </div>
        )}

        <label>
          E-poçt
          <input type="email" value={form.email} onChange={change("email")} autoComplete="username" autoFocus />
        </label>

        <label>
          Şifrə
          <input
            type="password"
            value={form.password}
            onChange={change("password")}
            autoComplete={setupMode ? "new-password" : "current-password"}
          />
        </label>

        <button className="Login-Submit" type="submit" disabled={busy || hasUsers === null}>
          {busy ? "Gözləyin..." : setupMode ? "Hesab yarat" : "Daxil ol"}
        </button>
      </form>
    </div>
  );
};
