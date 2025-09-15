import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { CreateUserData, UpdateUserData, CreateCompanyData, UpdateCompanyData } from "@/lib/admin-validation";

export const useAdminActions = () => {
  const callAdminFunction = async (action: string, data: any) => {
    try {
      const { data: result, error } = await supabase.functions.invoke('admin-user-management', {
        body: { action, ...data }
      });

      if (error) {
        throw new Error(error.message);
      }

      if (result?.error) {
        throw new Error(result.error);
      }

      return result;
    } catch (error) {
      console.error(`Admin action ${action} failed:`, error);
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

  return {
    createUser,
    updateUser,
    deleteUser,
    createCompany,
    updateCompany,
    deleteCompany,
    pauseCompany
  };
};