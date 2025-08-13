# DeniFinder: Firebase to Supabase Migration Guide

## Overview
This guide will help you migrate your DeniFinder project from Firebase to Supabase. Supabase provides similar functionality to Firebase but with PostgreSQL as the backend and better pricing for production applications.

## Prerequisites
- Supabase account and project created
- Your Supabase project URL and anon key
- Access to your existing Firebase project for data export

## Step 1: Set Up Supabase Project

### 1.1 Create Supabase Project
1. Go to [supabase.com](https://supabase.com) and sign up/login
2. Create a new project
3. Note your project URL and anon key

### 1.2 Set Up Database Schema
1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Copy and paste the contents of `supabase-schema.sql`
4. Run the SQL script to create all tables and policies

### 1.3 Configure Authentication
1. Go to **Authentication > Settings**
2. Enable **Email confirmations** if you want email verification
3. Configure **Site URL** to your domain
4. Set up **SMTP settings** for custom email templates (optional)

### 1.4 Set Up Storage
1. Go to **Storage**
2. Create a bucket named `denifinder-storage`
3. Set it to **Public** for read access
4. The storage policies are already set up in the schema

## Step 2: Update Your HTML Files

### 2.1 Replace Firebase SDK with Supabase SDK
Replace all Firebase SDK scripts with Supabase:

**Before (Firebase):**
```html
<!-- Firebase SDK -->
<script src="https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js"></script>
<script src="https://www.gstatic.com/firebasejs/10.7.1/firebase-auth-compat.js"></script>
<script src="https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore-compat.js"></script>
<script src="https://www.gstatic.com/firebasejs/10.7.1/firebase-storage-compat.js"></script>
```

**After (Supabase):**
```html
<!-- Supabase SDK -->
<script src="https://unpkg.com/@supabase/supabase-js@2"></script>
```

### 2.2 Replace Firebase Configuration
Replace Firebase config scripts with Supabase:

**Before:**
```html
<script src="js/firebase-init.js"></script>
```

**After:**
```html
<script src="js/supabase-config.js"></script>
<script src="js/supabase-services.js"></script>
```

### 2.3 Update JavaScript Code
Replace all Firebase function calls with Supabase equivalents:

**Before (Firebase):**
```javascript
// Firebase authentication
const result = await window.DeniFinderFirebase.authService.signIn(email, password);

// Firebase database
const result = await window.DeniFinderFirebase.dbService.addDocument('users', userData);

// Firebase storage
const result = await window.DeniFinderFirebase.storageService.uploadFile(file, path);
```

**After (Supabase):**
```javascript
// Supabase authentication
const result = await window.DeniFinderSupabase.authService.signIn(email, password);

// Supabase database
const result = await window.DeniFinderSupabase.dbService.addDocument('users', userData);

// Supabase storage
const result = await window.DeniFinderSupabase.storageService.uploadFile(file, path);
```

## Step 3: Data Migration

### 3.1 Export Firebase Data
1. Go to Firebase Console > Firestore Database
2. Export your data as JSON
3. Go to Firebase Console > Storage
4. Download important files

### 3.2 Import to Supabase
1. Use Supabase's data import feature or
2. Convert Firebase data format to match Supabase schema
3. Import users, properties, messages, etc.

### 3.3 Data Format Changes
**Firebase to Supabase field mappings:**
- `createdAt` → `created_at`
- `updatedAt` → `updated_at`
- `ownerId` → `owner_id`
- `senderId` → `sender_id`
- `receiverId` → `receiver_id`
- `authorId` → `author_id`
- `postId` → `post_id`
- `userId` → `user_id`

## Step 4: Update Specific Files

### 4.1 index.html
- Replace Firebase scripts with Supabase
- Update authentication logic
- Update any Firebase-specific code

### 4.2 signin.html
- Replace Firebase authentication with Supabase
- Update form submission logic
- Test sign-in functionality

### 4.3 signup.html
- Replace Firebase user creation with Supabase
- Update form validation
- Test user registration

### 4.4 dashboard.html
- Replace Firebase data fetching with Supabase
- Update real-time listeners
- Test dashboard functionality

### 4.5 blog.html
- Replace Firebase blog operations with Supabase
- Update post creation, editing, deletion
- Test blog functionality

### 4.6 add-property.html
- Replace Firebase property creation with Supabase
- Update image upload to Supabase storage
- Test property addition

## Step 5: Testing

### 5.1 Authentication Testing
- Test user signup
- Test user signin
- Test password reset
- Test email verification

### 5.2 Database Testing
- Test property creation
- Test property queries
- Test user data management
- Test real-time updates

### 5.3 Storage Testing
- Test image uploads
- Test file downloads
- Test file deletions

## Step 6: Deployment

### 6.1 Update Production Files
- Replace all Firebase references with Supabase
- Test thoroughly in staging environment
- Deploy to production

### 6.2 Environment Variables
- Set Supabase URL and key as environment variables
- Update any hardcoded credentials

## Common Issues and Solutions

### Issue: "Supabase not initialized"
**Solution:** Ensure Supabase SDK is loaded before your custom scripts

### Issue: "Permission denied" errors
**Solution:** Check Row Level Security policies in Supabase

### Issue: Authentication not working
**Solution:** Verify Supabase auth settings and email templates

### Issue: Storage uploads failing
**Solution:** Check storage bucket policies and bucket name

### Issue: Real-time subscriptions not working
**Solution:** Ensure proper channel subscription and error handling

## Performance Optimizations

### 1. Database Indexes
- Already included in the schema
- Monitor query performance in Supabase dashboard

### 2. Storage Optimization
- Use appropriate image formats
- Implement image compression
- Use CDN for better delivery

### 3. Caching
- Implement client-side caching for frequently accessed data
- Use Supabase's built-in caching features

## Security Considerations

### 1. Row Level Security (RLS)
- All tables have RLS enabled
- Policies restrict access based on user authentication
- Test all access patterns thoroughly

### 2. API Key Security
- Never expose service role key in client code
- Use anon key for client-side operations
- Implement proper server-side validation

### 3. File Upload Security
- Validate file types and sizes
- Implement proper file path restrictions
- Use signed URLs for sensitive files

## Monitoring and Maintenance

### 1. Supabase Dashboard
- Monitor database performance
- Check authentication logs
- Review storage usage

### 2. Error Tracking
- Implement proper error logging
- Monitor client-side errors
- Set up alerts for critical issues

### 3. Backup Strategy
- Supabase provides automatic backups
- Consider additional backup solutions for critical data

## Rollback Plan

If issues arise during migration:

1. **Keep Firebase project active** during transition
2. **Implement feature flags** to switch between services
3. **Maintain data synchronization** between both systems
4. **Have rollback scripts** ready
5. **Test rollback process** before going live

## Support Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Supabase Community](https://github.com/supabase/supabase/discussions)
- [Supabase Discord](https://discord.supabase.com)

## Next Steps

1. **Set up Supabase project** and run the schema
2. **Update one file at a time** to test functionality
3. **Migrate data** from Firebase to Supabase
4. **Test thoroughly** in development environment
5. **Deploy incrementally** to production
6. **Monitor performance** and user experience

## Conclusion

This migration will provide you with:
- Better database performance with PostgreSQL
- More cost-effective pricing for production
- Better SQL querying capabilities
- Improved real-time features
- Better developer experience

Take your time with the migration and test each component thoroughly before moving to the next.
