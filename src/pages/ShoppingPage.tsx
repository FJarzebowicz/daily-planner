import { useState, useEffect, useRef, useCallback } from 'react';
import { shoppingApi, shoppingCategoryApi } from '../api';
import type { ShoppingItem, ShoppingCategory } from '../types';
import { NavTabs } from '../components/NavTabs';
import { UserMenu } from '../components/UserMenu';

function parseQuickAdd(input: string): { quantity: number; unit: string; name: string } {
  const match = input.match(/^(\d+)\s*x\s+(.+)$/i);
  if (match) {
    return { quantity: parseInt(match[1], 10), unit: 'szt', name: match[2].trim() };
  }
  const matchUnit = input.match(/^(\d+)\s*(kg|g|l|ml|szt)\s+(.+)$/i);
  if (matchUnit) {
    return { quantity: parseInt(matchUnit[1], 10), unit: matchUnit[2].toLowerCase(), name: matchUnit[3].trim() };
  }
  return { quantity: 1, unit: 'szt', name: input.trim() };
}

export function ShoppingPage() {
  const [items, setItems] = useState<ShoppingItem[]>([]);
  const [categories, setCategories] = useState<ShoppingCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [inputValue, setInputValue] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [filterCategory, setFilterCategory] = useState<string | null>(null);
  const [newCatName, setNewCatName] = useState('');
  const [showCatManager, setShowCatManager] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const fetchData = useCallback(async () => {
    try {
      const [itemsData, catsData] = await Promise.all([
        shoppingApi.getAll(),
        shoppingCategoryApi.getAll(),
      ]);
      setItems(itemsData as ShoppingItem[]);
      setCategories(catsData as ShoppingCategory[]);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  function getSelectedCategoryName(): string {
    if (selectedCategoryId) {
      const cat = categories.find((c) => c.id === selectedCategoryId);
      return cat ? cat.name : 'Inne';
    }
    return 'Inne';
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!inputValue.trim()) return;
    const parsed = parseQuickAdd(inputValue);
    try {
      const item = await shoppingApi.create({
        name: parsed.name,
        categoryName: getSelectedCategoryName(),
        categoryId: selectedCategoryId,
        quantity: parsed.quantity,
        unit: parsed.unit,
      });
      setItems((prev) => [item as ShoppingItem, ...prev]);
      setInputValue('');
      inputRef.current?.focus();
    } catch {
      // silent
    }
  }

  async function handleToggle(id: number) {
    try {
      const updated = await shoppingApi.toggle(id);
      setItems((prev) => prev.map((i) => (i.id === id ? (updated as ShoppingItem) : i)));
    } catch {
      // silent
    }
  }

  async function handleDelete(id: number) {
    try {
      await shoppingApi.delete(id);
      setItems((prev) => prev.filter((i) => i.id !== id));
    } catch {
      // silent
    }
  }

  async function handleClearBought() {
    try {
      await shoppingApi.deleteBought();
      setItems((prev) => prev.filter((i) => !i.bought));
    } catch {
      // silent
    }
  }

  async function handleAddCategory(e: React.FormEvent) {
    e.preventDefault();
    if (!newCatName.trim()) return;
    try {
      const cat = await shoppingCategoryApi.create({ name: newCatName.trim() });
      setCategories((prev) => [...prev, cat as ShoppingCategory]);
      setNewCatName('');
    } catch {
      // silent
    }
  }

  async function handleDeleteCategory(id: number) {
    try {
      await shoppingCategoryApi.delete(id);
      setCategories((prev) => prev.filter((c) => c.id !== id));
      if (selectedCategoryId === id) setSelectedCategoryId(null);
      if (filterCategory) {
        const deleted = categories.find((c) => c.id === id);
        if (deleted && filterCategory === deleted.name) setFilterCategory(null);
      }
    } catch {
      // silent
    }
  }

  const boughtCount = items.filter((i) => i.bought).length;
  const totalCount = items.length;

  // Group by category
  const filtered = filterCategory ? items.filter((i) => i.categoryName === filterCategory) : items;
  const unbought = filtered.filter((i) => !i.bought);
  const bought = filtered.filter((i) => i.bought);

  // Group unbought by category
  const grouped = new Map<string, ShoppingItem[]>();
  for (const item of unbought) {
    const cat = item.categoryName || 'Inne';
    if (!grouped.has(cat)) grouped.set(cat, []);
    grouped.get(cat)!.push(item);
  }

  if (loading) {
    return <div className="app loading">Ladowanie...</div>;
  }

  return (
    <div className="app shopping-app">
      <header className="header">
        <div className="header-top">
          <div className="header-left">
            <NavTabs />
          </div>
          <div className="header-right">
            <div className="stats-index">
              <strong>{boughtCount}/{totalCount}</strong> Kupione
            </div>
            <div className="header-controls">
              <button
                className={`btn-manage-cats ${showCatManager ? 'btn-manage-cats--active' : ''}`}
                onClick={() => setShowCatManager(!showCatManager)}
              >
                KATEGORIE
              </button>
              {boughtCount > 0 && (
                <button className="btn-clear-bought" onClick={handleClearBought}>
                  USUN KUPIONE
                </button>
              )}
              <UserMenu />
            </div>
          </div>
        </div>
      </header>

      <main className="main shopping-main">
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
              {categories.length === 0 && (
                <p className="cat-manager-empty">Brak kategorii — dodaj pierwsza powyzej</p>
              )}
            </div>
          </div>
        )}

        {/* Add form */}
        <form className="shopping-add" onSubmit={handleAdd}>
          <input
            ref={inputRef}
            className="shopping-input"
            placeholder="Dodaj produkt... (np. 2x mleko)"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
          />
          <select
            className="shopping-category-select"
            value={selectedCategoryId ?? ''}
            onChange={(e) => setSelectedCategoryId(e.target.value ? Number(e.target.value) : null)}
          >
            <option value="">Wybierz kategorie...</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>
          <button type="submit" className="shopping-add-btn">DODAJ</button>
        </form>

        {/* Category filter */}
        <div className="shopping-filters">
          <button
            className={`shopping-filter ${filterCategory === null ? 'shopping-filter--active' : ''}`}
            onClick={() => setFilterCategory(null)}
          >
            WSZYSTKO
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              className={`shopping-filter ${filterCategory === cat.name ? 'shopping-filter--active' : ''}`}
              onClick={() => setFilterCategory(filterCategory === cat.name ? null : cat.name)}
            >
              {cat.name.toUpperCase()}
            </button>
          ))}
        </div>

        {/* Items */}
        {totalCount === 0 ? (
          <div className="shopping-empty">
            <p className="shopping-empty-title">LISTA ZAKUPOW JEST PUSTA</p>
            <p className="shopping-empty-sub">Dodaj produkty powyzej</p>
          </div>
        ) : (
          <div className="shopping-list">
            {/* Unbought grouped by category */}
            {Array.from(grouped.entries()).map(([category, catItems]) => (
              <div key={category} className="shopping-group">
                <h3 className="shopping-group-title">{category.toUpperCase()}</h3>
                {catItems.map((item) => (
                  <div key={item.id} className="shopping-item">
                    <button
                      className="shopping-check"
                      onClick={() => handleToggle(item.id)}
                    />
                    <span className="shopping-item-name">
                      {item.quantity > 1 && <span className="shopping-qty">{item.quantity}{item.unit} </span>}
                      {item.name}
                    </span>
                    <button className="shopping-delete" onClick={() => handleDelete(item.id)}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                    </button>
                  </div>
                ))}
              </div>
            ))}

            {/* Bought items */}
            {bought.length > 0 && (
              <div className="shopping-group shopping-group--bought">
                <h3 className="shopping-group-title">KUPIONE</h3>
                {bought.map((item) => (
                  <div key={item.id} className="shopping-item shopping-item--bought">
                    <button
                      className="shopping-check shopping-check--done"
                      onClick={() => handleToggle(item.id)}
                    >
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                    </button>
                    <span className="shopping-item-name">
                      {item.quantity > 1 && <span className="shopping-qty">{item.quantity}{item.unit} </span>}
                      {item.name}
                    </span>
                    <button className="shopping-delete" onClick={() => handleDelete(item.id)}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
