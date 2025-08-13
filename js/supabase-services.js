// Supabase Services for DeniFinder
// Complete replacement for Firebase services

// Authentication Service
const authService = {
  // Sign up new user
  async signUp(email, password, userData = {}) {
    try {
      console.log('Starting Supabase signup for:', email);
      console.log('User data:', userData);
      
      const supabase = window.DeniFinderSupabase.getClient();
      if (!supabase) {
        throw new Error('Supabase not initialized');
      }
      
      // Create user with Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: email,
        password: password,
        options: {
          data: {
            display_name: userData.displayName || '',
            phone: userData.phone || '',
            user_type: userData.userType || 'tenant',
            first_name: userData.firstName || '',
            last_name: userData.lastName || ''
          }
        }
      });
      
      if (authError) {
        throw authError;
      }
      
      console.log('User created in Supabase Auth:', authData.user.id);
      
      // Save additional user data to users table
      const { error: profileError } = await supabase
        .from(window.DeniFinderSupabase.TABLES.USERS)
        .insert({
          id: authData.user.id,
          email: email,
          display_name: userData.displayName || '',
          phone: userData.phone || '',
          user_type: userData.userType || 'tenant',
          email_verified: false,
          account_status: 'pending_verification',
          created_at: new Date().toISOString(),
          last_login: new Date().toISOString()
        });
      
      if (profileError) {
        console.warn('Profile creation error:', profileError);
        // Don't fail the signup if profile creation fails
      }
      
      console.log('User data saved to Supabase');
      
      return { success: true, user: authData.user };
    } catch (error) {
      console.error('Sign up error:', error);
      return { success: false, error: error.message, code: error.code };
    }
  },

  // Sign in user
  async signIn(email, password) {
    try {
      const supabase = window.DeniFinderSupabase.getClient();
      if (!supabase) {
        throw new Error('Supabase not initialized');
      }
      
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: email,
        password: password
      });
      
      if (authError) {
        throw authError;
      }
      
      // Update last login
      await supabase
        .from(window.DeniFinderSupabase.TABLES.USERS)
        .update({ last_login: new Date().toISOString() })
        .eq('id', authData.user.id);
      
      return { success: true, user: authData.user };
    } catch (error) {
      console.error('Sign in error:', error);
      return { success: false, error: error.message };
    }
  },

  // Sign out user
  async signOut() {
    try {
      const supabase = window.DeniFinderSupabase.getClient();
      if (!supabase) {
        throw new Error('Supabase not initialized');
      }
      
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      return { success: true };
    } catch (error) {
      console.error('Sign out error:', error);
      return { success: false, error: error.message };
    }
  },

  // Reset password
  async resetPassword(email) {
    try {
      const supabase = window.DeniFinderSupabase.getClient();
      if (!supabase) {
        throw new Error('Supabase not initialized');
      }
      
      const { error } = await supabase.auth.resetPasswordForEmail(email);
      if (error) throw error;
      
      return { success: true };
    } catch (error) {
      console.error('Password reset error:', error);
      return { success: false, error: error.message };
    }
  },

  // Get current user
  getCurrentUser() {
    const supabase = window.DeniFinderSupabase.getClient();
    if (!supabase) return null;
    
    return supabase.auth.getUser();
  },

  // Listen to auth state changes
  onAuthStateChange(callback) {
    const supabase = window.DeniFinderSupabase.getClient();
    if (!supabase) return null;
    
    return supabase.auth.onAuthStateChange(callback);
  },

  // Check if email is verified
  async isEmailVerified() {
    const supabase = window.DeniFinderSupabase.getClient();
    if (!supabase) return false;
    
    const { data: { user } } = await supabase.auth.getUser();
    return user ? user.email_confirmed_at : false;
  }
};

