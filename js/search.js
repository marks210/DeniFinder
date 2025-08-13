// Search Service for DeniFinder - Supabase Integration

class SearchService {
    constructor() {
        this.currentUser = null;
        this.searchHistory = [];
        this.savedSearches = [];
        this.searchFilters = {
            propertyType: [],
            priceRange: { min: 0, max: 1000000 },
            location: '',
            bedrooms: [],
            bathrooms: [],
            amenities: [],
            university: '',
            distance: 10, // km
            availability: 'all', // all, available, rented
            verifiedLandlord: false,
            studentFriendly: false
        };
        this.searchResults = [];
        this.totalResults = 0;
        this.currentPage = 1;
        this.resultsPerPage = 20;
    }

    init() {
        this.loadCurrentUser();
        this.loadSearchHistory();
        this.loadSavedSearches();
        this.setupEventListeners();
        this.initializeSearchUI();
    }

    loadCurrentUser() {
        const userData = localStorage.getItem('deniFinderCurrentUser');
        if (userData) {
            this.currentUser = JSON.parse(userData);
        }
    }

    loadSearchHistory() {
        const history = localStorage.getItem('deniFinderSearchHistory');
        if (history) {
            this.searchHistory = JSON.parse(history);
        }
    }

    loadSavedSearches() {
        const saved = localStorage.getItem('deniFinderSavedSearches');
        if (saved) {
            this.savedSearches = JSON.parse(saved);
        }
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

        // Quick search input
        const quickSearchInput = document.getElementById('quickSearchInput');
        if (quickSearchInput) {
            quickSearchInput.addEventListener('input', this.debounce(() => {
                this.performQuickSearch();
            }, 500));
        }

        // Filter toggles
        const filterToggles = document.querySelectorAll('.filter-toggle');
        filterToggles.forEach(toggle => {
            toggle.addEventListener('click', () => {
                this.toggleFilterPanel();
            });
        });

        // Save search button
        const saveSearchBtn = document.getElementById('saveSearchBtn');
        if (saveSearchBtn) {
            saveSearchBtn.addEventListener('click', () => {
                this.saveCurrentSearch();
            });
        }

        // Load more results
        const loadMoreBtn = document.getElementById('loadMoreBtn');
        if (loadMoreBtn) {
            loadMoreBtn.addEventListener('click', () => {
                this.loadMoreResults();
            });
        }
    }

    initializeSearchUI() {
        // Initialize price range slider
        this.initializePriceSlider();
        
        // Initialize location autocomplete
        this.initializeLocationAutocomplete();
        
        // Initialize university selector
        this.initializeUniversitySelector();
        
        // Initialize amenities checkboxes
        this.initializeAmenitiesCheckboxes();
    }

    initializePriceSlider() {
        const priceSlider = document.getElementById('priceSlider');
        if (priceSlider) {
            const minPrice = document.getElementById('minPrice');
            const maxPrice = document.getElementById('maxPrice');
            
            if (minPrice && maxPrice) {
                priceSlider.addEventListener('input', (e) => {
                    const value = e.target.value;
                    maxPrice.textContent = `KSh ${parseInt(value).toLocaleString()}`;
                    this.searchFilters.priceRange.max = parseInt(value);
                });
            }
        }
    }

    initializeLocationAutocomplete() {
        const locationInput = document.getElementById('locationInput');
        if (locationInput) {
            locationInput.addEventListener('input', this.debounce(async (e) => {
                const query = e.target.value;
                if (query.length > 2) {
                    const suggestions = await this.getLocationSuggestions(query);
                    this.showLocationSuggestions(suggestions);
                }
            }, 300));
        }
    }

    initializeUniversitySelector() {
        const universitySelect = document.getElementById('universitySelect');
        if (universitySelect) {
            universitySelect.addEventListener('change', (e) => {
                this.searchFilters.university = e.target.value;
            });
        }
    }

    initializeAmenitiesCheckboxes() {
        const amenityCheckboxes = document.querySelectorAll('input[name="amenities"]');
        amenityCheckboxes.forEach(checkbox => {
            checkbox.addEventListener('change', (e) => {
                if (e.target.checked) {
                    this.searchFilters.amenities.push(e.target.value);
                } else {
                    const index = this.searchFilters.amenities.indexOf(e.target.value);
                    if (index > -1) {
                        this.searchFilters.amenities.splice(index, 1);
                    }
                }
            });
        });
    }

