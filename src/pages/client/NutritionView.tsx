import { useState } from 'react';
import { motion } from 'framer-motion';
import { UtensilsCrossed, Plus, Flame, Beef, Wheat, Droplets } from 'lucide-react';
import { MobileLayout } from '@/components/layout/MobileLayout';
import { cn } from '@/lib/utils';

const mockRecipes = [
  { id: '1', title: 'Grilled Chicken Bowl', calories: 520, protein: 42, carbs: 45, fat: 18, tag: 'high protein' },
  { id: '2', title: 'Salmon & Quinoa', calories: 480, protein: 38, carbs: 35, fat: 22, tag: 'balanced' },
  { id: '3', title: 'Greek Yogurt Parfait', calories: 320, protein: 28, carbs: 38, fat: 8, tag: 'high protein' },
  { id: '4', title: 'Veggie Stir Fry', calories: 380, protein: 18, carbs: 42, fat: 14, tag: 'vegetarian' },
];

const filters = ['All', 'High Protein', 'Low Carb', 'Balanced', 'Vegetarian'];

const dailyMacros = { calories: { current: 1650, target: 2200 }, protein: { current: 120, target: 160 }, carbs: { current: 180, target: 250 }, fat: { current: 55, target: 70 } };

export default function NutritionView() {
  const [activeFilter, setActiveFilter] = useState('All');
  const [tab, setTab] = useState<'recipes' | 'tracker'>('recipes');

  return (
    <MobileLayout>
      <div className="px-5 pt-6 space-y-5">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-2xl font-display font-bold">Nutrition</h1>
        </motion.div>

        {/* Tab Toggle */}
        <div className="flex gap-1 p-1 rounded-xl bg-secondary">
          {(['recipes', 'tracker'] as const).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={cn(
                "flex-1 py-2 rounded-lg text-sm font-medium transition-all capitalize",
                tab === t ? "bg-card shadow-sm text-foreground" : "text-muted-foreground"
              )}
            >{t}</button>
          ))}
        </div>

        {tab === 'tracker' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
            {/* Daily Macros */}
            <div className="grid grid-cols-4 gap-2">
              {[
                { label: 'Calories', icon: Flame, current: dailyMacros.calories.current, target: dailyMacros.calories.target, unit: '', color: 'text-warning' },
                { label: 'Protein', icon: Beef, current: dailyMacros.protein.current, target: dailyMacros.protein.target, unit: 'g', color: 'text-destructive' },
                { label: 'Carbs', icon: Wheat, current: dailyMacros.carbs.current, target: dailyMacros.carbs.target, unit: 'g', color: 'text-primary' },
                { label: 'Fat', icon: Droplets, current: dailyMacros.fat.current, target: dailyMacros.fat.target, unit: 'g', color: 'text-info' },
              ].map(m => {
                const pct = Math.min(100, (m.current / m.target) * 100);
                return (
                  <div key={m.label} className="p-3 rounded-xl bg-card border border-border text-center space-y-2">
                    <m.icon className={cn("h-4 w-4 mx-auto", m.color)} />
                    <p className="text-lg font-display font-bold">{m.current}</p>
                    <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
                      <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${pct}%` }} />
                    </div>
                    <p className="text-[9px] text-muted-foreground">/{m.target}{m.unit}</p>
                  </div>
                );
              })}
            </div>

            <button className="w-full py-3 rounded-xl border-2 border-dashed border-border text-muted-foreground text-sm flex items-center justify-center gap-2 hover:border-primary/50 transition-colors">
              <Plus className="h-4 w-4" /> Log Meal
            </button>
          </motion.div>
        )}

        {tab === 'recipes' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
            {/* Filters */}
            <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
              {filters.map(f => (
                <button
                  key={f}
                  onClick={() => setActiveFilter(f)}
                  className={cn(
                    "px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors",
                    activeFilter === f ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"
                  )}
                >{f}</button>
              ))}
            </div>

            {/* Recipe Cards */}
            {mockRecipes.map((recipe, i) => (
              <motion.div
                key={recipe.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="p-4 rounded-2xl bg-card border border-border space-y-3"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-sm">{recipe.title}</h3>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">{recipe.tag}</span>
                  </div>
                  <UtensilsCrossed className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="flex gap-4 text-xs text-muted-foreground">
                  <span>{recipe.calories} cal</span>
                  <span>{recipe.protein}g protein</span>
                  <span>{recipe.carbs}g carbs</span>
                  <span>{recipe.fat}g fat</span>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
    </MobileLayout>
  );
}
