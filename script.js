// script.js
import { getRandomText } from './khmer_texts.js';

const textToTypeContainer = document.getElementById('text-to-type-container');
const textToTypeElement = document.getElementById('text-to-type');
const inputAreaElement = document.getElementById('input-area');
const resetButton = document.getElementById('reset-button');
const wpmElement = document.getElementById('wpm');
const accuracyElement = document.getElementById('accuracy');
const timerDisplay = document.getElementById('timer-display');
const timerElement = document.getElementById('timer');
const nextKeystrokeElement = document.getElementById('next-keystroke');
const englishEquivalentElement = document.getElementById('english-equivalent');

const virtualKeyboardContainer = document.getElementById('virtual-keyboard-container');
const toggleKeyboardButton = document.getElementById('toggle-keyboard-button');

const resultsDiv = document.getElementById('results');
const speedGraph = document.getElementById('speed-graph');
const avgWpmElement = document.getElementById('avg-wpm');
const finalAccuracyElement = document.getElementById('final-accuracy');
const peakWpmElement = document.getElementById('peak-wpm');

let currentText = "";
let typedText = "";
let currentTextChars = [];
let startTime;
let timerInterval;
let errors = 0;
let testActive = false;
let isPaused = false; // Add pause state
let pauseStartTime = 0; // Track when we paused
let totalPausedTime = 0; // Track total paused time

let isShiftActive = false;
let physicalShiftKeyDown = false; // Tracks the physical Shift key state
let isCoengActive = false; // Reinstated for the '្' key

let wpmHistory = [];
let selectedTestDuration = 30; // Default duration
let timeRemaining; // Current countdown value
let graphContext = speedGraph.getContext('2d');

let tabPressed = false;

// Add this variable to store how many words to type before adding more
let wordsBeforeAppend = 5; // Append text after 5 words are typed correctly

// Get timer toggle buttons - moved to DOMContentLoaded to ensure DOM is ready
let timerToggleButtons;
let infiniteMode = false; // Track if timer is in infinite mode

// Update the constants at the top
const MAX_WORDS = 30; // Maximum words to display at once
const WORDS_AHEAD = 15; // Number of words to generate ahead
const MIN_WORDS_REMAINING = 10; // Generate new words when we have this many remaining

// Add these variables with other state variables
let textWords = []; // Array to store words
let currentWordIndex = 0; // Track which word the user is currently typing
let completedWords = 0; // Track how many words have been completed

// Add these variables with other state variables at the top
let tipTimeout;
const TIP_HIDE_DELAY = 5000; // Hide tips after 5 seconds

// Get WPM and accuracy display elements for toggling
const wpmDisplay = document.querySelector('.wpm-display');
const accuracyDisplay = document.querySelector('.accuracy-display');

// Add footer element reference at the top with other element references
const footerElement = document.querySelector('.app-footer');

// --- START: KHMER KEYBOARD LAYOUT (FILLED - ANSI Structure) ---
const khmerKeyboardLayout = [
    // Row 0: Tilde, Numbers, Backspace (14 keys)
    [
        ['«', '»', '`', '~', 'key-char'],        // ` ~
        ['១', '!', '1', '!', 'key-char'],        // 1 !
        ['២', 'ៗ', '2', '@', 'key-char'],        // 2 @ -> ៗ
        ['៣', '"', '3', '#', 'key-char'],        // 3 # -> "
        ['៤', '៛', '4', '$', 'key-char'],        // 4 $ -> ៛
        ['៥', '%', '5', '%', 'key-char'],        // 5 %
        ['៦', '៍', '6', '^', 'key-char'],        // 6 ^ -> ៍
        ['៧', '័', '7', '&', 'key-char'],        // 7 & -> ័
        ['៨', '៏', '8', '*', 'key-char'],        // 8 * -> ៏
        ['៩', 'ឰ', '9', '(', 'key-char'],        // 9 ( -> ឰ
        ['០', 'ឳ', '0', ')', 'key-char'],        // 0 ) -> ឳ
        ['ឥ', '៌', '-', '_', 'key-char'],        // - _ -> ឥ / ៌
        ['ឲ', '៎', '=', '+', 'key-char'],        // = + -> ឲ / ៎
        [null, null, 'backspace', 'លុប', 'special-key key-backspace']
    ],
    // Row 1: Tab, QWERTY row (14 keys)
    [
        [null, null, 'tab', 'Tab', 'special-key key-tab'],
        ['ឆ', 'ឈ', 'q', 'Q', 'key-char'],        // q Q
        ['ឹ', 'ឺ', 'w', 'W', 'key-char'],        // w W
        ['េ', 'ែ', 'e', 'E', 'key-char'],        // e E
        ['រ', 'ឬ', 'r', 'R', 'key-char'],        // r R
        ['ត', 'ទ', 't', 'T', 'key-char'],        // t T
        ['យ', 'ួ', 'y', 'Y', 'key-char'],        // y Y
        ['ុ', 'ូ', 'u', 'U', 'key-char'],        // u U
        ['ិ', 'ី', 'i', 'I', 'key-char'],        // i I
        ['ោ', 'ៅ', 'o', 'O', 'key-char'],        // o O
        ['ផ', 'ភ', 'p', 'P', 'key-char'],        // p P
        ['ៀ', 'ឿ', '[', '{', 'key-char'],        // [ {
        ['ឪ', 'ឧ', ']', '}', 'key-char'],        // ] }
        ['ឭ', 'ឮ', '\\', '|', 'key-char key-backslash'] // \ |
    ],
    // Row 2: Caps Lock, ASDF row (13 keys)
    [
        [null, null, 'capslock', 'Caps Lock', 'special-key key-capslock'],
        ['ា', 'ឫ', 'a', 'A', 'key-char'],        // a A
        ['ស', 'ៃ', 's', 'S', 'key-char'],        // s S
        ['ដ', 'ឌ', 'd', 'D', 'key-char'],        // d D
        ['ថ', 'ធ', 'f', 'F', 'key-char'],        // f F
        ['ង', 'អ', 'g', 'G', 'key-char'],        // g G
        ['ហ', 'ះ', 'h', 'H', 'key-char'],        // h H
        ['្', 'ញ', 'j', 'J', 'key-char coeng-trigger-key'], // j J
        ['ក', 'គ', 'k', 'K', 'key-char'],        // k K
        ['ល', 'ឡ', 'l', 'L', 'key-char'],        // l L
        ['ើ', '៖', ';', ':', 'key-char'],        // ; :
        ['់', '៉', "'", '"', 'key-char'],        // ' "
        [null, null, 'enter', 'Enter', 'special-key key-enter']
    ],
    // Row 3: Shift, ZXCV row (12 keys)
    [
        [null, null, 'shift', 'Shift', 'special-key key-shift key-shift-left'],
        ['ឋ', 'ឍ', 'z', 'Z', 'key-char'],        // z Z
        ['ខ', 'ឃ', 'x', 'X', 'key-char'],        // x X
        ['ច', 'ជ', 'c', 'C', 'key-char'],        // c C
        ['វ', 'ៈ', 'v', 'V', 'key-char'],        // v V
        ['ប', 'ព', 'b', 'B', 'key-char'],        // b B
        ['ន', 'ណ', 'n', 'N', 'key-char'],        // n N
        ['ម', 'ំ', 'm', 'M', 'key-char'],        // m M
        ['ឦ', 'ឱ', ',', '<', 'key-char'],        // , <
        ['។', '៕', '.', '>', 'key-char'],        // . >
        ['៊', 'ឯ', '/', '?', 'key-char'],        // / ?
        [null, null, 'shift', 'Shift', 'special-key key-shift key-shift-right']
    ],
    // Row 4: Bottom Modifiers
    [
        [null, null, 'ctrl', ' ', 'special-key key-ctrl key-ctrl-left'],
        [null, null, 'alt', ' ', 'special-key key-alt key-alt-left'],
        [null, null, 'space', 'ដកឃ្លា', 'special-key key-space'],
        [null, null, 'altgr', ' ', 'special-key key-altgr key-alt-right'],
        [null, null, 'ctrl', ' ', 'special-key key-ctrl key-ctrl-right']
    ]
];
// --- END: KHMER KEYBOARD LAYOUT (FILLED) ---

