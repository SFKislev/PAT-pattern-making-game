// Game state
let game = {
    grid: null, // Will be set dynamically based on selected grid size
    gridSize: 12, // Default grid size
    players: [],
    currentPlayer: 0,
    marketplace: [],
    selectedPiece: null,
    pieceRotation: 0,
    pieceFlipped: false,
    gameOver: false,
    firstPiecePlaced: false,
    moveHistory: [],
    isPlacingPiece: false
};

// Sound system with audio pooling
const audioCache = new Map();
const POOL_SIZE = 5; // Number of instances per sound

function preloadSounds() {
    const soundsToPreload = {
        success: ['success1.wav', 'success2.wav', 'success3.wav', 'success4.wav'],
        place: ['place3.wav', 'place2.wav', 'place1.wav', 'place4.wav'],
        toggle: ['toggle.wav'],
        newGame: ['newgame.wav']
    };

    let loadedCount = 0;
    const totalSounds = Object.values(soundsToPreload).flat().length;

    Object.entries(soundsToPreload).forEach(([category, sounds]) => {
        sounds.forEach(soundFile => {
            const key = `${category}/${soundFile}`;
            const pool = [];

            // Create a pool of audio instances for each sound
            for (let i = 0; i < POOL_SIZE; i++) {
                const audio = new Audio(`sounds/${category}/${soundFile}`);
                audio.preload = 'auto';
                audio.volume = category === 'success' ? 0.7 : category === 'place' ? 0.6 : category === 'newGame' ? 0.8 : 0.5;

                audio.addEventListener('canplaythrough', () => {
                    if (i === 0) { // Only count once per sound file
                        loadedCount++;
                        console.log(`Loaded sound: ${category}/${soundFile} (${loadedCount}/${totalSounds})`);
                    }
                });

                audio.addEventListener('error', (error) => {
                    console.warn(`Failed to load sound: ${category}/${soundFile}`, error);
                });

                pool.push(audio);
            }

            audioCache.set(key, { pool, currentIndex: 0 });
        });
    });
}

// Helper function to get next available audio from pool
function getAudioFromPool(key) {
    const cached = audioCache.get(key);
    if (!cached) return null;

    const { pool, currentIndex } = cached;
    const audio = pool[currentIndex];

    // Update index for next call (round-robin)
    cached.currentIndex = (currentIndex + 1) % pool.length;

    return audio;
}

// Sound utility functions
function playSuccessSound() {
    const successSounds = ['success1.wav', 'success2.wav', 'success3.wav', 'success4.wav'];
    const randomSound = successSounds[Math.floor(Math.random() * successSounds.length)];
    const audio = getAudioFromPool(`success/${randomSound}`);

    if (audio) {
        // Reset to beginning if already playing
        audio.currentTime = 0;
        audio.play().catch(error => {
            console.log('Audio playback failed:', error);
        });
    }
}

function playPlaceSound() {
    const placeSounds = ['place3.wav', 'place2.wav', 'place1.wav', 'place4.wav'];
    const randomSound = placeSounds[Math.floor(Math.random() * placeSounds.length)];
    const audio = getAudioFromPool(`place/${randomSound}`);

    if (audio) {
        // Reset to beginning if already playing
        audio.currentTime = 0;
        audio.play().catch(error => {
            console.log('Audio playback failed:', error);
        });
    }
}

function playToggleSound() {
    const audio = getAudioFromPool('toggle/toggle.wav');

    if (audio) {
        // Reset to beginning if already playing
        audio.currentTime = 0;
        audio.play().catch(error => {
            console.log('Audio playback failed:', error);
        });
    }
}

function playNewGameSound() {
    const audio = getAudioFromPool('newGame/newgame.wav');

    if (audio) {
        // Reset to beginning if already playing
        audio.currentTime = 0;
        audio.play().catch(error => {
            console.log('Audio playback failed:', error);
        });
    }
}

// Core game functions
function initGame() {
    // Preload all sounds
    preloadSounds();

    // Default to 2 players and default grid size (12) if no specific values provided
    initGameWithPlayerCount(2, 12);
}

