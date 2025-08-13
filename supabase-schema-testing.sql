-- DeniFinder Supabase Database Schema (Very Permissive for Testing)
-- WARNING: This is for testing only - NOT for production!
-- Run this in your Supabase SQL Editor

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop existing tables if they exist (for clean testing)
DROP TABLE IF EXISTS properties CASCADE;
DROP TABLE IF EXISTS messages CASCADE;
DROP TABLE IF EXISTS blog_posts CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS cities CASCADE;

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    display_name TEXT,
    phone TEXT,
    user_type TEXT DEFAULT 'tenant' CHECK (user_type IN ('tenant', 'landlord', 'admin')),
    email_verified BOOLEAN DEFAULT FALSE,
    account_status TEXT DEFAULT 'pending_verification' CHECK (account_status IN ('pending_verification', 'active', 'suspended')),
    profile_image_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_login TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Properties table
CREATE TABLE IF NOT EXISTS properties (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    owner_id UUID, -- Remove foreign key constraint for testing
    title TEXT NOT NULL,
    description TEXT,
    type TEXT NOT NULL CHECK (type IN ('hostel', 'house', 'apartment', 'quarter')),
    location TEXT NOT NULL,
    address TEXT,
    price DECIMAL(10,2),
    currency TEXT DEFAULT 'USD',
    bedrooms INTEGER,
    bathrooms INTEGER,
    area_sqm DECIMAL(8,2),
    status TEXT DEFAULT 'available' CHECK (status IN ('available', 'rented', 'sold', 'pending')),
    verified BOOLEAN DEFAULT FALSE,
    featured BOOLEAN DEFAULT FALSE,
    images TEXT[], -- Array of image URLs
    amenities TEXT[], -- Array of amenities
    coordinates POINT, -- For map integration
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Messages table
CREATE TABLE IF NOT EXISTS messages (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    conversation_id UUID,
    sender_id UUID, -- Remove foreign key constraint for testing
    receiver_id UUID, -- Remove foreign key constraint for testing
    content TEXT NOT NULL,
    message_type TEXT DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'file')),
    read BOOLEAN DEFAULT FALSE,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Blog posts table
CREATE TABLE IF NOT EXISTS blog_posts (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    author_id UUID, -- Remove foreign key constraint for testing
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    excerpt TEXT,
    featured_image_url TEXT,
    tags TEXT[],
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
    published_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Cities table
CREATE TABLE IF NOT EXISTS cities (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    country TEXT NOT NULL,
    region TEXT,
    coordinates POINT,
    featured BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_properties_owner_id ON properties(owner_id);
CREATE INDEX IF NOT EXISTS idx_properties_location ON properties(location);
CREATE INDEX IF NOT EXISTS idx_properties_status ON properties(status);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_receiver_id ON messages(receiver_id);
CREATE INDEX IF NOT EXISTS idx_blog_posts_author_id ON blog_posts(author_id);

-- Enable Row Level Security (RLS) - BUT with VERY permissive policies for testing
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE cities ENABLE ROW LEVEL SECURITY;

-- VERY PERMISSIVE RLS Policies for Testing (NOT for production!)
-- Allow ALL operations on all tables for testing
CREATE POLICY "Allow all operations on users" ON users FOR ALL USING (true);
CREATE POLICY "Allow all operations on properties" ON properties FOR ALL USING (true);
CREATE POLICY "Allow all operations on messages" ON messages FOR ALL USING (true);
CREATE POLICY "Allow all operations on blog_posts" ON blog_posts FOR ALL USING (true);
CREATE POLICY "Allow all operations on cities" ON cities FOR ALL USING (true);

-- Insert some sample cities
INSERT INTO cities (name, country, region, featured) VALUES
('Blantyre', 'Malawi', 'Southern Region', true),
('Lusaka', 'Zambia', 'Lusaka Province', true),
('Lilongwe', 'Malawi', 'Central Region', true),
('Johannesburg', 'South Africa', 'Gauteng', true);

-- Storage policies (very permissive for testing)
CREATE POLICY "Allow all storage operations" ON storage.objects FOR ALL USING (true);
