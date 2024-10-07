import { backend } from 'declarations/backend';

const uploadForm = document.getElementById('uploadForm');
const imageInput = document.getElementById('imageInput');
const loadingMessage = document.getElementById('loadingMessage');
const errorMessage = document.getElementById('errorMessage');
const manualInputForm = document.getElementById('manualInputForm');
const cardList = document.getElementById('cardList');
const categoryList = document.getElementById('categoryList');

let allCards = [];
let currentCategory = 'all';

const categoryIcons = {
    'all': '<path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z"/>',
    'Technology': '<path d="M20 18c1.1 0 1.99-.9 1.99-2L22 6c0-1.1-.9-2-2-2H4c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2H0v2h24v-2h-4zM4 6h16v10H4V6z"/>',
    'Finance': '<path d="M11.8 10.9c-2.27-.59-3-1.2-3-2.15 0-1.09 1.01-1.85 2.7-1.85 1.78 0 2.44.85 2.5 2.1h2.21c-.07-1.72-1.12-3.3-3.21-3.81V3h-3v2.16c-1.94.42-3.5 1.68-3.5 3.61 0 2.31 1.91 3.46 4.7 4.13 2.5.6 3 1.48 3 2.41 0 .69-.49 1.79-2.7 1.79-2.06 0-2.87-.92-2.98-2.1h-2.2c.12 2.19 1.76 3.42 3.68 3.83V21h3v-2.15c1.95-.37 3.5-1.5 3.5-3.55 0-2.84-2.43-3.81-4.7-4.4z"/>',
    'Healthcare': '<path d="M19 3H5c-1.1 0-1.99.9-1.99 2L3 19c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-1 11h-4v4h-4v-4H6v-4h4V6h4v4h4v4z"/>',
    'Legal': '<path d="M13 3c-4.97 0-9 4.03-9 9H1l3.89 3.89.07.14L9 12H6c0-3.87 3.13-7 7-7s7 3.13 7 7-3.13 7-7 7c-1.93 0-3.68-.79-4.94-2.06l-1.42 1.42C8.27 19.99 10.51 21 13 21c4.97 0 9-4.03 9-9s-4.03-9-9-9zm-1 5v5l4.28 2.54.72-1.21-3.5-2.08V8H12z"/>',
    'Other': '<path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>'
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
        displayBusinessCards();
    } catch (error) {
        console.error('Error fetching business cards:', error);
        showError('An error occurred while fetching business cards. Please refresh the page.');
    }
}

function updateCategoryList(categories) {
    categoryList.innerHTML = `
        <li class="active" data-category="all">
            <svg class="icon" viewBox="0 0 24 24">
                ${categoryIcons['all']}
            </svg>
            All
        </li>
    `;
    categories.forEach(category => {
        const li = document.createElement('li');
        li.dataset.category = category;
        li.innerHTML = `
            <svg class="icon" viewBox="0 0 24 24">
                ${categoryIcons[category] || categoryIcons['Other']}
            </svg>
            ${category}
        `;
        li.addEventListener('click', () => {
            currentCategory = category;
            displayBusinessCards();
            updateActiveCategory(li);
        });
        categoryList.appendChild(li);
    });
}

function updateActiveCategory(clickedElement) {
    document.querySelectorAll('#categoryList li').forEach(li => li.classList.remove('active'));
    clickedElement.classList.add('active');
}

function displayBusinessCards() {
    const filteredCards = currentCategory === 'all' 
        ? allCards 
        : allCards.filter(card => card.category === currentCategory);

    cardList.innerHTML = filteredCards.map(card => `
        <div class="card">
            <img src="${card.imageData}" alt="Business Card">
            <h3>${card.name}</h3>
            <p>Email: ${card.email}</p>
            <p>Phone: ${card.phone}</p>
            <p>Company: ${card.company}</p>
            <p>Category: ${card.category}</p>
            <p>Scan Date: ${new Date(Number(card.scanDate) / 1000000).toLocaleString()}</p>
        </div>
    `).join('');
}

categoryList.querySelector('[data-category="all"]').addEventListener('click', () => {
    currentCategory = 'all';
    displayBusinessCards();
    updateActiveCategory(categoryList.querySelector('[data-category="all"]'));
});

refreshCards();
