-- Add workplace_complaint to letter_type enum
ALTER TYPE letter_type ADD VALUE IF NOT EXISTS 'workplace_complaint';