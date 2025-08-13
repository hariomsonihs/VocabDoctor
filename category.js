const urlParams = new URLSearchParams(window.location.search);
const category = urlParams.get('category');
const isSearch = urlParams.get('search');
const searchQuery = isSearch && isSearch !== 'true' ? decodeURIComponent(isSearch) : null;

const titleText = document.getElementById('title-text');
const contentBody = document.getElementById('content-body');
const backBtn = document.getElementById('back-btn');
const searchInput = document.getElementById('search-input');
const searchBtn = document.getElementById('search-btn');

const categoryTitles = {
    'phrasal-verbs': 'Phrasal Verbs',
    'idioms': 'English Idioms',
    'proverbs': 'English Proverbs',
    'daily-sentences': 'Daily Sentences',
    'verbs': 'English Verbs',
    'synonyms': 'Synonyms',
    'antonyms': 'Antonyms',
    'common-phrases': 'Common Phrases',
};

let currentData = [];
let currentDisplayMode = 'list';
let currentDetailItem = null;

const isAndroidWebView = window.location.protocol === 'file:';
const basePath = isAndroidWebView ? 'file:///android_asset/data/' : 'data/';

function showError(message) {
    contentBody.innerHTML = `
        <div class="error-message">
            <i class="fas fa-exclamation-triangle"></i>
            <p>${message}</p>
            <button onclick="window.location.reload()">Try Again</button>
        </div>
    `;
}

window.addEventListener('message', function(event) {
    if (event.data.action === 'displaySearchResults') {
        displaySearchResults(event.data.query, event.data.results);
    }
});

window.addEventListener('DOMContentLoaded', function() {
    console.log(`Loading page with params: category=${category}, search=${isSearch}, query=${searchQuery}`);

    if (searchQuery) {
        titleText.textContent = 'Search Results';
        contentBody.innerHTML = '<p class="loading"><i class="fas fa-spinner fa-spin"></i> Loading search results...</p>';
        searchInCategory(searchQuery);
    } else if (isSearch) {
        titleText.textContent = 'Search Results';
        contentBody.innerHTML = '<p class="loading"><i class="fas fa-spinner fa-spin"></i> Loading search results...</p>';
    } else if (category) {
        if (category in categoryTitles) {
            loadAndDisplayCategory();
        } else {
            showError('Invalid category selected');
            console.error(`Invalid category: ${category}`);
        }
    } else {
        window.location.href = 'index.html';
    }
});

function loadAndDisplayCategory() {
    try {
        titleText.textContent = categoryTitles[category] || category;
        contentBody.innerHTML = '<p class="loading"><i class="fas fa-spinner fa-spin"></i> Loading data...</p>';

        const xhr = new XMLHttpRequest();
        xhr.open('GET', `${basePath}${category}.json`, true);
        xhr.overrideMimeType('application/json; charset=utf-8');
        xhr.onload = function() {
            if (xhr.status === 0 || xhr.status === 200) {
                try {
                    currentData = JSON.parse(xhr.responseText);
                    if (!Array.isArray(currentData)) {
                        throw new Error('Invalid data format: expected array');
                    }
                    displayList(currentData);
                    setupCategorySearch();
                } catch (error) {
                    console.error(`Error parsing ${category}:`, error);
                    showError(`Failed to parse ${categoryTitles[category]}. ${error.message}`);
                }
            } else {
                throw new Error(`HTTP error! status: ${xhr.status}`);
            }
        };
        xhr.onerror = function() {
            showError(`Failed to load ${categoryTitles[category]}. Network error`);
            console.error(`Error loading ${category}: Network error`);
        };
        xhr.send();

    } catch (error) {
        console.error(`Error loading ${category}:`, error);
        showError(`Failed to load ${categoryTitles[category]}. ${error.message}`);
    }
}

function displayList(data) {
    currentDisplayMode = 'list';

    if (!data || data.length === 0) {
        contentBody.innerHTML = '<p class="no-results">No items found in this category</p>';
        return;
    }

    let html = '<div class="word-list">';

    data.forEach((item, index) => {
        if (!item.term || !item.meaning) {
            console.warn('Invalid item format at index', index, item);
            return;
        }

        html += `
            <div class="word-item" data-id="${index}">
                <h3><i class="fas fa-angle-right"></i> ${sanitizeText(item.term)}</h3>
                <p><strong>Meaning:</strong> ${sanitizeText(item.meaning)}</p>
                ${item.example ? `<p class="example"><strong>Example:</strong> ${sanitizeText(item.example)}</p>` : ''}
                <div class="view-details">View Details <i class="fas fa-chevron-right"></i></div>
            </div>
        `;
    });

    html += '</div>';
    contentBody.innerHTML = html;

    document.querySelectorAll('.word-item').forEach(item => {
        item.addEventListener('click', function() {
            const itemId = parseInt(this.getAttribute('data-id'));
            if (!isNaN(itemId) && data[itemId]) {
                showDetailView(data[itemId]);
            }
        });
    });
}

