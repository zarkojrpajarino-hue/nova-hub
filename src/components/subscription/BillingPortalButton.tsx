/**
 * V4.5.7 — BillingPortalButton
 *
 * Calls the create-portal-session edge function to get a Stripe
 * Customer Portal URL and redirects the user.
 */

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { CreditCard, ExternalLink, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useProjectPlan } from '@/hooks/useSubscription';
import { isPaymentsEnabled } from '@/config/features';
import { toast } from 'sonner';

interface BillingPortalButtonProps {
  projectId: string | undefined;
  className?: string;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg';
}

export function BillingPortalButton({
  projectId,
  className,
  variant = 'outline',
  size = 'default',
}: BillingPortalButtonProps) {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const { data: subscription } = useProjectPlan(projectId);

  // Don't render if payments disabled or no Stripe customer
  if (!isPaymentsEnabled() || !subscription?.stripe_customer_id) {
    return null;
  }

  const handleClick = async () => {
    if (!projectId) return;

    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error(t('subscription.nudge.authRequired'));
        return;
      }

      const response = await supabase.functions.invoke('create-portal-session', {
        body: {
          project_id: projectId,
          return_url: window.location.href,
        },
      });

      if (response.error) {
        throw new Error(response.error.message || 'Failed to create portal session');
      }

      const { url } = response.data as { url: string };
      if (url) {
        window.location.href = url;
      } else {
        throw new Error('No portal URL returned');
      }
    } catch (error) {
      console.error('[BillingPortal] Error:', error);
      toast.error(t('subscription.nudge.portalError'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      onClick={handleClick}
      variant={variant}
      size={size}
      disabled={loading}
      className={cn('gap-2', className)}
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <CreditCard className="h-4 w-4" />
      )}
      {t('subscription.nudge.manageBilling')}
      {!loading && <ExternalLink className="h-3.5 w-3.5 opacity-50" />}
    </Button>
  );
}
