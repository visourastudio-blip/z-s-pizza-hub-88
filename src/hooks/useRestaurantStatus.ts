import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const useRestaurantStatus = () => {
  const [isOpen, setIsOpen] = useState(true);
  const [loading, setLoading] = useState(true);

  const fetchStatus = async () => {
    const { data, error } = await supabase
      .from('restaurant_settings')
      .select('is_open')
      .limit(1)
      .single();

    if (!error && data) {
      setIsOpen(data.is_open);
    }
    setLoading(false);
  };

  const toggleStatus = async () => {
    const newStatus = !isOpen;
    const { error } = await supabase
      .from('restaurant_settings')
      .update({ is_open: newStatus, updated_at: new Date().toISOString() })
      .eq('id', (await supabase.from('restaurant_settings').select('id').limit(1).single()).data?.id);

    if (!error) {
      setIsOpen(newStatus);
      return true;
    }
    return false;
  };

  useEffect(() => {
    fetchStatus();

    // Subscribe to realtime changes
    const channel = supabase
      .channel('restaurant-status')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'restaurant_settings',
        },
        (payload) => {
          setIsOpen((payload.new as any).is_open);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return { isOpen, loading, toggleStatus, refetch: fetchStatus };
};
