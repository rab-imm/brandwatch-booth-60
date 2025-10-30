-- Fix search_path for update_contacts_updated_at function
DROP FUNCTION IF EXISTS public.update_contacts_updated_at() CASCADE;

CREATE OR REPLACE FUNCTION public.update_contacts_updated_at()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Recreate the trigger
DROP TRIGGER IF EXISTS trigger_update_contacts_updated_at ON public.contacts;

CREATE TRIGGER trigger_update_contacts_updated_at
BEFORE UPDATE ON public.contacts
FOR EACH ROW
EXECUTE FUNCTION public.update_contacts_updated_at();