function initGameWithPlayerCount(playerCount, gridSize = 12) {
    // Clear any existing group highlights when starting a new game
    if (typeof clearAllGroupHighlights === 'function') {
        clearAllGroupHighlights();
    }

    // Set the dynamic grid size for this game
    game.gridSize = gridSize;
    game.grid = Array(gridSize).fill().map(() => Array(gridSize).fill(null));

    // Update CSS custom properties for dynamic grid sizing
    const gameBoard = document.getElementById('gameBoard');
    if (gameBoard) {
        const cellSize = gridSize >= 14 ? 32 : gridSize >= 12 ? 33 : 35; // Adjust cell size for smaller grids
        gameBoard.style.setProperty('--grid-columns', `repeat(${gridSize}, ${cellSize}px)`);
        gameBoard.style.setProperty('--grid-rows', `repeat(${gridSize}, ${cellSize}px)`);

        // Update cell dimensions
        document.documentElement.style.setProperty('--cell-width', `${cellSize}px`);
        document.documentElement.style.setProperty('--cell-height', `${cellSize}px`);

        // Update player info width: cells * cellSize + gaps + padding + border
        const totalWidth = (gridSize * cellSize) + ((gridSize - 1) * 1) + 20 + 4;
        const playerInfo = document.querySelector('.player-info');
        if (playerInfo) {
            playerInfo.style.width = `${totalWidth}px`;
            // Add classes for grid size to adjust player name styling
            if (gridSize === 10) {
                playerInfo.classList.add('small-grid');
                playerInfo.classList.remove('medium-grid');
            } else if (gridSize === 12) {
                playerInfo.classList.add('medium-grid');
                playerInfo.classList.remove('small-grid');
            } else {
                playerInfo.classList.remove('small-grid', 'medium-grid');
            }
        }
    }
    game.currentPlayer = 0;
    game.marketplace = [];
    game.selectedPiece = null;
    game.pieceRotation = 0;
    game.pieceFlipped = false;
    game.gameOver = false;
    game.firstPiecePlaced = false;
    game.moveHistory = [];
    game.isPlacingPiece = false;
    
    game.players = [];
    for (let i = 0; i < playerCount; i++) {
        game.players.push({
            name: `Player ${i + 1}`,
            score: 0,
            color: COLORS[i % COLORS.length]
        });
    }
    
    // Fill marketplace
    for (let i = 0; i < MARKETPLACE_SIZE; i++) {
        game.marketplace.push(generateRandomPiece());
    }
    
    render();
}

function canPlacePiece(piece, row, col) {
    const shape = piece.shape;
    
    // Check boundaries
    if (row < 0 || col < 0 ||
        row + shape.length > game.gridSize ||
        col + shape[0].length > game.gridSize) {
        return false;
    }
    
    // Check overlap
    for (let i = 0; i < shape.length; i++) {
        for (let j = 0; j < shape[0].length; j++) {
            if (shape[i][j] && game.grid[row + i][col + j]) {
                return false;
            }
        }
    }
    
    // If first piece, can place anywhere
    if (!game.firstPiecePlaced) {
        return true;
    }
    
    // Check if piece touches existing pieces
    let touches = false;
    for (let i = 0; i < shape.length; i++) {
        for (let j = 0; j < shape[0].length; j++) {
            if (shape[i][j]) {
                // Check all four directions
                const neighbors = [
                    [row + i - 1, col + j],
                    [row + i + 1, col + j],
                    [row + i, col + j - 1],
                    [row + i, col + j + 1]
                ];
                
                for (const [nr, nc] of neighbors) {
                    if (nr >= 0 && nr < game.gridSize &&
                        nc >= 0 && nc < game.gridSize &&
                        game.grid[nr][nc]) {
                        touches = true;
                        break;
                    }
                }
            }
        }
    }
    
    return touches;
}

