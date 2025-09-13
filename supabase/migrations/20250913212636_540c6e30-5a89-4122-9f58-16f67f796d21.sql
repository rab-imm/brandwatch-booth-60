-- Create template analytics and revenue tracking tables
CREATE TABLE IF NOT EXISTS public.template_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID NOT NULL REFERENCES public.templates(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  action_type TEXT NOT NULL CHECK (action_type IN ('view', 'download', 'purchase')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Enable RLS on template analytics
ALTER TABLE public.template_analytics ENABLE ROW LEVEL SECURITY;

-- RLS policies for template analytics
CREATE POLICY "Users can insert their own analytics"
  ON public.template_analytics
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Template creators can view their template analytics"
  ON public.template_analytics
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.templates 
      WHERE templates.id = template_analytics.template_id 
      AND templates.created_by = auth.uid()
    )
  );

CREATE POLICY "Super admins can view all analytics"
  ON public.template_analytics
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.user_id = auth.uid() 
      AND profiles.user_role = 'super_admin'
    )
  );

-- Create revenue sharing table
CREATE TABLE IF NOT EXISTS public.revenue_shares (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID NOT NULL REFERENCES public.templates(id) ON DELETE CASCADE,
  creator_user_id UUID NOT NULL,
  download_id UUID NOT NULL REFERENCES public.template_downloads(id) ON DELETE CASCADE,
  sale_amount_aed DECIMAL(10,2) NOT NULL,
  creator_share_aed DECIMAL(10,2) NOT NULL,
  platform_share_aed DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'cancelled'))
);

-- Enable RLS on revenue shares
ALTER TABLE public.revenue_shares ENABLE ROW LEVEL SECURITY;

-- RLS policies for revenue shares
CREATE POLICY "Creators can view their revenue shares"
  ON public.revenue_shares
  FOR SELECT
  TO authenticated
  USING (auth.uid() = creator_user_id);

CREATE POLICY "Super admins can manage all revenue shares"
  ON public.revenue_shares
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.user_id = auth.uid() 
      AND profiles.user_role = 'super_admin'
    )
  );

-- Function to track template analytics
CREATE OR REPLACE FUNCTION public.track_template_analytics(
  p_template_id UUID,
  p_action_type TEXT,
  p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  analytics_id UUID;
BEGIN
  INSERT INTO public.template_analytics (
    template_id,
    user_id,
    action_type,
    metadata
  ) VALUES (
    p_template_id,
    auth.uid(),
    p_action_type,
    p_metadata
  ) RETURNING id INTO analytics_id;
  
  RETURN analytics_id;
END;
$$;

-- Function to calculate revenue share
CREATE OR REPLACE FUNCTION public.calculate_revenue_share(
  p_template_id UUID,
  p_download_id UUID,
  p_sale_amount DECIMAL(10,2)
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  template_creator UUID;
  revenue_share_percentage DECIMAL(5,2);
  creator_share DECIMAL(10,2);
  platform_share DECIMAL(10,2);
  share_id UUID;
BEGIN
  -- Get template creator and revenue share percentage
  SELECT created_by, COALESCE(revenue_share_percentage, 70) 
  INTO template_creator, revenue_share_percentage
  FROM public.templates 
  WHERE id = p_template_id;
  
  -- Calculate shares
  creator_share := p_sale_amount * (revenue_share_percentage / 100);
  platform_share := p_sale_amount - creator_share;
  
  -- Insert revenue share record
  INSERT INTO public.revenue_shares (
    template_id,
    creator_user_id,
    download_id,
    sale_amount_aed,
    creator_share_aed,
    platform_share_aed
  ) VALUES (
    p_template_id,
    template_creator,
    p_download_id,
    p_sale_amount,
    creator_share,
    platform_share
  ) RETURNING id INTO share_id;
  
  RETURN share_id;
END;
$$;

-- Update template download count trigger
CREATE OR REPLACE FUNCTION public.update_template_stats()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Update download count
  UPDATE public.templates 
  SET download_count = download_count + 1 
  WHERE id = NEW.template_id;
  
  -- Track analytics
  PERFORM public.track_template_analytics(
    NEW.template_id, 
    'download',
    jsonb_build_object('price_paid', NEW.price_paid_aed)
  );
  
  -- Calculate revenue share if it's a paid template
  IF NEW.price_paid_aed > 0 THEN
    PERFORM public.calculate_revenue_share(
      NEW.template_id,
      NEW.id,
      NEW.price_paid_aed
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for template downloads
DROP TRIGGER IF EXISTS update_template_stats_trigger ON public.template_downloads;
CREATE TRIGGER update_template_stats_trigger
  AFTER INSERT ON public.template_downloads
  FOR EACH ROW
  EXECUTE FUNCTION public.update_template_stats();

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_template_analytics_template_id ON public.template_analytics(template_id);
CREATE INDEX IF NOT EXISTS idx_template_analytics_user_id ON public.template_analytics(user_id);
CREATE INDEX IF NOT EXISTS idx_template_analytics_created_at ON public.template_analytics(created_at);
CREATE INDEX IF NOT EXISTS idx_revenue_shares_creator ON public.revenue_shares(creator_user_id);
CREATE INDEX IF NOT EXISTS idx_revenue_shares_template ON public.revenue_shares(template_id);