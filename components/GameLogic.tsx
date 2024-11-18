import { applyGravity } from './gravity';
import { mergeTilesUntilStable } from './mergeLogic';
import { mergeTiles } from './mergeLogic';
import { BigNumber } from './BigNumber';



export type Grid = (BigNumber | null)[][];

export const handleSwipe = (grid: Grid, direction: string): Grid => {
  // Логика обработки свайпов (если понадобится)
  return grid; 
};



export const initializeGrid = (): Grid => {
  return Array(7).fill(null).map(() => Array(5).fill(null)); // 7 блоков в высоту, 5 в ширину
};

export const dropTile = async (
  grid: Grid,
  colIndex: number,
  tileValue: BigNumber,
  setGrid: (grid: Grid) => void
): Promise<{ newGrid: Grid, mergedPositions: { row: number, col: number }[] }> => {
  let dropRowIndex = -1;

    // Проверяем, что grid не undefined и содержит строки
  if (!grid || grid.length === 0) {
    return { newGrid: grid, mergedPositions: [] };
  }

    // Найдём позицию, куда упадёт блок
  for (let i = 0; i < grid.length; i++) {
    if (grid[i]?.[colIndex] === null) {
      dropRowIndex = i;
      break;
    }
  }

  if (dropRowIndex === -1) {
      // Проверяем последний блок в столбце
      const lastBlockValue = grid[grid.length - 1][colIndex];
      if (lastBlockValue && lastBlockValue.toNumber() === tileValue.toNumber()) {
        // Если значения совпадают, объединяем
        dropRowIndex = grid.length - 1; // Можем объединить с последним блоком

        // Выполнение объединения, если блоки совпадают
        let newGrid = grid.map(row => [...row]);
        newGrid[dropRowIndex][colIndex] = null; // Удаляем старый блок

        // Применяем новое значение
        const combinedValue = lastBlockValue.multiply(1); // Объединяем значения

        // Устанавливаем новое значение в ячейку
        newGrid[dropRowIndex][colIndex] = combinedValue;

        // Устанавливаем новую сетку
        setGrid(newGrid);

        newGrid = await mergeTilesUntilStable(newGrid, colIndex);

        // Применяем гравитацию
        newGrid = applyGravity(newGrid);

        return { newGrid, mergedPositions: [{ row: dropRowIndex, col: colIndex }] };
      } else {
        return { newGrid: grid, mergedPositions: [] };
      }
  }

  let newGrid = grid.map(row => [...row]);
  newGrid[dropRowIndex][colIndex] = tileValue;

  // Отслеживаем позиции объединённых блоков
  let mergedPositions: { row: number, col: number }[] = [];

  // Применяем анимацию и объединение
  newGrid = await handleDropAndMerge(newGrid, colIndex, tileValue, setGrid);

  // Если во время объединения были слияния, добавляем позиции
  mergedPositions = getMergedPositions(newGrid, grid, colIndex); // Добавим функцию для поиска объединённых позиций

  // Применяем гравитацию снова после всех объединений и анимаций
  newGrid = applyGravity(newGrid);

  return { newGrid, mergedPositions };
};


const getMergedPositions = (grid: Grid, oldGrid: Grid, colIndex: number): { row: number, col: number }[] => {
  const mergedPositions: { row: number, col: number }[] = [];

  // Добавляем проверку, чтобы убедиться, что grid не undefined и не пустой
  if (!grid || grid.length === 0) {
    return mergedPositions;
  }

  // Проверяем каждый ряд в колонке
  for (let rowIndex = 0; rowIndex < grid.length; rowIndex++) {
    const row = grid[rowIndex];

    // Проверяем, что текущий ряд существует и имеет достаточно колонок
    if (row && row.length > colIndex) {
      const tileValue = row[colIndex];
      let position = {rowIndex, colIndex};
      // Проверяем, было ли значение объединено (например, если оно удвоилось)
      if (tileValue && checkIfMerged(oldGrid, grid, {row: rowIndex, col: colIndex})) {
        mergedPositions.push({ row: rowIndex, col: colIndex });
      }
    }
  }

  return mergedPositions;
};

const checkIfMerged = (
  oldGrid: Grid,
  newGrid: Grid,
  position: { row: number; col: number }
): boolean => {
  const { row, col } = position;

  // Проверяем наличие блоков на указанных позициях
  const oldBlock = oldGrid[row]?.[col];
  const newBlock = newGrid[row]?.[col];

  // Если в старой сетке блока не было, считаем, что слияния не было
  if (!oldBlock || !newBlock) {
    return false;
  }

  // Проверяем, увеличилось ли значение блока
  return newBlock.toNumber() > oldBlock.toNumber();
};

const handleDropAndMerge = async (
  grid: Grid, 
  colIndex: number, 
  tileValue: BigNumber, 
  setGrid: (grid: Grid) => void
) => {

  let newGrid = grid.map(row => [...row]);

  // Логика падения блока
  const dropRowIndex = findDropPosition(newGrid, colIndex);
  if (dropRowIndex === -1) return newGrid;

  newGrid[dropRowIndex][colIndex] = tileValue;
  setGrid(newGrid);

  // Применяем гравитацию после падения
  newGrid = applyGravity(newGrid);
  setGrid(newGrid);

  let hasMerged;
  do {
    const mergingResult = await mergeTiles(newGrid, colIndex);
    hasMerged = mergingResult.merged;

    if (hasMerged) {
      newGrid = mergingResult.gridAfterMerge;
      setGrid(newGrid);

      // Применяем гравитацию после объединения
      newGrid = applyGravity(newGrid);
      setGrid(newGrid);
    }
  } while (hasMerged);

  return newGrid;
};

// Пример функции для поиска позиции падения
const findDropPosition = (grid: Grid, colIndex: number): number => {
  for (let rowIndex = grid.length - 1; rowIndex >= 0; rowIndex--) {
    if (grid[rowIndex][colIndex] !== null) {
      return rowIndex;
    }
  }
  return 0;
};