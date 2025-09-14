-- Insert test data with correct constraint values
INSERT INTO public.billing_transactions (
  user_id, 
  amount_aed, 
  currency, 
  transaction_type, 
  status, 
  description
) VALUES 
((SELECT user_id FROM profiles LIMIT 1), 199.99, 'AED', 'payment', 'succeeded', 'Monthly subscription payment'),
((SELECT user_id FROM profiles LIMIT 1), 99.50, 'AED', 'payment', 'failed', 'Failed payment attempt'),
((SELECT user_id FROM profiles LIMIT 1), 299.99, 'AED', 'refund', 'succeeded', 'Subscription refund');

-- Insert billing alerts with valid alert_type values
INSERT INTO public.billing_alerts (
  user_id,
  alert_type,
  severity,
  title,
  message
) VALUES 
((SELECT user_id FROM profiles LIMIT 1), 'payment_failed', 'high', 'Payment Failed', 'Your recent payment attempt failed. Please update your payment method.'),
((SELECT user_id FROM profiles LIMIT 1), 'trial_expiring', 'medium', 'Trial Expiring', 'Your trial will expire in 3 days.'),
((SELECT user_id FROM profiles LIMIT 1), 'usage_threshold', 'medium', 'Usage Alert', 'You have reached 80% of your monthly usage limit.');

-- Insert trial management records
INSERT INTO public.trial_management (
  user_id,
  trial_start_date,
  trial_end_date,
  trial_credits_allocated,
  trial_credits_used,
  trial_status
) VALUES 
((SELECT user_id FROM profiles LIMIT 1), now() - interval '10 days', now() + interval '20 days', 50, 15, 'active');