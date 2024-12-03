import { Grid } from './GameLogic';

export const applyGravity = async (
  grid: Grid,
  setGrid: (grid: Grid) => void,
): Promise<Grid> => {
  const newGrid = grid.map(row => [...row]);

  for (let col = 0; col < newGrid[0].length; col++) {
    let emptyRow = -1;

    for (let row = 0; row < newGrid.length; row++) {
      if (newGrid[row]?.[col] === null) {
        if (emptyRow === -1) {
          emptyRow = row; // Находим первую пустую ячейку
        }
      } else if (emptyRow !== -1) {
        // Перемещаем блок вниз
        newGrid[emptyRow][col] = newGrid[row]?.[col] ?? null;
        newGrid[row][col] = null;

        // Обновляем состояние и ждем завершения анимации
        setGrid([...newGrid]);
        await waitForAnimation(); // Ожидаем завершения текущей анимации

        emptyRow++;
      }
    }
  }

  return newGrid;
};

export const waitForAnimation = (duration: number = 200): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, duration));
};