    async performSearch() {
        try {
            this.showLoadingState();
            
            // Build search query
            const searchQuery = this.buildSearchQuery();
            
            // Perform search in Supabase
            const results = await this.searchProperties(searchQuery);
            
            // Process results
            this.processSearchResults(results);
            
            // Save to search history
            this.saveToSearchHistory(searchQuery);
            
            // Display results
            this.displaySearchResults();
            
            // Update URL with search params
            this.updateURLWithSearchParams();
            
        } catch (error) {
            console.error('Search error:', error);
            this.showErrorState('Search failed. Please try again.');
        }
    }

    async performQuickSearch() {
        const query = document.getElementById('quickSearchInput').value.trim();
        if (query.length < 2) return;

        try {
            const results = await this.quickSearch(query);
            this.displayQuickSearchResults(results);
        } catch (error) {
            console.error('Quick search error:', error);
        }
    }

    buildSearchQuery() {
        const query = {
            filters: {},
            sort: { field: 'created_at', direction: 'desc' },
            pagination: { page: 1, limit: this.resultsPerPage }
        };

        // Location filter
        if (this.searchFilters.location) {
            query.filters.location = {
                operator: 'ilike',
                value: `%${this.searchFilters.location}%`
            };
        }

        // Price range filter
        if (this.searchFilters.priceRange.min > 0 || this.searchFilters.priceRange.max < 1000000) {
            query.filters.price = {
                operator: 'between',
                value: [this.searchFilters.priceRange.min, this.searchFilters.priceRange.max]
            };
        }

        // Property type filter
        if (this.searchFilters.propertyType.length > 0) {
            query.filters.property_type = {
                operator: 'in',
                value: this.searchFilters.propertyType
            };
        }

        // Bedrooms filter
        if (this.searchFilters.bedrooms.length > 0) {
            query.filters.bedrooms = {
                operator: 'in',
                value: this.searchFilters.bedrooms
            };
        }

        // Amenities filter
        if (this.searchFilters.amenities.length > 0) {
            query.filters.amenities = {
                operator: 'contains',
                value: this.searchFilters.amenities
            };
        }

        // University filter
        if (this.searchFilters.university) {
            query.filters.university = {
                operator: 'eq',
                value: this.searchFilters.university
            };
        }

        // Availability filter
        if (this.searchFilters.availability !== 'all') {
            query.filters.status = {
                operator: 'eq',
                value: this.searchFilters.availability
            };
        }

        // Verified landlord filter
        if (this.searchFilters.verifiedLandlord) {
            query.filters.verified_landlord = {
                operator: 'eq',
                value: true
            };
        }

        return query;
    }

    async searchProperties(searchQuery) {
        if (!window.DeniFinderSupabase || !window.DeniFinderSupabase.dbService) {
            // Fallback to sample data
            return this.getSampleProperties();
        }

        try {
            const supabase = window.DeniFinderSupabase.getClient();
            if (!supabase) {
                throw new Error('Supabase client not available');
            }

            let query = supabase
                .from('properties')
                .select('*');

            // Apply filters
            if (searchQuery.filters.location) {
                query = query.ilike('location', searchQuery.filters.location.value);
            }

            if (searchQuery.filters.price) {
                query = query.gte('price', searchQuery.filters.price.value[0])
                           .lte('price', searchQuery.filters.price.value[1]);
            }

            if (searchQuery.filters.property_type) {
                query = query.in('property_type', searchQuery.filters.property_type.value);
            }

            if (searchQuery.filters.bedrooms) {
                query = query.in('bedrooms', searchQuery.filters.bedrooms.value);
            }

            if (searchQuery.filters.status) {
                query = query.eq('status', searchQuery.filters.status.value);
            }

            // Apply sorting
            query = query.order(searchQuery.sort.field, { 
                ascending: searchQuery.sort.direction === 'asc' 
            });

            // Apply pagination
            const from = (searchQuery.pagination.page - 1) * searchQuery.pagination.limit;
            const to = from + searchQuery.pagination.limit - 1;
            query = query.range(from, to);

            const { data, error, count } = await query;

            if (error) {
                throw error;
            }

            return {
                properties: data || [],
                total: count || 0,
                page: searchQuery.pagination.page,
                hasMore: (data && data.length === searchQuery.pagination.limit)
            };

        } catch (error) {
            console.error('Supabase search error:', error);
            // Fallback to sample data
            return this.getSampleProperties();
        }
    }

