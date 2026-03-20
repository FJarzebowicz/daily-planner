import { useState, useEffect, useRef, memo, useCallback } from 'react';
import { motion } from 'framer-motion';
import type { MealSlot } from '../types';
import { MEAL_SLOT_LABELS } from '../types';

interface MealsSectionProps {
  meals: MealSlot[];
  closed: boolean;
  onUpdateMeal: (id: number, updates: { description: string; eaten: boolean }) => void;
}

interface MealCardProps {
  meal: MealSlot;
  closed: boolean;
  index: number;
  onUpdateMeal: (id: number, updates: { description: string; eaten: boolean }) => void;
}

const MEAL_ORDER: Record<string, number> = {
  BREAKFAST: 0,
  SECOND_BREAKFAST: 1,
  LUNCH: 2,
  SNACK: 3,
  DINNER: 4,
};

const MealCard = memo(function MealCard({ meal, closed, index, onUpdateMeal }: MealCardProps) {
  const [localDesc, setLocalDesc] = useState(meal.description);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latestDesc = useRef(localDesc);

  // Sync from parent when meal changes externally (e.g. day navigation)
  useEffect(() => {
    setLocalDesc(meal.description);
  }, [meal.description]);

  // Keep ref in sync for blur handler
  latestDesc.current = localDesc;

  const flushToApi = useCallback((desc: string) => {
    onUpdateMeal(meal.id, { description: desc, eaten: meal.eaten });
  }, [meal.id, meal.eaten, onUpdateMeal]);

  function handleChange(value: string) {
    setLocalDesc(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      flushToApi(value);
    }, 400);
  }

  function handleBlur() {
    // Flush immediately on blur
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
      debounceRef.current = null;
    }
    if (latestDesc.current !== meal.description) {
      flushToApi(latestDesc.current);
    }
  }

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  const statusClass = meal.eaten ? 'meal--eaten' : closed ? 'meal--missed' : '';

  return (
    <motion.div
      className={`meal-card ${statusClass}`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2, delay: index * 0.03 }}
    >
      <div className="meal-top">
        <span className="meal-type">{MEAL_SLOT_LABELS[meal.slot] || meal.slot}</span>
        <motion.button
          className={`toggle ${meal.eaten ? 'toggle--on' : ''}`}
          onClick={() => onUpdateMeal(meal.id, { description: meal.description, eaten: !meal.eaten })}
          disabled={closed}
          whileTap={{ scale: 0.9 }}
        >
          <motion.div
            className="toggle-knob"
            layout
            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
          />
        </motion.button>
      </div>
      <input
        className="meal-input"
        placeholder="Co jesz?"
        value={localDesc}
        onChange={(e) => handleChange(e.target.value)}
        onBlur={handleBlur}
        disabled={closed}
      />
    </motion.div>
  );
});

export function MealsSection({ meals, closed, onUpdateMeal }: MealsSectionProps) {
  return (
    <section className="section">
      <div className="section-header">
        <h2 className="section-title">Jedzenie</h2>
      </div>
      <div className="meals-grid">
        {[...meals].sort((a, b) => (MEAL_ORDER[a.slot] ?? 99) - (MEAL_ORDER[b.slot] ?? 99)).map((meal, i) => (
          <MealCard
            key={meal.id}
            meal={meal}
            closed={closed}
            index={i}
            onUpdateMeal={onUpdateMeal}
          />
        ))}
      </div>
    </section>
  );
}
