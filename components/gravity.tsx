import { Grid } from './GameLogic';

export const applyGravity = (grid: Grid): Grid => {
  const newGrid = grid.map(row => [...row]);

  for (let col = 0; col < newGrid[0].length; col++) {
    let emptyRow = -1;

    for (let row = 0; row < newGrid.length; row++) {
      if (newGrid[row]?.[col] === null) {
        if (emptyRow === -1) {
          emptyRow = row;
        }
      } else if (emptyRow !== -1) {
        newGrid[emptyRow][col] = newGrid[row]?.[col] ?? null;
        newGrid[row][col] = null;
        emptyRow++;
      }
    }
  }

  return newGrid;
};
