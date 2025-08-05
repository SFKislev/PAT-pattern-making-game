// Game state
let game = {
    grid: Array(GRID_SIZE).fill().map(() => Array(GRID_SIZE).fill(null)),
    players: [],
    currentPlayer: 0,
    marketplace: [],
    selectedPiece: null,
    pieceRotation: 0,
    pieceFlipped: false,
    gameOver: false,
    firstPiecePlaced: false
};

// Core game functions
function initGame() {
    game.grid = Array(GRID_SIZE).fill().map(() => Array(GRID_SIZE).fill(null));
    game.currentPlayer = 0;
    game.marketplace = [];
    game.selectedPiece = null;
    game.pieceRotation = 0;
    game.pieceFlipped = false;
    game.gameOver = false;
    game.firstPiecePlaced = false;
    
    const playerCount = parseInt(document.getElementById('playerCount').value);
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
        row + shape.length > GRID_SIZE || 
        col + shape[0].length > GRID_SIZE) {
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
                    if (nr >= 0 && nr < GRID_SIZE && 
                        nc >= 0 && nc < GRID_SIZE && 
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
            }
        }
    }
    
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
        game.players[game.currentPlayer].score += score;
        showScorePopup(score);
    }
    
    // Remove piece from marketplace and add new one
    const index = game.marketplace.findIndex(p => p.id === piece.id);
    game.marketplace[index] = generateRandomPiece();
    
    // Next player
    game.currentPlayer = (game.currentPlayer + 1) % game.players.length;
    game.selectedPiece = null;
    game.pieceRotation = 0;
    game.pieceFlipped = false;
    
    // Check if game is over
    if (!canAnyPieceBePlaced()) {
        endGame();
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
    const visited = Array(GRID_SIZE).fill().map(() => Array(GRID_SIZE).fill(false));
    const groups = [];
    
    for (let i = 0; i < GRID_SIZE; i++) {
        for (let j = 0; j < GRID_SIZE; j++) {
            if (game.grid[i][j] && game.grid[i][j][type] === value && !visited[i][j]) {
                const group = [];
                const queue = [[i, j]];
                
                while (queue.length > 0) {
                    const [row, col] = queue.shift();
                    
                    if (row < 0 || row >= GRID_SIZE || col < 0 || col >= GRID_SIZE) continue;
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
            if (nr < 0 || nr >= GRID_SIZE || nc < 0 || nc >= GRID_SIZE) continue;
            
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
    }, 2000 + (cells.length * 30));
}

function markMultipleAreasCaptured(groupsArray) {
    console.log('Marking multiple areas captured:', groupsArray.length, 'groups');
    
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
                
                for (let i = 0; i < GRID_SIZE; i++) {
                    for (let j = 0; j < GRID_SIZE; j++) {
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

function endGame() {
    game.gameOver = true;
    const winner = game.players.reduce((prev, current) => 
        prev.score > current.score ? prev : current
    );
    
    const gameOverDiv = document.createElement('div');
    gameOverDiv.className = 'game-over';
    gameOverDiv.innerHTML = `
        <h2>Game Over!</h2>
        <h3>${winner.name} Wins!</h3>
        <div class="final-scores">
            ${game.players.map(p => `
                <div>${p.name}: ${p.score} points</div>
            `).join('')}
        </div>
        <button onclick="initGame(); this.parentElement.remove();">Play Again</button>
    `;
    document.body.appendChild(gameOverDiv);
} 