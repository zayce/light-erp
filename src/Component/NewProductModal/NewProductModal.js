import { useEffect, useMemo, useRef, useState } from "react";
import { X, Upload, Image as ImageIcon, Save } from "lucide-react";
import "../NewProductModal/NewProductModal.scss";

const initial = {
  name: "",
  sku: "",
  category: "",
  subcategory: "",
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
  onAddSubcategory,
}) => {
  const [form, setForm] = useState(initial);
  const [addingCat, setAddingCat] = useState(false);
  const [addingSubcat, setAddingSubcat] = useState(false);
  const [newCat, setNewCat] = useState("");
  const [newSubcat, setNewSubcat] = useState("");
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState("");
  const [drag, setDrag] = useState(false);

  const inputRef = useRef(null);

  // Нормализуем categories, чтобы и строки, и объекты работали одинаково
  const normalizedCategories = useMemo(() => {
    if (!Array.isArray(categories)) return [];

    return categories.map((cat, index) => {
      if (typeof cat === "string") {
        return {
          id: `legacy-${index}`,
          name: cat,
          subcategories: [],
        };
      }

      return {
        id: cat?.id ?? `cat-${index}`,
        name: String(cat?.name || "").trim(),
        subcategories: Array.isArray(cat?.subcategories)
          ? cat.subcategories.map((sub, subIndex) => {
              if (typeof sub === "string") {
                return {
                  id: `legacy-sub-${index}-${subIndex}`,
                  name: sub,
                };
              }

              return {
                id: sub?.id ?? `sub-${index}-${subIndex}`,
                name: String(sub?.name || "").trim(),
              };
            })
          : [],
      };
    });
  }, [categories]);

  const selectedCategoryObj = useMemo(() => {
    return (
      normalizedCategories.find((cat) => cat.name === form.category) || null
    );
  }, [normalizedCategories, form.category]);

  const availableSubcategories = selectedCategoryObj?.subcategories || [];

  const valueAZN = useMemo(() => {
    const p = Number(form.price || 0);
    const s = Number(form.stock || 0);
    return p * s;
  }, [form.price, form.stock]);

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

    const firstCategory = normalizedCategories[0];
    const firstSubcategory = firstCategory?.subcategories?.[0]?.name || "";

    setForm({
      ...initial,
      category: firstCategory?.name || "",
      subcategory: firstSubcategory,
    });

    setFile(null);

    if (preview) URL.revokeObjectURL(preview);
    setPreview("");

    setDrag(false);
    setAddingCat(false);
    setAddingSubcat(false);
    setNewCat("");
    setNewSubcat("");
  }, [open, normalizedCategories]);

  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  if (!open) return null;

  const change = (key) => (e) => {
    setForm((prev) => ({ ...prev, [key]: e.target.value }));
  };

  const handleCategoryChange = (e) => {
    const nextCategory = e.target.value;

    const found = normalizedCategories.find((cat) => cat.name === nextCategory);

    setForm((prev) => ({
      ...prev,
      category: nextCategory,
      subcategory: found?.subcategories?.[0]?.name || "",
    }));

    setAddingSubcat(false);
    setNewSubcat("");
  };

  const addCategory = () => {
    const name = newCat.trim();
    if (!name) return;

    const exists = normalizedCategories.some(
      (cat) => String(cat?.name || "").toLowerCase() === name.toLowerCase(),
    );

    if (exists) {
      alert("Bu kateqoriya artıq mövcuddur!");
      return;
    }

    onAddCategory?.(name);

    setForm((prev) => ({
      ...prev,
      category: name,
      subcategory: "",
    }));

    setNewCat("");
    setAddingCat(false);
  };

  const addSubcategory = () => {
    const name = newSubcat.trim();
    if (!name || !selectedCategoryObj) return;

    const exists = availableSubcategories.some(
      (sub) => String(sub?.name || "").toLowerCase() === name.toLowerCase(),
    );

    if (exists) {
      alert("Bu alt kateqoriya artıq mövcuddur!");
      return;
    }

    onAddSubcategory?.(selectedCategoryObj.id, name);

    setForm((prev) => ({
      ...prev,
      subcategory: name,
    }));

    setNewSubcat("");
    setAddingSubcat(false);
  };

  const pickFile = (f) => {
    if (!f) return;
    if (!f.type.startsWith("image/")) return;
    if (f.size > 5 * 1024 * 1024) return;

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

    if (!form.name.trim() || !form.sku.trim()) return;
    if (!form.category.trim()) return;
    if (!form.subcategory.trim()) return;

    onSubmit?.({
      ...form,
      image: file,
    });
  };

  return (
    <div className="NPM-Overlay" onMouseDown={onClose}>
      <div className="NPM-Modal" onMouseDown={(e) => e.stopPropagation()}>
        <div className="NPM-Header">
          <div className="NPM-HeaderTitle">Yeni Məhsul</div>
          <button className="NPM-Close" type="button" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <form className="NPM-Content" onSubmit={submit}>
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
                    {form.name?.trim() ? form.name : "Yeni məhsul"}
                  </div>
                  <div className="NPM-ThumbName">
                    {form.category && form.subcategory
                      ? `${form.category} / ${form.subcategory}`
                      : "Kateqoriya seçin"}
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
                  <label>Əsas Kateqoriya</label>

                  <button
                    type="button"
                    className="NPM-LinkBtn"
                    onClick={() => setAddingCat((v) => !v)}
                  >
                    + Yeni kateqoriya
                  </button>
                </div>

                <select value={form.category} onChange={handleCategoryChange}>
                  <option value="">Kateqoriya seçin</option>
                  {normalizedCategories.map((cat) => (
                    <option key={cat.id} value={cat.name}>
                      {cat.name}
                    </option>
                  ))}
                </select>

                {addingCat ? (
                  <div className="NPM-AddCatRow">
                    <input
                      value={newCat}
                      onChange={(e) => setNewCat(e.target.value)}
                      placeholder="Məs: Elektronika"
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
                <div className="NPM-LabelRow">
                  <label>Alt Kateqoriya</label>

                  <button
                    type="button"
                    className="NPM-LinkBtn"
                    onClick={() => setAddingSubcat((v) => !v)}
                    disabled={!form.category}
                  >
                    + Yeni alt kateqoriya
                  </button>
                </div>

                <select
                  value={form.subcategory}
                  onChange={change("subcategory")}
                  disabled={!form.category}
                >
                  <option value="">Alt kateqoriya seçin</option>
                  {availableSubcategories.map((sub) => (
                    <option key={sub.id} value={sub.name}>
                      {sub.name}
                    </option>
                  ))}
                </select>

                {addingSubcat ? (
                  <div className="NPM-AddCatRow">
                    <input
                      value={newSubcat}
                      onChange={(e) => setNewSubcat(e.target.value)}
                      placeholder="Məs: Telefon"
                    />

                    <button
                      type="button"
                      className="NPM-AddCatBtn"
                      onClick={addSubcategory}
                    >
                      Əlavə et
                    </button>

                    <button
                      type="button"
                      className="NPM-CancelMini"
                      onClick={() => {
                        setNewSubcat("");
                        setAddingSubcat(false);
                      }}
                    >
                      Ləğv
                    </button>
                  </div>
                ) : null}
              </div>
            </div>

            <div className="NPM-Grid2">
              <div className="NPM-Field">
                <label>Təchizatçı</label>
                <input
                  value={form.supplier}
                  onChange={change("supplier")}
                  placeholder="İxtiyari"
                />
              </div>

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
                <label>Qiymət-Satış (₼)</label>
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
                  placeholder="0"
                />
              </div>

              <div className="NPM-Field">
                <label>Minimum stok</label>
                <input
                  type="number"
                  value={form.minStock}
                  onChange={change("minStock")}
                  placeholder="10"
                />
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

          <div className="NPM-Footer">
            <button className="NPM-Cancel" type="button" onClick={onClose}>
              Ləğv et
            </button>

            <button className="NPM-Save" type="submit">
              <Save size={18} />
              <span>Yadda Saxla</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
