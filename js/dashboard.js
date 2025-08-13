// Dashboard JavaScript - DeniFinder

document.addEventListener('DOMContentLoaded', function() {
    // Check authentication first
    checkAuthentication();
    
    // Initialize dashboard
    initializeDashboard();
    
    // Set up event listeners
    setupEventListeners();
    
    // Load initial data
    loadDashboardData();
    
    // Initialize carousel and search functionality
    initializeCarousel();
    initializeSearchFeatures();
    
    // Update message badges
    updateMessageBadges();
});

// Authentication check
function checkAuthentication() {
    const isLoggedIn = localStorage.getItem('deniFinderLoggedIn');
    const currentUser = localStorage.getItem('deniFinderCurrentUser');
    
    if (!isLoggedIn || !currentUser) {
        // Redirect to signin page if not logged in
        window.location.href = 'signin.html';
        return;
    }
    
    // Load user data
    try {
        const user = JSON.parse(currentUser);
        // Set default role if not present
        if (!user.role) {
            user.role = 'renter';
            localStorage.setItem('deniFinderCurrentUser', JSON.stringify(user));
        }
        updateUserNames(user.role);
    } catch (error) {
        console.error('Error parsing user data:', error);
        // Redirect to signin if user data is corrupted
        window.location.href = 'signin.html';
    }
}

// Post creation variables
let selectedTags = [];
let uploadedImage = null;
let currentUserRole = 'renter'; // Will be updated based on actual user role

function initializeDashboard() {
    // Get user role from localStorage
    const currentUser = localStorage.getItem('deniFinderCurrentUser');
    if (currentUser) {
        try {
            const user = JSON.parse(currentUser);
            currentUserRole = user.role || 'renter';
        } catch (error) {
            console.error('Error parsing user data:', error);
            currentUserRole = 'renter';
        }
    }
    
    // Initialize role switcher with current role
    switchRole(currentUserRole);
    
    // Initialize blog section
    initializeBlog();
    
    // Test Supabase connection
    testSupabaseConnection();

    // Initialize dashboard map (for all users)
    initDashboardMap();
}

// --- Dashboard Map Integration ---
let dashboardMap = null;
let mapService = null;

async function initDashboardMap() {
    try {
        // Check if map container exists
        const mapContainer = document.getElementById('dashboardMap');
        if (!mapContainer) {
            console.error('Dashboard map container not found');
            return;
        }
        // Check if Leaflet is loaded
        if (typeof L === 'undefined') {
            console.error('Leaflet not loaded');
            showMapError('Map library not loaded. Please refresh the page.');
            return;
        }
        // Check if map service is available
        if (typeof MapService === 'undefined') {
            console.error('MapService not loaded');
            showMapError('Map service not available. Please refresh the page.');
            return;
        }
        // Initialize map service
        mapService = new MapService();
        // Initialize map with Nairobi, Kenya coordinates
        dashboardMap = mapService.initMap('dashboardMap', [-1.2921, 36.8219], 10);
        // Load and display available properties
        await loadDashboardProperties();
    } catch (error) {
        console.error('Error initializing dashboard map:', error);
        showMapError('Failed to load map. Please try refreshing the page.');
    }
}

async function loadDashboardProperties() {
    try {
        if (!mapService) {
            console.error('MapService not initialized');
            return;
        }
        // Load properties from Supabase or fallback to sample data
        const properties = await mapService.loadProperties();
        // Show only available properties (limit to 8 for dashboard)
        const availableProperties = properties.filter(p => p.status === 'available').slice(0, 8);
        if (availableProperties.length > 0) {
            mapService.addMarkersToMap(availableProperties);
            mapService.fitMapToMarkers();
            updateMapWidgetInfo(availableProperties.length);
        } else {
            showMapMessage('No available properties found in this area.');
        }
    } catch (error) {
        console.error('Error loading dashboard properties:', error);
        showMapError('Failed to load properties. Please try again.');
    }
}

function showMapError(message) {
    const mapContainer = document.getElementById('dashboardMap');
    if (mapContainer) {
        mapContainer.innerHTML = `
            <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; background: #f8f9fa; border-radius: 8px; color: #dc3545; text-align: center; padding: 2rem;">
                <i class="fas fa-exclamation-triangle" style="font-size: 2rem; margin-bottom: 1rem;"></i>
                <p style="margin: 0; font-weight: 600;">${message}</p>
                <button onclick="initDashboardMap()" style="background: #FFB800; color: #222; border: none; padding: 0.5rem 1rem; border-radius: 4px; margin-top: 1rem; cursor: pointer; font-weight: 600;">
                    <i class="fas fa-redo"></i> Retry
                </button>
            </div>
        `;
    }
}

function showMapMessage(message) {
    const mapContainer = document.getElementById('dashboardMap');
    if (mapContainer) {
        mapContainer.innerHTML = `
            <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; background: #f8f9fa; border-radius: 8px; color: #6c757d; text-align: center; padding: 2rem;">
                <i class="fas fa-map-marker-alt" style="font-size: 2rem; margin-bottom: 1rem;"></i>
                <p style="margin: 0; font-weight: 600;">${message}</p>
                <button onclick="window.location.href='map.html'" style="background: #FFB800; color: #222; border: none; padding: 0.5rem 1rem; border-radius: 4px; margin-top: 1rem; cursor: pointer; font-weight: 600;">
                    <i class="fas fa-search"></i> Search Properties
                </button>
            </div>
        `;
    }
}

function updateMapWidgetInfo(propertyCount) {
    const mapWidget = document.querySelector('.map-widget');
    if (mapWidget) {
        const existingInfo = mapWidget.querySelector('.map-info');
        if (existingInfo) {
            existingInfo.remove();
        }
        const infoDiv = document.createElement('div');
        infoDiv.className = 'map-info';
        infoDiv.style.cssText = `background: rgba(255, 184, 0, 0.1); padding: 0.5rem; border-radius: 4px; margin-top: 0.5rem; font-size: 0.9rem; color: #222; text-align: center;`;
        infoDiv.innerHTML = `<i class="fas fa-home"></i> ${propertyCount} available property${propertyCount !== 1 ? 'ies' : ''} shown`;
        mapWidget.appendChild(infoDiv);
    }
}

function setupEventListeners() {
    // Role switcher buttons
    const roleButtons = document.querySelectorAll('.role-btn');
    const roleSwitchLoading = document.getElementById('roleSwitchLoading');
    roleButtons.forEach(button => {
        button.addEventListener('click', async function() {
            const role = this.dataset.role;
            // Show loading overlay
            if (roleSwitchLoading) roleSwitchLoading.classList.add('show');
            // Small delay for UX (optional, can be removed)
            await new Promise(res => setTimeout(res, 200));
            // Switch role (if switchRole is not async, this is fine)
            await switchRole(role);
            // Hide loading overlay
            if (roleSwitchLoading) roleSwitchLoading.classList.remove('show');
        });
    });
    
    // Logout button
    const logoutBtn = document.querySelector('.logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function() {
            // Clear authentication data
            localStorage.removeItem('deniFinderLoggedIn');
            localStorage.removeItem('deniFinderCurrentUser');
            
            // Redirect to home page
            window.location.href = 'index.html';
        });
    }
    
    // Search button
    const searchBtn = document.querySelector('.search-btn');
    if (searchBtn) {
        searchBtn.addEventListener('click', function() {
            handleSearch();
        });
    }
    
    // Map buttons
    const mapBtns = document.querySelectorAll('.map-btn');
    mapBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            handleMapClick();
        });
    });
    
    // Advance Assist button
    const assistBtn = document.querySelector('.assist-btn');
    if (assistBtn) {
        assistBtn.addEventListener('click', function() {
            handleAdvanceAssist();
        });
    }
    
    // Add listing button
    const addListingBtn = document.querySelector('.add-listing-btn');
    if (addListingBtn) {
        addListingBtn.addEventListener('click', function() {
            handleAddListing();
        });
    }
    
    // Add post button
    const addPostBtn = document.querySelector('#addPostBtn');
    if (addPostBtn) {
        addPostBtn.addEventListener('click', function() {
            handleAddPost();
        });
    }
}

