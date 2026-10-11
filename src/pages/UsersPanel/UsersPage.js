import "./UsersPage.scss";
import { useEffect, useRef, useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  ChevronRight,
  Download,
  History,
  KeyRound,
  MoreVertical,
  Pencil,
  Power,
  Search,
  Settings2,
  Trash2,
  UserPlus,
} from "lucide-react";
import toast from "react-hot-toast";
import dayjs from "dayjs";
import { useTranslation } from "react-i18next";
import { useAuth } from "../../AuthContext";
import { errorMessage } from "../../shared/api/axios";
import { downloadCsv, toCsv } from "../../utils/csv";
import useUsers, { UNDO_MS, fullName } from "./useUsers";
import UserModal from "./UserModal";
import PasswordModal from "./PasswordModal";
import ActivityModal from "./ActivityModal";
import { ROLE_LABEL_KEYS } from "../../utils/access";

const initial = (u) => (u.firstName || u.email || "?").charAt(0).toUpperCase();
const formatDate = (ts) => (ts ? dayjs(ts).format("DD.MM.YYYY HH:mm") : null);

const RoleCard = ({ title, data, onOpen, onSeeAll, onManage, t }) => (
  <div className="RoleCard">
    <div className="RoleCard-Top">
      <div className="RoleCard-Title">{title}</div>
      <button type="button" className="RoleCard-SeeAll" onClick={onSeeAll}>
        {t("users_see_all")}
      </button>
    </div>

    <div className="RoleCard-List">
      {data.length > 0 ? (
        data.map((u) => (
          <button
            type="button"
            className="RoleUserItem"
            key={u.id}
            onClick={() => onOpen(u)}
          >
            <div className="RoleUserItem-Left">
              <div className="RoleUserAvatar">{initial(u)}</div>
              <div className="RoleUserInfo">
                <div className="RoleUserName">{fullName(u)}</div>
                <div className="RoleUserEmail">{u.email}</div>
              </div>
            </div>
            <div
              className={`RoleUserStatus ${u.active ? "enabled" : "disabled"}`}
            >
              {u.active ? t("users_active") : t("users_disabled")}
            </div>
          </button>
        ))
      ) : (
        <div className="RoleCard-Empty">{t("users_card_empty")}</div>
      )}
    </div>

    <button type="button" className="RoleCard-Bottom" onClick={onManage}>
      <Settings2 size={16} />
      <div>{t("users_manage")}</div>
    </button>
  </div>
);

const SortHead = ({ label, field, sort, onSort }) => (
  <button type="button" className="SortHead" onClick={() => onSort(field)}>
    {label}
    {sort.key === field &&
      (sort.dir === "asc" ? <ArrowUp size={12} /> : <ArrowDown size={12} />)}
  </button>
);

