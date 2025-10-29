// Game constants
const GRID_SIZE = 14;
const MARKETPLACE_SIZE = 7;
const COLORS = ['#4A90E2', '#E74C3C', '#F2E642']; // Blue, Red, Yellow
const PATTERNS = ['dots', 'boxes', 'diagonals'];

// Tetris-like shapes - expanded set
const SHAPES = [
    [[1, 1, 1, 1]], // I
    [[1, 1], [1, 1]], // O
    [[1, 1, 1], [0, 1, 0]], // T
    [[1, 1, 0], [0, 1, 1]], // S
    [[0, 1, 1], [1, 1, 0]], // Z
    [[1, 1, 1], [1, 0, 0]], // L
    [[1, 1, 1], [0, 0, 1]], // J
    [[1]], // Single
    [[1, 1]], // Double
    [[1, 1, 1]], // Triple
    [[1, 0], [1, 1]], // Small L
    [[1, 1, 0], [0, 1, 0], [0, 1, 1]], // Complex S
    [[1, 0, 1], [1, 1, 1]], // U
    [[1, 1, 1], [1, 0, 1]], // Inverted U
    [[1, 1], [0, 1], [0, 1]], // Long L
    [[1, 0, 0], [1, 1, 1]], // Different L
    [[0, 0, 1], [1, 1, 1]], // Different J
    [[1, 1, 1, 1, 1]], // Long I
    [[1, 1, 1], [0, 1, 0], [0, 1, 0]], // Tree
    [[1, 0], [1, 1], [1, 0]], // Small T
    [[1, 1, 0], [0, 1, 1], [0, 0, 1]], // Diagonal
    [[1, 1, 1], [1, 1, 1]], // 2x3 rectangle
    [[1, 1], [1, 1], [1, 1]], // 3x2 rectangle
    [[1, 0, 0], [1, 0, 0], [1, 1, 1]], // Big L
    [[0, 1], [1, 1], [1, 0]], // S variant
    [[1, 1, 1, 1], [0, 1, 0, 0]], // T with tail
    [[1, 1, 0, 0], [0, 1, 1, 1]], // Lightning
    [[1, 0, 1, 0], [1, 1, 1, 1]], // Comb
    [[1, 1, 1], [0, 1, 0], [1, 1, 1]], // Plus
];

// Piece manipulation functions
function rotateMatrix(matrix) {
    const rows = matrix.length;
    const cols = matrix[0].length;
    const rotated = Array(cols).fill().map(() => Array(rows).fill(0));
    
    for (let i = 0; i < rows; i++) {
        for (let j = 0; j < cols; j++) {
            rotated[j][rows - 1 - i] = matrix[i][j];
        }
    }
    return rotated;
}

function flipMatrix(matrix) {
    // Flip horizontally
    return matrix.map(row => [...row].reverse());
}

function getTransformedShape(piece) {
    let shape = piece.shape;
    
    // Apply flip first if needed
    if (game.pieceFlipped) {
        shape = flipMatrix(shape);
    }
    
    // Then apply rotation
    for (let i = 0; i < game.pieceRotation; i++) {
        shape = rotateMatrix(shape);
    }
    
    return shape;
}

function generateRandomPiece() {
    // Calculate grid fill percentage
    let filledCells = 0;
    for (let i = 0; i < game.gridSize; i++) {
        for (let j = 0; j < game.gridSize; j++) {
            if (game.grid[i][j]) filledCells++;
        }
    }
    const fillPercentage = (filledCells / (game.gridSize * game.gridSize)) * 100;
    
    // Filter shapes based on fill percentage
    let availableShapes;
    if (fillPercentage >= 85) {
        // After 85% full: only tiny pieces (1-3 cells)
        availableShapes = SHAPES.filter(shape => {
            const cellCount = shape.flat().filter(cell => cell === 1).length;
            return cellCount <= 3;
        });
    } else if (fillPercentage >= 60) {
        // Between 60-75% full: exclude large pieces (5+ cells)
        availableShapes = SHAPES.filter(shape => {
            const cellCount = shape.flat().filter(cell => cell === 1).length;
            return cellCount < 5;
        });
    } else {
        // Before 60% full: exclude small pieces (1-2 cells)
        availableShapes = SHAPES.filter(shape => {
            const cellCount = shape.flat().filter(cell => cell === 1).length;
            return cellCount > 2;
        });
    }
    
    // If no shapes match criteria (shouldn't happen with our set), use all shapes
    if (availableShapes.length === 0) {
        availableShapes = SHAPES;
    }
    
    return {
        shape: availableShapes[Math.floor(Math.random() * availableShapes.length)],
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        pattern: PATTERNS[Math.floor(Math.random() * PATTERNS.length)],
        id: Date.now() + Math.random()
    };
} 