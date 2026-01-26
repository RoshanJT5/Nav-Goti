"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Profile } from "@/hooks/use-profile";
import { User, Trophy, Medal, Target, Check, Loader2, Palette } from "lucide-react";
import { THEMES, getTheme } from "@/lib/themes";

const ACCENT_BLUE = "#3b82f6";

interface ProfileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  profile: Profile | null;
  onUpdate: (updates: Partial<Profile>) => Promise<any>;
}

export function ProfileDialog({ open, onOpenChange, profile, onUpdate }: ProfileDialogProps) {
  const [name, setName] = useState(profile?.name || "");
  const [isUpdating, setIsUpdating] = useState(false);
  const [success, setSuccess] = useState(false);
  const theme = getTheme(profile?.theme_id);

  useEffect(() => {
    if (profile) setName(profile.name);
  }, [profile]);

  const handleSaveName = async () => {
    if (!name.trim()) return;
    setIsUpdating(true);
    try {
      await onUpdate({ name });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 2000);
    } catch (err) {
      console.error(err);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleThemeSelect = async (themeId: string) => {
    try {
      await onUpdate({ theme_id: themeId });
    } catch (err) {
      console.error(err);
    }
  };

  const winRate = profile && (profile.wins + profile.losses + profile.draws) > 0
    ? Math.round((profile.wins / (profile.wins + profile.losses + profile.draws)) * 100)
    : 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        className="max-w-md max-h-[90vh] overflow-y-auto border shadow-2xl transition-colors duration-500"
        style={{ backgroundColor: '#2a2a2a', borderColor: '#444', color: '#e0e0e0' }}
      >
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl" style={{ color: ACCENT_BLUE }}>
              <User className="w-5 h-5" style={{ color: ACCENT_BLUE }} />
              Guest Profile
            </DialogTitle>
          </DialogHeader>
  
          <div className="space-y-6 py-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="font-bold text-sm" style={{ color: '#e0e0e0' }}>Display Name</Label>
                <div className="flex gap-2">
                    <Input
                      id="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Enter your name"
                      className="font-semibold focus-visible:ring-blue-500/50 focus-visible:border-blue-500 focus-visible:ring-[3px] selection:bg-blue-500/30 hover:border-blue-400 transition-all"
                      style={{ backgroundColor: '#3a3a3a', borderColor: ACCENT_BLUE, color: "#ffffff" }}
                    />
                  <Button 
                    onClick={handleSaveName} 
                    disabled={isUpdating || name === profile?.name}
                    className="text-white min-w-[80px] font-bold hover:brightness-110 active:scale-95 transition-all focus-visible:ring-blue-500/50 focus-visible:border-blue-500 focus-visible:ring-[3px]"
                    style={{ backgroundColor: ACCENT_BLUE }}
                  >
                  {isUpdating ? <Loader2 className="w-4 h-4 animate-spin" /> : success ? <Check className="w-4 h-4" /> : "Save"}
                </Button>
              </div>
              <p className="text-xs" style={{ color: '#888' }}>Your profile is tied to this device. No signup required.</p>
            </div>
  
            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-lg p-4 text-center" style={{ backgroundColor: '#3a3a3a' }}>
                <Trophy className="w-6 h-6 mx-auto mb-2" style={{ color: '#f59e0b' }} />
                <div className="text-2xl font-bold" style={{ color: '#ffffff' }}>{profile?.wins || 0}</div>
                <div className="text-xs uppercase tracking-wider" style={{ color: '#888' }}>Wins</div>
              </div>
              <div className="rounded-lg p-4 text-center" style={{ backgroundColor: '#3a3a3a' }}>
                <Medal className="w-6 h-6 mx-auto mb-2" style={{ color: '#9ca3af' }} />
                <div className="text-2xl font-bold" style={{ color: '#ffffff' }}>{profile?.losses || 0}</div>
                <div className="text-xs uppercase tracking-wider" style={{ color: '#888' }}>Losses</div>
              </div>
              <div className="rounded-lg p-4 text-center" style={{ backgroundColor: '#3a3a3a' }}>
                <Target className="w-6 h-6 mx-auto mb-2" style={{ color: ACCENT_BLUE }} />
                <div className="text-2xl font-bold" style={{ color: '#ffffff' }}>{winRate}%</div>
                <div className="text-xs uppercase tracking-wider" style={{ color: '#888' }}>Win Rate</div>
              </div>
            </div>
  
            <div className="space-y-3">
              <h4 className="text-sm font-bold flex items-center gap-2" style={{ color: theme.headingColor }}>
                <Palette className="w-4 h-4 opacity-60" style={{ color: theme.headingColor }} />
                Board Themes
              </h4>
              <div className="grid grid-cols-2 gap-3">
                {THEMES.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => handleThemeSelect(t.id)}
                    className={`
                      group relative flex flex-col items-center gap-2 p-3 rounded-2xl border-2 transition-all hover:scale-[1.05] active:scale-95 shadow-lg
                    `}
                    style={{ 
                      backgroundColor: profile?.theme_id === t.id ? t.accentColor + '20' : theme.appBackground,
                      borderColor: profile?.theme_id === t.id ? t.accentColor : theme.boardLineColor + '20'
                    }}
                  >
                    <div 
                      className="w-full aspect-square rounded-xl shadow-inner flex items-center justify-center p-2 relative overflow-hidden"
                      style={{ backgroundColor: t.boardBg }}
                    >
                      <div 
                        className="absolute inset-2 border-2 opacity-30" 
                        style={{ borderColor: t.boardLineColor }}
                      />
                      <div className="flex gap-3 z-10">
                        <div 
                          className="w-6 h-6 rounded-full border-2 shadow-xl flex items-center justify-center text-[10px] font-black" 
                          style={{ background: t.whitePiece.bg, borderColor: t.whitePiece.border, color: t.whitePiece.color }}
                        >
                          {t.whitePiece.content}
                        </div>
                        <div 
                          className="w-6 h-6 rounded-full border-2 shadow-xl flex items-center justify-center text-[10px] font-black" 
                          style={{ background: t.blackPiece.bg, borderColor: t.blackPiece.border, color: t.blackPiece.color }}
                        >
                          {t.blackPiece.content}
                        </div>
                      </div>
                    </div>
                    <span className="text-xs font-black tracking-wide" style={{ color: theme.textColor }}>{t.name}</span>
                    {profile?.theme_id === t.id && (
                      <div className="absolute top-2 right-2 rounded-full p-1 shadow-md scale-110" style={{ backgroundColor: t.accentColor }}>
                        <Check className="w-3 h-3 text-white stroke-[4]" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>
  
            <div className="space-y-3 pt-4 border-t" style={{ borderColor: '#444' }}>
              <h4 className="text-xs font-semibold" style={{ color: '#888' }}>
                Device Identity
              </h4>
              <div className="rounded-lg p-3 text-xs font-mono break-all select-all" style={{ backgroundColor: '#3a3a3a', color: '#888' }}>
                ID: {profile?.id}
              </div>
              <p className="text-xs italic" style={{ color: '#666' }}>
                * Note: If you clear your browser data, your progress will be lost.
              </p>
            </div>
          </div>
      </DialogContent>
    </Dialog>
  );
}
