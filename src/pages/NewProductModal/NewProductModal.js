import { useEffect, useMemo, useRef, useState } from "react";
import { X, Upload, Image as ImageIcon, Save } from "lucide-react";
import "./NewProductModal.scss";

const initial = {
  name: "",
  sku: "",
  category: "Elektronika",
  supplier: "",
  price: "",
  cost: "",
  stock: "",
  minStock: "10",
  status: "Normal",
  desc: "",
};

const statusOptions = ["Normal", "Aşağı", "Kritik", "Yüksək"];

export const NewProductModal = ({
  open,
  onClose,
  onSubmit,
  categories = [],
  onAddCategory,
}) => {
  const [form, setForm] = useState(initial);
  const [addingCat, setAddingCat] = useState(false);
  const [newCat, setNewCat] = useState("");
  const [file, setFile] = useState(null); // File
  const [preview, setPreview] = useState(""); // objectURL
  const [drag, setDrag] = useState(false);

  const inputRef = useRef(null);

  const addCategory = () => {
    const name = newCat.trim();
    if (!name) return;

    const exists = categories.some(
      (c) => c.toLowerCase() === name.toLowerCase(),
    );
    if (exists) {
      alert("Bu kateqoriya artıq mövcuddur!");
      return;
    }

    onAddCategory?.(name);
    setForm((p) => ({ ...p, category: name })); // сразу выбрать её
    setNewCat("");
    setAddingCat(false);
  };

  // value = stock * price
  const valueAZN = useMemo(() => {
    const p = Number(form.price || 0);
    const s = Number(form.stock || 0);
    return p * s;
  }, [form.price, form.stock]);

  // close on ESC + lock scroll
  useEffect(() => {
    if (!open) return;

    const onKeyDown = (e) => {
      if (e.key === "Escape") onClose?.();
    };

    document.addEventListener("keydown", onKeyDown);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);
  useEffect(() => {
    if (!open) return;
    setForm(initial);
    setFile(null);
    if (preview) URL.revokeObjectURL(preview);
    setPreview("");
    setDrag(false);

    setAddingCat(false);
    setNewCat("");

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // cleanup objectURL
  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  if (!open) return null;

  const change = (key) => (e) => {
    setForm((p) => ({ ...p, [key]: e.target.value }));
  };

  const pickFile = (f) => {
    if (!f) return;
    if (!f.type.startsWith("image/")) return;
    if (f.size > 5 * 1024 * 1024) return; // 5MB

    setFile(f);
    const url = URL.createObjectURL(f);
    setPreview((old) => {
      if (old) URL.revokeObjectURL(old);
      return url;
    });
  };

  const onFileChange = (e) => pickFile(e.target.files?.[0]);

  const onDrop = (e) => {
    e.preventDefault();
    setDrag(false);
    pickFile(e.dataTransfer.files?.[0]);
  };

  const submit = (e) => {
    e.preventDefault();
    // тут позже сделаешь FormData для backend
    onSubmit?.({ ...form, image: file });
  };

  return (
    <div className="NPM-Overlay" onMouseDown={onClose}>
      <div className="NPM-Modal" onMouseDown={(e) => e.stopPropagation()}>
        {/* header */}
        <div className="NPM-Header">
          <div className="NPM-HeaderTitle">Yeni Məhsul</div>
          <button className="NPM-Close" type="button" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        {/* content */}
        <form className="NPM-Content" onSubmit={submit}>
          {/* LEFT */}
          <div className="NPM-Left">
            <div
              className={`NPM-Drop ${drag ? "drag" : ""} ${preview ? "has" : ""}`}
              onDragEnter={(e) => {
                e.preventDefault();
                setDrag(true);
              }}
              onDragOver={(e) => {
                e.preventDefault();
                setDrag(true);
              }}
              onDragLeave={() => setDrag(false)}
              onDrop={onDrop}
            >
              {preview ? (
                <img className="NPM-PreviewImg" src={preview} alt="preview" />
              ) : (
                <>
                  <div className="NPM-DropIcon">
                    <Upload size={40} />
                  </div>
                  <div className="NPM-DropTitle">Şəkil yüklə</div>
                  <div className="NPM-DropDesc">və ya şəkli sürüşdürün</div>

                  <button
                    className="NPM-PickBtn"
                    type="button"
                    onClick={() => inputRef.current?.click()}
                  >
                    Şəkil seçin
                  </button>

                  <div className="NPM-DropHint">PNG/JPG • max 5MB</div>
                </>
              )}

              <input
                ref={inputRef}
                type="file"
                accept="image/*"
                onChange={onFileChange}
                style={{ display: "none" }}
              />
            </div>

            {/* VALUE CARD */}
            <div className="NPM-ValueCard">
              <div className="NPM-ValueLeft">
                <div className="NPM-Thumb">
                  {preview ? (
                    <img src={preview} alt="thumb" />
                  ) : (
                    <div className="NPM-ThumbIcon">
                      <ImageIcon size={22} />
                    </div>
                  )}
                </div>

                <div className="NPM-ThumbText">
                  <div className="NPM-ThumbName">
                    {form.name?.trim() ? form.name : "MacBook Pro 16''"}
                  </div>
                </div>
              </div>

              <div className="NPM-ValueRight">
                <div className="NPM-ValueLabel">Dəyər</div>
                <div className="NPM-ValueNum">₼{valueAZN.toLocaleString()}</div>
                <div className="NPM-ValueSub">(stok × qiymət)</div>
              </div>
            </div>
          </div>

          {/* RIGHT */}
          <div className="NPM-Right">
            <div className="NPM-Grid2">
              <div className="NPM-Field">
                <label>Məhsul adı *</label>
                <input
                  value={form.name}
                  onChange={change("name")}
                  placeholder="Məhsul adı"
                />
              </div>

              <div className="NPM-Field">
                <label>SKU *</label>
                <input
                  value={form.sku}
                  onChange={change("sku")}
                  placeholder="ELEC-001"
                />
              </div>
            </div>

            <div className="NPM-Grid2">
              <div className="NPM-Field">
                <div className="NPM-LabelRow">
                  <label>Kateqoriya</label>

                  <button
                    type="button"
                    className="NPM-LinkBtn"
                    onClick={() => setAddingCat((v) => !v)}
                  >
                    + Yeni kateqoriya
                  </button>
                </div>

                <select value={form.category} onChange={change("category")}>
                  {categories.length ? (
                    categories.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))
                  ) : (
                    <>
                      {/* fallback если categories не передали */}
                      <option value="Elektronika">Elektronika</option>
                      <option value="Geyim">Geyim</option>
                      <option value="Qida">Qida</option>
                      <option value="Mebel">Mebel</option>
                      <option value="Digər">Digər</option>
                    </>
                  )}
                </select>

                {addingCat ? (
                  <div className="NPM-AddCatRow">
                    <input
                      value={newCat}
                      onChange={(e) => setNewCat(e.target.value)}
                      placeholder="Məs: Aksesuarlar"
                    />

                    <button
                      type="button"
                      className="NPM-AddCatBtn"
                      onClick={addCategory}
                    >
                      Əlavə et
                    </button>

                    <button
                      type="button"
                      className="NPM-CancelMini"
                      onClick={() => {
                        setNewCat("");
                        setAddingCat(false);
                      }}
                    >
                      Ləğv
                    </button>
                  </div>
                ) : null}
              </div>

              <div className="NPM-Field">
                <label>Təchizatçı</label>
                <input
                  value={form.supplier}
                  onChange={change("supplier")}
                  placeholder="İxtiyari"
                />
              </div>
            </div>

            <div className="NPM-Grid2">
              <div className="NPM-Field">
                <label>Qiymət-Aliş (₼)</label>
                <input
                  type="number"
                  value={form.cost}
                  onChange={change("cost")}
                  placeholder="₼"
                />
              </div>

              <div className="NPM-Field">
                <label>Qiymət-Satiş (₼)</label>
                <input
                  type="number"
                  value={form.price}
                  onChange={change("price")}
                  placeholder="₼"
                />
              </div>
            </div>

            <div className="NPM-Grid2">
              <div className="NPM-Field">
                <label>Stok (mövcud)</label>
                <input
                  type="number"
                  value={form.stock}
                  onChange={change("stock")}
                  placeholder=""
                />
              </div>

              <div className="NPM-Field">
                <label>Maksimum stok</label>
                <input
                  type="number"
                  value={form.minStock}
                  onChange={change("minStock")}
                  placeholder="10"
                />
              </div>
            </div>

            <div className="NPM-Grid2">
              <div className="NPM-Field">
                <label>Status</label>
                <div className="NPM-StatusRow">
                  <input
                    className="NPM-StatusInput"
                    value={form.status}
                    readOnly
                  />
                  <select
                    className="NPM-StatusSelect"
                    value={form.status}
                    onChange={change("status")}
                  >
                    {statusOptions.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                  <span className={`NPM-Badge ${form.status}`}>
                    {form.status}
                  </span>
                </div>
              </div>

              <div className="NPM-Field">
                <label>Təsvir</label>
                <textarea
                  value={form.desc}
                  onChange={change("desc")}
                  placeholder="Məhsul haqqında qısa təsvir yazın"
                />
              </div>
            </div>
          </div>

          {/* footer */}
          <div className="NPM-Footer">
            <button className="NPM-Cancel" type="button" onClick={onClose}>
              Ləğv et
            </button>

            <button className="NPM-Save" type="submit">
              <Save size={18} />
              <span>Dəyişiklikləri Yadda Saxla</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