const khmerToQwertyMap = {
    // Row 0
    '«': '`', '»': 'Shift + `',
    '១': '1', '!': 'Shift + 1',
    '២': '2', 'ៗ': 'Shift + 2',
    '៣': '3', '"': 'Shift + 3',
    '៤': '4', '៛': 'Shift + 4',
    '៥': '5', '%': 'Shift + 5',
    '៦': '6', '៍': 'Shift + 6',
    '៧': '7', '័': 'Shift + 7',
    '៨': '8', '៏': 'Shift + 8',
    '៩': '9', 'ឰ': 'Shift + 9',
    '០': '0', 'ឳ': 'Shift + 0',
    'ឥ': '-', '៌': 'Shift + -',
    'ឲ': '=', '៎': 'Shift + =',
    // Row 1
    'ឆ': 'q', 'ឈ': 'Shift + q',
    'ឹ': 'w', 'ឺ': 'Shift + w',
    'េ': 'e', 'ែ': 'Shift + e',
    'រ': 'r', 'ឬ': 'Shift + r',
    'ត': 't', 'ទ': 'Shift + t',
    'យ': 'y', 'ួ': 'Shift + y',
    'ុ': 'u', 'ូ': 'Shift + u',
    'ិ': 'i', 'ី': 'Shift + i',
    'ោ': 'o', 'ៅ': 'Shift + o',
    'ផ': 'p', 'ភ': 'Shift + p',
    'ៀ': '[', 'ឿ': 'Shift + [',
    'ឪ': ']', 'ឧ': 'Shift + ]',
    'ឭ': '\\', 'ឮ': 'Shift + \\', // Escaped backslash for string literal
    // Row 2
    'ា': 'a', 'ឫ': 'Shift + a',
    'ស': 's', 'ៃ': 'Shift + s',
    'ដ': 'd', 'ឌ': 'Shift + d',
    'ថ': 'f', 'ធ': 'Shift + f',
    'ង': 'g', 'អ': 'Shift + g',
    'ហ': 'h', 'ះ': 'Shift + h',
    '្': 'j', 'ញ': 'Shift + j',
    'ក': 'k', 'គ': 'Shift + k',
    'ល': 'l', 'ឡ': 'Shift + l',
    'ើ': ';', '៖': 'Shift + ;',
    '់': "'", '៉': "Shift + '", // Escaped quote
    // Row 3
    'ឋ': 'z', 'ឍ': 'Shift + z',
    'ខ': 'x', 'ឃ': 'Shift + x',
    'ច': 'c', 'ជ': 'Shift + c',
    'វ': 'v', 'ៈ': 'Shift + v',
    'ប': 'b', 'ព': 'Shift + b',
    'ន': 'n', 'ណ': 'Shift + n',
    'ម': 'm', 'ំ': 'Shift + m',
    'ឦ': ',', 'ឱ': 'Shift + ,',
    '។': '.', '៕': 'Shift + .',
    '៊': '/', 'ឯ': 'Shift + /',
    // Space
    ' ': 'Space'
};

function getEnglishEquivalent(khmerChar) {
    return khmerToQwertyMap[khmerChar] || ''; // Return empty if not found
}

// Add this helper function to properly split Khmer text into words
function splitKhmerText(text) {
    // Split by spaces but preserve the spaces
    const parts = text.split(/(\s+)/);
    const words = [];
    
    for (let i = 0; i < parts.length; i++) {
        if (parts[i].trim()) { // If it's not just whitespace
            words.push(parts[i]);
        }
    }
    
    return words;
}