// Database Service
const dbService = {
  // Add document to table
  async addDocument(tableName, data) {
    try {
      const supabase = window.DeniFinderSupabase.getClient();
      if (!supabase) {
        throw new Error('Supabase not initialized');
      }
      
      const { data: result, error } = await supabase
        .from(tableName)
        .insert({
          ...data,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();
      
      if (error) throw error;
      
      return { success: true, id: result.id, data: result };
    } catch (error) {
      console.error('Add document error:', error);
      return { success: false, error: error.message };
    }
  },

  // Set document with custom ID
  async setDocument(tableName, docId, data) {
    try {
      const supabase = window.DeniFinderSupabase.getClient();
      if (!supabase) {
        throw new Error('Supabase not initialized');
      }
      
      const { error } = await supabase
        .from(tableName)
        .upsert({
          id: docId,
          ...data,
          updated_at: new Date().toISOString()
        });
      
      if (error) throw error;
      
      return { success: true };
    } catch (error) {
      console.error('Set document error:', error);
      return { success: false, error: error.message };
    }
  },

  // Get document by ID
  async getDocument(tableName, docId) {
    try {
      const supabase = window.DeniFinderSupabase.getClient();
      if (!supabase) {
        throw new Error('Supabase not initialized');
      }
      
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .eq('id', docId)
        .single();
      
      if (error) {
        if (error.code === 'PGRST116') {
          return { success: false, error: 'Document not found' };
        }
        throw error;
      }
      
      return { success: true, data };
    } catch (error) {
      console.error('Get document error:', error);
      return { success: false, error: error.message };
    }
  },

  // Update document
  async updateDocument(tableName, docId, data) {
    try {
      const supabase = window.DeniFinderSupabase.getClient();
      if (!supabase) {
        throw new Error('Supabase not initialized');
      }
      
      const { error } = await supabase
        .from(tableName)
        .update({
          ...data,
          updated_at: new Date().toISOString()
        })
        .eq('id', docId);
      
      if (error) throw error;
      
      return { success: true };
    } catch (error) {
      console.error('Update document error:', error);
      return { success: false, error: error.message };
    }
  },

  // Delete document
  async deleteDocument(tableName, docId) {
    try {
      const supabase = window.DeniFinderSupabase.getClient();
      if (!supabase) {
        throw new Error('Supabase not initialized');
      }
      
      const { error } = await supabase
        .from(tableName)
        .delete()
        .eq('id', docId);
      
      if (error) throw error;
      
      return { success: true };
    } catch (error) {
      console.error('Delete document error:', error);
      return { success: false, error: error.message };
    }
  },

  // Query documents
  async queryDocuments(tableName, conditions = [], orderByField = null, limitCount = null) {
    try {
      const supabase = window.DeniFinderSupabase.getClient();
      if (!supabase) {
        throw new Error('Supabase not initialized');
      }
      
      let query = supabase.from(tableName).select('*');
      
      // Add where conditions
      conditions.forEach(condition => {
        if (condition.operator === '==') {
          query = query.eq(condition.field, condition.value);
        } else if (condition.operator === '!=') {
          query = query.neq(condition.field, condition.value);
        } else if (condition.operator === '>') {
          query = query.gt(condition.field, condition.value);
        } else if (condition.operator === '>=') {
          query = query.gte(condition.field, condition.value);
        } else if (condition.operator === '<') {
          query = query.lt(condition.field, condition.value);
        } else if (condition.operator === '<=') {
          query = query.lte(condition.field, condition.value);
        } else if (condition.operator === 'array-contains') {
          query = query.contains(condition.field, [condition.value]);
        }
      });
      
      // Add order by
      if (orderByField) {
        query = query.order(orderByField.field, { ascending: orderByField.direction === 'asc' });
      }
      
      // Add limit
      if (limitCount) {
        query = query.limit(limitCount);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      
      return { success: true, data: data || [] };
    } catch (error) {
      console.error('Query documents error:', error);
      return { success: false, error: error.message };
    }
  },

  // Listen to table changes (real-time)
  onTableSnapshot(tableName, callback, conditions = []) {
    const supabase = window.DeniFinderSupabase.getClient();
    if (!supabase) return null;
    
    let query = supabase
      .channel(`table-db-changes:${tableName}`)
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: tableName },
        (payload) => {
          callback(payload);
        }
      )
      .subscribe();
    
    return query;
  }
};

// Storage Service
const storageService = {
  // Upload file
  async uploadFile(file, path) {
    try {
      const supabase = window.DeniFinderSupabase.getClient();
      if (!supabase) {
        throw new Error('Supabase not initialized');
      }
      
      const { data, error } = await supabase.storage
        .from('denifinder-storage') // Replace with your bucket name
        .upload(path, file);
      
      if (error) throw error;
      
      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('denifinder-storage')
        .getPublicUrl(path);
      
      return { success: true, url: publicUrl };
    } catch (error) {
      console.error('Upload file error:', error);
      return { success: false, error: error.message };
    }
  },

  // Delete file
  async deleteFile(path) {
    try {
      const supabase = window.DeniFinderSupabase.getClient();
      if (!supabase) {
        throw new Error('Supabase not initialized');
      }
      
      const { error } = await supabase.storage
        .from('denifinder-storage')
        .remove([path]);
      
      if (error) throw error;
      
      return { success: true };
    } catch (error) {
      console.error('Delete file error:', error);
      return { success: false, error: error.message };
    }
  },

  // Get download URL
  async getDownloadURL(path) {
    try {
      const supabase = window.DeniFinderSupabase.getClient();
      if (!supabase) {
        throw new Error('Supabase not initialized');
      }
      
      const { data: { publicUrl } } = supabase.storage
        .from('denifinder-storage')
        .getPublicUrl(path);
      
      return { success: true, url: publicUrl };
    } catch (error) {
      console.error('Get download URL error:', error);
      return { success: false, error: error.message };
    }
  }
};

// Property Service
const propertyService = {
  // Add new property
  async addProperty(propertyData) {
    const user = await authService.getCurrentUser();
    if (!user) return { success: false, error: 'User not authenticated' };
    
    return await dbService.addDocument(window.DeniFinderSupabase.TABLES.PROPERTIES, {
      ...propertyData,
      owner_id: user.id,
      status: 'available',
      verified: false
    });
  },

  // Get properties by filters
  async getProperties(filters = {}) {
    const conditions = [];
    
    if (filters.location) {
      conditions.push({ field: 'location', operator: '==', value: filters.location });
    }
    
    if (filters.type) {
      conditions.push({ field: 'type', operator: '==', value: filters.type });
    }
    
    if (filters.status) {
      conditions.push({ field: 'status', operator: '==', value: filters.status });
    }
    
    if (filters.maxPrice) {
      conditions.push({ field: 'price', operator: '<=', value: filters.maxPrice });
    }
    
    return await dbService.queryDocuments(
      window.DeniFinderSupabase.TABLES.PROPERTIES, 
      conditions, 
      { field: 'created_at', direction: 'desc' }
    );
  },

  // Get user's properties
  async getUserProperties(userId) {
    return await dbService.queryDocuments(
      window.DeniFinderSupabase.TABLES.PROPERTIES, 
      [{ field: 'owner_id', operator: '==', value: userId }],
      { field: 'created_at', direction: 'desc' }
    );
  }
};

// Messaging Service
const messagingService = {
  // Send message
  async sendMessage(messageData) {
    const user = await authService.getCurrentUser();
    if (!user) return { success: false, error: 'User not authenticated' };
    
    return await dbService.addDocument(window.DeniFinderSupabase.TABLES.MESSAGES, {
      ...messageData,
      sender_id: user.id,
      timestamp: new Date().toISOString(),
      read: false
    });
  },

  // Get conversation messages
  async getConversationMessages(conversationId) {
    return await dbService.queryDocuments(
      window.DeniFinderSupabase.TABLES.MESSAGES, 
      [{ field: 'conversation_id', operator: '==', value: conversationId }],
      { field: 'timestamp', direction: 'asc' }
    );
  },

  // Mark message as read
  async markMessageAsRead(messageId) {
    return await dbService.updateDocument(
      window.DeniFinderSupabase.TABLES.MESSAGES, 
      messageId, 
      { read: true }
    );
  }
};

// Export all services
window.DeniFinderSupabase = {
  ...window.DeniFinderSupabase,
  authService,
  dbService,
  storageService,
  propertyService,
  messagingService
};
