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
                // Only set inline color if not in desaturated mode
                if (!document.body.classList.contains('desaturated')) {
                    cell.style.backgroundColor = gridCell.color;
                } else {
                    cell.style.backgroundColor = '';
                }
                cell.classList.add(`pattern-${gridCell.pattern}`, 'filled');
            }
            
            cell.addEventListener('click', () => handleCellClick(i, j));
            cell.addEventListener('mouseenter', () => handleCellHover(i, j));
            cell.addEventListener('mouseleave', () => handleCellLeave());
            
            // Add drag and drop functionality
            cell.addEventListener('dragover', (e) => {
                e.preventDefault();
            });
            cell.addEventListener('drop', (e) => {
                e.preventDefault();
                const pieceId = e.dataTransfer.getData('text/plain');
                const piece = game.marketplace.find(p => p.id === pieceId);
                if (piece) {
                    selectPiece(piece);
                    handleCellClick(i, j);
                }
            });
            
            boardEl.appendChild(cell);
        }
    }
}

// Generate random gradient colors for player avatars
function generateRandomGradient() {
    const gradients = [
        'linear-gradient(135deg, #e5e7eb, #d1d5db)',
        'linear-gradient(135deg, #9ca3af, #6b7280)',
        'linear-gradient(135deg, #f3f4f6, #e5e7eb)',
        'linear-gradient(135deg, #6b7280, #4b5563)',
        'linear-gradient(135deg, #d1d5db, #9ca3af)',
        'linear-gradient(135deg, #f9fafb, #f3f4f6)',
        'linear-gradient(135deg, #4b5563, #374151)',
        'linear-gradient(135deg, #e5e7eb, #d1d5db)',
        'linear-gradient(135deg, #9ca3af, #6b7280)',
        'linear-gradient(135deg, #f3f4f6, #e5e7eb)',
        'linear-gradient(135deg, #6b7280, #4b5563)',
        'linear-gradient(135deg, #d1d5db, #9ca3af)'
    ];
    
    return gradients[Math.floor(Math.random() * gradients.length)];
}

function renderPlayers() {
    const playerInfoEl = document.getElementById('playerInfo');
    
    // Ensure all players have different gradients
    const usedGradients = new Set();
    game.players.forEach((player, index) => {
        if (!player.avatarGradient) {
            let gradient;
            do {
                gradient = generateRandomGradient();
            } while (usedGradients.has(gradient));
            player.avatarGradient = gradient;
            usedGradients.add(gradient);
        }
    });
    
    playerInfoEl.innerHTML = game.players.map((player, index) => {
        return `
            <div class="player-score ${index === game.currentPlayer ? 'active' : ''}">
                <div class="player-avatar" style="background: ${player.avatarGradient}"></div>
                <input type="text" class="player-name-input" value="${player.name}" data-player-index="${index}" placeholder="Player ${index + 1}">
                <span>${player.score}</span>
            </div>
        `;
    }).join('');
    
    // Add event listeners for name editing
    document.querySelectorAll('.player-name-input').forEach(input => {
        input.addEventListener('blur', function() {
            const playerIndex = parseInt(this.dataset.playerIndex);
            const newName = this.value.trim() || `Player ${playerIndex + 1}`;
            game.players[playerIndex].name = newName;
            this.value = newName;
        });
        
        input.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                this.blur();
            }
        });
    });
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
        
        // Add drag functionality
        pieceEl.draggable = true;
        pieceEl.addEventListener('dragstart', (e) => {
            e.dataTransfer.setData('text/plain', piece.id);
            selectPiece(piece);
        });
        
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
    const isColorGroupClosed = isGroupCompletelyEnclosed(colorGroup, 'color', hoveredCell.color);
    
    // Find pattern group
    const patternGroup = findGroup(row, col, 'pattern', hoveredCell.pattern);
    const isPatternGroupClosed = isGroupCompletelyEnclosed(patternGroup, 'pattern', hoveredCell.pattern);
    
    // Check if groups are identical (same cells)
    const colorGroupSet = new Set(colorGroup.map(([r, c]) => `${r},${c}`));
    const patternGroupSet = new Set(patternGroup.map(([r, c]) => `${r},${c}`));
    const groupsIdentical = colorGroupSet.size === patternGroupSet.size && 
                           [...colorGroupSet].every(cell => patternGroupSet.has(cell));
    
    // Store group data for alternating overlay
    const groupData = {
        colorGroup,
        patternGroup,
        colorGroupSet,
        patternGroupSet,
        groupsIdentical,
        isColorGroupClosed,
        isPatternGroupClosed
    };
    
    // Start alternating overlay animation (tooltips will be handled by the alternating function)
    startAlternatingOverlay(groupData);
}

