-- Clean up any orphaned profiles that might be causing duplicate key violations
-- This function will help identify and clean up any data inconsistencies

CREATE OR REPLACE FUNCTION public.cleanup_orphaned_profiles()
RETURNS TABLE(cleaned_user_id UUID, email TEXT, action TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
    orphaned_record RECORD;
    auth_user_exists BOOLEAN;
BEGIN
    -- Find profiles that don't have corresponding auth users
    FOR orphaned_record IN 
        SELECT p.user_id, p.email, p.full_name
        FROM public.profiles p
        WHERE NOT EXISTS (
            SELECT 1 FROM auth.users u WHERE u.id = p.user_id
        )
    LOOP
        -- Return info about what we're cleaning up
        RETURN QUERY SELECT 
            orphaned_record.user_id, 
            orphaned_record.email, 
            'deleted_orphaned_profile'::TEXT;
            
        -- Delete the orphaned profile
        DELETE FROM public.profiles WHERE user_id = orphaned_record.user_id;
    END LOOP;
    
    -- Also clean up any duplicate profiles (same email, different user_id)
    FOR orphaned_record IN
        SELECT p1.user_id, p1.email
        FROM public.profiles p1
        WHERE EXISTS (
            SELECT 1 FROM public.profiles p2 
            WHERE p2.email = p1.email 
            AND p2.user_id != p1.user_id
        )
        AND NOT EXISTS (
            SELECT 1 FROM auth.users u WHERE u.id = p1.user_id
        )
    LOOP
        RETURN QUERY SELECT 
            orphaned_record.user_id, 
            orphaned_record.email, 
            'deleted_duplicate_profile'::TEXT;
            
        DELETE FROM public.profiles WHERE user_id = orphaned_record.user_id;
    END LOOP;
    
    RETURN;
END;
$$;