import { useEffect, useState } from 'react';
import { PushNotifications } from '@capacitor/push-notifications';
import { Capacitor } from '@capacitor/core';
import { supabase } from '@/integrations/supabase/client';
import { requestNotificationPermission, onMessageListener } from '@/lib/firebase';
import { toast } from '@/hooks/use-toast';
import { logger } from '@/lib/logger';

export const usePushNotifications = () => {
  const [token, setToken] = useState<string | null>(null);
  const [isRegistered, setIsRegistered] = useState(false);

  useEffect(() => {
    const initPushNotifications = async () => {
      const platform = Capacitor.getPlatform();
      
      if (platform === 'web') {
        initWebPush();
      } else {
        initMobilePush();
      }
    };

    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        const pendingToken = localStorage.getItem('pending_push_token');
        if (pendingToken) {
          const { token, platform } = JSON.parse(pendingToken);
          await savePushToken(token, platform);
        }
      }
    });

    initPushNotifications();

    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, []);

  const initWebPush = async () => {
    try {
      const fcmToken = await requestNotificationPermission();
      
      if (fcmToken) {
        setToken(fcmToken);
        await savePushToken(fcmToken, 'web');
        setIsRegistered(true);

        onMessageListener().then((payload: any) => {
          if (payload) {
            toast({
              title: payload.notification?.title || 'Nova notificação',
              description: payload.notification?.body || '',
            });
          }
        });
      }
    } catch (error) {
      logger.error('Error initializing web push:', error);
    }
  };

  const initMobilePush = async () => {
    try {
      let permStatus = await PushNotifications.checkPermissions();

      if (permStatus.receive === 'prompt') {
        permStatus = await PushNotifications.requestPermissions();
      }

      if (permStatus.receive !== 'granted') {
        logger.warn('❌ Permissão de notificações negada');
        toast({
          title: "Notificações desativadas",
          description: "Ative nas configurações do app para receber atualizações",
          variant: "destructive",
        });
        throw new Error('Push notification permission denied');
      }

      await PushNotifications.register();

      await PushNotifications.addListener('registration', async (token) => {
        setToken(token.value);
        await savePushToken(token.value, Capacitor.getPlatform());
        setIsRegistered(true);
        
        toast({
          title: "Notificações ativadas!",
          description: "Você receberá atualizações sobre seus pedidos",
        });
      });

      await PushNotifications.addListener('registrationError', (error) => {
        logger.error('❌ Erro no registro de push:', error);
        toast({
          title: "Erro nas notificações",
          description: "Não foi possível ativar notificações push",
          variant: "destructive",
        });
      });

      await PushNotifications.addListener('pushNotificationReceived', (notification) => {
        toast({
          title: notification.title || 'Nova notificação',
          description: notification.body || '',
        });
      });

      await PushNotifications.addListener('pushNotificationActionPerformed', (notification) => {
      });

    } catch (error) {
      logger.error('Error initializing mobile push:', error);
    }
  };

  const savePushToken = async (token: string, platform: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        localStorage.setItem('pending_push_token', JSON.stringify({ token, platform }));
        return;
      }

      // TODO: Criar tabela push_tokens no Supabase
      // const { error } = await supabase
      //   .from('push_tokens')
      //   .upsert({
      //     user_id: user.id,
      //     token: token,
      //     platform: platform,
      //   }, {
      //     onConflict: 'user_id,token'
      //   });
      const error = null;

      if (error) {
        logger.error('❌ Erro ao salvar token:', error);
      } else {
        localStorage.removeItem('pending_push_token');
        logger.info('✅ Token salvo (simulado até criar tabela push_tokens)');
      }
    } catch (error) {
      logger.error('Error in savePushToken:', error);
    }
  };

  return {
    token,
    isRegistered,
  };
};
