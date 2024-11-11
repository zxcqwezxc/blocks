import { Animated } from 'react-native';
import { applyGravity } from './gravity';
import { mergeTilesUntilStable } from './mergeLogic';
import { morphAnimation } from './animations';
//import { animateTileDrop, animateTileMerge } from './animations';
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
  mergedPositions = getMergedPositions(newGrid, colIndex); // Добавим функцию для поиска объединённых позиций

  // Применяем гравитацию снова после всех объединений и анимаций
  newGrid = applyGravity(newGrid);

  return { newGrid, mergedPositions };
};


const getMergedPositions = (grid: Grid, colIndex: number): { row: number, col: number }[] => {
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
      
      // Проверяем, было ли значение объединено (например, если оно удвоилось)
      if (tileValue && checkIfMerged(tileValue)) {
        mergedPositions.push({ row: rowIndex, col: colIndex });
      }
    }
  }

  return mergedPositions;
};

// Пример простой проверки, если блок был объединён (настраиваемое условие)
const checkIfMerged = (tileValue: BigNumber): boolean => {
  return tileValue.toNumber() > 2; // Если значение блока больше 2, то считаем, что блок был объединён
};


const handleDropAndMerge = async (
  grid: Grid, 
  colIndex: number, 
  tileValue: BigNumber, 
  setGrid: (grid: Grid) => void
) => {
  const tileWidth = 70;
  const tileHeight = 70;

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


const activeAnimations: any[] = [];

const resetAnimationState = () => {
  // Останавливаем все активные анимации
  activeAnimations.forEach((animatedValue) => {
    animatedValue.stopAnimation(); // Останавливаем текущую анимацию
    animatedValue.setValue({ x: 0, y: 0 }); // Сбрасываем значение
  });
  activeAnimations.length = 0; // Очищаем массив активных анимаций
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


// Анимация объединения плиток
const animateTileMerge = (tileIndex: { row: number, col: number }, duration: number = 200): Promise<Animated.Value> => {
  const animatedScale = new Animated.Value(1);

  return new Promise((resolve) => {
    Animated.sequence([
      Animated.timing(animatedScale, {
        toValue: 1.2,
        duration,
        useNativeDriver: true,
      }),
      Animated.timing(animatedScale, {
        toValue: 1,
        duration,
        useNativeDriver: true,
      }),
    ]).start(() => resolve(animatedScale));
  });
};


export const dropTileWithAnimation = async (
  grid: Grid,
  colIndex: number,
  tileValue: number,
  setGrid: (grid: Grid) => void
) : Promise<Grid> => {
  const dropRowIndex = findDropPosition(grid, colIndex);

  if (dropRowIndex === -1) return grid; // Если нет свободного места, завершаем выполнение

  let newGrid = grid.map(row => [...row]);
  newGrid[dropRowIndex][colIndex] = new BigNumber(tileValue);
  setGrid(newGrid);

  // Анимация падения
  const fromValue = { x: colIndex * 70, y: 0 };
  const toValue = { x: colIndex * 70, y: dropRowIndex * 70 };
  //await animateTileDrop(fromValue, toValue);

  // Применяем гравитацию после падения
  newGrid = applyGravity(newGrid);
  setGrid(newGrid);

  // Объединение блоков после завершения анимации падения
  await handleMergeWithAnimation(newGrid, colIndex, setGrid);
  return newGrid;
};

const handleMergeWithAnimation = async (
  grid: Grid,
  colIndex: number,
  setGrid: (grid: Grid) => void
) => {
  let merging;
  do {
    merging = await mergeTiles(grid, colIndex);
    if (merging.merged) {
      setGrid(merging.gridAfterMerge);

      // Анимация объединения
      const mergedTiles = findMergedTiles(merging.gridAfterMerge, grid); // Найдите плитки, которые объединились
      for (const tile of mergedTiles) {
        await animateTileMerge(tile.index);
      }
    }
    grid = merging.gridAfterMerge;
  } while (merging.merged);

  // Применяем гравитацию снова после всех объединений
  grid = applyGravity(grid);
  setGrid(grid);
};

// Функция для поиска объединенных плиток
const findMergedTiles = (newGrid: Grid, oldGrid: Grid): { index: { row: number, col: number }, value: number }[] => {
  const mergedTiles = [];
  for (let row = 0; row < newGrid.length; row++) {
    for (let col = 0; col < newGrid[row].length; col++) {
      const newValue = newGrid[row][col];
      const oldValue = oldGrid[row][col];
      
      if (newValue !== null && newValue !== oldValue) {
        mergedTiles.push({ index: { row, col }, value: newValue.toNumber() }); // Convert BigNumber to number
      }
    }
  }
  return mergedTiles;
};
