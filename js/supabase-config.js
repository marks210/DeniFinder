// Supabase Configuration for DeniFinder
// Replace Firebase with Supabase

// Supabase configuration
const SUPABASE_CONFIG = {
  url: 'https://hpwnnbzkxgdyxccazwhe.supabase.co',
  anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhwd25uYnpreGdkeXhjY2F6d2hlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ5NTMwNTcsImV4cCI6MjA3MDUyOTA1N30.Wv6oR0_4fRcFpICtd9_jPU0OWuC0kIGnA20DEsOq5Ek'
};

// Initialize Supabase client
let supabaseClient;

// Initialize Supabase
function initializeSupabase() {
  try {
    // Check if Supabase is loaded
    if (typeof supabase === 'undefined') {
      console.error('Supabase SDK not loaded. Please include the Supabase CDN script.');
      return false;
    }
    
    supabaseClient = supabase.createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.anonKey);
    console.log('Supabase initialized successfully');
    return true;
  } catch (error) {
    console.error('Error initializing Supabase:', error);
    return false;
  }
}

// Collection names (Supabase tables)
const TABLES = {
  USERS: 'users',
  PROPERTIES: 'properties',
  MESSAGES: 'messages',
  NOTIFICATIONS: 'notifications',
  BLOG_POSTS: 'blog_posts',
  POST_LIKES: 'post_likes',
  POST_COMMENTS: 'post_comments',
  POST_REPOSTS: 'post_reposts',
  ADVANCE_ASSIST: 'advance_assist',
  VERIFICATIONS: 'verifications',
  PAYMENTS: 'payments',
  REVIEWS: 'reviews',
  CITIES: 'cities',
  CONVERSATIONS: 'conversations'
};

// Export for use in other scripts
window.DeniFinderSupabase = {
  initializeSupabase,
  TABLES,
  SUPABASE_CONFIG,
  getClient: () => supabaseClient
};

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
  // Check if Supabase is already loaded
  if (typeof supabase !== 'undefined') {
    initializeSupabase();
  } else {
    // Wait for Supabase to load
    const checkSupabase = setInterval(() => {
      if (typeof supabase !== 'undefined') {
        initializeSupabase();
        clearInterval(checkSupabase);
      }
    }, 100);
  }
});
