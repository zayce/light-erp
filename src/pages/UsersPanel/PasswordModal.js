import { useCallback, useState } from "react";
import { X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { errorMessage } from "../../shared/api/axios";
import { useEscapeKey } from "../../hooks/useEscapeKey";
import { fullName } from "./useUsers";

// Admin sets a new password for a colleague. `onSubmit(password)` must throw on failure.
export default function PasswordModal({ user, onSubmit, onClose }) {
  const { t } = useTranslation();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const close = useCallback(() => !saving && onClose(), [saving, onClose]);
  useEscapeKey(true, close);

  const submit = async (e) => {
    e.preventDefault();
    if (password.length < 6) return setError(t("users_err_password"));

    setSaving(true);
    try {
      await onSubmit(password);
      onClose();
    } catch (err) {
      setError(errorMessage(err, t("users_err_generic")));
      setSaving(false);
    }
  };

  return (
    <div
      className="UserModalOverlay"
      onMouseDown={(e) => e.target === e.currentTarget && close()}
    >
      <form className="UserModal" onSubmit={submit} noValidate role="dialog" aria-modal="true">
        <div className="UserModalHeader">
          <div className="UserModalTitle">
            {t("users_pwd_title", { name: fullName(user) })}
          </div>
          <button type="button" className="UserModalClose" onClick={close} aria-label={t("users_cancel")}>
            <X size={18} />
          </button>
        </div>

        <div className="UserModalBody">
          <div className="FormGroup">
            <label className="FormLabel" htmlFor="pm-pass">{t("users_f_new_password")}</label>
            <input
              id="pm-pass"
              type="password"
              autoComplete="new-password"
              placeholder={t("users_f_password_hint")}
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setError("");
              }}
              autoFocus
            />
            {error && <div className="FieldError" role="alert">{error}</div>}
          </div>
          <div className="FormHint">{t("users_pwd_note")}</div>
        </div>

        <div className="UserModalFooter">
          <button type="button" className="ModalBtn cancel" onClick={close}>
            {t("users_cancel")}
          </button>
          <button type="submit" className="ModalBtn save" disabled={saving}>
            {saving ? t("users_saving") : t("users_save")}
          </button>
        </div>
      </form>
    </div>
  );
}
