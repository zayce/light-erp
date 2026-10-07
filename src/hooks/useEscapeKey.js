import { useEffect } from "react";

export const useEscapeKey = (enabled, onClose) => {
  useEffect(() => {
    if (!enabled || typeof onClose !== "function") return;

    const handler = (e) => {
      if (e.key === "Escape") onClose();
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [enabled, onClose]);
};
