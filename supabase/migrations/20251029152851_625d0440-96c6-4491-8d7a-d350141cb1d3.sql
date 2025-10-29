-- Give user ardamafzal@gmail.com 600 credits
UPDATE public.profiles
SET max_credits_per_period = 600
WHERE email = 'ardamafzal@gmail.com';

-- Log the credit allocation (using 'purchase' as transaction type)
INSERT INTO public.credit_transactions (
  user_id,
  amount,
  transaction_type,
  description,
  metadata
) VALUES (
  '14e37e04-dd1a-49c9-8b1f-a847fbc7d377',
  600,
  'purchase',
  'Admin allocated 600 credits to user account',
  jsonb_build_object(
    'allocated_by', 'super_admin',
    'timestamp', now(),
    'reason', 'Manual credit allocation'
  )
);

-- Create notification for the user
INSERT INTO public.notifications (
  user_id,
  title,
  message,
  type,
  action_url,
  expires_at
) VALUES (
  '14e37e04-dd1a-49c9-8b1f-a847fbc7d377',
  'Credits Allocated',
  'You have been allocated 600 credits per month. Your new credit limit is now active.',
  'success',
  '/analytics',
  now() + interval '30 days'
);