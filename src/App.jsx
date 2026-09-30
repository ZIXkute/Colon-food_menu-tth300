import React, { useState, useEffect } from "react";
import { Plus, Pencil, Trash2, Check, X, UtensilsCrossed, LayoutDashboard, BookOpen, Search } from "lucide-react";

const API = "/api/menu";
const CATEGORIES = ["Starters", "Mains", "Desserts", "Drinks"];
const EMPTY_FORM = { name: "", category: CATEGORIES[0], price: "", description: "", available: true };

// MySQL returns price as a string and available as 1/0
const normalize = (row) => ({
  ...row,
  price: Number(row.price),
  available: Boolean(row.available),
});

export default function App() {
  const [dishes, setDishes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState("");
  const [activeTab, setActiveTab] = useState("dashboard");
  const [filterCategory, setFilterCategory] = useState("All");
  const [searchTerm, setSearchTerm] = useState("");
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});

  const loadDishes = async () => {
    try {
      const res = await fetch(API);
      if (!res.ok) throw new Error("Server error");
      const rows = await res.json();
      setDishes(rows.map(normalize));
      setApiError("");
    } catch {
      setApiError("Can't reach the server. Is `npm start` running?");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDishes();
  }, []);

  const openAddForm = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setErrors({});
    setActiveTab("form");
  };

  const openEditForm = (dish) => {
    setEditingId(dish.id);
    setForm({ name: dish.name, category: dish.category, price: String(dish.price), description: dish.description, available: dish.available });
    setErrors({});
    setActiveTab("form");
  };

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = "Name your dish.";
    if (!form.description.trim()) e.description = "Add a short description.";
    const priceNum = parseFloat(form.price);
    if (!form.price || isNaN(priceNum) || priceNum <= 0) e.price = "Enter a price above $0.";
    return e;
  };

  const handleSubmit = async (evt) => {
    evt.preventDefault();
    const e = validate();
    if (Object.keys(e).length > 0) {
      setErrors(e);
      return;
    }
    const payload = { ...form, price: parseFloat(form.price), available: Boolean(form.available) };
    try {
      const res = await fetch(editingId ? `${API}/${editingId}` : API, {
        method: editingId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setErrors({ form: data.message || "Failed to save dish." });
        return;
      }
      await loadDishes();
      setActiveTab("menu");
    } catch {
      setErrors({ form: "Can't reach the server." });
    }
  };

  const handleDelete = async (id) => {
    try {
      const res = await fetch(`${API}/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      await loadDishes();
    } catch {
      setApiError("Failed to delete dish.");
    }
    setDeleteConfirmId(null);
  };

  const toggleAvailable = async (dish) => {
    try {
      const res = await fetch(`${API}/${dish.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...dish, available: !dish.available }),
      });
      if (!res.ok) throw new Error();
      await loadDishes();
    } catch {
      setApiError("Failed to update availability.");
    }
  };

  const visibleDishes = dishes.filter((d) => {
    const matchesCategory = filterCategory === "All" || d.category === filterCategory;
    const matchesSearch = d.name.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const total = dishes.length;
  const avgPrice = total ? (dishes.reduce((s, d) => s + d.price, 0) / total).toFixed(2) : "0.00";
  const availableCount = dishes.filter((d) => d.available).length;
  const categoryCounts = CATEGORIES.map((c) => ({ name: c, count: dishes.filter((d) => d.category === c).length }));
  const maxCatCount = Math.max(1, ...categoryCounts.map((c) => c.count));
  const recent = dishes.slice(-3).reverse();

  return (
    <div className="fm-app">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400..700&family=Inter:wght@400;500;600;700&display=swap');

        .fm-app {
          --bg: #22261F;
          --surface: #2A2F24;
          --surface-2: #313629;
          --border: #3E4433;
          --text: #F2EFE6;
          --text-muted: #A6AE97;
          --accent: #D6A24A;
          --accent-dim: #8C743A;
          --danger: #B8543F;
          --success: #7FA36B;
          background: var(--bg);
          color: var(--text);
          font-family: 'Inter', -apple-system, sans-serif;
          min-height: 100vh;
          width: 100%;
        }
        .fm-app *, .fm-app *::before, .fm-app *::after { box-sizing: border-box; }

        .fm-header { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 16px; padding: 20px 28px; border-bottom: 1px solid var(--border); }
        .fm-brand { display: flex; align-items: center; gap: 10px; color: var(--accent); }
        .fm-brand-name { font-family: 'Fraunces', Georgia, serif; font-size: 22px; font-weight: 600; color: var(--text); }
        .fm-brand-tag { font-size: 13px; color: var(--text-muted); margin-left: 4px; }

        .fm-tabs { display: flex; gap: 4px; }
        .fm-tab-btn { display: flex; align-items: center; gap: 6px; background: transparent; border: none; cursor: pointer; color: var(--text-muted); font-family: 'Inter', sans-serif; font-size: 14px; font-weight: 500; padding: 8px 14px; border-bottom: 2px solid transparent; transition: color 0.15s ease, border-color 0.15s ease; }
        .fm-tab-btn:hover { color: var(--text); }
        .fm-tab-btn.active { color: var(--accent); border-bottom-color: var(--accent); }

        .fm-content { max-width: 780px; margin: 0 auto; padding: 36px 28px 64px; }
        .fm-page-title { font-family: 'Fraunces', Georgia, serif; font-size: 28px; font-weight: 600; margin: 0 0 6px; }
        .fm-page-sub { color: var(--text-muted); font-size: 14px; margin: 0 0 32px; }

        .fm-stats-row { display: flex; align-items: stretch; gap: 0; margin-bottom: 40px; flex-wrap: wrap; }
        .fm-stat { flex: 1; min-width: 140px; padding: 4px 24px; }
        .fm-stat:first-child { padding-left: 0; }
        .fm-stat-divider { width: 1px; background: var(--border); margin: 4px 0; }
        .fm-stat-num { font-family: 'Fraunces', Georgia, serif; font-size: 36px; font-weight: 600; color: var(--accent); line-height: 1.1; }
        .fm-stat-label { font-size: 13px; color: var(--text-muted); margin-top: 4px; }

        .fm-section-heading { font-family: 'Fraunces', Georgia, serif; font-size: 17px; font-weight: 600; margin: 0 0 14px; }

        .fm-bar-row { display: flex; align-items: center; gap: 12px; margin-bottom: 10px; }
        .fm-bar-label { width: 80px; font-size: 13px; color: var(--text-muted); flex-shrink: 0; }
        .fm-bar-track { flex: 1; height: 8px; background: var(--surface-2); border-radius: 4px; overflow: hidden; }
        .fm-bar-fill { height: 100%; background: var(--accent); border-radius: 4px; }
        .fm-bar-count { width: 24px; text-align: right; font-size: 13px; color: var(--text-muted); }

        .fm-recent-list { list-style: none; padding: 0; margin: 0; }
        .fm-recent-item { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid var(--border); font-size: 14px; }
        .fm-recent-item:last-child { border-bottom: none; }
        .fm-recent-cat { color: var(--text-muted); font-size: 13px; }

        .fm-toolbar { display: flex; flex-wrap: wrap; gap: 12px; align-items: center; justify-content: space-between; margin-bottom: 20px; }
        .fm-chips { display: flex; gap: 8px; flex-wrap: wrap; }
        .fm-chip { background: var(--surface); border: 1px solid var(--border); color: var(--text-muted); padding: 6px 14px; border-radius: 999px; font-size: 13px; cursor: pointer; font-family: 'Inter', sans-serif; }
        .fm-chip.active { background: var(--accent); border-color: var(--accent); color: #22261F; font-weight: 600; }

        .fm-search { position: relative; }
        .fm-search input { background: var(--surface); border: 1px solid var(--border); color: var(--text); padding: 8px 12px 8px 34px; border-radius: 6px; font-size: 13px; font-family: 'Inter', sans-serif; width: 200px; }
        .fm-search svg { position: absolute; left: 10px; top: 50%; transform: translateY(-50%); color: var(--text-muted); }

        .fm-add-btn { display: inline-flex; align-items: center; gap: 6px; background: var(--accent); color: #22261F; border: none; border-radius: 6px; padding: 10px 16px; font-size: 14px; font-weight: 600; cursor: pointer; font-family: 'Inter', sans-serif; }
        .fm-add-btn:hover { background: #E3AF57; }

        .fm-dish-row { padding: 16px 0; border-bottom: 1px solid var(--border); }
        .fm-dish-top { display: flex; align-items: baseline; gap: 10px; }
        .fm-dish-name { font-family: 'Fraunces', Georgia, serif; font-size: 17px; font-weight: 500; white-space: nowrap; }
        .fm-leader { flex: 1; border-bottom: 1px dotted var(--border); margin-bottom: 5px; }
        .fm-dish-price { font-family: 'Fraunces', Georgia, serif; font-size: 17px; color: var(--accent); white-space: nowrap; }
        .fm-dish-desc { color: var(--text-muted); font-size: 13.5px; margin-top: 6px; line-height: 1.5; max-width: 560px; }
        .fm-dish-meta { display: flex; align-items: center; gap: 10px; margin-top: 12px; flex-wrap: wrap; }
        .fm-cat-tag { font-size: 12px; color: var(--text-muted); border: 1px solid var(--border); border-radius: 4px; padding: 2px 8px; }

        .fm-avail-btn { display: inline-flex; align-items: center; gap: 5px; border: none; background: none; cursor: pointer; font-size: 12px; font-family: 'Inter', sans-serif; padding: 2px 8px; border-radius: 4px; }
        .fm-avail-btn.on { color: var(--success); background: rgba(127,163,107,0.12); }
        .fm-avail-btn.off { color: var(--danger); background: rgba(184,84,63,0.12); }

        .fm-row-actions { display: flex; gap: 6px; margin-left: auto; }
        .fm-icon-btn { background: none; border: 1px solid var(--border); color: var(--text-muted); border-radius: 5px; padding: 6px; cursor: pointer; display: flex; }
        .fm-icon-btn:hover { color: var(--text); border-color: var(--text-muted); }
        .fm-icon-btn.danger:hover { color: var(--danger); border-color: var(--danger); }

        .fm-confirm-row { display: flex; align-items: center; gap: 10px; margin-left: auto; font-size: 13px; color: var(--text-muted); }
        .fm-confirm-btn { border: none; border-radius: 5px; padding: 6px 12px; font-size: 13px; cursor: pointer; font-family: 'Inter', sans-serif; font-weight: 600; }
        .fm-confirm-btn.yes { background: var(--danger); color: #F2EFE6; }
        .fm-confirm-btn.no { background: var(--surface-2); color: var(--text); }

        .fm-empty { color: var(--text-muted); font-size: 14px; padding: 40px 0; text-align: center; }

        .fm-form-group { margin-bottom: 20px; }
        .fm-label { display: block; font-size: 13px; color: var(--text-muted); margin-bottom: 6px; }
        .fm-input, .fm-select, .fm-textarea { width: 100%; background: var(--surface); border: 1px solid var(--border); color: var(--text); padding: 10px 12px; border-radius: 6px; font-size: 14px; font-family: 'Inter', sans-serif; }
        .fm-input:focus, .fm-select:focus, .fm-textarea:focus { outline: none; border-color: var(--accent); }
        .fm-textarea { resize: vertical; min-height: 80px; }
        .fm-error { color: var(--danger); font-size: 12px; margin-top: 5px; }
        .fm-row-2 { display: flex; gap: 16px; }
        .fm-row-2 > div { flex: 1; }

        .fm-toggle-row { display: flex; align-items: center; gap: 10px; }
        .fm-toggle-btn { display: inline-flex; align-items: center; gap: 6px; border: 1px solid var(--border); background: var(--surface); color: var(--text-muted); border-radius: 6px; padding: 8px 14px; font-size: 13px; cursor: pointer; font-family: 'Inter', sans-serif; }
        .fm-toggle-btn.on { border-color: var(--success); color: var(--success); background: rgba(127,163,107,0.1); }

        .fm-form-actions { display: flex; gap: 10px; margin-top: 28px; }
        .fm-btn-primary { background: var(--accent); color: #22261F; border: none; border-radius: 6px; padding: 11px 20px; font-size: 14px; font-weight: 600; cursor: pointer; font-family: 'Inter', sans-serif; }
        .fm-btn-primary:hover { background: #E3AF57; }
        .fm-btn-secondary { background: none; border: 1px solid var(--border); color: var(--text-muted); border-radius: 6px; padding: 11px 20px; font-size: 14px; cursor: pointer; font-family: 'Inter', sans-serif; }
        .fm-btn-secondary:hover { color: var(--text); }
      `}</style>

      <header className="fm-header">
        <div className="fm-brand">
          <UtensilsCrossed size={20} />
          <span className="fm-brand-name">Makaon</span>
          <span className="fm-brand-tag">menu management</span>
        </div>
        <nav className="fm-tabs">
          <button className={`fm-tab-btn ${activeTab === "dashboard" ? "active" : ""}`} onClick={() => setActiveTab("dashboard")}>
            <LayoutDashboard size={15} /> Dashboard
          </button>
          <button className={`fm-tab-btn ${activeTab === "menu" ? "active" : ""}`} onClick={() => setActiveTab("menu")}>
            <BookOpen size={15} /> Full Menu
          </button>
          <button className={`fm-tab-btn ${activeTab === "form" ? "active" : ""}`} onClick={openAddForm}>
            <Plus size={15} /> Add Dish
          </button>
        </nav>
      </header>

      <main className="fm-content">
        {loading && <div className="fm-empty">Loading menu…</div>}
        {apiError && <div className="fm-error" style={{ marginBottom: 16 }}>{apiError}</div>}

        {activeTab === "dashboard" && (
          <>
            <h1 className="fm-page-title">Dashboard</h1>
            <p className="fm-page-sub">A quick read on what's on the menu right now.</p>

            <div className="fm-stats-row">
              <div className="fm-stat">
                <div className="fm-stat-num">{total}</div>
                <div className="fm-stat-label">dishes on the menu</div>
              </div>
              <div className="fm-stat-divider" />
              <div className="fm-stat">
                <div className="fm-stat-num">${avgPrice}</div>
                <div className="fm-stat-label">average price</div>
              </div>
              <div className="fm-stat-divider" />
              <div className="fm-stat">
                <div className="fm-stat-num">{availableCount}</div>
                <div className="fm-stat-label">available now</div>
              </div>
            </div>

            <h2 className="fm-section-heading">By category</h2>
            <div style={{ marginBottom: 36 }}>
              {categoryCounts.map((c) => (
                <div className="fm-bar-row" key={c.name}>
                  <div className="fm-bar-label">{c.name}</div>
                  <div className="fm-bar-track">
                    <div className="fm-bar-fill" style={{ width: `${(c.count / maxCatCount) * 100}%` }} />
                  </div>
                  <div className="fm-bar-count">{c.count}</div>
                </div>
              ))}
            </div>

            <h2 className="fm-section-heading">Recently added</h2>
            <ul className="fm-recent-list">
              {recent.map((d) => (
                <li className="fm-recent-item" key={d.id}>
                  <span>{d.name}</span>
                  <span className="fm-recent-cat">{d.category}</span>
                </li>
              ))}
            </ul>
          </>
        )}

        {activeTab === "menu" && (
          <>
            <h1 className="fm-page-title">Full Menu</h1>
            <p className="fm-page-sub">View, edit, or remove dishes from the menu.</p>

            <div className="fm-toolbar">
              <div className="fm-chips">
                {["All", ...CATEGORIES].map((c) => (
                  <button key={c} className={`fm-chip ${filterCategory === c ? "active" : ""}`} onClick={() => setFilterCategory(c)}>
                    {c}
                  </button>
                ))}
              </div>
              <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                <div className="fm-search">
                  <Search size={14} />
                  <input placeholder="Search dishes…" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                </div>
                <button className="fm-add-btn" onClick={openAddForm}>
                  <Plus size={15} /> Add Dish
                </button>
              </div>
            </div>

            {!loading && visibleDishes.length === 0 && <div className="fm-empty">No dishes match. Try a different filter or add a new one.</div>}

            {visibleDishes.map((d) => (
              <div className="fm-dish-row" key={d.id}>
                <div className="fm-dish-top">
                  <span className="fm-dish-name">{d.name}</span>
                  <span className="fm-leader" />
                  <span className="fm-dish-price">${d.price.toFixed(2)}</span>
                </div>
                <div className="fm-dish-desc">{d.description}</div>
                <div className="fm-dish-meta">
                  <span className="fm-cat-tag">{d.category}</span>
                  <button className={`fm-avail-btn ${d.available ? "on" : "off"}`} onClick={() => toggleAvailable(d)}>
                    {d.available ? <Check size={13} /> : <X size={13} />}
                    {d.available ? "Available" : "86'd"}
                  </button>

                  {deleteConfirmId === d.id ? (
                    <div className="fm-confirm-row">
                      <span>Remove this dish?</span>
                      <button className="fm-confirm-btn yes" onClick={() => handleDelete(d.id)}>Delete</button>
                      <button className="fm-confirm-btn no" onClick={() => setDeleteConfirmId(null)}>Cancel</button>
                    </div>
                  ) : (
                    <div className="fm-row-actions">
                      <button className="fm-icon-btn" onClick={() => openEditForm(d)}><Pencil size={14} /></button>
                      <button className="fm-icon-btn danger" onClick={() => setDeleteConfirmId(d.id)}><Trash2 size={14} /></button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </>
        )}

        {activeTab === "form" && (
          <>
            <h1 className="fm-page-title">{editingId ? "Edit Dish" : "Add a New Dish"}</h1>
            <p className="fm-page-sub">{editingId ? "Update the details for this dish." : "Fill in the details to add a dish to the menu."}</p>

            <form onSubmit={handleSubmit}>
              <div className="fm-form-group">
                <label className="fm-label">Dish name</label>
                <input className="fm-input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Charred Octopus" />
                {errors.name && <div className="fm-error">{errors.name}</div>}
              </div>

              <div className="fm-row-2">
                <div className="fm-form-group">
                  <label className="fm-label">Category</label>
                  <select className="fm-select" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                    {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="fm-form-group">
                  <label className="fm-label">Price ($)</label>
                  <input className="fm-input" type="number" step="0.01" min="0" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} placeholder="0.00" />
                  {errors.price && <div className="fm-error">{errors.price}</div>}
                </div>
              </div>

              <div className="fm-form-group">
                <label className="fm-label">Description</label>
                <textarea className="fm-textarea" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Short description of the dish" />
                {errors.description && <div className="fm-error">{errors.description}</div>}
              </div>

              <div className="fm-form-group">
                <label className="fm-label">Availability</label>
                <div className="fm-toggle-row">
                  <button type="button" className={`fm-toggle-btn ${form.available ? "on" : ""}`} onClick={() => setForm({ ...form, available: !form.available })}>
                    {form.available ? <Check size={14} /> : <X size={14} />}
                    {form.available ? "Available" : "86'd"}
                  </button>
                </div>
              </div>

              {errors.form && <div className="fm-error">{errors.form}</div>}

              <div className="fm-form-actions">
                <button type="submit" className="fm-btn-primary">{editingId ? "Save changes" : "Add to menu"}</button>
                <button type="button" className="fm-btn-secondary" onClick={() => setActiveTab("menu")}>Cancel</button>
              </div>
            </form>
          </>
        )}
      </main>
    </div>
  );
}