// Add function to generate initial word set
function generateWordSet() {
    console.log('Generating new word set...');
    const words = [];
    while (words.length < MAX_WORDS) {
        const newText = getRandomText();
        const newWords = splitKhmerText(newText);
        words.push(...newWords);
    }
    const finalWords = words.slice(0, MAX_WORDS);
    console.log('Generated', finalWords.length, 'new words:', finalWords.join(' '));
    return finalWords;
}

function initializeText() {
    console.log('Initializing text...');
    textToTypeElement.innerHTML = '';
    currentTextChars = [];
    completedWords = 0;
    currentWordIndex = 0;
    
    // Generate initial word set
    textWords = generateWordSet();
    currentText = textWords.join(' ');
    console.log('Initial text set up with', textWords.length, 'words');
    
    // Create initial spans
    currentText.split('').forEach((char) => {
        const charSpan = document.createElement('span');
        charSpan.innerText = char;
        textToTypeElement.appendChild(charSpan);
        currentTextChars.push(charSpan);
    });
    
    // Apply initial styling
    for (let i = 0; i < typedText.length && i < currentTextChars.length; i++) {
        if (typedText[i] === currentText[i]) {
            currentTextChars[i].classList.add('correct');
        } else {
            currentTextChars[i].classList.add('incorrect');
        }
    }
    
    // Highlight the current position
    if (typedText.length < currentTextChars.length) {
        currentTextChars[typedText.length].classList.add('current');
    }
}

function getRequiredKeysForChar(khmerChar) {
    const mapping = khmerToQwertyMap[khmerChar];
    if (!mapping) return [];
    
    // Split the mapping into individual keys
    return mapping.split(' + ').map(key => key.toLowerCase());
}

function highlightRequiredKeys(requiredKeys) {
    try {
        // Safety check - only proceed if we have keys to highlight and keyboard is visible
        if (!requiredKeys || requiredKeys.length === 0 || 
            virtualKeyboardContainer.classList.contains('hidden')) {
            return;
        }
        
        const keyElements = document.querySelectorAll('.keyboard-key');
        if (keyElements.length === 0) {
            return; // No keyboard keys found, exit gracefully
        }
        
        // Remove all highlights first
        keyElements.forEach(key => {
            key.classList.remove('required-key');
        });
    
        // Highlight the required keys
        requiredKeys.forEach(keyName => {
            keyName = keyName.toLowerCase();
            // Try to match by data-action (for special keys like shift, enter, etc.)
            let keyElement = document.querySelector(`.keyboard-key[data-action="${keyName}"]`);
            if (!keyElement) {
                // Try to match by English keystroke (normal or shifted)
                keyElement = Array.from(keyElements).find(el => {
                    return (
                        (el.dataset.englishNormal && el.dataset.englishNormal.toLowerCase() === keyName) ||
                        (el.dataset.englishShifted && el.dataset.englishShifted.toLowerCase() === keyName)
                    );
                });
            }
            if (keyElement) {
                keyElement.classList.add('required-key');
            }
        });
    } catch (e) {
        console.error('Error highlighting keys:', e);
    }
}

function updateDisplay() {
    errors = 0;
    let nextKhmerCharForDisplay = '';

    // Clear previous styling to avoid conflicts with initializeText
    currentTextChars.forEach((charSpan) => {
        charSpan.classList.remove('correct', 'incorrect', 'current');
    });

    currentTextChars.forEach((charSpan, index) => {
        if (index < typedText.length) {
            // This character has been typed or passed over
            const expectedChar = currentText[index];
            const typedChar = typedText[index];
            let expectedCharNeedsShift = false;
            if (typeof getRequiredKeysForChar === 'function') {
                expectedCharNeedsShift = getRequiredKeysForChar(expectedChar).includes('shift');
            }

            let matchedCorrectly = false;

            if (typedChar === expectedChar) {
                // Character values are identical (e.g. typed 'A' when 'A' was expected, or 'a' when 'a' was expected)
                // Now, was the shift key state correct for this identical match?
                if (expectedCharNeedsShift) {
                    // Expected 'A', typed 'A'. This is correct only if Shift was physically held.
                    // Expected '»', typed '»'. This is correct only if Shift was physically held.
                    matchedCorrectly = physicalShiftKeyDown;
                } else {
                    // Expected 'a', typed 'a'. This is correct only if Shift was NOT held.
                    matchedCorrectly = !physicalShiftKeyDown;
                }
            } else {
                // Character values are different (e.g. typed 'a' when 'A' was expected, or vice-versa).
                // This is always an error.
                matchedCorrectly = false;
            }

            if (matchedCorrectly) {
                charSpan.classList.add('correct');
            } else {
                charSpan.classList.add('incorrect');
                errors++;
            }
        } else if (index === typedText.length && typedText.length < currentText.length) {
            // This is the next character to be typed
            charSpan.classList.add('current');
            nextKhmerCharForDisplay = currentText[index];
        }
    });

    let requiredKeys = [];
    let newIsShiftActiveState;

    if (nextKhmerCharForDisplay) {
        requiredKeys = getRequiredKeysForChar(nextKhmerCharForDisplay);
        const nextCharDefinitelyRequiresShift = requiredKeys.includes('shift');

        let nextCharIsBaseUnshifted = false;
        if (!nextCharDefinitelyRequiresShift) {
            for (const row of khmerKeyboardLayout) {
                for (const key of row) {
                    if (key && key[0] && key[0] === nextKhmerCharForDisplay) {
                        nextCharIsBaseUnshifted = true;
                        break;
                    }
                }
                if (nextCharIsBaseUnshifted) break;
            }
        }

        if (nextCharDefinitelyRequiresShift) {
            newIsShiftActiveState = true;
        } else if (nextCharIsBaseUnshifted) {
            newIsShiftActiveState = false;
        } else {
            newIsShiftActiveState = physicalShiftKeyDown;
        }
    } else { // No next character (e.g., end of test)
        newIsShiftActiveState = physicalShiftKeyDown; // Keyboard reflects physical shift
        requiredKeys = []; // Ensure requiredKeys is empty if no next char
    }

    if (isShiftActive !== newIsShiftActiveState) {
        isShiftActive = newIsShiftActiveState;
        if (virtualKeyboardContainer && !virtualKeyboardContainer.classList.contains('hidden')) {
            renderVirtualKeyboard();
        }
    }

    if (nextKhmerCharForDisplay) {
        nextKeystrokeElement.textContent = nextKhmerCharForDisplay;
        nextKeystrokeElement.classList.add('visible');

        englishEquivalentElement.textContent = requiredKeys.join(' + ');
        englishEquivalentElement.classList.add('visible');

        if (typeof highlightRequiredKeys === 'function') {
            highlightRequiredKeys(requiredKeys);
        }

    } else { // No next character / end of test
        nextKeystrokeElement.classList.remove('visible');
        englishEquivalentElement.classList.remove('visible');
        document.querySelectorAll('.keyboard-key').forEach(key => {
            key.classList.remove('required-key');
        });
    }

    calculateAccuracy();
    scrollToCurrentChar();
}

