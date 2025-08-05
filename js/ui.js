// UI Event Handlers and Controls

// Keyboard controls - ensure they work regardless of focus
function handleKeyboardControls(e) {
    // Only handle if not typing in input fields
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT') {
        return;
    }
    
    if (e.code === 'KeyR' || e.keyCode === 82) {
        e.preventDefault();
        rotatePiece();
    } else if (e.code === 'KeyF' || e.keyCode === 70) {
        e.preventDefault();
        flipPiece();
    }
}

// Initialize keyboard controls
function initKeyboardControls() {
    // Remove any existing listeners to prevent duplicates
    document.removeEventListener('keydown', handleKeyboardControls);
    window.removeEventListener('keydown', handleKeyboardControls);
    
    // Add event listener to document only (not both document and window to avoid duplicates)
    document.addEventListener('keydown', handleKeyboardControls);
    
    // Ensure the body can receive focus and keyboard events
    document.body.tabIndex = -1;
    
    // Prevent buttons from stealing keyboard focus
    const rotateBtn = document.getElementById('rotateBtn');
    const flipBtn = document.getElementById('flipBtn');
    
    if (rotateBtn) {
        rotateBtn.tabIndex = -1; // Remove from tab order
        rotateBtn.addEventListener('focus', () => {
            document.body.focus();
        });
    }
    
    if (flipBtn) {
        flipBtn.tabIndex = -1; // Remove from tab order
        flipBtn.addEventListener('focus', () => {
            document.body.focus();
        });
    }
    
    // Add click handler to refocus body when clicking on game area
    const gameBoard = document.getElementById('gameBoard');
    if (gameBoard) {
        gameBoard.addEventListener('click', () => {
            document.body.focus();
        });
    }
    
    // Focus body initially
    document.body.focus();
}

function rotatePiece() {
    if (!game.selectedPiece || game.gameOver) return;
    game.pieceRotation = (game.pieceRotation + 1) % 4;
    render();
}

function flipPiece() {
    if (!game.selectedPiece || game.gameOver) return;
    game.pieceFlipped = !game.pieceFlipped;
    render();
}

// Initialize controls
document.getElementById('newGame').addEventListener('click', initGame);
document.getElementById('rotateBtn').addEventListener('click', rotatePiece);
document.getElementById('flipBtn').addEventListener('click', flipPiece);
document.getElementById('playerCount').addEventListener('change', initGame);

// Pattern view toggle
document.getElementById('patternToggle').addEventListener('click', () => {
    const button = document.getElementById('patternToggle');
    const body = document.body;
    
    button.classList.toggle('active');
    body.classList.toggle('desaturated');
    
    if (button.classList.contains('active')) {
        button.innerHTML = '<i class="ri-palette-line"></i>';
        button.title = 'Toggle Color View';
    } else {
        button.innerHTML = '<i class="ri-eye-line"></i>';
        button.title = 'Toggle Pattern View';
    }
});

// Mouse leave handler to clear all previews and highlights
document.getElementById('gameBoard').addEventListener('mouseleave', () => {
    document.querySelectorAll('.cell').forEach(cell => {
        cell.classList.remove('preview', 'invalid', 'highlight-edge-color', 'highlight-edge-pattern', 'highlight-edge-both');
        if (!game.grid[cell.dataset.row][cell.dataset.col]) {
            cell.style.backgroundColor = '';
            cell.className = 'cell';
            // Remove pattern classes
            ['pattern-dots', 'pattern-boxes', 'pattern-diagonals'].forEach(cls => {
                cell.classList.remove(cls);
            });
        }
    });
});

// Start game when all scripts are loaded
document.addEventListener('DOMContentLoaded', () => {
    initKeyboardControls();
    initGame();
});

// Also initialize keyboard controls when the window loads (backup)
window.addEventListener('load', () => {
    initKeyboardControls();
}); 