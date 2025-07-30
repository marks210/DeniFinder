// Analytics System for DeniFinder

class AnalyticsSystem {
    constructor() {
        this.currentUser = null;
        this.userStats = {};
        this.propertyStats = {};
        this.engagementMetrics = {};
    }

    init() {
        this.loadCurrentUser();
        this.setupEventListeners();
        this.loadUserAnalytics();
        this.trackUserBehavior();
    }

    loadCurrentUser() {
        const userData = localStorage.getItem('deniFinderCurrentUser');
        if (userData) {
            this.currentUser = JSON.parse(userData);
        }
    }

    setupEventListeners() {
        // Track page views
        this.trackPageView();

        // Track user interactions
        document.addEventListener('click', (e) => {
            this.trackUserInteraction(e);
        });

        // Track form submissions
        document.addEventListener('submit', (e) => {
            this.trackFormSubmission(e);
        });

        // Track search queries
        const searchForm = document.getElementById('searchForm');
        if (searchForm) {
            searchForm.addEventListener('submit', (e) => {
                this.trackSearchQuery(e);
            });
        }
    }

    async loadUserAnalytics() {
        try {
            const analytics = await this.fetchUserAnalytics();
            this.userStats = analytics.userStats;
            this.propertyStats = analytics.propertyStats;
            this.engagementMetrics = analytics.engagementMetrics;
            
            this.displayAnalytics();
        } catch (error) {
            console.error('Error loading analytics:', error);
        }
    }

    async fetchUserAnalytics() {
        // Mock data - in real app this comes from Firestore
        const userRole = this.currentUser?.role || 'renter';
        
        if (userRole === 'renter') {
            return {
                userStats: {
                    totalSearches: 45,
                    propertiesViewed: 23,
                    propertiesSaved: 8,
                    messagesSent: 12,
                    applicationsSubmitted: 3,
                    lastActive: new Date(Date.now() - 3600000)
                },
                propertyStats: {
                    averagePrice: 25000,
                    mostViewedType: 'apartment',
                    preferredLocation: 'Westlands',
                    averageResponseTime: '2.5 hours'
                },
                engagementMetrics: {
                    timeOnSite: '45 minutes',
                    pagesPerSession: 8,
                    bounceRate: '15%',
                    returnRate: '85%'
                }
            };
        } else {
            return {
                userStats: {
                    totalListings: 5,
                    propertiesRented: 3,
                    inquiriesReceived: 18,
                    messagesReplied: 15,
                    averageResponseTime: '1.2 hours',
                    lastActive: new Date(Date.now() - 1800000)
                },
                propertyStats: {
                    totalViews: 156,
                    averageViewsPerListing: 31,
                    mostPopularProperty: 'Modern 2-Bedroom Apartment',
                    averageRentPrice: 35000,
                    occupancyRate: '85%'
                },
                engagementMetrics: {
                    responseRate: '92%',
                    averageTimeToRent: '12 days',
                    tenantSatisfaction: '4.6/5',
                    repeatTenants: 2
                }
            };
        }
    }

    displayAnalytics() {
        const userRole = this.currentUser?.role || 'renter';
        
        if (userRole === 'renter') {
            this.displayRenterAnalytics();
        } else {
            this.displayLandlordAnalytics();
        }
    }