function startAlternatingOverlay(groupData) {
    // Clear any existing overlay intervals
    if (window.overlayInterval) {
        clearInterval(window.overlayInterval);
    }
    
    // Clear any existing overlays and tooltips
    clearAllOverlays();
    clearAllTooltips();
    
    let showColor = true;
    
    // Function to apply current overlay and tooltip
    const applyOverlayAndTooltip = () => {
        clearAllOverlays();
        clearAllTooltips();
        
        if (groupData.groupsIdentical) {
            // If groups are identical, show color overlay and tooltip
            applyColorOverlay(groupData.colorGroup);
            showGroupTooltip(groupData.colorGroup, 'both', groupData.colorGroup.length, groupData.isColorGroupClosed);
        } else {
            // Alternate between color and pattern overlays and tooltips
            if (showColor) {
                applyColorOverlay(groupData.colorGroup);
                showGroupTooltip(groupData.colorGroup, 'color', groupData.colorGroup.length, groupData.isColorGroupClosed);
            } else {
                applyPatternOverlay(groupData.patternGroup);
                showGroupTooltip(groupData.patternGroup, 'pattern', groupData.patternGroup.length, groupData.isPatternGroupClosed);
            }
            showColor = !showColor;
        }
    };
    
    // Apply initial overlay and tooltip
    applyOverlayAndTooltip();
    
    // Set up interval for alternating (only if groups are not identical)
    if (!groupData.groupsIdentical) {
        window.overlayInterval = setInterval(applyOverlayAndTooltip, 1000);
    }
}

function applyColorOverlay(colorGroup) {
    colorGroup.forEach(([row, col]) => {
        const cell = document.querySelector(`[data-row="${row}"][data-col="${col}"]`);
        if (cell) {
            cell.classList.add('group-overlay-color');
        }
    });
}

function applyPatternOverlay(patternGroup) {
    patternGroup.forEach(([row, col]) => {
        const cell = document.querySelector(`[data-row="${row}"][data-col="${col}"]`);
        if (cell) {
            cell.classList.add('group-overlay-pattern');
        }
    });
}

function clearAllOverlays() {
    document.querySelectorAll('.cell').forEach(cell => {
        cell.classList.remove('group-overlay-color', 'group-overlay-pattern');
    });
}

