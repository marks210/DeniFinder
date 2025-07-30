// Notification System for DeniFinder

class NotificationSystem {
    constructor() {
        this.currentUser = null;
        this.notifications = [];
        this.unreadCount = 0;
        this.permission = 'default';
        this.settings = {
            email: true,
            push: true,
            inApp: true,
            types: {
                newMessage: true,
                propertyUpdate: true,
                applicationStatus: true,
                priceChange: true,
                newProperty: true,
                systemAlert: true
            }
        };
    }

    init() {
        this.loadCurrentUser();
        this.loadNotificationSettings();
        this.setupEventListeners();
        this.loadNotifications();
        this.requestPermission();
        this.startRealTimeUpdates();
    }

    loadCurrentUser() {
        const userData = localStorage.getItem('deniFinderCurrentUser');
        if (userData) {
            this.currentUser = JSON.parse(userData);
        }
    }

    async loadNotificationSettings() {
        const settings = localStorage.getItem('deniFinderNotificationSettings');
        if (settings) {
            this.settings = { ...this.settings, ...JSON.parse(settings) };
        }
    }

    setupEventListeners() {
        // Notification bell click
        const notificationBell = document.getElementById('notificationBell');
        if (notificationBell) {
            notificationBell.addEventListener('click', () => {
                this.toggleNotificationPanel();
            });
        }

        // Mark all as read
        const markAllReadBtn = document.getElementById('markAllReadBtn');
        if (markAllReadBtn) {
            markAllReadBtn.addEventListener('click', () => {
                this.markAllAsRead();
            });
        }

        // Settings button
        const notificationSettingsBtn = document.getElementById('notificationSettingsBtn');
        if (notificationSettingsBtn) {
            notificationSettingsBtn.addEventListener('click', () => {
                this.showNotificationSettings();
            });
        }

        // Close notification panel when clicking outside
        document.addEventListener('click', (e) => {
            const panel = document.getElementById('notificationPanel');
            const bell = document.getElementById('notificationBell');
            
            if (panel && !panel.contains(e.target) && !bell.contains(e.target)) {
                this.closeNotificationPanel();
            }
        });
    }

    async requestPermission() {
        if ('Notification' in window) {
            this.permission = await Notification.requestPermission();
        }
    }

    async loadNotifications() {
        try {
            // In a real app, this would fetch from Firestore
            const notifications = await this.fetchNotifications();
            this.notifications = notifications;
            this.unreadCount = notifications.filter(n => !n.read).length;
            this.displayNotifications();
            this.updateNotificationBadge();
        } catch (error) {
            console.error('Error loading notifications:', error);
        }
    }

    async fetchNotifications() {
        // Mock data - in real app this comes from Firestore
        return [
            {
                id: 'notif1',
                type: 'newMessage',
                title: 'New Message from Mary Smith',
                message: 'Hi! I\'m interested in your property. Is it still available?',
                timestamp: new Date(Date.now() - 1800000), // 30 minutes ago
                read: false,
                data: {
                    conversationId: 'conv1',
                    senderId: 'landlord1'
                }
            },
            {
                id: 'notif2',
                type: 'propertyUpdate',
                title: 'Property Status Updated',
                message: 'Your saved property "Modern 2-Bedroom Apartment" is now available',
                timestamp: new Date(Date.now() - 3600000), // 1 hour ago
                read: false,
                data: {
                    propertyId: 'prop1'
                }
            },
            {
                id: 'notif3',
                type: 'applicationStatus',
                title: 'Application Approved',
                message: 'Congratulations! Your application for "Student Hostel" has been approved',
                timestamp: new Date(Date.now() - 7200000), // 2 hours ago
                read: true,
                data: {
                    propertyId: 'prop2',
                    applicationId: 'app1'
                }
            },
            {
                id: 'notif4',
                type: 'priceChange',
                title: 'Price Drop Alert',
                message: 'A property you saved has reduced its price by 10%',
                timestamp: new Date(Date.now() - 86400000), // 1 day ago
                read: true,
                data: {
                    propertyId: 'prop3',
                    oldPrice: 50000,
                    newPrice: 45000
                }
            },
            {
                id: 'notif5',
                type: 'newProperty',
                title: 'New Property Match',
                message: 'A new property matching your criteria is now available',
                timestamp: new Date(Date.now() - 172800000), // 2 days ago
                read: true,
                data: {
                    propertyId: 'prop4'
                }
            }
        ];
    }