function switchRole(role) {
    // Validate role
    const validRoles = ['renter', 'landlord', 'admin'];
    if (!validRoles.includes(role)) {
        console.error('Invalid role:', role);
        role = 'renter'; // Default to renter if invalid
    }
    
    // Update global variable
    currentUserRole = role;
    
    // Update user data in localStorage
    try {
        const currentUser = localStorage.getItem('deniFinderCurrentUser');
        if (currentUser) {
            const user = JSON.parse(currentUser);
            user.role = role;
            localStorage.setItem('deniFinderCurrentUser', JSON.stringify(user));
        }
    } catch (error) {
        console.error('Error updating user role in localStorage:', error);
    }
    
    // Update role buttons
    const roleButtons = document.querySelectorAll('.role-btn');
    roleButtons.forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.role === role) {
            btn.classList.add('active');
        }
    });
    
    // Update role switcher data attribute
    const roleSwitcher = document.getElementById('roleSwitcher');
    if (roleSwitcher) {
        roleSwitcher.setAttribute('data-active-role', role);
    }
    
    // Update role badge
    const roleBadge = document.getElementById('roleBadge');
    if (roleBadge) {
        roleBadge.textContent = role.charAt(0).toUpperCase() + role.slice(1);
    }
    
    // Show/hide dashboard content
    const renterDashboard = document.getElementById('renterDashboard');
    const adminDashboard = document.getElementById('adminDashboard');
    const addPostBtn = document.getElementById('addPostBtn');
    const subscriptionInfo = document.getElementById('subscriptionInfo');
    const blogAccessMessage = document.getElementById('blogAccessMessage');
    const landlordDashboardBtn = document.getElementById('landlordDashboardBtn');
    const paidAdvertsRenter = document.getElementById('paidAdvertsRenter');
    const paidAdvertsAdmin = document.getElementById('paidAdvertsAdmin');
    
    if (role === 'renter') {
        if (renterDashboard) renterDashboard.classList.remove('hidden');
        if (adminDashboard) adminDashboard.classList.add('hidden');
        // Renters can only view posts, not create them
        if (addPostBtn) addPostBtn.classList.add('hidden');
        if (subscriptionInfo) subscriptionInfo.classList.remove('hidden');
        if (blogAccessMessage) blogAccessMessage.classList.remove('hidden');
        if (landlordDashboardBtn) landlordDashboardBtn.style.display = 'none';
        if (paidAdvertsRenter) paidAdvertsRenter.classList.remove('hidden');
        if (paidAdvertsAdmin) paidAdvertsAdmin.classList.add('hidden');
    } else if (role === 'landlord') {
        if (renterDashboard) renterDashboard.classList.add('hidden');
        if (adminDashboard) adminDashboard.classList.remove('hidden');
        // Landlords can create posts
        if (addPostBtn) addPostBtn.classList.remove('hidden');
        if (subscriptionInfo) subscriptionInfo.classList.add('hidden');
        if (blogAccessMessage) blogAccessMessage.classList.add('hidden');
        if (landlordDashboardBtn) landlordDashboardBtn.style.display = 'flex';
        if (paidAdvertsRenter) paidAdvertsRenter.classList.add('hidden');
        if (paidAdvertsAdmin) paidAdvertsAdmin.classList.remove('hidden');
    } else {
        // Admin role
        if (renterDashboard) renterDashboard.classList.add('hidden');
        if (adminDashboard) adminDashboard.classList.remove('hidden');
        // Admins can create posts
        if (addPostBtn) addPostBtn.classList.remove('hidden');
        if (subscriptionInfo) subscriptionInfo.classList.add('hidden');
        if (blogAccessMessage) blogAccessMessage.classList.add('hidden');
        if (landlordDashboardBtn) landlordDashboardBtn.style.display = 'none';
        if (paidAdvertsRenter) paidAdvertsRenter.classList.add('hidden');
        if (paidAdvertsAdmin) paidAdvertsAdmin.classList.remove('hidden');
    }
    
    // Update user names
    updateUserNames(role);
    
    // Load role-specific data
    loadRoleSpecificData(role);
}

// Make switchRole globally accessible
window.switchRole = switchRole;

function updateUserNames(role) {
    const renterName = document.getElementById('renterName');
    const adminName = document.getElementById('adminName');
    const userName = document.getElementById('userName');
    
    // Get actual user data
    const currentUser = localStorage.getItem('deniFinderCurrentUser');
    let displayName = 'User';
    
    if (currentUser) {
        try {
            const user = JSON.parse(currentUser);
            // Use various name fields with fallbacks
            displayName = user.firstName || 
                         user.displayName || 
                         user.name || 
                         user.email?.split('@')[0] || 
                         'User';
        } catch (error) {
            console.error('Error parsing user data in updateUserNames:', error);
            displayName = 'User';
        }
    }
    
    // Update all name elements if they exist
    if (renterName) renterName.textContent = displayName;
    if (adminName) adminName.textContent = displayName;
    if (userName) userName.textContent = displayName;
}

function loadRoleSpecificData(role) {
    if (role === 'renter') {
        loadRenterData();
    } else {
        loadAdminData();
    }
}

function loadRenterData() {
    // Load saved listings, messages, etc.
    console.log('Loading renter data...');
}

let unsubscribeMyListings = null;

async function loadAdminData() {
    // Load listings, messages from renters, etc.
    console.log('Loading admin data...');
    // Unsubscribe previous listener if any
    if (unsubscribeMyListings) unsubscribeMyListings();
    // Fetch and render My Listings in real-time
    const currentUser = localStorage.getItem('deniFinderCurrentUser');
    if (!currentUser) return;
    const user = JSON.parse(currentUser);
    const userId = user.uid;
            if (window.DeniFinderSupabase && window.DeniFinderSupabase.dbService) {
            // Use Supabase database service
        const listingsTable = document.querySelector('#adminDashboard .listings-table tbody');
        if (!listingsTable) return;
        listingsTable.innerHTML = '<tr><td colspan="4">Loading...</td></tr>';
        try {
            unsubscribeMyListings = db.collection('properties')
                .where('ownerId', '==', userId)
                .orderBy('createdAt', 'desc')
                .onSnapshot(snapshot => {
                    if (snapshot.empty) {
                        listingsTable.innerHTML = '<tr><td colspan="4">No properties found.</td></tr>';
                        return;
                    }
                    listingsTable.innerHTML = '';
                    snapshot.forEach(doc => {
                        const p = doc.data();
                        listingsTable.innerHTML += `
                        <tr>
                            <td>${p.title || ''}</td>
                            <td><span class="status ${p.status}">${p.status.charAt(0).toUpperCase() + p.status.slice(1)}${p.status !== 'available' && p.availableFrom ? `<br><small>From: ${p.availableFrom}</small>` : ''}</span></td>
                            <td>${p.views || 0}</td>
                            <td>
                                <button class="action-btn edit"><i class="fas fa-edit"></i></button>
                                <button class="action-btn delete"><i class="fas fa-trash"></i></button>
                            </td>
                        </tr>
                        `;
                    });
                }, err => {
                    listingsTable.innerHTML = '<tr><td colspan="4">Error loading properties.</td></tr>';
                });
        } catch (err) {
            listingsTable.innerHTML = '<tr><td colspan="4">Error loading properties.</td></tr>';
        }
    }
}

function loadDashboardData() {
    // Load common data like blog posts
    loadBlogPosts();
}

function initializeBlog() {
    // Initialize blog functionality
    loadBlogPosts();
}

function loadBlogPosts() {
    // This function loads real blog posts from Supabase without refreshing the page
    console.log('Loading blog posts...');
    
    const blogPostsContainer = document.getElementById('blogPosts');
    if (!blogPostsContainer) {
        console.error('Blog posts container not found!');
        return;
    }
    
    // Show loading state
    blogPostsContainer.innerHTML = '<div style="text-align: center; padding: 2rem;"><i class="fas fa-spinner fa-spin"></i> Loading posts...</div>';
    
    // Load posts asynchronously
    setTimeout(async () => {
        try {
            let posts = [];
            
            // Try to load from Supabase first
            if (window.DeniFinderSupabase && window.DeniFinderSupabase.dbService) {
                console.log('Supabase available, querying blog posts...');
                
                const result = await window.DeniFinderSupabase.dbService.queryDocuments(
                    'blog_posts',
                    [{ field: 'status', operator: '==', value: 'published' }],
                    { field: 'created_at', direction: 'desc' },
                    20 // Limit to 20 most recent posts
                );
                
                console.log('Supabase query result:', result);
                
                if (result.success) {
                    posts = result.data;
                    console.log('Posts loaded from Supabase:', posts.length);
                } else {
                    console.warn('Failed to load posts from Supabase, using sample data');
                    posts = getSamplePosts();
                }
            } else {
                console.log('Supabase not available, using sample posts');
                posts = getSamplePosts();
            }
            
            // Render blog posts
            if (posts.length === 0) {
                blogPostsContainer.innerHTML = `
                    <div style="text-align: center; padding: 2rem; color: #666;">
                        <i class="fas fa-newspaper"></i>
                        <h4>No posts yet</h4>
                        <p>Be the first to create a blog post!</p>
                    </div>
                `;
            } else {
                blogPostsContainer.innerHTML = posts.map(post => `
                    <div class="blog-post" data-post-id="${post.id || ''}">
                        <div class="post-header">
                            <h4>${post.title}</h4>
                            <div class="post-meta">
                                <span class="author">By ${post.authorName || 'Anonymous'}</span>
                                <span class="date">${formatDate(post.timestamp)}</span>
                                <span class="read-time">${estimateReadTime(post.content)} min read</span>
                            </div>
                        </div>
                        ${post.excerpt ? `<p class="post-excerpt">${post.excerpt}</p>` : ''}
                        ${post.imageUrl ? `<img src="${post.imageUrl}" alt="Featured Image" style="width: 100%; max-width: 300px; border-radius: 8px; margin: 1rem 0;">` : ''}
                        
                        <div class="post-actions">
                            <button class="action-btn like-btn" onclick="handleLike(this)" data-post-id="${post.id || ''}">
                                <i class="fas fa-heart"></i> <span class="like-count">${post.likes || 0}</span>
                            </button>
                            <button class="action-btn comment-btn" onclick="toggleComments(this)" data-post-id="${post.id || ''}">
                                <i class="fas fa-comment"></i> <span class="comment-count">${post.comments ? post.comments.length : 0}</span>
                            </button>
                            <button class="action-btn repost-btn" onclick="handleRepost(this)" data-post-id="${post.id || ''}">
                                <i class="fas fa-retweet"></i> <span class="repost-count">${post.reposts || 0}</span>
                            </button>
                            <button class="action-btn save-btn" onclick="handleSave(this)" data-post-id="${post.id || ''}">
                                <i class="fas fa-bookmark"></i>
                            </button>
                            <button class="action-btn message-btn" onclick="messageAuthor(this)" style="background: var(--sky-blue); color: white; border: none; padding: 0.5rem 1rem; border-radius: 8px; margin-left: auto;">
                                <i class="fas fa-envelope"></i> Message Author
                            </button>
                        </div>
                    </div>
                `).join('');
            }
        } catch (error) {
            console.error('Error loading blog posts:', error);
            blogPostsContainer.innerHTML = `
                <div style="text-align: center; padding: 2rem; color: #666;">
                    <i class="fas fa-exclamation-triangle"></i>
                    <h4>Error loading posts</h4>
                    <p>Please try again later.</p>
                    <button onclick="loadBlogPosts()" style="background: var(--gold); color: var(--charcoal); border: none; padding: 0.5rem 1rem; border-radius: 4px; margin-top: 1rem; cursor: pointer;">
                        <i class="fas fa-redo"></i> Retry
                    </button>
                </div>
            `;
        }
    }, 100); // Small delay to show loading state
}