function showDetailView(item) {
    if (!item) {
        console.error('Invalid item for detail view');
        return;
    }

    currentDisplayMode = 'detail';
    currentDetailItem = item;

    let html = `
        <div class="detail-view">
            <div class="detail-header">
                <button id="back-to-list" class="back-btn"><i class="fas fa-arrow-left"></i> Back</button>
                <h2>${sanitizeText(item.term || 'No term available')}</h2>
            </div>
            <div class="detail-content">
                <div class="detail-section">
                    <h3>Meaning</h3>
                    ${formatTextAsList(item.meaning || 'No meaning available')}
                </div>

                ${item.hindi_meaning ? `
                <div class="detail-section">
                    <h3>Hindi Meaning</h3>
                    ${formatTextAsList(item.hindi_meaning)}
                </div>
                ` : ''}

                ${item.verb_forms ? `
                <div class="detail-section">
                    <h3>Verb Forms</h3>
                    <ul>
                        <li><strong>Base (V1):</strong> ${sanitizeText(item.verb_forms.base || 'N/A')}</li>
                        <li><strong>Past (V2):</strong> ${sanitizeText(item.verb_forms.past || 'N/A')}</li>
                        <li><strong>Past Participle (V3):</strong> ${sanitizeText(item.verb_forms.past_participle || 'N/A')}</li>
                        <li><strong>Present Participle (V4):</strong> ${sanitizeText(item.verb_forms.present_participle || 'N/A')}</li>
                        <li><strong>3rd Person Singular (V5):</strong> ${sanitizeText(item.verb_forms['3rd_person'] || 'N/A')}</li>
                    </ul>
                </div>
                ` : ''}

                ${item.synonyms ? `
                <div class="detail-section">
                    <h3>Synonyms</h3>
                    ${formatTextAsList(item.synonyms)}
                </div>
                ` : ''}
                ${item.part_of_speech ? `
                <div class="detail-section">
                      <h3>Part Of Speech</h3>
                       ${formatTextAsList(item.part_of_speech)}
                </div>
                ` : ''}

                ${item.transitivity ? `
                <div class="detail-section">
                    <h3>Transitivity</h3>
                    ${formatTextAsList(item.transitivity)}
                </div>
                ` : ''}
                ${item.antonyms ? `
                 <div class="detail-section">
                      <h3>Antonyms</h3>
                       ${formatTextAsList(item.antonyms)}
                 </div>
                 ` : ''}

                ${item.formality ? `
                <div class="detail-section">
                    <h3>Formality</h3>
                    ${formatTextAsList(item.formality)}
                </div>
                ` : ''}

                ${item.usage_note ? `
                <div class="detail-section">
                    <h3>Usage Note</h3>
                    ${formatTextAsList(item.usage_note)}
                </div>
                ` : ''}

                ${item.example ? `
                <div class="detail-section">
                    <h3>Example</h3>
                    ${formatTextAsList(item.example, 'example')}
                </div>
                ` : ''}
            </div>
        </div>
    `;

    contentBody.innerHTML = html;

    const backButton = document.getElementById('back-to-list');
    if (backButton) {
        backButton.addEventListener('click', function(e) {
            e.stopPropagation();
            displayList(currentData);
        });
    }
}

function displaySearchResults(query, results) {
    if (!query || !results) {
        console.error('Invalid search results');
        return;
    }

    titleText.textContent = `Search Results for "${sanitizeText(query)}"`;
    currentData = results;

    if (results.length === 0) {
        contentBody.innerHTML = `<p class="no-results">No results found for "${sanitizeText(query)}"</p>`;
        return;
    }

    let html = `<div class="search-info">
        <p>Found ${results.length} results across all categories</p>
    </div><div class="word-list">`;

    results.forEach((item, index) => {
        if (!item.term || !item.meaning) {
            console.warn('Invalid search result item at index', index, item);
            return;
        }

        html += `
            <div class="word-item" data-id="${index}">
                <h3><i class="fas fa-angle-right"></i> ${sanitizeText(item.term)}
                    <span class="category-tag">${sanitizeText((item.category || '').replace('-', ' '))}</span>
                </h3>
                <p><strong>Meaning:</strong> ${sanitizeText(item.meaning)}</p>
                ${item.example ? `<p class="example"><strong>Example:</strong> ${sanitizeText(item.example)}</p>` : ''}
                <div class="view-details">View Details <i class="fas fa-chevron-right"></i></div>
            </div>
        `;
    });

    html += '</div>';
    contentBody.innerHTML = html;

    document.querySelectorAll('.word-item').forEach(item => {
        item.addEventListener('click', function() {
            const itemId = parseInt(this.getAttribute('data-id'));
            if (!isNaN(itemId) && results[itemId]) {
                showDetailView(results[itemId]);
            }
        });
    });
}

