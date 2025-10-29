// UI Event Handlers and Controls

// Global grid size selection
let selectedGridSize = 12; // Default to small (12x12)

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
    } else if (e.code === 'KeyZ' || e.keyCode === 90) {
        e.preventDefault();
        undoLastMove();
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
    const undoBtn = document.getElementById('undoBtn');
    
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
    
    if (undoBtn) {
        undoBtn.tabIndex = -1; // Remove from tab order
        undoBtn.addEventListener('focus', () => {
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
document.getElementById('newGameBtn').addEventListener('click', showPlayerSelectionPopover);
document.getElementById('newGameBtnDesktop').addEventListener('click', showPlayerSelectionPopoverDesktop);
document.getElementById('rotateBtn').addEventListener('click', rotatePiece);
document.getElementById('flipBtn').addEventListener('click', flipPiece);
document.getElementById('undoBtn').addEventListener('click', undoLastMove);

// Player selection popover functionality
function showPlayerSelectionPopover() {
    const popover = document.getElementById('playerSelectionPopover');
    popover.classList.add('show');
}

function showPlayerSelectionPopoverDesktop() {
    const popover = document.getElementById('playerSelectionPopoverDesktop');
    popover.classList.add('show');
}

function hidePlayerSelectionPopover() {
    const popover = document.getElementById('playerSelectionPopover');
    popover.classList.remove('show');
}

function hidePlayerSelectionPopoverDesktop() {
    const popover = document.getElementById('playerSelectionPopoverDesktop');
    popover.classList.remove('show');
}

function selectPlayerCount(playerCount) {
    hidePlayerSelectionPopover();
    hidePlayerSelectionPopoverDesktop();

    // Play new game sound
    playNewGameSound();

    initGameWithPlayerCount(parseInt(playerCount), selectedGridSize);
}

// Grid size selection functions
function selectGridSize(gridSize) {
    selectedGridSize = parseInt(gridSize);

    // Update selected state for both popovers
    document.querySelectorAll('.grid-size-option').forEach(option => {
        option.classList.remove('selected');
        if (parseInt(option.getAttribute('data-grid-size')) === selectedGridSize) {
            option.classList.add('selected');
        }
    });
}

// Initialize popover event listeners
document.addEventListener('DOMContentLoaded', function() {
    // Handle player option clicks for both popovers
    document.querySelectorAll('.player-option').forEach(option => {
        option.addEventListener('click', function() {
            const playerCount = this.getAttribute('data-players');
            selectPlayerCount(playerCount);
        });
    });

    // Handle grid size option clicks for both popovers
    document.querySelectorAll('.grid-size-option').forEach(option => {
        option.addEventListener('click', function(e) {
            e.stopPropagation(); // Prevent closing the popover
            const gridSize = this.getAttribute('data-grid-size');
            selectGridSize(gridSize);
        });
    });
    
    // Close popovers when clicking outside
    document.addEventListener('click', function(e) {
        const popover = document.getElementById('playerSelectionPopover');
        const popoverDesktop = document.getElementById('playerSelectionPopoverDesktop');
        const newGameBtn = document.getElementById('newGameBtn');
        const newGameBtnDesktop = document.getElementById('newGameBtnDesktop');
        
        if (!popover.contains(e.target) && !newGameBtn.contains(e.target)) {
            hidePlayerSelectionPopover();
        }
        
        if (!popoverDesktop.contains(e.target) && !newGameBtnDesktop.contains(e.target)) {
            hidePlayerSelectionPopoverDesktop();
        }
    });
});

// Pattern view toggle
document.getElementById('patternToggle').addEventListener('click', () => {
    const button = document.getElementById('patternToggle');
    const body = document.body;
    const tooltip = document.getElementById('patternToggleTooltip');
    
    // Play toggle sound
    playToggleSound();
    
    button.classList.toggle('active');
    body.classList.toggle('desaturated');
    
    if (button.classList.contains('active')) {
        button.innerHTML = '<i class="ri-palette-line"></i><span class="absolute bottom-full left-full ml-2 px-2 py-1 text-xs text-white bg-gray-900 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-50" id="patternToggleTooltip">To Color View</span>';
    } else {
        button.innerHTML = '<i class="ri-eye-line"></i><span class="absolute bottom-full left-full ml-2 px-2 py-1 text-xs text-white bg-gray-900 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-50" id="patternToggleTooltip">To Pattern View</span>';
    }
    
    // Re-render the board to apply desaturation changes
    render();
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

// Click handler to clear group highlights when clicking outside the game board
document.addEventListener('click', (e) => {
    const gameBoard = document.getElementById('gameBoard');
    const gameArea = document.querySelector('.game-area');
    
    // If clicking outside the game area and no piece is selected, clear group highlights
    if (!gameArea.contains(e.target) && !game.selectedPiece && typeof clearAllGroupHighlights === 'function') {
        clearAllGroupHighlights();
    }
    
    // If clicking on a different cell that has a placed piece, clear current highlights
    if (e.target.classList.contains('cell') && !game.selectedPiece && typeof clearAllGroupHighlights === 'function') {
        const clickedCell = e.target;
        const currentHighlightedCells = document.querySelectorAll('.cell.group-overlay-color, .cell.group-overlay-pattern');
        
        // If there are highlighted cells and we're clicking on a different cell
        if (currentHighlightedCells.length > 0) {
            let isClickingOnHighlightedCell = false;
            currentHighlightedCells.forEach(highlightedCell => {
                if (highlightedCell === clickedCell) {
                    isClickingOnHighlightedCell = true;
                }
            });
            
            // If clicking on a different cell, clear highlights
            if (!isClickingOnHighlightedCell) {
                clearAllGroupHighlights();
            }
        }
    }
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