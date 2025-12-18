-- Create table to store restaurant settings
CREATE TABLE public.restaurant_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  is_open boolean NOT NULL DEFAULT true,
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_by uuid REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE public.restaurant_settings ENABLE ROW LEVEL SECURITY;

-- Everyone can read the status
CREATE POLICY "Anyone can view restaurant status"
ON public.restaurant_settings
FOR SELECT
USING (true);

-- Only employees/admins can update
CREATE POLICY "Employees can update restaurant status"
ON public.restaurant_settings
FOR UPDATE
USING (has_role(auth.uid(), 'employee') OR has_role(auth.uid(), 'admin'));

-- Insert initial row
INSERT INTO public.restaurant_settings (is_open) VALUES (true);