function setupCategorySearch() {
    searchBtn.addEventListener('click', () => {
        const query = searchInput.value.trim();
        if (query) {
            searchInCategory(query);
        }
    });

    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            const query = searchInput.value.trim();
            if (query) {
                searchInCategory(query);
            }
        }
    });
}

function searchInCategory(query = '') {
    if (!query && !searchQuery) {
        loadAndDisplayCategory();
        return;
    }

    const searchTerm = query || searchQuery;
    console.log(`Searching for: "${searchTerm}" in ${category}`);

    contentBody.innerHTML = '<p class="loading"><i class="fas fa-spinner fa-spin"></i> Searching...</p>';

    const xhr = new XMLHttpRequest();
    xhr.open('GET', `${basePath}${category}.json`, true);
    xhr.overrideMimeType('application/json; charset=utf-8');
    xhr.onload = function() {
        if (xhr.status === 0 || xhr.status === 200) {
            try {
                const data = JSON.parse(xhr.responseText);
                if (!Array.isArray(data)) {
                    throw new Error('Invalid data format: expected array');
                }

                const results = data.filter(item => {
                    try {
                        return (
                            (item.term && item.term.toLowerCase().includes(searchTerm.toLowerCase())) ||
                            (item.meaning && item.meaning.toLowerCase().includes(searchTerm.toLowerCase())) ||
                            (item.hindi_meaning && item.hindi_meaning.toLowerCase().includes(searchTerm.toLowerCase())) ||
                            (item.synonyms && item.synonyms.toLowerCase().includes(searchTerm.toLowerCase())) ||
                            (item.part_of_speech && item.part_of_speech.toLowerCase().includes(searchTerm.toLowerCase())) ||
                            (item.antonyms && item.antonyms.toLowerCase().includes(searchTerm.toLowerCase())) ||
                            (item.transitivity && item.transitivity.toLowerCase().includes(searchTerm.toLowerCase())) ||
                            (item.formality && item.formality.toLowerCase().includes(searchTerm.toLowerCase())) ||
                            (item.usage_note && item.usage_note.toLowerCase().includes(searchTerm.toLowerCase())) ||
                            (item.verb_forms && (
                                item.verb_forms.base.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                item.verb_forms.past.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                item.verb_forms.past_participle.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                item.verb_forms.present_participle.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                item.verb_forms['3rd_person'].toLowerCase().includes(searchTerm.toLowerCase())
                            ))
                        );
                    } catch (e) {
                        console.warn('Error filtering item:', item, e);
                        return false;
                    }
                });

                if (results.length === 0) {
                    contentBody.innerHTML = `<p class="no-results">No results found for "${sanitizeText(searchTerm)}" in this category</p>`;
                } else {
                    titleText.textContent = `Search Results for "${sanitizeText(searchTerm)}"`;
                    displayList(results);
                }
            } catch (error) {
                console.error('Search error:', error);
                showError(`Search failed: ${error.message}`);
            }
        }
    };
    xhr.onerror = function() {
        showError(`Search failed: Network error`);
        console.error('Search error: Network error');
    };
    xhr.send();
}

backBtn.addEventListener('click', () => {
    if (currentDisplayMode === 'detail') {
        displayList(currentData);
    } else {
        window.location.href = 'index.html';
    }
});

function sanitizeText(text) {
    if (!text) return '';
    return text
        .replace(/\u2022/g, '- ')
        .replace(/â€¢/g, '- ')
        .replace(/[^\x00-\x7F]+/g, match => {
            return Array.from(match).map(char => `&#${char.charCodeAt(0)};`).join('');
        })
        .replace(/(\-\s*)+/g, '- ')
        .trim();
}

function formatTextAsList(text, className = '') {
    if (!text) return '<p>No content available</p>';
    const items = text.split(/\n|\u2022|â€¢/).map(item => item.trim()).filter(item => item);
    if (items.length <= 1) return `<p class="${className}">${sanitizeText(text)}</p>`;

    let html = `<ul class="${className}">`;
    items.forEach(item => {
        if (item) html += `<li>${sanitizeText(item)}</li>`;
    });
    html += '</ul>';
    return html;
}