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
    'all': 'fa-th-large',
    'Technology': 'fa-laptop-code',
    'Finance': 'fa-chart-line',
    'Healthcare': 'fa-heartbeat',
    'Legal': 'fa-balance-scale',
    'Other': 'fa-folder'
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
            <i class="fas ${categoryIcons['all']}"></i>
            All
        </li>
    `;
    categories.forEach(category => {
        const li = document.createElement('li');
        li.dataset.category = category;
        li.innerHTML = `
            <i class="fas ${categoryIcons[category] || categoryIcons['Other']}"></i>
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
            <p>
                <i class="fas ${categoryIcons[card.category] || categoryIcons['Other']}"></i>
                Category: ${card.category}
            </p>
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