export default function UsersPage() {
  const { t } = useTranslation();
  const { user: me, updateUser } = useAuth();
  const s = useUsers(me?.id);

  const tableRef = useRef(null);
  const undoToasts = useRef([]);
  const [modal, setModal] = useState(null); // { user?, role? }
  const [pwdUser, setPwdUser] = useState(null);
  const [showLog, setShowLog] = useState(false);
  const [menuId, setMenuId] = useState(null);

  const roleLabel = (r) => t(ROLE_LABEL_KEYS[r] || ROLE_LABEL_KEYS.staff);

  // close the row menu on any outside click
  useEffect(() => {
    if (!menuId) return;
    const close = () => setMenuId(null);
    document.addEventListener("click", close);
    return () => document.removeEventListener("click", close);
  }, [menuId]);

  // an "undo" toast must not outlive this page
  useEffect(
    () => () => {
      // eslint-disable-next-line react-hooks/exhaustive-deps
      undoToasts.current.forEach((id) => toast.dismiss(id));
    },
    [],
  );

  const showGroup = ({ role = "all", status = "all" }) => {
    s.setRole(role);
    s.setStatus(status);
  };
  const manageGroup = (filters) => {
    showGroup(filters);
    tableRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  // ---------- actions ----------
  const submitUser = async (form) => {
    if (modal.user) {
      const patch = {
        firstName: form.firstName,
        lastName: form.lastName,
        email: form.email,
        phone: form.phone,
      };
      if (!s.isSelf(modal.user)) {
        patch.role = form.role;
        patch.active = form.active;
      }
      const saved = await s.update(modal.user.id, patch);
      // editing yourself: refresh the sidebar / header, which read from AuthContext
      if (s.isSelf(modal.user)) updateUser(saved);
      toast.success(t("users_toast_saved"));
    } else {
      await s.create({
        firstName: form.firstName,
        lastName: form.lastName,
        email: form.email,
        password: form.password,
        role: form.role,
      });
      toast.success(t("users_toast_created"));
    }
  };

  const toggleActive = async (u) => {
    try {
      await s.update(u.id, { active: !u.active });
      toast.success(
        t(u.active ? "users_toast_disabled" : "users_toast_enabled", {
          name: fullName(u),
        }),
      );
    } catch (e) {
      toast.error(errorMessage(e, t("users_err_generic")));
    }
  };

  const bulkActive = async (active) => {
    const list = s.selectedUsers.filter((u) => Boolean(u.active) !== active);
    if (!list.length) return s.clearSelection();
    const { ok, failed, firstError } = await s.bulkSetActive(list, active);
    if (ok) toast.success(t("users_bulk_done", { count: ok }));
    if (failed)
      toast.error(firstError || t("users_bulk_failed", { count: failed }));
  };

  const startDelete = (list) => {
    if (!list.length) return;

    const undo = s.scheduleDelete(list, ({ failed, firstError }) => {
      if (failed)
        toast.error(firstError || t("users_bulk_failed", { count: failed }));
    });
    const message =
      list.length === 1
        ? t("users_deleted", { name: fullName(list[0]) })
        : t("users_deleted_many", { count: list.length });

    const id = toast(
      (tt) => (
        <span style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <span>{message}</span>
          <button
            type="button"
            style={{
              border: 0,
              background: "transparent",
              color: "#2d3e4d",
              fontWeight: 700,
              textDecoration: "underline",
              cursor: "pointer",
            }}
            onClick={() => {
              undo();
              toast.dismiss(tt.id);
              toast.success(t("users_restored"));
            }}
          >
            {t("users_undo")}
          </button>
        </span>
      ),
      { duration: UNDO_MS },
    );
    undoToasts.current.push(id);
  };

  const exportCsv = () => {
    if (!s.filtered.length) return toast.error(t("users_nothing_to_export"));
    const csv = toCsv(s.filtered, [
      { label: t("users_f_first"), value: (u) => u.firstName },
      { label: t("users_f_last"), value: (u) => u.lastName },
      { label: t("users_col_email"), value: (u) => u.email },
      { label: t("users_f_phone"), value: (u) => u.phone },
      { label: t("users_col_role"), value: (u) => roleLabel(u.role) },
      {
        label: t("users_col_status"),
        value: (u) => (u.active ? t("users_active") : t("users_disabled")),
      },
      {
        label: t("users_col_created"),
        value: (u) => formatDate(u.createdAt) || "",
      },
      {
        label: t("users_col_last"),
        value: (u) => formatDate(u.lastLoginAt) || "",
      },
    ]);
    downloadCsv(`users-${dayjs().format("YYYY-MM-DD")}.csv`, csv);
  };

  const ofRole = (role) => s.users.filter((u) => u.role === role).slice(0, 3);

  const tabs = [
    ["all", `${t("users_tab_all")} (${s.counts.all})`],
    ["admin", `${t("users_role_admin")} (${s.counts.admin})`],
    ["staff", `${t("users_role_staff")} (${s.counts.staff})`],
    ["warehouse", `${t("users_role_warehouse")} (${s.counts.warehouse})`],
    ["accountant", `${t("users_role_accountant")} (${s.counts.accountant})`],
  ];

  const filtersOn = s.role !== "all" || s.status !== "all" || s.query;

  return (
    <div className="UsersPage-Wrapper">
      <div className="UsersPage-Inner">
        <div className="UsersTopbar">
          <div className="UsersTopbar-Left">
            <div className="UsersTopbar-Title">{t("users_title")}</div>
            <div className="UsersBreadcrumb">
              <div className="crumb">{t("users_crumb_home")}</div>
              <ChevronRight size={14} />
              <div className="crumb">{t("users_crumb_panel")}</div>
              <ChevronRight size={14} />
              <div className="crumb active">{t("users_title")}</div>
            </div>
          </div>

          <div className="UsersTopbar-Right">
            <div className="TopUserMini">
              <div className="TopUserAvatar">{me ? initial(me) : "?"}</div>
              <div className="TopUserName">
                {me ? fullName(me) : t("users_user")}
              </div>
            </div>
          </div>
        </div>

        <div className="UsersContentCard">
          <div className="UsersContentHeader">
            <div className="UsersContentHeader-Left">
              <div className="UsersContentTitle">{t("users_title")}</div>
              <div className="UsersContentDesc">{t("users_desc")}</div>
            </div>

            <div className="UsersHeaderActions">
              <button
                type="button"
                className="UsersLogButton"
                onClick={() => setShowLog(true)}
              >
                <History size={16} />
                <div>{t("users_log_open")}</div>
              </button>
              <button
                type="button"
                className="UsersAddButton"
                onClick={() => setModal({})}
              >
                <UserPlus size={16} />
                <div>{t("users_add")}</div>
              </button>
            </div>
          </div>

          <div className="UsersRolesGrid">
            <RoleCard
              t={t}
              title={t("users_card_admin")}
              data={ofRole("admin")}
              onOpen={(u) => setModal({ user: u })}
              onSeeAll={() => showGroup({ role: "admin" })}
              onManage={() => manageGroup({ role: "admin" })}
            />
            <RoleCard
              t={t}
              title={t("users_card_warehouse")}
              data={ofRole("warehouse")}
              onOpen={(u) => setModal({ user: u })}
              onSeeAll={() => showGroup({ role: "warehouse" })}
              onManage={() => manageGroup({ role: "warehouse" })}
            />
            <RoleCard
              t={t}
              title={t("users_card_accountant")}
              data={ofRole("accountant")}
              onOpen={(u) => setModal({ user: u })}
              onSeeAll={() => showGroup({ role: "accountant" })}
              onManage={() => manageGroup({ role: "accountant" })}
            />
          </div>

          <div className="UsersTableCard" ref={tableRef}>
            <div className="UsersTableHeader">
              <div className="UsersTableHeader-Left">
                <div className="UsersTableTitle">{t("users_accounts")}</div>
                <div className="UsersTabs">
                  {tabs.map(([key, label]) => (
                    <button
                      type="button"
                      key={key}
                      className={`UsersTab ${s.role === key ? "active" : ""}`}
                      onClick={() => s.setRole(key)}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="UsersTableHeader-Right">
                <div className="SearchBox">
                  <Search size={16} />
                  <input
                    type="text"
                    placeholder={t("users_search")}
                    aria-label={t("users_search")}
                    value={s.query}
                    onChange={(e) => s.setQuery(e.target.value)}
                  />
                </div>

                <select
                  className="SortButton"
                  value={s.status}
                  aria-label={t("users_col_status")}
                  onChange={(e) => s.setStatus(e.target.value)}
                >
                  <option value="all">{t("users_status_all")}</option>
                  <option value="active">{t("users_active")}</option>
                  <option value="disabled">{t("users_disabled")}</option>
                </select>

                <button
                  type="button"
                  className="FilterButton"
                  title={t("users_export")}
                  aria-label={t("users_export")}
                  onClick={exportCsv}
                >
                  <Download size={16} />
                </button>
              </div>
            </div>

            {s.selected.size > 0 && (
              <div className="BulkBar" role="region" aria-live="polite">
                <div className="BulkBar-Count">
                  {t("users_selected", { count: s.selected.size })}
                </div>
                <div className="BulkBar-Actions">
                  <button
                    type="button"
                    className="BulkBtn"
                    onClick={() => bulkActive(true)}
                  >
                    {t("users_enable")}
                  </button>
                  <button
                    type="button"
                    className="BulkBtn"
                    onClick={() => bulkActive(false)}
                  >
                    {t("users_disable")}
                  </button>
                  <button
                    type="button"
                    className="BulkBtn danger"
                    onClick={() => startDelete(s.selectedUsers)}
                  >
                    {t("users_delete")}
                  </button>
                  <button
                    type="button"
                    className="BulkBtn ghost"
                    onClick={s.clearSelection}
                  >
                    {t("users_clear")}
                  </button>
                </div>
              </div>
            )}

            <div className="UsersTable">
              <div className="UsersTable-Head">
                <div className="col check">
                  <input
                    type="checkbox"
                    aria-label={t("users_select_page")}
                    checked={s.allPageSelected}
                    disabled={s.selectableOnPage.length === 0}
                    onChange={s.togglePage}
                  />
                </div>
                <div className="col tag" />
                <div className="col name">
                  <SortHead
                    label={t("users_col_name")}
                    field="name"
                    sort={s.sort}
                    onSort={s.toggleSort}
                  />
                </div>
                <div className="col email">
                  <SortHead
                    label={t("users_col_email")}
                    field="email"
                    sort={s.sort}
                    onSort={s.toggleSort}
                  />
                </div>
                <div className="col role">
                  <SortHead
                    label={t("users_col_role")}
                    field="role"
                    sort={s.sort}
                    onSort={s.toggleSort}
                  />
                </div>
                <div className="col status">
                  <SortHead
                    label={t("users_col_status")}
                    field="status"
                    sort={s.sort}
                    onSort={s.toggleSort}
                  />
                </div>
                <div className="col last">
                  <SortHead
                    label={t("users_col_last")}
                    field="lastLoginAt"
                    sort={s.sort}
                    onSort={s.toggleSort}
                  />
                </div>
                <div className="col action">{t("users_col_actions")}</div>
                <div className="col more" />
              </div>

              <div className="UsersTable-Body">
                {s.loading && (
                  <div className="EmptyUsers">{t("users_loading")}</div>
                )}

                {!s.loading && s.loadError !== null && (
                  <div className="EmptyUsers">
                    <div>
                      {t("users_load_error")}
                      {s.loadError ? `: ${s.loadError}` : ""}
                    </div>
                    <button type="button" className="BulkBtn" onClick={s.load}>
                      {t("users_retry")}
                    </button>
                  </div>
                )}

                {!s.loading && s.loadError === null && s.paged.length === 0 && (
                  <div className="EmptyUsers">
                    <div>{t("users_empty")}</div>
                    {filtersOn && (
                      <button
                        type="button"
                        className="BulkBtn"
                        onClick={s.resetFilters}
                      >
                        {t("users_reset_filters")}
                      </button>
                    )}
                  </div>
                )}

                {s.paged.map((u) => {
                  const self = s.isSelf(u);
                  const last = formatDate(u.lastLoginAt);
                  return (
                    <div
                      className={`UsersTable-Row ${u.active ? "" : "is-disabled"}`}
                      key={u.id}
                      data-testid="user-row"
                    >
                      <div className="col check">
                        <input
                          type="checkbox"
                          aria-label={fullName(u)}
                          checked={s.selected.has(u.id)}
                          disabled={self}
                          onChange={() => s.toggleSelect(u.id)}
                        />
                      </div>
                      <div className="col tag">
                        <div className="TableAvatar">{initial(u)}</div>
                      </div>
                      <div className="col name">
                        {fullName(u)}
                        {self && (
                          <span className="YouBadge">{t("users_you")}</span>
                        )}
                      </div>
                      <div className="col email">{u.email}</div>
                      <div className="col role">{roleLabel(u.role)}</div>
                      <div className="col status">
                        <button
                          type="button"
                          className={`StatusPill ${u.active ? "enabled" : "disabled"}`}
                          disabled={self}
                          title={
                            self
                              ? t("users_tip_self")
                              : t(u.active ? "users_disable" : "users_enable")
                          }
                          onClick={() => toggleActive(u)}
                        >
                          {u.active ? t("users_active") : t("users_disabled")}
                        </button>
                      </div>
                      <div className="col last">
                        {last || (
                          <span className="Muted">{t("users_never")}</span>
                        )}
                      </div>

                      <div className="col action">
                        <div className="RowActions">
                          <button
                            type="button"
                            className="ActionIcon edit"
                            title={t("users_edit")}
                            aria-label={t("users_edit")}
                            onClick={() => setModal({ user: u })}
                          >
                            <Pencil size={15} />
                          </button>
                          <button
                            type="button"
                            className="ActionIcon delete"
                            title={
                              self ? t("users_tip_self") : t("users_delete")
                            }
                            aria-label={t("users_delete")}
                            disabled={self}
                            onClick={() => startDelete([u])}
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </div>

                      <div className="col more">
                        <div className="MoreWrapper">
                          <button
                            type="button"
                            className="MoreButton"
                            aria-label="⋮"
                            onClick={(e) => {
                              e.stopPropagation();
                              setMenuId(menuId === u.id ? null : u.id);
                            }}
                          >
                            <MoreVertical size={16} />
                          </button>

                          {menuId === u.id && (
                            <div className="MoreMenu">
                              <button
                                type="button"
                                className="MoreMenuItem"
                                onClick={() => setModal({ user: u })}
                              >
                                <Pencil size={14} />
                                <div>{t("users_edit")}</div>
                              </button>
                              {!self && (
                                <button
                                  type="button"
                                  className="MoreMenuItem"
                                  onClick={() => setPwdUser(u)}
                                >
                                  <KeyRound size={14} />
                                  <div>{t("users_password")}</div>
                                </button>
                              )}
                              {!self && (
                                <button
                                  type="button"
                                  className="MoreMenuItem"
                                  onClick={() => toggleActive(u)}
                                >
                                  <Power size={14} />
                                  <div>
                                    {t(
                                      u.active
                                        ? "users_disable"
                                        : "users_enable",
                                    )}
                                  </div>
                                </button>
                              )}
                              {!self && (
                                <button
                                  type="button"
                                  className="MoreMenuItem danger"
                                  onClick={() => startDelete([u])}
                                >
                                  <Trash2 size={14} />
                                  <div>{t("users_delete")}</div>
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {s.pageCount > 1 && (
              <div className="UsersPagination">
                <button
                  type="button"
                  className={`PageNav ${s.page === 1 ? "disabled" : ""}`}
                  onClick={() => s.setPage(s.page - 1)}
                >
                  {t("users_prev")}
                </button>
                <div className="PageNumbers">
                  {Array.from({ length: s.pageCount }, (_, i) => (
                    <button
                      type="button"
                      key={i + 1}
                      className={`PageNumber ${s.page === i + 1 ? "active" : ""}`}
                      onClick={() => s.setPage(i + 1)}
                    >
                      {i + 1}
                    </button>
                  ))}
                </div>
                <button
                  type="button"
                  className={`PageNav ${s.page === s.pageCount ? "disabled" : ""}`}
                  onClick={() => s.setPage(s.page + 1)}
                >
                  {t("users_next")}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {modal && (
        <UserModal
          user={modal.user}
          isSelf={modal.user ? s.isSelf(modal.user) : false}
          onSubmit={submitUser}
          onClose={() => setModal(null)}
        />
      )}

      {showLog && <ActivityModal onClose={() => setShowLog(false)} />}

      {pwdUser && (
        <PasswordModal
          user={pwdUser}
          onSubmit={async (password) => {
            await s.setPassword(pwdUser.id, password);
            toast.success(t("users_toast_pwd"));
          }}
          onClose={() => setPwdUser(null)}
        />
      )}
    </div>
  );
}
