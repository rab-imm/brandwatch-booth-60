-- Insert sample billing data with correct transaction types
INSERT INTO public.billing_transactions (
  user_id, 
  amount_aed, 
  currency, 
  transaction_type, 
  status, 
  description,
  processed_at
) 
SELECT 
  user_id,
  (random() * 500 + 50)::numeric,
  'AED',
  CASE WHEN random() > 0.5 THEN 'payment' ELSE 'refund' END,
  CASE WHEN random() > 0.1 THEN 'completed' ELSE 'failed' END,
  'Sample transaction for testing',
  now() - (random() * interval '30 days')
FROM profiles 
LIMIT 5;

-- Insert subscription events
INSERT INTO public.subscription_events (
  user_id,
  event_type,
  old_status,
  new_status,
  old_tier,
  new_tier,
  effective_date,
  notes
)
SELECT 
  user_id,
  CASE WHEN random() > 0.5 THEN 'subscription_created' ELSE 'subscription_updated' END,
  'inactive',
  'active',
  'free',
  CASE WHEN random() > 0.5 THEN 'basic' ELSE 'premium' END,
  now() - (random() * interval '30 days'),
  'Sample subscription event'
FROM profiles 
LIMIT 3;

-- Insert billing alerts
INSERT INTO public.billing_alerts (
  user_id,
  alert_type,
  severity,
  title,
  message,
  metadata
)
SELECT 
  user_id,
  CASE 
    WHEN random() > 0.6 THEN 'payment_failure'
    WHEN random() > 0.3 THEN 'subscription_expiring'
    ELSE 'usage_limit_reached'
  END,
  CASE WHEN random() > 0.7 THEN 'high' ELSE 'medium' END,
  'Sample Alert',
  'This is a sample billing alert for testing purposes',
  '{"automated": true, "test": true}'::jsonb
FROM profiles 
LIMIT 3;

-- Insert trial management records
INSERT INTO public.trial_management (
  user_id,
  trial_start_date,
  trial_end_date,
  trial_credits_allocated,
  trial_credits_used,
  trial_status
)
SELECT 
  user_id,
  now() - interval '15 days',
  now() + interval '15 days',
  50,
  (random() * 30)::int,
  CASE WHEN random() > 0.3 THEN 'active' ELSE 'expired' END
FROM profiles 
LIMIT 3;