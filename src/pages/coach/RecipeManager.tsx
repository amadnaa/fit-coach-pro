import { motion } from 'framer-motion';
import { Plus, UtensilsCrossed } from 'lucide-react';
import { MobileLayout } from '@/components/layout/MobileLayout';

const mockRecipes = [
  { id: '1', title: 'Grilled Chicken Bowl', calories: 520, protein: 42, tags: ['high protein'] },
  { id: '2', title: 'Salmon & Quinoa', calories: 480, protein: 38, tags: ['balanced'] },
  { id: '3', title: 'Greek Yogurt Parfait', calories: 320, protein: 28, tags: ['high protein'] },
];

export default function RecipeManager() {
  return (
    <MobileLayout>
      <div className="px-5 pt-6 space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-display font-bold">Recipes</h1>
          <button className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center text-primary-foreground">
            <Plus className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-3">
          {mockRecipes.map((recipe, i) => (
            <motion.div
              key={recipe.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="p-4 rounded-2xl bg-card border border-border space-y-2"
            >
              <div className="flex items-start justify-between">
                <h3 className="font-semibold text-sm">{recipe.title}</h3>
                <UtensilsCrossed className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="flex gap-3 text-xs text-muted-foreground">
                <span>{recipe.calories} cal</span>
                <span>{recipe.protein}g protein</span>
              </div>
              <div className="flex gap-1">
                {recipe.tags.map(tag => (
                  <span key={tag} className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">{tag}</span>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </MobileLayout>
  );
}
