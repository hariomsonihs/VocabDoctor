// Get parameters from URL
const urlParams = new URLSearchParams(window.location.search);
const category = urlParams.get('category');
const isSearch = urlParams.get('search');

// DOM Elements
const titleText = document.getElementById('title-text');
const contentBody = document.getElementById('content-body');
const backBtn = document.getElementById('back-btn');
const searchInput = document.getElementById('search-input');
const searchBtn = document.getElementById('search-btn');

// Category titles mapping
const categoryTitles = {
    'phrasal-verbs': 'Phrasal Verbs',
    'idioms': 'English Idioms'
};

// Handle messages from main page
window.addEventListener('message', function(event) {
    if (event.data.action === 'displaySearchResults') {
        displaySearchResults(event.data.query, event.data.results);
    }
});

// Load and display data based on URL parameters
window.addEventListener('DOMContentLoaded', function() {
    if (isSearch) {
        titleText.textContent = 'Search Results';
        contentBody.innerHTML = '<p class="loading">Loading search results...</p>';
    } else if (category) {
        loadAndDisplayCategory();
    } else {
        window.location.href = 'index.html';
    }
});

// Load and display category data
async function loadAndDisplayCategory() {
    try {
        titleText.textContent = categoryTitles[category] || category;
        const response = await fetch(`data/${category}.json`);
        if (!response.ok) throw new Error('Failed to load data');
        const data = await response.json();
        displayData(data);
        setupCategorySearch();
    } catch (error) {
        console.error(`Error loading ${category}:`, error);
        contentBody.innerHTML = '<p class="error">Error loading data. Please try again.</p>';
    }
}

// Display all items in a category
function displayData(data) {
    let html = '<div class="word-list">';
    
    data.forEach(item => {
        html += `
            <div class="word-item">
                <h3><i class="fas fa-angle-right"></i> ${item.term}</h3>
                <p><strong>Meaning:</strong> ${item.meaning}</p>
                ${item.example ? `<p class="example"><strong>Example:</strong> ${item.example}</p>` : ''}
            </div>
        `;
    });
    
    html += '</div>';
    contentBody.innerHTML = html;
}

// Display search results
function displaySearchResults(query, results) {
    titleText.textContent = `Search Results for "${query}"`;
    
    let html = `<div class="search-info">
        <p>Found ${results.length} results across all categories</p>
    </div><div class="word-list">`;
    
    results.forEach(item => {
        html += `
            <div class="word-item">
                <h3><i class="fas fa-angle-right"></i> ${item.term} 
                    <span class="category-tag">${item.category.replace('-', ' ')}</span>
                </h3>
                <p><strong>Meaning:</strong> ${item.meaning}</p>
                ${item.example ? `<p class="example"><strong>Example:</strong> ${item.example}</p>` : ''}
            </div>
        `;
    });
    
    html += '</div>';
    contentBody.innerHTML = html;
}

// Set up search for current category
function setupCategorySearch() {
    searchBtn.addEventListener('click', searchInCategory);
    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') searchInCategory();
    });
}

// Search within current category - CORRECTED FUNCTION
function searchInCategory() {
    const query = searchInput.value.trim().toLowerCase();
    if (!query) {
        loadAndDisplayCategory();
        return;
    }
    
    fetch(`data/${category}.json`)
        .then(response => response.json())
        .then(data => {
            const results = data.filter(item => (
                item.term.toLowerCase().includes(query) || 
                item.meaning.toLowerCase().includes(query)
            ));
            
            if (results.length === 0) {
                contentBody.innerHTML = `<p>No results found for "${query}" in this category</p>`;
            } else {
                displaySearchResults(query, results.map(item => ({...item, category})));
            }
        })
        .catch(error => {
            console.error('Search error:', error);
            contentBody.innerHTML = '<p class="error">Error during search. Please try again.</p>';
        });
}

// Back button functionality
backBtn.addEventListener('click', () => {
    window.location.href = 'index.html';
});