function startTest() {
    if (testActive) return;
    testActive = true;
    isPaused = false;
    totalPausedTime = 0;
    startTime = Date.now();
    timeRemaining = selectedTestDuration;
    
    // Show timer display and hide results and footer
    timerDisplay.classList.remove('hidden');
    resultsDiv.classList.add('hidden');
    hideFooter();
    
    // Clear the input area
    inputAreaElement.value = '';
    inputAreaElement.focus();
    
    // Set initial timer display
    if (infiniteMode) {
        timerElement.innerText = '∞';
    } else {
        timerElement.innerText = timeRemaining;
    }
    
    // Reset WPM history when starting new test
    wpmHistory = [];
    
    // Only set the timer interval if not in infinite mode
    if (!infiniteMode) {
        timerInterval = setInterval(updateTimer, 1000);
    } else {
        // For infinite mode, just update WPM without changing the timer display
        timerInterval = setInterval(() => {
            if (!isPaused) { // Only update if not paused
                const elapsedTime = Math.floor((Date.now() - startTime - totalPausedTime) / 1000);
                if (wpmElement) calculateWPM(elapsedTime);
                if (wpmElement && wpmElement.innerText) {
                    wpmHistory.push({
                        time: elapsedTime,
                        wpm: parseInt(wpmElement.innerText)
                    });
                }
            }
        }, 1000);
    }
    
    // Make sure the nextKeystroke is shown
    if (nextKeystrokeElement) {
        nextKeystrokeElement.classList.add('visible');
    }
    
    // Show WPM and accuracy displays
    if (wpmDisplay) wpmDisplay.classList.remove('hidden');
    if (accuracyDisplay) accuracyDisplay.classList.remove('hidden');
}

function updateTimer() {
    if (isPaused) return; // Don't update timer if paused
    
    if (infiniteMode) {
        // In infinite mode, just show the infinity symbol
        timerElement.innerText = '∞';
        
        // Calculate WPM based on elapsed time
        const elapsedTime = Math.floor((Date.now() - startTime - totalPausedTime) / 1000);
        console.log('Infinite mode - elapsed time:', elapsedTime);
        const currentWPM = calculateWPM(elapsedTime);
        
        // Update speed data for infinite mode
        if (currentWPM > 0) {
            console.log('Adding WPM point to history:', { time: elapsedTime, wpm: currentWPM });
            wpmHistory.push({
                time: elapsedTime,
                wpm: currentWPM
            });
        }
        return;
    }
    
    if (timeRemaining <= 0) {
        console.log('Timer reached zero, calling endTest');
        clearInterval(timerInterval); // Clear the interval first
        endTest();
        return;
    }
    
    timeRemaining--;
    timerElement.innerText = timeRemaining;
    
    if (timeRemaining > 0) {
        // Calculate WPM based on elapsed time
        const elapsedTime = selectedTestDuration - timeRemaining;
        console.log('Timer mode - elapsed time:', elapsedTime);
        const currentWPM = calculateWPM(elapsedTime);
        
        // Update speed data
        if (currentWPM > 0) {
            console.log('Adding WPM point to history:', { time: elapsedTime, wpm: currentWPM });
            wpmHistory.push({
                time: elapsedTime,
                wpm: currentWPM
            });
        }
    }
}

function calculateWPM(timeElapsedSeconds) {
    console.log('calculateWPM called with timeElapsedSeconds:', timeElapsedSeconds);
    console.log('Current typedText length:', typedText.length);
    
    if (!wpmElement || timeElapsedSeconds === 0 || typedText.length === 0) {
        console.log('calculateWPM returning 0 due to:', {
            noWpmElement: !wpmElement,
            zeroTime: timeElapsedSeconds === 0,
            noTypedText: typedText.length === 0
        });
        if (wpmElement) wpmElement.innerText = "0";
        return 0;
    }

    // Count correct characters up to the first error
    let correctCharsForWPM = 0;
    for (let i = 0; i < typedText.length; i++) {
        if (i < currentText.length && typedText[i] === currentText[i]) {
            correctCharsForWPM++;
        } else {
            break;
        }
    }
    console.log('Correct characters for WPM:', correctCharsForWPM);

    // Calculate WPM: (correct characters / 5) / (minutes elapsed)
    const grossWPM = ((correctCharsForWPM / 5) / (timeElapsedSeconds / 60));
    const roundedWPM = Math.round(grossWPM > 0 ? grossWPM : 0);
    console.log('Calculated WPM:', roundedWPM, '(gross:', grossWPM, ')');
    wpmElement.innerText = roundedWPM;
    return roundedWPM;
}

function calculateAccuracy() {
    if (!accuracyElement) {
        // console.log('accuracyElement is null in calculateAccuracy, returning.');
        return;
    }
    if (typedText.length === 0) {
        accuracyElement.innerText = 0;
        return;
    }
    const correctChars = typedText.length - errors;
    const accuracy = Math.round((correctChars / typedText.length) * 100);
    accuracyElement.innerText = accuracy >= 0 ? accuracy : 0;
}

