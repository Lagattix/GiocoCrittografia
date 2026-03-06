// =====================================================
// IL CODICE DI CESARE - Gioco a Livelli
// =====================================================

// --- Cifrario di Cesare ---
function caesarEncrypt(text, shift) {
    shift = ((shift % 26) + 26) % 26;
    return text.toUpperCase().split('').map(char => {
        if (char >= 'A' && char <= 'Z') {
            return String.fromCharCode(((char.charCodeAt(0) - 65 + shift) % 26) + 65);
        }
        return char;
    }).join('');
}
function caesarDecrypt(text, shift) {
    return caesarEncrypt(text, 26 - (((shift % 26) + 26) % 26));
}

// --- Livelli ---
// Calcoli verificati:
// Lv1: decrypt FLDR -3 → F(5)-3=2=C, L(11)-3=8=I, D(3)-3=0=A, R(17)-3=14=O → CIAO ✓
// Lv2: encrypt ROMA +4 → R(17)+4=21=V, O(14)+4=18=S, M(12)+4=16=Q, A(0)+4=4=E → VSQE ✓
// Lv3: decrypt NHSSV -7 → N(13)-7=6=G, H(7)-7=0=A, S(18)-7=11=L, S(18)-7=11=L, V(21)-7=14=O → GALLO ✓
// Lv4: encrypt SENATO +5 → S(18)+5=23=X, E(4)+5=9=J, N(13)+5=18=S, A(0)+5=5=F, T(19)+5=24=Y, O(14)+5=19=T → XJSFYT ✓
const LEVELS = [
    {
        id: 1,
        title: "Il Messaggero di Cesare",
        description: "L'anno è il 50 a.C. Sei un giovane soldato nell'esercito di Giulio Cesare. Un messaggero ti consegna un dispaccio urgente, ma è scritto in codice! Cesare stesso ti spiega passo per passo come decifrarlo.",
        mode: "guided_decrypt",
        word: "FLDR",
        shift: 3,
        answer: "CIAO",
        guide: [
            "📜 Cesare ti spiega: «Il mio cifrario sposta ogni lettera di N posizioni in avanti nell'alfabeto. Per decifrare, fai il contrario: sposta indietro!»",
            "🔑 Con chiave 3: sposta ogni lettera di 3 posizioni INDIETRO. F→C, L→I, D→A, R→O.",
            "✍️ Prima lettera: F è la 6ª. 6 - 3 = 3ª lettera = C. Seconda: L è la 12ª. 12 - 3 = 9ª = I.",
            "✍️ Terza: D è la 4ª. 4 - 3 = 1ª = A. Ultima: R è la 18ª. 18 - 3 = 15ª = O. Metti tutto insieme e scrivi!"
        ]
    },
    {
        id: 2,
        title: "Missione al Senato",
        description: "Bene! Cesare ha bisogno che tu cifri un messaggio urgente per il Senato. Usa la chiave +4 per rendere la parola ROMA illeggibile ai nemici!",
        mode: "guided_encrypt",
        word: "ROMA",
        shift: 4,
        answer: "VSQE",
        guide: [
            "📜 Per CIFRARE devi spostare ogni lettera di 4 posizioni IN AVANTI nell'alfabeto.",
            "🔑 R è la 18ª lettera. 18 + 4 = 22ª = V. Prima lettera cifrata: V.",
            "✍️ O è la 15ª. 15 + 4 = 19ª = S. M è la 13ª. 13 + 4 = 17ª = Q.",
            "✍️ Ultima: A è la 1ª. 1 + 4 = 5ª = E. Unisci le lettere: V-S-Q-E e scrivi la risposta!"
        ]
    },
    {
        id: 3,
        title: "Il Messaggio delle Spie",
        description: "Sei diventato esperto! Le spie galliche hanno intercettato un messaggio. Devi decifrarlo DA SOLO — nessuna guida questa volta. Chiave: 7.",
        mode: "free_decrypt",
        word: "NHSSV",
        shift: 7,
        answer: "GALLO",
        guide: []
    },
    {
        id: 4,
        title: "Il Codice Finale",
        description: "La battaglia finale si avvicina! Cifra il bersaglio strategico usando la chiave +5. Il destino di Roma è nelle tue mani. Nessuno ti aiuterà!",
        mode: "free_encrypt",
        word: "SENATO",
        shift: 5,
        answer: "XJSFYT",
        guide: []
    }
];

// --- Stato globale ---
let currentLevelIndex = 0;
let guideStep = 0;
let guideFinished = false;

