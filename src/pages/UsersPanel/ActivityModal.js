import { useCallback, useEffect, useState } from "react";
import { X } from "lucide-react";
import dayjs from "dayjs";
import { useTranslation } from "react-i18next";
import { errorMessage } from "../../shared/api/axios";
import { useEscapeKey } from "../../hooks/useEscapeKey";
import { ROLE_LABEL_KEYS } from "../../utils/access";
import { usersService } from "./usersService";

const PAGE_SIZE = 20;
const FIELD_KEYS = {
  firstName: "users_f_first",
  lastName: "users_f_last",
  email: "users_col_email",
  phone: "users_f_phone",
};

// One readable sentence per audit entry, in the current language.
export const describe = (e, t) => {
  const role = (r) => t(ROLE_LABEL_KEYS[r] || ROLE_LABEL_KEYS.staff);
  const base = { actor: e.actorName, target: e.targetName };

  switch (e.action) {
    case "user.create":
      return t("users_log_create", { ...base, role: role(e.meta?.role) });
    case "user.update": {
      const parts = (e.meta?.fields || []).map((f) => t(FIELD_KEYS[f] || f));
      if (e.meta?.role) {
        parts.push(
          t("users_log_role", {
            from: role(e.meta.role.from),
            to: role(e.meta.role.to),
          }),
        );
      }
      return t("users_log_update", { ...base, details: parts.join(", ") });
    }
    case "user.enable":
      return t("users_log_enable", base);
    case "user.disable":
      return t("users_log_disable", base);
    case "user.password":
      return t("users_log_password", base);
    case "user.delete":
      return t("users_log_delete", base);
    default:
      return `${e.actorName}: ${e.action} ${e.targetName}`;
  }
};

export default function ActivityModal({ onClose }) {
  const { t } = useTranslation();
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEscapeKey(true, onClose);

  const load = useCallback(
    async (offset) => {
      setLoading(true);
      setError("");
      try {
        const res = await usersService.activity({ limit: PAGE_SIZE, offset });
        setItems((prev) =>
          offset === 0 ? res.items : [...prev, ...res.items],
        );
        setTotal(res.total);
      } catch (e) {
        setError(errorMessage(e, t("users_err_generic")));
      } finally {
        setLoading(false);
      }
    },
    [t],
  );

  useEffect(() => {
    load(0);
  }, [load]);

  return (
    <div
      className="UserModalOverlay"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="UserModal ActivityModal"
        role="dialog"
        aria-modal="true"
        aria-label={t("users_log_title")}
      >
        <div className="UserModalHeader">
          <div className="UserModalTitle">{t("users_log_title")}</div>
          <button
            type="button"
            className="UserModalClose"
            onClick={onClose}
            aria-label={t("users_close")}
          >
            <X size={18} />
          </button>
        </div>

        <div className="UserModalBody">
          {error && (
            <div className="FormError" role="alert">
              {error}
            </div>
          )}
          {!loading && !error && items.length === 0 && (
            <div className="EmptyUsers">{t("users_log_empty")}</div>
          )}

          <ul className="ActivityList">
            {items.map((e) => (
              <li className="ActivityItem" key={e.id}>
                <time
                  className="ActivityTime"
                  dateTime={new Date(e.at).toISOString()}
                >
                  {dayjs(e.at).format("DD.MM.YYYY HH:mm")}
                </time>
                <span>{describe(e, t)}</span>
              </li>
            ))}
          </ul>

          {loading && <div className="EmptyUsers">{t("users_loading")}</div>}
          {!loading && items.length < total && (
            <button
              type="button"
              className="BulkBtn"
              onClick={() => load(items.length)}
            >
              {t("users_log_more")}
            </button>
          )}
        </div>

        <div className="UserModalFooter">
          <button type="button" className="ModalBtn cancel" onClick={onClose}>
            {t("users_close")}
          </button>
        </div>
      </div>
    </div>
  );
}
