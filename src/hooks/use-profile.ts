import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export interface Profile {
  id: string;
  name: string;
  avatar_url: string | null;
  wins: number;
  losses: number;
  draws: number;
  theme_id: string;
}

const generateId = () => Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);

export function useGuestProfile() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadProfile() {
      try {
        let deviceId = typeof window !== 'undefined' ? localStorage.getItem('guest_device_id') : null;
        
        if (!deviceId) {
          deviceId = generateId();
          if (typeof window !== 'undefined') {
            localStorage.setItem('guest_device_id', deviceId);
          }
        }

        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', deviceId)
          .single();

        if (error && error.code === 'PGRST116') {
          // Profile doesn't exist, create one
          const newProfile = {
            id: deviceId,
            name: `Guest_${deviceId.substring(0, 5)}`,
            avatar_url: null,
            wins: 0,
            losses: 0,
            draws: 0,
            theme_id: 'classic',
          };

          const { data: createdData, error: createError } = await supabase
            .from('profiles')
            .insert(newProfile)
            .select()
            .single();

          if (createError) throw createError;
          setProfile(createdData);
        } else if (data) {
          setProfile(data);
        }
      } catch (err) {
        console.error('Error loading profile:', err);
      } finally {
        setLoading(false);
      }
    }

    loadProfile();
  }, []);

  const updateProfile = async (updates: Partial<Profile>) => {
    if (!profile) return;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', profile.id)
        .select()
        .single();

      if (error) throw error;
      setProfile(data);
      return data;
    } catch (err) {
      console.error('Error updating profile:', err);
      throw err;
    }
  };

  return { profile, loading, updateProfile };
}
