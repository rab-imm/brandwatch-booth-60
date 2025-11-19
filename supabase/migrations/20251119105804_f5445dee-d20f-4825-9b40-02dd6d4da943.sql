ALTER TABLE ocr_history 
ADD COLUMN IF NOT EXISTS substantive_risk_analysis JSONB;