import { render, screen, within, act, fireEvent, waitFor } from "@testing-library/react";
import { Toaster } from "react-hot-toast";
import "../../i18n";
import UsersPage from "./UsersPage";
import { usersService } from "./usersService";
import { UNDO_MS } from "./useUsers";

jest.mock("./usersService", () => ({
  usersService: {
    list: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    setPassword: jest.fn(),
    activity: jest.fn(),
  },
}));
jest.mock("../../shared/api/axios", () => ({
  errorMessage: (e, fallback) => e?.response?.data?.error || fallback,
}));
const mockUpdateUser = jest.fn();
jest.mock("../../AuthContext", () => ({
  useAuth: () => ({
    user: { id: "me", firstName: "Ali", lastName: "Əliyev", email: "ali@test.az", role: "admin" },
    updateUser: mockUpdateUser,
  }),
}));

const USERS = [
  { id: "me", firstName: "Ali", lastName: "Əliyev", email: "ali@test.az", phone: "", role: "admin", active: true, createdAt: 1, lastLoginAt: 1760000000000 },
  { id: "u2", firstName: "Sara", lastName: "Quliyeva", email: "sara@test.az", phone: "", role: "staff", active: true, createdAt: 2, lastLoginAt: null },
  { id: "u3", firstName: "Tural", lastName: "Hüseynov", email: "tural@test.az", phone: "", role: "staff", active: false, createdAt: 3, lastLoginAt: null },
];

const renderPage = async () => {
  render(
    <>
      <UsersPage />
      <Toaster />
    </>,
  );
  await waitFor(() => expect(usersService.list).toHaveBeenCalled());
  await waitFor(() => expect(screen.queryAllByTestId("user-row").length).toBeGreaterThan(0));
};

const rows = () => screen.queryAllByTestId("user-row");
const rowOf = (name) => rows().find((r) => r.textContent.includes(name));

beforeEach(() => {
  jest.clearAllMocks();
  usersService.list.mockResolvedValue(USERS.map((u) => ({ ...u })));
  usersService.remove.mockResolvedValue({});
});

test("shows users from the API with role counts in the tabs", async () => {
  await renderPage();
  expect(rows()).toHaveLength(3);
  expect(screen.getByRole("button", { name: "Bütün (3)" })).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Admin (1)" })).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "İşçi (2)" })).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Anbarçı (0)" })).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Mühasibatçı (0)" })).toBeInTheDocument();
});

test("role cards group people by role", async () => {
  await renderPage();
  expect(screen.getByText("Adminlər")).toBeInTheDocument();
  expect(screen.getByText("Anbarçılar")).toBeInTheDocument();
  expect(screen.getByText("Mühasibatçılar")).toBeInTheDocument();
});

test("search and status filter narrow the table, reset brings everything back", async () => {
  await renderPage();
  fireEvent.change(screen.getByPlaceholderText("Axtarış..."), { target: { value: "sara" } });
  expect(rows()).toHaveLength(1);

  fireEvent.change(screen.getByPlaceholderText("Axtarış..."), { target: { value: "zzz" } });
  expect(screen.getByText("İstifadəçi tapılmadı")).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Filtrləri sıfırla" }));
  expect(rows()).toHaveLength(3);

  fireEvent.change(screen.getByLabelText("Vəziyyət"), { target: { value: "disabled" } });
  expect(rows()).toHaveLength(1);
  expect(rows()[0].textContent).toContain("Tural");
});

test("the signed-in admin cannot be deleted, disabled or selected", async () => {
  await renderPage();
  const self = rowOf("Ali Əliyev");
  expect(within(self).getByRole("checkbox")).toBeDisabled();
  expect(within(self).getByRole("button", { name: "Sil" })).toBeDisabled();
  expect(within(self).getByRole("button", { name: "Aktiv" })).toBeDisabled();
});

test("delete hides the row at once; Undo cancels it and nothing reaches the server", async () => {
  jest.useFakeTimers();
  try {
    await renderPage();
    fireEvent.click(within(rowOf("Sara")).getByRole("button", { name: "Sil" }));
    expect(rowOf("Sara")).toBeUndefined();

    fireEvent.click(await screen.findByRole("button", { name: "Geri qaytar" }));
    expect(rowOf("Sara")).toBeDefined();

    await act(async () => {
      jest.advanceTimersByTime(UNDO_MS + 100);
    });
    expect(usersService.remove).not.toHaveBeenCalled();
  } finally {
    jest.useRealTimers();
  }
});

test("without Undo the user is deleted on the server after the grace period", async () => {
  jest.useFakeTimers();
  try {
    await renderPage();
    fireEvent.click(within(rowOf("Sara")).getByRole("button", { name: "Sil" }));
    expect(usersService.remove).not.toHaveBeenCalled();

    await act(async () => {
      jest.advanceTimersByTime(UNDO_MS + 100);
    });
    expect(usersService.remove).toHaveBeenCalledWith("u2");
    expect(rowOf("Sara")).toBeUndefined();
  } finally {
    jest.useRealTimers();
  }
});

