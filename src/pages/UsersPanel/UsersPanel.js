import { useEffect, useRef, useState } from 'react';
import useUsers from './useUsers';
import UserModal from './UserModal';
import { ROLES } from './usersService';
import './UsersPanel.css';

const Avatar = ({ name }) => <span className="up-avatar">{name[0]?.toUpperCase()}</span>;

const Badge = ({ enabled, onClick, disabledReason }) => (
  <button
    type="button"
    className={`up-badge ${enabled ? 'on' : 'off'}`}
    onClick={onClick}
    title={disabledReason || (enabled ? 'Deaktiv et' : 'Aktiv et')}
  >
    {enabled ? 'Enabled' : 'Disabled'}
  </button>
);

// currentUserEmail: передай из useAuth(): <UsersPanel currentUserEmail={user?.email} />
export default function UsersPanel({ currentUserEmail }) {
  const s = useUsers(currentUserEmail);
  const tableRef = useRef(null);
  const [modal, setModal] = useState(null);     // null | {user?}
  const [confirm, setConfirm] = useState(null); // user to delete
  const [menuId, setMenuId] = useState(null);
  const [toast, setToast] = useState('');

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(''), 2500);
    return () => clearTimeout(t);
  }, [toast]);

  useEffect(() => {
    const close = () => setMenuId(null);
    document.addEventListener('click', close);
    return () => document.removeEventListener('click', close);
  }, []);

  const showRole = (r) => {
    s.setRole(r);
    tableRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const toggle = async (u) => {
    const reason = u.enabled ? s.whyCantDisable(u) : null;
    if (reason) return setToast(reason);
    await s.toggleEnabled(u);
    setToast(u.enabled ? `${u.name} deaktiv edildi` : `${u.name} aktiv edildi`);
  };

  const askDelete = (u) => {
    const reason = s.whyCantDelete(u);
    if (reason) return setToast(reason);
    setConfirm(u);
  };

  const doDelete = async () => {
    await s.removeUser(confirm.id);
    setToast(`${confirm.name} silindi`);
    setConfirm(null);
  };

  const save = async (data) => {
    if (modal.user) { await s.editUser(modal.user.id, data); setToast('Dəyişikliklər saxlanıldı'); }
    else { await s.addUser(data); setToast('İstifadəçi əlavə edildi'); }
  };

  const tabs = [
    ['all', 'Bütün'],
    ['admin', ROLES.admin],
    ['warehouse', ROLES.warehouse],
    ['accountant', ROLES.accountant],
  ];

  return (
    <section className="up">
      <header className="up-head">
        <div>
          <h2>İstifadəçilər</h2>
          <p>İdarəçi, Anbarçı və Mühasibatçıların siyahısına baxın və idarə edin.</p>
        </div>
        <button className="up-btn up-btn-dark" onClick={() => setModal({})}>İstifadəçi Əlavə Et</button>
      </header>

      {/* ---- карточки по ролям ---- */}
      <div className="up-cards">
        {Object.keys(ROLES).map((r) => (
          <div className="up-card" key={r}>
            <div className="up-card-top">
              <strong>{ROLES[r]}</strong>
              <button className="up-link" onClick={() => showRole(r)}>Hamısına Göstər</button>
            </div>
            <div className="up-card-list">
              {s.byRole[r].slice(0, 2).map((u) => (
                <div className="up-mini" key={u.id}>
                  <Avatar name={u.name} />
                  <div className="up-mini-info">
                    <b>{u.name}</b><small>{u.email}</small>
                  </div>
                  <Badge enabled={u.enabled} onClick={() => toggle(u)} />
                </div>
              ))}
              {!s.byRole[r].length && <p className="up-empty-sm">Bu rolda istifadəçi yoxdur</p>}
            </div>
            <button className="up-manage" onClick={() => showRole(r)}>Manage</button>
          </div>
        ))}
      </div>

      {/* ---- таблица ---- */}
      <div className="up-bar" ref={tableRef}>
        <div>
          <h3>İstifadəçi Hesabları</h3>
          <div className="up-tabs">
            {tabs.map(([k, label]) => (
              <button key={k} className={s.role === k ? 'active' : ''} onClick={() => s.setRole(k)}>
                {label} ({s.counts[k]})
              </button>
            ))}
          </div>
        </div>
        <div className="up-tools">
          <input
            className="up-search" placeholder="Axtarış..."
            value={s.query} onChange={(e) => s.setQuery(e.target.value)}
          />
          <select className="up-select" value={s.status} onChange={(e) => s.setStatus(e.target.value)}>
            <option value="all">Bütün</option>
            <option value="enabled">Enabled</option>
            <option value="disabled">Disabled</option>
          </select>
          <button className="up-btn up-icon" title="Ada görə sırala" onClick={() => s.setSortAsc(!s.sortAsc)}>
            {s.sortAsc ? 'A→Z' : 'Z→A'}
          </button>
        </div>
      </div>

      <div className="up-table-wrap">
        <table className="up-table">
          <thead>
            <tr><th>Tag</th><th>Ad</th><th>Email Address</th><th>Rol</th><th>Vəziyyət</th><th>Əməliyyatlar</th><th /></tr>
          </thead>
          <tbody>
            {s.loading && <tr><td colSpan={7} className="up-empty">Yüklənir...</td></tr>}
            {!s.loading && !s.filtered.length && (
              <tr><td colSpan={7} className="up-empty">
                Nəticə tapılmadı.{' '}
                <button className="up-link" onClick={() => { s.setQuery(''); s.setRole('all'); s.setStatus('all'); }}>
                  Filtrləri sıfırla
                </button>
              </td></tr>
            )}
            {s.filtered.map((u) => (
              <tr key={u.id} className={u.enabled ? '' : 'dim'}>
                <td><Avatar name={u.name} /></td>
                <td><b>{u.name}</b></td>
                <td>{u.email}</td>
                <td>{ROLES[u.role]}</td>
                <td><Badge enabled={u.enabled} onClick={() => toggle(u)} /></td>
                <td>
                  <button className="up-sq" title="Redaktə et" onClick={() => setModal({ user: u })}>✎</button>
                  <button className="up-sq del" title="Sil" onClick={() => askDelete(u)}>🗑</button>
                </td>
                <td className="up-more" onClick={(e) => e.stopPropagation()}>
                  <button className="up-sq plain" onClick={() => setMenuId(menuId === u.id ? null : u.id)}>⋮</button>
                  {menuId === u.id && (
                    <div className="up-menu">
                      <button onClick={() => { setMenuId(null); setModal({ user: u }); }}>Redaktə et</button>
                      <button onClick={() => { setMenuId(null); toggle(u); }}>{u.enabled ? 'Deaktiv et' : 'Aktiv et'}</button>
                      <button className="danger" onClick={() => { setMenuId(null); askDelete(u); }}>Sil</button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modal && (
        <UserModal user={modal.user} validate={s.validate} onSave={save} onClose={() => setModal(null)} />
      )}

      {confirm && (
        <div className="up-overlay" onMouseDown={() => setConfirm(null)}>
          <div className="up-modal" onMouseDown={(e) => e.stopPropagation()}>
            <h3>İstifadəçini sil</h3>
            <p><b>{confirm.name}</b> ({confirm.email}) silinsin? Bu əməliyyat geri qaytarılmır.</p>
            <div className="up-modal-actions">
              <button className="up-btn" onClick={() => setConfirm(null)}>Ləğv et</button>
              <button className="up-btn up-btn-danger" onClick={doDelete}>Sil</button>
            </div>
          </div>
        </div>
      )}

      {toast && <div className="up-toast" role="status">{toast}</div>}
    </section>
  );
}
