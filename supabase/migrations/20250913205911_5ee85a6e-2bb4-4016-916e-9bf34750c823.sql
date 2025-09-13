-- Enable pgvector extension for document search
CREATE EXTENSION IF NOT EXISTS vector;

-- Create enum types
CREATE TYPE public.user_role AS ENUM ('super_admin', 'company_admin', 'company_manager', 'company_staff', 'individual');
CREATE TYPE public.subscription_tier AS ENUM ('free', 'essential', 'premium', 'sme', 'enterprise');
CREATE TYPE public.document_status AS ENUM ('pending', 'approved', 'rejected');
CREATE TYPE public.document_category AS ENUM ('employment', 'commercial', 'real_estate', 'family', 'criminal', 'corporate', 'intellectual_property');
CREATE TYPE public.template_category AS ENUM ('employment', 'commercial', 'real_estate', 'family', 'criminal', 'corporate', 'intellectual_property');

-- Create companies table
CREATE TABLE public.companies (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    subscription_tier subscription_tier NOT NULL DEFAULT 'free',
    subscription_status TEXT NOT NULL DEFAULT 'active',
    total_credits INTEGER NOT NULL DEFAULT 0,
    used_credits INTEGER NOT NULL DEFAULT 0,
    credits_reset_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT date_trunc('month', now() + interval '1 month'),
    stripe_customer_id TEXT,
    stripe_subscription_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user_company_roles table
CREATE TABLE public.user_company_roles (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
    role user_role NOT NULL,
    max_credits_per_period INTEGER DEFAULT 50,
    used_credits INTEGER NOT NULL DEFAULT 0,
    credits_reset_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT date_trunc('month', now() + interval '1 month'),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(user_id, company_id)
);

-- Create documents table
CREATE TABLE public.documents (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    category document_category NOT NULL,
    status document_status NOT NULL DEFAULT 'pending',
    file_path TEXT,
    embedding vector(1536),
    metadata JSONB DEFAULT '{}',
    uploaded_by UUID,
    approved_by UUID,
    approved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create templates table
CREATE TABLE public.templates (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    content TEXT NOT NULL,
    category template_category NOT NULL,
    price_aed DECIMAL(10,2) NOT NULL DEFAULT 0,
    created_by UUID,
    revenue_share_percentage DECIMAL(5,2) DEFAULT 0,
    download_count INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT true,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create template_downloads table
CREATE TABLE public.template_downloads (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    template_id UUID REFERENCES public.templates(id) ON DELETE CASCADE NOT NULL,
    user_id UUID NOT NULL,
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
    price_paid_aed DECIMAL(10,2) NOT NULL,
    stripe_payment_intent_id TEXT,
    downloaded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create lawyer_requests table
CREATE TABLE public.lawyer_requests (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
    conversation_id UUID REFERENCES public.conversations(id) ON DELETE CASCADE,
    subject TEXT NOT NULL,
    description TEXT NOT NULL,
    specialization TEXT,
    status TEXT NOT NULL DEFAULT 'pending',
    assigned_lawyer_email TEXT,
    priority TEXT NOT NULL DEFAULT 'normal',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Update profiles table to support multi-tenant architecture
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS user_role user_role NOT NULL DEFAULT 'individual',
ADD COLUMN IF NOT EXISTS current_company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS max_credits_per_period INTEGER DEFAULT 10;

-- Enable RLS on new tables
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_company_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.template_downloads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lawyer_requests ENABLE ROW LEVEL SECURITY;

-- RLS policies for companies
CREATE POLICY "Super admins can view all companies" ON public.companies
FOR SELECT USING (EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.user_id = auth.uid() AND profiles.user_role = 'super_admin'
));

CREATE POLICY "Company users can view their company" ON public.companies
FOR SELECT USING (EXISTS (
    SELECT 1 FROM public.user_company_roles 
    WHERE user_company_roles.user_id = auth.uid() AND user_company_roles.company_id = companies.id
));

CREATE POLICY "Super admins can insert companies" ON public.companies
FOR INSERT WITH CHECK (EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.user_id = auth.uid() AND profiles.user_role = 'super_admin'
));

CREATE POLICY "Company admins can update their company" ON public.companies
FOR UPDATE USING (EXISTS (
    SELECT 1 FROM public.user_company_roles 
    WHERE user_company_roles.user_id = auth.uid() 
    AND user_company_roles.company_id = companies.id 
    AND user_company_roles.role = 'company_admin'
));

-- RLS policies for user_company_roles
CREATE POLICY "Users can view their own roles" ON public.user_company_roles
FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Company admins can view their company roles" ON public.user_company_roles
FOR SELECT USING (EXISTS (
    SELECT 1 FROM public.user_company_roles ucr
    WHERE ucr.user_id = auth.uid() 
    AND ucr.company_id = user_company_roles.company_id 
    AND ucr.role = 'company_admin'
));

CREATE POLICY "Super admins can view all roles" ON public.user_company_roles
FOR SELECT USING (EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.user_id = auth.uid() AND profiles.user_role = 'super_admin'
));

-- RLS policies for documents (super admin only for management)
CREATE POLICY "Super admins can manage all documents" ON public.documents
FOR ALL USING (EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.user_id = auth.uid() AND profiles.user_role = 'super_admin'
));

-- RLS policies for templates (everyone can view active templates)
CREATE POLICY "Everyone can view active templates" ON public.templates
FOR SELECT USING (is_active = true);

CREATE POLICY "Super admins can manage all templates" ON public.templates
FOR ALL USING (EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.user_id = auth.uid() AND profiles.user_role = 'super_admin'
));

-- RLS policies for template_downloads
CREATE POLICY "Users can view their own downloads" ON public.template_downloads
FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own downloads" ON public.template_downloads
FOR INSERT WITH CHECK (user_id = auth.uid());

-- RLS policies for lawyer_requests
CREATE POLICY "Users can view their own requests" ON public.lawyer_requests
FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can create their own requests" ON public.lawyer_requests
FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Super admins can manage all lawyer requests" ON public.lawyer_requests
FOR ALL USING (EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.user_id = auth.uid() AND profiles.user_role = 'super_admin'
));

-- Create indexes for performance
CREATE INDEX idx_documents_embedding ON public.documents USING ivfflat (embedding vector_cosine_ops);
CREATE INDEX idx_documents_category ON public.documents(category);
CREATE INDEX idx_documents_status ON public.documents(status);
CREATE INDEX idx_templates_category ON public.templates(category);
CREATE INDEX idx_user_company_roles_user_id ON public.user_company_roles(user_id);
CREATE INDEX idx_user_company_roles_company_id ON public.user_company_roles(company_id);

-- Create triggers for updated_at
CREATE TRIGGER update_companies_updated_at
BEFORE UPDATE ON public.companies
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_company_roles_updated_at
BEFORE UPDATE ON public.user_company_roles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_documents_updated_at
BEFORE UPDATE ON public.documents
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_templates_updated_at
BEFORE UPDATE ON public.templates
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_lawyer_requests_updated_at
BEFORE UPDATE ON public.lawyer_requests
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();