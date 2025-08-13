-- DeniFinder Supabase Database Schema
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

-- Conversations table
CREATE TABLE IF NOT EXISTS conversations (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    participants UUID[] NOT NULL, -- Array of user IDs
    last_message TEXT,
    last_timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    property_id UUID REFERENCES properties(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
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

-- Post likes table
CREATE TABLE IF NOT EXISTS post_likes (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    post_id UUID REFERENCES blog_posts(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(post_id, user_id)
);

-- Post comments table
CREATE TABLE IF NOT EXISTS post_comments (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    post_id UUID REFERENCES blog_posts(id) ON DELETE CASCADE NOT NULL,
    author_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    content TEXT NOT NULL,
    parent_comment_id UUID REFERENCES post_comments(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Post reposts table
CREATE TABLE IF NOT EXISTS post_reposts (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    post_id UUID REFERENCES blog_posts(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(post_id, user_id)
);

-- Notifications table
CREATE TABLE IF NOT EXISTS notifications (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT DEFAULT 'info' CHECK (type IN ('info', 'success', 'warning', 'error')),
    read BOOLEAN DEFAULT FALSE,
    data JSONB, -- Additional data for the notification
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Advance assist requests table
CREATE TABLE IF NOT EXISTS advance_assist (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    request_type TEXT NOT NULL CHECK (request_type IN ('property_search', 'viewing_schedule', 'legal_assistance', 'verification')),
    description TEXT NOT NULL,
    location TEXT,
    budget_min DECIMAL(10,2),
    budget_max DECIMAL(10,2),
    property_type TEXT,
    urgency TEXT DEFAULT 'normal' CHECK (urgency IN ('low', 'normal', 'high', 'urgent')),
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
    assigned_agent_id UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Property verifications table
CREATE TABLE IF NOT EXISTS verifications (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    property_id UUID REFERENCES properties(id) ON DELETE CASCADE NOT NULL,
    verification_type TEXT NOT NULL CHECK (verification_type IN ('ownership', 'location', 'condition', 'legal')),
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'verified', 'failed')),
    verifier_id UUID REFERENCES users(id),
    verification_date TIMESTAMP WITH TIME ZONE,
    notes TEXT,
    documents TEXT[], -- Array of document URLs
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Payments table
CREATE TABLE IF NOT EXISTS payments (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    currency TEXT DEFAULT 'USD',
    payment_type TEXT NOT NULL CHECK (payment_type IN ('subscription', 'featured_listing', 'verification', 'advance_assist')),
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
    payment_method TEXT,
    transaction_id TEXT,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Reviews table
CREATE TABLE IF NOT EXISTS reviews (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    property_id UUID REFERENCES properties(id) ON DELETE CASCADE NOT NULL,
    reviewer_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    title TEXT,
    comment TEXT,
    verified_booking BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(property_id, reviewer_id)
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
CREATE INDEX IF NOT EXISTS idx_properties_type ON properties(type);
CREATE INDEX IF NOT EXISTS idx_properties_price ON properties(price);
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_receiver_id ON messages(receiver_id);
CREATE INDEX IF NOT EXISTS idx_blog_posts_author_id ON blog_posts(author_id);
CREATE INDEX IF NOT EXISTS idx_blog_posts_status ON blog_posts(status);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);

-- Enable Row Level Security (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_reposts ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE advance_assist ENABLE ROW LEVEL SECURITY;
ALTER TABLE verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE cities ENABLE ROW LEVEL SECURITY;

-- RLS Policies

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

-- Conversations can be read/written by participants
CREATE POLICY "Users can manage their conversations" ON conversations
    FOR ALL USING (auth.uid() = ANY(participants));

-- Blog posts can be read by all, written by authors
CREATE POLICY "Blog posts are viewable by everyone" ON blog_posts
    FOR SELECT USING (status = 'published');

CREATE POLICY "Authors can manage their posts" ON blog_posts
    FOR ALL USING (auth.uid() = author_id);

-- Post interactions can be managed by users
CREATE POLICY "Users can manage their post interactions" ON post_likes
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their comments" ON post_comments
    FOR ALL USING (auth.uid() = author_id);

CREATE POLICY "Users can manage their reposts" ON post_reposts
    FOR ALL USING (auth.uid() = user_id);

-- Notifications can be read/written by the user
CREATE POLICY "Users can manage their notifications" ON notifications
    FOR ALL USING (auth.uid() = user_id);

-- Advance assist can be managed by the requesting user
CREATE POLICY "Users can manage their advance assist requests" ON advance_assist
    FOR ALL USING (auth.uid() = user_id);

-- Verifications can be read by property owners, written by verifiers
CREATE POLICY "Property owners can view verifications" ON verifications
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM properties 
            WHERE properties.id = verifications.property_id 
            AND properties.owner_id = auth.uid()
        )
    );

-- Payments can be managed by the user
CREATE POLICY "Users can manage their payments" ON payments
    FOR ALL USING (auth.uid() = user_id);

-- Reviews can be read by all, written by reviewers
CREATE POLICY "Reviews are viewable by everyone" ON reviews
    FOR SELECT USING (true);

CREATE POLICY "Reviewers can manage their reviews" ON reviews
    FOR ALL USING (auth.uid() = reviewer_id);

-- Cities can be read by all
CREATE POLICY "Cities are viewable by everyone" ON cities
    FOR SELECT USING (true);

-- Create storage bucket for file uploads
-- Note: This will be created manually in the Storage section
-- INSERT INTO storage.buckets (id, name, public) 
-- VALUES ('denifinder-storage', 'denifinder-storage', true);

-- Storage policies
CREATE POLICY "Public Access" ON storage.objects
    FOR SELECT USING (bucket_id = 'denifinder-storage');

CREATE POLICY "Authenticated users can upload" ON storage.objects
    FOR INSERT WITH CHECK (bucket_id = 'denifinder-storage' AND auth.role() = 'authenticated');

CREATE POLICY "Users can update their own files" ON storage.objects
    FOR UPDATE USING (bucket_id = 'denifinder-storage' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own files" ON storage.objects
    FOR DELETE USING (bucket_id = 'denifinder-storage' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Insert some sample cities
INSERT INTO cities (name, country, region, featured) VALUES
('Blantyre', 'Malawi', 'Southern Region', true),
('Lusaka', 'Zambia', 'Lusaka Province', true),
('Lilongwe', 'Malawi', 'Central Region', true),
('Johannesburg', 'South Africa', 'Gauteng', true);
