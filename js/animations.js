// Animation utilities using Framer Motion

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
function animateScorePopup(score) {
    const popup = document.createElement('div');
    popup.className = 'score-popup bg-green-500 text-white px-6 py-3 rounded-lg font-bold text-xl shadow-lg';
    popup.textContent = `+${score}`;
    popup.style.position = 'fixed';
    popup.style.left = '50%';
    popup.style.top = '50%';
    popup.style.transform = 'translate(-50%, -50%)';
    popup.style.zIndex = '1000';
    
    document.body.appendChild(popup);
    
    if (window.motion) {
        // Enhanced Framer Motion animation
        window.motion.animate(popup, 
            { 
                scale: [0, 1.2, 1], 
                opacity: [0, 1, 1],
                rotate: [-180, 0],
                y: [0, -20]
            },
            { 
                duration: 0.6,
                ease: "easeOut",
                onComplete: () => {
                    window.motion.animate(popup, {
                        y: -50,
                        opacity: 0,
                        scale: 0.8
                    }, {
                        duration: 0.4,
                        delay: 0.2,
                        ease: "easeIn",
                        onComplete: () => popup.remove()
                    });
                }
            }
        );
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
function showScorePopup(score) {
    animateScorePopup(score);
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

// Initialize animations when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    initAnimations();
}); 