function placePiece(piece, row, col) {
    const shape = piece.shape;
    
    // Save current state for undo
    const moveState = {
        grid: JSON.parse(JSON.stringify(game.grid)),
        currentPlayer: game.currentPlayer,
        marketplace: JSON.parse(JSON.stringify(game.marketplace)),
        players: JSON.parse(JSON.stringify(game.players)),
        piece: { ...piece },
        row: row,
        col: col
    };
    
    // Check which groups exist and are enclosed BEFORE placing the piece
    const groupsBeforePlacement = getAllGroupsStatus();
    
    // Place the piece
    for (let i = 0; i < shape.length; i++) {
        for (let j = 0; j < shape[0].length; j++) {
            if (shape[i][j]) {
                game.grid[row + i][col + j] = {
                    color: piece.color,
                    pattern: piece.pattern,
                    player: game.currentPlayer
                };
                
                // Immediately update the DOM cell to add filled class and styling
                const cellElement = document.querySelector(`[data-row="${row + i}"][data-col="${col + j}"]`);
                if (cellElement) {
                    cellElement.classList.add('filled', `pattern-${piece.pattern}`);
                    if (!document.body.classList.contains('desaturated')) {
                        cellElement.style.backgroundColor = piece.color;
                    }
                }
            }
        }
    }
    
    // Play place sound
    playPlaceSound();
    
    game.firstPiecePlaced = true;
    
    // Check which groups exist and are enclosed AFTER placing the piece
    const groupsAfterPlacement = getAllGroupsStatus();
    
    // Score only groups that became enclosed with this placement
    let score = 0;
    let enclosedGroups = [];
    for (const [groupKey, groupData] of groupsAfterPlacement) {
        const wasEnclosedBefore = groupsBeforePlacement.has(groupKey) && 
                                 groupsBeforePlacement.get(groupKey).enclosed;
        const isEnclosedNow = groupData.enclosed;
        
        // Score if the group just became enclosed with this move
        if (!wasEnclosedBefore && isEnclosedNow) {
            score += groupData.size;
            enclosedGroups.push(groupData.cells);
        }
    }
    
    // Mark captured areas with appropriate animation
    if (enclosedGroups.length > 0) {
        const isMultiple = enclosedGroups.length > 1;
        console.log('Found enclosed groups:', enclosedGroups.length, 'multiple:', isMultiple);
        if (isMultiple) {
            markMultipleAreasCaptured(enclosedGroups);
        } else {
            markAreaCaptured(enclosedGroups[0], false);
        }
    }
    
    if (score > 0) {
        // Play success sound
        playSuccessSound();
        
        const oldScore = game.players[game.currentPlayer].score;
        game.players[game.currentPlayer].score += score;
        
        // Trigger count-up animation for the score display
        const playerIndex = game.currentPlayer;
        console.log(`Player ${playerIndex} earned ${score} points. Old score: ${oldScore}, New score: ${game.players[playerIndex].score}`);
        setTimeout(() => {
            const playerScoreDiv = document.querySelectorAll('.player-score')[playerIndex];
            if (playerScoreDiv) {
                const scoreElement = playerScoreDiv.querySelector('span');
                if (scoreElement) {
                    console.log(`Found score element for player ${playerIndex}, triggering animation`);
                    animateScoreCountUp(scoreElement, oldScore, game.players[playerIndex].score);
                } else {
                    console.log(`Score element not found for player ${playerIndex}`);
                }
            } else {
                console.log(`Player score div not found for player ${playerIndex}`);
            }
        }, 100); // Small delay to ensure DOM is updated
        
        // Calculate the center position of the placed piece for the score popup
        const pieceCenterRow = row + Math.floor(piece.shape.length / 2);
        const pieceCenterCol = col + Math.floor(piece.shape[0].length / 2);
        showScorePopup(score, pieceCenterRow, pieceCenterCol);
    }
    
    // Remove piece from marketplace and add new one
    const index = game.marketplace.findIndex(p => p.id === piece.id);
    game.marketplace[index] = generateRandomPiece();
    
    // Next player
    game.currentPlayer = (game.currentPlayer + 1) % game.players.length;
    game.selectedPiece = null;
    game.pieceRotation = 0;
    game.pieceFlipped = false;
    
    // Add move to history
    game.moveHistory.push(moveState);
    
    // Check if game is over, but wait for score animation if there was a score
    if (!canAnyPieceBePlaced()) {
        if (score > 0) {
            // Wait for score animation to complete before ending game
            setTimeout(() => {
                endGame();
            }, 1500); // Match the duration of animateScoreCountUp
        } else {
            endGame();
        }
    }
    
    // Don't render immediately to preserve animation
    // Only render players and marketplace, not the board
    renderPlayers();
    renderMarketplace();
    
    // Render board after animation completes
    setTimeout(() => {
        renderBoard();
    }, isMultiple ? 1000 : 2000);
}