    async quickSearch(query) {
        if (!window.DeniFinderSupabase || !window.DeniFinderSupabase.dbService) {
            return this.getSampleProperties().slice(0, 5);
        }

        try {
            const supabase = window.DeniFinderSupabase.getClient();
            if (!supabase) {
                return this.getSampleProperties().slice(0, 5);
            }

            const { data, error } = await supabase
                .from('properties')
                .select('*')
                .or(`title.ilike.%${query}%,location.ilike.%${query}%,description.ilike.%${query}%`)
                .limit(5);

            if (error) {
                throw error;
            }

            return data || [];

        } catch (error) {
            console.error('Quick search error:', error);
            return this.getSampleProperties().slice(0, 5);
        }
    }

    processSearchResults(results) {
        this.searchResults = results.properties || [];
        this.totalResults = results.total || 0;
        this.currentPage = results.page || 1;
        
        // Enrich results with additional data
        this.enrichSearchResults();
    }

    enrichSearchResults() {
        this.searchResults = this.searchResults.map(property => ({
            ...property,
            distance: this.calculateDistance(property.location),
            rating: this.getPropertyRating(property.id),
            imageCount: property.images ? property.images.length : 0,
            isSaved: this.isPropertySaved(property.id),
            isFavorited: this.isPropertyFavorited(property.id)
        }));
    }

    calculateDistance(location) {
        // Mock distance calculation - in real app, use geolocation API
        return Math.floor(Math.random() * 20) + 1;
    }

    getPropertyRating(propertyId) {
        // Mock rating - in real app, fetch from ratings table
        return (Math.random() * 2 + 3).toFixed(1);
    }

    isPropertySaved(propertyId) {
        const saved = localStorage.getItem('deniFinderSavedProperties');
        if (saved) {
            const savedProperties = JSON.parse(saved);
            return savedProperties.includes(propertyId);
        }
        return false;
    }

    isPropertyFavorited(propertyId) {
        const favorites = localStorage.getItem('deniFinderFavoriteProperties');
        if (favorites) {
            const favoriteProperties = JSON.parse(favorites);
            return favoriteProperties.includes(propertyId);
        }
        return false;
    }

    displaySearchResults() {
        const resultsContainer = document.getElementById('searchResults');
        if (!resultsContainer) return;

        if (this.searchResults.length === 0) {
            resultsContainer.innerHTML = `
                <div class="no-results">
                    <i class="fas fa-search"></i>
                    <h3>No properties found</h3>
                    <p>Try adjusting your search criteria or browse our featured properties.</p>
                    <button class="btn-primary" onclick="searchService.clearFilters()">
                        Clear Filters
                    </button>
                </div>
            `;
            return;
        }

        // Display results
        resultsContainer.innerHTML = `
            <div class="search-results-header">
                <h3>Found ${this.totalResults} properties</h3>
                <div class="results-controls">
                    <select id="sortResults" onchange="searchService.sortResults(this.value)">
                        <option value="newest">Newest First</option>
                        <option value="price-low">Price: Low to High</option>
                        <option value="price-high">Price: High to Low</option>
                        <option value="distance">Distance</option>
                        <option value="rating">Rating</option>
                    </select>
                    <button class="btn-secondary" onclick="searchService.toggleViewMode()">
                        <i class="fas fa-th-large"></i>
                    </button>
                </div>
            </div>
            <div class="search-results-grid">
                ${this.searchResults.map(property => this.createPropertyCard(property)).join('')}
            </div>
            ${this.hasMoreResults() ? `
                <div class="load-more-section">
                    <button id="loadMoreBtn" class="btn-primary" onclick="searchService.loadMoreResults()">
                        Load More Results
                    </button>
                </div>
            ` : ''}
        `;

        // Update pagination info
        this.updatePaginationInfo();
    }

