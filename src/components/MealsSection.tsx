import { motion } from 'framer-motion';
import type { MealSlot } from '../types';
import { MEAL_SLOT_LABELS } from '../types';

interface MealsSectionProps {
  meals: MealSlot[];
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

export function MealsSection({ meals, closed, onUpdateMeal }: MealsSectionProps) {
  return (
    <section className="section">
      <div className="section-header">
        <h2 className="section-title">Jedzenie</h2>
      </div>
      <div className="meals-grid">
        {[...meals].sort((a, b) => (MEAL_ORDER[a.slot] ?? 99) - (MEAL_ORDER[b.slot] ?? 99)).map((meal, i) => {
          const statusClass = meal.eaten ? 'meal--eaten' : closed ? 'meal--missed' : '';
          return (
            <motion.div
              key={meal.id}
              className={`meal-card ${statusClass}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.2, delay: i * 0.03 }}
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
                value={meal.description}
                onChange={(e) => onUpdateMeal(meal.id, { description: e.target.value, eaten: meal.eaten })}
                disabled={closed}
              />
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}
