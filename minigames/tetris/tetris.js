// Tetris-Spiel JavaScript
document.addEventListener('DOMContentLoaded', function() {
    // Canvas-Elemente
    const canvas = document.getElementById('tetris');
    const nextCanvas = document.getElementById('nextBlock');
    const ctx = canvas.getContext('2d');
    const nextCtx = nextCanvas.getContext('2d');
    
    // Scoreboard-Elemente
    const scoreElement = document.getElementById('score');
    const levelElement = document.getElementById('level');
    const rowsElement = document.getElementById('rows');
    
    // Button-Elemente
    const startBtn = document.getElementById('startBtn');
    const pauseBtn = document.getElementById('pauseBtn');
    const upBtn = document.getElementById('upBtn');
    const leftBtn = document.getElementById('leftBtn');
    const rightBtn = document.getElementById('rightBtn');
    const downBtn = document.getElementById('downBtn');
    
    // Spielfeldgröße
    const ROWS = 20;
    const COLS = 10;
    const BLOCK_SIZE = 30;
    
    // Spielstatus
    let score = 0;
    let level = 1;
    let rowsCleared = 0;
    let isPaused = true; // Spiel startet pausiert
    let isGameOver = false;
    let isGameStarted = false; // Neuer Status für Spielstart
    let gameInterval;
    
    // Aktuelle Tetromino-Position
    let currentTetromino = null;
    let nextTetromino = null;
    let tetrominoX = 0;
    let tetrominoY = 0;
    
    // Spielraster
    let board = Array.from({ length: ROWS }, () => Array(COLS).fill(0));
    
    // Tetromino-Formen und Farben
    const TETROMINOES = {
        I: {
            shape: [
                [0, 0, 0, 0],
                [1, 1, 1, 1],
                [0, 0, 0, 0],
                [0, 0, 0, 0]
            ],
            color: '#00f5ff'
        },
        J: {
            shape: [
                [1, 0, 0],
                [1, 1, 1],
                [0, 0, 0]
            ],
            color: '#0000ff'
        },
        L: {
            shape: [
                [0, 0, 1],
                [1, 1, 1],
                [0, 0, 0]
            ],
            color: '#ff7f00'
        },
        O: {
            shape: [
                [1, 1],
                [1, 1]
            ],
            color: '#ffff00'
        },
        S: {
            shape: [
                [0, 1, 1],
                [1, 1, 0],
                [0, 0, 0]
            ],
            color: '#00ff00'
        },
        T: {
            shape: [
                [0, 1, 0],
                [1, 1, 1],
                [0, 0, 0]
            ],
            color: '#800080'
        },
        Z: {
            shape: [
                [1, 1, 0],
                [0, 1, 1],
                [0, 0, 0]
            ],
            color: '#ff0000'
        }
    };
    
    // Tetromino-Typen
    const TETROMINO_NAMES = Object.keys(TETROMINOES);
    
    // Zufälligen Tetromino auswählen
    function getRandomTetromino() {
        const name = TETROMINO_NAMES[Math.floor(Math.random() * TETROMINO_NAMES.length)];
        return {
            name: name,
            shape: TETROMINOES[name].shape,
            color: TETROMINOES[name].color
        };
    }
    
    // Neues Tetromino erstellen
    function createNewTetromino() {
        if (!nextTetromino) {
            nextTetromino = getRandomTetromino();
        }
        
        currentTetromino = nextTetromino;
        nextTetromino = getRandomTetromino();
        
        // Startposition in der Mitte oben
        tetrominoX = Math.floor(COLS / 2) - Math.floor(currentTetromino.shape[0].length / 2);
        tetrominoY = 0;
        
        // Wenn Kollision beim Spawn, Spiel beenden
        if (checkCollision()) {
            isGameOver = true;
            isGameStarted = false;
            clearInterval(gameInterval);
            alert(`Spiel vorbei! Finaler Score: ${score}`);
            startBtn.innerHTML = '<i class="fas fa-play"></i> Start';
        }
        
        drawNextTetromino();
    }
    
    // Kollisionserkennung
    function checkCollision(offsetX = 0, offsetY = 0, tetromino = currentTetromino) {
        if (!tetromino) return true;
        
        for (let y = 0; y < tetromino.shape.length; y++) {
            for (let x = 0; x < tetromino.shape[y].length; x++) {
                if (tetromino.shape[y][x]) {
                    const newX = tetrominoX + x + offsetX;
                    const newY = tetrominoY + y + offsetY;
                    
                    if (
                        newX < 0 || 
                        newX >= COLS || 
                        newY >= ROWS || 
                        (newY >= 0 && board[newY][newX])
                    ) {
                        return true;
                    }
                }
            }
        }
        return false;
    }
    
    // Tetromino auf Spielfeld fixieren
    function mergeTetromino() {
        if (!currentTetromino) return;
        
        for (let y = 0; y < currentTetromino.shape.length; y++) {
            for (let x = 0; x < currentTetromino.shape[y].length; x++) {
                if (currentTetromino.shape[y][x]) {
                    const boardY = tetrominoY + y;
                    if (boardY >= 0) { // Nur wenn im sichtbaren Bereich
                        board[boardY][tetrominoX + x] = currentTetromino.color;
                    }
                }
            }
        }
    }
    
    // Reihen löschen und Punkte berechnen
    function clearRows() {
        let rowsToClear = 0;
        
        for (let y = ROWS - 1; y >= 0; y--) {
            if (board[y].every(cell => cell !== 0)) {
                // Reihe löschen
                board.splice(y, 1);
                // Neue leere Reihe oben hinzufügen
                board.unshift(Array(COLS).fill(0));
                rowsToClear++;
                y++; // Gleiche Reihe erneut prüfen (da jetzt verschoben)
            }
        }
        
        if (rowsToClear > 0) {
            // Punkte berechnen
            const points = [0, 100, 300, 500, 800][rowsToClear] * level;
            score += points;
            rowsCleared += rowsToClear;
            
            // Level erhöhen alle 10 gelöschten Reihen
            level = Math.floor(rowsCleared / 10) + 1;
            
            // Scoreboard aktualisieren
            updateScoreboard();
            
            // Spielgeschwindigkeit erhöhen
            updateGameSpeed();
        }
    }
    
    // Spielgeschwindigkeit basierend auf Level aktualisieren
    function updateGameSpeed() {
        if (gameInterval) {
            clearInterval(gameInterval);
        }
        const speed = Math.max(1000 - (level - 1) * 100, 100); // Minimum 100ms
        gameInterval = setInterval(moveDown, speed);
    }
    
    // Scoreboard aktualisieren
    function updateScoreboard() {
        scoreElement.textContent = score;
        levelElement.textContent = level;
        rowsElement.textContent = rowsCleared;
    }
    
    // Tetromino drehen
    function rotateTetromino() {
        if (!currentTetromino || !isGameStarted || isPaused || isGameOver) return;
        
        const originalShape = currentTetromino.shape;
        // Matrix transponieren und umkehren für 90° Drehung
        const rotated = originalShape[0].map((_, index) =>
            originalShape.map(row => row[index]).reverse()
        );
        
        const originalShapeBackup = currentTetromino.shape;
        currentTetromino.shape = rotated;
        
        // Wenn Kollision nach Drehung, zurücksetzen
        if (checkCollision()) {
            currentTetromino.shape = originalShapeBackup;
        }
    }
    
    // Tetromino bewegen
    function moveTetromino(dx, dy) {
        if (!currentTetromino || !isGameStarted || isPaused || isGameOver) return false;
        
        if (!checkCollision(dx, dy)) {
            tetrominoX += dx;
            tetrominoY += dy;
            return true;
        }
        return false;
    }
    
    // Tetromino nach unten bewegen
    function moveDown() {
        if (!isGameStarted || isPaused || isGameOver) return;
        
        if (!moveTetromino(0, 1)) {
            // Kann nicht weiter nach unten, fixieren
            mergeTetromino();
            clearRows();
            createNewTetromino();
        }
        
        draw();
    }
    
    // Tetromino direkt nach unten fallen lassen
    function hardDrop() {
        if (!isGameStarted || isPaused || isGameOver) return;
        
        while (moveTetromino(0, 1)) {
            // Bewege solange nach unten, bis Kollision
        }
        
        mergeTetromino();
        clearRows();
        createNewTetromino();
        draw();
    }
    
    // Nächsten Tetromino anzeigen
    function drawNextTetromino() {
        nextCtx.clearRect(0, 0, nextCanvas.width, nextCanvas.height);
        
        if (!nextTetromino) return;
        
        const blockSize = 25;
        const offsetX = (nextCanvas.width - nextTetromino.shape[0].length * blockSize) / 2;
        const offsetY = (nextCanvas.height - nextTetromino.shape.length * blockSize) / 2;
        
        nextCtx.fillStyle = nextTetromino.color;
        
        for (let y = 0; y < nextTetromino.shape.length; y++) {
            for (let x = 0; x < nextTetromino.shape[y].length; x++) {
                if (nextTetromino.shape[y][x]) {
                    nextCtx.fillRect(
                        offsetX + x * blockSize,
                        offsetY + y * blockSize,
                        blockSize - 1,
                        blockSize - 1
                    );
                    
                    // Block-Highlight
                    nextCtx.strokeStyle = '#ffffff';
                    nextCtx.lineWidth = 1;
                    nextCtx.strokeRect(
                        offsetX + x * blockSize,
                        offsetY + y * blockSize,
                        blockSize - 1,
                        blockSize - 1
                    );
                }
            }
        }
    }
    
    // Startbildschirm zeichnen
    function drawStartScreen() {
        // Hintergrund löschen
        ctx.fillStyle = '#0f3460';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Start-Nachricht
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 28px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('TETRIS', canvas.width / 2, canvas.height / 2 - 50);
        
        ctx.font = '18px Arial';
        ctx.fillText('Drücke START zum Spielen', canvas.width / 2, canvas.height / 2);
        
        ctx.font = '14px Arial';
        ctx.fillText('Steuerung:', canvas.width / 2, canvas.height / 2 + 50);
        ctx.fillText('← →: Bewegen', canvas.width / 2, canvas.height / 2 + 80);
        ctx.fillText('↑: Drehen', canvas.width / 2, canvas.height / 2 + 110);
        ctx.fillText('↓: Schneller', canvas.width / 2, canvas.height / 2 + 140);
    }
    
    // Spiel zeichnen
    function draw() {
        // Wenn Spiel nicht gestartet, Startbildschirm zeigen
        if (!isGameStarted) {
            drawStartScreen();
            return;
        }
        
        // Wenn Spiel pausiert, Pause-Bildschirm zeigen
        if (isPaused && isGameStarted) {
            drawPauseScreen();
            return;
        }
        
        // Normaler Spielmodus
        // Hintergrund löschen
        ctx.fillStyle = '#0f3460';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Fixierte Blöcke zeichnen
        for (let y = 0; y < ROWS; y++) {
            for (let x = 0; x < COLS; x++) {
                if (board[y][x]) {
                    ctx.fillStyle = board[y][x];
                    ctx.fillRect(x * BLOCK_SIZE, y * BLOCK_SIZE, BLOCK_SIZE - 1, BLOCK_SIZE - 1);
                    
                    // Block-Highlight
                    ctx.strokeStyle = '#ffffff';
                    ctx.lineWidth = 1;
                    ctx.strokeRect(x * BLOCK_SIZE, y * BLOCK_SIZE, BLOCK_SIZE - 1, BLOCK_SIZE - 1);
                }
            }
        }
        
        // Aktuellen Tetromino zeichnen
        if (currentTetromino) {
            ctx.fillStyle = currentTetromino.color;
            
            for (let y = 0; y < currentTetromino.shape.length; y++) {
                for (let x = 0; x < currentTetromino.shape[y].length; x++) {
                    if (currentTetromino.shape[y][x]) {
                        ctx.fillRect(
                            (tetrominoX + x) * BLOCK_SIZE,
                            (tetrominoY + y) * BLOCK_SIZE,
                            BLOCK_SIZE - 1,
                            BLOCK_SIZE - 1
                        );
                        
                        // Block-Highlight
                        ctx.strokeStyle = '#ffffff';
                        ctx.lineWidth = 1;
                        ctx.strokeRect(
                            (tetrominoX + x) * BLOCK_SIZE,
                            (tetrominoY + y) * BLOCK_SIZE,
                            BLOCK_SIZE - 1,
                            BLOCK_SIZE - 1
                        );
                    }
                }
            }
        }
        
        // Gitter zeichnen
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.lineWidth = 0.5;
        
        // Vertikale Linien
        for (let x = 0; x <= COLS; x++) {
            ctx.beginPath();
            ctx.moveTo(x * BLOCK_SIZE, 0);
            ctx.lineTo(x * BLOCK_SIZE, ROWS * BLOCK_SIZE);
            ctx.stroke();
        }
        
        // Horizontale Linien
        for (let y = 0; y <= ROWS; y++) {
            ctx.beginPath();
            ctx.moveTo(0, y * BLOCK_SIZE);
            ctx.lineTo(COLS * BLOCK_SIZE, y * BLOCK_SIZE);
            ctx.stroke();
        }
    }
    
    // Pause-Bildschirm zeichnen
    function drawPauseScreen() {
        // Halbtransparenten Overlay zeichnen
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Pause-Nachricht
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 32px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('PAUSE', canvas.width / 2, canvas.height / 2 - 30);
        
        ctx.font = '18px Arial';
        ctx.fillText('Drücke Pause zum Fortsetzen', canvas.width / 2, canvas.height / 2 + 30);
    }
    
    // Spiel starten oder neu starten
    function startGame() {
        // Wenn Spiel bereits läuft und nicht beendet ist, nichts tun
        if (isGameStarted && !isGameOver) return;
        
        // Reset für Neustart
        if (isGameOver || !isGameStarted) {
            score = 0;
            level = 1;
            rowsCleared = 0;
            board = Array.from({ length: ROWS }, () => Array(COLS).fill(0));
            updateScoreboard();
            nextTetromino = null;
        }
        
        isGameStarted = true;
        isPaused = false;
        isGameOver = false;
        
        // Tetrominos erstellen
        createNewTetromino();
        
        // Spielinterval setzen
        updateGameSpeed();
        
        // Zeichnen
        draw();
        
        // Button-Text ändern
        startBtn.innerHTML = '<i class="fas fa-redo"></i> Neustart';
        pauseBtn.innerHTML = '<i class="fas fa-pause"></i> Pause';
        pauseBtn.disabled = false;
    }
    
    // Spiel pausieren/fortsetzen
    function togglePause() {
        if (!isGameStarted || isGameOver) return;
        
        isPaused = !isPaused;
        
        if (isPaused) {
            pauseBtn.innerHTML = '<i class="fas fa-play"></i> Fortsetzen';
            if (gameInterval) {
                clearInterval(gameInterval);
            }
        } else {
            pauseBtn.innerHTML = '<i class="fas fa-pause"></i> Pause';
            updateGameSpeed();
        }
        
        draw();
    }
    
    // Tastatursteuerung - Korrigierte Version ohne Scrollen
    function handleKeyDown(event) {
        // Verhindere Standardaktionen für Spieltasten
        const gameKeys = [
            'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown',
            'a', 'A', 'd', 'D', 's', 'S', 'w', 'W',
            ' ', 'p', 'P'
        ];
        
        if (gameKeys.includes(event.key)) {
            event.preventDefault(); // Verhindert Scrollen der Seite
            event.stopPropagation();
            
            // Wenn Spiel nicht gestartet, nur Start mit Leertaste erlauben
            if (!isGameStarted && event.key !== ' ' && event.key !== 'p' && event.key !== 'P') {
                return false;
            }
            
            // Wenn Spiel pausiert, nur P-Taste erlauben
            if (isPaused && event.key !== 'p' && event.key !== 'P') {
                return false;
            }
            
            switch (event.key) {
                case 'ArrowLeft':
                case 'a':
                case 'A':
                    moveTetromino(-1, 0);
                    draw();
                    break;
                case 'ArrowRight':
                case 'd':
                case 'D':
                    moveTetromino(1, 0);
                    draw();
                    break;
                case 'ArrowDown':
                case 's':
                case 'S':
                    moveDown();
                    break;
                case 'ArrowUp':
                case 'w':
                case 'W':
                    rotateTetromino();
                    draw();
                    break;
                case ' ': // Leertaste für Hard Drop
                    hardDrop();
                    break;
                case 'p':
                case 'P':
                    togglePause();
                    break;
            }
            return false;
        }
    }
    
    // Event-Listener mit passiven Optionen für bessere Performance
    document.addEventListener('keydown', handleKeyDown, { passive: false });
    
    // Button-Event-Listener
    startBtn.addEventListener('click', startGame);
    pauseBtn.addEventListener('click', togglePause);
    
    upBtn.addEventListener('click', () => {
        if (isGameStarted && !isPaused && !isGameOver) {
            rotateTetromino();
            draw();
        }
    });
    
    leftBtn.addEventListener('click', () => {
        if (isGameStarted && !isPaused && !isGameOver) {
            moveTetromino(-1, 0);
            draw();
        }
    });
    
    rightBtn.addEventListener('click', () => {
        if (isGameStarted && !isPaused && !isGameOver) {
            moveTetromino(1, 0);
            draw();
        }
    });
    
    downBtn.addEventListener('click', () => {
        if (isGameStarted && !isPaused && !isGameOver) {
            moveDown();
        }
    });
    
    // Verhindere Fokus auf Buttons, der Probleme verursachen könnte
    const allButtons = document.querySelectorAll('button');
    allButtons.forEach(button => {
        // Verhindere Standardverhalten bei Tastendruck auf Buttons
        button.addEventListener('keydown', function(e) {
            if ([' ', 'Enter'].includes(e.key)) {
                e.preventDefault();
            }
        });
        
        // Setze Tabindex auf -1 für Steuerungsbuttons, damit sie nicht mit Tab erreichbar sind
        if (['upBtn', 'downBtn', 'leftBtn', 'rightBtn'].includes(button.id)) {
            button.setAttribute('tabindex', '-1');
        }
    });
    
    // Pause-Button anfangs deaktivieren
    pauseBtn.disabled = true;
    
    // Setze Fokus auf das Canvas für bessere Tastaturnavigation
    canvas.setAttribute('tabindex', '0');
    canvas.addEventListener('click', () => {
        canvas.focus();
    });
    
    // Initialisiere Startbildschirm (statt Spiel zu starten)
    drawStartScreen();
    drawNextTetromino();
});