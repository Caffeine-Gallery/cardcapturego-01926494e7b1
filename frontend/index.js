import { backend } from 'declarations/backend';

const uploadForm = document.getElementById('uploadForm');
const imageInput = document.getElementById('imageInput');
const loadingMessage = document.getElementById('loadingMessage');
const errorMessage = document.getElementById('errorMessage');
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

  try {
    const imageData = await readFileAsDataURL(file);
    const extractedText = await extractTextFromImage(imageData);
    const cardInfo = parseBusinessCardInfo(extractedText);
    
    const id = await backend.addBusinessCard(
      cardInfo.name,
      cardInfo.email,
      cardInfo.phone,
      cardInfo.company,
      imageData
    );

    loadingMessage.style.display = 'none';
    await displayBusinessCards();
  } catch (error) {
    console.error('Error processing business card:', error);
    showError('An error occurred while processing the business card. Please try again.');
  } finally {
    loadingMessage.style.display = 'none';
  }
});

function showError(message) {
  errorMessage.textContent = message;
  errorMessage.style.display = 'block';
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
    console.log('OCR API response:', data); // For debugging

    if (!data.ParsedResults || !data.ParsedResults[0] || !data.ParsedResults[0].ParsedText) {
      throw new Error('Unexpected OCR API response format');
    }

    return data.ParsedResults[0].ParsedText;
  } catch (error) {
    console.error('Error in extractTextFromImage:', error);
    throw new Error('Failed to extract text from image');
  }
}

function parseBusinessCardInfo(text) {
  const lines = text.split('\n');
  const info = {
    name: lines[0] || '',
    email: lines.find(line => line.includes('@')) || '',
    phone: lines.find(line => /\d{3}[-\s]?\d{3}[-\s]?\d{4}/.test(line)) || '',
    company: lines[lines.length - 1] || '',
  };
  return info;
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
