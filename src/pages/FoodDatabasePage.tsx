import { useState, useEffect, useCallback, useRef } from 'react';
import { foodApi, foodCategoryApi, foodVariantApi } from '../api';
import type { Food, FoodCategory, FoodVariant } from '../types';
import { NavTabs } from '../components/NavTabs';
import { UserMenu } from '../components/UserMenu';

// ── Food Detail Modal ──
function FoodDetail({
  food,
  categories,
  onClose,
  onUpdate,
  onDelete,
}: {
  food: Food;
  categories: FoodCategory[];
  onClose: () => void;
  onUpdate: (f: Food) => void;
  onDelete: (id: number) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(food.name);
  const [description, setDescription] = useState(food.description || '');
  const [link, setLink] = useState(food.link || '');
  const [categoryId, setCategoryId] = useState<number | null>(food.categoryId);
  const [variants, setVariants] = useState<FoodVariant[]>(food.variants || []);
  const [newVariant, setNewVariant] = useState({ name: '', description: '', preparation: '' });
  const [showAddVariant, setShowAddVariant] = useState(false);
  const [editingVariant, setEditingVariant] = useState<number | null>(null);
  const [editVariantData, setEditVariantData] = useState({ name: '', description: '', preparation: '' });
  const [expandedVariant, setExpandedVariant] = useState<number | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    foodVariantApi.getAll(food.id).then((v) => setVariants(v as FoodVariant[])).catch(() => {});
  }, [food.id]);

  async function handleSave() {
    try {
      const updated = await foodApi.update(food.id, { name, description, link, categoryId });
      onUpdate(updated as Food);
      setEditing(false);
    } catch { /* silent */ }
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const updated = await foodApi.uploadImage(food.id, file);
      onUpdate(updated as Food);
    } catch { /* silent */ }
  }

  async function handleAddVariant(e: React.FormEvent) {
    e.preventDefault();
    if (!newVariant.name.trim()) return;
    try {
      const v = await foodVariantApi.create(food.id, newVariant);
      setVariants((prev) => [...prev, v as FoodVariant]);
      setNewVariant({ name: '', description: '', preparation: '' });
      setShowAddVariant(false);
    } catch { /* silent */ }
  }

  async function handleUpdateVariant(id: number) {
    try {
      const v = await foodVariantApi.update(food.id, id, editVariantData);
      setVariants((prev) => prev.map((x) => (x.id === id ? (v as FoodVariant) : x)));
      setEditingVariant(null);
    } catch { /* silent */ }
  }

  async function handleDeleteVariant(id: number) {
    try {
      await foodVariantApi.delete(food.id, id);
      setVariants((prev) => prev.filter((x) => x.id !== id));
    } catch { /* silent */ }
  }

  async function handleDeleteFood() {
    try {
      await foodApi.delete(food.id);
      onDelete(food.id);
    } catch { /* silent */ }
  }

  return (
    <div className="fd-overlay" onClick={onClose}>
      <div className="fd-detail" onClick={(e) => e.stopPropagation()}>
        <div className="fd-detail-header">
          <button className="fd-detail-close" onClick={onClose}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        {/* Image */}
        <div className="fd-detail-image" onClick={() => fileRef.current?.click()}>
          {food.imageUrl ? (
            <img src={food.imageUrl} alt={food.name} />
          ) : (
            <span className="fd-detail-image-placeholder">DODAJ ZDJECIE</span>
          )}
          <input ref={fileRef} type="file" accept="image/*" hidden onChange={handleImageUpload} />
        </div>

        {/* Content */}
        <div className="fd-detail-body">
          {editing ? (
            <div className="fd-edit-form">
              <input className="fd-edit-input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Nazwa" />
              <textarea className="fd-edit-textarea" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Opis" rows={3} />
              <input className="fd-edit-input" value={link} onChange={(e) => setLink(e.target.value)} placeholder="Link do przepisu" />
              <select className="fd-edit-select" value={categoryId ?? ''} onChange={(e) => setCategoryId(e.target.value ? Number(e.target.value) : null)}>
                <option value="">Bez kategorii</option>
                {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              <div className="fd-edit-actions">
                <button className="fd-btn fd-btn--primary" onClick={handleSave}>ZAPISZ</button>
                <button className="fd-btn" onClick={() => setEditing(false)}>ANULUJ</button>
              </div>
            </div>
          ) : (
            <>
              <h2 className="fd-detail-name">{food.name}</h2>
              {food.categoryName && <span className="fd-detail-cat">{food.categoryName}</span>}
              {food.description && <p className="fd-detail-desc">{food.description}</p>}
              {food.link && <a className="fd-detail-link" href={food.link} target="_blank" rel="noopener noreferrer">Przepis</a>}
              <div className="fd-detail-actions">
                <button className="fd-btn" onClick={() => setEditing(true)}>EDYTUJ</button>
                <button className="fd-btn fd-btn--danger" onClick={handleDeleteFood}>USUN</button>
              </div>
            </>
          )}

          {/* Variants */}
          <div className="fd-variants">
            <div className="fd-variants-header">
              <h3 className="fd-variants-title">WARIANTY</h3>
              <button className="fd-btn fd-btn--small" onClick={() => setShowAddVariant(!showAddVariant)}>
                {showAddVariant ? 'ANULUJ' : 'DODAJ'}
              </button>
            </div>

            {showAddVariant && (
              <form className="fd-variant-form" onSubmit={handleAddVariant}>
                <input className="fd-edit-input" placeholder="Nazwa wariantu" value={newVariant.name} onChange={(e) => setNewVariant({ ...newVariant, name: e.target.value })} />
                <input className="fd-edit-input" placeholder="Opis (opcjonalnie)" value={newVariant.description} onChange={(e) => setNewVariant({ ...newVariant, description: e.target.value })} />
                <textarea className="fd-edit-textarea" placeholder="Sposob przygotowania" value={newVariant.preparation} onChange={(e) => setNewVariant({ ...newVariant, preparation: e.target.value })} rows={3} />
                <button type="submit" className="fd-btn fd-btn--primary">DODAJ WARIANT</button>
              </form>
            )}

            {variants.length === 0 && !showAddVariant && (
              <p className="fd-variants-empty">Brak wariantow</p>
            )}

            {variants.map((v) => (
              <div key={v.id} className="fd-variant">
                {editingVariant === v.id ? (
                  <div className="fd-variant-form">
                    <input className="fd-edit-input" value={editVariantData.name} onChange={(e) => setEditVariantData({ ...editVariantData, name: e.target.value })} />
                    <input className="fd-edit-input" value={editVariantData.description} onChange={(e) => setEditVariantData({ ...editVariantData, description: e.target.value })} placeholder="Opis" />
                    <textarea className="fd-edit-textarea" value={editVariantData.preparation} onChange={(e) => setEditVariantData({ ...editVariantData, preparation: e.target.value })} placeholder="Przygotowanie" rows={3} />
                    <div className="fd-edit-actions">
                      <button className="fd-btn fd-btn--primary" onClick={() => handleUpdateVariant(v.id)}>ZAPISZ</button>
                      <button className="fd-btn" onClick={() => setEditingVariant(null)}>ANULUJ</button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="fd-variant-header" onClick={() => setExpandedVariant(expandedVariant === v.id ? null : v.id)}>
                      <span className="fd-variant-name">{v.name}</span>
                      <div className="fd-variant-actions">
                        <button className="fd-btn fd-btn--small" onClick={(e) => {
                          e.stopPropagation();
                          setEditingVariant(v.id);
                          setEditVariantData({ name: v.name, description: v.description || '', preparation: v.preparation || '' });
                        }}>EDYTUJ</button>
                        <button className="fd-btn fd-btn--small fd-btn--danger" onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteVariant(v.id);
                        }}>USUN</button>
                      </div>
                    </div>
                    {expandedVariant === v.id && (
                      <div className="fd-variant-body">
                        {v.description && <p className="fd-variant-desc">{v.description}</p>}
                        {v.preparation && (
                          <div className="fd-variant-prep">
                            <span className="fd-variant-prep-label">PRZYGOTOWANIE</span>
                            <p>{v.preparation}</p>
                          </div>
                        )}
                      </div>
                    )}
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ──
export function FoodDatabasePage() {
  const [foods, setFoods] = useState<Food[]>([]);
  const [categories, setCategories] = useState<FoodCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterCategoryId, setFilterCategoryId] = useState<number | null>(null);
  const [selectedFood, setSelectedFood] = useState<Food | null>(null);
  const [showAddFood, setShowAddFood] = useState(false);
  const [newFood, setNewFood] = useState({ name: '', description: '', link: '', categoryId: null as number | null });
  const [showCatManager, setShowCatManager] = useState(false);
  const [newCatName, setNewCatName] = useState('');

  const fetchData = useCallback(async () => {
    try {
      const [foodsData, catsData] = await Promise.all([
        foodApi.getAll(filterCategoryId ?? undefined),
        foodCategoryApi.getAll(),
      ]);
      setFoods(foodsData as Food[]);
      setCategories(catsData as FoodCategory[]);
    } catch { /* silent */ } finally {
      setLoading(false);
    }
  }, [filterCategoryId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  async function handleAddFood(e: React.FormEvent) {
    e.preventDefault();
    if (!newFood.name.trim()) return;
    try {
      const food = await foodApi.create(newFood);
      setFoods((prev) => [food as Food, ...prev]);
      setNewFood({ name: '', description: '', link: '', categoryId: null });
      setShowAddFood(false);
    } catch { /* silent */ }
  }

  function handleFoodUpdate(updated: Food) {
    setFoods((prev) => prev.map((f) => (f.id === updated.id ? updated : f)));
    setSelectedFood(updated);
  }

  function handleFoodDelete(id: number) {
    setFoods((prev) => prev.filter((f) => f.id !== id));
    setSelectedFood(null);
  }

  async function handleOpenFood(id: number) {
    try {
      const food = await foodApi.getById(id);
      setSelectedFood(food as Food);
    } catch { /* silent */ }
  }

  async function handleAddCategory(e: React.FormEvent) {
    e.preventDefault();
    if (!newCatName.trim()) return;
    try {
      const cat = await foodCategoryApi.create({ name: newCatName.trim() });
      setCategories((prev) => [...prev, cat as FoodCategory]);
      setNewCatName('');
    } catch { /* silent */ }
  }

  async function handleDeleteCategory(id: number) {
    try {
      await foodCategoryApi.delete(id);
      setCategories((prev) => prev.filter((c) => c.id !== id));
      if (filterCategoryId === id) setFilterCategoryId(null);
    } catch { /* silent */ }
  }

  if (loading) {
    return <div className="app loading">Ladowanie...</div>;
  }

  return (
    <div className="app fd-app">
      <div className="page-header">
        <NavTabs />
        <UserMenu />
      </div>

      <div className="section fd-section">
        <div className="section-header">
          <h1 className="section-title">JEDZENIE</h1>
          <div className="page-actions">
            <button
              className={`btn-manage-cats ${showCatManager ? 'btn-manage-cats--active' : ''}`}
              onClick={() => setShowCatManager(!showCatManager)}
            >
              KATEGORIE
            </button>
            <button
              className={`fd-btn fd-btn--primary ${showAddFood ? 'btn-manage-cats--active' : ''}`}
              onClick={() => setShowAddFood(!showAddFood)}
            >
              {showAddFood ? 'ANULUJ' : 'DODAJ DANIE'}
            </button>
          </div>
        </div>

        <p className="section-count">{foods.length} przepisow</p>

        {/* Category manager */}
        {showCatManager && (
          <div className="cat-manager">
            <form className="cat-manager-form" onSubmit={handleAddCategory}>
              <input
                className="cat-manager-input"
                placeholder="Nowa kategoria..."
                value={newCatName}
                onChange={(e) => setNewCatName(e.target.value)}
              />
              <button type="submit" className="cat-manager-add">DODAJ</button>
            </form>
            <div className="cat-manager-list">
              {categories.map((cat) => (
                <div key={cat.id} className="cat-manager-item">
                  <span>{cat.name}</span>
                  <button className="cat-manager-delete" onClick={() => handleDeleteCategory(cat.id)}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Add food form */}
        {showAddFood && (
          <form className="fd-add-form" onSubmit={handleAddFood}>
            <input className="fd-edit-input" placeholder="Nazwa dania" value={newFood.name} onChange={(e) => setNewFood({ ...newFood, name: e.target.value })} />
            <input className="fd-edit-input" placeholder="Opis (opcjonalnie)" value={newFood.description} onChange={(e) => setNewFood({ ...newFood, description: e.target.value })} />
            <input className="fd-edit-input" placeholder="Link do przepisu (opcjonalnie)" value={newFood.link} onChange={(e) => setNewFood({ ...newFood, link: e.target.value })} />
            <select className="fd-edit-select" value={newFood.categoryId ?? ''} onChange={(e) => setNewFood({ ...newFood, categoryId: e.target.value ? Number(e.target.value) : null })}>
              <option value="">Bez kategorii</option>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <button type="submit" className="fd-btn fd-btn--primary">DODAJ</button>
          </form>
        )}

        {/* Category filter */}
        <div className="shopping-filters">
          <button
            className={`shopping-filter ${filterCategoryId === null ? 'shopping-filter--active' : ''}`}
            onClick={() => setFilterCategoryId(null)}
          >
            WSZYSTKO
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              className={`shopping-filter ${filterCategoryId === cat.id ? 'shopping-filter--active' : ''}`}
              onClick={() => setFilterCategoryId(filterCategoryId === cat.id ? null : cat.id)}
            >
              {cat.name.toUpperCase()}
            </button>
          ))}
        </div>

        {/* Food grid */}
        {foods.length === 0 ? (
          <div className="shopping-empty">
            <p className="shopping-empty-title">BAZA JEDZENIA JEST PUSTA</p>
            <p className="shopping-empty-sub">Dodaj swoje pierwsze danie powyzej</p>
          </div>
        ) : (
          <div className="fd-grid">
            {foods.map((food) => (
              <div key={food.id} className="fd-card" onClick={() => handleOpenFood(food.id)}>
                {food.imageUrl && (
                  <div className="fd-card-image">
                    <img src={food.imageUrl} alt={food.name} />
                  </div>
                )}
                <div className="fd-card-body">
                  <h3 className="fd-card-name">{food.name}</h3>
                  {food.categoryName && <span className="fd-card-cat">{food.categoryName}</span>}
                  {food.description && <p className="fd-card-desc">{food.description}</p>}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Detail modal */}
        {selectedFood && (
          <FoodDetail
            food={selectedFood}
            categories={categories}
            onClose={() => setSelectedFood(null)}
            onUpdate={handleFoodUpdate}
            onDelete={handleFoodDelete}
          />
        )}
      </div>
    </div>
  );
}