// Get sample posts for fallback
function getSamplePosts() {
    return [
        {
            id: 'sample1',
            title: 'Top 5 Tips for Finding Student Housing',
            excerpt: 'Essential advice for students looking for affordable accommodation in Nairobi. Learn about the best areas, budgeting tips, and how to avoid common pitfalls...',
            authorName: 'DeniFinder Team',
            timestamp: new Date('2024-01-15'),
            likes: 24,
            comments: [],
            reposts: 3,
            content: 'Essential advice for students looking for affordable accommodation...'
        },
        {
            id: 'sample2',
            title: 'Understanding Rental Agreements in Kenya',
            excerpt: 'Everything you need to know about rental contracts and your rights as a tenant in Kenya. Important legal information for both landlords and tenants...',
            authorName: 'Legal Expert',
            timestamp: new Date('2024-01-12'),
            likes: 31,
            comments: [],
            reposts: 7,
            content: 'Everything you need to know about rental contracts and your rights...'
        }
    ];
}

// Estimate read time
function estimateReadTime(content) {
    const wordsPerMinute = 200;
    const wordCount = content.replace(/<[^>]*>/g, '').split(/\s+/).length;
    const readTime = Math.ceil(wordCount / wordsPerMinute);
    return readTime < 1 ? 1 : readTime;
}

// Test Supabase connection
async function testSupabaseConnection() {
    console.log('Testing Supabase connection...');
    
    if (window.DeniFinderSupabase) {
        console.log('✅ DeniFinderSupabase object found');
        
        if (window.DeniFinderSupabase.dbService) {
            console.log('✅ Database service available');
            
            // Test a simple query
            try {
                const testResult = await window.DeniFinderSupabase.dbService.queryDocuments(
                    'blog_posts',
                    [],
                    { field: 'timestamp', direction: 'desc' },
                    1
                );
                console.log('✅ Supabase query test result:', testResult);
            } catch (error) {
                console.error('❌ Supabase query test failed:', error);
            }
        } else {
            console.log('❌ Database service not available');
        }
        
        if (window.DeniFinderSupabase.storageService) {
            console.log('✅ Storage service available');
        } else {
            console.log('❌ Storage service not available');
        }
    } else {
        console.log('❌ DeniFinderSupabase object not found');
    }
}

// Test blog loading function
async function testBlogLoading() {
    console.log('🧪 Testing blog loading...');
    
    // Check if container exists
    const container = document.getElementById('blogPosts');
    console.log('Blog container found:', !!container);
    
    if (!container) {
        alert('Blog container not found!');
        return;
    }
    
    // Test Supabase connection
    if (window.DeniFinderSupabase && window.DeniFinderSupabase.dbService) {
        console.log('🔍 Testing Supabase query...');
        
        try {
            const result = await window.DeniFinderSupabase.dbService.queryDocuments(
                'blog_posts',
                [],
                { field: 'timestamp', direction: 'desc' },
                5
            );
            
            console.log('📊 Query result:', result);
            
            if (result.success) {
                console.log('📝 Found posts:', result.data.length);
                result.data.forEach((post, index) => {
                    console.log(`Post ${index + 1}:`, {
                        id: post.id,
                        title: post.title,
                        authorName: post.authorName,
                        timestamp: post.timestamp,
                        content: post.content?.substring(0, 50) + '...'
                    });
                });
                
                // Try to render one post manually
                if (result.data.length > 0) {
                    console.log('🎨 Testing post rendering...');
                    addPostToBlog(result.data[0]);
                }
            } else {
                console.error('❌ Query failed:', result.error);
            }
        } catch (error) {
            console.error('❌ Query error:', error);
        }
    } else {
        console.log('❌ Supabase not available');
    }
}

function formatDate(timestamp) {
    // Handle different timestamp formats (Supabase timestamp, Date object, or string)
    let date;
    
    if (timestamp && timestamp.toDate) {
        // Supabase timestamp
        date = timestamp.toDate();
    } else if (timestamp instanceof Date) {
        // Date object
        date = timestamp;
    } else if (typeof timestamp === 'string') {
        // String date
        date = new Date(timestamp);
    } else {
        // Fallback to current date
        date = new Date();
    }
    
    return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
    });
}

// Event handlers
function handleSearch() {
    const searchInput = document.querySelector('.search-input');
    const filterSelect = document.querySelector('.filter-select');
    const budgetInput = document.querySelector('.budget-input');
    
    const searchData = {
        location: searchInput.value,
        type: filterSelect.value,
        budget: budgetInput.value
    };
    
    console.log('Search initiated:', searchData);
    alert('Search functionality will be implemented with backend integration');
}

function handleMapClick() {
    console.log('Map view requested');
    alert('Map functionality will be implemented with Google Maps integration');
}

function handleAdvanceAssist() {
    console.log('Advance Assist requested');
    alert('Advance Assist booking will be implemented with payment integration');
}

function handleAddListing() {
    console.log('Add listing requested');
    alert('Add listing form will be implemented with image upload and location services');
}

function handleAddPost() {
    console.log('Add blog post requested');
    openPostModal();
}

function openPostModal() {
    console.log('Opening post modal...');
    console.log('Current user role:', currentUserRole);
    
    const postModal = document.getElementById('postModal');
    const paymentNotice = document.getElementById('paymentNotice');
    const publishText = document.getElementById('publishText');
    
    if (!postModal) {
        console.error('Post modal not found!');
        alert('Post modal not found. Please refresh the page.');
        return;
    }
    
    // Show/hide payment notice based on user role
    if (currentUserRole === 'admin') {
        if (paymentNotice) paymentNotice.style.display = 'none';
        if (publishText) publishText.textContent = 'Publish Post (Free)';
    } else {
        if (paymentNotice) paymentNotice.style.display = 'block';
        if (publishText) publishText.textContent = 'Publish Post (KSh 500)';
    }
    
    postModal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
    
    console.log('Post modal opened successfully');
}

function closePostModal() {
    const postModal = document.getElementById('postModal');
    postModal.classList.add('hidden');
    document.body.style.overflow = 'auto';
    
    // Reset form
    resetPostForm();
}

function resetPostForm() {
    document.getElementById('postForm').reset();
    document.getElementById('postContent').innerHTML = '';
    selectedTags = [];
    uploadedImage = null;
    updateSelectedTags();
    resetImageUpload();
}

// Rich Text Editor Functions
function formatText(command) {
    document.execCommand(command, false, null);
    document.getElementById('postContent').focus();
}

function insertLink() {
    const url = prompt('Enter URL:');
    if (url) {
        document.execCommand('createLink', false, url);
    }
    document.getElementById('postContent').focus();
}

function insertImage() {
    const url = prompt('Enter image URL:');
    if (url) {
        document.execCommand('insertImage', false, url);
    }
    document.getElementById('postContent').focus();
}

// Tags System Functions
function handleTagInput(event) {
    if (event.key === 'Enter') {
        event.preventDefault();
        const tagInput = document.getElementById('tagInput');
        const tag = tagInput.value.trim();
        
        if (tag && !selectedTags.includes(tag)) {
            addTag(tag);
            tagInput.value = '';
        }
    }
}

function addTag(tag) {
    if (!selectedTags.includes(tag)) {
        selectedTags.push(tag);
        updateSelectedTags();
    }
}

function removeTag(tag) {
    selectedTags = selectedTags.filter(t => t !== tag);
    updateSelectedTags();
}

function updateSelectedTags() {
    const selectedTagsContainer = document.getElementById('selectedTags');
    selectedTagsContainer.innerHTML = selectedTags.map(tag => `
        <div class="tag-item">
            ${tag}
            <button type="button" class="remove-tag" onclick="removeTag('${tag}')">
                <i class="fas fa-times"></i>
            </button>
        </div>
    `).join('');
}

