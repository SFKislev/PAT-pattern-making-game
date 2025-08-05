# Tetris Piece Scattering System

## Overview
This document describes the implementation of a scattered piece marketplace for the Tetris game, where pieces are randomly positioned around the main game board instead of being arranged in a traditional bottom marketplace.

## Design Philosophy
- **Natural Look**: Pieces appear as if they were physically scattered around a large table
- **No UI Interference**: Pieces maintain safe distances from game controls and UI elements
- **Clean Appearance**: No card-like containers - just the raw game pieces with transparent backgrounds
- **Stable Positioning**: Once placed, pieces maintain their positions when new pieces are added

## Layout Structure

### HTML Structure
```html
<div class="game-area">
    <!-- Left Scattered Area -->
    <div class="scattered-area left-area" id="leftArea"></div>
    
    <div class="game-board-container">
        <!-- Game board and controls -->
    </div>
    
    <!-- Right Scattered Area -->
    <div class="scattered-area right-area" id="rightArea"></div>
</div>
```

### CSS Grid Layout
- **3-column grid**: `grid-template-columns: 1fr auto 1fr`
- **Left area**: 200px wide, positioned at grid-column 1
- **Center area**: Game board container at grid-column 2
- **Right area**: 200px wide, positioned at grid-column 3
- **Vertical centering**: `align-items: center` centers the entire layout

## Piece Positioning System

### Position Storage
```javascript
let piecePositions = new Map();
// Structure: pieceId -> { areaIndex, x, y, rotation }
```

### Area Distribution
- **Alternating placement**: Pieces distributed using `index % 2`
- **Left area**: areaIndex = 0 (even indices)
- **Right area**: areaIndex = 1 (odd indices)

### Random Placement Algorithm
1. **Area Selection**: Alternate between left (0) and right (1) areas
2. **Position Generation**: Random x,y within safe bounds
3. **Rotation**: Random 0-360 degree rotation for natural scatter effect
4. **Collision Detection**: Ensure minimum spacing between pieces
5. **Position Storage**: Store position data for stability

## Buffer Zones and Safety

### UI Element Buffers
- **Left Area**: 80px buffer from game controls (rotate/flip buttons)
  - Accounts for 50px button width + 16px margin + safety buffer
- **Right Area**: 80px buffer from pattern toggle (eye button)
  - Accounts for 50px button width + 16px margin + safety buffer
- **Aesthetic Buffers**: 20px top/bottom margins for visual balance

### Collision Detection
```javascript
function hasCollisionInArea(areaId, newX, newY, pieceSize, minSpacing, excludePieceId) {
    // Check stored positions instead of DOM elements
    // Calculate center-to-center distances
    // Ensure minimum spacing (40px) between pieces
    // Exclude current piece from self-collision checks
}
```

### Safety Parameters
- **Max Piece Size**: 120px (accommodates largest tetris pieces)
- **Minimum Spacing**: 40px between piece centers
- **Retry Attempts**: Up to 50 attempts to find collision-free position
- **Fallback**: Places piece even if optimal position not found

## Styling Approach

### Piece Styling (No Cards)
```css
.piece {
    cursor: pointer;
    padding: 0;
    background: transparent;
    border: none;
    position: absolute;
    pointer-events: all;
    transform-origin: center;
}
```

### Selection Indicator
```css
.piece.selected .piece-cell {
    box-shadow: 0 0 0 2px #4CAF50;
    position: relative;
    z-index: 10;
}
```

### Piece Cells
- **Size**: 30px × 30px (matches game board cells)
- **Margin**: 1px between cells
- **No background**: Transparent container, colored cells only

## Stability System

### Position Persistence
- **Map Storage**: `piecePositions` Map stores all piece positions
- **ID-based Tracking**: Uses piece.id as key for position data
- **Render Stability**: Existing pieces keep positions during re-renders
- **Cleanup**: Removes position data for pieces no longer in marketplace

### New Piece Integration
1. **Check Existing**: `if (!piecePositions.has(piece.id))`
2. **Generate Position**: Only for new pieces without stored positions
3. **Store Data**: Save position, rotation, and area assignment
4. **Collision Avoidance**: Use collision detection for new placements only

### Replacement Logic
- **Game Integration**: When piece is played, `game.marketplace[index] = generateRandomPiece()`
- **New Position**: Replacement piece gets new random position
- **Others Stable**: All other pieces maintain their exact positions

## Key Benefits

1. **Visual Appeal**: Natural scattered appearance instead of rigid grid
2. **No Cropping**: Pieces stay within safe viewport boundaries
3. **UI Safety**: Never interferes with game controls or buttons
4. **Performance**: Efficient collision detection using stored positions
5. **User Experience**: Intuitive selection with piece-level highlighting
6. **Stability**: Predictable piece positions reduce cognitive load

## Implementation Files

### HTML Changes
- Removed bottom marketplace container
- Added left and right scattered areas
- Simplified grid structure

### CSS Changes
- Removed marketplace styling
- Added scattered area positioning
- Updated piece styling to remove card appearance
- Implemented piece-cell level selection highlighting

### JavaScript Changes
- `renderMarketplace()`: Distributes pieces across left/right areas
- `getRandomPositionInArea()`: Handles position generation with buffers
- `hasCollisionInArea()`: Prevents piece overlaps
- Position persistence system with Map storage
- Collision detection using stored positions instead of DOM queries

## Considerations

### Advantages
- More engaging visual presentation
- Better use of screen real estate
- Natural, game-like feel
- No bottom-screen cropping issues

### Trade-offs
- More complex positioning logic
- Collision detection overhead
- Potential for crowded areas with many pieces
- Requires careful buffer zone management

## Future Enhancements
- Dynamic spacing based on available area
- Piece clustering algorithms
- Animation effects for piece placement
- Adaptive buffer zones based on screen size