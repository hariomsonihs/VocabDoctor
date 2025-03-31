// Get parameters from URL
const urlParams = new URLSearchParams(window.location.search);
const category = urlParams.get('category');
const isSearch = urlParams.get('search');
const searchQuery = isSearch && isSearch !== 'true' ? decodeURIComponent(isSearch) : null;

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

// Current displayed data
let currentData = [];
let currentDisplayMode = 'list'; // 'list' or 'detail'
let currentDetailItem = null;

// Handle messages from main page
window.addEventListener('message', function(event) {
    if (event.data.action === 'displaySearchResults') {
        displaySearchResults(event.data.query, event.data.results);
    }
});

// Load and display data based on URL parameters
window.addEventListener('DOMContentLoaded', function() {
    if (searchQuery) {
        titleText.textContent = 'Search Results';
        contentBody.innerHTML = '<p class="loading">Loading search results...</p>';
        searchInCategory(searchQuery);
    } else if (isSearch) {
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
        currentData = await response.json();
        displayList(currentData);
        setupCategorySearch();
    } catch (error) {
        console.error(`Error loading ${category}:`, error);
        contentBody.innerHTML = '<p class="error">Error loading data. Please try again.</p>';
    }
}

// Display all items in list view
function displayList(data) {
    currentDisplayMode = 'list';
    let html = '<div class="word-list">';
    
    data.forEach((item, index) => {
        html += `
            <div class="word-item" data-id="${index}">
                <h3><i class="fas fa-angle-right"></i> ${item.term}</h3>
                <p><strong>Meaning:</strong> ${item.meaning}</p>
                ${item.example ? `<p class="example"><strong>Example:</strong> ${item.example}</p>` : ''}
                <div class="view-details">View Details <i class="fas fa-chevron-right"></i></div>
            </div>
        `;
    });
    
    html += '</div>';
    contentBody.innerHTML = html;
    
    // Add click event to each item
    document.querySelectorAll('.word-item').forEach(item => {
        item.addEventListener('click', function() {
            const itemId = parseInt(this.getAttribute('data-id'));
            showDetailView(data[itemId]);
        });
    });
}

// Show detailed view for a single item
function showDetailView(item) {
    currentDisplayMode = 'detail';
    currentDetailItem = item;
    
    let html = `
        <div class="detail-view">
            <div class="detail-header">
                <button id="back-to-list" class="back-btn"><i class="fas fa-arrow-left"></i> Back</button>
                <h2>${item.term}</h2>
            </div>
            <div class="detail-content">
                <div class="detail-section">
                    <h3>Meaning</h3>
                    <p>${item.meaning}</p>
                </div>
                
                ${item.hindi_meaning ? `
                <div class="detail-section">
                    <h3>Hindi Meaning</h3>
                    <p>${item.hindi_meaning}</p>
                </div>
                ` : ''}
                
                ${item.synonyms ? `
                <div class="detail-section">
                    <h3>Synonyms</h3>
                    <p>${item.synonyms}</p>
                </div>
                ` : ''}
                
                ${item.usage_note ? `
                <div class="detail-section">
                    <h3>Usage Note</h3>
                    <p>${item.usage_note}</p>
                </div>
                ` : ''}
                
                ${item.example ? `
                <div class="detail-section">
                    <h3>Example</h3>
                    <p class="example">${item.example}</p>
                </div>
                ` : ''}
            </div>
        </div>
    `;
    
    contentBody.innerHTML = html;
    
    // Add back to list event
    document.getElementById('back-to-list').addEventListener('click', function(e) {
        e.stopPropagation();
        displayList(currentData);
    });
}

// Display search results
function displaySearchResults(query, results) {
    titleText.textContent = `Search Results for "${query}"`;
    currentData = results;
    
    let html = `<div class="search-info">
        <p>Found ${results.length} results across all categories</p>
    </div><div class="word-list">`;
    
    results.forEach((item, index) => {
        html += `
            <div class="word-item" data-id="${index}">
                <h3><i class="fas fa-angle-right"></i> ${item.term} 
                    <span class="category-tag">${item.category.replace('-', ' ')}</span>
                </h3>
                <p><strong>Meaning:</strong> ${item.meaning}</p>
                ${item.example ? `<p class="example"><strong>Example:</strong> ${item.example}</p>` : ''}
                <div class="view-details">View Details <i class="fas fa-chevron-right"></i></div>
            </div>
        `;
    });
    
    html += '</div>';
    contentBody.innerHTML = html;
    
    // Add click event to each item
    document.querySelectorAll('.word-item').forEach(item => {
        item.addEventListener('click', function() {
            const itemId = parseInt(this.getAttribute('data-id'));
            showDetailView(results[itemId]);
        });
    });
}

// Set up search for current category
function setupCategorySearch() {
    searchBtn.addEventListener('click', () => searchInCategory(searchInput.value.trim()));
    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') searchInCategory(searchInput.value.trim());
    });
}

// Search within current category
// Search within current category
function searchInCategory(query = '') {
    if (!query && !searchQuery) {
        loadAndDisplayCategory();
        return;
    }
    
    const searchTerm = query || searchQuery;
    
    fetch(`data/${category}.json`)
        .then(response => response.json())
        .then(data => {
            const results = data.filter(item => 
                item.term.toLowerCase().includes(searchTerm.toLowerCase()) || 
                item.meaning.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (item.hindi_meaning && item.hindi_meaning.toLowerCase().includes(searchTerm.toLowerCase())) ||
                (item.synonyms && item.synonyms.toLowerCase().includes(searchTerm.toLowerCase()))
            );
            
            if (results.length === 0) {
                contentBody.innerHTML = `<p>No results found for "${searchTerm}" in this category</p>`;
            } else {
                titleText.textContent = `Search Results for "${searchTerm}"`;
                displayList(results);
            }
        })
        .catch(error => {
            console.error('Search error:', error);
            contentBody.innerHTML = '<p class="error">Error during search. Please try again.</p>';
        });
}
// Back button functionality
backBtn.addEventListener('click', () => {
    if (currentDisplayMode === 'detail') {
        displayList(currentData);
    } else {
        window.location.href = 'index.html';
    }
});