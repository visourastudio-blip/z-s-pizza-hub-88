-- Add billing_id column to orders table for PIX payment tracking
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS billing_id TEXT;

-- Create index for faster webhook lookups
CREATE INDEX IF NOT EXISTS idx_orders_billing_id ON public.orders(billing_id);