// Stato griglia Wordle
let wordleLetters = [];   // Array di lettere inserite
let activeCell = 0;       // Indice del box attivo
let wordleLength = 4;     // Numero di celle (= lunghezza risposta)

// --- DOM ---
const levelTitle = document.getElementById('level-title');
const levelDescription = document.getElementById('level-description');
const guidePanel = document.getElementById('guide-panel');
const guideText = document.getElementById('guide-text');
const targetWordEl = document.getElementById('target-word');
const shiftContainer = document.getElementById('shift-container');
const shiftValueEl = document.getElementById('shift-value');
const feedbackMsg = document.getElementById('feedback-msg');
const currentLevelEl = document.getElementById('current-level');
const totalLevelsEl = document.getElementById('total-levels');
const gameBoard = document.getElementById('game-board');
const victoryScreen = document.getElementById('victory-screen');
const finalScreen = document.getElementById('final-screen');
const victoryTitle = document.getElementById('victory-title');
const victoryMessage = document.getElementById('victory-message');
const nextLevelBtn = document.getElementById('next-level-btn');
const restartBtn = document.getElementById('restart-btn');
const checkBtn = document.getElementById('check-btn');
const wordleGrid = document.getElementById('wordle-grid');
const inputLabel = document.getElementById('input-label');
const inputSection = document.getElementById('input-section');

// Pulsante guida (creato dinamicamente)
const nextHintBtn = document.createElement('button');
nextHintBtn.id = 'next-hint-btn';
nextHintBtn.className = 'hint-btn';
nextHintBtn.textContent = '👁️ Prossimo Suggerimento';

totalLevelsEl.textContent = LEVELS.length;

// =====================================================
// WORDLE GRID — Costruzione e gestione
// =====================================================

function buildWordleGrid(length) {
    wordleGrid.innerHTML = '';
    wordleLetters = new Array(length).fill('');
    wordleLength = length;
    activeCell = 0;

    for (let i = 0; i < length; i++) {
        const cell = document.createElement('div');
        cell.className = 'wordle-cell' + (i === 0 ? ' active' : '');
        cell.dataset.index = i;
        cell.addEventListener('click', () => focusCell(i));
        wordleGrid.appendChild(cell);
    }
    wordleGrid.focus();
}

function buildKeyboard() {
    // Rimuovi tastiera precedente se esiste
    const old = document.getElementById('roman-keyboard');
    if (old) old.remove();

    const rows = [
        ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
        ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
        ['⌫', 'Z', 'X', 'C', 'V', 'B', 'N', 'M', '✓']
    ];

    const kb = document.createElement('div');
    kb.id = 'roman-keyboard';
    kb.className = 'roman-keyboard';

    rows.forEach(row => {
        const rowEl = document.createElement('div');
        rowEl.className = 'roman-keyboard-row';
        row.forEach(key => {
            const btn = document.createElement('button');
            btn.className = 'roman-key' + (key === '⌫' || key === '✓' ? ' key-wide' : '');
            btn.textContent = key;
            btn.addEventListener('click', () => handleKeyPress(key));
            rowEl.appendChild(btn);
        });
        kb.appendChild(rowEl);
    });

    inputSection.appendChild(kb);
}

function focusCell(index) {
    activeCell = index;
    refreshCells();
    wordleGrid.focus();
}

function refreshCells() {
    const cells = wordleGrid.querySelectorAll('.wordle-cell');
    cells.forEach((cell, i) => {
        // Mantieni solo classe base + stati speciali (no active/filled se error/success applicati)
        const hasSpecial = cell.classList.contains('error') || cell.classList.contains('success');
        if (!hasSpecial) {
            cell.className = 'wordle-cell';
            if (wordleLetters[i]) cell.classList.add('filled');
            if (i === activeCell) cell.classList.add('active');
            cell.textContent = wordleLetters[i];
        }
    });
}

function handleKeyPress(key) {
    if (key === '⌫') {
        // Backspace
        if (wordleLetters[activeCell]) {
            wordleLetters[activeCell] = '';
            refreshCells();
        } else if (activeCell > 0) {
            activeCell--;
            wordleLetters[activeCell] = '';
            refreshCells();
        }
    } else if (key === '✓') {
        checkAnswer();
    } else if (/^[A-Z]$/.test(key)) {
        wordleLetters[activeCell] = key;
        refreshCells();
        if (activeCell < wordleLength - 1) {
            activeCell++;
            refreshCells();
        }
    }
}

