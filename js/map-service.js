// Map Service for DeniFinder
// Handles property mapping, markers, and location services

class MapService {
    constructor() {
        this.map = null;
        this.markers = [];
        this.properties = [];
        this.currentUser = null;
    }

    // Initialize map
    initMap(containerId, center = [-1.2921, 36.8219], zoom = 13) {
        if (this.map) {
            this.map.remove();
        }

        this.map = L.map(containerId).setView(center, zoom);

        // Add OpenStreetMap tiles
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19,
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(this.map);

        return this.map;
    }

    // Load properties from Firebase
    async loadProperties() {
        try {
            if (window.DeniFinderFirebase && window.DeniFinderFirebase.db) {
                const snapshot = await window.DeniFinderFirebase.db.collection('properties').get();
                this.properties = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
            } else {
                // Fallback to sample data
                this.properties = this.getSampleProperties();
            }
            
            return this.properties;
        } catch (error) {
            console.error('Error loading properties:', error);
            this.properties = this.getSampleProperties();
            return this.properties;
        }
    }

    // Get sample properties for testing
    getSampleProperties() {
        return [
            {
                id: '1',
                title: 'Modern 2-Bedroom Apartment',
                location: 'Westlands, Nairobi',
                price: 45000,
                type: 'apartment',
                status: 'available',
                coordinates: [-1.2921, 36.8219],
                description: 'Beautiful apartment with modern amenities, close to shopping centers',
                contact: '+254 700 123 456',
                ownerId: 'sample-owner-1',
                createdAt: new Date()
            },
            {
                id: '2',
                title: 'Student Room Near University',
                location: 'Kilimani, Nairobi',
                price: 25000,
                type: 'room',
                status: 'available',
                coordinates: [-1.3000, 36.8300],
                description: 'Perfect for students, close to campus and transport',
                contact: '+254 700 234 567',
                ownerId: 'sample-owner-2',
                createdAt: new Date()
            },
            {
                id: '3',
                title: 'Family House with Garden',
                location: 'Karen, Nairobi',
                price: 80000,
                type: 'house',
                status: 'rented',
                coordinates: [-1.3200, 36.7100],
                description: 'Spacious family home with beautiful garden and security',
                contact: '+254 700 345 678',
                ownerId: 'sample-owner-3',
                createdAt: new Date()
            },
            {
                id: '4',
                title: 'Student Hostel',
                location: 'Eastlands, Nairobi',
                price: 18000,
                type: 'hostel',
                status: 'available',
                coordinates: [-1.2800, 36.8500],
                description: 'Affordable student accommodation with meals included',
                contact: '+254 700 456 789',
                ownerId: 'sample-owner-4',
                createdAt: new Date()
            },
            {
                id: '5',
                title: 'Studio Apartment',
                location: 'CBD, Nairobi',
                price: 35000,
                type: 'studio',
                status: 'available',
                coordinates: [-1.2921, 36.8219],
                description: 'Modern studio in city center, perfect for professionals',
                contact: '+254 700 567 890',
                ownerId: 'sample-owner-5',
                createdAt: new Date()
            },
            {
                id: '6',
                title: 'Shared House',
                location: 'Lavington, Nairobi',
                price: 30000,
                type: 'house',
                status: 'available',
                coordinates: [-1.3100, 36.8000],
                description: 'Shared house with 3 bedrooms, great for roommates',
                contact: '+254 700 678 901',
                ownerId: 'sample-owner-6',
                createdAt: new Date()
            }
        ];
    }

    // Add markers to map
    addMarkersToMap(properties = null) {
        const propertiesToShow = properties || this.properties;
        
        // Clear existing markers
        this.clearMarkers();

        propertiesToShow.forEach(property => {
            if (property.coordinates) {
                const marker = this.createMarker(property);
                this.markers.push(marker);
            }
        });
    }

    // Create individual marker
    createMarker(property) {
        const icon = this.createMarkerIcon(property.status);
        
        const marker = L.marker(property.coordinates, { icon }).addTo(this.map);
        
        // Add popup
        marker.bindPopup(this.createPopupContent(property));
        
        // Store property reference
        marker.propertyId = property.id;
        
        return marker;
    }

    // Create marker icon based on status
    createMarkerIcon(status) {
        const color = status === 'available' ? '#4CAF50' : '#666';
        
        return L.divIcon({
            className: 'custom-marker',
            html: `<div style="
                background: ${color};
                width: 20px;
                height: 20px;
                border-radius: 50%;
                border: 3px solid white;
                box-shadow: 0 2px 4px rgba(0,0,0,0.3);
            "></div>`,
            iconSize: [20, 20],
            iconAnchor: [10, 10]
        });
    }

    // Create popup content
    createPopupContent(property) {
        return `
            <div class="property-popup">
                <div class="popup-title">${property.title}</div>
                <div class="popup-price">MK ${property.price.toLocaleString()}/month</div>
                <div>${property.location}</div>
                <div>${property.description}</div>
                <div style="margin-top: 10px;">
                    <a href="tel:${property.contact}" class="popup-btn" style="
                        background: #FFB800;
                        color: #222;
                        padding: 5px 10px;
                        border-radius: 4px;
                        text-decoration: none;
                        font-size: 12px;
                        margin-right: 5px;
                    ">
                        <i class="fas fa-phone"></i> Call
                    </a>
                    <button onclick="viewPropertyDetails('${property.id}')" class="popup-btn" style="
                        background: #00B4D8;
                        color: white;
                        padding: 5px 10px;
                        border: none;
                        border-radius: 4px;
                        font-size: 12px;
                        cursor: pointer;
                    ">
                        <i class="fas fa-info"></i> Details
                    </button>
                </div>
            </div>
        `;
    }

