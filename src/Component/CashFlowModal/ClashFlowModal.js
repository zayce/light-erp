import "./ClashFlowModal.scss";
import { ChevronDown, X } from "lucide-react";
import { useEffect, useState } from "react";

export const ClashFlowModal = ({
  open,
  onClose,
  onSubmitOperation,
  editOperation,
}) => {
  const [date, setDate] = useState("");
  const [category, setCategory] = useState("");
  const [desc, setDesc] = useState("");
  const [type, setType] = useState("income");
  const [amount, setAmount] = useState("");

  useEffect(() => {
    if (editOperation) {
      setDate(editOperation.date || "");
      setCategory(editOperation.category || "");
      setDesc(editOperation.desc || "");
      setType(editOperation.type || "income");
      setAmount(String(editOperation.amount).replace(/[^\d]/g, ""));
    } else {
      setDate("");
      setCategory("");
      setDesc("");
      setType("income");
      setAmount("");
    }
  }, [editOperation, open]);

  if (!open) return null;

  const handleSubmit = () => {
    if (!date || !category || !desc || !amount) return;

    const formattedAmount =
      type === "income"
        ? `+₼${Number(amount).toLocaleString("ru-RU")}`
        : `-₼${Number(amount).toLocaleString("ru-RU")}`;

    const operationData = {
      date,
      category,
      desc,
      type,
      amount: formattedAmount,
    };

    onSubmitOperation(operationData);
  };

  return (
    <div className="ClashFlowModal-Overlay" onClick={onClose}>
      <div className="ClashFlowModal" onClick={(e) => e.stopPropagation()}>
        <div className="ClashFlowModal-Header">
          <div className="ClashFlowModal-HeaderText">
            <h2 className="ClashFlowModal-Title">
              {editOperation ? "Əməliyyatı Redaktə Et" : "Əməliyyat Əlavə Et"}
            </h2>
            <p className="ClashFlowModal-Subtitle">
              {editOperation
                ? "Mövcud əməliyyat məlumatlarını yeniləyin"
                : "Yeni əməliyyat məlumatlarını daxil edin"}
            </p>
          </div>

          <button
            className="ClashFlowModal-Close"
            onClick={onClose}
            type="button"
          >
            <X size={22} />
          </button>
        </div>

        <div className="ClashFlowModal-Body">
          <div className="ClashFlowModal-Field">
            <label>Tarix</label>
            <div className="ClashFlowModal-DateWrap">
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
          </div>

          <div className="ClashFlowModal-Field">
            <label>Kateqoriya</label>
            <div className="ClashFlowModal-SelectWrap">
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                <option value="">Kateqoriya seçin</option>
                <option value="Satış">Satış</option>
                <option value="Təchizat">Təchizat</option>
                <option value="Əmək haqqı">Əmək haqqı</option>
                <option value="Kommunal">Kommunal</option>
                <option value="Xidmət">Xidmət</option>
                <option value="İcarə">İcarə</option>
                <option value="Marketinq">Marketinq</option>
              </select>
              <div className="ClashFlowModal-SelectIcon">
                <ChevronDown size={22} />
              </div>
            </div>
          </div>

          <div className="ClashFlowModal-Field">
            <label>Təsvir</label>
            <input
              type="text"
              placeholder="Əməliyyat təsvirini daxil edin"
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
            />
          </div>

          <div className="ClashFlowModal-Row">
            <div className="ClashFlowModal-Field">
              <label>Tip</label>
              <div className="ClashFlowModal-TypeSwitch">
                <button
                  type="button"
                  className={type === "income" ? "active income" : ""}
                  onClick={() => setType("income")}
                >
                  Gəlir
                </button>
                <button
                  type="button"
                  className={type === "expense" ? "active expense" : ""}
                  onClick={() => setType("expense")}
                >
                  Xərc
                </button>
              </div>
            </div>

            <div className="ClashFlowModal-Field">
              <label>Məbləğ</label>
              <div className="ClashFlowModal-AmountWrap">
                <div className="ClashFlowModal-AmountPrefix">₼</div>
                <input
                  type="number"
                  placeholder="Məbləği daxil edin"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="ClashFlowModal-Footer">
          <button
            className="ClashFlowModal-Submit"
            type="button"
            onClick={handleSubmit}
          >
            {editOperation ? "Yadda Saxla" : "Əlavə Et"}
          </button>

          <button
            className="ClashFlowModal-Cancel"
            type="button"
            onClick={onClose}
          >
            İmtina Et
          </button>
        </div>
      </div>
    </div>
  );
};