function handleInput() {
    // If test is not active and results are visible, ignore input
    if (!testActive && !resultsDiv.classList.contains('hidden')) {
        // Optionally, clear the input area so stray keystrokes don't accumulate
        inputAreaElement.value = '';
        return;
    }
    // Unhide WPM and accuracy displays if hidden (in case of restart)
    if (wpmDisplay) wpmDisplay.classList.remove('hidden');
    if (accuracyDisplay) accuracyDisplay.classList.remove('hidden');
    // Hide tip when user starts typing
    hideTips();
    // Update typed text and display
    typedText = inputAreaElement.value;
    updateDisplay();
    updateTextWords();
    if (typedText.length === currentText.length && testActive && currentText.length > 0) {
        let allCorrect = true;
        for (let i = 0; i < currentText.length; i++) {
            if (typedText[i] !== currentText[i]) {
                allCorrect = false;
                break;
            }
        }
        if (allCorrect) {
            endTest();
        }
    }
}

// Function to count words in a string
function countWords(text) {
    // In Khmer, we'll count sequences separated by spaces as words
    return text.trim().split(/\s+/).length;
}

// Function to append more text
function appendMoreText() {
    // Get some additional text
    const additionalText = getRandomText();
    
    // Only keep the correctly typed part of the text
    let correctTextSoFar = '';
    for (let i = 0; i < typedText.length; i++) {
        if (typedText[i] === currentText[i]) {
            correctTextSoFar += typedText[i];
        } else {
            break; // Stop at first error
        }
    }
    
    // Set the current text to be the correctly typed text plus new text
    currentText = correctTextSoFar + additionalText;
    
    // Reinitialize the display with the new text, preserving the typed part
    initializeText();
    
    // Keep the input focused
    inputAreaElement.focus();
}

function drawSpeedGraph() {
    const ctx = graphContext;
    const dpr = window.devicePixelRatio || 1;
    const displayWidth = speedGraph.parentElement.clientWidth;
    const displayHeight = speedGraph.parentElement.clientHeight;
    speedGraph.width = displayWidth * dpr;
    speedGraph.height = displayHeight * dpr;
    speedGraph.style.width = displayWidth + 'px';
    speedGraph.style.height = displayHeight + 'px';
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.scale(dpr, dpr);
    const width = displayWidth;
    const height = displayHeight;
    const padding = { top: 56, right: 36, bottom: 40, left: 80 };
    ctx.clearRect(0, 0, width, height);

    // If no WPM history, create a single point at 0 for the full duration
    if (!wpmHistory || wpmHistory.length === 0) {
        wpmHistory = [{
            time: selectedTestDuration,
            wpm: 0
        }];
    }

    // Build a full array of WPM values for every second from 0 to last time
    const lastTime = wpmHistory[wpmHistory.length - 1]?.time ?? selectedTestDuration;
    const wpmBySecond = Array(lastTime + 1).fill(0);
    wpmHistory.forEach(point => {
        if (typeof point.time === 'number') wpmBySecond[point.time] = point.wpm;
    });
    // Fill in missing seconds with previous value (step graph), or keep at 0
    for (let i = 1; i < wpmBySecond.length; i++) {
        if (wpmBySecond[i] === 0) wpmBySecond[i] = wpmBySecond[i - 1];
    }
    const plotWidth = width - padding.left - padding.right;
    const plotHeight = height - padding.top - padding.bottom;
    const maxWPM = Math.max(...wpmBySecond) * 1.15 || 10;
    const minWPM = 0;
    const minTime = 0;
    const maxTime = lastTime;
    const xStep = plotWidth / (maxTime - minTime || 1);
    const yScale = plotHeight / (maxWPM - minWPM);
    // Draw grid lines and Y axis labels
    ctx.save();
    ctx.strokeStyle = 'rgba(255,214,0,0.18)';
    ctx.lineWidth = 1.5;
    ctx.font = '20px var(--font-stats)';
    ctx.fillStyle = 'rgba(255,214,0,0.85)';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    const yTicks = 5;
    for (let i = 0; i <= yTicks; i++) {
        const wpmVal = minWPM + ((maxWPM - minWPM) * (i / yTicks));
        const y = height - padding.bottom - (wpmVal - minWPM) * yScale;
        ctx.beginPath();
        ctx.moveTo(padding.left, y);
        ctx.lineTo(width - padding.right, y);
        ctx.stroke();
        ctx.fillText(Math.round(wpmVal), padding.left - 16, y);
    }
    // Draw X axis labels (time)
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    const xTicks = Math.min(6, wpmBySecond.length - 1);
    for (let i = 0; i <= xTicks; i++) {
        const timeVal = minTime + ((maxTime - minTime) * (i / xTicks));
        const x = padding.left + (timeVal - minTime) * xStep;
        ctx.beginPath();
        ctx.moveTo(x, height - padding.bottom);
        ctx.lineTo(x, height - padding.bottom + 8);
        ctx.stroke();
        ctx.fillText(Math.round(timeVal), x, height - padding.bottom + 12);
    }
    ctx.restore();
    // Draw the graph line
    ctx.save();
    ctx.beginPath();
    for (let i = 0; i < wpmBySecond.length; i++) {
        const x = padding.left + (i - minTime) * xStep;
        const y = height - padding.bottom - (wpmBySecond[i] - minWPM) * yScale;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
    }
    ctx.strokeStyle = '#ffd600';
    ctx.lineWidth = 3.5;
    ctx.shadowColor = '#ffd600';
    ctx.shadowBlur = 8;
    ctx.stroke();
    ctx.shadowBlur = 0;
    ctx.lineTo(padding.left + (wpmBySecond.length - 1) * xStep, height - padding.bottom);
    ctx.lineTo(padding.left, height - padding.bottom);
    ctx.closePath();
    const gradient = ctx.createLinearGradient(0, padding.top, 0, height - padding.bottom);
    gradient.addColorStop(0, 'rgba(255,214,0,0.18)');
    gradient.addColorStop(1, 'rgba(255,214,0,0.04)');
    ctx.fillStyle = gradient;
    ctx.globalAlpha = 0.7;
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.restore();
}

