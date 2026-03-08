import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UtensilsCrossed, Plus, Flame, Beef, Wheat, Droplets, ChevronLeft, Search, Minus, Clock } from 'lucide-react';
import { MobileLayout } from '@/components/layout/MobileLayout';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

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

interface FoodLogEntry {
  id: string;
  food_name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  logged_at: string;
}

export default function NutritionView() {
  const { user } = useAuth();
  const [activeFilter, setActiveFilter] = useState('All');
  const [tab, setTab] = useState<'recipes' | 'tracker'>('recipes');
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [logDialogOpen, setLogDialogOpen] = useState(false);
  const [logSearch, setLogSearch] = useState('');
  const [servings, setServings] = useState(1);
  const [selectedLogRecipe, setSelectedLogRecipe] = useState<Recipe | null>(null);
  const [customMeal, setCustomMeal] = useState({ name: '', calories: 0, protein: 0, carbs: 0, fat: 0 });
  const [logMode, setLogMode] = useState<'recipe' | 'custom'>('recipe');
  const [todayLogs, setTodayLogs] = useState<FoodLogEntry[]>([]);
  const [savingLog, setSavingLog] = useState(false);

  useEffect(() => {
    if (!user) return;
    fetchRecipes();
    fetchTodayLogs();
  }, [user]);

  const fetchRecipes = async () => {
    if (!user) return;
    setLoading(true);

    // Fetch only recipes created by the user's assigned coach
    const { data: coachLink } = await supabase
      .from('coach_clients')
      .select('coach_id')
      .eq('client_id', user.id)
      .maybeSingle();

    if (coachLink) {
      const { data } = await supabase
        .from('recipes')
        .select('*')
        .eq('created_by', coachLink.coach_id)
        .order('created_at', { ascending: false });
      setRecipes((data || []) as Recipe[]);
    } else {
      setRecipes([]);
    }
    setLoading(false);
  };

  const fetchTodayLogs = async () => {
    if (!user) return;
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const { data } = await supabase
      .from('food_logs')
      .select('*')
      .eq('user_id', user.id)
      .gte('logged_at', todayStart.toISOString())
      .order('logged_at', { ascending: false });

    setTodayLogs((data || []) as FoodLogEntry[]);
  };

  const dailyTotals = todayLogs.reduce(
    (acc, log) => ({
      calories: acc.calories + log.calories,
      protein: acc.protein + log.protein,
      carbs: acc.carbs + log.carbs,
      fat: acc.fat + log.fat,
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );

  const targets = { calories: 2200, protein: 160, carbs: 250, fat: 70 };

  const filteredRecipes = activeFilter === 'All'
    ? recipes
    : recipes.filter(r => r.diet_type?.some(d => d.toLowerCase() === activeFilter.toLowerCase()));

  const filters = ['All', ...Array.from(new Set(recipes.flatMap(r => r.diet_type || [])))];

  const handleLogMeal = async () => {
    if (!user) return;
    setSavingLog(true);

    let entry: { food_name: string; calories: number; protein: number; carbs: number; fat: number };

    if (logMode === 'recipe' && selectedLogRecipe) {
      entry = {
        food_name: `${selectedLogRecipe.title} (x${servings})`,
        calories: Math.round(selectedLogRecipe.calories * servings),
        protein: Math.round(selectedLogRecipe.protein * servings),
        carbs: Math.round(selectedLogRecipe.carbs * servings),
        fat: Math.round(selectedLogRecipe.fat * servings),
      };
    } else if (logMode === 'custom' && customMeal.name) {
      entry = { food_name: customMeal.name, calories: customMeal.calories, protein: customMeal.protein, carbs: customMeal.carbs, fat: customMeal.fat };
    } else {
      toast.error('Please select a recipe or enter custom meal details');
      setSavingLog(false);
      return;
    }

    const { error } = await supabase.from('food_logs').insert({
      user_id: user.id,
      ...entry,
    });

    if (error) {
      toast.error('Failed to log meal');
    } else {
      toast.success('Meal logged!');
      setLogDialogOpen(false);
      setSelectedLogRecipe(null);
      setServings(1);
      setCustomMeal({ name: '', calories: 0, protein: 0, carbs: 0, fat: 0 });
      fetchTodayLogs();
    }
    setSavingLog(false);
  };

  // Recipe detail view
  if (selectedRecipe) {
    return (
      <MobileLayout hideNav>
        <div className="px-5 pt-6 space-y-5 pb-8">
          <button onClick={() => setSelectedRecipe(null)} className="flex items-center gap-1 text-muted-foreground text-sm">
            <ChevronLeft className="h-4 w-4" /> Back
          </button>

          {selectedRecipe.photo_url && (
            <div className="w-full h-48 rounded-2xl overflow-hidden bg-secondary">
              <img src={selectedRecipe.photo_url} alt={selectedRecipe.title} className="w-full h-full object-cover" />
            </div>
          )}

          <div>
            <h1 className="text-2xl font-display font-bold">{selectedRecipe.title}</h1>
            {selectedRecipe.diet_type && selectedRecipe.diet_type.length > 0 && (
              <div className="flex gap-1.5 mt-2">
                {selectedRecipe.diet_type.map(t => (
                  <span key={t} className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">{t}</span>
                ))}
              </div>
            )}
          </div>

          {/* Macros */}
          <div className="grid grid-cols-4 gap-2">
            {[
              { label: 'Calories', value: selectedRecipe.calories, unit: '', icon: Flame, color: 'text-warning' },
              { label: 'Protein', value: selectedRecipe.protein, unit: 'g', icon: Beef, color: 'text-destructive' },
              { label: 'Carbs', value: selectedRecipe.carbs, unit: 'g', icon: Wheat, color: 'text-primary' },
              { label: 'Fat', value: selectedRecipe.fat, unit: 'g', icon: Droplets, color: 'text-info' },
            ].map(m => (
              <div key={m.label} className="p-3 rounded-xl bg-card border border-border text-center">
                <m.icon className={cn("h-4 w-4 mx-auto mb-1", m.color)} />
                <p className="text-lg font-display font-bold">{m.value}{m.unit}</p>
                <p className="text-[9px] text-muted-foreground">{m.label}</p>
              </div>
            ))}
          </div>

          {/* Ingredients */}
          {selectedRecipe.ingredients && selectedRecipe.ingredients.length > 0 && (
            <div className="space-y-2">
              <h2 className="text-sm font-semibold">Ingredients</h2>
              <ul className="space-y-1.5">
                {selectedRecipe.ingredients.map((ing, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 flex-shrink-0" />
                    {ing}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Instructions */}
          {selectedRecipe.instructions && (
            <div className="space-y-2">
              <h2 className="text-sm font-semibold">Instructions</h2>
              <p className="text-sm text-muted-foreground whitespace-pre-line leading-relaxed">{selectedRecipe.instructions}</p>
            </div>
          )}

          <Button
            onClick={() => {
              setSelectedLogRecipe(selectedRecipe);
              setLogMode('recipe');
              setLogDialogOpen(true);
            }}
            className="w-full h-12 rounded-2xl gradient-primary text-primary-foreground font-semibold"
          >
            <Plus className="h-4 w-4 mr-2" /> Log This Meal
          </Button>
        </div>
      </MobileLayout>
    );
  }

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
                { label: 'Calories', icon: Flame, current: dailyTotals.calories, target: targets.calories, unit: '', color: 'text-warning' },
                { label: 'Protein', icon: Beef, current: dailyTotals.protein, target: targets.protein, unit: 'g', color: 'text-destructive' },
                { label: 'Carbs', icon: Wheat, current: dailyTotals.carbs, target: targets.carbs, unit: 'g', color: 'text-primary' },
                { label: 'Fat', icon: Droplets, current: dailyTotals.fat, target: targets.fat, unit: 'g', color: 'text-info' },
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

            <button
              onClick={() => { setLogMode('recipe'); setLogDialogOpen(true); }}
              className="w-full py-3 rounded-xl border-2 border-dashed border-border text-muted-foreground text-sm flex items-center justify-center gap-2 hover:border-primary/50 transition-colors"
            >
              <Plus className="h-4 w-4" /> Log Meal
            </button>

            {/* Today's Logged Meals */}
            {todayLogs.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-sm font-semibold">Today's Meals</h3>
                {todayLogs.map(log => (
                  <div key={log.id} className="flex items-center gap-3 p-3 rounded-xl bg-card border border-border">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                      <UtensilsCrossed className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{log.food_name}</p>
                      <p className="text-[10px] text-muted-foreground">
                        {log.calories} cal · {log.protein}g P · {log.carbs}g C · {log.fat}g F
                      </p>
                    </div>
                    <p className="text-[10px] text-muted-foreground">
                      {format(new Date(log.logged_at), 'HH:mm')}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {tab === 'recipes' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
            {loading ? (
              <div className="py-12 text-center text-sm text-muted-foreground">Loading recipes...</div>
            ) : recipes.length === 0 ? (
              <div className="py-12 text-center space-y-2">
                <UtensilsCrossed className="h-10 w-10 text-muted-foreground mx-auto" />
                <p className="text-sm font-medium">No recipes yet</p>
                <p className="text-xs text-muted-foreground">Your trainer hasn't added any recipes yet.</p>
              </div>
            ) : (
              <>
                {/* Filters */}
                {filters.length > 1 && (
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
                )}

                {/* Recipe Cards */}
                {filteredRecipes.map((recipe, i) => (
                  <motion.div
                    key={recipe.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    onClick={() => setSelectedRecipe(recipe)}
                    className="p-4 rounded-2xl bg-card border border-border space-y-3 cursor-pointer hover:border-primary/30 transition-colors active:scale-[0.98]"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold text-sm">{recipe.title}</h3>
                        {recipe.diet_type && recipe.diet_type.length > 0 && (
                          <div className="flex gap-1 mt-1">
                            {recipe.diet_type.map(t => (
                              <span key={t} className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">{t}</span>
                            ))}
                          </div>
                        )}
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
              </>
            )}
          </motion.div>
        )}
      </div>

      {/* Log Meal Dialog */}
      <Dialog open={logDialogOpen} onOpenChange={setLogDialogOpen}>
        <DialogContent className="max-w-sm mx-auto max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Log Meal</DialogTitle>
          </DialogHeader>

          {/* Mode Toggle */}
          <div className="flex gap-1 p-1 rounded-xl bg-secondary">
            {(['recipe', 'custom'] as const).map(m => (
              <button
                key={m}
                onClick={() => setLogMode(m)}
                className={cn(
                  "flex-1 py-2 rounded-lg text-xs font-medium transition-all capitalize",
                  logMode === m ? "bg-card shadow-sm text-foreground" : "text-muted-foreground"
                )}
              >{m === 'recipe' ? 'From Recipe' : 'Custom Meal'}</button>
            ))}
          </div>

          {logMode === 'recipe' ? (
            <div className="space-y-3">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search recipes..."
                  value={logSearch}
                  onChange={e => setLogSearch(e.target.value)}
                  className="pl-9 rounded-xl"
                />
              </div>

              {/* Recipe list */}
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {recipes
                  .filter(r => r.title.toLowerCase().includes(logSearch.toLowerCase()))
                  .map(r => (
                    <button
                      key={r.id}
                      onClick={() => setSelectedLogRecipe(r)}
                      className={cn(
                        "w-full text-left p-3 rounded-xl border transition-colors",
                        selectedLogRecipe?.id === r.id ? "border-primary bg-primary/5" : "border-border bg-card"
                      )}
                    >
                      <p className="text-sm font-medium">{r.title}</p>
                      <p className="text-[10px] text-muted-foreground">{r.calories} cal · {r.protein}g P</p>
                    </button>
                  ))}
                {recipes.filter(r => r.title.toLowerCase().includes(logSearch.toLowerCase())).length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">No recipes match your search</p>
                )}
              </div>

              {selectedLogRecipe && (
                <div className="space-y-3 pt-2 border-t border-border">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium">Servings</p>
                    <div className="flex items-center gap-3">
                      <button onClick={() => setServings(Math.max(0.5, servings - 0.5))} className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center">
                        <Minus className="h-3 w-3" />
                      </button>
                      <span className="text-sm font-bold w-8 text-center">{servings}</span>
                      <button onClick={() => setServings(servings + 0.5)} className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center">
                        <Plus className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                  <div className="grid grid-cols-4 gap-2 text-center text-xs">
                    <div className="p-2 rounded-lg bg-secondary">
                      <p className="font-bold">{Math.round(selectedLogRecipe.calories * servings)}</p>
                      <p className="text-[9px] text-muted-foreground">cal</p>
                    </div>
                    <div className="p-2 rounded-lg bg-secondary">
                      <p className="font-bold">{Math.round(selectedLogRecipe.protein * servings)}g</p>
                      <p className="text-[9px] text-muted-foreground">protein</p>
                    </div>
                    <div className="p-2 rounded-lg bg-secondary">
                      <p className="font-bold">{Math.round(selectedLogRecipe.carbs * servings)}g</p>
                      <p className="text-[9px] text-muted-foreground">carbs</p>
                    </div>
                    <div className="p-2 rounded-lg bg-secondary">
                      <p className="font-bold">{Math.round(selectedLogRecipe.fat * servings)}g</p>
                      <p className="text-[9px] text-muted-foreground">fat</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              <Input placeholder="Meal name" value={customMeal.name} onChange={e => setCustomMeal(p => ({ ...p, name: e.target.value }))} className="rounded-xl" />
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-muted-foreground">Calories</label>
                  <Input type="number" value={customMeal.calories || ''} onChange={e => setCustomMeal(p => ({ ...p, calories: Number(e.target.value) }))} className="rounded-xl" />
                </div>
                <div>
                  <label className="text-[10px] text-muted-foreground">Protein (g)</label>
                  <Input type="number" value={customMeal.protein || ''} onChange={e => setCustomMeal(p => ({ ...p, protein: Number(e.target.value) }))} className="rounded-xl" />
                </div>
                <div>
                  <label className="text-[10px] text-muted-foreground">Carbs (g)</label>
                  <Input type="number" value={customMeal.carbs || ''} onChange={e => setCustomMeal(p => ({ ...p, carbs: Number(e.target.value) }))} className="rounded-xl" />
                </div>
                <div>
                  <label className="text-[10px] text-muted-foreground">Fat (g)</label>
                  <Input type="number" value={customMeal.fat || ''} onChange={e => setCustomMeal(p => ({ ...p, fat: Number(e.target.value) }))} className="rounded-xl" />
                </div>
              </div>
            </div>
          )}

          <Button
            onClick={handleLogMeal}
            disabled={savingLog || (logMode === 'recipe' ? !selectedLogRecipe : !customMeal.name)}
            className="w-full h-12 rounded-2xl gradient-primary text-primary-foreground font-semibold"
          >
            {savingLog ? 'Saving...' : 'Log Meal'}
          </Button>
        </DialogContent>
      </Dialog>
    </MobileLayout>
  );
}