function getAllGroupsStatus() {
    const groupsStatus = new Map();
    
    // Check all color groups
    for (let color of COLORS) {
        const colorGroups = findAllGroups('color', color);
        for (const group of colorGroups) {
            const groupKey = getGroupKey(group, 'color', color);
            const enclosed = isGroupCompletelyEnclosed(group, 'color', color);
            groupsStatus.set(groupKey, {
                cells: group,
                enclosed: enclosed,
                size: group.length
            });
        }
    }
    
    // Check all pattern groups
    for (let pattern of PATTERNS) {
        const patternGroups = findAllGroups('pattern', pattern);
        for (const group of patternGroups) {
            const groupKey = getGroupKey(group, 'pattern', pattern);
            const enclosed = isGroupCompletelyEnclosed(group, 'pattern', pattern);
            groupsStatus.set(groupKey, {
                cells: group,
                enclosed: enclosed,
                size: group.length
            });
        }
    }
    
    return groupsStatus;
}

function getGroupKey(group, type, value) {
    // Create a unique key for each group based on its cells and type
    const sortedCells = group.sort((a, b) => {
        if (a[0] !== b[0]) return a[0] - b[0];
        return a[1] - b[1];
    });
    return `${type}-${value}-${sortedCells.map(c => `${c[0]},${c[1]}`).join(';')}`;
}

function findAllGroups(type, value) {
    const visited = Array(game.gridSize).fill().map(() => Array(game.gridSize).fill(false));
    const groups = [];

    for (let i = 0; i < game.gridSize; i++) {
        for (let j = 0; j < game.gridSize; j++) {
            if (game.grid[i][j] && game.grid[i][j][type] === value && !visited[i][j]) {
                const group = [];
                const queue = [[i, j]];
                
                while (queue.length > 0) {
                    const [row, col] = queue.shift();

                    if (row < 0 || row >= game.gridSize || col < 0 || col >= game.gridSize) continue;
                    if (visited[row][col]) continue;
                    if (!game.grid[row][col] || game.grid[row][col][type] !== value) continue;
                    
                    visited[row][col] = true;
                    group.push([row, col]);
                    
                    // Add adjacent cells
                    queue.push([row - 1, col], [row + 1, col], [row, col - 1], [row, col + 1]);
                }
                
                if (group.length > 0) {
                    groups.push(group);
                }
            }
        }
    }
    
    return groups;
}

function isGroupCompletelyEnclosed(group, type, value) {
    // For each cell in the group, check if it has any empty adjacent cells
    // or adjacent cells with different color/pattern
    for (const [row, col] of group) {
        const neighbors = [
            [row - 1, col], [row + 1, col],
            [row, col - 1], [row, col + 1]
        ];
        
        for (const [nr, nc] of neighbors) {
            // If neighbor is out of bounds, group can't expand there, so it's fine
            if (nr < 0 || nr >= game.gridSize || nc < 0 || nc >= game.gridSize) continue;
            
            // If neighbor is empty, the group could potentially expand
            if (!game.grid[nr][nc]) {
                return false;
            }
            
            // If neighbor has the same color/pattern, it should be part of the group
            // If it's not in the group, that means we haven't captured the full group yet
            if (game.grid[nr][nc][type] === value) {
                const isInGroup = group.some(([r, c]) => r === nr && c === nc);
                if (!isInGroup) {
                    return false;
                }
            }
            // If neighbor has different color/pattern, that's a valid boundary
        }
    }
    
    // All cells in the group are fully enclosed
    return true;
}

