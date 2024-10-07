import { backend } from 'declarations/backend';

const uploadForm = document.getElementById('uploadForm');
const imageInput = document.getElementById('imageInput');
const loadingMessage = document.getElementById('loadingMessage');
const errorMessage = document.getElementById('errorMessage');
const manualInputForm = document.getElementById('manualInputForm');
const cardList = document.getElementById('cardList');

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
    const extractedText = await extractTextFromImage(imageData);
    const cardInfo = parseBusinessCardInfo(extractedText);
    
    await addBusinessCard(cardInfo, imageData);

    loadingMessage.style.display = 'none';
    await displayBusinessCards();
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

  const imageData = await readFileAsDataURL(imageInput.files[0]);
  await addBusinessCard(cardInfo, imageData);
  manualInputForm.style.display = 'none';
  await displayBusinessCards();
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

async function extractTextFromImage(imageData) {
  try {
    const response = await fetch('https://api.ocr.space/parse/image', {
      method: 'POST',
      headers: {
        'apikey': 'helloworld',
      },
      body: JSON.stringify({
        base64Image: imageData.split(',')[1],
        language: 'eng',
      }),
    });

    if (!response.ok) {
      throw new Error(`OCR API request failed with status ${response.status}`);
    }

    const data = await response.json();
    console.log('Full OCR API response:', data);

    if (data.ParsedResults && data.ParsedResults.length > 0) {
      return data.ParsedResults[0].ParsedText || '';
    } else if (data.ErrorMessage) {
      throw new Error(`OCR API error: ${data.ErrorMessage}`);
    } else {
      throw new Error('Unexpected OCR API response format');
    }
  } catch (error) {
    console.error('Error in extractTextFromImage:', error);
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

async function addBusinessCard(cardInfo, imageData) {
  try {
    await backend.addBusinessCard(
      cardInfo.name,
      cardInfo.email,
      cardInfo.phone,
      cardInfo.company,
      imageData
    );
  } catch (error) {
    console.error('Error adding business card:', error);
    throw new Error('Failed to add business card');
  }
}

async function displayBusinessCards() {
  try {
    const cards = await backend.getBusinessCards();
    cardList.innerHTML = cards.map(card => `
      <div class="card">
        <img src="${card.imageData}" alt="Business Card">
        <h3>${card.name}</h3>
        <p>Email: ${card.email}</p>
        <p>Phone: ${card.phone}</p>
        <p>Company: ${card.company}</p>
      </div>
    `).join('');
  } catch (error) {
    console.error('Error fetching business cards:', error);
    showError('An error occurred while fetching business cards. Please refresh the page.');
  }
}

displayBusinessCards();
