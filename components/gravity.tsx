import { Grid } from './GameLogic';

export const waitForAnimation = (duration: number = 200): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, duration));
};

export const applyGravity = async (
  grid: Grid,
  setGrid: (grid: Grid) => void,
): Promise<Grid> => {
  let newGrid = grid.map(row => [...row]);
  let moved: boolean;

  do {
    moved = false;

    for (let col = 0; col < newGrid[0].length; col++) {
      for (let row = 1; row < newGrid.length; row++) {
        const tile = newGrid[row][col];
        if (!tile) continue;

        let dropRow = row; 

        while (dropRow - 1 >= 0 && newGrid[dropRow - 1][col] === null) {
          dropRow--;
        }

        if (
          dropRow - 1 >= 0 &&
          newGrid[dropRow - 1][col]?.targetRow !== null &&
          (newGrid[dropRow - 1][col]?.targetRow !== newGrid[dropRow - 1][col]?.currentRow && !newGrid[dropRow][col]?.value.equals(newGrid[dropRow - 1][col]?.value))
        ) {
          dropRow--;
        }

        //TODO Если падает несколько блоков, то последний встаёт на минимальное место, нужно изменить расчёт
        if (dropRow !== row) {
          newGrid[row][col] = { ...tile, targetRow: dropRow, targetCol: col };
          setGrid([...newGrid]);
          await waitForAnimation(); 
          newGrid[row][col] = null;
          newGrid[dropRow][col] = { ...tile, targetRow: dropRow, targetCol: col };
          moved = true;
        }
      }
    }

  } while (moved);

  return newGrid;
};
