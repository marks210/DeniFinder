// Search and Filtering System for DeniFinder

class PropertySearch {
    constructor() {
        this.filters = {
            location: '',
            priceRange: { min: 0, max: 1000000 },
            propertyType: [],
            amenities: [],
            availability: 'available',
            verifiedOnly: false,
            studentFriendly: false,
            university: '',
            bedrooms: 0,
            bathrooms: 0
        };
        
        this.searchResults = [];
        this.currentPage = 1;
        this.resultsPerPage = 12;
    }

    // Initialize search functionality
    init() {
        this.setupEventListeners();
        this.setupPriceSlider();
        this.setupAmenitiesFilter();
        this.setupLocationAutocomplete();
    }

    setupEventListeners() {
        // Search form submission
        const searchForm = document.getElementById('searchForm');
        if (searchForm) {
            searchForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.performSearch();
            });
        }

        // Filter changes
        const filterInputs = document.querySelectorAll('.filter-input');
        filterInputs.forEach(input => {
            input.addEventListener('change', () => {
                this.updateFilters();
                this.performSearch();
            });
        });

        // Clear filters
        const clearFiltersBtn = document.getElementById('clearFilters');
        if (clearFiltersBtn) {
            clearFiltersBtn.addEventListener('click', () => {
                this.clearFilters();
            });
        }
    }

    setupPriceSlider() {
        const priceSlider = document.getElementById('priceSlider');
        const priceDisplay = document.getElementById('priceDisplay');
        
        if (priceSlider && priceDisplay) {
            priceSlider.addEventListener('input', (e) => {
                const value = e.target.value;
                this.filters.priceRange.max = parseInt(value);
                priceDisplay.textContent = `Up to KSh ${value.toLocaleString()}`;
            });
        }
    }

    setupAmenitiesFilter() {
        const amenityCheckboxes = document.querySelectorAll('.amenity-checkbox');
        amenityCheckboxes.forEach(checkbox => {
            checkbox.addEventListener('change', () => {
                this.updateAmenitiesFilter();
            });
        });
    }

    setupLocationAutocomplete() {
        const locationInput = document.getElementById('locationInput');
        if (locationInput) {
            // Add autocomplete functionality
            locationInput.addEventListener('input', (e) => {
                this.suggestLocations(e.target.value);
            });
        }
    }

    updateFilters() {
        // Update filters based on form inputs
        const locationInput = document.getElementById('locationInput');
        const propertyTypeSelect = document.getElementById('propertyType');
        const availabilitySelect = document.getElementById('availability');
        const verifiedCheckbox = document.getElementById('verifiedOnly');
        const studentCheckbox = document.getElementById('studentFriendly');
        const universitySelect = document.getElementById('university');
        const bedroomsSelect = document.getElementById('bedrooms');
        const bathroomsSelect = document.getElementById('bathrooms');

        if (locationInput) this.filters.location = locationInput.value;
        if (propertyTypeSelect) this.filters.propertyType = propertyTypeSelect.value ? [propertyTypeSelect.value] : [];
        if (availabilitySelect) this.filters.availability = availabilitySelect.value;
        if (verifiedCheckbox) this.filters.verifiedOnly = verifiedCheckbox.checked;
        if (studentCheckbox) this.filters.studentFriendly = studentCheckbox.checked;
        if (universitySelect) this.filters.university = universitySelect.value;
        if (bedroomsSelect) this.filters.bedrooms = parseInt(bedroomsSelect.value) || 0;
        if (bathroomsSelect) this.filters.bathrooms = parseInt(bathroomsSelect.value) || 0;
    }

    updateAmenitiesFilter() {
        const amenityCheckboxes = document.querySelectorAll('.amenity-checkbox:checked');
        this.filters.amenities = Array.from(amenityCheckboxes).map(cb => cb.value);
    }

    async performSearch() {
        try {
            // Show loading state
            this.showLoadingState();

            // In a real app, this would be a Firestore query
            // For now, we'll simulate the search
            const results = await this.simulateSearch();
            
            this.searchResults = results;
            this.displayResults();
            this.updateSearchStats();
            
        } catch (error) {
            console.error('Search error:', error);
            this.showError('Search failed. Please try again.');
        }
    }

    async simulateSearch() {
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Mock data - in real app this comes from Firestore
        const mockProperties = [
            {
                id: '1',
                title: 'Modern 2-Bedroom Apartment',
                location: 'Westlands, Nairobi',
                price: 45000,
                type: 'apartment',
                bedrooms: 2,
                bathrooms: 2,
                amenities: ['wifi', 'parking', 'security'],
                verified: true,
                studentFriendly: true,
                university: 'uon',
                availability: 'available',
                images: ['images/project.jpg'],
                description: 'Beautiful modern apartment with all amenities...',
                landlord: {
                    name: 'John Doe',
                    verified: true,
                    rating: 4.5
                }
            },
            {
                id: '2',
                title: 'Student Hostel - Near University',
                location: 'Kilimani, Nairobi',
                price: 15000,
                type: 'hostel',
                bedrooms: 1,
                bathrooms: 1,
                amenities: ['wifi', 'meals', 'laundry'],
                verified: true,
                studentFriendly: true,
                university: 'ku',
                availability: 'available',
                images: ['images/hostels.jpeg'],
                description: 'Perfect for students with meal plans included...',
                landlord: {
                    name: 'Student Housing Ltd',
                    verified: true,
                    rating: 4.2
                }
            },
            {
                id: '3',
                title: 'Family House with Garden',
                location: 'Eastlands, Nairobi',
                price: 35000,
                type: 'house',
                bedrooms: 3,
                bathrooms: 2,
                amenities: ['garden', 'parking', 'security'],
                verified: false,
                studentFriendly: false,
                university: '',
                availability: 'available',
                images: ['images/tenant.jpeg'],
                description: 'Spacious family home with beautiful garden...',
                landlord: {
                    name: 'Mary Smith',
                    verified: false,
                    rating: 4.0
                }
            }
        ];

        // Apply filters
        return mockProperties.filter(property => this.matchesFilters(property));
    }

    matchesFilters(property) {
        // Location filter
        if (this.filters.location && !property.location.toLowerCase().includes(this.filters.location.toLowerCase())) {
            return false;
        }

        // Price filter
        if (property.price > this.filters.priceRange.max || property.price < this.filters.priceRange.min) {
            return false;
        }

        // Property type filter
        if (this.filters.propertyType.length > 0 && !this.filters.propertyType.includes(property.type)) {
            return false;
        }

        // Availability filter
        if (this.filters.availability !== 'all' && property.availability !== this.filters.availability) {
            return false;
        }

        // Verified only filter
        if (this.filters.verifiedOnly && !property.verified) {
            return false;
        }

        // Student friendly filter
        if (this.filters.studentFriendly && !property.studentFriendly) {
            return false;
        }

        // University filter
        if (this.filters.university && property.university !== this.filters.university) {
            return false;
        }

        // Bedrooms filter
        if (this.filters.bedrooms > 0 && property.bedrooms < this.filters.bedrooms) {
            return false;
        }

        // Bathrooms filter
        if (this.filters.bathrooms > 0 && property.bathrooms < this.filters.bathrooms) {
            return false;
        }

        // Amenities filter
        if (this.filters.amenities.length > 0) {
            const hasAllAmenities = this.filters.amenities.every(amenity => 
                property.amenities.includes(amenity)
            );
            if (!hasAllAmenities) return false;
        }

        return true;
    }

    displayResults() {
        const resultsContainer = document.getElementById('searchResults');
        if (!resultsContainer) return;

        if (this.searchResults.length === 0) {
            resultsContainer.innerHTML = `
                <div class="no-results">
                    <i class="fas fa-search"></i>
                    <h3>No properties found</h3>
                    <p>Try adjusting your search criteria or browse all properties.</p>
                    <button onclick="propertySearch.clearFilters()" class="btn-primary">Clear Filters</button>
                </div>
            `;
            return;
        }

        const startIndex = (this.currentPage - 1) * this.resultsPerPage;
        const endIndex = startIndex + this.resultsPerPage;
        const pageResults = this.searchResults.slice(startIndex, endIndex);

        resultsContainer.innerHTML = pageResults.map(property => this.createPropertyCard(property)).join('');
        
        this.displayPagination();
    }

    createPropertyCard(property) {
        const amenitiesList = property.amenities.map(amenity => 
            `<span class="amenity-tag">${this.getAmenityIcon(amenity)} ${amenity}</span>`
        ).join('');

        return `
            <div class="property-card" data-property-id="${property.id}">
                <div class="property-image">
                    <img src="${property.images[0]}" alt="${property.title}">
                    <div class="property-badges">
                        ${property.verified ? '<span class="badge verified">Verified</span>' : ''}
                        ${property.studentFriendly ? '<span class="badge student">Student</span>' : ''}
                        <span class="badge ${property.availability}">${property.availability}</span>
                    </div>
                </div>
                <div class="property-content">
                    <h3>${property.title}</h3>
                    <p class="location"><i class="fas fa-map-marker-alt"></i> ${property.location}</p>
                    <p class="price">KSh ${property.price.toLocaleString()}/month</p>
                    <div class="property-details">
                        <span><i class="fas fa-bed"></i> ${property.bedrooms} Bed</span>
                        <span><i class="fas fa-bath"></i> ${property.bathrooms} Bath</span>
                        <span><i class="fas fa-home"></i> ${property.type}</span>
                    </div>
                    <div class="amenities">
                        ${amenitiesList}
                    </div>
                    <div class="landlord-info">
                        <span class="landlord-name">${property.landlord.name}</span>
                        <span class="landlord-rating">
                            <i class="fas fa-star"></i> ${property.landlord.rating}
                        </span>
                    </div>
                    <div class="property-actions">
                        <button class="btn-primary" onclick="propertySearch.viewProperty('${property.id}')">
                            View Details
                        </button>
                        <button class="btn-secondary" onclick="propertySearch.contactLandlord('${property.id}')">
                            <i class="fas fa-envelope"></i> Contact
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    getAmenityIcon(amenity) {
        const icons = {
            wifi: 'fas fa-wifi',
            parking: 'fas fa-parking',
            security: 'fas fa-shield-alt',
            meals: 'fas fa-utensils',
            laundry: 'fas fa-tshirt',
            garden: 'fas fa-leaf',
            gym: 'fas fa-dumbbell',
            pool: 'fas fa-swimming-pool'
        };
        return icons[amenity] || 'fas fa-check';
    }

    displayPagination() {
        const totalPages = Math.ceil(this.searchResults.length / this.resultsPerPage);
        const paginationContainer = document.getElementById('pagination');
        
        if (!paginationContainer || totalPages <= 1) return;

        let paginationHTML = '<div class="pagination">';
        
        // Previous button
        if (this.currentPage > 1) {
            paginationHTML += `<button onclick="propertySearch.goToPage(${this.currentPage - 1})">Previous</button>`;
        }

        // Page numbers
        for (let i = 1; i <= totalPages; i++) {
            if (i === this.currentPage) {
                paginationHTML += `<button class="active">${i}</button>`;
            } else {
                paginationHTML += `<button onclick="propertySearch.goToPage(${i})">${i}</button>`;
            }
        }

        // Next button
        if (this.currentPage < totalPages) {
            paginationHTML += `<button onclick="propertySearch.goToPage(${this.currentPage + 1})">Next</button>`;
        }

        paginationHTML += '</div>';
        paginationContainer.innerHTML = paginationHTML;
    }

    goToPage(page) {
        this.currentPage = page;
        this.displayResults();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    updateSearchStats() {
        const statsContainer = document.getElementById('searchStats');
        if (!statsContainer) return;

        statsContainer.innerHTML = `
            <p>Found ${this.searchResults.length} properties matching your criteria</p>
        `;
    }

    clearFilters() {
        this.filters = {
            location: '',
            priceRange: { min: 0, max: 1000000 },
            propertyType: [],
            amenities: [],
            availability: 'available',
            verifiedOnly: false,
            studentFriendly: false,
            university: '',
            bedrooms: 0,
            bathrooms: 0
        };

        // Reset form inputs
        const form = document.getElementById('searchForm');
        if (form) form.reset();

        // Reset price slider
        const priceSlider = document.getElementById('priceSlider');
        const priceDisplay = document.getElementById('priceDisplay');
        if (priceSlider) {
            priceSlider.value = 1000000;
            if (priceDisplay) priceDisplay.textContent = 'Up to KSh 1,000,000';
        }

        // Uncheck all amenity checkboxes
        const amenityCheckboxes = document.querySelectorAll('.amenity-checkbox');
        amenityCheckboxes.forEach(cb => cb.checked = false);

        this.performSearch();
    }

    showLoadingState() {
        const resultsContainer = document.getElementById('searchResults');
        if (resultsContainer) {
            resultsContainer.innerHTML = `
                <div class="loading">
                    <i class="fas fa-spinner fa-spin"></i>
                    <p>Searching for properties...</p>
                </div>
            `;
        }
    }

    showError(message) {
        const resultsContainer = document.getElementById('searchResults');
        if (resultsContainer) {
            resultsContainer.innerHTML = `
                <div class="error">
                    <i class="fas fa-exclamation-triangle"></i>
                    <p>${message}</p>
                </div>
            `;
        }
    }

    viewProperty(propertyId) {
        // Navigate to property details page
        window.location.href = `property-details.html?id=${propertyId}`;
    }

    contactLandlord(propertyId) {
        // Open contact modal or navigate to messaging
        window.location.href = `dashboard.html?action=contact&property=${propertyId}`;
    }

    suggestLocations(query) {
        // In a real app, this would call a geocoding API
        const suggestions = [
            'Westlands, Nairobi',
            'Kilimani, Nairobi',
            'Eastlands, Nairobi',
            'Karen, Nairobi',
            'Lavington, Nairobi'
        ].filter(location => 
            location.toLowerCase().includes(query.toLowerCase())
        );

        // Display suggestions
        this.displayLocationSuggestions(suggestions);
    }

    displayLocationSuggestions(suggestions) {
        const suggestionsContainer = document.getElementById('locationSuggestions');
        if (!suggestionsContainer) return;

        if (suggestions.length === 0) {
            suggestionsContainer.style.display = 'none';
            return;
        }

        suggestionsContainer.innerHTML = suggestions.map(suggestion => 
            `<div class="suggestion" onclick="propertySearch.selectLocation('${suggestion}')">${suggestion}</div>`
        ).join('');
        suggestionsContainer.style.display = 'block';
    }

    selectLocation(location) {
        const locationInput = document.getElementById('locationInput');
        if (locationInput) {
            locationInput.value = location;
        }
        
        const suggestionsContainer = document.getElementById('locationSuggestions');
        if (suggestionsContainer) {
            suggestionsContainer.style.display = 'none';
        }
    }
}

// Initialize search system
const propertySearch = new PropertySearch();
document.addEventListener('DOMContentLoaded', () => {
    propertySearch.init();
}); 