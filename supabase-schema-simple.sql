-- DeniFinder Supabase Database Schema (Simplified for Testing)
-- Run this in your Supabase SQL Editor

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

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
    owner_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
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
    sender_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    receiver_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    content TEXT NOT NULL,
    message_type TEXT DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'file')),
    read BOOLEAN DEFAULT FALSE,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Blog posts table
CREATE TABLE IF NOT EXISTS blog_posts (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    author_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
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

-- Enable Row Level Security (RLS) - BUT with permissive policies for testing
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE cities ENABLE ROW LEVEL SECURITY;

-- PERMISSIVE RLS Policies for Testing (will be tightened later)
-- Users can read/write their own data
CREATE POLICY "Users can manage own profile" ON users
    FOR ALL USING (auth.uid() = id);

-- Properties can be read by all, written by owners
CREATE POLICY "Properties are viewable by everyone" ON properties
    FOR SELECT USING (true);

CREATE POLICY "Property owners can manage their properties" ON properties
    FOR ALL USING (auth.uid() = owner_id);

-- Messages can be read/written by participants
CREATE POLICY "Users can manage their messages" ON messages
    FOR ALL USING (auth.uid() IN (sender_id, receiver_id));

-- Blog posts can be read by all, written by authors
CREATE POLICY "Blog posts are viewable by everyone" ON blog_posts
    FOR SELECT USING (true);

CREATE POLICY "Authors can manage their posts" ON blog_posts
    FOR ALL USING (auth.uid() = author_id);

-- Cities can be read by all
CREATE POLICY "Cities are viewable by everyone" ON cities
    FOR SELECT USING (true);

-- Insert some sample cities
INSERT INTO cities (name, country, region, featured) VALUES
('Blantyre', 'Malawi', 'Southern Region', true),
('Lusaka', 'Zambia', 'Lusaka Province', true),
('Lilongwe', 'Malawi', 'Central Region', true),
('Johannesburg', 'South Africa', 'Gauteng', true);

-- Create storage bucket for file uploads
-- Note: This will be created manually in the Storage section

-- Storage policies (more permissive for testing)
CREATE POLICY "Public Access" ON storage.objects
    FOR SELECT USING (true);

CREATE POLICY "Authenticated users can upload" ON storage.objects
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can update their own files" ON storage.objects
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Users can delete their own files" ON storage.objects
    FOR DELETE USING (auth.role() = 'authenticated');