// Tastiera fisica
document.addEventListener('keydown', (e) => {
    // Ignora se lo schermo di vittoria è attivo
    if (!victoryScreen.classList.contains('hidden') || !finalScreen.classList.contains('hidden')) return;
    if (gameBoard.style.display === 'none') return;

    if (e.key === 'Backspace') {
        e.preventDefault();
        handleKeyPress('⌫');
    } else if (e.key === 'Enter') {
        handleKeyPress('✓');
    } else {
        const letter = e.key.toUpperCase();
        if (/^[A-Z]$/.test(letter)) handleKeyPress(letter);
    }
});

// =====================================================
// CARICAMENTO LIVELLO
// =====================================================

function loadLevel(index) {
    const level = LEVELS[index];
    guideStep = 0;
    guideFinished = (level.guide.length === 0);

    currentLevelEl.textContent = index + 1;
    levelTitle.textContent = level.title;
    levelDescription.textContent = level.description;
    targetWordEl.textContent = level.word;

    const isEncrypt = level.mode.includes('encrypt');
    shiftValueEl.textContent = (isEncrypt ? '+' : '-') + level.shift;
    shiftContainer.querySelector('.label').textContent = isEncrypt
        ? 'Chiave (cifra avanti):'
        : 'Chiave (decifra indietro):';

    inputLabel.textContent = isEncrypt
        ? '✍️ Inserisci il testo CIFRATO:'
        : '🔓 Inserisci il testo DECIFRATO:';

    // Griglia Wordle
    buildWordleGrid(level.answer.length);
    buildKeyboard();

    // Guida
    if (level.guide.length > 0) {
        guidePanel.classList.remove('hidden');
        guideText.textContent = level.guide[0];
        guideStep = 1;
        if (!guidePanel.contains(nextHintBtn)) guidePanel.appendChild(nextHintBtn);
        nextHintBtn.classList.remove('hidden');
        nextHintBtn.textContent = '👁️ Prossimo Suggerimento';
        nextHintBtn.disabled = false;
    } else {
        guidePanel.classList.add('hidden');
    }

    feedbackMsg.textContent = '';
    feedbackMsg.className = 'feedback-msg';

    victoryScreen.classList.add('hidden');
    finalScreen.classList.add('hidden');
    gameBoard.style.display = '';
    gameBoard.style.opacity = '0';
    gameBoard.style.transform = 'translateY(20px)';

    requestAnimationFrame(() => {
        gameBoard.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
        gameBoard.style.opacity = '1';
        gameBoard.style.transform = 'translateY(0)';
    });

    wordleGrid.focus();
}

// --- Navigazione guida ---
nextHintBtn.addEventListener('click', () => {
    const level = LEVELS[currentLevelIndex];
    if (guideStep < level.guide.length) {
        guideText.textContent = level.guide[guideStep];
        guideStep++;
        if (guideStep >= level.guide.length) {
            guideFinished = true;
            nextHintBtn.textContent = '✅ Guida completata!';
            nextHintBtn.disabled = true;
        }
    }
});

// =====================================================
// VERIFICA RISPOSTA
// =====================================================

checkBtn.addEventListener('click', checkAnswer);

function checkAnswer() {
    const level = LEVELS[currentLevelIndex];
    const userAnswer = wordleLetters.join('').toUpperCase();
    const correctAnswer = level.answer.toUpperCase();

    // Controlla celle vuote
    if (wordleLetters.some(l => !l)) {
        showFeedback('⚠️ Riempi tutte le caselle prima di verificare!', 'error');
        flashEmptyCells();
        return;
    }

    // Per livelli guidati: obbliga a leggere tutta la guida
    if (level.guide.length > 0 && !guideFinished) {
        showFeedback('💡 Leggi prima tutti i suggerimenti della guida!', 'error');
        nextHintBtn.classList.add('pulse-hint');
        setTimeout(() => nextHintBtn.classList.remove('pulse-hint'), 1000);
        return;
    }

    if (userAnswer === correctAnswer) {
        handleCorrectAnswer(level);
    } else {
        showFeedback(`❌ Non corretto! La risposta ha ${correctAnswer.length} lettere. Riprova!`, 'error');
        animateCellsError();
    }
}

function flashEmptyCells() {
    const cells = wordleGrid.querySelectorAll('.wordle-cell');
    cells.forEach((cell, i) => {
        if (!wordleLetters[i]) {
            cell.classList.add('error');
            setTimeout(() => {
                cell.classList.remove('error');
                refreshCells();
            }, 500);
        }
    });
}