// Enhanced post interaction functions
function toggleComments(button) {
    const post = button.closest('.blog-post');
    const commentsSection = post.querySelector('.comments-section');
    const isHidden = commentsSection.classList.contains('hidden');
    
    if (isHidden) {
        commentsSection.classList.remove('hidden');
        button.innerHTML = '<i class="fas fa-comment"></i> <span class="comment-count">Hide Comments</span>';
    } else {
        commentsSection.classList.add('hidden');
        const commentCount = post.querySelector('.comment-count').textContent;
        button.innerHTML = `<i class="fas fa-comment"></i> <span class="comment-count">${commentCount}</span>`;
    }
}

function submitComment(button) {
    const commentForm = button.closest('.comment-form');
    const commentInput = commentForm.querySelector('.comment-input');
    const commentText = commentInput.value.trim();
    
    if (!commentText) {
        alert('Please enter a comment');
        return;
    }
    
    const commentsList = commentForm.nextElementSibling;
    const newComment = createCommentElement('Current User', commentText);
    commentsList.insertBefore(newComment, commentsList.firstChild);
    
    // Update comment count
    const post = button.closest('.blog-post');
    const commentBtn = post.querySelector('.comment-btn');
    const currentCount = parseInt(commentBtn.querySelector('.comment-count').textContent);
    commentBtn.querySelector('.comment-count').textContent = currentCount + 1;
    
    // Clear input
    commentInput.value = '';
    
    showNotification('Comment posted successfully!', 'success');
}

function createCommentElement(author, text) {
    const commentDiv = document.createElement('div');
    commentDiv.className = 'comment';
    commentDiv.innerHTML = `
        <div class="comment-avatar">${author.charAt(0).toUpperCase()}</div>
        <div class="comment-content">
            <div class="comment-header">
                <span class="comment-author">${author}</span>
                <span class="comment-date">Just now</span>
            </div>
            <p class="comment-text">${text}</p>
            <div class="comment-actions">
                <button class="comment-like" onclick="handleCommentLike(this)">
                    <i class="fas fa-heart"></i> 0
                </button>
                <button class="comment-reply" onclick="showReplyForm(this)">Reply</button>
            </div>
        </div>
    `;
    return commentDiv;
}

function showReplyForm(button) {
    const commentContent = button.closest('.comment-content');
    const existingReplyForm = commentContent.querySelector('.reply-form');
    
    if (existingReplyForm) {
        existingReplyForm.remove();
        return;
    }
    
    const replyForm = document.createElement('div');
    replyForm.className = 'reply-form';
    replyForm.innerHTML = `
        <textarea placeholder="Write a reply..." class="reply-input"></textarea>
        <div class="reply-actions">
            <button class="reply-submit" onclick="submitReply(this)">Post Reply</button>
            <button class="reply-cancel" onclick="hideReplyForm(this)">Cancel</button>
        </div>
    `;
    
    commentContent.appendChild(replyForm);
    replyForm.querySelector('.reply-input').focus();
}

function hideReplyForm(button) {
    const replyForm = button.closest('.reply-form');
    replyForm.remove();
}

function submitReply(button) {
    const replyForm = button.closest('.reply-form');
    const replyInput = replyForm.querySelector('.reply-input');
    const replyText = replyInput.value.trim();
    
    if (!replyText) {
        alert('Please enter a reply');
        return;
    }
    
    const commentContent = replyForm.closest('.comment-content');
    let repliesContainer = commentContent.querySelector('.replies');
    
    if (!repliesContainer) {
        repliesContainer = document.createElement('div');
        repliesContainer.className = 'replies';
        commentContent.appendChild(repliesContainer);
    }
    
    const newReply = createReplyElement('Current User', replyText);
    repliesContainer.appendChild(newReply);
    
    replyForm.remove();
    showNotification('Reply posted successfully!', 'success');
}

function createReplyElement(author, text) {
    const replyDiv = document.createElement('div');
    replyDiv.className = 'reply';
    replyDiv.innerHTML = `
        <div class="comment-avatar">${author.charAt(0).toUpperCase()}</div>
        <div class="reply-content">
            <div class="comment-header">
                <span class="comment-author">${author}</span>
                <span class="comment-date">Just now</span>
            </div>
            <p class="comment-text">${text}</p>
            <div class="comment-actions">
                <button class="comment-like" onclick="handleCommentLike(this)">
                    <i class="fas fa-heart"></i> 0
                </button>
            </div>
        </div>
    `;
    return replyDiv;
}

function handleCommentLike(button) {
    const icon = button.querySelector('i');
    const likeCount = button.textContent.match(/\d+/)[0];
    
    if (icon.classList.contains('liked')) {
        icon.classList.remove('liked');
        button.innerHTML = `<i class="fas fa-heart"></i> ${parseInt(likeCount) - 1}`;
    } else {
        icon.classList.add('liked');
        button.innerHTML = `<i class="fas fa-heart liked"></i> ${parseInt(likeCount) + 1}`;
    }
}

async function handleRepost(button) {
    const postId = button.dataset.postId;
    const repostCount = button.querySelector('.repost-count');
    const currentCount = parseInt(repostCount.textContent);
    
    try {
        // Get current user
        const currentUser = localStorage.getItem('deniFinderCurrentUser');
        if (!currentUser) {
            alert('Please sign in to repost');
            return;
        }
        
        const user = JSON.parse(currentUser);
        
        // Check if user already reposted
        const hasReposted = await checkIfReposted(postId, user.uid);
        
        if (hasReposted) {
            // Remove repost
            await removeRepost(postId, user.uid);
            repostCount.textContent = currentCount - 1;
            button.classList.remove('reposted');
        } else {
            // Add repost
            await addRepost(postId, user.uid, user.displayName || user.firstName || 'Anonymous');
            repostCount.textContent = currentCount + 1;
            button.classList.add('reposted');
        }
    } catch (error) {
        console.error('Error handling repost:', error);
        alert('Failed to update repost. Please try again.');
    }
}

// Check if user has reposted
async function checkIfReposted(postId, userId) {
    if (!window.DeniFinderSupabase || !window.DeniFinderSupabase.dbService) {
        return false;
    }
    
    try {
        const result = await window.DeniFinderSupabase.dbService.queryDocuments(
            'post_reposts',
            [
                { field: 'post_id', operator: '==', value: postId },
                { field: 'user_id', operator: '==', value: userId }
            ]
        );
        
        return result.success && result.data.length > 0;
    } catch (error) {
        console.error('Error checking repost status:', error);
        return false;
    }
}

// Add repost
async function addRepost(postId, userId, userName) {
    if (!window.DeniFinderSupabase || !window.DeniFinderSupabase.dbService) {
        console.log('Supabase not available, repost saved locally');
        return;
    }
    
    try {
        // Add repost to collection
        const repostData = {
            post_id: postId,
            user_id: userId,
            user_name: userName,
            created_at: new Date()
        };
        
        await window.DeniFinderSupabase.dbService.addDocument('post_reposts', repostData);
        
        // Update post repost count
        const postRef = await window.DeniFinderSupabase.dbService.getDocument('blog_posts', postId);
        if (postRef.success) {
            const currentReposts = postRef.data.reposts || 0;
            await window.DeniFinderSupabase.dbService.updateDocument('blog_posts', postId, {
                reposts: currentReposts + 1
            });
        }
        
        console.log('Post reposted successfully');
    } catch (error) {
        console.error('Error reposting:', error);
        throw error;
    }
}

// Remove repost
async function removeRepost(postId, userId) {
    if (!window.DeniFinderSupabase || !window.DeniFinderSupabase.dbService) {
        console.log('Supabase not available, repost removal saved locally');
        return;
    }
    
    try {
        // Remove repost from collection
        const repostsResult = await window.DeniFinderSupabase.dbService.queryDocuments(
            'post_reposts',
            [
                { field: 'post_id', operator: '==', value: postId },
                { field: 'user_id', operator: '==', value: userId }
            ]
        );
        
        if (repostsResult.success && repostsResult.data.length > 0) {
            await window.DeniFinderSupabase.dbService.deleteDocument('post_reposts', repostsResult.data[0].id);
        }
        
        // Update post repost count
        const postRef = await window.DeniFinderSupabase.dbService.getDocument('blog_posts', postId);
        if (postRef.success) {
            const currentReposts = Math.max(0, (postRef.data.reposts || 0) - 1);
            await window.DeniFinderSupabase.dbService.updateDocument('blog_posts', postId, {
                reposts: currentReposts
            });
        }
        
        console.log('Repost removed successfully');
    } catch (error) {
        console.error('Error removing repost:', error);
        throw error;
    }
}