    // Clear all markers
    clearMarkers() {
        this.markers.forEach(marker => {
            if (this.map) {
                this.map.removeLayer(marker);
            }
        });
        this.markers = [];
    }

    // Focus on specific property
    focusOnProperty(propertyId) {
        const property = this.properties.find(p => p.id === propertyId);
        if (property && property.coordinates) {
            this.map.setView(property.coordinates, 16);
            
            // Find and open popup for the marker
            const marker = this.markers.find(m => m.propertyId === propertyId);
            if (marker) {
                marker.openPopup();
            }
        }
    }

    // Filter properties
    filterProperties(filters) {
        return this.properties.filter(property => {
            const matchesSearch = !filters.search || 
                property.title.toLowerCase().includes(filters.search.toLowerCase()) ||
                property.location.toLowerCase().includes(filters.search.toLowerCase());
            
            const matchesType = !filters.type || property.type === filters.type;
            const matchesStatus = !filters.status || property.status === filters.status;
            
            const matchesPrice = (!filters.minPrice || property.price >= parseInt(filters.minPrice)) &&
                               (!filters.maxPrice || property.price <= parseInt(filters.maxPrice));

            return matchesSearch && matchesType && matchesStatus && matchesPrice;
        });
    }

    // Update markers based on filtered properties
    updateMarkersWithFilter(filters) {
        const filteredProperties = this.filterProperties(filters);
        this.addMarkersToMap(filteredProperties);
        return filteredProperties;
    }

    // Locate user
    locateUser() {
        return new Promise((resolve, reject) => {
            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(
                    (position) => {
                        const { latitude, longitude } = position.coords;
                        this.map.setView([latitude, longitude], 15);
                        
                        // Add user location marker
                        const userMarker = L.marker([latitude, longitude])
                            .addTo(this.map)
                            .bindPopup('Your Location')
                            .openPopup();
                        
                        resolve({ latitude, longitude, marker: userMarker });
                    },
                    (error) => {
                        reject(error);
                    }
                );
            } else {
                reject(new Error('Geolocation not supported'));
            }
        });
    }

    // Add new property to map
    async addProperty(propertyData) {
        try {
            if (window.DeniFinderFirebase && window.DeniFinderFirebase.db) {
                const docRef = await window.DeniFinderFirebase.db.collection('properties').add({
                    ...propertyData,
                    createdAt: new Date(),
                    updatedAt: new Date()
                });
                
                const newProperty = { id: docRef.id, ...propertyData };
                this.properties.push(newProperty);
                
                // Add marker to map
                this.addMarkersToMap();
                
                return { success: true, property: newProperty };
            } else {
                // Fallback for testing
                const newProperty = {
                    id: Date.now().toString(),
                    ...propertyData,
                    createdAt: new Date()
                };
                
                this.properties.push(newProperty);
                this.addMarkersToMap();
                
                return { success: true, property: newProperty };
            }
        } catch (error) {
            console.error('Error adding property:', error);
            return { success: false, error: error.message };
        }
    }

    // Update property
    async updateProperty(propertyId, updates) {
        try {
            if (window.DeniFinderFirebase && window.DeniFinderFirebase.db) {
                await window.DeniFinderFirebase.db.collection('properties').doc(propertyId).update({
                    ...updates,
                    updatedAt: new Date()
                });
            }
            
            // Update local data
            const index = this.properties.findIndex(p => p.id === propertyId);
            if (index !== -1) {
                this.properties[index] = { ...this.properties[index], ...updates };
            }
            
            // Refresh markers
            this.addMarkersToMap();
            
            return { success: true };
        } catch (error) {
            console.error('Error updating property:', error);
            return { success: false, error: error.message };
        }
    }

    // Delete property
    async deleteProperty(propertyId) {
        try {
            if (window.DeniFinderFirebase && window.DeniFinderFirebase.db) {
                await window.DeniFinderFirebase.db.collection('properties').doc(propertyId).delete();
            }
            
            // Remove from local data
            this.properties = this.properties.filter(p => p.id !== propertyId);
            
            // Refresh markers
            this.addMarkersToMap();
            
            return { success: true };
        } catch (error) {
            console.error('Error deleting property:', error);
            return { success: false, error: error.message };
        }
    }

    // Get properties by owner
    getPropertiesByOwner(ownerId) {
        return this.properties.filter(property => property.ownerId === ownerId);
    }

    // Get available properties
    getAvailableProperties() {
        return this.properties.filter(property => property.status === 'available');
    }

    // Search properties by location
    searchByLocation(location) {
        return this.properties.filter(property => 
            property.location.toLowerCase().includes(location.toLowerCase())
        );
    }

    // Get map bounds
    getMapBounds() {
        if (this.map) {
            return this.map.getBounds();
        }
        return null;
    }

    // Fit map to show all markers
    fitMapToMarkers() {
        if (this.markers.length > 0) {
            const group = new L.featureGroup(this.markers);
            this.map.fitBounds(group.getBounds().pad(0.1));
        }
    }

    // Destroy map
    destroy() {
        if (this.map) {
            this.map.remove();
            this.map = null;
        }
        this.clearMarkers();
        this.properties = [];
    }
}

// Global function to view property details
window.viewPropertyDetails = function(propertyId) {
    // This can be implemented to show detailed property view
    console.log('Viewing property details for:', propertyId);
    // You can redirect to a property details page or show a modal
    alert(`Property details for ID: ${propertyId}\n\nThis would show detailed property information, photos, and contact details.`);
};

// Export for use in other files
window.MapService = MapService; 