test("bulk disable updates only the selected users", async () => {
  usersService.update.mockImplementation(async (id, patch) => ({ ...USERS.find((u) => u.id === id), ...patch }));
  await renderPage();

  fireEvent.click(within(rowOf("Sara")).getByRole("checkbox"));
  expect(screen.getByText("1 seçilib")).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Deaktiv et" }));

  await waitFor(() => expect(usersService.update).toHaveBeenCalledTimes(1));
  expect(usersService.update).toHaveBeenCalledWith("u2", { active: false });
  await waitFor(() => expect(within(rowOf("Sara")).getByRole("button", { name: "Deaktiv" })).toHaveClass("disabled"));
});

test("create form validates before calling the API, then sends the payload", async () => {
  usersService.create.mockResolvedValue({ id: "u9", firstName: "Nigar", lastName: "Əhmədova", email: "nigar@test.az", role: "staff", active: true, createdAt: 9 });
  await renderPage();

  fireEvent.click(screen.getByRole("button", { name: /İstifadəçi əlavə et/ }));
  fireEvent.click(screen.getByRole("button", { name: "Əlavə et" }));
  expect(usersService.create).not.toHaveBeenCalled();
  expect(screen.getByText("Ad boş ola bilməz")).toBeInTheDocument();
  expect(screen.getByText("Şifrə ən az 6 simvol olmalıdır")).toBeInTheDocument();

  fireEvent.change(screen.getByLabelText("Ad"), { target: { value: "Nigar" } });
  fireEvent.change(screen.getByLabelText("Soyad"), { target: { value: "Əhmədova" } });
  fireEvent.change(screen.getByLabelText("E-poçt"), { target: { value: "nigar@test.az" } });
  fireEvent.change(screen.getByLabelText("Şifrə"), { target: { value: "secret1" } });
  fireEvent.click(screen.getByRole("button", { name: "Əlavə et" }));

  await waitFor(() =>
    expect(usersService.create).toHaveBeenCalledWith({
      firstName: "Nigar",
      lastName: "Əhmədova",
      email: "nigar@test.az",
      password: "secret1",
      role: "staff",
    }),
  );
  await waitFor(() => expect(rowOf("Nigar")).toBeDefined());
});

test("editing your own account refreshes the signed-in user and never sends role/status", async () => {
  usersService.update.mockImplementation(async (id, patch) => ({ ...USERS.find((u) => u.id === id), ...patch }));
  await renderPage();

  fireEvent.click(within(rowOf("Ali Əliyev")).getByRole("button", { name: "Redaktə et" }));
  expect(screen.getByLabelText("Rol")).toBeDisabled();
  fireEvent.change(screen.getByLabelText("Ad"), { target: { value: "Əli" } });
  fireEvent.click(screen.getByRole("button", { name: "Yadda saxla" }));

  await waitFor(() => expect(usersService.update).toHaveBeenCalledTimes(1));
  const [id, patch] = usersService.update.mock.calls[0];
  expect(id).toBe("me");
  expect(patch).not.toHaveProperty("role");
  expect(patch).not.toHaveProperty("active");
  await waitFor(() => expect(mockUpdateUser).toHaveBeenCalledWith(expect.objectContaining({ id: "me", firstName: "Əli" })));
});

test("choosing a role in the form shows which sections it opens", async () => {
  await renderPage();
  fireEvent.click(screen.getByRole("button", { name: /İstifadəçi əlavə et/ }));

  fireEvent.change(screen.getByLabelText("Rol"), { target: { value: "warehouse" } });
  expect(screen.getByText(/Giriş: Anbar, Alışlar, Parametrlər\./)).toBeInTheDocument();

  fireEvent.change(screen.getByLabelText("Rol"), { target: { value: "accountant" } });
  expect(screen.getByText(/Giriş: İdarə Paneli, Alışlar, Pul Axını, Hesabatlar, Parametrlər\./)).toBeInTheDocument();
});

test("activity log lists readable sentences and loads more", async () => {
  const entry = (n, action, meta = {}) => ({
    id: `e${n}`, at: 1760000000000 + n * 1000, actorId: "me", actorName: "Ali Əliyev",
    action, targetId: "u2", targetName: "Sara Quliyeva", meta,
  });
  usersService.activity
    .mockResolvedValueOnce({
      total: 3,
      items: [
        entry(3, "user.update", { fields: ["email"], role: { from: "staff", to: "warehouse" } }),
        entry(2, "user.disable"),
      ],
    })
    .mockResolvedValueOnce({ total: 3, items: [entry(1, "user.create", { role: "staff" })] });

  await renderPage();
  fireEvent.click(screen.getByRole("button", { name: "Fəaliyyət jurnalı" }));

  expect(await screen.findByText("Ali Əliyev Sara Quliyeva hesabını dəyişdi: E-poçt, rol: İşçi → Anbarçı")).toBeInTheDocument();
  expect(screen.getByText("Ali Əliyev Sara Quliyeva hesabını deaktiv etdi")).toBeInTheDocument();
  expect(usersService.activity).toHaveBeenCalledWith({ limit: 20, offset: 0 });

  fireEvent.click(screen.getByRole("button", { name: "Daha çox göstər" }));
  expect(await screen.findByText("Ali Əliyev Sara Quliyeva hesabını yaratdı (İşçi)")).toBeInTheDocument();
  expect(usersService.activity).toHaveBeenLastCalledWith({ limit: 20, offset: 2 });
  expect(screen.queryByRole("button", { name: "Daha çox göstər" })).not.toBeInTheDocument();
});