    displayRenterAnalytics() {
        const analyticsContainer = document.getElementById('analyticsContainer');
        if (!analyticsContainer) return;

        analyticsContainer.innerHTML = `
            <div class="analytics-grid">
                <div class="analytics-card">
                    <div class="analytics-header">
                        <h3><i class="fas fa-search"></i> Search Activity</h3>
                    </div>
                    <div class="analytics-content">
                        <div class="stat-item">
                            <span class="stat-number">${this.userStats.totalSearches}</span>
                            <span class="stat-label">Total Searches</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-number">${this.userStats.propertiesViewed}</span>
                            <span class="stat-label">Properties Viewed</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-number">${this.userStats.propertiesSaved}</span>
                            <span class="stat-label">Properties Saved</span>
                        </div>
                    </div>
                </div>

                <div class="analytics-card">
                    <div class="analytics-header">
                        <h3><i class="fas fa-comments"></i> Communication</h3>
                    </div>
                    <div class="analytics-content">
                        <div class="stat-item">
                            <span class="stat-number">${this.userStats.messagesSent}</span>
                            <span class="stat-label">Messages Sent</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-number">${this.userStats.applicationsSubmitted}</span>
                            <span class="stat-label">Applications</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-number">${this.propertyStats.averageResponseTime}</span>
                            <span class="stat-label">Avg Response Time</span>
                        </div>
                    </div>
                </div>

                <div class="analytics-card">
                    <div class="analytics-header">
                        <h3><i class="fas fa-chart-line"></i> Preferences</h3>
                    </div>
                    <div class="analytics-content">
                        <div class="stat-item">
                            <span class="stat-number">KSh ${this.propertyStats.averagePrice.toLocaleString()}</span>
                            <span class="stat-label">Avg Price Viewed</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-number">${this.propertyStats.mostViewedType}</span>
                            <span class="stat-label">Preferred Type</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-number">${this.propertyStats.preferredLocation}</span>
                            <span class="stat-label">Preferred Location</span>
                        </div>
                    </div>
                </div>

                <div class="analytics-card">
                    <div class="analytics-header">
                        <h3><i class="fas fa-clock"></i> Engagement</h3>
                    </div>
                    <div class="analytics-content">
                        <div class="stat-item">
                            <span class="stat-number">${this.engagementMetrics.timeOnSite}</span>
                            <span class="stat-label">Time on Site</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-number">${this.engagementMetrics.pagesPerSession}</span>
                            <span class="stat-label">Pages per Session</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-number">${this.engagementMetrics.returnRate}</span>
                            <span class="stat-label">Return Rate</span>
                        </div>
                    </div>
                </div>
            </div>

            <div class="analytics-insights">
                <h3><i class="fas fa-lightbulb"></i> Insights & Recommendations</h3>
                <div class="insights-grid">
                    <div class="insight-item">
                        <i class="fas fa-arrow-up"></i>
                        <p>Your search activity has increased by 25% this month</p>
                    </div>
                    <div class="insight-item">
                        <i class="fas fa-star"></i>
                        <p>Properties in ${this.propertyStats.preferredLocation} have the best response rates</p>
                    </div>
                    <div class="insight-item">
                        <i class="fas fa-clock"></i>
                        <p>Landlords respond fastest between 9 AM - 11 AM</p>
                    </div>
                </div>
            </div>
        `;
    }

