// Animation utilities using Framer Motion

// Count-up animation for score display
function animateScoreCountUp(element, startValue, endValue, duration = 1500) {
    console.log(`Starting count-up animation: ${startValue} -> ${endValue}`);
    const startTime = performance.now();
    
    function updateScore(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // Ease-out function
        const easeOut = 1 - Math.pow(1 - progress, 3);
        
        const currentValue = Math.floor(startValue + (endValue - startValue) * easeOut);
        element.textContent = currentValue;
        
        if (progress < 1) {
            requestAnimationFrame(updateScore);
        } else {
            console.log(`Count-up animation completed: ${currentValue}`);
        }
    }
    
    requestAnimationFrame(updateScore);
}

// Animate piece selection
function animatePieceSelection(pieceElement) {
    if (window.motion) {
        window.motion.animate(pieceElement, 
            { scale: 1.1, rotate: 5 },
            { duration: 0.3, ease: "easeOut" }
        );
    }
}

// Animate piece placement
function animatePiecePlacement(cells) {
    if (!window.motion) return;
    
    cells.forEach((cell, index) => {
        window.motion.animate(cell, 
            { scale: [0, 1], opacity: [0, 1] },
            { 
                duration: 0.2, 
                delay: index * 0.05,
                ease: "easeOut"
            }
        );
    });
}

// Animate score popup with enhanced effects
function animateScorePopup(score, row, col) {
    const popup = document.createElement('div');
    popup.className = 'score-popup bg-gray-100 text-black px-4 py-2 rounded-lg font-bold text-sm shadow-lg';
    popup.style.fontFamily = "'Geist', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif";
    popup.textContent = `+${score}`;
    popup.style.position = 'fixed';
    popup.style.zIndex = '1000';
    
    // Calculate the position on screen based on the grid cell
    const gameBoard = document.querySelector('.game-board');
    if (gameBoard) {
        const boardRect = gameBoard.getBoundingClientRect();
        const cellSize = 30; // 30px per cell
        const cellGap = 1; // 1px gap between cells
        const boardPadding = 10; // 10px padding around board
        
        // Calculate position relative to the board
        const x = boardRect.left + boardPadding + (col * (cellSize + cellGap)) + (cellSize / 2);
        const y = boardRect.top + boardPadding + (row * (cellSize + cellGap)) + (cellSize / 2);
        
        popup.style.left = `${x}px`;
        popup.style.top = `${y}px`;
        popup.style.transform = 'translate(-50%, -50%)';
    } else {
        // Fallback to center if board not found
        popup.style.left = '50%';
        popup.style.top = '50%';
        popup.style.transform = 'translate(-50%, -50%)';
    }
    
    document.body.appendChild(popup);
    
    if (window.motion) {
        // Simple animation: fade in, move up gently, fade out
        window.motion.animate(popup, 
            { 
                opacity: [0, 1],
                y: [0, -30] // Move up only 30px over the duration (gentler movement)
            },
            { 
                duration: 2.5,
                ease: "easeOut",
                onComplete: () => popup.remove()
            }
        );
    } else {
        // Fallback CSS animation
        popup.style.animation = 'scorePopup 2.5s ease-out forwards';
        setTimeout(() => popup.remove(), 2500);
    }
}

// Animate area capture with particle effect
function animateAreaCapture(cells) {
    if (!window.motion) return;
    
    cells.forEach(([r, c], index) => {
        setTimeout(() => {
            const cell = document.querySelector(`[data-row="${r}"][data-col="${c}"]`);
            if (cell) {
                // Add glow effect
                cell.style.boxShadow = '0 0 20px rgba(255, 255, 255, 0.8)';
                
                window.motion.animate(cell, 
                    { scale: [1, 1.2, 1] },
                    { 
                        duration: 0.5,
                        ease: "easeOut",
                        onComplete: () => {
                            cell.style.boxShadow = '';
                        }
                    }
                );
            }
        }, index * 30);
    });
}

// Animate marketplace piece hover
function animatePieceHover(pieceElement) {
    if (window.motion) {
        window.motion.animate(pieceElement, {
            scale: 1.05,
            y: -2
        }, {
            duration: 0.2,
            ease: "easeOut"
        });
    }
}

// Animate marketplace piece leave
function animatePieceLeave(pieceElement) {
    if (window.motion) {
        window.motion.animate(pieceElement, {
            scale: 1,
            y: 0
        }, {
            duration: 0.2,
            ease: "easeOut"
        });
    }
}

