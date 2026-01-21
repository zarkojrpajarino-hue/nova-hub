-- Fix security definer views by making them security invoker
ALTER VIEW public.pending_payments SET (security_invoker = true);
ALTER VIEW public.financial_metrics SET (security_invoker = true);