    displayNotifications() {
        const notificationList = document.getElementById('notificationList');
        if (!notificationList) return;

        if (this.notifications.length === 0) {
            notificationList.innerHTML = `
                <div class="no-notifications">
                    <i class="fas fa-bell-slash"></i>
                    <p>No notifications yet</p>
                </div>
            `;
            return;
        }

        notificationList.innerHTML = this.notifications.map(notification => 
            this.createNotificationItem(notification)
        ).join('');
    }

    createNotificationItem(notification) {
        const unreadClass = !notification.read ? 'unread' : '';
        const icon = this.getNotificationIcon(notification.type);
        const timeAgo = this.formatTimeAgo(notification.timestamp);

        return `
            <div class="notification-item ${unreadClass}" data-notification-id="${notification.id}">
                <div class="notification-icon">
                    <i class="${icon}"></i>
                </div>
                <div class="notification-content">
                    <h4>${notification.title}</h4>
                    <p>${notification.message}</p>
                    <span class="notification-time">${timeAgo}</span>
                </div>
                <div class="notification-actions">
                    ${!notification.read ? '<span class="unread-dot"></span>' : ''}
                    <button onclick="notificationSystem.markAsRead('${notification.id}')" class="mark-read-btn">
                        <i class="fas fa-check"></i>
                    </button>
                </div>
            </div>
        `;
    }

    getNotificationIcon(type) {
        const icons = {
            newMessage: 'fas fa-envelope',
            propertyUpdate: 'fas fa-home',
            applicationStatus: 'fas fa-clipboard-check',
            priceChange: 'fas fa-tag',
            newProperty: 'fas fa-plus-circle',
            systemAlert: 'fas fa-exclamation-triangle'
        };
        return icons[type] || 'fas fa-bell';
    }

    formatTimeAgo(timestamp) {
        const now = new Date();
        const diff = now - timestamp;
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);

        if (minutes < 1) return 'Just now';
        if (minutes < 60) return `${minutes}m ago`;
        if (hours < 24) return `${hours}h ago`;
        if (days < 7) return `${days}d ago`;
        
