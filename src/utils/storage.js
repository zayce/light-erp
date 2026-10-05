// localStorage can throw (private mode, quota exceeded), so every call is guarded.
export const readStorage = (key) => {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
};

export const writeStorage = (key, value) => {
  try {
    window.localStorage.setItem(key, value);
    return true;
  } catch (err) {
    console.warn("localStorage yazıla bilmədi:", err);
    return false;
  }
};
