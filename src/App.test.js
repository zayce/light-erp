import { render, screen, waitFor } from "@testing-library/react";

const mockApi = { get: jest.fn(), put: jest.fn(), post: jest.fn(), delete: jest.fn() };

jest.mock("./shared/api/axios", () => ({
  api: mockApi,
  TOKEN_KEY: "hesabla-token",
  setUnauthorizedHandler: jest.fn(),
  errorMessage: (e, f) => f,
  isNetworkError: (e) => Boolean(e && e.network),
}));

// recharts needs real layout; the pages are checked for rendering, not for chart pixels
jest.mock("recharts", () => {
  const Stub = ({ children }) => <div>{children}</div>;
  return new Proxy({}, { get: () => Stub });
});

const App = require("./App").default;

const go = (path) => window.history.pushState({}, "", path);

beforeEach(() => {
  window.localStorage.clear();
  Object.values(mockApi).forEach((fn) => fn.mockReset());
});

test("visitors without a session are sent to the login page (first run = setup form)", async () => {
  mockApi.get.mockImplementation((url) =>
    url === "/auth/status" ? Promise.resolve({ data: { hasUsers: false } }) : Promise.reject(new Error(url)),
  );
  go("/dashboard");
  render(<App />);

  expect(await screen.findByText("İlk hesabı yaradın")).toBeInTheDocument();
  expect(window.location.pathname).toBe("/login");
});

test("when users exist the normal sign-in form is shown", async () => {
  mockApi.get.mockImplementation((url) =>
    url === "/auth/status" ? Promise.resolve({ data: { hasUsers: true } }) : Promise.reject(new Error(url)),
  );
  go("/warehouse");
  render(<App />);

  expect(await screen.findByText("Daxil olun")).toBeInTheDocument();
});

test("a valid session loads the server data and shows the app", async () => {
  window.localStorage.setItem("hesabla-token", "tok");
  mockApi.get.mockImplementation((url) => {
    if (url === "/auth/me") {
      return Promise.resolve({
        data: { user: { id: "1", firstName: "Ali", lastName: "Əliyev", email: "a@b.az", role: "admin", notifications: {} } },
      });
    }
    if (url === "/data") {
      return Promise.resolve({
        data: {
          version: 3,
          data: {
            anbar: [{ sku: "S-1", name: "Server Məhsulu", stockCurrent: 5, stockMin: 1, price: 2, category: "Test" }],
            report: [],
            cashflow: [],
            purchases: [],
          },
        },
      });
    }
    return Promise.reject(new Error(url));
  });
  go("/warehouse");
  render(<App />);

  expect(await screen.findByText("Server Məhsulu")).toBeInTheDocument();
  expect(screen.getByText("Ali Əliyev")).toBeInTheDocument();
  expect(screen.getByText("Alışlar")).toBeInTheDocument();
  // data came from the server, so nothing needs to be uploaded
  await waitFor(() => expect(mockApi.put).not.toHaveBeenCalled());
});

test("an empty server receives this browser's data as the first copy", async () => {
  window.localStorage.setItem("hesabla-token", "tok");
  mockApi.get.mockImplementation((url) => {
    if (url === "/auth/me") {
      return Promise.resolve({
        data: { user: { id: "1", firstName: "Ali", lastName: "X", email: "a@b.az", role: "admin", notifications: {} } },
      });
    }
    if (url === "/data") return Promise.resolve({ data: { version: 0, data: null } });
    return Promise.reject(new Error(url));
  });
  mockApi.put.mockResolvedValue({ data: { version: 1 } });
  go("/dashboard");
  render(<App />);

  await waitFor(() => expect(mockApi.put).toHaveBeenCalled(), { timeout: 3000 });
  const [url, body] = mockApi.put.mock.calls[0];
  expect(url).toBe("/data");
  expect(body.baseVersion).toBe(0);
  expect(Array.isArray(body.data.anbar)).toBe(true);
});

test("low stock is shown in the tab title when the alert setting is on", async () => {
  window.localStorage.setItem("hesabla-token", "tok");
  mockApi.get.mockImplementation((url) => {
    if (url === "/auth/me") {
      return Promise.resolve({
        data: {
          user: {
            id: "1", firstName: "Ali", lastName: "X", email: "a@b.az", role: "admin",
            notifications: { lowStockAlerts: true },
          },
        },
      });
    }
    if (url === "/data") {
      return Promise.resolve({
        data: {
          version: 1,
          data: {
            anbar: [
              { sku: "L-1", name: "Az qalan", stockCurrent: 0, stockMin: 5, price: 1 },
              { sku: "L-2", name: "Normal", stockCurrent: 20, stockMin: 5, price: 1 },
            ],
            report: [], cashflow: [], purchases: [],
          },
        },
      });
    }
    return Promise.reject(new Error(url));
  });
  go("/dashboard");
  render(<App />);

  await waitFor(() => expect(document.title).toBe("(1) Hesabla"));
});

test("the tab title stays plain when the alert setting is off", async () => {
  window.localStorage.setItem("hesabla-token", "tok");
  mockApi.get.mockImplementation((url) => {
    if (url === "/auth/me") {
      return Promise.resolve({
        data: {
          user: {
            id: "1", firstName: "Ali", lastName: "X", email: "a@b.az", role: "admin",
            notifications: { lowStockAlerts: false },
          },
        },
      });
    }
    if (url === "/data") {
      return Promise.resolve({
        data: {
          version: 1,
          data: { anbar: [{ sku: "L-1", name: "Az", stockCurrent: 0, stockMin: 5, price: 1 }], report: [], cashflow: [], purchases: [] },
        },
      });
    }
    return Promise.reject(new Error(url));
  });
  go("/dashboard");
  render(<App />);

  await screen.findByText("Ali X");
  await waitFor(() => expect(mockApi.get).toHaveBeenCalledWith("/data"));
  expect(document.title).not.toMatch(/^\(/);
});
