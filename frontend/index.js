import { backend } from 'declarations/backend';

const uploadForm = document.getElementById('uploadForm');
const imageInput = document.getElementById('imageInput');
const loadingMessage = document.getElementById('loadingMessage');
const cardList = document.getElementById('cardList');

uploadForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const file = imageInput.files[0];
  if (!file) return;

  loadingMessage.style.display = 'block';

  try {
    const imageUrl = await uploadImage(file);
    const extractedText = await extractTextFromImage(imageUrl);
    const cardInfo = parseBusinessCardInfo(extractedText);
    
    const id = await backend.addBusinessCard(
      cardInfo.name,
      cardInfo.email,
      cardInfo.phone,
      cardInfo.company,
      imageUrl
    );

    loadingMessage.style.display = 'none';
    displayBusinessCards();
  } catch (error) {
    console.error('Error processing business card:', error);
    loadingMessage.style.display = 'none';
  }
});

async function uploadImage(file) {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch('https://api.imgbb.com/1/upload?key=YOUR_IMGBB_API_KEY', {
    method: 'POST',
    body: formData,
  });

  const data = await response.json();
  return data.data.url;
}

async function extractTextFromImage(imageUrl) {
  const response = await fetch('https://api.ocr.space/parse/imageurl?apikey=helloworld&url=' + encodeURIComponent(imageUrl));
  const data = await response.json();
  return data.ParsedResults[0].ParsedText;
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
  const cards = await backend.getBusinessCards();
  cardList.innerHTML = cards.map(card => `
    <div class="card">
      <img src="${card.imageUrl}" alt="Business Card">
      <h3>${card.name}</h3>
      <p>Email: ${card.email}</p>
      <p>Phone: ${card.phone}</p>
      <p>Company: ${card.company}</p>
    </div>
  `).join('');
}

displayBusinessCards();
