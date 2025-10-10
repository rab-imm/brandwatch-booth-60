import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { CreateUserData, UpdateUserData, CreateCompanyData, UpdateCompanyData } from "@/lib/admin-validation";

export const useAdminActions = () => {
  const callAdminFunction = async (action: string, data: any) => {
    try {
      console.log(`=== CALLING ADMIN FUNCTION: ${action} ===`);
      console.log('Request data:', data);
      
      const { data: result, error } = await supabase.functions.invoke('admin-user-management', {
        body: { action, ...data }
      });

      console.log('Function response:', { result, error });

      if (error) {
        console.error('Supabase function error:', error);
        // Try to extract more detailed error information
        let errorMessage = error.message;
        
        // If it's a generic function error, try to get more details
        if (errorMessage.includes('Edge Function returned a non-2xx status code')) {
          errorMessage = `Edge Function Error: ${error.message}. Check the function logs for more details.`;
        }
        
        throw new Error(errorMessage);
      }

      if (result?.error) {
        console.error('Function returned error:', result.error);
        // The edge function returned an error in the response body
        throw new Error(result.error);
      }

      console.log(`=== ${action} COMPLETED SUCCESSFULLY ===`);
      return result;
    } catch (error) {
      console.error(`=== ADMIN ACTION ${action} FAILED ===`);
      console.error('Error details:', {
        name: error.name,
        message: error.message,
        stack: error.stack
      });
      throw error;
    }
  };

  const createUser = async (userData: CreateUserData) => {
    try {
      await callAdminFunction('create_user', userData);
      toast.success('User created successfully');
      return true;
    } catch (error) {
      toast.error(`Failed to create user: ${error.message}`);
      return false;
    }
  };

  const updateUser = async (userData: UpdateUserData) => {
    try {
      await callAdminFunction('update_user', userData);
      toast.success('User updated successfully');
      return true;
    } catch (error) {
      toast.error(`Failed to update user: ${error.message}`);
      return false;
    }
  };

  const deleteUser = async (user_id: string) => {
    try {
      await callAdminFunction('delete_user', { user_id });
      toast.success('User deleted successfully');
      return true;
    } catch (error) {
      toast.error(`Failed to delete user: ${error.message}`);
      return false;
    }
  };

  const createCompany = async (companyData: CreateCompanyData) => {
    try {
      const result = await callAdminFunction('create_company', companyData);
      toast.success('Company created successfully');
      return result.company;
    } catch (error) {
      toast.error(`Failed to create company: ${error.message}`);
      return null;
    }
  };

  const updateCompany = async (companyData: UpdateCompanyData) => {
    try {
      await callAdminFunction('update_company', companyData);
      toast.success('Company updated successfully');
      return true;
    } catch (error) {
      toast.error(`Failed to update company: ${error.message}`);
      return false;
    }
  };

  const deleteCompany = async (company_id: string) => {
    try {
      await callAdminFunction('delete_company', { company_id });
      toast.success('Company deleted successfully');
      return true;
    } catch (error) {
      toast.error(`Failed to delete company: ${error.message}`);
      return false;
    }
  };

  const pauseCompany = async (company_id: string) => {
    try {
      await callAdminFunction('pause_company', { company_id });
      toast.success('Company paused successfully');
      return true;
    } catch (error) {
      toast.error(`Failed to pause company: ${error.message}`);
      return false;
    }
  };

  const resetUserPassword = async (user_id: string, new_password?: string) => {
    try {
      const result = await callAdminFunction('reset_user_password', { user_id, new_password });
      
      if (new_password) {
        toast.success('Password reset successfully. User can now log in with the new password.');
      } else {
        toast.success('Password reset email sent successfully');
      }
      
      return result;
    } catch (error) {
      toast.error(`Failed to reset password: ${error.message}`);
      return null;
    }
  };

  const removeCompanyUser = async (userId: string, companyId: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('remove-company-user', {
        body: { userId, companyId }
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      toast.success("User removed from company");
      return true;
    } catch (error: any) {
      toast.error(error.message || "Failed to remove user");
      return false;
    }
  };

  const updateUserCredits = async (userRoleId: string, userId: string, companyId: string, newMaxCredits: number) => {
    try {
      const { data, error } = await supabase.functions.invoke('update-user-credits', {
        body: { userRoleId, userId, companyId, newMaxCredits }
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      toast.success("User credits updated");
      return true;
    } catch (error: any) {
      toast.error(error.message || "Failed to update credits");
      return false;
    }
  };

  const updateUserRole = async (userRoleId: string, userId: string, companyId: string, newRole: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('update-user-role', {
        body: { userRoleId, userId, companyId, newRole }
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      toast.success("User role updated");
      return true;
    } catch (error: any) {
      toast.error(error.message || "Failed to update role");
      return false;
    }
  };

  return {
    createUser,
    updateUser,
    deleteUser,
    createCompany,
    updateCompany,
    deleteCompany,
    pauseCompany,
    resetUserPassword,
    removeCompanyUser,
    updateUserCredits,
    updateUserRole
  };
};