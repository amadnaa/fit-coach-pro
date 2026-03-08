import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { LogOut, Moon, Sun, User, Shield, Bell, Palette, Camera, Lock, Check } from 'lucide-react';
import { MobileLayout } from '@/components/layout/MobileLayout';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

function hslToHex(h: number, s: number, l: number): string {
  s /= 100; l /= 100;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color).toString(16).padStart(2, '0');
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}

function hexToHsl(hex: string): [number, number, number] {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) * 60; break;
      case g: h = ((b - r) / d + 2) * 60; break;
      case b: h = ((r - g) / d + 4) * 60; break;
    }
  }
  return [Math.round(h), Math.round(s * 100), Math.round(l * 100)];
}

function applyAccentColor(color: string) {
  const parts = color.split(' ').map(s => parseFloat(s));
  const h = parts[0], s = parts[1], l = parts[2];
  const darkL = Math.max(l - 10, 15);
  const lightL = Math.min(l + 10, 85);
  const lightH = (h + 18) % 360;

  document.documentElement.style.setProperty('--primary', color);
  document.documentElement.style.setProperty('--accent', color);
  document.documentElement.style.setProperty('--ring', color);
  document.documentElement.style.setProperty('--sidebar-primary', color);
  document.documentElement.style.setProperty('--sidebar-ring', color);
  document.documentElement.style.setProperty('--primary-dark', `${h} ${s}% ${darkL}%`);
  document.documentElement.style.setProperty('--primary-light', `${lightH} ${Math.min(s + 8, 100)}% ${lightL}%`);
}

