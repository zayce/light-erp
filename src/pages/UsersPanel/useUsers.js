import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usersService } from "./usersService";
import { errorMessage } from "../../shared/api/axios";

export const PAGE_SIZE = 8;
export const UNDO_MS = 6000;
export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const fullName = (u) =>
  [u.firstName, u.lastName].filter(Boolean).join(" ");

const SORT_VALUE = {
  name: (u) => fullName(u).toLowerCase(),
  email: (u) => u.email,
  role: (u) => u.role,
  status: (u) => (u.active ? 1 : 0),
  lastLoginAt: (u) => u.lastLoginAt || 0,
};

const without = (set, ids) => {
  const next = new Set(set);
  ids.forEach((id) => next.delete(id));
  return next;
};

export default function useUsers(currentUserId) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null); // null | string (may be "")
  const [role, setRoleState] = useState("all"); // all | admin | staff
  const [status, setStatusState] = useState("all"); // all | active | disabled
  const [query, setQueryState] = useState("");
  const [sort, setSort] = useState({ key: "name", dir: "asc" });
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState(() => new Set());
  // ids hidden from the list while their "undo" window is open
  const [pending, setPending] = useState(() => new Set());
  const batches = useRef([]);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      setUsers(await usersService.list());
    } catch (e) {
      setLoadError(errorMessage(e, ""));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // Leaving the page confirms deletions that were still waiting for "undo".
  useEffect(
    () => () => {
      // eslint-disable-next-line react-hooks/exhaustive-deps
      batches.current.forEach((b) => {
        clearTimeout(b.timer);
        b.ids.forEach((id) => usersService.remove(id).catch(() => {}));
      });
      batches.current = [];
    },
    [],
  );

  const visible = useMemo(
    () => users.filter((u) => !pending.has(u.id)),
    [users, pending],
  );

  const counts = useMemo(
    () => ({
      all: visible.length,
      admin: visible.filter((u) => u.role === "admin").length,
      staff: visible.filter((u) => u.role === "staff").length,
      warehouse: visible.filter((u) => u.role === "warehouse").length,
      accountant: visible.filter((u) => u.role === "accountant").length,
      disabled: visible.filter((u) => !u.active).length,
    }),
    [visible],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const get = SORT_VALUE[sort.key];
    const sign = sort.dir === "asc" ? 1 : -1;

    return visible
      .filter((u) => role === "all" || u.role === role)
      .filter(
        (u) =>
          status === "all" || (status === "active") === Boolean(u.active),
      )
      .filter(
        (u) =>
          !q ||
          fullName(u).toLowerCase().includes(q) ||
          u.email.includes(q) ||
          (u.phone || "").includes(q),
      )
      .sort((a, b) => {
        const x = get(a);
        const y = get(b);
        const cmp =
          typeof x === "string" ? x.localeCompare(y) : x - y;
        return sign * cmp || fullName(a).localeCompare(fullName(b));
      });
  }, [visible, role, status, query, sort]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount);
  const paged = useMemo(
    () => filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE),
    [filtered, safePage],
  );

  // ---------- filters (reset paging + selection) ----------
  const onFilter = (setter) => (value) => {
    setter(value);
    setPage(1);
    setSelected(new Set());
  };
  const setRole = onFilter(setRoleState);
  const setStatus = onFilter(setStatusState);
  const setQuery = onFilter(setQueryState);
  const resetFilters = () => {
    setRoleState("all");
    setStatusState("all");
    setQueryState("");
    setPage(1);
    setSelected(new Set());
  };

  const toggleSort = (key) =>
    setSort((s) =>
      s.key === key
        ? { key, dir: s.dir === "asc" ? "desc" : "asc" }
        : { key, dir: "asc" },
    );

  // ---------- selection (the signed-in admin can never be selected) ----------
  const isSelf = (u) => u.id === currentUserId;
  const selectableOnPage = paged.filter((u) => !isSelf(u));
  const allPageSelected =
    selectableOnPage.length > 0 &&
    selectableOnPage.every((u) => selected.has(u.id));
  const selectedUsers = visible.filter((u) => selected.has(u.id));

  const toggleSelect = (id) =>
    setSelected((s) => {
      const next = new Set(s);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const togglePage = () =>
    setSelected((s) => {
      const ids = selectableOnPage.map((u) => u.id);
      if (allPageSelected) return without(s, ids);
      return new Set([...s, ...ids]);
    });

  const clearSelection = () => setSelected(new Set());

  // ---------- server actions ----------
  const replace = (u) =>
    setUsers((list) => list.map((x) => (x.id === u.id ? u : x)));

  const create = async (data) => {
    const u = await usersService.create(data);
    setUsers((list) => [...list, u]);
    return u;
  };

  const update = async (id, patch) => {
    const u = await usersService.update(id, patch);
    replace(u);
    return u;
  };

  const setPassword = (id, newPassword) =>
    usersService.setPassword(id, newPassword);

  const bulkSetActive = async (list, active) => {
    const results = await Promise.allSettled(
      list.map((u) => usersService.update(u.id, { active })),
    );
    let ok = 0;
    let failed = 0;
    let firstError = "";
    results.forEach((r) => {
      if (r.status === "fulfilled") {
        ok += 1;
        replace(r.value);
      } else {
        failed += 1;
        firstError = firstError || errorMessage(r.reason, "");
      }
    });
    setSelected(new Set());
    return { ok, failed, firstError };
  };

  // Deleting hides the rows right away and only calls the server after UNDO_MS.
  // The returned function cancels the deletion.
  const scheduleDelete = useCallback((list, onSettled) => {
    const ids = list.map((u) => u.id);
    setPending((p) => new Set([...p, ...ids]));
    setSelected((s) => without(s, ids));

    const batch = { ids, timer: null };
    batch.timer = setTimeout(async () => {
      batches.current = batches.current.filter((b) => b !== batch);

      const results = await Promise.allSettled(
        ids.map((id) => usersService.remove(id)),
      );
      const removed = new Set();
      let firstError = "";
      results.forEach((r, i) => {
        if (r.status === "fulfilled") removed.add(ids[i]);
        else firstError = firstError || errorMessage(r.reason, "");
      });

      setUsers((all) => all.filter((u) => !removed.has(u.id)));
      setPending((p) => without(p, ids));
      onSettled?.({ failed: ids.length - removed.size, firstError });
    }, UNDO_MS);
    batches.current.push(batch);

    return () => {
      clearTimeout(batch.timer);
      batches.current = batches.current.filter((b) => b !== batch);
      setPending((p) => without(p, ids));
    };
  }, []);

  return {
    loading, loadError, load,
    users: visible, counts, filtered, paged,
    role, setRole, status, setStatus, query, setQuery, resetFilters,
    sort, toggleSort,
    page: safePage, pageCount, setPage,
    selected, selectedUsers, allPageSelected, selectableOnPage,
    toggleSelect, togglePage, clearSelection, isSelf,
    create, update, setPassword, bulkSetActive, scheduleDelete,
  };
}
