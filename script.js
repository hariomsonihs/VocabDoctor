// Dictionary Data Loader
const dictionaryData = {
    'phrasal-verbs': [],
    'idioms': []
};

// DOM Elements
const categoryCards = document.querySelectorAll('.category-card');
const searchInput = document.getElementById('search-input');
const searchBtn = document.getElementById('search-btn');

// Load all categories data
async function loadAllCategories() {
    try {
        const responses = await Promise.all([
            fetch('data/phrasal-verbs.json'),
            fetch('data/idioms.json')
        ]);
        
        dictionaryData['phrasal-verbs'] = await responses[0].json();
        dictionaryData['idioms'] = await responses[1].json();
    } catch (error) {
        console.error('Error loading data:', error);
    }
}

// Search across all categories
function searchAllCategories(query) {
    query = query.trim().toLowerCase();
    if (!query) return;

    const results = [];
    
    // Search in all categories
    Object.keys(dictionaryData).forEach(category => {
        dictionaryData[category].forEach(item => {
            if (item.term.toLowerCase().includes(query) || 
                item.meaning.toLowerCase().includes(query)) {
                results.push({
                    ...item,
                    category: category
                });
            }
        });
    });

    // Open results in new page
    if (results.length > 0) {
        const resultsPage = window.open('category.html?search=true', '_blank');
        
        // Wait for the new page to load
        resultsPage.onload = function() {
            resultsPage.postMessage({
                action: 'displaySearchResults',
                query: query,
                results: results
            }, '*');
        };
    } else {
        alert('No results found for "' + query + '"');
    }
}

// For category clicks
categoryCards.forEach(card => {
    card.addEventListener('click', () => {
        const category = card.getAttribute('data-category');
        window.location.href = `category.html?category=${category}`;
    });
});

// For search results
searchBtn.addEventListener('click', () => {
    const query = searchInput.value.trim();
    if (query) {
        window.location.href = `category.html?search=${encodeURIComponent(query)}`;
    }
});

searchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        searchAllCategories(searchInput.value);
    }
});

// Initialize
loadAllCategories();