function showRepostModal(repostData) {
    const modal = document.createElement('div');
    modal.className = 'repost-modal';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3><i class="fas fa-share"></i> Repost</h3>
                <button class="close-btn" onclick="this.parentElement.parentElement.parentElement.remove()">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="modal-body">
                <div class="original-post">
                    <h4>Original Post: ${repostData.title}</h4>
                    <p>${repostData.excerpt}</p>
                    <small>By ${repostData.originalAuthor} on ${repostData.originalDate}</small>
                </div>
                <div class="repost-form">
                    <label>Add your thoughts (optional):</label>
                    <textarea placeholder="Share why you're reposting this..." class="repost-comment"></textarea>
                </div>
                <div class="repost-actions">
                    <button class="repost-btn" onclick="confirmRepost('${repostData.title}')">
                        <i class="fas fa-share"></i> Repost
                    </button>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Add repost modal styles
    if (!document.querySelector('#repost-modal-styles')) {
        const modalStyles = `
            .repost-modal {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0,0,0,0.5);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 10000;
                animation: fadeIn 0.3s;
            }
            
            .original-post {
                background: var(--gray-light);
                padding: 1rem;
                border-radius: 8px;
                margin-bottom: 1rem;
            }
            
            .repost-form {
                margin-bottom: 1rem;
            }
            
            .repost-form label {
                display: block;
                margin-bottom: 0.5rem;
                font-weight: 600;
                color: var(--charcoal);
            }
            
            .repost-comment {
                width: 100%;
                padding: 0.8rem;
                border: 2px solid var(--gray-light);
                border-radius: 8px;
                font-family: inherit;
                resize: vertical;
                min-height: 80px;
            }
            
            .repost-comment:focus {
                outline: none;
                border-color: var(--gold);
            }
            
            .repost-btn {
                background: var(--gold);
                color: var(--charcoal);
                border: none;
                padding: 0.8rem 1.5rem;
                border-radius: 20px;
                font-weight: 600;
                cursor: pointer;
                transition: all 0.3s;
                display: flex;
                align-items: center;
                gap: 0.5rem;
            }
            
            .repost-btn:hover {
                background: var(--gold-dark);
                color: var(--white);
            }
        `;
        
        const styleSheet = document.createElement('style');
        styleSheet.id = 'repost-modal-styles';
        styleSheet.textContent = modalStyles;
        document.head.appendChild(styleSheet);
    }
}

function confirmRepost(title) {
    const modal = document.querySelector('.repost-modal');
    if (modal) modal.remove();
    
    showNotification(`Reposted: ${title}`, 'success');
    
    // Update repost count
    const repostBtn = document.querySelector('.repost-btn');
    if (repostBtn) {
        const repostCount = repostBtn.querySelector('.repost-count');
        const currentCount = parseInt(repostCount.textContent);
        repostCount.textContent = currentCount + 1;
    }
}

function handleSave(button) {
    const icon = button.querySelector('i');
    
    if (button.classList.contains('saved')) {
        button.classList.remove('saved');
        icon.style.color = '';
        icon.className = 'fas fa-bookmark';
    } else {
        button.classList.add('saved');
        icon.style.color = '#FFB800';
        icon.className = 'fas fa-bookmark';
    }
}

        // Enhanced image upload functionality with Supabase Storage
function handleImageUpload(event) {
    const file = event.target.files[0];
    if (file) {
        if (file.size > 5 * 1024 * 1024) { // 5MB limit
            alert('Image size must be less than 5MB');
            return;
        }
        
        // Show loading state
        const uploadArea = document.getElementById('uploadArea');
        if (uploadArea) {
            uploadArea.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Uploading...';
        }
        
        // Upload to Supabase Storage
        uploadImageToStorage(file);
    }
}

// Upload image to Supabase Storage
async function uploadImageToStorage(file) {
    try {
        // Check if Supabase Storage is available
        if (!window.DeniFinderSupabase || !window.DeniFinderSupabase.storageService) {
            // Fallback to base64 for now
        const reader = new FileReader();
        reader.onload = function(e) {
            uploadedImage = e.target.result;
            showImagePreview(uploadedImage);
        };
        reader.readAsDataURL(file);
            return;
        }
        
        // Generate unique filename
        const timestamp = Date.now();
        const fileName = `blog-images/${timestamp}_${file.name}`;
        
        // Upload to Supabase Storage
        const result = await window.DeniFinderSupabase.storageService.uploadFile(file, fileName);
        
        if (result.success) {
            // Store the download URL
            uploadedImage = result.downloadURL;
            showImagePreview(uploadedImage);
            
            console.log('Image uploaded successfully:', result.downloadURL);
        } else {
            throw new Error(result.error || 'Upload failed');
        }
        
    } catch (error) {
        console.error('Error uploading image:', error);
        alert('Failed to upload image. Please try again.');
        
        // Reset upload area
        const uploadArea = document.getElementById('uploadArea');
        if (uploadArea) {
            uploadArea.innerHTML = `
                <i class="fas fa-cloud-upload-alt"></i>
                <p>Click to upload or drag and drop</p>
                <span>PNG, JPG up to 5MB</span>
            `;
        }
    }
}

function showImagePreview(imageSrc) {
    const uploadArea = document.getElementById('uploadArea');
    const imagePreview = document.getElementById('imagePreview');
    const previewImg = document.getElementById('previewImg');
    
    if (uploadArea && imagePreview && previewImg) {
        previewImg.src = imageSrc;
        uploadArea.classList.add('hidden');
        imagePreview.classList.remove('hidden');
    }
}

function removeImage() {
    uploadedImage = null;
    resetImageUpload();
}

function resetImageUpload() {
    const uploadArea = document.getElementById('uploadArea');
    const imagePreview = document.getElementById('imagePreview');
    const fileInput = document.getElementById('postImage');
    
    if (uploadArea && imagePreview && fileInput) {
        uploadArea.classList.remove('hidden');
        imagePreview.classList.add('hidden');
        fileInput.value = '';
    }
}

// Preview Functions
function previewPost() {
    const title = document.getElementById('postTitle').value;
    const content = document.getElementById('postContent').innerHTML;
    const excerpt = document.getElementById('postExcerpt').value;
    
    if (!title || !content) {
        alert('Please fill in the title and content before previewing.');
        return;
    }
    
    const previewContent = document.getElementById('previewContent');
    previewContent.innerHTML = `
        <h1>${title}</h1>
        <div class="post-meta">
            <span><i class="fas fa-user"></i> ${currentUserRole === 'admin' ? 'Admin' : 'User'}</span>
            <span><i class="fas fa-calendar"></i> ${new Date().toLocaleDateString()}</span>
            ${excerpt ? `<span><i class="fas fa-quote-left"></i> ${excerpt}</span>` : ''}
        </div>
        ${selectedTags.length > 0 ? `
            <div class="post-tags">
                ${selectedTags.map(tag => `<span>${tag}</span>`).join('')}
            </div>
        ` : ''}
        ${uploadedImage ? `<img src="${uploadedImage}" alt="Featured Image" style="width: 100%; max-width: 400px; border-radius: 8px; margin-bottom: 1rem;">` : ''}
        <div class="post-content">${content}</div>
    `;
    
    document.getElementById('previewModal').classList.remove('hidden');
}

function closePreviewModal() {
    document.getElementById('previewModal').classList.add('hidden');
}

function confirmPublish() {
    closePreviewModal();
    handlePostSubmit();
}

// Form Submission
function handlePostSubmit(event) {
    if (event) event.preventDefault();
    
    const title = document.getElementById('postTitle').value;
    const content = document.getElementById('postContent').innerHTML;
    const excerpt = document.getElementById('postExcerpt').value;
    
    if (!title || !content) {
        alert('Please fill in the title and content.');
        return;
    }
    
    const postData = {
        title,
        content,
        excerpt,
        tags: selectedTags,
                    imageUrl: uploadedImage, // Now stores Supabase Storage URL
        author: currentUserRole === 'admin' ? 'Admin' : 'User',
        date: new Date().toISOString(),
        likes: 0,
        comments: []
    };
    
    // TEMPORARILY DISABLED: Allow all users to post for free
    // TODO: Re-enable payment check later
        publishPost(postData);
    
    // ORIGINAL CODE (commented out for now):
    // if (currentUserRole === 'admin') {
    //     // Admin posts for free
    //     publishPost(postData);
    // } else {
    //     // Regular user needs to pay
    //     showPaymentModal(postData);
    // }
}

// Payment Functions
function showPaymentModal(postData) {
    // Redirect to payment page with post data
    const paymentUrl = `payment.html?type=post&amount=500&postTitle=${encodeURIComponent(postData.title)}`;
    window.location.href = paymentUrl;
}

function processPostPayment(postData) {
    // This function is now handled by payment.html
    // After successful payment, user will be redirected back
    console.log('Payment processing moved to dedicated payment page');
}

function showAdminUpgradeModal() {
    // Redirect to payment page for admin upgrade
    const paymentUrl = `payment.html?type=admin&amount=2000`;
    window.location.href = paymentUrl;
}

// Check for payment success on page load
document.addEventListener('DOMContentLoaded', function() {
    const urlParams = new URLSearchParams(window.location.search);
    const upgraded = urlParams.get('upgraded');
    const postPaid = urlParams.get('post_paid');
    
    if (upgraded === 'true') {
        showNotification('Congratulations! You are now an admin. You can post for free!', 'success');
        // Update user role
        currentUserRole = 'admin';
        switchRole('admin');
    }
    
    if (postPaid === 'true') {
        showNotification('Payment successful! You can now publish your post.', 'success');
        // Reopen post modal
        setTimeout(() => {
            openPostModal();
        }, 1000);
    }
});