function markAreaCaptured(cells, isMultiple = false) {
    console.log('Marking area captured:', cells.length, 'cells, multiple:', isMultiple);
    
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
    }, 4000 + (cells.length * 30));
}

function markMultipleAreasCaptured(groupsArray) {
    console.log('Marking multiple areas captured:', groupsArray.length, 'groups');
    
    const totalAnimationTime = 4000; // 4 seconds total
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

function showScorePopup(score) {
    const popup = document.createElement('div');
    popup.className = 'score-popup';
    popup.textContent = `+${score}`;
    popup.style.left = '50%';
    popup.style.top = '50%';
    document.body.appendChild(popup);
    
    setTimeout(() => popup.remove(), 1000);
}

function canAnyPieceBePlaced() {
    for (const piece of game.marketplace) {
        // Check all combinations of rotation and flip
        for (let flip = 0; flip <= 1; flip++) {
            for (let rotation = 0; rotation < 4; rotation++) {
                let shape = piece.shape;
                
                if (flip) {
                    shape = flipMatrix(shape);
                }
                
                for (let r = 0; r < rotation; r++) {
                    shape = rotateMatrix(shape);
                }
                
                const tempPiece = { ...piece, shape };
                
                for (let i = 0; i < game.gridSize; i++) {
                    for (let j = 0; j < game.gridSize; j++) {
                        if (canPlacePiece(tempPiece, i, j)) {
                            return true;
                        }
                    }
                }
            }
        }
    }
    return false;
}

function undoLastMove() {
    if (game.moveHistory.length === 0 || game.gameOver) return;
    
    // Get the last move state
    const lastMove = game.moveHistory.pop();
    
    // Restore the game state
    game.grid = lastMove.grid;
    game.currentPlayer = lastMove.currentPlayer;
    game.marketplace = lastMove.marketplace;
    game.players = lastMove.players;
    game.selectedPiece = null;
    game.pieceRotation = 0;
    game.pieceFlipped = false;
    
    // Re-render the game
    render();
}

// Make undo function available globally
window.undoLastMove = undoLastMove;

function endGame() {
    game.gameOver = true;
    const winner = game.players.reduce((prev, current) => 
        prev.score > current.score ? prev : current
    );
    
    // Create backdrop
    const backdrop = document.createElement('div');
    backdrop.className = 'game-over-backdrop';
    
    const gameOverDiv = document.createElement('div');
    gameOverDiv.className = 'game-over';
    
    // Calculate progress percentages
    const maxScore = Math.max(...game.players.map(p => p.score));
    const progressData = game.players.map(p => ({
        name: p.name,
        score: p.score,
        percentage: maxScore > 0 ? (p.score / maxScore) * 100 : 0
    }));
    
    gameOverDiv.innerHTML = `
        <button class="game-over-close" onclick="this.parentElement.parentElement.remove();">
            <i class="ri-close-line"></i>
        </button>
        <div class="game-over-logo">
            <img src="pat2.svg" alt="Game Logo" class="game-over-logo-img">
        </div>
        <h3 class="game-over-winner">${winner.name} Wins</h3>
        <div class="final-scores">
            ${progressData.map(p => `
                <div class="final-score-item">
                    <span class="player-name">${p.name}</span>
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${p.percentage}%"></div>
                    </div>
                    <span class="final-score-value">${p.score}</span>
                </div>
            `).join('')}
        </div>
        <button class="play-again-btn group relative" onclick="initGame(); this.parentElement.parentElement.remove();">
            <i class="ri-refresh-line"></i>
            <span class="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 text-xs text-white bg-gray-900 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-50">Play Again</span>
        </button>
    `;
    
    backdrop.appendChild(gameOverDiv);
    document.body.appendChild(backdrop);
}

 