        return timestamp.toLocaleDateString();
    }

    updateNotificationBadge() {
        const badge = document.getElementById('notificationBadge');
        if (badge) {
            if (this.unreadCount > 0) {
                badge.textContent = this.unreadCount > 99 ? '99+' : this.unreadCount;
                badge.style.display = 'block';
            } else {
                badge.style.display = 'none';
            }
        }
    }

    toggleNotificationPanel() {
        const panel = document.getElementById('notificationPanel');
        if (!panel) return;

        if (panel.classList.contains('active')) {
            this.closeNotificationPanel();
        } else {
            this.openNotificationPanel();
        }
    }

    openNotificationPanel() {
        const panel = document.getElementById('notificationPanel');
        if (panel) {
            panel.classList.add('active');
        }
    }

    closeNotificationPanel() {
        const panel = document.getElementById('notificationPanel');
        if (panel) {
            panel.classList.remove('active');
        }
    }

    async markAsRead(notificationId) {
        try {
            // In a real app, this would update Firestore
            const notification = this.notifications.find(n => n.id === notificationId);
            if (notification) {
                notification.read = true;
                this.unreadCount = Math.max(0, this.unreadCount - 1);
                this.updateNotificationBadge();
                this.updateNotificationUI(notificationId);
            }
        } catch (error) {
            console.error('Error marking notification as read:', error);
        }
    }

    async markAllAsRead() {
        try {
            // In a real app, this would update Firestore
            this.notifications.forEach(notification => {
                notification.read = true;
            });
            this.unreadCount = 0;
            this.updateNotificationBadge();
            this.displayNotifications();
        } catch (error) {
            console.error('Error marking all notifications as read:', error);
        }
    }

    updateNotificationUI(notificationId) {
        const notificationItem = document.querySelector(`[data-notification-id="${notificationId}"]`);
        if (notificationItem) {
            notificationItem.classList.remove('unread');
            const unreadDot = notificationItem.querySelector('.unread-dot');
            if (unreadDot) {
                unreadDot.remove();
            }
        }
    }

    showNotificationSettings() {
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>Notification Settings</h3>
                    <button onclick="this.closest('.modal').remove()" class="close-btn">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="settings-section">
                        <h4>Notification Channels</h4>
                        <div class="setting-item">
                            <label>
                                <input type="checkbox" id="emailNotif" ${this.settings.email ? 'checked' : ''}>
                                Email Notifications
                            </label>
                        </div>
                        <div class="setting-item">
                            <label>
                                <input type="checkbox" id="pushNotif" ${this.settings.push ? 'checked' : ''}>
                                Push Notifications
                            </label>
                        </div>
                        <div class="setting-item">
                            <label>
                                <input type="checkbox" id="inAppNotif" ${this.settings.inApp ? 'checked' : ''}>
                                In-App Notifications
                            </label>
                        </div>
                    </div>

                    <div class="settings-section">
                        <h4>Notification Types</h4>
                        <div class="setting-item">
                            <label>
                                <input type="checkbox" id="newMessageNotif" ${this.settings.types.newMessage ? 'checked' : ''}>
                                New Messages
                            </label>
                        </div>
                        <div class="setting-item">
                            <label>
                                <input type="checkbox" id="propertyUpdateNotif" ${this.settings.types.propertyUpdate ? 'checked' : ''}>
                                Property Updates
                            </label>
                        </div>
                        <div class="setting-item">
                            <label>
                                <input type="checkbox" id="applicationStatusNotif" ${this.settings.types.applicationStatus ? 'checked' : ''}>
                                Application Status
                            </label>
                        </div>
                        <div class="setting-item">
                            <label>
                                <input type="checkbox" id="priceChangeNotif" ${this.settings.types.priceChange ? 'checked' : ''}>
                                Price Changes
                            </label>
                        </div>
                        <div class="setting-item">
                            <label>
                                <input type="checkbox" id="newPropertyNotif" ${this.settings.types.newProperty ? 'checked' : ''}>
                                New Properties
                            </label>
                        </div>
                        <div class="setting-item">
                            <label>
                                <input type="checkbox" id="systemAlertNotif" ${this.settings.types.systemAlert ? 'checked' : ''}>
                                System Alerts
                            </label>
                        </div>
                    </div>
                </div>
                <div class="modal-footer">
                    <button onclick="this.closest('.modal').remove()" class="btn-secondary">Cancel</button>
                    <button onclick="notificationSystem.saveNotificationSettings()" class="btn-primary">Save Settings</button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
    }

    saveNotificationSettings() {
        // Update settings from form
        this.settings.email = document.getElementById('emailNotif').checked;
        this.settings.push = document.getElementById('pushNotif').checked;
        this.settings.inApp = document.getElementById('inAppNotif').checked;
        this.settings.types.newMessage = document.getElementById('newMessageNotif').checked;
        this.settings.types.propertyUpdate = document.getElementById('propertyUpdateNotif').checked;
        this.settings.types.applicationStatus = document.getElementById('applicationStatusNotif').checked;
        this.settings.types.priceChange = document.getElementById('priceChangeNotif').checked;
        this.settings.types.newProperty = document.getElementById('newPropertyNotif').checked;
        this.settings.types.systemAlert = document.getElementById('systemAlertNotif').checked;

        // Save to localStorage
        localStorage.setItem('deniFinderNotificationSettings', JSON.stringify(this.settings));

        // Close modal
        document.querySelector('.modal').remove();

        // Show confirmation
        this.showToast('Notification settings saved successfully!', 'success');
    }

    async createNotification(type, title, message, data = {}) {
        const notification = {
            id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            type: type,
            title: title,
            message: message,
            timestamp: new Date(),
            read: false,
            data: data
        };

        // Add to notifications list
        this.notifications.unshift(notification);
        this.unreadCount++;

        // Update UI
        this.displayNotifications();
        this.updateNotificationBadge();

        // Show different types of notifications based on settings
        if (this.settings.inApp) {
            this.showInAppNotification(notification);
        }

        if (this.settings.push && this.permission === 'granted') {
            this.showPushNotification(notification);
        }

        // In a real app, this would save to Firestore
        await this.saveNotification(notification);
    }

    showInAppNotification(notification) {
        const toast = document.createElement('div');
        toast.className = `toast-notification ${notification.type}`;
        toast.innerHTML = `
            <div class="toast-icon">
                <i class="${this.getNotificationIcon(notification.type)}"></i>
            </div>
            <div class="toast-content">
                <h4>${notification.title}</h4>
                <p>${notification.message}</p>
            </div>
            <button onclick="this.parentElement.remove()" class="toast-close">
                <i class="fas fa-times"></i>
            </button>
        `;

        document.body.appendChild(toast);

        // Auto remove after 5 seconds
        setTimeout(() => {
            if (toast.parentElement) {
                toast.remove();
            }
        }, 5000);
    }

    showPushNotification(notification) {
        if ('Notification' in window && this.permission === 'granted') {
            new Notification(notification.title, {
                body: notification.message,
                icon: '/images/deniM.png',
                badge: '/images/deniM.png',
                tag: notification.id
            });
        }
    }

    showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = message;

        document.body.appendChild(toast);

        // Auto remove after 3 seconds
        setTimeout(() => {
            if (toast.parentElement) {
                toast.remove();
            }
        }, 3000);
    }

    async saveNotification(notification) {
        // In a real app, this would save to Firestore
        console.log('Saving notification:', notification);
    }

    startRealTimeUpdates() {
        // In a real app, this would set up Firestore listeners
        setInterval(() => {
            this.checkForNewNotifications();
        }, 30000); // Check every 30 seconds
    }

    async checkForNewNotifications() {
        // In a real app, this would check Firestore for new notifications
        // For now, we'll just simulate
    }

    // Helper methods for creating specific types of notifications
    notifyNewMessage(senderName, message, conversationId) {
        this.createNotification(
            'newMessage',
            `New Message from ${senderName}`,
            message.substring(0, 100) + (message.length > 100 ? '...' : ''),
            { conversationId, senderName }
        );
    }

    notifyPropertyUpdate(propertyTitle, status) {
        this.createNotification(
            'propertyUpdate',
            'Property Status Updated',
            `Your saved property "${propertyTitle}" is now ${status}`,
            { propertyTitle, status }
        );
    }

    notifyApplicationStatus(propertyTitle, status) {
        this.createNotification(
            'applicationStatus',
            `Application ${status}`,
            `Your application for "${propertyTitle}" has been ${status}`,
            { propertyTitle, status }
        );
    }

    notifyPriceChange(propertyTitle, oldPrice, newPrice) {
        const change = oldPrice > newPrice ? 'dropped' : 'increased';
        const percentage = Math.abs(((newPrice - oldPrice) / oldPrice) * 100).toFixed(1);
        
        this.createNotification(
            'priceChange',
            'Price Change Alert',
            `The price for "${propertyTitle}" has ${change} by ${percentage}%`,
            { propertyTitle, oldPrice, newPrice, change, percentage }
        );
    }

    notifyNewProperty(propertyTitle, location) {
        this.createNotification(
            'newProperty',
            'New Property Match',
            `A new property matching your criteria: "${propertyTitle}" in ${location}`,
            { propertyTitle, location }
        );
    }
}

// Initialize notification system
const notificationSystem = new NotificationSystem();
document.addEventListener('DOMContentLoaded', () => {
    notificationSystem.init();
}); 