async function publishPost(postData) {
    try {
    console.log('Publishing post:', postData);
    
        // Get current user
        const currentUser = localStorage.getItem('deniFinderCurrentUser');
        if (!currentUser) {
            alert('Please sign in to publish posts');
            return;
        }
        
        const user = JSON.parse(currentUser);
        console.log('Current user:', user);
        
        // Prepare post data for Supabase
        const supabasePostData = {
            title: postData.title,
            content: postData.content,
            excerpt: postData.excerpt || '',
            tags: postData.tags || [],
            imageUrl: postData.image || null,
            authorId: user.uid,
            authorName: user.displayName || user.firstName || 'Anonymous',
            authorEmail: user.email,
            timestamp: new Date(),
            likes: 0,
            comments: [],
            reposts: 0,
            status: 'published',
            views: 0
        };
        
        console.log('Supabase post data:', supabasePostData);
        
        // Save to Supabase Database
        if (window.DeniFinderSupabase && window.DeniFinderSupabase.dbService) {
            console.log('Supabase available, saving to database...');
            const result = await window.DeniFinderSupabase.dbService.addDocument('blog_posts', supabasePostData);
            
            console.log('Supabase save result:', result);
            
            if (result.success) {
                // Add post to local blog section immediately
                addPostToBlog(supabasePostData);
    
    // Show success message
    showNotification('Post published successfully!', 'success');
    
    // Reset form
    resetPostForm();
                
                // Close modal
                closePostModal();
                
                // Reload blog posts to show the new post
                setTimeout(() => {
                    loadBlogPosts();
                }, 1000);
            } else {
                throw new Error(result.error || 'Failed to save post');
            }
        } else {
            console.log('Supabase not available, saving locally...');
            // Fallback: save locally if Supabase not available
            addPostToBlog(postData);
            showNotification('Post published (saved locally)!', 'success');
            resetPostForm();
            closePostModal();
        }
        
    } catch (error) {
        console.error('Error publishing post:', error);
        alert('Failed to publish post: ' + error.message);
    }
}

function addPostToBlog(postData) {
    const blogPosts = document.getElementById('blogPosts');
    
    console.log('Adding post to blog:', postData);
    
    const postElement = document.createElement('div');
    postElement.className = 'blog-post';
    
    // Handle different data formats (Supabase vs local)
    const authorName = postData.authorName || postData.author || 'Anonymous';
    const timestamp = postData.timestamp || postData.date || new Date();
    const likes = postData.likes || 0;
    const comments = postData.comments || [];
    const excerpt = postData.excerpt || postData.content?.substring(0, 150) + '...' || '';
    
    // Convert Supabase timestamp to Date if needed
    const postDate = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    
    postElement.innerHTML = `
        <h4>${postData.title}</h4>
        ${excerpt ? `<p>${excerpt}</p>` : ''}
        <div class="blog-meta">
            <span class="author">By ${authorName}</span>
            <span class="date">${postDate.toLocaleDateString()}</span>
        </div>
        <div class="blog-actions">
            <button class="like-btn" onclick="handleLike(this)">
                <i class="fas fa-heart"></i> ${likes}
            </button>
            <button class="comment-btn">
                <i class="fas fa-comment"></i> ${comments.length}
            </button>
        </div>
    `;
    
    // Add to beginning of blog posts
    blogPosts.insertBefore(postElement, blogPosts.firstChild);
    
    console.log('Post added to blog successfully');
}

// Helper functions for blog functionality
function handleLike(button) {
    const likeCount = button.querySelector('.like-count');
    const currentCount = parseInt(likeCount.textContent);
    const icon = button.querySelector('i');
    
    if (button.classList.contains('liked')) {
        likeCount.textContent = currentCount - 1;
        button.classList.remove('liked');
        icon.style.color = '';
    } else {
        likeCount.textContent = currentCount + 1;
        button.classList.add('liked');
        icon.style.color = '#e74c3c';
    }
}

function toggleComments(button) {
    const postCard = button.closest('.blog-post');
    const commentsSection = postCard.querySelector('.comments-section');
    
    if (commentsSection) {
        commentsSection.classList.toggle('hidden');
    }
}

function handleRepost(button) {
    const repostCount = button.querySelector('.repost-count');
    const currentCount = parseInt(repostCount.textContent);
    const icon = button.querySelector('i');
    
    if (button.classList.contains('reposted')) {
        repostCount.textContent = currentCount - 1;
        button.classList.remove('reposted');
        icon.style.color = '';
    } else {
        repostCount.textContent = currentCount + 1;
        button.classList.add('reposted');
        icon.style.color = '#4CAF50';
    }
}

function handleSave(button) {
    const icon = button.querySelector('i');
    
    if (button.classList.contains('saved')) {
        button.classList.remove('saved');
        icon.style.color = '';
        icon.className = 'fas fa-bookmark';
    } else {
        button.classList.add('saved');
        icon.style.color = '#FFB800';
        icon.className = 'fas fa-bookmark';
    }
}

function messageAuthor(button) {
    const postCard = button.closest('.blog-post');
    const authorName = postCard.querySelector('.author').textContent.replace('By ', '');
    const postTitle = postCard.querySelector('h4').textContent;
    
    // Redirect to messages with author info
    const messageText = `Hi ${authorName}, I'm interested in your blog post "${postTitle}". Can we discuss this further?`;
    const encodedMessage = encodeURIComponent(messageText);
    
    window.location.href = `messages.html?to=${encodeURIComponent(authorName)}&message=${encodedMessage}`;
}

function loadBlogPosts() {
    // This function loads real blog posts from Supabase without refreshing the page
    console.log('Loading blog posts...');
    
    const blogPostsContainer = document.getElementById('blogPosts');
    if (!blogPostsContainer) {
        console.error('Blog posts container not found!');
        return;
    }
    
    // Show loading state
    blogPostsContainer.innerHTML = '<div style="text-align: center; padding: 2rem;"><i class="fas fa-spinner fa-spin"></i> Loading posts...</div>';
    
    // Load posts asynchronously
    setTimeout(async () => {
        try {
            let posts = [];
            
            // Try to load from Supabase first
            if (window.DeniFinderSupabase && window.DeniFinderSupabase.dbService) {
                console.log('Supabase available, querying blog posts...');
                
                const result = await window.DeniFinderSupabase.dbService.queryDocuments(
                    'blog_posts',
                    [{ field: 'status', operator: '==', value: 'published' }],
                    { field: 'created_at', direction: 'desc' },
                    20 // Limit to 20 most recent posts
                );
                
                console.log('Supabase query result:', result);
                
                if (result.success) {
                    posts = result.data;
                    console.log('Posts loaded from Supabase:', posts.length);
                } else {
                    console.warn('Failed to load posts from Supabase, using sample data');
                    posts = getSamplePosts();
                }
            } else {
                console.log('Supabase not available, using sample posts');
                posts = getSamplePosts();
            }
            
            // Render blog posts
            if (posts.length === 0) {
                blogPostsContainer.innerHTML = `
                    <div style="text-align: center; padding: 2rem; color: #666;">
                        <i class="fas fa-newspaper"></i>
                        <h4>No posts yet</h4>
                        <p>Be the first to create a blog post!</p>
                    </div>
                `;
            } else {
                blogPostsContainer.innerHTML = posts.map(post => `
                    <div class="blog-post" data-post-id="${post.id || ''}">
                        <div class="post-header">
                            <h4>${post.title}</h4>
                            <div class="post-meta">
                                <span class="author">By ${post.authorName || 'Anonymous'}</span>
                                <span class="date">${formatDate(post.timestamp)}</span>
                                <span class="read-time">${estimateReadTime(post.content)} min read</span>
                            </div>
                        </div>
                        ${post.excerpt ? `<p class="post-excerpt">${post.excerpt}</p>` : ''}
                        ${post.imageUrl ? `<img src="${post.imageUrl}" alt="Featured Image" style="width: 100%; max-width: 300px; border-radius: 8px; margin: 1rem 0;">` : ''}
                        
                        <div class="post-actions">
                            <button class="action-btn like-btn" onclick="handleLike(this)" data-post-id="${post.id || ''}">
                                <i class="fas fa-heart"></i> <span class="like-count">${post.likes || 0}</span>
                            </button>
                            <button class="action-btn comment-btn" onclick="toggleComments(this)" data-post-id="${post.id || ''}">
                                <i class="fas fa-comment"></i> <span class="comment-count">${post.comments ? post.comments.length : 0}</span>
                            </button>
                            <button class="action-btn repost-btn" onclick="handleRepost(this)" data-post-id="${post.id || ''}">
                                <i class="fas fa-retweet"></i> <span class="repost-count">${post.reposts || 0}</span>
                            </button>
                            <button class="action-btn save-btn" onclick="handleSave(this)" data-post-id="${post.id || ''}">
                                <i class="fas fa-bookmark"></i>
                            </button>
                            <button class="action-btn message-btn" onclick="messageAuthor(this)" style="background: var(--sky-blue); color: white; border: none; padding: 0.5rem 1rem; border-radius: 8px; margin-left: auto;">
                                <i class="fas fa-envelope"></i> Message Author
                            </button>
                        </div>
                    </div>
                `).join('');
            }
        } catch (error) {
            console.error('Error loading blog posts:', error);
            blogPostsContainer.innerHTML = `
                <div style="text-align: center; padding: 2rem; color: #666;">
                    <i class="fas fa-exclamation-triangle"></i>
                    <h4>Error loading posts</h4>
                    <p>Please try again later.</p>
                    <button onclick="loadBlogPosts()" style="background: var(--gold); color: var(--charcoal); border: none; padding: 0.5rem 1rem; border-radius: 4px; margin-top: 1rem; cursor: pointer;">
                        <i class="fas fa-redo"></i> Retry
                    </button>
                </div>
            `;
        }
    }, 100); // Small delay to show loading state
}