    displayQuickSearchResults(results) {
        const quickResultsContainer = document.getElementById('quickSearchResults');
        if (!quickResultsContainer) return;

        if (results.length === 0) {
            quickResultsContainer.style.display = 'none';
            return;
        }

        quickResultsContainer.innerHTML = results.map(property => `
            <div class="quick-result-item" onclick="searchService.selectQuickResult('${property.id}')">
                <div class="quick-result-image">
                    <img src="${property.images && property.images[0] ? property.images[0] : 'images/deniM.png'}" alt="${property.title}">
                </div>
                <div class="quick-result-content">
                    <h4>${property.title}</h4>
                    <p>${property.location}</p>
                    <span class="quick-result-price">KSh ${property.price?.toLocaleString() || '0'}/month</span>
                </div>
            </div>
        `).join('');

        quickResultsContainer.style.display = 'block';
    }

    createPropertyCard(property) {
        return `
            <div class="property-card" data-property-id="${property.id}">
                <div class="property-image">
                    <img src="${property.images && property.images[0] ? property.images[0] : 'images/deniM.png'}" alt="${property.title}">
                    <div class="property-badges">
                        ${property.status === 'available' ? '<span class="badge available">Available</span>' : ''}
                        ${property.verified_landlord ? '<span class="badge verified">Verified</span>' : ''}
                        ${property.student_friendly ? '<span class="badge student">Student Friendly</span>' : ''}
                    </div>
                    <div class="property-actions">
                        <button class="action-btn favorite" onclick="searchService.toggleFavorite('${property.id}')">
                            <i class="fas fa-heart ${property.isFavorited ? 'filled' : ''}"></i>
                        </button>
                        <button class="action-btn save" onclick="searchService.toggleSave('${property.id}')">
                            <i class="fas fa-bookmark ${property.isSaved ? 'filled' : ''}"></i>
                        </button>
                    </div>
                </div>
                <div class="property-content">
                    <h3 class="property-title">${property.title}</h3>
                    <p class="property-location">
                        <i class="fas fa-map-marker-alt"></i> ${property.location}
                        <span class="property-distance">${property.distance} km away</span>
                    </p>
                    <div class="property-details">
                        <span><i class="fas fa-bed"></i> ${property.bedrooms || 0} Bed</span>
                        <span><i class="fas fa-bath"></i> ${property.bathrooms || 0} Bath</span>
                        <span><i class="fas fa-ruler-combined"></i> ${property.size || 'N/A'}</span>
                    </div>
                    <div class="property-price">
                        <span class="price-amount">KSh ${property.price?.toLocaleString() || '0'}</span>
                        <span class="price-period">/month</span>
                    </div>
                    <div class="property-footer">
                        <div class="property-rating">
                            <i class="fas fa-star"></i> ${property.rating}
                        </div>
                        <button class="btn-primary" onclick="searchService.viewProperty('${property.id}')">
                            View Details
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    async loadMoreResults() {
        try {
            this.currentPage++;
            const searchQuery = this.buildSearchQuery();
            searchQuery.pagination.page = this.currentPage;
            
            const results = await this.searchProperties(searchQuery);
            this.searchResults = [...this.searchResults, ...(results.properties || [])];
            
            this.displaySearchResults();
            
        } catch (error) {
            console.error('Load more error:', error);
        }
    }

    hasMoreResults() {
        return this.searchResults.length < this.totalResults;
    }

    updatePaginationInfo() {
        const paginationInfo = document.getElementById('paginationInfo');
        if (paginationInfo) {
            const start = (this.currentPage - 1) * this.resultsPerPage + 1;
            const end = Math.min(this.currentPage * this.resultsPerPage, this.totalResults);
            
            paginationInfo.innerHTML = `
                Showing ${start}-${end} of ${this.totalResults} properties
            `;
        }
    }

    sortResults(sortBy) {
        switch (sortBy) {
            case 'newest':
                this.searchResults.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
                break;
            case 'price-low':
                this.searchResults.sort((a, b) => (a.price || 0) - (b.price || 0));
                break;
            case 'price-high':
                this.searchResults.sort((a, b) => (b.price || 0) - (a.price || 0));
                break;
            case 'distance':
                this.searchResults.sort((a, b) => a.distance - b.distance);
                break;
            case 'rating':
                this.searchResults.sort((a, b) => b.rating - a.rating);
                break;
        }
        
        this.displaySearchResults();
    }

    toggleViewMode() {
        const resultsGrid = document.querySelector('.search-results-grid');
        if (resultsGrid) {
            resultsGrid.classList.toggle('list-view');
        }
    }

    async toggleFavorite(propertyId) {
        try {
            const favorites = JSON.parse(localStorage.getItem('deniFinderFavoriteProperties') || '[]');
            const index = favorites.indexOf(propertyId);
            
            if (index > -1) {
                favorites.splice(index, 1);
            } else {
                favorites.push(propertyId);
            }
            
            localStorage.setItem('deniFinderFavoriteProperties', JSON.stringify(favorites));
            
            // Update UI
            this.updatePropertyCard(propertyId);
            
        } catch (error) {
            console.error('Toggle favorite error:', error);
        }
    }

    async toggleSave(propertyId) {
        try {
            const saved = JSON.parse(localStorage.getItem('deniFinderSavedProperties') || '[]');
            const index = saved.indexOf(propertyId);
            
            if (index > -1) {
                saved.splice(index, 1);
            } else {
                saved.push(propertyId);
            }
            
            localStorage.setItem('deniFinderSavedProperties', JSON.stringify(saved));
            
            // Update UI
            this.updatePropertyCard(propertyId);
            
        } catch (error) {
            console.error('Toggle save error:', error);
        }
    }

    updatePropertyCard(propertyId) {
        const card = document.querySelector(`[data-property-id="${propertyId}"]`);
        if (card) {
            const isFavorited = this.isPropertyFavorited(propertyId);
            const isSaved = this.isPropertySaved(propertyId);
            
            const favoriteBtn = card.querySelector('.favorite i');
            const saveBtn = card.querySelector('.save i');
            
            if (favoriteBtn) {
                favoriteBtn.className = `fas fa-heart ${isFavorited ? 'filled' : ''}`;
            }
            
            if (saveBtn) {
                saveBtn.className = `fas fa-bookmark ${isSaved ? 'filled' : ''}`;
            }
        }
    }

    viewProperty(propertyId) {
        // Navigate to property detail page
        window.location.href = `property-detail.html?id=${propertyId}`;
    }

    selectQuickResult(propertyId) {
        // Navigate to property detail page
        this.viewProperty(propertyId);
    }

    saveCurrentSearch() {
        const searchName = prompt('Enter a name for this search:');
        if (!searchName) return;

        const savedSearch = {
            id: `search_${Date.now()}`,
            name: searchName,
            filters: { ...this.searchFilters },
            timestamp: new Date(),
            resultCount: this.totalResults
        };

        this.savedSearches.push(savedSearch);
        localStorage.setItem('deniFinderSavedSearches', JSON.stringify(this.savedSearches));

        this.showToast('Search saved successfully!', 'success');
    }

    loadSavedSearch(searchId) {
        const savedSearch = this.savedSearches.find(s => s.id === searchId);
        if (savedSearch) {
            this.searchFilters = { ...savedSearch.filters };
            this.applyFiltersToUI();
            this.performSearch();
        }
    }

    applyFiltersToUI() {
        // Apply saved filters to UI elements
        const locationInput = document.getElementById('locationInput');
        if (locationInput) {
            locationInput.value = this.searchFilters.location;
        }

        const priceSlider = document.getElementById('priceSlider');
        if (priceSlider) {
            priceSlider.value = this.searchFilters.priceRange.max;
        }

        // Update other filter UI elements...
    }

    clearFilters() {
        this.searchFilters = {
            propertyType: [],
            priceRange: { min: 0, max: 1000000 },
            location: '',
            bedrooms: [],
            bathrooms: [],
            amenities: [],
            university: '',
            distance: 10,
            availability: 'all',
            verifiedLandlord: false,
            studentFriendly: false
        };

        this.applyFiltersToUI();
        this.performSearch();
    }

    saveToSearchHistory(searchQuery) {
        const historyItem = {
            id: `history_${Date.now()}`,
            query: searchQuery,
            timestamp: new Date(),
            resultCount: this.totalResults
        };

        this.searchHistory.unshift(historyItem);
        
        // Keep only last 20 searches
        if (this.searchHistory.length > 20) {
            this.searchHistory = this.searchHistory.slice(0, 20);
        }

        localStorage.setItem('deniFinderSearchHistory', JSON.stringify(this.searchHistory));
    }

    async getLocationSuggestions(query) {
        // Mock location suggestions - in real app, use geocoding API
        const locations = [
            'Westlands, Nairobi',
            'Kilimani, Nairobi',
            'Lavington, Nairobi',
            'Karen, Nairobi',
            'Eastlands, Nairobi',
            'South B, Nairobi',
            'Buruburu, Nairobi',
            'Donholm, Nairobi'
        ];

        return locations.filter(location => 
            location.toLowerCase().includes(query.toLowerCase())
        );
    }

    showLocationSuggestions(suggestions) {
        const suggestionsContainer = document.getElementById('locationSuggestions');
        if (!suggestionsContainer) return;

        if (suggestions.length === 0) {
            suggestionsContainer.style.display = 'none';
            return;
        }

        suggestionsContainer.innerHTML = suggestions.map(suggestion => `
            <div class="location-suggestion" onclick="searchService.selectLocation('${suggestion}')">
                <i class="fas fa-map-marker-alt"></i>
                <span>${suggestion}</span>
            </div>
        `).join('');

        suggestionsContainer.style.display = 'block';
    }

    selectLocation(location) {
        const locationInput = document.getElementById('locationInput');
        if (locationInput) {
            locationInput.value = location;
            this.searchFilters.location = location;
        }

        const suggestionsContainer = document.getElementById('locationSuggestions');
        if (suggestionsContainer) {
            suggestionsContainer.style.display = 'none';
        }
    }

    showLoadingState() {
        const resultsContainer = document.getElementById('searchResults');
        if (resultsContainer) {
            resultsContainer.innerHTML = `
                <div class="loading-state">
                    <i class="fas fa-spinner fa-spin"></i>
                    <p>Searching properties...</p>
                </div>
            `;
        }
    }

    showErrorState(message) {
        const resultsContainer = document.getElementById('searchResults');
        if (resultsContainer) {
            resultsContainer.innerHTML = `
                <div class="error-state">
                    <i class="fas fa-exclamation-triangle"></i>
                    <h3>Search Error</h3>
                    <p>${message}</p>
                    <button class="btn-primary" onclick="searchService.performSearch()">
                        Try Again
                    </button>
                </div>
            `;
        }
    }

    showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = message;

        document.body.appendChild(toast);

        setTimeout(() => {
            if (toast.parentElement) {
                toast.remove();
            }
        }, 3000);
    }

    toggleFilterPanel() {
        const filterPanel = document.getElementById('filterPanel');
        if (filterPanel) {
            filterPanel.classList.toggle('active');
        }
    }

    getSampleProperties() {
        return [
            {
                id: 'prop1',
                title: 'Modern 2-Bedroom Apartment',
                location: 'Westlands, Nairobi',
                price: 45000,
                bedrooms: 2,
                bathrooms: 2,
                size: '85 sqm',
                property_type: 'apartment',
                status: 'available',
                verified_landlord: true,
                student_friendly: true,
                images: ['images/project.jpg'],
                created_at: new Date(Date.now() - 86400000),
                description: 'Beautiful modern apartment with great amenities'
            },
            {
                id: 'prop2',
                title: 'Cozy Studio Near University',
                location: 'Kilimani, Nairobi',
                price: 25000,
                bedrooms: 1,
                bathrooms: 1,
                size: '45 sqm',
                property_type: 'studio',
                status: 'available',
                verified_landlord: false,
                student_friendly: true,
                images: ['images/hostels.jpeg'],
                created_at: new Date(Date.now() - 172800000),
                description: 'Perfect for students, close to campus'
            },
            {
                id: 'prop3',
                title: 'Family House with Garden',
                location: 'Lavington, Nairobi',
                price: 80000,
                bedrooms: 3,
                bathrooms: 2,
                size: '120 sqm',
                property_type: 'house',
                status: 'available',
                verified_landlord: true,
                student_friendly: false,
                images: ['images/tenant.jpeg'],
                created_at: new Date(Date.now() - 259200000),
                description: 'Spacious family home with beautiful garden'
            }
        ];
    }

    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }
}

// Initialize search service
const searchService = new SearchService();
document.addEventListener('DOMContentLoaded', () => {
    searchService.init();
}); 