function endTest() {
    console.log('endTest called, testActive:', testActive);
    if (!testActive) {
        console.log('endTest returning early because test is not active');
        return;
    }
    testActive = false;
    
    // Hide timer display
    timerDisplay.classList.add('hidden');
    console.log('Timer display hidden');
    
    // Calculate final stats
    console.log('WPM History at end:', wpmHistory);
    const avgWpm = Math.round(wpmHistory.reduce((sum, point) => sum + point.wpm, 0) / wpmHistory.length) || 0;
    const peakWpm = Math.max(...wpmHistory.map(point => point.wpm), 0);
    
    console.log('Calculated stats - avgWpm:', avgWpm, 'peakWpm:', peakWpm);
    
    // Safely update stats only if elements exist
    if (avgWpmElement) avgWpmElement.innerText = avgWpm;
    if (peakWpmElement) peakWpmElement.innerText = peakWpm;
    if (finalAccuracyElement) finalAccuracyElement.innerText = accuracyElement ? accuracyElement.innerText : '0';
    
    // Hide keyboard and tip
    hideKeyboard();
    hideTips();
    
    // Show results
    console.log('About to show results, current hidden state:', resultsDiv.classList.contains('hidden'));
    if (resultsDiv) {
        resultsDiv.classList.remove('hidden');
        // Hide WPM and accuracy displays
        if (wpmDisplay) wpmDisplay.classList.add('hidden');
        if (accuracyDisplay) accuracyDisplay.classList.add('hidden');
    }
    // Hide WPM/accuracy displays in infinite mode when results are shown
    if (infiniteMode) {
        if (wpmDisplay) wpmDisplay.classList.add('hidden');
        if (accuracyDisplay) accuracyDisplay.classList.add('hidden');
    }

    // Always draw the graph, even if no typing occurred
    // If no typing occurred, wpmHistory will be empty and drawSpeedGraph will show a flat line at 0
    drawSpeedGraph();

    // Clear any existing tip timeout to prevent tips from showing up
    if (tipTimeout) {
        clearTimeout(tipTimeout);
        tipTimeout = null;
    }

    // Hide footer when showing results
    hideFooter();
}

function resetTest() {
    clearInterval(timerInterval);
    testActive = false;
    
    timeRemaining = selectedTestDuration;
    
    // Show timer display and hide results
    timerDisplay.classList.remove('hidden');
    resultsDiv.classList.add('hidden');
    
    if (infiniteMode) {
        timerElement.innerText = '∞';
    } else {
        timerElement.innerText = selectedTestDuration;
    }
    
    if (timerToggleButtons) {
        timerToggleButtons.forEach(btn => {
            const btnTime = parseInt(btn.getAttribute('data-time'));
            const isThisButtonSelected = infiniteMode ? (btnTime === 0) : (btnTime === selectedTestDuration);
            btn.classList.toggle('selected', isThisButtonSelected);
        });
    }
    
    // Reset text words and generate new text
    textWords = [];
    currentWordIndex = 0;
    typedText = "";
    inputAreaElement.value = "";
    wpmHistory = [];
    initializeText();
    
    // Reset keyboard and tip visibility
    if (!virtualKeyboardContainer.classList.contains('hidden')) {
        renderVirtualKeyboard();
    }
    
    updateDisplay();
    if (wpmElement) wpmElement.innerText = "0";
    if (accuracyElement) accuracyElement.innerText = "0";
    if (peakWpmElement) peakWpmElement.innerText = "0";
    errors = 0;
    
    // Show WPM and accuracy displays (unless infinite mode and results are showing)
    if (!infiniteMode || resultsDiv.classList.contains('hidden')) {
        if (wpmDisplay) wpmDisplay.classList.remove('hidden');
        if (accuracyDisplay) accuracyDisplay.classList.remove('hidden');
    }

    // Show footer if keyboard is hidden and results are hidden
    if (virtualKeyboardContainer.classList.contains('hidden') && 
        resultsDiv.classList.contains('hidden')) {
        showFooter();
    }

    inputAreaElement.focus();
}

function renderVirtualKeyboard() {
    if (!virtualKeyboardContainer) return;
    virtualKeyboardContainer.innerHTML = '';

    khmerKeyboardLayout.forEach(row => {
        const rowDiv = document.createElement('div');
        rowDiv.className = 'keyboard-row';
        row.forEach(keyData => {
            const keyButton = document.createElement('button');
            keyButton.className = 'keyboard-key';
            if (keyData[4]) keyButton.classList.add(...keyData[4].split(' '));

            // Only treat as special key if keyData[4] contains 'special-key'
            const isSpecialKey = keyData[4] && keyData[4].includes('special-key');

            if (isSpecialKey) {
                // Special keys: show label only
                const displayLabel = keyData[3] || keyData[2];
                keyButton.dataset.action = keyData[2];
                keyButton.textContent = displayLabel;
                if (keyData[2] === 'shift') {
                    keyButton.classList.toggle('active', isShiftActive);
                }
            } else {
                // Normal keys: show both Khmer and English
                const khmerChar = isShiftActive ? keyData[1] : keyData[0];
                const englishChar = isShiftActive ? keyData[3] : keyData[2];

                const khmerSpan = document.createElement('span');
                khmerSpan.className = 'khmer-char';
                khmerSpan.textContent = khmerChar;

                const englishSpan = document.createElement('span');
                englishSpan.className = 'english-char';
                englishSpan.textContent = englishChar;

                keyButton.appendChild(khmerSpan);
                keyButton.appendChild(englishSpan);

                keyButton.dataset.charNormal = keyData[0];
                keyButton.dataset.charShifted = keyData[1];
                keyButton.dataset.englishNormal = keyData[2];
                keyButton.dataset.englishShifted = keyData[3];
            }
            rowDiv.appendChild(keyButton);
        });
        virtualKeyboardContainer.appendChild(rowDiv);
    });
}