function handleUpgrade() {
    const upgradeData = {
        plan: 'Admin Subscription',
        price: '$2000/month',
        features: [
            'Create and manage blog posts',
            'Access to admin dashboard',
            'Property listing management',
            'Priority customer support',
            'Advanced analytics'
        ]
    };
    
    console.log('Upgrade requested:', upgradeData);
    
    // Show upgrade modal or redirect to payment page
    showUpgradeModal(upgradeData);
}

function showUpgradeModal(upgradeData) {
    const modal = document.createElement('div');
    modal.className = 'upgrade-modal';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3><i class="fas fa-crown"></i> Upgrade to Admin</h3>
                <button class="close-btn" onclick="this.parentElement.parentElement.parentElement.remove()">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="modal-body">
                <div class="plan-details">
                    <h4>${upgradeData.plan}</h4>
                    <div class="price">${upgradeData.price}</div>
                    <ul class="features">
                        ${upgradeData.features.map(feature => `<li><i class="fas fa-check"></i> ${feature}</li>`).join('')}
                    </ul>
                </div>
                <div class="payment-section">
                    <p>Ready to become an admin and start posting?</p>
                    <button class="pay-btn" onclick="processPayment()">
                        <i class="fas fa-credit-card"></i> Pay $2000/month
                    </button>
                    <p class="terms">By upgrading, you agree to our terms of service and subscription policy.</p>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Add modal styles
    const modalStyles = `
        .upgrade-modal {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.5);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 10000;
            animation: fadeIn 0.3s;
        }
        
        .modal-content {
            background: var(--white);
            border-radius: 20px;
            max-width: 500px;
            width: 90%;
            max-height: 90vh;
            overflow-y: auto;
            box-shadow: 0 20px 60px rgba(0,0,0,0.3);
        }
        
        .modal-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 1.5rem;
            border-bottom: 1px solid var(--gray-light);
        }
        
        .modal-header h3 {
            color: var(--charcoal);
            display: flex;
            align-items: center;
            gap: 0.5rem;
        }
        
        .close-btn {
            background: none;
            border: none;
            font-size: 1.2rem;
            cursor: pointer;
            color: var(--gray);
            padding: 0.5rem;
            border-radius: 50%;
            transition: all 0.3s;
        }
        
        .close-btn:hover {
            background: var(--gray-light);
            color: var(--charcoal);
        }
        
        .modal-body {
            padding: 1.5rem;
        }
        
        .plan-details {
            text-align: center;
            margin-bottom: 2rem;
        }
        
        .plan-details h4 {
            color: var(--charcoal);
            font-size: 1.5rem;
            margin-bottom: 1rem;
        }
        
        .price {
            background: var(--gold);
            color: var(--charcoal);
            padding: 1rem 2rem;
            border-radius: 30px;
            font-size: 1.5rem;
            font-weight: 700;
            display: inline-block;
            margin-bottom: 1.5rem;
        }
        
        .features {
            list-style: none;
            text-align: left;
        }
        
        .features li {
            padding: 0.5rem 0;
            display: flex;
            align-items: center;
            gap: 0.5rem;
            color: var(--charcoal);
        }
        
        .features i {
            color: var(--green);
        }
        
        .payment-section {
            text-align: center;
            border-top: 1px solid var(--gray-light);
            padding-top: 1.5rem;
        }
        
        .pay-btn {
            background: var(--green);
            color: var(--white);
            border: none;
            padding: 1rem 2rem;
            border-radius: 30px;
            font-weight: 700;
            font-size: 1.1rem;
            cursor: pointer;
            transition: all 0.3s;
            margin: 1rem 0;
            display: inline-flex;
            align-items: center;
            gap: 0.5rem;
        }
        
        .pay-btn:hover {
            background: #1e7e34;
            transform: translateY(-2px);
        }
        
        .terms {
            font-size: 0.8rem;
            color: var(--gray);
            margin-top: 1rem;
        }
        
        @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
        }
    `;
    
    if (!document.querySelector('#modal-styles')) {
        const styleSheet = document.createElement('style');
        styleSheet.id = 'modal-styles';
        styleSheet.textContent = modalStyles;
        document.head.appendChild(styleSheet);
    }
}

function processPayment() {
    console.log('Payment processing initiated...');
    
    // Show payment processing message
    showNotification('Processing payment...', 'info');
    
    // Simulate payment processing
    setTimeout(() => {
        showNotification('Payment successful! You are now an admin.', 'success');
        
        // Close modal
        const modal = document.querySelector('.upgrade-modal');
        if (modal) modal.remove();
        
        // Switch to admin role
        switchRole('admin');
        
        // Update user status
        updateUserToAdmin();
    }, 2000);
}

function updateUserToAdmin() {
    // Update UI to reflect admin status
    const roleBadge = document.getElementById('roleBadge');
    if (roleBadge) {
        roleBadge.textContent = 'Admin';
        roleBadge.style.background = 'var(--green)';
        roleBadge.style.color = 'var(--white)';
    }
    
    // Update welcome message
    const userName = document.getElementById('userName');
    if (userName) {
        userName.textContent = 'Admin';
    }
    
    showNotification('Welcome to the admin team! You can now create blog posts.', 'success');
}

// Utility functions
function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    // Add to page
    document.body.appendChild(notification);
    
    // Remove after 3 seconds
    setTimeout(() => {
        notification.remove();
    }, 3000);
}

// Add notification styles
const notificationStyles = `
    .notification {
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 1rem 1.5rem;
        border-radius: 8px;
        color: white;
        font-weight: 500;
        z-index: 10000;
        animation: slideIn 0.3s ease-out;
    }
    
    .notification.info {
        background: var(--blue);
    }
    
    .notification.success {
        background: var(--green);
    }
    
    .notification.error {
        background: var(--red);
    }
    
    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    .blog-post {
        background: var(--gray-light);
        padding: 1rem;
        border-radius: 12px;
        margin-bottom: 1rem;
    }
    
    .blog-post h4 {
        color: var(--charcoal);
        margin-bottom: 0.5rem;
    }
    
    .blog-meta {
        display: flex;
        gap: 1rem;
        font-size: 0.8rem;
        color: var(--gray);
        margin: 0.5rem 0;
    }
    
    .blog-actions {
        display: flex;
        gap: 1rem;
    }
    
    .like-btn, .comment-btn {
        background: none;
        border: none;
        color: var(--gray);
        cursor: pointer;
        padding: 0.3rem 0.6rem;
        border-radius: 6px;
        transition: all 0.3s;
    }
    
    .like-btn:hover, .comment-btn:hover {
        background: var(--white);
        color: var(--charcoal);
    }
    
    .like-btn .liked {
        color: var(--red);
    }
`;

// Inject notification styles
const styleSheet = document.createElement('style');
styleSheet.textContent = notificationStyles;
document.head.appendChild(styleSheet); 

function initializeCarousel() {
    // Set up carousel navigation
    const carousel = document.getElementById('advertsCarousel');
    if (carousel) {
        // Auto-scroll carousel every 5 seconds
        setInterval(() => {
            moveCarousel(1);
        }, 5000);
    }
}

function initializeSearchFeatures() {
    // Budget slider functionality
    const budgetSlider = document.getElementById('budgetSlider');
    const budgetValue = document.getElementById('budgetValue');
    
    if (budgetSlider && budgetValue) {
        budgetSlider.addEventListener('input', function() {
            const value = this.value;
            budgetValue.textContent = `KSh ${parseInt(value).toLocaleString()}`;
        });
    }
    
    // University filter logic
    const universitySelect = document.getElementById('universitySelect');
    const studentFilter = document.getElementById('studentFilter');
    
    if (universitySelect && studentFilter) {
        studentFilter.addEventListener('change', function() {
            if (this.checked) {
                universitySelect.style.display = 'block';
                universitySelect.focus();
            } else {
                universitySelect.value = '';
            }
        });
    }
}

function moveCarousel(direction) {
    const carousel = document.getElementById('advertsCarousel');
    if (!carousel) return;
    
    const cardWidth = 350; // Width of each card including gap
    const currentScroll = carousel.scrollLeft;
    const maxScroll = carousel.scrollWidth - carousel.clientWidth;
    
    let newScroll;
    if (direction > 0) {
        // Move right
        newScroll = Math.min(currentScroll + cardWidth, maxScroll);
    } else {
        // Move left
        newScroll = Math.max(currentScroll - cardWidth, 0);
    }
    
    carousel.scrollTo({
        left: newScroll,
        behavior: 'smooth'
    });
}

function performAdvancedSearch() {
    // Collect all search parameters
    const searchData = {
        location: document.querySelector('.search-input').value,
        propertyType: document.getElementById('propertyType').value,
        university: document.getElementById('universitySelect').value,
        budget: document.getElementById('budgetSlider').value,
        filters: {
            studentAccommodation: document.getElementById('studentFilter').checked,
            verifiedLandlord: document.getElementById('verifiedLandlord').checked,
            availableNow: document.getElementById('availableNow').checked
        }
    };
    
    console.log('Advanced search initiated:', searchData);
    
    // Show search results or redirect to results page
    showSearchResults(searchData);
}

