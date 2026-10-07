import { useEffect, useMemo, useState } from "react";
import {
  User,
  Save,
  Loader2,
  Bell,
  Lock,
  Database,
  Users,
  Download,
  Upload,
  Trash2,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import i18n from "../../i18n";
import { api, errorMessage } from "../../shared/api/axios";
import { useAuth } from "../../AuthContext";
import { useApp } from "../../AppContext";
import { buildBackup, parseBackup } from "../../utils/backup";
import { downloadFile } from "../../utils/csv";
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
  const { t } = useTranslation();
  const { user, updateUser } = useAuth();
  const { state, dispatch } = useApp();
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

  // Profile and notifications come from the signed-in user, system settings from the shared data.
  useEffect(() => {
    if (!user) return;

    const pData = {
      firstName: user.firstName || "",
      lastName: user.lastName || "",
      email: user.email || "",
      phone: user.phone || "",
    };
    const nData = { ...initialNotifications, ...(user.notifications || {}) };

    setProfile(pData);
    setProfileInitial(pData);
    setNotif(nData);
    setNotifInitial(nData);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    const sData = { ...initialSystem, ...(state.settings || {}) };
    setSystem(sData);
    setSystemInitial(sData);
  }, [state.settings]);

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
      const res = await api.put("/auth/profile", profile);
      updateUser(res.data.user);
      setSuccess("Profil yadda saxlanıldı ✅");
    } catch (e) {
      setError(errorMessage(e, "Profil yadda saxlanılmadı"));
    } finally {
      setSavingProfile(false);
    }
  };

  const saveNotif = async () => {
    setSuccess("");
    setError("");

    try {
      setSavingNotif(true);
      const res = await api.put("/auth/notifications", notif);
      updateUser(res.data.user);
      setSuccess("Bildiriş parametrləri yadda saxlanıldı ✅");
    } catch (e) {
      setError(errorMessage(e, "Bildirişlər yadda saxlanılmadı"));
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
      const res = await api.put("/auth/password", {
        currentPassword: pwd.currentPassword,
        newPassword: pwd.newPassword,
      });
      // the server revoked every old token and issued a new one for this device
      updateUser(res.data.user, res.data.token);
      setPwd(initialPassword);
      setSuccess("Şifrə uğurla dəyişdirildi ✅");
    } catch (e) {
      setError(errorMessage(e, "Şifrə dəyişdirilmədi"));
    } finally {
      setSavingPwd(false);
    }
  };

  const saveSystem = async () => {
    setSuccess("");
    setError("");

    setSavingSystem(true);
    dispatch({ type: "UPDATE_SETTINGS", payload: system });
    setSavingSystem(false);
    setSuccess(
      "Sistem parametrləri yadda saxlanıldı ✅ (valyuta yalnız simvolu dəyişir, məbləğlər çevrilmir)",
    );
  };

  // ---- backup ----
  const exportBackup = () => {
    const stamp = new Date().toISOString().slice(0, 10);
    downloadFile(
      `hesabla-ehtiyat-${stamp}.json`,
      JSON.stringify(buildBackup(state), null, 2),
      "application/json",
    );
  };

  const importBackup = (e) => {
    const file = e.target.files?.[0];
    e.target.value = ""; // allows choosing the same file again
    if (!file) return;

    setSuccess("");
    setError("");

    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = parseBackup(String(reader.result));
        const ok = window.confirm(
          `Fayldan ${data.anbar.length} məhsul, ${data.report.length} hesabat və ${data.cashflow.length} pul axını qeydi yüklənəcək.\n\nCari məlumatların hamısı əvəz olunacaq. Davam edilsin?`,
        );
        if (!ok) return;
        dispatch({ type: "REPLACE_DATA", payload: data });
        setSuccess("Ehtiyat nüsxə yükləndi ✅");
      } catch (err) {
        setError(err.message || "Fayl oxunmadı");
      }
    };
    reader.onerror = () => setError("Fayl oxunmadı");
    reader.readAsText(file);
  };

  // ---- users (admin only) ----
  const isAdmin = user?.role === "admin";
  const [team, setTeam] = useState([]);
  const [newUser, setNewUser] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    role: "staff",
  });
  const [addingUser, setAddingUser] = useState(false);

  const loadTeam = () =>
    api
      .get("/users")
      .then((res) => setTeam(res.data))
      .catch((e) => setError(errorMessage(e, "İstifadəçilər yüklənmədi")));

  useEffect(() => {
    if (isAdmin) loadTeam();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin]);

  const addUser = async () => {
    setSuccess("");
    setError("");
    try {
      setAddingUser(true);
      await api.post("/users", newUser);
      setNewUser({ firstName: "", lastName: "", email: "", password: "", role: "staff" });
      await loadTeam();
      setSuccess("İstifadəçi əlavə olundu ✅");
    } catch (e) {
      setError(errorMessage(e, "İstifadəçi əlavə olunmadı"));
    } finally {
      setAddingUser(false);
    }
  };

  const removeUser = async (u) => {
    if (!window.confirm(`${u.firstName} ${u.lastName} silinsin?`)) return;
    setSuccess("");
    setError("");
    try {
      await api.delete(`/users/${u.id}`);
      await loadTeam();
      setSuccess("İstifadəçi silindi ✅");
    } catch (e) {
      setError(errorMessage(e, "İstifadəçi silinmədi"));
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
                    onChange={(e) => {
                      onSystemChange("language")(e);
                      i18n.changeLanguage(e.target.value);
                    }}
                  >
                    <option value="az">Azərbaycan dili</option>
                    <option value="ru">Русский</option>
                    <option value="en">English</option>
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

        {/* ===== BACKUP CARD ===== */}
        <div className="CardShell" style={{ marginTop: 18 }}>
          <div className="CardHeader">
            <div className="CardHeader-Left">
              <div className="CardHeader-Icon">
                <Download size={18} />
              </div>
              <div className="CardHeader-Title">Ehtiyat nüsxə</div>
            </div>
          </div>
          <div className="CardBody">
            <div className="ProfileForm">
              <p style={{ margin: 0, color: "#64748b" }}>
                Bütün məlumatları (anbar, hesabatlar, pul axını, alışlar) JSON faylına saxlayın və ya əvvəlki
                fayldan bərpa edin. Bərpa cari məlumatları əvəz edir.
              </p>
              <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                <button className="PrimaryBtn" type="button" onClick={exportBackup}>
                  <Download size={18} />
                  <span>Yüklə (JSON)</span>
                </button>
                <label className="PrimaryBtn" style={{ cursor: "pointer" }}>
                  <Upload size={18} />
                  <span>Fayldan bərpa et</span>
                  <input
                    type="file"
                    accept="application/json,.json"
                    onChange={importBackup}
                    style={{ display: "none" }}
                  />
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* ===== USERS CARD (admin) ===== */}
        {isAdmin && (
          <div className="CardShell" style={{ marginTop: 18 }}>
            <div className="CardHeader">
              <div className="CardHeader-Left">
                <div className="CardHeader-Icon">
                  <Users size={18} />
                </div>
                <div className="CardHeader-Title">İstifadəçilər</div>
              </div>
            </div>
            <div className="CardBody">
              <div className="ProfileForm">
                {team.map((u) => (
                  <div
                    key={u.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: 12,
                      padding: "8px 0",
                      borderBottom: "1px solid #f1f5f9",
                    }}
                  >
                    <div>
                      <strong>
                        {u.firstName} {u.lastName}
                      </strong>{" "}
                      <span style={{ color: "#64748b" }}>
                        ({u.role === "admin" ? "admin" : "işçi"})
                      </span>
                      <div style={{ color: "#64748b", fontSize: 14 }}>{u.email}</div>
                    </div>
                    {u.id !== user.id && (
                      <button
                        type="button"
                        onClick={() => removeUser(u)}
                        title="Sil"
                        aria-label="Sil"
                        style={{ border: 0, background: "transparent", cursor: "pointer", color: "#94a3b8" }}
                      >
                        <Trash2 size={18} />
                      </button>
                    )}
                  </div>
                ))}

                <div className="Grid2" style={{ marginTop: 12 }}>
                  <div className="Field">
                    <label className="Label">Ad</label>
                    <input
                      className="Input"
                      value={newUser.firstName}
                      onChange={(e) => setNewUser({ ...newUser, firstName: e.target.value })}
                    />
                  </div>
                  <div className="Field">
                    <label className="Label">Soyad</label>
                    <input
                      className="Input"
                      value={newUser.lastName}
                      onChange={(e) => setNewUser({ ...newUser, lastName: e.target.value })}
                    />
                  </div>
                  <div className="Field">
                    <label className="Label">E-poçt</label>
                    <input
                      className="Input"
                      type="email"
                      value={newUser.email}
                      onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                    />
                  </div>
                  <div className="Field">
                    <label className="Label">Şifrə (ən az 6 simvol)</label>
                    <input
                      className="Input"
                      type="password"
                      autoComplete="new-password"
                      value={newUser.password}
                      onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                    />
                  </div>
                  <div className="Field">
                    <label className="Label">Rol</label>
                    <select
                      className="Select"
                      value={newUser.role}
                      onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                    >
                      <option value="staff">İşçi</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>
                </div>

                <div className="SystemFooter">
                  <button className="SaveBigBtn" type="button" onClick={addUser} disabled={addingUser}>
                    {addingUser ? <Loader2 className="Spin" size={18} /> : <Save size={18} />}
                    <span>{addingUser ? "Əlavə olunur..." : "İstifadəçi əlavə et"}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
