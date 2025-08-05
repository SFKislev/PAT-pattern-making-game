// Rendering functions
function render() {
    renderBoard();
    renderPlayers();
    renderMarketplace();
}

function renderBoard() {
    const boardEl = document.getElementById('gameBoard');
    boardEl.innerHTML = '';
    
    for (let i = 0; i < GRID_SIZE; i++) {
        for (let j = 0; j < GRID_SIZE; j++) {
            const cell = document.createElement('div');
            cell.className = 'cell';
            cell.dataset.row = i;
            cell.dataset.col = j;
            
            const gridCell = game.grid[i][j];
            if (gridCell) {
                cell.style.backgroundColor = gridCell.color;
                cell.classList.add(`pattern-${gridCell.pattern}`, 'filled');
            }
            
            cell.addEventListener('click', () => handleCellClick(i, j));
            cell.addEventListener('mouseenter', () => handleCellHover(i, j));
            cell.addEventListener('mouseleave', () => handleCellLeave());
            
            boardEl.appendChild(cell);
        }
    }
}

function renderPlayers() {
    const playerInfoEl = document.getElementById('playerInfo');
    playerInfoEl.innerHTML = game.players.map((player, index) => `
        <div class="player-score ${index === game.currentPlayer ? 'active' : ''}">
            <span class="player-name" style="color: ${player.color}">${player.name}</span>
            <span>${player.score}</span>
        </div>
    `).join('');
}

function renderMarketplace() {
    const marketplaceEl = document.getElementById('marketplace');
    marketplaceEl.innerHTML = '';
    
    game.marketplace.forEach((piece) => {
        const pieceEl = document.createElement('div');
        pieceEl.className = 'piece';
        pieceEl.setAttribute('data-piece-id', piece.id);
        if (game.selectedPiece && game.selectedPiece.id === piece.id) {
            pieceEl.classList.add('selected');
        }
        
        const gridEl = document.createElement('div');
        gridEl.className = 'piece-grid';
        
        piece.shape.forEach(row => {
            const rowEl = document.createElement('div');
            rowEl.className = 'piece-row';
            
            row.forEach(cell => {
                const cellEl = document.createElement('div');
                cellEl.className = 'piece-cell';
                if (cell) {
                    cellEl.style.backgroundColor = piece.color;
                    cellEl.classList.add(`pattern-${piece.pattern}`);
                }
                rowEl.appendChild(cellEl);
            });
            
            gridEl.appendChild(rowEl);
        });
        
        pieceEl.appendChild(gridEl);
        pieceEl.addEventListener('click', () => selectPiece(piece));
        
        marketplaceEl.appendChild(pieceEl);
    });
}

function selectPiece(piece) {
    if (game.gameOver) return;
    
    // Only reset rotation/flip if selecting a new piece
    if (!game.selectedPiece || game.selectedPiece.id !== piece.id) {
        game.pieceRotation = 0;
        game.pieceFlipped = false;
    }
    
    game.selectedPiece = piece;
    render();
}

function handleCellClick(row, col) {
    if (!game.selectedPiece || game.gameOver) return;
    
    // Get transformed shape
    const shape = getTransformedShape(game.selectedPiece);
    const piece = { ...game.selectedPiece, shape };
    
    if (canPlacePiece(piece, row, col)) {
        placePiece(piece, row, col);
    }
}