function showSearchResults(searchData) {
    // Create a modal to show search results
    const modal = document.createElement('div');
    modal.className = 'search-results-modal';
    
    const results = generateMockResults(searchData);
    
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3><i class="fas fa-search"></i> Search Results</h3>
                <button class="close-btn" onclick="this.parentElement.parentElement.parentElement.remove()">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="modal-body">
                <div class="search-summary">
                    <p>Found <strong>${results.length}</strong> properties matching your criteria</p>
                    <div class="search-criteria">
                        ${searchData.location ? `<span>📍 ${searchData.location}</span>` : ''}
                        ${searchData.propertyType ? `<span>🏠 ${searchData.propertyType}</span>` : ''}
                        ${searchData.university ? `<span>🎓 ${searchData.university}</span>` : ''}
                        <span>💰 KSh ${parseInt(searchData.budget).toLocaleString()}</span>
                    </div>
                </div>
                <div class="results-list">
                    ${results.map(property => `
                        <div class="result-item">
                            <div class="result-image">
                                <img src="${property.image}" alt="${property.title}">
                                ${property.featured ? '<span class="featured-badge">FEATURED</span>' : ''}
                            </div>
                            <div class="result-content">
                                <h4>${property.title}</h4>
                                <p class="result-location"><i class="fas fa-map-marker-alt"></i> ${property.location}</p>
                                <p class="result-price">${property.price}</p>
                                <div class="result-features">
                                    ${property.features.map(feature => `<span>${feature}</span>`).join('')}
                                </div>
                                <button class="view-result-btn">View Details</button>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Add modal styles if not already present
    if (!document.querySelector('#search-modal-styles')) {
        const modalStyles = `
            .search-results-modal {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0,0,0,0.5);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 10000;
                animation: fadeIn 0.3s;
            }
            
            .search-results-modal .modal-content {
                background: var(--white);
                border-radius: 20px;
                max-width: 800px;
                width: 90%;
                max-height: 90vh;
                overflow-y: auto;
                box-shadow: 0 20px 60px rgba(0,0,0,0.3);
            }
            
            .search-summary {
                background: var(--gray-light);
                padding: 1rem;
                border-radius: 12px;
                margin-bottom: 1.5rem;
            }
            
            .search-criteria {
                display: flex;
                flex-wrap: wrap;
                gap: 0.5rem;
                margin-top: 0.5rem;
            }
            
            .search-criteria span {
                background: var(--gold);
                color: var(--charcoal);
                padding: 0.3rem 0.6rem;
                border-radius: 12px;
                font-size: 0.8rem;
                font-weight: 500;
            }
            
            .results-list {
                display: flex;
                flex-direction: column;
                gap: 1rem;
            }
            
            .result-item {
                display: flex;
                gap: 1rem;
                padding: 1rem;
                border: 1px solid var(--gray-light);
                border-radius: 12px;
                transition: all 0.3s;
            }
            
            .result-item:hover {
                border-color: var(--gold);
                box-shadow: 0 4px 15px rgba(255,184,0,0.1);
            }
            
            .result-image {
                width: 120px;
                height: 90px;
                border-radius: 8px;
                overflow: hidden;
                position: relative;
            }
            
            .result-image img {
                width: 100%;
                height: 100%;
                object-fit: cover;
            }
            
            .featured-badge {
                position: absolute;
                top: 0.5rem;
                right: 0.5rem;
                background: var(--gold);
                color: var(--charcoal);
                padding: 0.2rem 0.4rem;
                border-radius: 8px;
                font-size: 0.6rem;
                font-weight: 700;
            }
            
            .result-content {
                flex: 1;
            }
            
            .result-content h4 {
                color: var(--charcoal);
                font-size: 1rem;
                margin-bottom: 0.5rem;
            }
            
            .result-location {
                color: var(--gray);
                font-size: 0.9rem;
                margin-bottom: 0.5rem;
            }
            
            .result-price {
                color: var(--gold-dark);
                font-weight: 700;
                margin-bottom: 0.5rem;
            }
            
            .result-features {
                display: flex;
                flex-wrap: wrap;
                gap: 0.3rem;
                margin-bottom: 0.5rem;
            }
            
            .result-features span {
                background: var(--gray-light);
                color: var(--charcoal);
                padding: 0.2rem 0.4rem;
                border-radius: 8px;
                font-size: 0.7rem;
            }
            
            .view-result-btn {
                background: var(--gold);
                color: var(--charcoal);
                border: none;
                padding: 0.5rem 1rem;
                border-radius: 20px;
                font-size: 0.8rem;
                font-weight: 600;
                cursor: pointer;
                transition: all 0.3s;
            }
            
            .view-result-btn:hover {
                background: var(--gold-dark);
                color: var(--white);
            }
        `;
        
        const styleSheet = document.createElement('style');
        styleSheet.id = 'search-modal-styles';
        styleSheet.textContent = modalStyles;
        document.head.appendChild(styleSheet);
    }
}

function generateMockResults(searchData) {
    // Generate mock search results based on search criteria
    const mockProperties = [
        {
            title: 'Student-Friendly Apartment',
            location: 'Westlands, Nairobi',
            price: 'KSh 25,000/month',
            image: 'images/project.jpg',
            featured: true,
            features: ['2 Bedrooms', 'WiFi', 'Security']
        },
        {
            title: 'Modern Hostel Room',
            location: 'Kilimani, Nairobi',
            price: 'KSh 15,000/month',
            image: 'images/hostels.jpeg',
            featured: false,
            features: ['Single Room', 'Meals', 'Transport']
        },
        {
            title: 'Affordable Family Quarter',
            location: 'Eastlands, Nairobi',
            price: 'KSh 12,000/month',
            image: 'images/tenant.jpeg',
            featured: false,
            features: ['1 Bedroom', 'Parking', 'Garden']
        }
    ];
    
    // Filter results based on search criteria
    let filteredResults = mockProperties;
    
    if (searchData.budget) {
        const maxBudget = parseInt(searchData.budget);
        filteredResults = filteredResults.filter(property => {
            const price = parseInt(property.price.replace(/[^\d]/g, ''));
            return price <= maxBudget;
        });
    }
    
    if (searchData.propertyType) {
        filteredResults = filteredResults.filter(property => {
            return property.title.toLowerCase().includes(searchData.propertyType.toLowerCase());
        });
    }
    
    return filteredResults;
} 

function testModal() {
    console.log('=== DEBUG MODAL TEST ===');
    console.log('1. Checking if postModal exists...');
    const postModal = document.getElementById('postModal');
    console.log('postModal found:', !!postModal);
    
    if (postModal) {
        console.log('2. Current modal classes:', postModal.className);
        console.log('3. Modal is hidden:', postModal.classList.contains('hidden'));
        
        console.log('4. Attempting to open modal...');
        postModal.classList.remove('hidden');
        console.log('5. Modal classes after removing hidden:', postModal.className);
        
        // Force modal to be visible
        postModal.style.display = 'flex';
        postModal.style.position = 'fixed';
        postModal.style.top = '0';
        postModal.style.left = '0';
        postModal.style.width = '100%';
        postModal.style.height = '100%';
        postModal.style.backgroundColor = 'rgba(0,0,0,0.5)';
        postModal.style.zIndex = '10000';
        
        console.log('6. Modal should now be visible');
        alert('Modal debug complete. Check console for details.');
    } else {
        console.error('Post modal element not found!');
        alert('Post modal element not found!');
    }
}

// Also add a simple test function that just shows an alert
function simpleTest() {
    alert('JavaScript is working!');
}

// Message badge functionality
function updateMessageBadges() {
    // Get unread message count from localStorage or mock data
    const unreadCount = getUnreadMessageCount();
    
    // Update header badge
    const messageBadge = document.getElementById('messageBadge');
    if (messageBadge) {
        if (unreadCount > 0) {
            messageBadge.textContent = unreadCount > 99 ? '99+' : unreadCount;
            messageBadge.style.display = 'flex';
        } else {
            messageBadge.style.display = 'none';
        }
    }
    
    // Update quick action badge
    const quickMessageBadge = document.getElementById('quickMessageBadge');
    if (quickMessageBadge) {
        if (unreadCount > 0) {
            quickMessageBadge.textContent = unreadCount > 99 ? '99+' : unreadCount;
            quickMessageBadge.style.display = 'flex';
        } else {
            quickMessageBadge.style.display = 'none';
        }
    }
}

function getUnreadMessageCount() {
    // In a real app, this would fetch from the messaging system
    // For now, return mock data
    return Math.floor(Math.random() * 5); // 0-4 unread messages
}

// Quick action functions
function showPropertySearch() {
    // Scroll to search section
    const searchSection = document.querySelector('.search-section');
    if (searchSection) {
        searchSection.scrollIntoView({ behavior: 'smooth' });
    }
}

function showSavedProperties() {
    // Show saved properties modal or navigate to saved properties page
    alert('Saved Properties feature coming soon!');
}

function showApplications() {
    // Show applications modal or navigate to applications page
    alert('My Applications feature coming soon!');
} 