// Malawi Locations Data
// Comprehensive list of cities, areas, and popular locations for DeniFinder

const MALAWI_LOCATIONS = {
    // Major Cities
    cities: [
        { name: 'Lilongwe', coordinates: [-13.9833, 33.7833], population: 989318, type: 'city' },
        { name: 'Blantyre', coordinates: [-15.7861, 35.0058], population: 1895973, type: 'city' },
        { name: 'Mzuzu', coordinates: [-11.4581, 34.0151], population: 150100, type: 'city' },
        { name: 'Zomba', coordinates: [-15.3869, 35.3192], population: 101140, type: 'city' },
        { name: 'Karonga', coordinates: [-9.9333, 33.9333], population: 61609, type: 'city' },
        { name: 'Kasungu', coordinates: [-13.0333, 33.4833], population: 58653, type: 'city' },
        { name: 'Mangochi', coordinates: [-14.4667, 35.2667], population: 51429, type: 'city' },
        { name: 'Salima', coordinates: [-13.7833, 34.4333], population: 36789, type: 'city' },
        { name: 'Liwonde', coordinates: [-15.0667, 35.2333], population: 36421, type: 'city' },
        { name: 'Dedza', coordinates: [-14.3667, 34.3333], population: 30928, type: 'city' },
        { name: 'Nkhotakota', coordinates: [-12.9167, 34.3000], population: 28350, type: 'city' },
        { name: 'Mchinji', coordinates: [-13.8167, 32.9000], population: 28011, type: 'city' },
        { name: 'Nsanje', coordinates: [-16.9167, 35.2667], population: 26844, type: 'city' },
        { name: 'Mzimba', coordinates: [-11.9000, 33.6000], population: 26096, type: 'city' },
        { name: 'Rumphi', coordinates: [-11.0167, 33.8667], population: 22358, type: 'city' },
        { name: 'Ntcheu', coordinates: [-14.8333, 34.6667], population: 21241, type: 'city' },
        { name: 'Mulanje', coordinates: [-16.0258, 35.5081], population: 20870, type: 'city' },
        { name: 'Mwanza', coordinates: [-15.5986, 34.5178], population: 18039, type: 'city' },
        { name: 'Chitipa', coordinates: [-9.7019, 33.2700], population: 17743, type: 'city' },
        { name: 'Nkhata Bay', coordinates: [-11.6000, 34.3000], population: 14274, type: 'city' },
        { name: 'Ntchisi', coordinates: [-13.3667, 34.0000], population: 9357, type: 'city' },
        { name: 'Dowa', coordinates: [-13.6667, 33.9167], population: 7135, type: 'city' },
        { name: 'Thyolo', coordinates: [-16.0667, 35.1333], population: 7029, type: 'city' },
        { name: 'Phalombe', coordinates: [-15.8033, 35.6533], population: 6242, type: 'city' },
        { name: 'Chiradzulu', coordinates: [-15.7000, 35.1833], population: 1580, type: 'city' },
        { name: 'Machinga', coordinates: [-14.9667, 35.5167], population: 1418, type: 'city' },
        { name: 'Balaka', coordinates: [-14.9889, 34.9591], population: null, type: 'city' },
        { name: 'Neno', coordinates: [-15.3981, 34.6534], population: null, type: 'city' },
        { name: 'Chikwawa', coordinates: [-16.0350, 34.8010], population: null, type: 'city' }
    ],

    // Popular Areas in Lilongwe
    lilongweAreas: [
        { name: 'Area 18, Lilongwe', coordinates: [-13.9626, 33.7741], type: 'area' },
        { name: 'Area 47, Lilongwe', coordinates: [-13.9500, 33.7800], type: 'area' },
        { name: 'Area 25, Lilongwe', coordinates: [-13.9700, 33.7600], type: 'area' },
        { name: 'Area 12, Lilongwe', coordinates: [-13.9700, 33.7600], type: 'area' },
        { name: 'Area 49, Lilongwe', coordinates: [-13.9400, 33.7900], type: 'area' },
        { name: 'Area 43, Lilongwe', coordinates: [-13.9550, 33.7850], type: 'area' },
        { name: 'Area 15, Lilongwe', coordinates: [-13.9650, 33.7750], type: 'area' },
        { name: 'Area 10, Lilongwe', coordinates: [-13.9750, 33.7650], type: 'area' },
        { name: 'Area 6, Lilongwe', coordinates: [-13.9800, 33.7700], type: 'area' },
        { name: 'Area 3, Lilongwe', coordinates: [-13.9850, 33.7750], type: 'area' },
        { name: 'City Centre, Lilongwe', coordinates: [-13.9833, 33.7833], type: 'area' },
        { name: 'Old Town, Lilongwe', coordinates: [-13.9900, 33.7800], type: 'area' },
        { name: 'Kanengo, Lilongwe', coordinates: [-13.9200, 33.8000], type: 'area' },
        { name: 'Likuni, Lilongwe', coordinates: [-13.9400, 33.7700], type: 'area' },
        { name: 'Mtandire, Lilongwe', coordinates: [-13.9300, 33.7900], type: 'area' }
    ],

    // Popular Areas in Blantyre
    blantyreAreas: [
        { name: 'Ndirande, Blantyre', coordinates: [-15.8000, 35.0000], type: 'area' },
        { name: 'Chichiri, Blantyre', coordinates: [-15.7900, 35.0100], type: 'area' },
        { name: 'Limbe, Blantyre', coordinates: [-15.8100, 35.0200], type: 'area' },
        { name: 'Chilomoni, Blantyre', coordinates: [-15.8200, 35.0000], type: 'area' },
        { name: 'Bangwe, Blantyre', coordinates: [-15.7800, 35.0300], type: 'area' },
        { name: 'Namiwawa, Blantyre', coordinates: [-15.7700, 35.0100], type: 'area' },
        { name: 'Chitawira, Blantyre', coordinates: [-15.8000, 35.0200], type: 'area' },
        { name: 'Manje, Blantyre', coordinates: [-15.8100, 35.0000], type: 'area' },
        { name: 'Chilobwe, Blantyre', coordinates: [-15.8200, 35.0100], type: 'area' },
        { name: 'Mpingwe, Blantyre', coordinates: [-15.7900, 35.0300], type: 'area' },
        { name: 'City Centre, Blantyre', coordinates: [-15.7861, 35.0058], type: 'area' },
        { name: 'Nyambadwe, Blantyre', coordinates: [-15.7800, 35.0000], type: 'area' },
        { name: 'Sunnyside, Blantyre', coordinates: [-15.7850, 35.0080], type: 'area' },
        { name: 'Victoria Avenue, Blantyre', coordinates: [-15.7860, 35.0060], type: 'area' }
    ],

    // Popular Areas in Mzuzu
    mzuzuAreas: [
        { name: 'City Centre, Mzuzu', coordinates: [-11.4581, 34.0151], type: 'area' },
        { name: 'Katoto, Mzuzu', coordinates: [-11.4500, 34.0200], type: 'area' },
        { name: 'Chibavi, Mzuzu', coordinates: [-11.4600, 34.0100], type: 'area' },
        { name: 'Area 1B, Mzuzu', coordinates: [-11.4550, 34.0180], type: 'area' },
        { name: 'Area 1C, Mzuzu', coordinates: [-11.4530, 34.0160], type: 'area' },
        { name: 'Area 2, Mzuzu', coordinates: [-11.4520, 34.0140], type: 'area' },
        { name: 'Area 3, Mzuzu', coordinates: [-11.4500, 34.0120], type: 'area' },
        { name: 'Area 4, Mzuzu', coordinates: [-11.4480, 34.0100], type: 'area' },
        { name: 'Area 5, Mzuzu', coordinates: [-11.4460, 34.0080], type: 'area' },
        { name: 'Area 6, Mzuzu', coordinates: [-11.4440, 34.0060], type: 'area' }
    ],

    // Popular Areas in Zomba
    zombaAreas: [
        { name: 'City Centre, Zomba', coordinates: [-15.3869, 35.3192], type: 'area' },
        { name: 'Chancellor College, Zomba', coordinates: [-15.3900, 35.3200], type: 'area' },
        { name: 'Sadzi, Zomba', coordinates: [-15.3800, 35.3250], type: 'area' },
        { name: 'Mulunguzi, Zomba', coordinates: [-15.3850, 35.3150], type: 'area' },
        { name: 'Chikanda, Zomba', coordinates: [-15.3950, 35.3180], type: 'area' },
        { name: 'Matawale, Zomba', coordinates: [-15.4000, 35.3220], type: 'area' }
    ],

    // Universities and Educational Institutions
    universities: [
        { name: 'University of Malawi - Chancellor College', coordinates: [-15.3900, 35.3200], type: 'university' },
        { name: 'University of Malawi - Polytechnic', coordinates: [-15.7861, 35.0058], type: 'university' },
        { name: 'University of Malawi - College of Medicine', coordinates: [-15.7861, 35.0058], type: 'university' },
        { name: 'Lilongwe University of Agriculture and Natural Resources', coordinates: [-13.9833, 33.7833], type: 'university' },
        { name: 'Mzuzu University', coordinates: [-11.4581, 34.0151], type: 'university' },
        { name: 'Malawi University of Science and Technology', coordinates: [-15.3869, 35.3192], type: 'university' }
    ],

    // Popular Landmarks
    landmarks: [
        { name: 'Kamuzu International Airport', coordinates: [-13.7894, 33.7810], type: 'landmark' },
        { name: 'Chileka International Airport', coordinates: [-15.6790, 34.9740], type: 'landmark' },
        { name: 'Lilongwe Wildlife Centre', coordinates: [-13.9833, 33.7833], type: 'landmark' },
        { name: 'Kumbali Cultural Village', coordinates: [-13.9833, 33.7833], type: 'landmark' },
        { name: 'Lilongwe Nature Sanctuary', coordinates: [-13.9833, 33.7833], type: 'landmark' },
        { name: 'Blantyre Sports Club', coordinates: [-15.7861, 35.0058], type: 'landmark' },
        { name: 'Mount Mulanje', coordinates: [-16.0258, 35.5081], type: 'landmark' },
        { name: 'Lake Malawi', coordinates: [-12.0000, 34.0000], type: 'landmark' }
    ]
};

