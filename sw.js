// Service Worker for DeniFinder

const CACHE_NAME = 'denifinder-v1.0.0';
const STATIC_CACHE = 'denifinder-static-v1.0.0';
const DYNAMIC_CACHE = 'denifinder-dynamic-v1.0.0';

// Files to cache immediately
const STATIC_FILES = [
    '/',
    '/index.html',
    '/signin.html',
    '/signup.html',
    '/dashboard.html',
    '/payment.html',
    '/css/dashboard.css',
    '/css/payment.css',
    '/js/dashboard.js',
    '/js/payment.js',
    '/js/search.js',
    '/js/messaging.js',
    '/js/analytics.js',
    '/js/notifications.js',
    '/images/deniM.png',
    '/images/project.jpg',
    '/images/hostels.jpeg',
    '/images/tenant.jpeg',
    '/images/hero.jpeg',
    '/manifest.json'
];

// Install event - cache static files
self.addEventListener('install', (event) => {
    console.log('Service Worker installing...');
    
    event.waitUntil(
        caches.open(STATIC_CACHE)
            .then((cache) => {
                console.log('Caching static files');
                return cache.addAll(STATIC_FILES);
            })
            .then(() => {
                console.log('Static files cached successfully');
                return self.skipWaiting();
            })
            .catch((error) => {
                console.error('Error caching static files:', error);
            })
    );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
    console.log('Service Worker activating...');
    
    event.waitUntil(
        caches.keys()
            .then((cacheNames) => {
                return Promise.all(
                    cacheNames.map((cacheName) => {
                        if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE) {
                            console.log('Deleting old cache:', cacheName);
                            return caches.delete(cacheName);
                        }
                    })
                );
            })
            .then(() => {
                console.log('Service Worker activated');
                return self.clients.claim();
            })
    );
});

// Fetch event - serve from cache or network
self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);

    // Skip non-GET requests
    if (request.method !== 'GET') {
        return;
    }

    // Handle different types of requests
    if (url.pathname === '/' || url.pathname.endsWith('.html')) {
        // HTML pages - cache first, then network
        event.respondWith(cacheFirst(request, STATIC_CACHE));
    } else if (url.pathname.match(/\.(css|js|png|jpg|jpeg|gif|svg|ico)$/)) {
        // Static assets - cache first, then network
        event.respondWith(cacheFirst(request, STATIC_CACHE));
    } else if (url.pathname.includes('/api/')) {
        // API requests - network first, then cache
        event.respondWith(networkFirst(request, DYNAMIC_CACHE));
    } else {
        // Other requests - network first
        event.respondWith(networkFirst(request, DYNAMIC_CACHE));
    }
});

// Cache first strategy
async function cacheFirst(request, cacheName) {
    try {
        const cachedResponse = await caches.match(request);
        if (cachedResponse) {
            return cachedResponse;
        }

        const networkResponse = await fetch(request);
        if (networkResponse.ok) {
            const cache = await caches.open(cacheName);
            cache.put(request, networkResponse.clone());
        }
        return networkResponse;
    } catch (error) {
        console.error('Cache first strategy failed:', error);
        
        // Return offline page for HTML requests
        if (request.headers.get('accept').includes('text/html')) {
            return caches.match('/offline.html');
        }
        
        throw error;
    }
}

// Network first strategy
async function networkFirst(request, cacheName) {
    try {
        const networkResponse = await fetch(request);
        if (networkResponse.ok) {
            const cache = await caches.open(cacheName);
            cache.put(request, networkResponse.clone());
        }
        return networkResponse;
    } catch (error) {
        console.error('Network first strategy failed:', error);
        
        const cachedResponse = await caches.match(request);
        if (cachedResponse) {
            return cachedResponse;
        }
        
        throw error;
    }
}

// Background sync for offline actions
self.addEventListener('sync', (event) => {
    console.log('Background sync triggered:', event.tag);
    
    if (event.tag === 'background-sync-messages') {
        event.waitUntil(syncMessages());
    } else if (event.tag === 'background-sync-properties') {
        event.waitUntil(syncProperties());
    }
});

