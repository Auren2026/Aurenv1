import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';

export const useOrderEmail = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendOrderEmails = async ({
    orderId,
    customerName,
    customerEmail,
    totalAmount,
    currency,
    orderNumber,
    items,
    customerPhone,
    customerAddress,
    notes,
  }: {
    orderId: string;
    customerName: string;
    customerEmail: string;
    totalAmount: number;
    currency: string;
    orderNumber: string;
    items?: Array<{ name: string; quantity: number; price: number }>;
    customerPhone?: string | null;
    customerAddress?: string | null;
    notes?: string | null;
  }) => {
    setIsLoading(true);
    setError(null);
    try {
      logger.log('🚀 Invocando função send-order-email...');
      const { data, error: funcError } = await supabase.functions.invoke('send-order-email', {
        body: {
          orderId,
          customerName,
          customerEmail,
          totalAmount,
          currency,
          orderNumber,
          items,
          customerPhone,
          customerAddress,
          notes,
        },
      });

      logger.log('📨 Resposta da função:', { data, funcError });

      if (funcError) {
        logger.error('❌ Erro ao enviar emails (Supabase):', funcError);
        setError(funcError.message || 'Falha ao enviar emails');
        throw new Error(funcError.message || 'Falha ao enviar emails');
      }
      if (data && (data as any).error) {
        logger.error('❌ Erro retornado pela função:', (data as any).error);
        setError((data as any).error);
        throw new Error((data as any).error);
      }
      if (data && (data as any).ok) {
        logger.log('✅ E-mail enviado com sucesso!', (data as any).data);
      }
    } catch (err: any) {
      logger.error('❌ Erro geral invoke send-order-email:', err);
      setError(err.message || 'Erro inesperado ao enviar emails');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    sendOrderEmails,
    isLoading,
    error,
    setError,
  };
};
