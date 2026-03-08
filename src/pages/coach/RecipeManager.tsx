import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, UtensilsCrossed, Trash2, ChevronLeft } from 'lucide-react';
import { MobileLayout } from '@/components/layout/MobileLayout';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface Recipe {
  id: string;
  title: string;
  photo_url: string | null;
  ingredients: string[] | null;
  instructions: string | null;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  diet_type: string[] | null;
  created_by: string | null;
}

export default function RecipeManager() {
  const { user } = useAuth();
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [addOpen, setAddOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [form, setForm] = useState({
    title: '',
    ingredients: '',
    instructions: '',
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0,
    diet_type: '',
    photo_url: '',
  });

  useEffect(() => {
    fetchRecipes();
  }, [user]);

  const fetchRecipes = async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await supabase.from('recipes').select('*')
      .eq('created_by', user.id)
      .order('created_at', { ascending: false });
    setRecipes((data || []) as Recipe[]);
    setLoading(false);
  };

  const resetForm = () => {
    setForm({ title: '', ingredients: '', instructions: '', calories: 0, protein: 0, carbs: 0, fat: 0, diet_type: '', photo_url: '' });
  };

  const handleSave = async () => {
    if (!user || !form.title) return;
    setSaving(true);

    const ingredients = form.ingredients.split('\n').map(s => s.trim()).filter(Boolean);
    const diet_type = form.diet_type.split(',').map(s => s.trim()).filter(Boolean);

    const { error } = await supabase.from('recipes').insert({
      title: form.title,
      ingredients,
      instructions: form.instructions,
      calories: form.calories,
      protein: form.protein,
      carbs: form.carbs,
      fat: form.fat,
      diet_type,
      photo_url: form.photo_url || null,
      created_by: user.id,
    });

    if (error) {
      toast.error('Failed to save recipe');
    } else {
      toast.success('Recipe added!');
      setAddOpen(false);
      resetForm();
      fetchRecipes();
    }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from('recipes').delete().eq('id', id);
    if (error) {
      toast.error('Failed to delete');
    } else {
      toast.success('Recipe deleted');
      setRecipes(prev => prev.filter(r => r.id !== id));
      if (selectedRecipe?.id === id) setSelectedRecipe(null);
    }
  };

  // Detail view
  if (selectedRecipe) {
    return (
      <MobileLayout>
        <div className="px-5 pt-6 space-y-5 pb-8">
          <button onClick={() => setSelectedRecipe(null)} className="flex items-center gap-1 text-muted-foreground text-sm">
            <ChevronLeft className="h-4 w-4" /> Back
          </button>
          <h1 className="text-2xl font-display font-bold">{selectedRecipe.title}</h1>
          <div className="grid grid-cols-4 gap-2 text-center">
            {[
              { label: 'Cal', value: selectedRecipe.calories },
              { label: 'Protein', value: `${selectedRecipe.protein}g` },
              { label: 'Carbs', value: `${selectedRecipe.carbs}g` },
              { label: 'Fat', value: `${selectedRecipe.fat}g` },
            ].map(m => (
              <div key={m.label} className="p-3 rounded-xl bg-card border border-border">
                <p className="text-lg font-bold">{m.value}</p>
                <p className="text-[9px] text-muted-foreground">{m.label}</p>
              </div>
            ))}
          </div>
          {selectedRecipe.ingredients && selectedRecipe.ingredients.length > 0 && (
            <div className="space-y-2">
              <h2 className="text-sm font-semibold">Ingredients</h2>
              <ul className="space-y-1">
                {selectedRecipe.ingredients.map((ing, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 flex-shrink-0" />
                    {ing}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {selectedRecipe.instructions && (
            <div className="space-y-2">
              <h2 className="text-sm font-semibold">Instructions</h2>
              <p className="text-sm text-muted-foreground whitespace-pre-line">{selectedRecipe.instructions}</p>
            </div>
          )}
          <Button variant="destructive" onClick={() => handleDelete(selectedRecipe.id)} className="w-full rounded-2xl">
            <Trash2 className="h-4 w-4 mr-2" /> Delete Recipe
          </Button>
        </div>
      </MobileLayout>
    );
  }

  return (
    <MobileLayout>
      <div className="px-5 pt-6 space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-display font-bold">Recipes</h1>
          <button onClick={() => { resetForm(); setAddOpen(true); }} className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center text-primary-foreground">
            <Plus className="h-5 w-5" />
          </button>
        </div>

        {loading ? (
          <div className="py-12 text-center text-sm text-muted-foreground">Loading...</div>
        ) : recipes.length === 0 ? (
          <div className="py-12 text-center space-y-2">
            <UtensilsCrossed className="h-10 w-10 text-muted-foreground mx-auto" />
            <p className="text-sm text-muted-foreground">No recipes yet. Tap + to add one.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {recipes.map((recipe, i) => (
              <motion.div
                key={recipe.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                onClick={() => setSelectedRecipe(recipe)}
                className="p-4 rounded-2xl bg-card border border-border space-y-2 cursor-pointer hover:border-primary/30 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <h3 className="font-semibold text-sm">{recipe.title}</h3>
                  <button onClick={e => { e.stopPropagation(); handleDelete(recipe.id); }} className="text-muted-foreground hover:text-destructive">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
                <div className="flex gap-3 text-xs text-muted-foreground">
                  <span>{recipe.calories} cal</span>
                  <span>{recipe.protein}g protein</span>
                  <span>{recipe.carbs}g carbs</span>
                  <span>{recipe.fat}g fat</span>
                </div>
                {recipe.diet_type && recipe.diet_type.length > 0 && (
                  <div className="flex gap-1">
                    {recipe.diet_type.map(tag => (
                      <span key={tag} className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">{tag}</span>
                    ))}
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Add Recipe Dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="max-w-sm mx-auto max-h-[85vh] overflow-y-auto pb-10">
          <DialogHeader>
            <DialogTitle>Add Recipe</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Input placeholder="Recipe title" value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} className="rounded-xl" />
            <Input placeholder="Photo URL (optional)" value={form.photo_url} onChange={e => setForm(p => ({ ...p, photo_url: e.target.value }))} className="rounded-xl" />
            <Textarea placeholder="Ingredients (one per line)" value={form.ingredients} onChange={e => setForm(p => ({ ...p, ingredients: e.target.value }))} className="rounded-xl min-h-[80px]" />
            <Textarea placeholder="Instructions" value={form.instructions} onChange={e => setForm(p => ({ ...p, instructions: e.target.value }))} className="rounded-xl min-h-[80px]" />
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] text-muted-foreground">Calories</label>
                <Input type="number" value={form.calories || ''} onChange={e => setForm(p => ({ ...p, calories: Number(e.target.value) }))} className="rounded-xl" />
              </div>
              <div>
                <label className="text-[10px] text-muted-foreground">Protein (g)</label>
                <Input type="number" value={form.protein || ''} onChange={e => setForm(p => ({ ...p, protein: Number(e.target.value) }))} className="rounded-xl" />
              </div>
              <div>
                <label className="text-[10px] text-muted-foreground">Carbs (g)</label>
                <Input type="number" value={form.carbs || ''} onChange={e => setForm(p => ({ ...p, carbs: Number(e.target.value) }))} className="rounded-xl" />
              </div>
              <div>
                <label className="text-[10px] text-muted-foreground">Fat (g)</label>
                <Input type="number" value={form.fat || ''} onChange={e => setForm(p => ({ ...p, fat: Number(e.target.value) }))} className="rounded-xl" />
              </div>
            </div>
            <Input placeholder="Diet types (comma separated, e.g. high protein, keto)" value={form.diet_type} onChange={e => setForm(p => ({ ...p, diet_type: e.target.value }))} className="rounded-xl" />
            <Button onClick={handleSave} disabled={saving || !form.title} className="w-full h-12 rounded-2xl gradient-primary text-primary-foreground font-semibold">
              {saving ? 'Saving...' : 'Add Recipe'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </MobileLayout>
  );
}