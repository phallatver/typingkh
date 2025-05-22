// Import the word generation functions
import { generateRandomTexts } from './khmer_words.js';

// Instead of generating texts once, we'll generate them on demand
function getRandomText() {
    // Generate a single random paragraph with 15-25 words
    const texts = generateRandomTexts(1, 15, 25);
    return texts[0];
}

// Export the function instead of a static array
export { getRandomText }; 