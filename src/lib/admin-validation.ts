import { z } from "zod";

export const createUserSchema = z.object({
  email: z.string().email("Invalid email address"),
  full_name: z.string().min(1, "Full name is required").max(100, "Full name too long"),
  user_role: z.enum(['individual', 'company_admin', 'super_admin', 'company_manager', 'company_staff']),
  subscription_tier: z.string().min(1, "Subscription tier is required"),
  max_credits_per_period: z.number().min(0, "Credits must be non-negative").max(100000, "Credits too high"),
  company_id: z.string().uuid("Invalid company ID").optional(),
}).refine((data) => {
  // Make company_id required for company_admin role
  if (data.user_role === 'company_admin' && !data.company_id) {
    return false;
  }
  return true;
}, {
  message: "Company is required for company admin role",
  path: ["company_id"],
});

export const updateUserSchema = z.object({
  user_id: z.string().uuid("Invalid user ID"),
  full_name: z.string().min(1, "Full name is required").max(100, "Full name too long").optional(),
  user_role: z.enum(['individual', 'company_admin', 'super_admin', 'company_manager', 'company_staff']).optional(),
  subscription_tier: z.string().min(1, "Subscription tier is required").optional(),
  max_credits_per_period: z.number().min(0, "Credits must be non-negative").max(100000, "Credits too high").optional(),
  subscription_status: z.enum(['active', 'inactive', 'suspended']).optional(),
});

export const createCompanySchema = z.object({
  name: z.string().min(1, "Company name is required").max(200, "Company name too long"),
  email: z.string().email("Invalid email address"),
  subscription_tier: z.string().optional(),
  total_credits: z.number().min(0, "Credits must be non-negative").max(1000000, "Credits too high").optional(),
});

export const updateCompanySchema = z.object({
  company_id: z.string().uuid("Invalid company ID"),
  name: z.string().min(1, "Company name is required").max(200, "Company name too long").optional(),
  email: z.string().email("Invalid email address").optional(),
  subscription_tier: z.string().optional(),
  total_credits: z.number().min(0, "Credits must be non-negative").max(1000000, "Credits too high").optional(),
  subscription_status: z.enum(['active', 'inactive', 'suspended', 'paused']).optional(),
});

export const resetPasswordSchema = z.object({
  user_id: z.string().uuid("Invalid user ID"),
  new_password: z.string().min(8, "Password must be at least 8 characters").optional(),
});

export type CreateUserData = z.infer<typeof createUserSchema>;
export type UpdateUserData = z.infer<typeof updateUserSchema>;
export type CreateCompanyData = z.infer<typeof createCompanySchema>;
export type UpdateCompanyData = z.infer<typeof updateCompanySchema>;
export type ResetPasswordData = z.infer<typeof resetPasswordSchema>;