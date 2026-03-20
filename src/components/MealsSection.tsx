import { motion } from 'framer-motion';
import type { MealSlot } from '../types';
import { MEAL_SLOT_LABELS } from '../types';

interface MealsSectionProps {
  meals: MealSlot[];
  closed: boolean;
  onUpdateMeal: (id: number, updates: { description: string; eaten: boolean }) => void;
}

const MEAL_ICONS: Record<string, string> = {
  BREAKFAST: '🌅',
  SECOND_BREAKFAST: '🥪',
  LUNCH: '🍽️',
  SNACK: '☕',
  DINNER: '🌙',
};

export function MealsSection({ meals, closed, onUpdateMeal }: MealsSectionProps) {
  return (
    <section className="section">
      <div className="section-header">
        <h2 className="section-title">Jedzenie</h2>
      </div>
      <div className="meals-grid">
        {meals.map((meal, i) => {
          const statusClass = meal.eaten ? 'meal--eaten' : closed ? 'meal--missed' : '';
          return (
            <motion.div
              key={meal.id}
              className={`meal-card ${statusClass}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: i * 0.05 }}
            >
              <div className="meal-top">
                <span className="meal-icon">{MEAL_ICONS[meal.slot] || '🍽️'}</span>
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
