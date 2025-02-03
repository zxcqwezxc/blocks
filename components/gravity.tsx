import { Grid } from './GameLogic';

export const waitForAnimation = (duration: number = 200): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, duration));
};

export const applyGravity = async (
  grid: Grid,
  setGrid: (grid: Grid) => void,
): Promise<Grid> => {
  let newGrid = grid.map(row => [...row]);
  let moved = false;

  do {
    moved = false;
    for (let col = 0; col < newGrid[0].length; col++) {
      for (let row = 1; row < newGrid.length; row++) { // Начинаем с 1 строки, двигаемся вверх
        const tile = newGrid[row]?.[col];
        if (!tile || tile.isMerged) continue; // Пропускаем объединённые блоки

        let newRow = row;
        while (newRow - 1 >= 0 && newGrid[newRow - 1][col] === null) { // Двигаем вверх
          newRow--;
        }

        if (newRow !== row) {
          newGrid[newRow][col] = { ...tile, targetRow: newRow, targetCol: col };
          newGrid[row][col] = null;
          moved = true;
        }
      }
    }
    setGrid([...newGrid]);
    await waitForAnimation();
  } while (moved); // Запускаем до тех пор, пока есть перемещения

  return newGrid;
};
