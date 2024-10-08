import { backend } from 'declarations/backend';

const uploadForm = document.getElementById('uploadForm');
const imageInput = document.getElementById('imageInput');
const loadingMessage = document.getElementById('loadingMessage');
const errorMessage = document.getElementById('errorMessage');
const manualInputForm = document.getElementById('manualInputForm');
const cardList = document.getElementById('cardList');
const categoryList = document.getElementById('categoryList');
const searchInput = document.getElementById('searchInput');
const searchButton = document.getElementById('searchButton');

let allCards = [];
let currentCategory = 'all';

const categoryEmojis = {
    'all': '🗂️',
    'Technology': '💻',
    'Finance': '💰',
    'Healthcare': '🏥',
    'Legal': '⚖️',
    'Education': '🎓',
    'Marketing': '📢',
    'Real Estate': '🏠',
    'Hospitality': '🍽️',
    'Retail': '🛍️',
    'Other': '📌'
};

uploadForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const file = imageInput.files[0];
    if (!file) {
        showError('Please select an image file.');
        return;
    }

    if (!file.type.startsWith('image/')) {
        showError('Please select a valid image file.');
        return;
    }

    loadingMessage.style.display = 'block';
    errorMessage.style.display = 'none';
    manualInputForm.style.display = 'none';

    try {
        const imageData = await readFileAsDataURL(file);
        const extractedText = await extractTextFromImage(file);
        const cardInfo = parseBusinessCardInfo(extractedText);
        const category = detectCategory(extractedText);
        
        await addBusinessCard(cardInfo, imageData, category);

        loadingMessage.style.display = 'none';
        await refreshCards();
    } catch (error) {
        console.error('Error processing business card:', error);
        showError('An error occurred while processing the business card. Please try manual input.');
        showManualInputForm();
    } finally {
        loadingMessage.style.display = 'none';
    }
});

document.getElementById('submitManualInput').addEventListener('click', async () => {
    const cardInfo = {
        name: document.getElementById('nameInput').value,
        email: document.getElementById('emailInput').value,
        phone: document.getElementById('phoneInput').value,
        company: document.getElementById('companyInput').value,
    };
    const category = document.getElementById('categoryInput').value.trim();

    if (!category) {
        showError('Please enter a category.');
        return;
    }

    const imageData = await readFileAsDataURL(imageInput.files[0]);
    await addBusinessCard(cardInfo, imageData, category);
    manualInputForm.style.display = 'none';
    await refreshCards();
});

searchButton.addEventListener('click', async () => {
    const query = searchInput.value.trim();
    if (query) {
        const searchResults = await backend.searchBusinessCards(query);
        displayBusinessCards(searchResults);
    } else {
        displayBusinessCards(allCards);
    }
});

function showError(message) {
    errorMessage.textContent = message;
    errorMessage.style.display = 'block';
}

function showManualInputForm() {
    manualInputForm.style.display = 'block';
}

function readFileAsDataURL(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

async function extractTextFromImage(file) {
    try {
        const result = await Tesseract.recognize(file, 'eng', {
            logger: m => console.log(m)
        });
        return result.data.text;
    } catch (error) {
        console.error('Error in Tesseract OCR:', error);
        throw new Error('Failed to extract text from image');
    }
}

function parseBusinessCardInfo(text) {
    const lines = text.split('\n').filter(line => line.trim() !== '');
    const info = {
        name: lines[0] || '',
        email: lines.find(line => line.includes('@')) || '',
        phone: lines.find(line => /\d{3}[-\s]?\d{3}[-\s]?\d{4}/.test(line)) || '',
        company: lines[lines.length - 1] || '',
    };
    return info;
}

function detectCategory(text) {
    const lowercaseText = text.toLowerCase();
    if (lowercaseText.includes('tech') || lowercaseText.includes('software')) return 'Technology';
    if (lowercaseText.includes('finance') || lowercaseText.includes('bank')) return 'Finance';
    if (lowercaseText.includes('health') || lowercaseText.includes('medical')) return 'Healthcare';
    if (lowercaseText.includes('law') || lowercaseText.includes('legal')) return 'Legal';
    if (lowercaseText.includes('education') || lowercaseText.includes('school')) return 'Education';
    if (lowercaseText.includes('marketing') || lowercaseText.includes('advertising')) return 'Marketing';
    if (lowercaseText.includes('real estate') || lowercaseText.includes('property')) return 'Real Estate';
    if (lowercaseText.includes('hotel') || lowercaseText.includes('restaurant')) return 'Hospitality';
    if (lowercaseText.includes('retail') || lowercaseText.includes('store')) return 'Retail';
    return 'Other';
}

async function addBusinessCard(cardInfo, imageData, category) {
    try {
        await backend.addBusinessCard(
            cardInfo.name,
            cardInfo.email,
            cardInfo.phone,
            cardInfo.company,
            imageData,
            category
        );
    } catch (error) {
        console.error('Error adding business card:', error);
        throw new Error('Failed to add business card');
    }
}

async function refreshCards() {
    try {
        allCards = await backend.getBusinessCards();
        const categories = await backend.getCategories();
        updateCategoryList(categories);
        displayBusinessCards(allCards);
    } catch (error) {
        console.error('Error fetching business cards:', error);
        showError('An error occurred while fetching business cards. Please refresh the page.');
    }
}

function updateCategoryList(categories) {
    categoryList.innerHTML = `
        <li class="active" data-category="all">
            ${categoryEmojis['all']} All
        </li>
    `;
    categories.forEach(category => {
        const li = document.createElement('li');
        li.dataset.category = category;
        li.innerHTML = `${categoryEmojis[category] || categoryEmojis['Other']} ${category}`;
        li.addEventListener('click', () => {
            currentCategory = category;
            displayBusinessCards(allCards);
            updateActiveCategory(li);
        });
        categoryList.appendChild(li);
    });
}

function updateActiveCategory(clickedElement) {
    document.querySelectorAll('#categoryList li').forEach(li => li.classList.remove('active'));
    clickedElement.classList.add('active');
}

function displayBusinessCards(cards) {
    const filteredCards = currentCategory === 'all' 
        ? cards 
        : cards.filter(card => card.category === currentCategory);

    cardList.innerHTML = filteredCards.map(card => `
        <div class="card">
            <img src="${card.imageData}" alt="Business Card">
            <h3>${card.name}</h3>
            <p>Email: ${card.email}</p>
            <p>Phone: ${card.phone}</p>
            <p>Company: ${card.company}</p>
            <p class="category">
                ${categoryEmojis[card.category] || categoryEmojis['Other']} ${card.category}
            </p>
            <p>Scan Date: ${new Date(Number(card.scanDate) / 1000000).toLocaleString()}</p>
        </div>
    `).join('');
}

categoryList.querySelector('[data-category="all"]').addEventListener('click', () => {
    currentCategory = 'all';
    displayBusinessCards(allCards);
    updateActiveCategory(categoryList.querySelector('[data-category="all"]'));
});

refreshCards();
