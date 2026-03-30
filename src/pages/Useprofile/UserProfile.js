import "./UserProfile.scss";
import { useEffect, useMemo, useState } from "react";
import {
  ChevronRight,
  Bell,
  Search,
  SlidersHorizontal,
  MoreVertical,
  UserPlus,
  Settings2,
  X,
  Pencil,
  Trash2,
} from "lucide-react";

export const UserProfile = () => {
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRole, setSelectedRole] = useState("Bütün");
  const [openModal, setOpenModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [openMenuId, setOpenMenuId] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);

  const itemsPerPage = 5;

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    role: "İdarəçi",
    status: "Enabled",
    avatar: "",
  });

  const resetForm = () => {
    setFormData({
      name: "",
      email: "",
      role: "İdarəçi",
      status: "Enabled",
      avatar: "",
    });
    setEditingUser(null);
  };

  const openCreateModal = () => {
    resetForm();
    setOpenModal(true);
  };

  const openEditModal = (user) => {
    setEditingUser(user);
    setFormData({
      name: user.name || "",
      email: user.email || "",
      role: user.role || "İdarəçi",
      status: user.status || "Enabled",
      avatar: user.avatar || "",
    });
    setOpenModal(true);
  };

  const closeModal = () => {
    setOpenModal(false);
    resetForm();
  };

  const handleChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const fetchUsers = async () => {
    try {
      const res = await fetch("/api/users");
      if (!res.ok) throw new Error("Users fetch failed");
      const data = await res.json();

      if (Array.isArray(data)) {
        setUsers(data);
      } else {
        setUsers([]);
      }
    } catch (error) {
      console.error("Users fetch error:", error);

      // fallback demo data, потом удалишь
      setUsers([
        {
          id: crypto.randomUUID(),
          name: "Lila Thompson",
          email: "lila@email.com",
          role: "İdarəçi",
          status: "Enabled",
          avatar: "",
        },
        {
          id: crypto.randomUUID(),
          name: "Chloe Anderson",
          email: "chloe@warehouse.com",
          role: "Anbarçı",
          status: "Enabled",
          avatar: "",
        },
        {
          id: crypto.randomUUID(),
          name: "Ava Martinez",
          email: "ava@email.com",
          role: "Mühasibatçı",
          status: "Disabled",
          avatar: "",
        },
        {
          id: crypto.randomUUID(),
          name: "Olivia Brown",
          email: "olivia@email.com",
          role: "İdarəçi",
          status: "Enabled",
          avatar: "",
        },
        {
          id: crypto.randomUUID(),
          name: "Grace Hall",
          email: "grace@email.com",
          role: "Anbarçı",
          status: "Enabled",
          avatar: "",
        },
        {
          id: crypto.randomUUID(),
          name: "Sofia Lee",
          email: "sofia@email.com",
          role: "Mühasibatçı",
          status: "Enabled",
          avatar: "",
        },
      ]);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const createUser = async (payload) => {
    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Create failed");

      const newUser = await res.json();
      setUsers((prev) => [newUser, ...prev]);
    } catch (error) {
      console.error("Create error:", error);

      const localUser = {
        id: crypto.randomUUID(),
        ...payload,
      };

      setUsers((prev) => [localUser, ...prev]);
    }
  };

  const updateUser = async (id, payload) => {
    try {
      const res = await fetch(`/api/users/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Update failed");

      const updatedUser = await res.json();

      setUsers((prev) =>
        prev.map((user) => (user.id === id ? updatedUser : user)),
      );
    } catch (error) {
      console.error("Update error:", error);

      setUsers((prev) =>
        prev.map((user) =>
          user.id === id
            ? {
                ...user,
                ...payload,
              }
            : user,
        ),
      );
    }
  };

  const deleteUser = async (id) => {
    try {
      const res = await fetch(`/api/users/${id}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("Delete failed");

      setUsers((prev) => prev.filter((user) => user.id !== id));
    } catch (error) {
      console.error("Delete error:", error);
      setUsers((prev) => prev.filter((user) => user.id !== id));
    }
  };

  const handleSubmit = async () => {
    if (!formData.name.trim() || !formData.email.trim()) return;

    const payload = {
      ...formData,
      name: formData.name.trim(),
      email: formData.email.trim(),
    };

    if (editingUser) {
      await updateUser(editingUser.id, payload);
    } else {
      await createUser(payload);
    }

    closeModal();
  };

  const handleDelete = async (id) => {
    await deleteUser(id);
  };

  const filteredUsers = useMemo(() => {
    const search = searchTerm.toLowerCase();

    return users.filter((user) => {
      const matchesSearch =
        user.name?.toLowerCase().includes(search) ||
        user.email?.toLowerCase().includes(search);

      const matchesRole =
        selectedRole === "Bütün" || user.role === selectedRole;

      return matchesSearch && matchesRole;
    });
  }, [users, searchTerm, selectedRole]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedRole]);

  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage) || 1;

  const paginatedUsers = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    return filteredUsers.slice(start, end);
  }, [filteredUsers, currentPage]);

  const changePage = (page) => {
    setCurrentPage(page);
  };

  const managers = users.filter((user) => user.role === "İdarəçi").slice(0, 3);
  const warehouseWorkers = users
    .filter((user) => user.role === "Anbarçı")
    .slice(0, 3);
  const accountants = users
    .filter((user) => user.role === "Mühasibatçı")
    .slice(0, 3);

  const UserMiniCard = ({ title, data }) => {
    return (
      <div className="RoleCard">
        <div className="RoleCard-Top">
          <div className="RoleCard-Title">{title}</div>
          <div className="RoleCard-SeeAll">Hamısına Göstər</div>
        </div>

        <div className="RoleCard-List">
          {data.length > 0 ? (
            data.map((user) => (
              <div
                className="RoleUserItem"
                key={user.id}
                onClick={() => openEditModal(user)}
              >
                <div className="RoleUserItem-Left">
                  <div className="RoleUserAvatar">
                    {user.avatar ? (
                      <img src={user.avatar} alt={user.name} />
                    ) : (
                      user.name?.charAt(0)?.toUpperCase()
                    )}
                  </div>

                  <div className="RoleUserInfo">
                    <div className="RoleUserName">{user.name}</div>
                    <div className="RoleUserEmail">{user.email}</div>
                  </div>
                </div>

                <div
                  className={`RoleUserStatus ${
                    user.status === "Enabled" ? "enabled" : "disabled"
                  }`}
                >
                  {user.status}
                </div>
              </div>
            ))
          ) : (
            <div className="RoleCard-Empty">İstifadəçi yoxdur</div>
          )}
        </div>

        <div
          className="RoleCard-Bottom"
          onClick={() => data.length > 0 && openEditModal(data[0])}
        >
          <Settings2 size={16} />
          <div>Manage</div>
        </div>
      </div>
    );
  };

  return (
    <div className="UsersPage-Wrapper">
      <div className="UsersPage-Inner">
        <div className="UsersTopbar">
          <div className="UsersTopbar-Left">
            <div className="UsersTopbar-Title">İstifadəçilər</div>

            <div className="UsersBreadcrumb">
              <div className="crumb">Ana Səhifə</div>
              <ChevronRight size={14} />
              <div className="crumb">İdarə Paneli</div>
              <ChevronRight size={14} />
              <div className="crumb active">İstifadəçilər</div>
            </div>
          </div>

          <div className="UsersTopbar-Right">
            <div className="TopIconBlock">
              <Bell size={18} />
              <div className="NotifyDot">3</div>
            </div>

            <div className="TopUserMini">
              <div className="TopUserAvatar">İ</div>
              <div className="TopUserName">İstifadəçi</div>
            </div>
          </div>
        </div>

        <div className="UsersContentCard">
          <div className="UsersContentHeader">
            <div className="UsersContentHeader-Left">
              <div className="UsersContentTitle">İstifadəçilər</div>
              <div className="UsersContentDesc">
                İdarəçi, Anbarçı və Mühasibatçıların siyahısına baxın və idarə
                edin.
              </div>
            </div>

            <div className="UsersAddButton" onClick={openCreateModal}>
              <UserPlus size={16} />
              <div>İstifadəçi Əlavə Et</div>
            </div>
          </div>

          <div className="UsersRolesGrid">
            <UserMiniCard title="İdarəçi" data={managers} />
            <UserMiniCard title="Anbarçı" data={warehouseWorkers} />
            <UserMiniCard title="Mühasibatçı" data={accountants} />
          </div>

          <div className="UsersTableCard">
            <div className="UsersTableHeader">
              <div className="UsersTableHeader-Left">
                <div className="UsersTableTitle">İstifadəçi Hesabları</div>

                <div className="UsersTabs">
                  <div
                    className={`UsersTab ${
                      selectedRole === "Bütün" ? "active" : ""
                    }`}
                    onClick={() => setSelectedRole("Bütün")}
                  >
                    Bütün ({users.length})
                  </div>

                  <div
                    className={`UsersTab ${
                      selectedRole === "İdarəçi" ? "active" : ""
                    }`}
                    onClick={() => setSelectedRole("İdarəçi")}
                  >
                    İdarəçi
                  </div>

                  <div
                    className={`UsersTab ${
                      selectedRole === "Anbarçı" ? "active" : ""
                    }`}
                    onClick={() => setSelectedRole("Anbarçı")}
                  >
                    Anbarçı
                  </div>

                  <div
                    className={`UsersTab ${
                      selectedRole === "Mühasibatçı" ? "active" : ""
                    }`}
                    onClick={() => setSelectedRole("Mühasibatçı")}
                  >
                    Mühasibatçı
                  </div>
                </div>
              </div>

              <div className="UsersTableHeader-Right">
                <div className="SearchBox">
                  <Search size={16} />
                  <input
                    type="text"
                    placeholder="Axtarış..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>

                <div className="SortButton">{selectedRole}</div>

                <div className="FilterButton">
                  <SlidersHorizontal size={16} />
                </div>
              </div>
            </div>

            <div className="UsersTable">
              <div className="UsersTable-Head">
                <div className="col tag">Tag</div>
                <div className="col name">Ad</div>
                <div className="col email">Email Address</div>
                <div className="col role">Rol</div>
                <div className="col status">Vəziyyət</div>
                <div className="col action">Əməliyyatlar</div>
                <div className="col more"></div>
              </div>

              <div className="UsersTable-Body">
                {paginatedUsers.length > 0 ? (
                  paginatedUsers.map((user) => (
                    <div className="UsersTable-Row" key={user.id}>
                      <div className="col tag">
                        <div className="TableAvatar">
                          {user.avatar ? (
                            <img src={user.avatar} alt={user.name} />
                          ) : (
                            user.name?.charAt(0)?.toUpperCase()
                          )}
                        </div>
                      </div>

                      <div className="col name">{user.name}</div>
                      <div className="col email">{user.email}</div>
                      <div className="col role">{user.role}</div>

                      <div className="col status">
                        <div
                          className={`StatusPill ${
                            user.status === "Enabled" ? "enabled" : "disabled"
                          }`}
                        >
                          {user.status}
                        </div>
                      </div>

                      <div className="col action">
                        <div className="RowActions">
                          <div
                            className="ActionIcon edit"
                            onClick={() => openEditModal(user)}
                          >
                            <Pencil size={15} />
                          </div>

                          <div
                            className="ActionIcon delete"
                            onClick={() => handleDelete(user.id)}
                          >
                            <Trash2 size={15} />
                          </div>
                        </div>
                      </div>

                      <div className="col more">
                        <div className="MoreWrapper">
                          <div
                            className="MoreButton"
                            onClick={() =>
                              setOpenMenuId(
                                openMenuId === user.id ? null : user.id,
                              )
                            }
                          >
                            <MoreVertical size={16} />
                          </div>

                          {openMenuId === user.id && (
                            <div className="MoreMenu">
                              <div
                                className="MoreMenuItem"
                                onClick={() => {
                                  openEditModal(user);
                                  setOpenMenuId(null);
                                }}
                              >
                                <Pencil size={14} />
                                <div>Redaktə et</div>
                              </div>

                              <div
                                className="MoreMenuItem danger"
                                onClick={() => {
                                  handleDelete(user.id);
                                  setOpenMenuId(null);
                                }}
                              >
                                <Trash2 size={14} />
                                <div>Sil</div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="EmptyUsers">İstifadəçi tapılmadı</div>
                )}
              </div>
            </div>

            <div className="UsersPagination">
              <div
                className={`PageNav ${currentPage === 1 ? "disabled" : ""}`}
                onClick={() => currentPage > 1 && changePage(currentPage - 1)}
              >
                Geri
              </div>

              <div className="PageNumbers">
                {Array.from({ length: totalPages }, (_, index) => (
                  <div
                    key={index + 1}
                    className={`PageNumber ${
                      currentPage === index + 1 ? "active" : ""
                    }`}
                    onClick={() => changePage(index + 1)}
                  >
                    {index + 1}
                  </div>
                ))}
              </div>

              <div
                className={`PageNav ${
                  currentPage === totalPages ? "disabled" : ""
                }`}
                onClick={() =>
                  currentPage < totalPages && changePage(currentPage + 1)
                }
              >
                İrəli
              </div>
            </div>
          </div>
        </div>
      </div>

      {openModal && (
        <div className="UserModalOverlay" onClick={closeModal}>
          <div className="UserModal" onClick={(e) => e.stopPropagation()}>
            <div className="UserModalHeader">
              <div className="UserModalTitle">
                {editingUser ? "İstifadəçini Redaktə Et" : "Yeni İstifadəçi"}
              </div>

              <div className="UserModalClose" onClick={closeModal}>
                <X size={18} />
              </div>
            </div>

            <div className="UserModalBody">
              <div className="FormGroup">
                <div className="FormLabel">Ad Soyad</div>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleChange("name", e.target.value)}
                  placeholder="İstifadəçi adı"
                />
              </div>

              <div className="FormGroup">
                <div className="FormLabel">Email</div>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleChange("email", e.target.value)}
                  placeholder="Email daxil edin"
                />
              </div>

              <div className="FormRow">
                <div className="FormGroup">
                  <div className="FormLabel">Rol</div>
                  <select
                    value={formData.role}
                    onChange={(e) => handleChange("role", e.target.value)}
                  >
                    <option value="İdarəçi">İdarəçi</option>
                    <option value="Anbarçı">Anbarçı</option>
                    <option value="Mühasibatçı">Mühasibatçı</option>
                  </select>
                </div>

                <div className="FormGroup">
                  <div className="FormLabel">Status</div>
                  <select
                    value={formData.status}
                    onChange={(e) => handleChange("status", e.target.value)}
                  >
                    <option value="Enabled">Enabled</option>
                    <option value="Disabled">Disabled</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="UserModalFooter">
              <div className="ModalBtn cancel" onClick={closeModal}>
                Bağla
              </div>

              <div className="ModalBtn save" onClick={handleSubmit}>
                {editingUser ? "Yadda Saxla" : "Əlavə Et"}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
