import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./use-auth";

type CustomerStatus = 'pending' | 'approved' | 'inactive' | 'blocked' | null;

export const useCustomerStatus = () => {
  const { user } = useAuth();
  const [status, setStatus] = useState<CustomerStatus>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchCustomerStatus = async () => {
      if (!user) {
        setStatus(null);
        setIsLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('customer_profiles')
          .select('status')
          .eq('user_id', user.id)
          .maybeSingle();

        if (error) throw error;
        
        setStatus(data?.status || null);
      } catch (error) {
        console.error('Error fetching customer status:', error);
        setStatus(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCustomerStatus();

    // Subscribe to changes
    const channel = supabase
      .channel('customer_profile_changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'customer_profiles',
          filter: `user_id=eq.${user?.id}`
        },
        (payload) => {
          setStatus(payload.new.status as CustomerStatus);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  return { status, isLoading, isApproved: status === 'approved' };
};