// Initialize the text when the script loads
currentText = getRandomText();
initializeText();

// Make timer display always visible
timerDisplay.classList.remove('hidden');

// Render the keyboard immediately but keep it hidden
renderVirtualKeyboard();

// Function to show keyboard (separate from toggle)
function showKeyboard() {
    virtualKeyboardContainer.classList.remove('hidden');
    renderVirtualKeyboard();
    hideTips();
    hideFooter(); // Hide footer when keyboard is shown
    setTimeout(() => {
        updateDisplay();
        inputAreaElement.focus();
    }, 50);
}

// Function to hide keyboard
function hideKeyboard() {
    virtualKeyboardContainer.classList.add('hidden');
    showTips();
    showFooter(); // Show footer when keyboard is hidden
}

// Function to toggle keyboard
function toggleKeyboard() {
    if (virtualKeyboardContainer.classList.contains('hidden')) {
        showKeyboard();
    } else {
        hideKeyboard();
    }
}

// Add event listeners
inputAreaElement.addEventListener('input', handleInput);
resetButton.addEventListener('click', resetTest);
textToTypeContainer.addEventListener('click', () => inputAreaElement.focus());
textToTypeContainer.addEventListener('focus', () => inputAreaElement.focus());

if (toggleKeyboardButton) {
    toggleKeyboardButton.addEventListener('click', toggleKeyboard);
}

// Track if a keydown event was a shortcut (global, used by startTest condition)
let isShortcutKey = false;

// Consolidated keydown listener
document.addEventListener('keydown', (e) => {
    // Reset global isShortcutKey at the beginning of handling relevant keys
    isShortcutKey = false;

    // Handle Command key combinations (for Mac)
    if (e.metaKey && !e.altKey && !e.ctrlKey) {
        const keyLower = e.key.toLowerCase();
        
        // Prevent default browser behavior for our Command shortcuts
        if (['k', ',', '.', 'i'].includes(keyLower)) {
            e.preventDefault();
            isShortcutKey = true;
            
            switch (keyLower) {
                case 'k': // Command + K for keyboard toggle
                    toggleKeyboard();
                    break;
                case ',': // Command + , for pause
                    togglePause();
                    break;
                case '.': // Command + . for reset
                    resetTest();
                    break;
                case 'i': // Command + I for show tips
                    showTips();
                    break;
            }
            return;
        }
    }

    // Handle Shift key
    if (e.key === 'Shift' && !e.repeat) {
        physicalShiftKeyDown = true;
        updateDisplay();
        return;
    }

    // Prevent starting a new test by typing if results are visible
    if (!testActive && !isShortcutKey && !e.metaKey && !e.ctrlKey && !e.altKey && !resultsDiv.classList.contains('hidden')) {
        return;
    }

    // Start test if applicable
    if (!testActive && !isShortcutKey && !e.metaKey && !e.ctrlKey && !e.altKey) {
        // Filter out non-typable/non-starting keys
        const nonStartingKeys = [
            'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 
            'Home', 'End', 'PageUp', 'PageDown', 
            'F1', 'F2', 'F3', 'F4', 'F5', 'F6', 'F7', 'F8', 'F9', 'F10', 'F11', 'F12',
            'ScrollLock', 'Pause', 'Insert', 'NumLock', 'CapsLock', 'Escape',
            'AudioVolumeUp', 'AudioVolumeDown', 'AudioVolumeMute',
            'Control', 'Alt', 'Meta'
        ];
        if (!nonStartingKeys.includes(e.key)) {
            startTest();
        }
    }
});

// The existing keyup listener for Shift is fine:
document.addEventListener('keyup', (e) => {
    if (e.key === 'Shift') {
        physicalShiftKeyDown = false;
        updateDisplay(); // This will re-evaluate isShiftActive and update keyboard & highlights
    }
});

document.addEventListener('DOMContentLoaded', () => {
    // Get timer toggle buttons after DOM is ready
    timerToggleButtons = document.querySelectorAll('.timer-toggle-option');
    // console.log('Found timer toggle buttons:', timerToggleButtons.length);
    
    // Set initial selectedTestDuration from the button that has 'selected' in HTML, or default
    const initialSelectedButton = document.querySelector('.timer-toggle-option.selected');
    if (initialSelectedButton) {
        selectedTestDuration = parseInt(initialSelectedButton.getAttribute('data-time'));
    } else {
        selectedTestDuration = 30; // Default time if somehow no button is selected in HTML
    }
    infiniteMode = (selectedTestDuration === 0);
    timeRemaining = selectedTestDuration; // Initialize timeRemaining for the first display/test

    // Initialize the test (this will also sync UI via new resetTest logic)
    resetTest();
    
    // Ensure the keyboard is correctly initialized but stays hidden
    if (virtualKeyboardContainer) {
        // Make sure it's hidden initially
        virtualKeyboardContainer.classList.add('hidden');
        // Pre-render it to ensure it's ready when needed
        renderVirtualKeyboard();
        // Initial key highlighting won't be visible, but it'll be ready
        updateDisplay();
    }
    
    // Add event listeners for timer toggle buttons
    timerToggleButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            
            const timeValue = parseInt(this.getAttribute('data-time'));
            selectedTestDuration = timeValue;
            infiniteMode = (selectedTestDuration === 0);
            timeRemaining = selectedTestDuration;

            // Update timer display based on selectedTestDuration
            if (infiniteMode) {
                timerElement.innerText = '∞';
            } else {
                timerElement.innerText = selectedTestDuration;
            }

            // Update selected class on buttons
            timerToggleButtons.forEach(btn => {
                const btnTime = parseInt(btn.getAttribute('data-time'));
                btn.classList.toggle('selected', btnTime === selectedTestDuration);
            });
            
            // If test is active, unpause it and reset
            if (testActive) {
                // Unpause if currently paused
                if (isPaused) {
                    isPaused = false;
                    inputAreaElement.readOnly = false;
                    timerElement.style.opacity = '1';
                    if (infiniteMode) {
                        if (resultsDiv) resultsDiv.classList.add('hidden');
                    }
                }
                resetTest();
            }
            
            inputAreaElement.focus();
        });
    });

    // Show tips initially and set timeout to hide them
    showTips();

    // Only show tips on mouse movement if keyboard is hidden and test is not active and results are hidden
    document.addEventListener('mousemove', (e) => {
        if (virtualKeyboardContainer.classList.contains('hidden') && 
            !testActive && 
            resultsDiv.classList.contains('hidden')) {
            showTips();
        }
    });

    // Only show tips on keydown if keyboard is hidden and test is not active and results are hidden
    document.addEventListener('keydown', (e) => {
        // Don't show tips for modifier keys or when test is active
        if (e.key === 'Meta' || e.key === 'Control' || e.key === 'Alt' || 
            e.key === 'Shift' || e.key === 'Tab' || testActive) {
            return;
        }
        
        if (virtualKeyboardContainer.classList.contains('hidden') && 
            resultsDiv.classList.contains('hidden')) {
            showTips();
        }
    });

    // Hide tips when window loses focus
    window.addEventListener('blur', hideTips);
    
    // Hide tips when test starts
    inputAreaElement.addEventListener('focus', () => {
        if (testActive) {
            hideTips();
        }
    });

    // Show footer initially if keyboard and results are hidden
    if (virtualKeyboardContainer.classList.contains('hidden') && 
        resultsDiv.classList.contains('hidden')) {
        showFooter();
    }
});

