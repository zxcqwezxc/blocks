import { applyGravity } from './gravity';
import { mergeTilesUntilStable } from './mergeLogic';
import { mergeTiles } from './mergeLogic';
import { BigNumber } from './BigNumber';



export type GridCell = {
  value: BigNumber;
  currentRow: number;
  currentCol: number;
  targetRow: number | null;
  targetCol: number | null;
  isMerged: boolean;
} | null;

export type Grid = (GridCell | null)[][];

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
      if (lastBlockValue?.value && lastBlockValue.value.toNumber() === tileValue.toNumber()) {
        dropRowIndex = grid.length - 1;

        // Выполнение объединения, если блоки совпадают
        let newGrid = grid.map(row => [...row]);
        newGrid[dropRowIndex][colIndex] = null;

        // Применяем новое значение
        const combinedValue = lastBlockValue.value.multiply(1); // Объединяем значения

        newGrid[dropRowIndex][colIndex] = {
          value: combinedValue, // Значение блока
          currentRow: dropRowIndex, // Текущая строка
          currentCol: colIndex, // Текущая колонка
          targetRow: null, // Сброс targetRow
          targetCol: null, // Сброс targetCol
          isMerged: false, 
        };

        setGrid(newGrid);

        newGrid = await mergeTilesUntilStable(newGrid, setGrid, colIndex);

        newGrid = await applyGravity(newGrid, setGrid);

        return { newGrid, mergedPositions: [{ row: dropRowIndex, col: colIndex }] };
      } else {
        return { newGrid: grid, mergedPositions: [] };
      }
  }

  let newGrid = grid.map(row => [...row]);
  newGrid[dropRowIndex][colIndex] = {
    value: tileValue,
    currentRow: dropRowIndex,
    currentCol: colIndex,
    targetRow: grid[dropRowIndex][colIndex]?.targetRow || null,
    targetCol: grid[dropRowIndex][colIndex]?.targetCol || null,
    isMerged: false
  };

  // Отслеживаем позиции объединённых блоков
  let mergedPositions: { row: number, col: number }[] = [];

  // Применяем анимацию и объединение
  newGrid = await handleDropAndMerge(newGrid, colIndex, tileValue, setGrid);

  // Если во время объединения были слияния, добавляем позиции
  mergedPositions = getMergedPositions(newGrid, grid, colIndex);

  newGrid = await applyGravity(newGrid, setGrid);

  return { newGrid, mergedPositions };
};


const getMergedPositions = (grid: Grid, oldGrid: Grid, colIndex: number): { row: number, col: number }[] => {
  const mergedPositions: { row: number, col: number }[] = [];

  if (!grid || grid.length === 0) {
    return mergedPositions;
  }

  for (let rowIndex = 0; rowIndex < grid.length; rowIndex++) {
    const row = grid[rowIndex];

    if (row && row.length > colIndex) {
      const tileValue = row[colIndex];
      let position = {rowIndex, colIndex};
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

  const oldBlock = oldGrid[row]?.[col];
  const newBlock = newGrid[row]?.[col];

  if (!oldBlock || !newBlock) {
    return false;
  }
  return newBlock.value.toNumber() > oldBlock.value.toNumber();
};

const handleDropAndMerge = async (
  grid: Grid, 
  colIndex: number, 
  tileValue: BigNumber, 
  setGrid: (grid: Grid) => void
) => {

  let newGrid = grid.map(row => [...row]);

  const dropRowIndex = findDropPosition(newGrid, colIndex);
  if (dropRowIndex === -1) return newGrid;

  newGrid[dropRowIndex][colIndex] = {
    value: tileValue,
    currentRow: dropRowIndex,
    currentCol: colIndex,
    targetRow: null,
    targetCol: null,
    isMerged: false
  };;
  setGrid(newGrid);

  newGrid = await applyGravity(newGrid, setGrid);
  let oldGrid = newGrid;
  setGrid(newGrid);

  let hasMerged;
  do {
    const mergingResult = await mergeTiles(newGrid, setGrid, colIndex, oldGrid);
    hasMerged = mergingResult.merged;

    if (hasMerged) {
      newGrid = mergingResult.gridAfterMerge;
      setGrid(newGrid);
      newGrid = await applyGravity(newGrid, setGrid);
      setGrid(newGrid);
      colIndex = -1;
    }
  } while (hasMerged);

  return newGrid;
};

const findDropPosition = (grid: Grid, colIndex: number): number => {
  for (let rowIndex = grid.length - 1; rowIndex >= 0; rowIndex--) {
    if (grid[rowIndex][colIndex] !== null) {
      return rowIndex;
    }
  }
  return 0;
};