function handleCellHover(row, col) {
    // Clear all previous highlights
    document.querySelectorAll('.cell').forEach(cell => {
        cell.classList.remove('preview', 'invalid', 'highlight-edge-color', 'highlight-edge-pattern', 'highlight-edge-both');
        if (!game.grid[cell.dataset.row][cell.dataset.col]) {
            cell.style.backgroundColor = '';
            const r = parseInt(cell.dataset.row);
            const c = parseInt(cell.dataset.col);
            if (!game.grid[r][c]) {
                cell.className = 'cell';
            }
        }
    });

    // If hovering over a placed piece and no piece is selected, highlight its groups
    if (game.grid[row][col] && !game.selectedPiece) {
        highlightGroups(row, col);
        return;
    }

    // Original hover logic for placing pieces
    if (!game.selectedPiece || game.gameOver) return;
    
    // Get transformed shape
    const shape = getTransformedShape(game.selectedPiece);
    const piece = { ...game.selectedPiece, shape };
    const canPlace = canPlacePiece(piece, row, col);
    
    // Show preview for ALL cells of the piece, even over filled cells
    for (let i = 0; i < shape.length; i++) {
        for (let j = 0; j < shape[0].length; j++) {
            if (shape[i][j] && 
                row + i < GRID_SIZE && 
                col + j < GRID_SIZE &&
                row + i >= 0 &&
                col + j >= 0) {
                const cell = document.querySelector(
                    `[data-row="${row + i}"][data-col="${col + j}"]`
                );
                if (cell) {
                    // Save original state if cell is filled
                    const isFilled = game.grid[row + i][col + j];
                    
                    cell.classList.add('preview');
                    if (!canPlace) {
                        cell.classList.add('invalid');
                    }
                    
                    // Only change color for empty cells
                    if (!isFilled) {
                        cell.style.backgroundColor = game.selectedPiece.color;
                        cell.classList.add(`pattern-${game.selectedPiece.pattern}`);
                    }
                }
            }
        }
    }
}

function highlightGroups(row, col) {
    const hoveredCell = game.grid[row][col];
    if (!hoveredCell) return;

    // Find color group
    const colorGroup = findGroup(row, col, 'color', hoveredCell.color);
    const colorEdges = findGroupEdges(colorGroup, 'color', hoveredCell.color);

    // Find pattern group
    const patternGroup = findGroup(row, col, 'pattern', hoveredCell.pattern);
    const patternEdges = findGroupEdges(patternGroup, 'pattern', hoveredCell.pattern);

    // Apply highlights
    colorEdges.forEach(([r, c]) => {
        const cell = document.querySelector(`[data-row="${r}"][data-col="${c}"]`);
        if (cell) {
            if (patternEdges.some(([pr, pc]) => pr === r && pc === c)) {
                cell.classList.add('highlight-edge-both');
            } else {
                cell.classList.add('highlight-edge-color');
            }
        }
    });

    patternEdges.forEach(([r, c]) => {
        const cell = document.querySelector(`[data-row="${r}"][data-col="${c}"]`);
        if (cell && !cell.classList.contains('highlight-edge-both')) {
            cell.classList.add('highlight-edge-pattern');
        }
    });
}

function findGroup(startRow, startCol, type, value) {
    const visited = new Set();
    const group = [];
    const queue = [[startRow, startCol]];

    while (queue.length > 0) {
        const [row, col] = queue.shift();
        const key = `${row},${col}`;

        if (visited.has(key)) continue;
        visited.add(key);

        if (row < 0 || row >= GRID_SIZE || col < 0 || col >= GRID_SIZE) continue;
        if (!game.grid[row][col] || game.grid[row][col][type] !== value) continue;

        group.push([row, col]);

        // Add neighbors
        queue.push([row - 1, col], [row + 1, col], [row, col - 1], [row, col + 1]);
    }

    return group;
}

function findGroupEdges(group, type, value) {
    const edges = [];
    const groupSet = new Set(group.map(([r, c]) => `${r},${c}`));

    for (const [row, col] of group) {
        const neighbors = [
            [row - 1, col], [row + 1, col],
            [row, col - 1], [row, col + 1]
        ];

        let isEdge = false;
        for (const [nr, nc] of neighbors) {
            // Check if neighbor is outside bounds or not part of the group
            if (nr < 0 || nr >= GRID_SIZE || nc < 0 || nc >= GRID_SIZE ||
                !game.grid[nr][nc] || game.grid[nr][nc][type] !== value) {
                isEdge = true;
                break;
            }
        }

        if (isEdge) {
            edges.push([row, col]);
        }
    }

    return edges;
}

function handleCellLeave() {
    // Only clear highlights if we're highlighting groups (not placing pieces)
    if (!game.selectedPiece) {
        document.querySelectorAll('.cell').forEach(cell => {
            cell.classList.remove('highlight-edge-color', 'highlight-edge-pattern', 'highlight-edge-both');
        });
    }
} 