// Helper functions
function getAllLocations() {
    return [
        ...MALAWI_LOCATIONS.cities,
        ...MALAWI_LOCATIONS.lilongweAreas,
        ...MALAWI_LOCATIONS.blantyreAreas,
        ...MALAWI_LOCATIONS.mzuzuAreas,
        ...MALAWI_LOCATIONS.zombaAreas,
        ...MALAWI_LOCATIONS.universities,
        ...MALAWI_LOCATIONS.landmarks
    ];
}

function getLocationsByType(type) {
    return getAllLocations().filter(location => location.type === type);
}

function getLocationsByCity(cityName) {
    const city = MALAWI_LOCATIONS.cities.find(city => city.name.toLowerCase() === cityName.toLowerCase());
    if (!city) return [];

    switch (cityName.toLowerCase()) {
        case 'lilongwe':
            return MALAWI_LOCATIONS.lilongweAreas;
        case 'blantyre':
            return MALAWI_LOCATIONS.blantyreAreas;
        case 'mzuzu':
            return MALAWI_LOCATIONS.mzuzuAreas;
        case 'zomba':
            return MALAWI_LOCATIONS.zombaAreas;
        default:
            return [];
    }
}

function searchLocations(query) {
    const searchTerm = query.toLowerCase();
    return getAllLocations().filter(location => 
        location.name.toLowerCase().includes(searchTerm)
    );
}

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { MALAWI_LOCATIONS, getAllLocations, getLocationsByType, getLocationsByCity, searchLocations };
} else {
    window.MALAWI_LOCATIONS = MALAWI_LOCATIONS;
    window.getAllLocations = getAllLocations;
    window.getLocationsByType = getLocationsByType;
    window.getLocationsByCity = getLocationsByCity;
    window.searchLocations = searchLocations;
} 