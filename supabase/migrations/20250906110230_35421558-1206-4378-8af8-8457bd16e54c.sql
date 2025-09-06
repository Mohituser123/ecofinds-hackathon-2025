-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID NOT NULL DEFAULT auth.uid() PRIMARY KEY,
  username TEXT,
  avatar_url TEXT,
  bio TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Update eco_items table to use UUID and add missing columns
-- First, drop existing table if it exists and recreate with proper structure
DROP TABLE IF EXISTS public.eco_items CASCADE;
CREATE TABLE public.eco_items (
  id UUID NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT,
  condition TEXT,
  price NUMERIC,
  image_url TEXT,
  co2_saved NUMERIC,
  owner_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create favorites table
CREATE TABLE public.favorites (
  id UUID NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  item_id UUID NOT NULL REFERENCES public.eco_items(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, item_id)
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.eco_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Profiles are viewable by everyone" 
ON public.profiles FOR SELECT USING (true);

CREATE POLICY "Users can update their own profile" 
ON public.profiles FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" 
ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- RLS Policies for eco_items
CREATE POLICY "Eco items are viewable by everyone" 
ON public.eco_items FOR SELECT USING (true);

CREATE POLICY "Users can insert their own eco items" 
ON public.eco_items FOR INSERT WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can update their own eco items" 
ON public.eco_items FOR UPDATE USING (auth.uid() = owner_id);

CREATE POLICY "Users can delete their own eco items" 
ON public.eco_items FOR DELETE USING (auth.uid() = owner_id);

-- RLS Policies for favorites
CREATE POLICY "Users can view their own favorites" 
ON public.favorites FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own favorites" 
ON public.favorites FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own favorites" 
ON public.favorites FOR DELETE USING (auth.uid() = user_id);

-- Create storage bucket for images
INSERT INTO storage.buckets (id, name, public) VALUES ('eco-items', 'eco-items', true);

-- Storage policies for eco-items bucket
CREATE POLICY "Images are publicly accessible" 
ON storage.objects FOR SELECT USING (bucket_id = 'eco-items');

CREATE POLICY "Users can upload their own images" 
ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'eco-items' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own images" 
ON storage.objects FOR UPDATE USING (bucket_id = 'eco-items' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own images" 
ON storage.objects FOR DELETE USING (bucket_id = 'eco-items' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Create function to automatically create profile when user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username)
  VALUES (NEW.id, NEW.raw_user_meta_data ->> 'username');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Insert seed data for eco_items
INSERT INTO public.eco_items (title, description, category, condition, price, co2_saved, image_url) VALUES
('Solar Panel Kit', 'Complete 100W solar panel kit for home use. Reduces electricity bills and carbon footprint.', 'Electronics', 'New', 299.99, 2500, 'https://images.unsplash.com/photo-1509391366360-2e959784a276?w=400'),
('Bamboo Bicycle', 'Handcrafted bamboo bicycle. Lightweight, durable, and eco-friendly alternative to metal bikes.', 'Transportation', 'Like New', 450.00, 1200, 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400'),
('Reusable Water Bottles Set', 'Set of 4 stainless steel water bottles. Eliminates need for single-use plastic bottles.', 'Lifestyle', 'New', 39.99, 365, 'https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=400'),
('Compost Bin', 'Large capacity compost bin for organic waste. Reduces landfill waste and creates nutrient-rich soil.', 'Garden', 'Good', 89.99, 800, 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=400'),
('LED Light Bulbs Pack', 'Energy-efficient LED bulbs pack of 10. Lasts 25x longer than traditional bulbs.', 'Electronics', 'New', 49.99, 1800, 'https://images.unsplash.com/photo-1524484485831-a92ffc0de03f?w=400'),
('Electric Scooter', 'Foldable electric scooter for urban commuting. Zero emissions and cost-effective transportation.', 'Transportation', 'Good', 280.00, 2000, 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400'),
('Organic Cotton Tote Bags', 'Set of 5 organic cotton tote bags. Perfect replacement for plastic shopping bags.', 'Lifestyle', 'New', 24.99, 150, 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400'),
('Wind Turbine Generator', 'Small wind turbine for residential use. Generate clean energy from wind power.', 'Electronics', 'Like New', 799.99, 5000, 'https://images.unsplash.com/photo-1466611653911-95081537e5b7?w=400');