function animateCellsError() {
    const cells = wordleGrid.querySelectorAll('.wordle-cell');
    cells.forEach(cell => {
        cell.classList.add('error');
        setTimeout(() => {
            cell.classList.remove('error');
            refreshCells();
        }, 500);
    });
}

function animateCellsSuccess(callback) {
    const cells = wordleGrid.querySelectorAll('.wordle-cell');
    cells.forEach((cell, i) => {
        setTimeout(() => {
            cell.classList.add('success');
        }, i * 120);
    });
    setTimeout(callback, cells.length * 120 + 500);
}

function handleCorrectAnswer(level) {
    showFeedback('✅ Corretto! Ave, soldato di Roma!', 'success');
    checkBtn.disabled = true;

    animateCellsSuccess(() => {
        gameBoard.style.transition = 'opacity 0.4s ease, transform 0.4s ease';
        gameBoard.style.opacity = '0';
        gameBoard.style.transform = 'translateY(-20px)';

        setTimeout(() => {
            checkBtn.disabled = false;
            if (currentLevelIndex + 1 >= LEVELS.length) {
                showFinalVictory();
            } else {
                showLevelVictory(level);
            }
        }, 450);
    });
}

function showLevelVictory(level) {
    gameBoard.style.display = 'none';
    victoryTitle.textContent = `🏆 Livello ${level.id} Completato!`;
    victoryMessage.textContent = getLevelVictoryMessage(level.id);
    victoryScreen.classList.remove('hidden');
    victoryScreen.style.opacity = '0';
    requestAnimationFrame(() => {
        victoryScreen.style.transition = 'opacity 0.5s ease';
        victoryScreen.style.opacity = '1';
    });
}

function showFinalVictory() {
    gameBoard.style.display = 'none';
    victoryScreen.classList.add('hidden');
    finalScreen.classList.remove('hidden');
    finalScreen.style.opacity = '0';
    requestAnimationFrame(() => {
        finalScreen.style.transition = 'opacity 0.5s ease';
        finalScreen.style.opacity = '1';
    });
}

function getLevelVictoryMessage(id) {
    return [
        "Eccellente! Hai decifrato il tuo primo messaggio segreto. Cesare è compiaciuto!",
        "Straordinario! Il tuo messaggio cifrato ha raggiunto il Senato. La tua abilità cresce.",
        "Incredibile! Hai smascherato i piani nemici senza alcuna guida. Sei un agente prezioso."
    ][id - 1] || "Missione completata!";
}

// --- Bottoni navigazione ---
nextLevelBtn.addEventListener('click', () => {
    currentLevelIndex++;
    loadLevel(currentLevelIndex);
});

restartBtn.addEventListener('click', () => {
    currentLevelIndex = 0;
    finalScreen.style.opacity = '0';
    setTimeout(() => {
        finalScreen.classList.add('hidden');
        loadLevel(0);
    }, 400);
});

// --- Feedback ---
function showFeedback(message, type) {
    feedbackMsg.textContent = message;
    feedbackMsg.className = `feedback-msg ${type}`;
}

// --- Avvio ---
loadLevel(0);

// =====================================================
// HERO SCREEN — Scompare allo scroll
// =====================================================
(function () {
    const hero = document.getElementById('hero-screen');
    if (!hero) return;

    let heroGone = false;

    function hideHero() {
        if (heroGone) return;
        heroGone = true;
        hero.classList.add('hero-hidden');
        // Dopo la transizione rimuove completamente dall'accessibilità
        setTimeout(() => { hero.style.display = 'none'; }, 750);
    }

    // Scroll della pagina
    window.addEventListener('scroll', () => {
        if (window.scrollY > 40) hideHero();
    }, { passive: true });

    // click sull'indicatore scroll → scrolla e nasconde
    const indicator = hero.querySelector('.scroll-indicator');
    if (indicator) {
        indicator.addEventListener('click', () => {
            window.scrollTo({ top: window.innerHeight * 0.6, behavior: 'smooth' });
            setTimeout(hideHero, 400);
        });
    }

    // Anche swipe verso l'alto su mobile
    let touchStartY = 0;
    hero.addEventListener('touchstart', e => { touchStartY = e.touches[0].clientY; }, { passive: true });
    hero.addEventListener('touchend', e => {
        if (touchStartY - e.changedTouches[0].clientY > 40) hideHero();
    }, { passive: true });
})();
