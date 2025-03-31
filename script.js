// Dictionary Data Loader
const dictionaryData = {
    'phrasal-verbs': [],
    'idioms': [],
    'proverbs': [],
    'daily-sentences': [],
    'verbs':[]
};

// DOM Elements
const categoryCards = document.querySelectorAll('.category-card');
const searchInput = document.getElementById('search-input');
const searchBtn = document.getElementById('search-btn');

// Debugging function
function logDataLoadStatus(category, status, error = null) {
    console.log(`Data load ${status} for ${category}${error ? ': ' + error.message : ''}`);
}

// Improved load all categories data
async function loadAllCategories() {
    try {
        console.log('Starting data load...');
        
        const urls = [
            'data/phrasal-verbs.json',
            'data/idioms.json', 
            'data/proverbs.json',
            'data/daily-sentences.json',
            'data/verbs.json'
        ];

        const responses = await Promise.all(
            urls.map(url => fetch(url).then(res => {
                if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
                return res.json();
            }).catch(e => {
                logDataLoadStatus(url.split('/')[1].split('.')[0], 'failed', e);
                return []; // Return empty array if fetch fails
            }))
        );

        // Assign responses
        dictionaryData['phrasal-verbs'] = responses[0] || [];
        dictionaryData['idioms'] = responses[1] || [];
        dictionaryData['proverbs'] = responses[2] || [];
        dictionaryData['daily-sentences'] = responses[3] || [];
        dictionaryData['verbs'] = responses[4] || [];

        console.log('Data loaded successfully:', dictionaryData);
        
    } catch (error) {
        console.error('Critical error loading data:', error);
        // Show user-friendly error message
        alert('Failed to load dictionary data. Please refresh the page or try again later.');
    }
}

// Search across all categories
function searchAllCategories(query) {
    query = query.trim().toLowerCase();
    if (!query) {
        alert('Please enter a search term');
        return;
    }

    try {
        const results = [];
        
        // Search in all categories
        Object.entries(dictionaryData).forEach(([category, items]) => {
            items.forEach(item => {
                const searchFields = [
                    item.term?.toLowerCase(),
                    item.meaning?.toLowerCase(),
                    item.hindi_meaning?.toLowerCase(),
                    item.synonyms?.toLowerCase()
                ].filter(Boolean); // Remove undefined/null values

                if (searchFields.some(field => field.includes(query))) {
                    results.push({
                        ...item,
                        category: category
                    });
                }
            });
        });

        if (results.length > 0) {
            const resultsPage = window.open('category.html?search=true', '_blank');
            
            // Wait for the new page to load
            const retryInterval = setInterval(() => {
                if (resultsPage.closed) {
                    clearInterval(retryInterval);
                    return;
                }
                try {
                    resultsPage.postMessage({
                        action: 'displaySearchResults',
                        query: query,
                        results: results
                    }, '*');
                    clearInterval(retryInterval);
                } catch (e) {
                    console.log('Waiting for results page to load...');
                }
            }, 100);
        } else {
            alert(`No results found for "${query}"`);
        }
    } catch (error) {
        console.error('Search error:', error);
        alert('An error occurred during search. Please try again.');
    }
}

// Event listeners
function setupEventListeners() {
    // Category clicks
    categoryCards.forEach(card => {
        card.addEventListener('click', () => {
            const category = card.getAttribute('data-category');
            if (category && dictionaryData.hasOwnProperty(category)) {
                window.location.href = `category.html?category=${category}`;
            } else {
                console.error('Invalid category:', category);
            }
        });
    });

    // Search button
    searchBtn.addEventListener('click', () => {
        const query = searchInput.value.trim();
        if (query) searchAllCategories(query);
    });

    // Search input enter key
    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            searchAllCategories(searchInput.value);
        }
    });
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    setupEventListeners();
    loadAllCategories().then(() => {
        console.log('App initialization complete');
    });
});