import { useState, useEffect, useRef, memo, useCallback } from 'react';
import type { MealSlot, Food, FoodVariant } from '../types';
import { MEAL_SLOT_LABELS } from '../types';
import { foodApi } from '../api';

interface MealsSectionProps {
  meals: MealSlot[];
  closed: boolean;
  onUpdateMeal: (id: number, updates: { description: string; eaten: boolean }) => void;
}

interface MealCardProps {
  meal: MealSlot;
  closed: boolean;
  onUpdateMeal: (id: number, updates: { description: string; eaten: boolean }) => void;
}

const MEAL_ORDER: Record<string, number> = {
  BREAKFAST: 0,
  SECOND_BREAKFAST: 1,
  LUNCH: 2,
  SNACK: 3,
  DINNER: 4,
};

const MealCard = memo(function MealCard({ meal, closed, onUpdateMeal }: MealCardProps) {
  const [localDesc, setLocalDesc] = useState(meal.description);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latestDesc = useRef(localDesc);
  const [suggestions, setSuggestions] = useState<Food[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedFood, setSelectedFood] = useState<Food | null>(null);
  const [variants, setVariants] = useState<FoodVariant[]>([]);
  const [showVariants, setShowVariants] = useState(false);
  const searchRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  // Sync from parent when meal changes externally (e.g. day navigation)
  useEffect(() => {
    setLocalDesc(meal.description);
  }, [meal.description]);

  // Keep ref in sync for blur handler
  useEffect(() => {
    latestDesc.current = localDesc;
  });

  const flushToApi = useCallback((desc: string) => {
    onUpdateMeal(meal.id, { description: desc, eaten: meal.eaten });
  }, [meal.id, meal.eaten, onUpdateMeal]);

  function handleChange(value: string) {
    setLocalDesc(value);
    setSelectedFood(null);
    setShowVariants(false);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      flushToApi(value);
    }, 400);

    // Search food database
    if (searchRef.current) clearTimeout(searchRef.current);
    if (value.trim().length >= 2) {
      searchRef.current = setTimeout(async () => {
        try {
          const results = await foodApi.search(value.trim());
          setSuggestions(results as Food[]);
          setShowSuggestions(results.length > 0);
        } catch {
          setSuggestions([]);
        }
      }, 300);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  }

  function handleSelectFood(food: Food) {
    setLocalDesc(food.name);
    setSelectedFood(food);
    setShowSuggestions(false);
    setSuggestions([]);

    if (debounceRef.current) clearTimeout(debounceRef.current);
    flushToApi(food.name);

    // Load variants if any
    if (food.variants && food.variants.length > 0) {
      setVariants(food.variants);
      setShowVariants(true);
    } else {
      // Fetch variants
      foodApi.getById(food.id).then((full) => {
        const f = full as Food;
        if (f.variants && f.variants.length > 0) {
          setVariants(f.variants);
          setShowVariants(true);
        }
      }).catch(() => {});
    }
  }

  function handleSelectVariant(variant: FoodVariant) {
    const desc = `${selectedFood?.name || ''} — ${variant.name}`;
    setLocalDesc(desc);
    setShowVariants(false);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    flushToApi(desc);
  }

  function handleBlur() {
    // Delay to allow click on suggestion
    setTimeout(() => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
        debounceRef.current = null;
      }
      if (latestDesc.current !== meal.description) {
        flushToApi(latestDesc.current);
      }
      setShowSuggestions(false);
    }, 200);
  }

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      if (searchRef.current) clearTimeout(searchRef.current);
    };
  }, []);

  const statusClass = meal.eaten ? 'meal--eaten' : closed ? 'meal--missed' : '';

  return (
    <div className={`meal-card ${statusClass}`} ref={wrapRef}>
      <div className="meal-top">
        <span className="meal-type">{MEAL_SLOT_LABELS[meal.slot] || meal.slot}</span>
        <div className="meal-top-right">
          {selectedFood && (
            <a className="meal-food-link" href={`/food`} title="Zobacz w bazie jedzenia">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
            </a>
          )}
          <button
            className={`toggle ${meal.eaten ? 'toggle--on' : ''}`}
            onClick={() => onUpdateMeal(meal.id, { description: meal.description, eaten: !meal.eaten })}
            disabled={closed}
          >
            {meal.eaten && (
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
            )}
          </button>
        </div>
      </div>
      <div className="meal-input-wrap">
        <input
          className="meal-input"
          placeholder="Co jesz?"
          value={localDesc}
          onChange={(e) => handleChange(e.target.value)}
          onBlur={handleBlur}
          onFocus={() => { if (suggestions.length > 0) setShowSuggestions(true); }}
          disabled={closed}
        />
        {showSuggestions && (
          <div className="meal-suggestions">
            {suggestions.map((food) => (
              <button
                key={food.id}
                className="meal-suggestion"
                onMouseDown={() => handleSelectFood(food)}
              >
                <span className="meal-suggestion-name">{food.name}</span>
                {food.categoryName && <span className="meal-suggestion-cat">{food.categoryName}</span>}
              </button>
            ))}
          </div>
        )}
        {showVariants && variants.length > 0 && (
          <div className="meal-variants">
            <span className="meal-variants-label">Wariant:</span>
            {variants.map((v) => (
              <button key={v.id} className="meal-variant-btn" onMouseDown={() => handleSelectVariant(v)}>
                {v.name}
              </button>
            ))}
            <button className="meal-variant-btn" onMouseDown={() => setShowVariants(false)}>
              Bez wariantu
            </button>
          </div>
        )}
      </div>
    </div>
  );
});

export function MealsSection({ meals, closed, onUpdateMeal }: MealsSectionProps) {
  return (
    <section className="section">
      <div className="section-header">
        <h2 className="section-title">Jedzenie</h2>
      </div>
      <div className="meals-grid">
        {[...meals].sort((a, b) => (MEAL_ORDER[a.slot] ?? 99) - (MEAL_ORDER[b.slot] ?? 99)).map((meal) => (
          <MealCard
            key={meal.id}
            meal={meal}
            closed={closed}
            onUpdateMeal={onUpdateMeal}
          />
        ))}
      </div>
    </section>
  );
}