    displayLandlordAnalytics() {
        const analyticsContainer = document.getElementById('analyticsContainer');
        if (!analyticsContainer) return;

        analyticsContainer.innerHTML = `
            <div class="analytics-grid">
                <div class="analytics-card">
                    <div class="analytics-header">
                        <h3><i class="fas fa-home"></i> Property Performance</h3>
                    </div>
                    <div class="analytics-content">
                        <div class="stat-item">
                            <span class="stat-number">${this.userStats.totalListings}</span>
                            <span class="stat-label">Active Listings</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-number">${this.userStats.propertiesRented}</span>
                            <span class="stat-label">Properties Rented</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-number">${this.propertyStats.occupancyRate}</span>
                            <span class="stat-label">Occupancy Rate</span>
                        </div>
                    </div>
                </div>

                <div class="analytics-card">
                    <div class="analytics-header">
                        <h3><i class="fas fa-eye"></i> Views & Interest</h3>
                    </div>
                    <div class="analytics-content">
                        <div class="stat-item">
                            <span class="stat-number">${this.propertyStats.totalViews}</span>
                            <span class="stat-label">Total Views</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-number">${this.propertyStats.averageViewsPerListing}</span>
                            <span class="stat-label">Avg Views per Listing</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-number">${this.userStats.inquiriesReceived}</span>
                            <span class="stat-label">Inquiries Received</span>
                        </div>
                    </div>
                </div>

                <div class="analytics-card">
                    <div class="analytics-header">
                        <h3><i class="fas fa-comments"></i> Communication</h3>
                    </div>
                    <div class="analytics-content">
                        <div class="stat-item">
                            <span class="stat-number">${this.engagementMetrics.responseRate}</span>
                            <span class="stat-label">Response Rate</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-number">${this.userStats.averageResponseTime}</span>
                            <span class="stat-label">Avg Response Time</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-number">${this.userStats.messagesReplied}</span>
                            <span class="stat-label">Messages Replied</span>
                        </div>
                    </div>
                </div>

                <div class="analytics-card">
                    <div class="analytics-header">
                        <h3><i class="fas fa-chart-line"></i> Performance</h3>
                    </div>
                    <div class="analytics-content">
                        <div class="stat-item">
                            <span class="stat-number">${this.engagementMetrics.averageTimeToRent}</span>
                            <span class="stat-label">Avg Time to Rent</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-number">${this.engagementMetrics.tenantSatisfaction}</span>
                            <span class="stat-label">Tenant Satisfaction</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-number">${this.engagementMetrics.repeatTenants}</span>
                            <span class="stat-label">Repeat Tenants</span>
                        </div>
                    </div>
                </div>
            </div>

            <div class="analytics-insights">
                <h3><i class="fas fa-lightbulb"></i> Insights & Recommendations</h3>
                <div class="insights-grid">
                    <div class="insight-item">
                        <i class="fas fa-arrow-up"></i>
                        <p>Your response rate is 8% above the platform average</p>
                    </div>
                    <div class="insight-item">
                        <i class="fas fa-star"></i>
                        <p>${this.propertyStats.mostPopularProperty} is your most viewed listing</p>
                    </div>
                    <div class="insight-item">
                        <i class="fas fa-clock"></i>
                        <p>Consider adding more photos to increase view-to-inquiry conversion</p>
                    </div>
                </div>
            </div>
        `;
    }

    trackPageView() {
        const pageData = {
            page: window.location.pathname,
            timestamp: new Date(),
            userAgent: navigator.userAgent,
            screenSize: `${screen.width}x${screen.height}`,
            referrer: document.referrer
        };

        this.saveAnalyticsEvent('page_view', pageData);
    }

    trackUserInteraction(event) {
        const target = event.target;
        const interactionData = {
            element: target.tagName.toLowerCase(),
            elementId: target.id || '',
            elementClass: target.className || '',
            text: target.textContent?.substring(0, 50) || '',
            timestamp: new Date(),
            page: window.location.pathname
        };

        // Track specific interactions
        if (target.matches('.btn-primary, .btn-secondary')) {
            this.saveAnalyticsEvent('button_click', interactionData);
        } else if (target.matches('a')) {
            this.saveAnalyticsEvent('link_click', interactionData);
        } else if (target.matches('input, select, textarea')) {
            this.saveAnalyticsEvent('form_interaction', interactionData);
        }
    }

    trackFormSubmission(event) {
        const formData = {
            formId: event.target.id || 'unknown',
            formAction: event.target.action || '',
            timestamp: new Date(),
            page: window.location.pathname
        };

        this.saveAnalyticsEvent('form_submission', formData);
    }

    trackSearchQuery(event) {
        const formData = new FormData(event.target);
        const searchData = {
            query: formData.get('location') || '',
            filters: {
                priceRange: formData.get('priceRange') || '',
                propertyType: formData.get('propertyType') || '',
                amenities: formData.getAll('amenities') || []
            },
            timestamp: new Date()
        };

        this.saveAnalyticsEvent('search_query', searchData);
    }