function clearAllTooltips() {
    document.querySelectorAll('.group-tooltip').forEach(tooltip => {
        tooltip.remove();
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

function showNonOverlappingTooltips(colorGroup, patternGroup, isColorGroupClosed, isPatternGroupClosed) {
    const colorEdges = findGroupExtremes(colorGroup);
    const patternEdges = findGroupExtremes(patternGroup);
    
    // Define position priority order for each tooltip
    const positionPairs = [
        ['right', 'left'],     // Color right, pattern left
        ['bottom', 'top'],     // Color bottom, pattern top  
        ['right', 'bottom'],   // Color right, pattern bottom
        ['left', 'right'],     // Color left, pattern right
        ['top', 'bottom'],     // Color top, pattern bottom
        ['left', 'top']        // Color left, pattern top
    ];
    
    // Try each position pair until we find one that works for both groups
    let colorPosition, patternPosition, colorCell, patternCell;
    
    for (const [colorPos, patternPos] of positionPairs) {
        const colorCells = getEdgeCells(colorEdges, colorPos);
        const patternCells = getEdgeCells(patternEdges, patternPos);
        
        if (colorCells.length > 0 && patternCells.length > 0) {
            colorPosition = colorPos;
            patternPosition = patternPos;
            colorCell = colorCells[Math.floor(colorCells.length / 2)];
            patternCell = patternCells[Math.floor(patternCells.length / 2)];
            break;
        }
    }
    
    // Fallback - use any available positions
    if (!colorPosition || !patternPosition) {
        colorPosition = 'right';
        patternPosition = 'bottom';
        colorCell = colorGroup[0];
        patternCell = patternGroup[0];
    }
    
    // Create both tooltips
    createTooltip(colorCell, colorGroup.length, 'color', isColorGroupClosed, colorPosition);
    createTooltip(patternCell, patternGroup.length, 'pattern', isPatternGroupClosed, patternPosition);
}

function getEdgeCells(edges, position) {
    switch (position) {
        case 'right': return edges.rightmost || [];
        case 'left': return edges.leftmost || [];
        case 'top': return edges.topmost || [];
        case 'bottom': return edges.bottommost || [];
        default: return [];
    }
}

function showGroupTooltip(group, groupType, value, isClosed) {
    // Find the extreme edges of the group
    const edges = findGroupExtremes(group);
    
    // Choose positioning - prefer right/bottom edges for visibility
    let targetCell, position;
    if (edges.rightmost.length > 0) {
        targetCell = edges.rightmost[Math.floor(edges.rightmost.length / 2)];
        position = 'right';
    } else if (edges.bottommost.length > 0) {
        targetCell = edges.bottommost[Math.floor(edges.bottommost.length / 2)];
        position = 'bottom';
    } else if (edges.leftmost.length > 0) {
        targetCell = edges.leftmost[Math.floor(edges.leftmost.length / 2)];
        position = 'left';
    } else {
        targetCell = edges.topmost[Math.floor(edges.topmost.length / 2)];
        position = 'top';
    }
    
    createTooltip(targetCell, value, groupType, isClosed, position);
}

function createTooltip(targetCell, value, groupType, isClosed, position) {
    const [row, col] = targetCell;
    const cell = document.querySelector(`[data-row="${row}"][data-col="${col}"]`);
    if (!cell) return;
    
    // Create tooltip
    const tooltip = document.createElement('div');
    tooltip.className = `group-tooltip ${groupType}-group ${isClosed ? 'closed' : 'open'}`;
    tooltip.setAttribute('data-position', position);
    
    // Create icon element
    const icon = document.createElement('i');
    if (groupType === 'color') {
        icon.className = 'ri-palette-line';
    } else if (groupType === 'pattern') {
        icon.className = 'ri-layout-grid-line';
    } else {
        // For 'both' type, use a combined icon
        icon.className = 'ri-layout-masonry-line';
    }
    
    // Create text element
    const text = document.createElement('span');
    text.textContent = value;
    
    // Append icon and text to tooltip
    tooltip.appendChild(icon);
    tooltip.appendChild(text);
    
    // Position tooltip relative to cell
    const cellRect = cell.getBoundingClientRect();
    const gameBoard = document.getElementById('gameBoard');
    const boardRect = gameBoard.getBoundingClientRect();
    
    // Position relative to game board
    const cellRelativeX = cellRect.left - boardRect.left;
    const cellRelativeY = cellRect.top - boardRect.top;
    
    switch (position) {
        case 'right':
            tooltip.style.left = `${cellRelativeX + cellRect.width}px`;
            tooltip.style.top = `${cellRelativeY + cellRect.height / 2}px`;
            tooltip.style.transform = 'translateY(-50%)';
            break;
        case 'bottom':
            tooltip.style.left = `${cellRelativeX + cellRect.width / 2}px`;
            tooltip.style.top = `${cellRelativeY + cellRect.height}px`;
            tooltip.style.transform = 'translateX(-50%)';
            break;
        case 'left':
            tooltip.style.right = `${boardRect.width - cellRelativeX}px`;
            tooltip.style.top = `${cellRelativeY + cellRect.height / 2}px`;
            tooltip.style.transform = 'translateY(-50%)';
            break;
        case 'top':
            tooltip.style.left = `${cellRelativeX + cellRect.width / 2}px`;
            tooltip.style.bottom = `${boardRect.height - cellRelativeY}px`;
            tooltip.style.transform = 'translateX(-50%)';
            break;
    }
    
    gameBoard.appendChild(tooltip);
}

function findGroupExtremes(group) {
    if (group.length === 0) return { topmost: [], bottommost: [], leftmost: [], rightmost: [] };
    
    let minRow = Infinity, maxRow = -Infinity;
    let minCol = Infinity, maxCol = -Infinity;
    
    // Find extremes
    group.forEach(([row, col]) => {
        minRow = Math.min(minRow, row);
        maxRow = Math.max(maxRow, row);
        minCol = Math.min(minCol, col);
        maxCol = Math.max(maxCol, col);
    });
    
    // Find all cells at each extreme
    const topmost = group.filter(([row, col]) => row === minRow);
    const bottommost = group.filter(([row, col]) => row === maxRow);
    const leftmost = group.filter(([row, col]) => col === minCol);
    const rightmost = group.filter(([row, col]) => col === maxCol);
    
    return { topmost, bottommost, leftmost, rightmost };
}

function handleCellLeave() {
    // Only clear highlights if we're highlighting groups (not placing pieces)
    if (!game.selectedPiece) {
        // Clear the alternating overlay interval
        if (window.overlayInterval) {
            clearInterval(window.overlayInterval);
            window.overlayInterval = null;
        }
        
        document.querySelectorAll('.cell').forEach(cell => {
            // Remove old classes (backwards compatibility)
            cell.classList.remove(
                'highlight-edge-color', 
                'highlight-edge-pattern', 
                'highlight-edge-both'
            );
            
            // Remove all overlay classes
            cell.classList.remove('group-overlay-color', 'group-overlay-pattern');
        });
        
        // Remove all tooltips
        clearAllTooltips();
    }
} 