// Sync messages when back online
async function syncMessages() {
    try {
        const offlineMessages = await getOfflineMessages();
        
        for (const message of offlineMessages) {
            try {
                // Send message to server
                await sendMessageToServer(message);
                
                // Remove from offline storage
                await removeOfflineMessage(message.id);
                
                console.log('Message synced successfully:', message.id);
            } catch (error) {
                console.error('Failed to sync message:', message.id, error);
            }
        }
    } catch (error) {
        console.error('Background sync failed:', error);
    }
}

// Sync property data when back online
async function syncProperties() {
    try {
        const offlineData = await getOfflineData();
        
        for (const data of offlineData) {
            try {
                // Sync data with server
                await syncDataWithServer(data);
                
                // Remove from offline storage
                await removeOfflineData(data.id);
                
                console.log('Property data synced successfully:', data.id);
            } catch (error) {
                console.error('Failed to sync property data:', data.id, error);
            }
        }
    } catch (error) {
        console.error('Property sync failed:', error);
    }
}

// Push notification handling
self.addEventListener('push', (event) => {
    console.log('Push notification received');
    
    if (event.data) {
        const data = event.data.json();
        const options = {
            body: data.body,
            icon: '/images/deniM.png',
            badge: '/images/deniM.png',
            tag: data.tag || 'denifinder-notification',
            data: data.data || {},
            actions: data.actions || [],
            requireInteraction: data.requireInteraction || false,
            silent: data.silent || false
        };

        event.waitUntil(
            self.registration.showNotification(data.title, options)
        );
    }
});

// Notification click handling
self.addEventListener('notificationclick', (event) => {
    console.log('Notification clicked:', event.notification.tag);
    
    event.notification.close();

    if (event.action) {
        // Handle specific action clicks
        handleNotificationAction(event.action, event.notification.data);
    } else {
        // Default click behavior
        event.waitUntil(
            clients.matchAll({ type: 'window' })
                .then((clientList) => {
                    // Check if app is already open
                    for (const client of clientList) {
                        if (client.url.includes('/dashboard') && 'focus' in client) {
                            return client.focus();
                        }
                    }
                    
                    // Open dashboard if app is not open
                    if (clients.openWindow) {
                        return clients.openWindow('/dashboard');
                    }
                })
        );
    }
});

// Handle notification actions
function handleNotificationAction(action, data) {
    switch (action) {
        case 'view_property':
            clients.openWindow(`/property-details.html?id=${data.propertyId}`);
            break;
        case 'reply_message':
            clients.openWindow(`/dashboard.html?action=reply&conversation=${data.conversationId}`);
            break;
        case 'view_application':
            clients.openWindow(`/dashboard.html?action=view_application&id=${data.applicationId}`);
            break;
        default:
            console.log('Unknown notification action:', action);
    }
}

// Helper functions for offline storage
async function getOfflineMessages() {
    // In a real app, this would read from IndexedDB
    return [];
}

async function removeOfflineMessage(messageId) {
    // In a real app, this would remove from IndexedDB
    console.log('Removing offline message:', messageId);
}

async function sendMessageToServer(message) {
    // In a real app, this would send to your API
    console.log('Sending message to server:', message);
    return new Promise(resolve => setTimeout(resolve, 1000));
}

async function getOfflineData() {
    // In a real app, this would read from IndexedDB
    return [];
}

async function removeOfflineData(dataId) {
    // In a real app, this would remove from IndexedDB
    console.log('Removing offline data:', dataId);
}

async function syncDataWithServer(data) {
    // In a real app, this would sync with your API
    console.log('Syncing data with server:', data);
    return new Promise(resolve => setTimeout(resolve, 1000));
}

// Periodic background sync (if supported)
self.addEventListener('periodicsync', (event) => {
    console.log('Periodic background sync:', event.tag);
    
    if (event.tag === 'update-properties') {
        event.waitUntil(updatePropertyData());
    }
});

async function updatePropertyData() {
    try {
        // Update property data in background
        console.log('Updating property data in background');
        
        // In a real app, this would fetch updated data from your API
        // and update the cache
        
    } catch (error) {
        console.error('Periodic sync failed:', error);
    }
}

// Error handling
self.addEventListener('error', (event) => {
    console.error('Service Worker error:', event.error);
});

self.addEventListener('unhandledrejection', (event) => {
    console.error('Service Worker unhandled rejection:', event.reason);
});

console.log('Service Worker loaded successfully'); 