// Replace the updateTextWords function to remove word dropping behavior
function updateTextWords() {
    // Calculate how many characters are left to type
    const charsRemaining = currentText.length - typedText.length;
    // If less than a threshold (e.g., 30 chars), generate more words
    if (charsRemaining < 30) {
        console.log('Need more words! Chars remaining:', charsRemaining);
        const newWords = generateWordSet();
        textWords.push(...newWords);
        currentText = textWords.join(' ');
        console.log('Added new words. New total:', textWords.length);
        
        // Add new spans for the new text
        const oldLength = currentTextChars.length;
        const newLength = currentText.length;
        
        // Add new spans if needed
        if (newLength > oldLength) {
            for (let i = oldLength; i < newLength; i++) {
                const charSpan = document.createElement('span');
                charSpan.innerText = currentText[i];
                textToTypeElement.appendChild(charSpan);
                currentTextChars.push(charSpan);
            }
        }
    }
    
    // Update styling for all characters
    for (let i = 0; i < currentTextChars.length; i++) {
        currentTextChars[i].className = ''; // Clear classes
        if (i < typedText.length) {
            if (typedText[i] === currentText[i]) {
                currentTextChars[i].classList.add('correct');
            } else {
                currentTextChars[i].classList.add('incorrect');
            }
        } else if (i === typedText.length) {
            currentTextChars[i].classList.add('current');
        }
    }
}

function scrollToCurrentChar() {
    const container = document.getElementById('text-to-type-container');
    const current = document.querySelector('#text-to-type .current');
    if (container && current) {
        // Scroll so the current character is at the top of the container (with a small offset)
        const containerTop = container.getBoundingClientRect().top;
        const currentTop = current.getBoundingClientRect().top;
        const scrollOffset = currentTop - containerTop + container.scrollTop - 16; // 16px offset for padding
        container.scrollTo({ top: scrollOffset, behavior: 'smooth' });
    }
}

function togglePause() {
    if (!testActive) return;
    
    isPaused = !isPaused;
    if (isPaused) {
        inputAreaElement.readOnly = true; // Prevent typing input when paused
        pauseStartTime = Date.now();
        timerElement.style.opacity = '0.5'; // Visual feedback that timer is paused
        
        // For infinite mode, show results when paused
        if (infiniteMode && wpmHistory.length > 0) { // Only show if we have data
            // Calculate stats
            const avgWpm = Math.round(wpmHistory.reduce((sum, point) => sum + point.wpm, 0) / wpmHistory.length) || 0;
            const peakWpm = Math.max(...wpmHistory.map(point => point.wpm), 0);
            
            if (avgWpmElement) avgWpmElement.innerText = avgWpm;
            if (peakWpmElement) peakWpmElement.innerText = peakWpm;
            if (finalAccuracyElement && accuracyElement) finalAccuracyElement.innerText = accuracyElement.innerText;
            
            // Hide keyboard and tip
            hideKeyboard();
            hideTips();
            
            // Show results
            if(resultsDiv) resultsDiv.classList.remove('hidden');
            drawSpeedGraph();
        }
    } else { // Unpausing
        inputAreaElement.readOnly = false; // Allow typing input again
        totalPausedTime += Date.now() - pauseStartTime;
        timerElement.style.opacity = '1';
        
        // For infinite mode, hide results when unpaused
        if (infiniteMode) {
           if(resultsDiv) resultsDiv.classList.add('hidden');
        }
        inputAreaElement.focus(); // Ensure textarea is focused for typing
    }
}

function hideTips() {
    const tipElement = document.querySelector('.tip');
    if (tipElement) {
        tipElement.classList.add('hidden');
    }
}

function showTips() {
    const tipElement = document.querySelector('.tip');
    if (tipElement) {
        tipElement.classList.remove('hidden');
        // Clear any existing timeout
        if (tipTimeout) {
            clearTimeout(tipTimeout);
        }
        // Set new timeout to hide tips
        tipTimeout = setTimeout(hideTips, TIP_HIDE_DELAY);
    }
}

function showFooter() {
    if (footerElement) {
        footerElement.classList.remove('hidden');
    }
}

function hideFooter() {
    if (footerElement) {
        footerElement.classList.add('hidden');
    }
}