    trackPropertyView(propertyId) {
        const viewData = {
            propertyId: propertyId,
            timestamp: new Date(),
            page: window.location.pathname
        };

        this.saveAnalyticsEvent('property_view', viewData);
    }

    trackMessageSent(conversationId, recipientId) {
        const messageData = {
            conversationId: conversationId,
            recipientId: recipientId,
            timestamp: new Date()
        };

        this.saveAnalyticsEvent('message_sent', messageData);
    }

    trackPropertySave(propertyId) {
        const saveData = {
            propertyId: propertyId,
            timestamp: new Date()
        };

        this.saveAnalyticsEvent('property_save', saveData);
    }

    async saveAnalyticsEvent(eventType, eventData) {
        try {
            // In a real app, this would save to Firestore
            const analyticsEvent = {
                eventType: eventType,
                eventData: eventData,
                userId: this.currentUser?.id || 'anonymous',
                userRole: this.currentUser?.role || 'guest',
                timestamp: new Date(),
                sessionId: this.getSessionId()
            };

            console.log('Analytics Event:', analyticsEvent);
            
            // Store locally for now
            this.storeAnalyticsEvent(analyticsEvent);
            
        } catch (error) {
            console.error('Error saving analytics event:', error);
        }
    }

    storeAnalyticsEvent(event) {
        // Store analytics events locally
        const events = JSON.parse(localStorage.getItem('deniFinderAnalytics') || '[]');
        events.push(event);
        
        // Keep only last 100 events
        if (events.length > 100) {
            events.splice(0, events.length - 100);
        }
        
        localStorage.setItem('deniFinderAnalytics', JSON.stringify(events));
    }

    getSessionId() {
        let sessionId = localStorage.getItem('deniFinderSessionId');
        if (!sessionId) {
            sessionId = 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            localStorage.setItem('deniFinderSessionId', sessionId);
        }
        return sessionId;
    }

    generateReport(startDate, endDate) {
        const events = JSON.parse(localStorage.getItem('deniFinderAnalytics') || '[]');
        const filteredEvents = events.filter(event => {
            const eventDate = new Date(event.timestamp);
            return eventDate >= startDate && eventDate <= endDate;
        });

        const report = {
            period: { start: startDate, end: endDate },
            totalEvents: filteredEvents.length,
            eventsByType: {},
            userEngagement: {
                pageViews: 0,
                searches: 0,
                propertyViews: 0,
                messagesSent: 0,
                propertiesSaved: 0
            },
            topPages: {},
            topSearches: {}
        };

        filteredEvents.forEach(event => {
            // Count events by type
            report.eventsByType[event.eventType] = (report.eventsByType[event.eventType] || 0) + 1;

            // Count specific engagement metrics
            switch (event.eventType) {
                case 'page_view':
                    report.userEngagement.pageViews++;
                    report.topPages[event.eventData.page] = (report.topPages[event.eventData.page] || 0) + 1;
                    break;
                case 'search_query':
                    report.userEngagement.searches++;
                    if (event.eventData.query) {
                        report.topSearches[event.eventData.query] = (report.topSearches[event.eventData.query] || 0) + 1;
                    }
                    break;
                case 'property_view':
                    report.userEngagement.propertyViews++;
                    break;
                case 'message_sent':
                    report.userEngagement.messagesSent++;
                    break;
                case 'property_save':
                    report.userEngagement.propertiesSaved++;
                    break;
            }
        });

        return report;
    }

    exportAnalytics() {
        const events = JSON.parse(localStorage.getItem('deniFinderAnalytics') || '[]');
        const dataStr = JSON.stringify(events, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        
        const link = document.createElement('a');
        link.href = URL.createObjectURL(dataBlob);
        link.download = `denifinder-analytics-${new Date().toISOString().split('T')[0]}.json`;
        link.click();
    }
}

// Initialize analytics system
const analyticsSystem = new AnalyticsSystem();
document.addEventListener('DOMContentLoaded', () => {
    analyticsSystem.init();
}); 