const OPENAI_API_KEY = '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';
const DAILY_LIMIT = 10;
const RESET_INTERVAL = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

document.getElementById('generate').addEventListener('click', generateContent);

const examplePrompts = [
    "A vast cosmic ocean where galaxies are but droplets in an infinite sea",
    "An interdimensional nexus where countless realities collide and merge",
    "A celestial forge where stars are born and universes are crafted",
    "An ethereal realm where thoughts manifest as entire worlds",
    "A cosmic tapestry woven from the threads of infinite possibilities",
    "A grand cosmic theater where the drama of creation unfolds endlessly",
    "An infinite library containing the knowledge of all possible universes",
    "A non-Euclidean dreamscape where geometry defies comprehension",
    "A boundless expanse where time and space intertwine in mesmerizing patterns",
    "A quantum labyrinth of paradoxical causality loops and probability waves"
];

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

function updateExamplePrompts() {
    shuffleArray(examplePrompts);
    for (let i = 0; i < 2; i++) {
        const exampleButton = document.getElementById(`example${i+1}`);
        exampleButton.textContent = examplePrompts[i];
        exampleButton.onclick = () => {
            document.getElementById('prompt').value = examplePrompts[i];
        };
    }
}

async function generateContent() {
    if (!checkDailyLimit()) {
        alert('You have reached your daily limit of 10 images. Please try again after 24 hours.');
        return;
    }

    const prompt = document.getElementById('prompt').value;
    const imageCount = parseInt(document.getElementById('imageCount').value);
    const resultDiv = document.getElementById('result');
    const progressBar = document.getElementById('progress');
    const progressElement = progressBar.querySelector('.progress');
    const progressText = progressBar.querySelector('.progress-text');

    if (!prompt) {
        alert('Please enter a description for the content you want to create.');
        return;
    }

    resultDiv.innerHTML = '';
    progressBar.style.display = 'block';
    progressElement.style.width = '0%';
    progressText.textContent = '0%';

    // Simulate initial progress
    setTimeout(() => {
        updateProgress(progressElement, progressText, 5);
    }, 300);

    setTimeout(() => {
        updateProgress(progressElement, progressText, 12);
    }, 700);

    // Start the smooth progress animation
    let progress = 12;
    const progressInterval = setInterval(() => {
        progress += 0.5;
        if (progress >= 95) {
            clearInterval(progressInterval);
        } else {
            updateProgress(progressElement, progressText, progress);
        }
    }, 200);

    try {
        // Start translation and image generation concurrently
        const [translatedPrompt, images] = await Promise.all([
            translateToEnglish(prompt),
            generateImages(prompt, imageCount, progressElement, progressText)
        ]);

        console.log('Translated prompt:', translatedPrompt);
        displayResults(images, 'image');
        updateDailyLimit(imageCount);
    } catch (error) {
        resultDiv.innerHTML = `Error: ${error.message}`;
    } finally {
        clearInterval(progressInterval);
        progressBar.style.display = 'none';
    }
}

async function translateToEnglish(text) {
    try {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${OPENAI_API_KEY}`
            },
            body: JSON.stringify({
                model: "gpt-3.5-turbo",
                messages: [
                    {role: "system", content: "You are a translator. Translate the following Vietnamese text to English."},
                    {role: "user", content: text}
                ]
            })
        });

        if (!response.ok) {
            throw new Error('Translation failed');
        }

        const data = await response.json();
        return data.choices[0].message.content;
    } catch (error) {
        console.error('Error translating text:', error);
        return text; // Return original text if translation fails
    }
}

async function generateImages(prompt, count, progressElement, progressText) {
    const images = [];
    for (let i = 0; i < count; i++) {
        try {
            const response = await fetch('https://api.openai.com/v1/images/generations', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${OPENAI_API_KEY}`
                },
                body: JSON.stringify({
                    prompt: prompt,
                    n: 1,
                    size: "1024x1024"
                })
            });

            if (!response.ok) {
                throw new Error('Image generation failed');
            }

            const data = await response.json();
            images.push(data.data[0].url);
            updateProgress(progressElement, progressText, (i + 1) / count * 100);
        } catch (error) {
            console.error('Error generating image:', error);
            throw error;
        }
    }
    return images;
}

function displayResults(urls, type) {
    const resultDiv = document.getElementById('result');
    resultDiv.innerHTML = '';
    urls.forEach(url => {
        if (type === 'image') {
            const img = document.createElement('img');
            img.src = url;
            img.alt = "Generated Image";
            resultDiv.appendChild(img);
        }
    });
}

function updateProgress(progressElement, progressText, percentage) {
    const roundedPercentage = Math.round(percentage);
    progressElement.style.width = `${roundedPercentage}%`;
    progressText.textContent = `${roundedPercentage}%`;
}

function checkDailyLimit() {
    const currentDate = new Date().toDateString();
    const lastResetDate = localStorage.getItem('lastResetDate');
    let imageCount = parseInt(localStorage.getItem('dailyImageCount') || '0');

    if (lastResetDate !== currentDate) {
        localStorage.setItem('lastResetDate', currentDate);
        localStorage.setItem('dailyImageCount', '0');
        imageCount = 0;
    }

    return imageCount < DAILY_LIMIT;
}

function updateDailyLimit(count) {
    const currentCount = parseInt(localStorage.getItem('dailyImageCount') || '0');
    const newCount = currentCount + count;
    localStorage.setItem('dailyImageCount', newCount.toString());
}

// Initialize when the page loads
window.onload = function() {
    updateExamplePrompts();
    displayRemainingImages();
};

function displayRemainingImages() {
    const currentCount = parseInt(localStorage.getItem('dailyImageCount') || '0');
    const remaining = DAILY_LIMIT - currentCount;
    const infoDiv = document.createElement('div');
    infoDiv.textContent = `Remaining images today: ${remaining}`;
    infoDiv.style.textAlign = 'center';
    infoDiv.style.marginTop = '10px';
    document.getElementById('creator').appendChild(infoDiv);
}
