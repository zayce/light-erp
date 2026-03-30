import "../ReportsModal/ReposrtsModal.scss";
import {
  CalendarDays,
  CircleDollarSign,
  Package,
  Plus,
  X,
  Boxes,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useApp } from "../../AppContext";

export const ReportsModal = ({
  open,
  onClose,
  onSubmitOperation,
  editOperation,
}) => {
  const { state } = useApp();
  const [product, setProduct] = useState("");
  const [category, setCategory] = useState("");
  const [operationType, setOperationType] = useState("Satış");
  const [amount, setAmount] = useState("");
  const [salesCount, setSalesCount] = useState("");
  const [date, setDate] = useState("");
  const [note, setNote] = useState("");

  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "auto";
    };
  }, [open]);

  useEffect(() => {
    if (editOperation) {
      setProduct(editOperation.product || "");
      setCategory(editOperation.category || "");
      setOperationType(editOperation.operationType || "Satış");
      setAmount(String(editOperation.amount || ""));
      setSalesCount(String(editOperation.salesCount || ""));
      setDate(editOperation.date || "");
      setNote(editOperation.note || "");
    } else {
      setProduct("");
      setCategory("");
      setOperationType("Satış");
      setAmount("");
      setSalesCount("");
      setDate(new Date().toISOString().slice(0, 10));
      setNote("");
    }
  }, [editOperation, open]);

  const availableProducts = useMemo(() => {
    return [...state.anbar].sort((a, b) => a.name.localeCompare(b.name));
  }, [state.anbar]);

  const selectedProduct = useMemo(() => {
    return state.anbar.find((item) => item.name === product) || null;
  }, [state.anbar, product]);

  const allowedStock = useMemo(() => {
    if (!selectedProduct) return 0;

    const currentStock = Number(selectedProduct.stockCurrent || 0);

    if (
      editOperation &&
      editOperation.product === selectedProduct.name &&
      editOperation.operationType !== "Xərc"
    ) {
      return currentStock + Number(editOperation.salesCount || 0);
    }

    return currentStock;
  }, [selectedProduct, editOperation]);

  useEffect(() => {
    if (!selectedProduct) return;
    setCategory(selectedProduct.category || "");
  }, [selectedProduct]);

  useEffect(() => {
    if (operationType === "Xərc") return;
    if (!selectedProduct) {
      setAmount("");
      return;
    }

    const count = Number(salesCount || 0);
    const price = Number(selectedProduct.price || 0);
    const total = count * price;

    setAmount(total ? String(total) : "");
  }, [selectedProduct, salesCount, operationType]);

  const handleProductChange = (value) => {
    setProduct(value);

    const found = state.anbar.find((item) => item.name === value);
    if (found) {
      setCategory(found.category || "");
    } else {
      setCategory("");
    }
  };

  const handleOperationTypeChange = (value) => {
    setOperationType(value);

    if (value === "Xərc") {
      setSalesCount("");
      if (!editOperation || editOperation.operationType !== "Xərc") {
        setAmount("");
      }
      return;
    }

    if (selectedProduct) {
      const count = Number(salesCount || 0);
      const price = Number(selectedProduct.price || 0);
      const total = count * price;
      setAmount(total ? String(total) : "");
    }
  };

  const handleSalesCountChange = (value) => {
    setSalesCount(value);

    if (operationType === "Xərc") return;
    if (!selectedProduct) return;

    const count = Number(value || 0);
    const price = Number(selectedProduct.price || 0);
    const total = count * price;

    setAmount(total ? String(total) : "");
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const normalizedSalesCount = Number(salesCount || 0);
    const normalizedAmount = Number(amount || 0);

    if (
      !product.trim() ||
      !category.trim() ||
      !operationType.trim() ||
      !normalizedAmount ||
      !date
    ) {
      alert("Bütün vacib sahələri doldurun");
      return;
    }

    if (operationType !== "Xərc") {
      if (!selectedProduct) {
        alert("Məhsul anbardan seçilməlidir");
        return;
      }

      if (!normalizedSalesCount || normalizedSalesCount <= 0) {
        alert("Satış sayı düzgün daxil edilməlidir");
        return;
      }

      if (normalizedSalesCount > allowedStock) {
        alert(`Stok kifayət deyil. Mövcud stok: ${allowedStock}`);
        return;
      }
    }

    const operationData = {
      product: product.trim(),
      category,
      operationType,
      amount: normalizedAmount,
      salesCount: operationType === "Xərc" ? 0 : normalizedSalesCount,
      date,
      note: note.trim(),
    };

    onSubmitOperation(operationData);
  };

  if (!open) return null;

  return (
    <div className="ReportsModal-Overlay" onClick={onClose}>
      <div className="ReportsModal" onClick={(e) => e.stopPropagation()}>
        <div className="ReportsModal-Header">
          <div className="ReportsModal-Header-Left">
            <div className="ReportsModal-IconBox">
              <Plus size={24} strokeWidth={2.5} />
            </div>

            <div className="ReportsModal-Header-Text">
              <h2 className="ReportsModal-Title">
                {editOperation ? "Əməliyyatı Redaktə Et" : "Yeni Əməliyyat"}
              </h2>
              <p className="ReportsModal-Subtitle">
                Satış, mənfəət və ya xərc əməliyyatını əlavə edin
              </p>
            </div>
          </div>

          <button
            type="button"
            className="ReportsModal-CloseBtn"
            onClick={onClose}
          >
            <X size={20} />
          </button>
        </div>

        <form className="ReportsModal-Form" onSubmit={handleSubmit}>
          <div className="ReportsModal-Grid">
            <div className="ReportsModal-Field">
              <label>Məhsul adı</label>
              <div className="ReportsModal-InputWrapper">
                <Package size={18} />
                <select
                  value={product}
                  onChange={(e) => handleProductChange(e.target.value)}
                >
                  <option value="">Məhsul seçin</option>
                  {availableProducts.map((item) => (
                    <option key={item.sku} value={item.name}>
                      {item.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="ReportsModal-Field">
              <label>Kateqoriya</label>
              <div className="ReportsModal-InputWrapper">
                <Boxes size={18} />
                <input type="text" value={category} readOnly />
              </div>
            </div>

            <div className="ReportsModal-Field">
              <label>Əməliyyat növü</label>
              <div className="ReportsModal-SelectWrapper">
                <select
                  value={operationType}
                  onChange={(e) => handleOperationTypeChange(e.target.value)}
                >
                  <option value="">Seçin</option>
                  <option value="Satış">Satış</option>
                  <option value="Mənfəət">Mənfəət</option>
                  <option value="Xərc">Xərc</option>
                </select>
              </div>
            </div>

            <div className="ReportsModal-Field">
              <label>Məbləğ</label>
              <div className="ReportsModal-InputWrapper">
                <CircleDollarSign size={18} />
                <input
                  type="number"
                  placeholder="Məs: 1200"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  readOnly={operationType !== "Xərc"}
                />
              </div>
            </div>

            <div className="ReportsModal-Field">
              <label>Satış sayı</label>
              <div className="ReportsModal-InputWrapper">
                <span className="ReportsModal-Hash">#</span>
                <input
                  type="number"
                  placeholder="Məs: 2"
                  value={salesCount}
                  onChange={(e) => handleSalesCountChange(e.target.value)}
                  disabled={operationType === "Xərc"}
                />
              </div>
            </div>

            <div className="ReportsModal-Field">
              <label>Tarix</label>
              <div className="ReportsModal-InputWrapper">
                <CalendarDays size={18} />
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                />
              </div>
            </div>
          </div>

          {selectedProduct && operationType !== "Xərc" && (
            <div className="ReportsModal-StockInfo">
              <div className="ReportsModal-StockItem">
                Mövcud stok: <strong>{allowedStock}</strong>
              </div>
              <div className="ReportsModal-StockItem">
                1 ədəd qiymət: <strong>₼{selectedProduct.price}</strong>
              </div>
              <div className="ReportsModal-StockItem">
                Ümumi məbləğ: <strong>₼{amount || 0}</strong>
              </div>
            </div>
          )}

          <div className="ReportsModal-Field ReportsModal-Field-Full">
            <label>Qeyd (istəyə bağlı)</label>
            <textarea
              placeholder="Əlavə məlumat..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </div>

          <div className="ReportsModal-Actions">
            <button
              type="button"
              className="ReportsModal-CancelBtn"
              onClick={onClose}
            >
              <X size={18} />
              İmtina
            </button>

            <button type="submit" className="ReportsModal-SubmitBtn">
              <Plus size={18} />
              {editOperation ? "Yadda Saxla" : "Əlavə Et"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
