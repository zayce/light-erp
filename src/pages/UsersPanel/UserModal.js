import { useCallback, useState } from "react";
import { Eye, EyeOff, Wand2, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { errorMessage } from "../../shared/api/axios";
import { useEscapeKey } from "../../hooks/useEscapeKey";
import { EMAIL_RE } from "./useUsers";
import { ROLES, ROLE_LABEL_KEYS, pagesOf } from "../../utils/access";

const randomPassword = () => {
  const chars = "abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = crypto.getRandomValues(new Uint8Array(10));
  return Array.from(bytes, (b) => chars[b % chars.length]).join("");
};

// Create (user = null) or edit a user. `onSubmit(form)` must throw on failure.
export default function UserModal({ user, isSelf, onSubmit, onClose }) {
  const { t } = useTranslation();
  const editing = Boolean(user);

  const [form, setForm] = useState({
    firstName: user?.firstName || "",
    lastName: user?.lastName || "",
    email: user?.email || "",
    phone: user?.phone || "",
    password: "",
    role: user?.role || "staff",
    active: user ? user.active : true,
  });
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [saving, setSaving] = useState(false);

  const close = useCallback(() => !saving && onClose(), [saving, onClose]);
  useEscapeKey(true, close);

  const set = (key) => (e) => {
    setForm((f) => ({ ...f, [key]: e.target.value }));
    setErrors((er) => ({ ...er, [key]: undefined }));
  };

  const validate = () => {
    const er = {};
    if (!form.firstName.trim()) er.firstName = t("users_err_first");
    if (!form.lastName.trim()) er.lastName = t("users_err_last");
    if (!EMAIL_RE.test(form.email.trim())) er.email = t("users_err_email");
    if (!editing && form.password.length < 6)
      er.password = t("users_err_password");
    return er;
  };

  const submit = async (e) => {
    e.preventDefault();
    const er = validate();
    setErrors(er);
    setFormError("");
    if (Object.keys(er).length) return;

    setSaving(true);
    try {
      await onSubmit(form);
      onClose();
    } catch (err) {
      const message = errorMessage(err, t("users_err_generic"));
      if (err?.response?.status === 409) setErrors({ email: message });
      else setFormError(message);
      setSaving(false);
    }
  };

  return (
    <div
      className="UserModalOverlay"
      onMouseDown={(e) => e.target === e.currentTarget && close()}
    >
      <form
        className="UserModal"
        onSubmit={submit}
        noValidate
        role="dialog"
        aria-modal="true"
      >
        <div className="UserModalHeader">
          <div className="UserModalTitle">
            {editing ? t("users_modal_edit") : t("users_modal_new")}
          </div>
          <button
            type="button"
            className="UserModalClose"
            onClick={close}
            aria-label={t("users_cancel")}
          >
            <X size={18} />
          </button>
        </div>

        <div className="UserModalBody">
          <div className="FormRow">
            <div className="FormGroup">
              <label className="FormLabel" htmlFor="um-first">
                {t("users_f_first")}
              </label>
              <input
                id="um-first"
                value={form.firstName}
                onChange={set("firstName")}
                autoFocus
              />
              {errors.firstName && (
                <div className="FieldError">{errors.firstName}</div>
              )}
            </div>
            <div className="FormGroup">
              <label className="FormLabel" htmlFor="um-last">
                {t("users_f_last")}
              </label>
              <input
                id="um-last"
                value={form.lastName}
                onChange={set("lastName")}
              />
              {errors.lastName && (
                <div className="FieldError">{errors.lastName}</div>
              )}
            </div>
          </div>

          <div className="FormGroup">
            <label className="FormLabel" htmlFor="um-email">
              {t("users_col_email")}
            </label>
            <input
              id="um-email"
              type="email"
              value={form.email}
              onChange={set("email")}
            />
            {errors.email && <div className="FieldError">{errors.email}</div>}
          </div>

          {editing && (
            <div className="FormGroup">
              <label className="FormLabel" htmlFor="um-phone">
                {t("users_f_phone")}
              </label>
              <input id="um-phone" value={form.phone} onChange={set("phone")} />
            </div>
          )}

          {!editing && (
            <div className="FormGroup">
              <label className="FormLabel" htmlFor="um-pass">
                {t("users_f_password")}
              </label>
              <div className="PasswordRow">
                <input
                  id="um-pass"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  placeholder={t("users_f_password_hint")}
                  value={form.password}
                  onChange={set("password")}
                />
                <button
                  type="button"
                  className="InlineBtn"
                  title={t("users_generate")}
                  aria-label={t("users_generate")}
                  onClick={() => {
                    setForm((f) => ({ ...f, password: randomPassword() }));
                    setErrors((er) => ({ ...er, password: undefined }));
                    setShowPassword(true);
                  }}
                >
                  <Wand2 size={16} />
                </button>
                <button
                  type="button"
                  className="InlineBtn"
                  aria-label={
                    showPassword
                      ? t("users_hide_password")
                      : t("users_show_password")
                  }
                  onClick={() => setShowPassword((v) => !v)}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.password && (
                <div className="FieldError">{errors.password}</div>
              )}
            </div>
          )}

          <div className="FormRow">
            <div className="FormGroup">
              <label className="FormLabel" htmlFor="um-role">
                {t("users_col_role")}
              </label>
              <select
                id="um-role"
                value={form.role}
                onChange={set("role")}
                disabled={isSelf}
              >
                {ROLES.map((r) => (
                  <option key={r} value={r}>
                    {t(ROLE_LABEL_KEYS[r])}
                  </option>
                ))}
              </select>
            </div>

            {editing && (
              <div className="FormGroup">
                <label className="FormLabel" htmlFor="um-status">
                  {t("users_col_status")}
                </label>
                <select
                  id="um-status"
                  value={form.active ? "1" : "0"}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, active: e.target.value === "1" }))
                  }
                  disabled={isSelf}
                >
                  <option value="1">{t("users_active")}</option>
                  <option value="0">{t("users_disabled")}</option>
                </select>
              </div>
            )}
          </div>

          <div className="FormHint">
            {t("users_role_access", {
              pages: pagesOf(form.role)
                .map((p) => t(`users_page_${p}`))
                .join(", "),
            })}{" "}
            {t("users_access_note")}
          </div>
          {isSelf && <div className="FormHint">{t("users_self_hint")}</div>}
          {formError && (
            <div className="FormError" role="alert">
              {formError}
            </div>
          )}
        </div>

        <div className="UserModalFooter">
          <button type="button" className="ModalBtn cancel" onClick={close}>
            {t("users_cancel")}
          </button>
          <button type="submit" className="ModalBtn save" disabled={saving}>
            {saving
              ? t("users_saving")
              : editing
                ? t("users_save")
                : t("users_create")}
          </button>
        </div>
      </form>
    </div>
  );
}