// Animate button clicks
function animateButtonClick(button) {
    if (window.motion) {
        window.motion.animate(button, 
            { scale: 0.95 },
            { 
                duration: 0.1,
                ease: "easeOut",
                onComplete: () => {
                    window.motion.animate(button, {
                        scale: 1
                    }, {
                        duration: 0.1,
                        ease: "easeOut"
                    });
                }
            }
        );
    }
}

// Animate game over modal
function animateGameOverModal(modal) {
    if (window.motion) {
        window.motion.animate(modal, 
            { 
                scale: [0, 1], 
                opacity: [0, 1],
                rotate: [-10, 0]
            },
            { 
                duration: 0.5,
                ease: "easeOut"
            }
        );
    }
}

// Enhanced showScorePopup function
function showScorePopup(score, row, col) {
    animateScorePopup(score, row, col);
}

// Enhanced markAreaCaptured function
function markAreaCaptured(cells, isMultiple = false) {
    console.log('Marking area captured with animation:', cells.length, 'cells, multiple:', isMultiple);
    
    // Add light gray indicator with staggered timing for a gradual reveal
    cells.forEach(([r, c], index) => {
        setTimeout(() => {
            const cell = document.querySelector(`[data-row="${r}"][data-col="${c}"]`);
            if (cell) {
                cell.classList.add('scored');
                console.log('Added scored indicator for cell:', r, c);
            }
        }, index * 30);
    });
    
    // Remove light gray indicator with staggered timing for a gradual fade-out
    setTimeout(() => {
        cells.forEach(([r, c], index) => {
            setTimeout(() => {
                const cell = document.querySelector(`[data-row="${r}"][data-col="${c}"]`);
                if (cell) {
                    cell.classList.remove('scored');
                    console.log('Removed scored indicator from cell:', r, c);
                }
            }, index * 30);
        });
    }, 2000 + (cells.length * 30));
}

function markMultipleAreasCaptured(groupsArray) {
    console.log('Marking multiple areas captured with animation:', groupsArray.length, 'groups');
    
    const totalAnimationTime = 2000; // 2 seconds total
    const timePerGroup = totalAnimationTime / groupsArray.length;
    
    groupsArray.forEach((cells, groupIndex) => {
        const groupStartTime = groupIndex * timePerGroup;
        
        // Add light gray indicator with staggered timing for each group
        cells.forEach(([r, c], cellIndex) => {
            setTimeout(() => {
                const cell = document.querySelector(`[data-row="${r}"][data-col="${c}"]`);
                if (cell) {
                    cell.classList.add('scored');
                    console.log('Added scored indicator for cell:', r, c, 'in group', groupIndex);
                }
            }, groupStartTime + (cellIndex * 30));
        });
        
        // Remove light gray indicator with staggered timing
        setTimeout(() => {
            cells.forEach(([r, c], cellIndex) => {
                setTimeout(() => {
                    const cell = document.querySelector(`[data-row="${r}"][data-col="${c}"]`);
                    if (cell) {
                        cell.classList.remove('scored');
                        console.log('Removed scored indicator from cell:', r, c, 'in group', groupIndex);
                    }
                }, cellIndex * 30);
            });
        }, totalAnimationTime + (cells.length * 30));
    });
}

// Add animation to piece selection
function selectPiece(piece) {
    if (game.gameOver) return;
    
    // Only reset rotation/flip if selecting a new piece
    if (!game.selectedPiece || game.selectedPiece.id !== piece.id) {
        game.pieceRotation = 0;
        game.pieceFlipped = false;
    }
    
    game.selectedPiece = piece;
    
    // Animate the selected piece
    const pieceElement = document.querySelector(`[data-piece-id="${piece.id}"]`);
    if (pieceElement) {
        animatePieceSelection(pieceElement);
    }
    
    render();
}

// Add hover animations to marketplace pieces
function addPieceHoverAnimations() {
    document.querySelectorAll('.piece').forEach(piece => {
        piece.addEventListener('mouseenter', () => animatePieceHover(piece));
        piece.addEventListener('mouseleave', () => animatePieceLeave(piece));
    });
}

// Add click animations to buttons
function addButtonClickAnimations() {
    document.querySelectorAll('button').forEach(button => {
        button.addEventListener('click', () => animateButtonClick(button));
    });
}

// Initialize animations
function initAnimations() {
    addPieceHoverAnimations();
    addButtonClickAnimations();
}

// Override the original functions to use animations
window.showScorePopup = showScorePopup;
window.markAreaCaptured = markAreaCaptured;
window.markMultipleAreasCaptured = markMultipleAreasCaptured;
window.selectPiece = selectPiece;
window.animateScoreCountUp = animateScoreCountUp;

// Initialize animations when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    initAnimations();
}); 