export default function ProfileView() {
  const { user, role, signOut } = useAuth();
  const navigate = useNavigate();
  const [darkMode, setDarkMode] = useState(document.documentElement.classList.contains('dark'));
  const [editMode, setEditMode] = useState(false);
  const [fullName, setFullName] = useState(user?.user_metadata?.full_name || '');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [selectedColor, setSelectedColor] = useState('330 81% 60%');
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [passwords, setPasswords] = useState({ current: '', new1: '', new2: '' });
  const [changingPassword, setChangingPassword] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  

  useEffect(() => {
    if (!user) return;
    supabase.from('profiles').select('avatar_url, full_name').eq('user_id', user.id).maybeSingle()
      .then(({ data }) => {
        if (data) {
          if (data.avatar_url) setAvatarUrl(data.avatar_url);
          if (data.full_name) setFullName(data.full_name);
        }
      });
    supabase.from('user_preferences').select('accent_color').eq('user_id', user.id).maybeSingle()
      .then(({ data }) => {
        const color = data?.accent_color || '330 81% 60%';
        setSelectedColor(color);
        applyAccentColor(color);
      });
  }, [user]);


  const handleColorInput = async (hex: string) => {
    const [h, s, l] = hexToHsl(hex);
    const hslStr = `${h} ${s}% ${l}%`;
    setSelectedColor(hslStr);
    applyAccentColor(hslStr);
  };

  const saveColor = async () => {
    if (!user) return;
    await supabase.from('user_preferences').upsert({
      user_id: user.id,
      accent_color: selectedColor,
    }, { onConflict: 'user_id' });
    toast.success('Theme updated!');
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    if (file.size > 5 * 1024 * 1024) { toast.error('Max 5MB'); return; }
    const ext = file.name.split('.').pop();
    const path = `${user.id}/avatar.${ext}`;
    const { error } = await supabase.storage.from('avatars').upload(path, file, { upsert: true, contentType: file.type });
    if (error) { toast.error(error.message); return; }
    const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(path);
    const url = urlData.publicUrl + '?t=' + Date.now();
    setAvatarUrl(url);
    await supabase.from('profiles').update({ avatar_url: url }).eq('user_id', user.id);
    toast.success('Photo updated!');
  };

  const handleSaveName = async () => {
    if (!user || !fullName.trim()) return;
    setSaving(true);
    await supabase.from('profiles').update({ full_name: fullName.trim() }).eq('user_id', user.id);
    await supabase.auth.updateUser({ data: { full_name: fullName.trim() } });
    setSaving(false);
    toast.success('Name updated!');
    setEditMode(false);
  };

  const handleChangePassword = async () => {
    if (passwords.new1 !== passwords.new2) { toast.error('Passwords do not match'); return; }
    if (passwords.new1.length < 8) { toast.error('Password must be at least 8 characters'); return; }
    setChangingPassword(true);
    const { error } = await supabase.auth.updateUser({ password: passwords.new1 });
    setChangingPassword(false);
    if (error) { toast.error(error.message); return; }
    toast.success('Password changed!');
    setShowPasswordForm(false);
    setPasswords({ current: '', new1: '', new2: '' });
  };

  const toggleDark = () => {
    document.documentElement.classList.toggle('dark');
    setDarkMode(!darkMode);
  };

  return (
    <MobileLayout>
      <div className="px-5 pt-6 space-y-6 pb-6">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-4">
          <div className="relative">
            <div className="w-16 h-16 rounded-2xl overflow-hidden gradient-primary flex items-center justify-center text-primary-foreground text-xl font-bold">
              {avatarUrl ? (
                <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                user?.email?.charAt(0).toUpperCase() || 'U'
              )}
            </div>
            <button onClick={() => fileRef.current?.click()}
              className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-primary flex items-center justify-center text-primary-foreground shadow-md">
              <Camera className="h-3.5 w-3.5" />
            </button>
            <input ref={fileRef} type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden" />
          </div>
          <div className="flex-1">
            {editMode ? (
              <div className="flex items-center gap-2">
                <Input value={fullName} onChange={e => setFullName(e.target.value)} className="h-9 rounded-xl text-sm" maxLength={50} />
                <button onClick={handleSaveName} disabled={saving} className="text-primary"><Check className="h-5 w-5" /></button>
              </div>
            ) : (
              <div>
                <h1 className="text-xl font-display font-bold" onClick={() => setEditMode(true)}>
                  {fullName || user?.email}
                </h1>
                <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium capitalize",
                  role === 'coach' ? "bg-coach/10 text-coach" : "bg-primary/10 text-primary")}>
                  {role || 'user'}
                </span>
              </div>
            )}
          </div>
        </motion.div>

        {/* Theme Color Picker */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="p-4 rounded-2xl bg-card border border-border space-y-3">
          <div className="flex items-center gap-2">
            <Palette className="h-4 w-4 text-primary" />
            <p className="text-sm font-semibold">Accent Color</p>
          </div>
          <div className="flex gap-3 flex-wrap justify-center">
            {[
              { hex: '#22c55e', label: 'Green' },
              { hex: '#3b82f6', label: 'Blue' },
              { hex: '#a855f7', label: 'Purple' },
              { hex: '#f97316', label: 'Orange' },
              { hex: '#ec4899', label: 'Pink' },
              { hex: '#14b8a6', label: 'Teal' },
              { hex: '#ef4444', label: 'Red' },
              { hex: '#eab308', label: 'Yellow' },
            ].map(p => {
              const [h, s, l] = hexToHsl(p.hex);
              return (
                <button key={p.hex} onClick={() => { handleColorInput(p.hex); setTimeout(saveColor, 50); }}
                  className={cn("flex flex-col items-center gap-1 transition-all",
                    Math.abs(parseFloat(selectedColor) - h) < 5 ? "scale-110" : "")}
                >
                  <div className={cn("h-10 w-10 rounded-full border-2 transition-all",
                    Math.abs(parseFloat(selectedColor) - h) < 5 ? "border-foreground ring-2 ring-foreground/20" : "border-transparent")}
                    style={{ backgroundColor: p.hex }}
                  />
                  <span className="text-[10px] text-muted-foreground">{p.label}</span>
                </button>
              );
            })}
          </div>
        </motion.div>

        {/* Menu Items */}
        <div className="space-y-2">
          {[
            { icon: User, label: editMode ? 'Done Editing' : 'Edit Name', action: () => setEditMode(!editMode) },
            { icon: Lock, label: 'Change Password', action: () => setShowPasswordForm(!showPasswordForm) },
            { icon: Bell, label: 'Notifications', action: () => navigate('/notifications') },
            { icon: darkMode ? Sun : Moon, label: darkMode ? 'Light Mode' : 'Dark Mode', action: toggleDark },
            { icon: Shield, label: 'Privacy & Security', action: () => navigate('/privacy') },
          ].map((item, i) => (
            <motion.button key={item.label} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
              onClick={item.action}
              className="w-full flex items-center gap-3 p-4 rounded-xl bg-card border border-border text-left hover:bg-secondary transition-colors">
              <item.icon className="h-5 w-5 text-muted-foreground" />
              <span className="text-sm font-medium flex-1">{item.label}</span>
            </motion.button>
          ))}
        </div>

        {/* Password Form */}
        {showPasswordForm && (
          <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} className="p-4 rounded-2xl bg-card border border-border space-y-3">
            <p className="text-sm font-semibold">Change Password</p>
            <Input type="password" placeholder="New password" value={passwords.new1} onChange={e => setPasswords(p => ({ ...p, new1: e.target.value }))} className="rounded-xl" />
            <Input type="password" placeholder="Confirm new password" value={passwords.new2} onChange={e => setPasswords(p => ({ ...p, new2: e.target.value }))} className="rounded-xl" />
            <Button onClick={handleChangePassword} disabled={changingPassword || !passwords.new1 || !passwords.new2} className="w-full rounded-xl gradient-primary text-primary-foreground font-semibold">
              {changingPassword ? 'Changing...' : 'Update Password'}
            </Button>
          </motion.div>
        )}

        <Button onClick={signOut} variant="outline" className="w-full h-12 rounded-xl text-destructive border-destructive/20 hover:bg-destructive/10">
          <LogOut className="h-4 w-4 mr-2" /> Sign Out
        </Button>
      </div>
    </MobileLayout>
  );
}
