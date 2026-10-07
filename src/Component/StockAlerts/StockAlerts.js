import { useEffect, useRef } from "react";
import toast from "react-hot-toast";
import { useApp } from "../../AppContext";
import { useAuth } from "../../AuthContext";
import { useSync } from "../../SyncContext";
import { countLowStock } from "../../utils/stock";

const BASE_TITLE = "Hesabla — Anbar və Maliyyə";

// Makes the "low stock alerts" setting real: a count in the tab title and one toast
// per session once the data has loaded. Renders nothing.
export const StockAlerts = () => {
  const { state } = useApp();
  const { user, isAuthenticated } = useAuth();
  const { status } = useSync();

  const low = countLowStock(state.anbar);
  const enabled = isAuthenticated && user?.notifications?.lowStockAlerts !== false;
  const loaded = status !== "idle" && status !== "loading";
  const announced = useRef(false);

  useEffect(() => {
    document.title = enabled && low > 0 ? `(${low}) Hesabla` : BASE_TITLE;
    return () => {
      document.title = BASE_TITLE;
    };
  }, [enabled, low]);

  useEffect(() => {
    if (!isAuthenticated) announced.current = false;
  }, [isAuthenticated]);

  useEffect(() => {
    if (enabled && loaded && low > 0 && !announced.current) {
      announced.current = true;
      toast(`${low} məhsulun stoku azdır`, { id: "low-stock", icon: "⚠️", duration: 5000 });
    }
  }, [enabled, loaded, low]);

  return null;
};
