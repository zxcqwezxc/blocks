import { BigNumber } from './BigNumber';
import { Grid } from './GameLogic';
import { applyGravity } from './gravity';

export const mergeTilesUntilStable = async (
  grid: Grid,
  setGrid: (grid: Grid) => void,
  colIndex?: number
): Promise<Grid> => {
  let newGrid = grid.map(row => [...row]);
  let merged: boolean;

  do {
    // Выполняем одно слияние и обновляем сетку
    const result = await mergeTiles(newGrid, colIndex);
    newGrid = result.gridAfterMerge;
    merged = result.merged;

    if (merged) {
      // Обновляем состояние сетки для запуска анимации
      setGrid(newGrid);

      // Ждём завершения анимации перед применением гравитации
      await new Promise(resolve => setTimeout(resolve, 300));

      // Применяем гравитацию
      newGrid = await applyGravity(newGrid, setGrid);

      // Ждём завершения анимации гравитации
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  } while (merged);

  return newGrid;
};


export const mergeTiles = async (grid: Grid, userColIndex?: number): Promise<{ gridAfterMerge: Grid, merged: boolean }> => {
  const newGrid = grid.map(row => [...row]);
  
  const mergeTargets: { row: number, col: number, value: BigNumber }[] = [];
  let merged = false;
  
  // Массив для отслеживания уже объединённых блоков
  const alreadyMerged: boolean[][] = newGrid.map(row => row.map(() => false));

  // Массив для отслеживания перемещённых блоков с их новой позицией
  const movedBlocks: { col: number, row: number }[] = [];
  const animateBlocks: { from: { row: number; col: number }; to: { row: number; col: number } }[] = [];

  // Ищем все возможные группы для объединения
  for (let rowIndex = 0; rowIndex < newGrid.length; rowIndex++) {
    for (let colIndex = 0; colIndex < newGrid[0].length; colIndex++) {
      const tileValue = newGrid[rowIndex]?.[colIndex];
      if (tileValue === null || alreadyMerged[rowIndex][colIndex]) continue;

      const mergeableTiles = getMergeableTiles(newGrid, rowIndex, colIndex, tileValue.value);
      if (mergeableTiles.length > 0) {
        // Рассчитываем новое значение для объединённого блока
        const combinedValue = tileValue.value.multiply(mergeableTiles.length);

        const targetRow = rowIndex; // Целевая строка для нового блока
        const targetCol = colIndex; // Целевая колонка для нового блока

        for (const mergeTile of mergeableTiles) {
          if (newGrid[mergeTile.row][mergeTile.col]?.value) {
            newGrid[mergeTile.row][mergeTile.col] = {
              targetRow,
              targetCol,
              value: newGrid[mergeTile.row][mergeTile.col]?.value || new BigNumber(4),
              currentRow: mergeTile.row,
              currentCol: mergeTile.col,
              isMerged: false,
            };
          }
        }

        mergeableTiles.forEach(tile => {
          animateBlocks.push({
            from: { row: tile.row, col: tile.col },
            to: { row: rowIndex, col: colIndex },
          });
        });

        // Сохраняем информацию о том, где блоки изменили свою позицию после падения
        movedBlocks.push({ row: rowIndex, col: colIndex }, ...mergeableTiles);

        // Добавляем новую цель для объединения
        mergeTargets.push({ row: rowIndex, col: colIndex, value: combinedValue });

        // Помечаем клетки, участвующие в объединении, как объединенные
        alreadyMerged[rowIndex][colIndex] = true;
        for (const tile of mergeableTiles) {
          alreadyMerged[tile.row][tile.col] = true;
          newGrid[tile.row][tile.col] = null; // Удаляем объединённые блоки
        }

        // Удаляем начальный блок для объединения
        newGrid[rowIndex][colIndex] = null;
        merged = true;
      }
    }
  }

  // Применяем новые значения для целевых блоков объединения
  for (const target of mergeTargets) {
    let targetCol = target.col;
    //TODO: здесь нужно поменять логику, по идее можно просто объединять блоки по возможности с теми, где блок изменил позицию
    // Проверяем, если объединение произошло в пользовательской колонке или рядом с ней
    // if (userColIndex != undefined && (targetCol === userColIndex || targetCol === userColIndex - 1 || targetCol === userColIndex + 1)) {
    //   targetCol = userColIndex;  // Перемещаем блок в колонку пользователя
    // } else {
      // Если объединение произошло не в пользовательской колонке, ищем колонку, где блок изменил свою позицию
      const movedBlock = movedBlocks.find(mb => mb.row === target.row && mb.col !== targetCol);
      if (movedBlock) {
        targetCol = movedBlock.col;  // Оставляем блок в колонке, где он изменил свою позицию
      }
//    }

    // Найдём свободную позицию в колонке, чтобы разместить объединённый блок
    const lowestEmptyRow = findLowestEmptyRow(newGrid, targetCol);
    if (lowestEmptyRow !== -1) {
      newGrid[lowestEmptyRow][targetCol] = { value: target.value, currentRow: lowestEmptyRow, currentCol: targetCol, targetRow: null, targetCol: null, isMerged: false };
    }
  }

  return { gridAfterMerge: newGrid, merged };
};





// Функция для поиска самой нижней свободной строки в столбце
const findLowestEmptyRow = (grid: Grid, colIndex: number): number => {
  for (let rowIndex = grid.length - 1; rowIndex >= 0; rowIndex--) {
    if (grid[rowIndex][colIndex] === null) {
      return rowIndex;
    }
  }
  return -1; // Если нет доступных ячеек
};


const getMergeableTiles = (grid: Grid, startRow: number, startCol: number, value: BigNumber): { row: number, col: number }[] => {
  const mergeableTiles: { row: number, col: number }[] = [];
  const visited: boolean[][] = grid.map(row => row.map(() => false));
  
  const stack: { row: number, col: number }[] = [{ row: startRow, col: startCol }];

  while (stack.length > 0) {
    const { row, col } = stack.pop()!;

    if (visited[row][col]) continue;
    visited[row][col] = true;

    if ((grid[row][col])?.value.equals(value)) {
      mergeableTiles.push({ row, col });

      // Добавляем соседей в стек для проверки
      if (row > 0 && !visited[row - 1][col]) stack.push({ row: row - 1, col }); // Верхний блок
      if (row < grid.length - 1 && !visited[row + 1][col]) stack.push({ row: row + 1, col }); // Нижний блок
      if (col > 0 && !visited[row][col - 1]) stack.push({ row, col: col - 1 }); // Левый блок
      if (col < grid[0].length - 1 && !visited[row][col + 1]) stack.push({ row, col: col + 1 }); // Правый блок
    }
  }

  // Исключаем стартовый блок из массива, чтобы объединить только соседей
  return mergeableTiles.filter(tile => !(tile.row === startRow && tile.col === startCol));
};
