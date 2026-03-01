import { useEffect, useMemo, useState } from "react";
import { User, Save, Loader2, Bell, Lock, Database } from "lucide-react";
import "./Settings.scss";

/* ===== Initials (лучше снаружи компонента) ===== */
const initialProfile = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
};

const initialNotifications = {
  emailNotifications: true,
  lowStockAlerts: true,
  reportNotifications: false,
};

const initialPassword = {
  currentPassword: "",
  newPassword: "",
  confirmPassword: "",
};

const initialSystem = {
  currency: "AZN",
  language: "az",
  timezone: "Asia/Baku",
};

export const Settings = () => {
  // profile
  const [profile, setProfile] = useState(initialProfile);
  const [profileInitial, setProfileInitial] = useState(initialProfile);

  // notifications
  const [notif, setNotif] = useState(initialNotifications);
  const [notifInitial, setNotifInitial] = useState(initialNotifications);

  // password
  const [pwd, setPwd] = useState(initialPassword);

  // system
  const [system, setSystem] = useState(initialSystem);
  const [systemInitial, setSystemInitial] = useState(initialSystem);

  // ui states
  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingNotif, setSavingNotif] = useState(false);
  const [savingPwd, setSavingPwd] = useState(false);
  const [savingSystem, setSavingSystem] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // endpoints (поменяешь под backend)
  const API_PROFILE_GET = "/api/profile";
  const API_PROFILE_UPDATE = "/api/profile";

  const API_NOTIF_GET = "/api/settings/notifications";
  const API_NOTIF_UPDATE = "/api/settings/notifications";

  const API_PASSWORD_UPDATE = "/api/settings/password";

  const API_SYSTEM_GET = "/api/settings/system";
  const API_SYSTEM_UPDATE = "/api/settings/system";

  // dirty checks
  const profileDirty = useMemo(
    () => JSON.stringify(profile) !== JSON.stringify(profileInitial),
    [profile, profileInitial],
  );

  const notifDirty = useMemo(
    () => JSON.stringify(notif) !== JSON.stringify(notifInitial),
    [notif, notifInitial],
  );

  const pwdDirty = useMemo(
    () =>
      Boolean(pwd.currentPassword || pwd.newPassword || pwd.confirmPassword),
    [pwd],
  );

  const systemDirty = useMemo(
    () => JSON.stringify(system) !== JSON.stringify(systemInitial),
    [system, systemInitial],
  );

  // handlers
  const onProfileChange = (key) => (e) => {
    setSuccess("");
    setError("");
    setProfile((prev) => ({ ...prev, [key]: e.target.value }));
  };

  const toggleNotif = (key) => {
    setSuccess("");
    setError("");
    setNotif((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const onPwdChange = (key) => (e) => {
    setSuccess("");
    setError("");
    setPwd((prev) => ({ ...prev, [key]: e.target.value }));
  };

  const onSystemChange = (key) => (e) => {
    setSuccess("");
    setError("");
    setSystem((prev) => ({ ...prev, [key]: e.target.value }));
  };

  // load all
  const loadAll = async () => {
    try {
      setLoading(true);
      setError("");

      // ---- BACKEND ВАРИАНТ ----
      // const [pRes, nRes, sRes] = await Promise.all([
      //   fetch(API_PROFILE_GET, { credentials: "include" }),
      //   fetch(API_NOTIF_GET, { credentials: "include" }),
      //   fetch(API_SYSTEM_GET, { credentials: "include" }),
      // ]);
      // if (!pRes.ok) throw new Error("Profil yüklənmədi");
      // if (!nRes.ok) throw new Error("Bildiriş parametrləri yüklənmədi");
      // if (!sRes.ok) throw new Error("Sistem parametrləri yüklənmədi");
      // const pData = await pRes.json();
      // const nData = await nRes.json();
      // const sData = await sRes.json();

      // ✅ MOCK (чтобы UI сразу работал)
      const pData = {
        firstName: "İstifadəçi",
        lastName: "Adminov",
        email: "admin@hesabla.az",
        phone: "+994 50 123 45 67",
      };

      const nData = {
        emailNotifications: true,
        lowStockAlerts: true,
        reportNotifications: false,
      };

      const sData = {
        currency: "AZN",
        language: "az",
        timezone: "Asia/Baku",
      };

      setProfile(pData);
      setProfileInitial(pData);

      setNotif(nData);
      setNotifInitial(nData);

      setSystem(sData);
      setSystemInitial(sData);
    } catch (e) {
      setError(e?.message || "Xəta baş verdi");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // validations
  const validateProfile = () => {
    if (!profile.firstName.trim()) return "Ad boş ola bilməz";
    if (!profile.lastName.trim()) return "Soyad boş ola bilməz";
    if (!profile.email.trim()) return "E-poçt boş ola bilməz";
    if (!profile.email.includes("@")) return "E-poçt formatı düzgün deyil";
    return "";
  };

  const validatePwd = () => {
    if (!pwd.currentPassword) return "Cari şifrə boş ola bilməz";
    if (!pwd.newPassword) return "Yeni şifrə boş ola bilməz";
    if (pwd.newPassword.length < 6)
      return "Yeni şifrə ən az 6 simvol olmalıdır";
    if (pwd.newPassword !== pwd.confirmPassword) return "Şifrələr uyğun gəlmir";
    if (pwd.currentPassword === pwd.newPassword)
      return "Yeni şifrə köhnə şifrə ilə eyni ola bilməz";
    return "";
  };

  // saves
  const saveProfile = async () => {
    setSuccess("");
    setError("");

    const v = validateProfile();
    if (v) return setError(v);

    try {
      setSavingProfile(true);

      // ---- BACKEND ----
      // const res = await fetch(API_PROFILE_UPDATE, {
      //   method: "PUT",
      //   headers: { "Content-Type": "application/json" },
      //   credentials: "include",
      //   body: JSON.stringify(profile),
      // });
      // if (!res.ok) throw new Error("Profil yadda saxlanılmadı");
      // const updated = await res.json();

      const updated = { ...profile }; // mock
      setProfile(updated);
      setProfileInitial(updated);
      setSuccess("Profil yadda saxlanıldı ✅");
    } catch (e) {
      setError(e?.message || "Profil yadda saxlanılmadı");
    } finally {
      setSavingProfile(false);
    }
  };

  const saveNotif = async () => {
    setSuccess("");
    setError("");

    try {
      setSavingNotif(true);

      // ---- BACKEND ----
      // const res = await fetch(API_NOTIF_UPDATE, {
      //   method: "PUT",
      //   headers: { "Content-Type": "application/json" },
      //   credentials: "include",
      //   body: JSON.stringify(notif),
      // });
      // if (!res.ok) throw new Error("Bildirişlər yadda saxlanılmadı");
      // const updated = await res.json();

      const updated = { ...notif }; // mock
      setNotif(updated);
      setNotifInitial(updated);
      setSuccess("Bildiriş parametrləri yadda saxlanıldı ✅");
    } catch (e) {
      setError(e?.message || "Bildirişlər yadda saxlanılmadı");
    } finally {
      setSavingNotif(false);
    }
  };

  const savePassword = async () => {
    setSuccess("");
    setError("");

    const v = validatePwd();
    if (v) return setError(v);

    try {
      setSavingPwd(true);

      // ---- BACKEND ----
      // const res = await fetch(API_PASSWORD_UPDATE, {
      //   method: "PUT",
      //   headers: { "Content-Type": "application/json" },
      //   credentials: "include",
      //   body: JSON.stringify({
      //     currentPassword: pwd.currentPassword,
      //     newPassword: pwd.newPassword,
      //   }),
      // });
      // if (!res.ok) throw new Error("Şifrə dəyişdirilmədi");

      setPwd(initialPassword);
      setSuccess("Şifrə uğurla dəyişdirildi ✅");
    } catch (e) {
      setError(e?.message || "Şifrə dəyişdirilmədi");
    } finally {
      setSavingPwd(false);
    }
  };

  const saveSystem = async () => {
    setSuccess("");
    setError("");

    try {
      setSavingSystem(true);

      // ---- BACKEND ----
      // const res = await fetch(API_SYSTEM_UPDATE, {
      //   method: "PUT",
      //   headers: { "Content-Type": "application/json" },
      //   credentials: "include",
      //   body: JSON.stringify(system),
      // });
      // if (!res.ok) throw new Error("Sistem parametrləri yadda saxlanılmadı");
      // const updated = await res.json();

      const updated = { ...system }; // mock
      setSystem(updated);
      setSystemInitial(updated);
      setSuccess("Sistem parametrləri yadda saxlanıldı ✅");
    } catch (e) {
      setError(e?.message || "Sistem parametrləri yadda saxlanılmadı");
    } finally {
      setSavingSystem(false);
    }
  };

  return (
    <div className="Settings-Wrapper">
      <div className="Settings-Inner">
        <div className="Settings-Titles">
          <div className="Settings-Title">Parametrlər</div>
          <div className="Settings-Name">
            Sistem və hesab parametrlərini idarə edin
          </div>
        </div>

        {error ? <div className="TopAlert error">{error}</div> : null}
        {success ? <div className="TopAlert success">{success}</div> : null}

        {/* ===== PROFILE CARD ===== */}
        <div className="CardShell">
          <div className="CardHeader">
            <div className="CardHeader-Left">
              <div className="CardHeader-Icon">
                <User size={18} />
              </div>
              <div className="CardHeader-Title">Profil Məlumatları</div>
            </div>

            <button
              className="PrimaryBtn"
              onClick={saveProfile}
              disabled={loading || savingProfile || !profileDirty}
              type="button"
            >
              {savingProfile ? (
                <Loader2 className="Spin" size={18} />
              ) : (
                <Save size={18} />
              )}
              <span>
                {savingProfile ? "Yadda saxlanılır..." : "Yadda saxla"}
              </span>
            </button>
          </div>

          <div className="CardBody">
            {loading ? (
              <div className="LoadingState">
                <Loader2 className="Spin" size={20} />
                <span>Yüklənir...</span>
              </div>
            ) : (
              <div className="ProfileForm">
                <div className="Grid2">
                  <div className="Field">
                    <label className="Label">Ad</label>
                    <input
                      className="Input"
                      value={profile.firstName}
                      onChange={onProfileChange("firstName")}
                      placeholder="Ad"
                    />
                  </div>

                  <div className="Field">
                    <label className="Label">Soyad</label>
                    <input
                      className="Input"
                      value={profile.lastName}
                      onChange={onProfileChange("lastName")}
                      placeholder="Soyad"
                    />
                  </div>
                </div>

                <div className="Field">
                  <label className="Label">E-poçt</label>
                  <input
                    className="Input"
                    value={profile.email}
                    onChange={onProfileChange("email")}
                    placeholder="example@mail.com"
                  />
                </div>

                <div className="Field">
                  <label className="Label">Telefon</label>
                  <input
                    className="Input"
                    value={profile.phone}
                    onChange={onProfileChange("phone")}
                    placeholder="+994 ..."
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ===== NOTIFICATIONS CARD ===== */}
        <div className="CardShell" style={{ marginTop: 18 }}>
          <div className="CardHeader">
            <div className="CardHeader-Left">
              <div className="CardHeader-Icon">
                <Bell size={18} />
              </div>
              <div className="CardHeader-Title">Bildiriş Parametrləri</div>
            </div>

            <button
              className="PrimaryBtn"
              onClick={saveNotif}
              disabled={loading || savingNotif || !notifDirty}
              type="button"
            >
              {savingNotif ? (
                <Loader2 className="Spin" size={18} />
              ) : (
                <Save size={18} />
              )}
              <span>{savingNotif ? "Yadda saxlanılır..." : "Yadda saxla"}</span>
            </button>
          </div>

          <div className="CardBody">
            {loading ? (
              <div className="LoadingState">
                <Loader2 className="Spin" size={20} />
                <span>Yüklənir...</span>
              </div>
            ) : (
              <div className="NotifList">
                <div className="NotifRow">
                  <div className="NotifText">
                    <div className="NotifTitle">E-poçt Bildirişləri</div>
                    <div className="NotifDesc">
                      Yeni əməliyyatlar haqqında e-poçt bildirişləri alın
                    </div>
                  </div>

                  <button
                    type="button"
                    className={`Switch ${notif.emailNotifications ? "on" : ""}`}
                    onClick={() => toggleNotif("emailNotifications")}
                    aria-pressed={notif.emailNotifications}
                  >
                    <span className="Knob" />
                  </button>
                </div>

                <div className="NotifRow">
                  <div className="NotifText">
                    <div className="NotifTitle">Aşağı Stok Xəbərdarlıqları</div>
                    <div className="NotifDesc">
                      Məhsullar minimum stok səviyyəsinə çatdıqda bildiriş alın
                    </div>
                  </div>

                  <button
                    type="button"
                    className={`Switch ${notif.lowStockAlerts ? "on" : ""}`}
                    onClick={() => toggleNotif("lowStockAlerts")}
                    aria-pressed={notif.lowStockAlerts}
                  >
                    <span className="Knob" />
                  </button>
                </div>

                <div className="NotifRow">
                  <div className="NotifText">
                    <div className="NotifTitle">Hesabat Bildirişləri</div>
                    <div className="NotifDesc">
                      Aylıq hesabatlar haqqında bildiriş alın
                    </div>
                  </div>

                  <button
                    type="button"
                    className={`Switch ${notif.reportNotifications ? "on" : ""}`}
                    onClick={() => toggleNotif("reportNotifications")}
                    aria-pressed={notif.reportNotifications}
                  >
                    <span className="Knob" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ===== SECURITY CARD ===== */}
        <div className="CardShell" style={{ marginTop: 18 }}>
          <div className="CardHeader">
            <div className="CardHeader-Left">
              <div className="CardHeader-Icon">
                <Lock size={18} />
              </div>
              <div className="CardHeader-Title">Təhlükəsizlik</div>
            </div>

            <button
              className="PrimaryBtn"
              onClick={savePassword}
              disabled={loading || savingPwd || !pwdDirty}
              type="button"
            >
              {savingPwd ? (
                <Loader2 className="Spin" size={18} />
              ) : (
                <Save size={18} />
              )}
              <span>{savingPwd ? "Yadda saxlanılır..." : "Yadda saxla"}</span>
            </button>
          </div>

          <div className="CardBody">
            {loading ? (
              <div className="LoadingState">
                <Loader2 className="Spin" size={20} />
                <span>Yüklənir...</span>
              </div>
            ) : (
              <div className="ProfileForm">
                <div className="Field">
                  <label className="Label">Cari Şifrə</label>
                  <input
                    className="Input"
                    type="password"
                    value={pwd.currentPassword}
                    onChange={onPwdChange("currentPassword")}
                    placeholder="••••••••"
                    autoComplete="current-password"
                  />
                </div>

                <div className="Field">
                  <label className="Label">Yeni Şifrə</label>
                  <input
                    className="Input"
                    type="password"
                    value={pwd.newPassword}
                    onChange={onPwdChange("newPassword")}
                    placeholder="••••••••"
                    autoComplete="new-password"
                  />
                </div>

                <div className="Field">
                  <label className="Label">Şifrəni Təsdiq Edin</label>
                  <input
                    className="Input"
                    type="password"
                    value={pwd.confirmPassword}
                    onChange={onPwdChange("confirmPassword")}
                    placeholder="••••••••"
                    autoComplete="new-password"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ===== SYSTEM CARD ===== */}
        <div className="CardShell" style={{ marginTop: 18 }}>
          <div className="CardHeader">
            <div className="CardHeader-Left">
              <div className="CardHeader-Icon">
                <Database size={18} />
              </div>
              <div className="CardHeader-Title">Sistem Parametrləri</div>
            </div>
          </div>

          <div className="CardBody">
            {loading ? (
              <div className="LoadingState">
                <Loader2 className="Spin" size={20} />
                <span>Yüklənir...</span>
              </div>
            ) : (
              <div className="ProfileForm">
                <div className="Field">
                  <label className="Label">Valyuta</label>
                  <select
                    className="Select"
                    value={system.currency}
                    onChange={onSystemChange("currency")}
                  >
                    <option value="AZN">Azərbaycan Manatı (₼)</option>
                    <option value="USD">US Dollar ($)</option>
                    <option value="EUR">Euro (€)</option>
                    <option value="TRY">Türk Lirəsi (₺)</option>
                  </select>
                </div>

                <div className="Field">
                  <label className="Label">Dil</label>
                  <select
                    className="Select"
                    value={system.language}
                    onChange={onSystemChange("language")}
                  >
                    <option value="az">Azərbaycan dili</option>
                    <option value="ru">Русский</option>
                    <option value="en">English</option>
                    <option value="tr">Türkçe</option>
                  </select>
                </div>

                <div className="Field">
                  <label className="Label">Zaman Zonası</label>
                  <select
                    className="Select"
                    value={system.timezone}
                    onChange={onSystemChange("timezone")}
                  >
                    <option value="Asia/Baku">Bakı (UTC+4)</option>
                    <option value="Europe/Moscow">Moskva (UTC+3)</option>
                    <option value="Europe/Istanbul">İstanbul (UTC+3)</option>
                    <option value="Europe/London">London (UTC+0)</option>
                  </select>
                </div>

                <div className="SystemFooter">
                  <button
                    className="SaveBigBtn"
                    type="button"
                    onClick={saveSystem}
                    disabled={savingSystem || !systemDirty}
                  >
                    {savingSystem ? (
                      <Loader2 className="Spin" size={18} />
                    ) : (
                      <Save size={18} />
                    )}
                    <span>
                      {savingSystem
                        ? "Yadda saxlanılır..."
                        : "Dəyişiklikləri Yadda Saxla"}
                    </span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
