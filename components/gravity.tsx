import { Grid } from './GameLogic';

export const waitForAnimation = (duration: number = 300): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, duration));
};

export const applyGravity = async (
  grid: Grid,
  setGrid: (grid: Grid) => void,
): Promise<Grid> => {
  const newGrid = grid.map(row =>
    row.map(cell =>
      cell
        ? {
            ...cell,
            targetRow: cell.targetRow ?? null, // Явно устанавливаем тип null
            targetCol: cell.targetCol ?? null, // Явно устанавливаем тип null
          }
        : null
    )
  );

  for (let col = 0; col < newGrid[0].length; col++) {
    let emptyRow = -1;

    for (let row = 0; row < newGrid.length; row++) {
      if (newGrid[row]?.[col] === null) {
        if (emptyRow === -1) {
          emptyRow = row; // Находим первую пустую ячейку
        }
      } else if (emptyRow !== -1) {
        const movingTile = newGrid[row][col];
        if (movingTile) {
          movingTile.targetRow = emptyRow; // Устанавливаем новую строку
          movingTile.targetCol = col;     // Устанавливаем новую колонку
        }

        // Перемещаем блок вниз
        newGrid[emptyRow][col] = {
          ...movingTile!,
          currentRow: emptyRow, // Обновляем текущую строку
          currentCol: col,      // Обновляем текущую колонку
        };
        newGrid[row][col] = null;

        emptyRow++;
      }
    }
  }

  setGrid([...newGrid]); // Обновляем сетку для анимации
  await waitForAnimation(); // Ждем завершения анимации
  return newGrid;
};
