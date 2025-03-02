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
    const result = await mergeTiles(newGrid, setGrid, colIndex);
    newGrid = result.gridAfterMerge;
    merged = result.merged;

    if (merged) {
      // Обновляем состояние сетки для запуска анимации
      setGrid(newGrid);

      // Ждём завершения анимации перед применением гравитации
      //await new Promise(resolve => setTimeout(resolve, 300));

      // Применяем гравитацию
      newGrid = await applyGravity(newGrid, setGrid);

      // Ждём завершения анимации гравитации
      //await new Promise(resolve => setTimeout(resolve, 500));
    }
  } while (merged);

  return newGrid;
};


export const mergeTiles = async (grid: Grid, setGrid: (grid: Grid) => void, userColIndex?: number): Promise<{ gridAfterMerge: Grid, merged: boolean }> => {
  const newGrid = grid.map(row => [...row]);
  
  const mergeTargets: { row: number, col: number, value: BigNumber }[] = [];
  let merged = false;

  if (userColIndex === -1) {
    let canMerge = true;
    //while (canMerge) {
      canMerge = false;
      const mergeGroups = findMergeGroups(newGrid);
      
      for (const group of mergeGroups) {
        const { tiles, center } = group;
        const combinedValue = newGrid[center.row][center.col]?.value.multiply(tiles.length - 1);
        
        tiles.forEach(tile => {
          const movingTile = newGrid[tile.row][tile.col];
          if (movingTile) {
            movingTile.targetRow = center.row;
            movingTile.targetCol = center.col;
          }
        });
        
        setGrid([...newGrid]);
        await new Promise(resolve => setTimeout(resolve, 300));
        
        tiles.forEach(tile => {
          newGrid[tile.row][tile.col] = null;
        });
        newGrid[center.row][center.col] = { 
          value: combinedValue || new BigNumber(1),
          currentRow: center.row,
          currentCol: center.col,
          targetRow: center.row,
          targetCol: center.col,
          isMerged: false
        };
        setGrid([...newGrid]);
      }
      if (mergeGroups.length > 0) {
        merged = true;
      }
    //}
    return { gridAfterMerge: newGrid, merged: merged };
  }
  
  // Массив для отслеживания уже объединённых блоков
  const alreadyMerged: boolean[][] = newGrid.map(row => row.map(() => false));

  // Массив для отслеживания перемещённых блоков с их новой позицией
  const movedBlocks: { col: number, row: number }[] = [];


  // Ищем все возможные группы для объединения
  for (let rowIndex = 0; rowIndex < newGrid.length; rowIndex++) {
    for (let colIndex = 0; colIndex < newGrid[0].length; colIndex++) {
      const tileValue = newGrid[rowIndex]?.[colIndex];
      if (tileValue === null || alreadyMerged[rowIndex][colIndex]) continue;

      const mergeableTiles = getMergeableTiles(newGrid, rowIndex, colIndex, tileValue.value);
      if (mergeableTiles.length > 0) {
        // Рассчитываем новое значение для объединённого блока
        const combinedValue = tileValue.value.multiply(mergeableTiles.length);

        // Сохраняем информацию о том, где блоки изменили свою позицию после падения
        movedBlocks.push({ row: rowIndex, col: colIndex }, ...mergeableTiles);

        // Добавляем новую цель для объединения
        mergeTargets.push({ row: rowIndex, col: colIndex, value: combinedValue });

        // Помечаем клетки, участвующие в объединении, как объединенные
        alreadyMerged[rowIndex][colIndex] = true;

        for (const tile of movedBlocks) {
          alreadyMerged[tile.row][tile.col] = true;
          const tileCell = newGrid[tile.row]?.[tile.col];
          
          if (tileCell) {
            if (tileCell.currentRow > 0) {
              const belowTile = newGrid[tile.row - 1]?.[tile.col];
              if (belowTile && belowTile.value.equals(tileCell.value)) {
                // Устанавливаем targetRow в строку блока под ним
                tileCell.targetRow = tile.row - 1;
                tileCell.targetCol = tile.col;
                newGrid[tile.row][tile.col] = {
                  value: tileCell.value,
                  currentRow: tileCell.currentRow,
                  currentCol: tileCell.currentCol,
                  targetRow: tileCell.targetRow,
                  targetCol: tileCell.targetCol,
                  isMerged: false,
                };
              }
            }

            // Логика для userColIndex
            if (userColIndex && tileCell.value != undefined) {
              if (
                userColIndex &&
                (tileCell.currentCol == userColIndex + 1 || tileCell.currentCol == userColIndex - 1)
                && tileCell.value.equals(newGrid[tileCell.currentRow][userColIndex]?.value)
              ) {
                tileCell.targetCol = userColIndex;
                tileCell.targetRow = newGrid[tileCell.currentRow][userColIndex]?.targetRow ?? tileCell.currentRow; // Оставляем строку без изменений
                newGrid[tile.row][tile.col] = {
                  value: tileCell.value,
                  currentRow: tile.row,
                  currentCol: tile.col,
                  targetRow: tileCell.targetRow,
                  targetCol: tileCell.targetCol,
                  isMerged: false,
                };
              }
            }
          }
          setGrid([...newGrid]);
          await new Promise(resolve => setTimeout(resolve, 300));
          //newGrid[tile.row][tile.col].targetCol = colIndex || null;
          
        }

        for (const tile of mergeableTiles) {
          alreadyMerged[tile.row][tile.col] = true;
          // const tileCell = newGrid[tile.row]?.[tile.col];
          // if (tileCell) {
          //     tileCell.targetCol = colIndex || null;
          //     tileCell.targetRow = rowIndex || null;
          // }
          // //newGrid[tile.row][tile.col].targetCol = colIndex || null;
          newGrid[tile.row][tile.col] = null; // Удаляем объединённые блоки
        }

        // Удаляем начальный блок для объединения
        newGrid[rowIndex][colIndex] = null;
        merged = true;
      }
    }
  }

  // Применяем новые значения для целевых блоков объединения
  //TODO разобраться с логикой targetCol тут
  //TODO если что, то все проблемы с не норм отображением объединённых блоков в этом блоке кода, нужно дебажить mergeTargets
  for (const target of mergeTargets) {
    let targetCol = target.col;
    let targetRow = target.row;
    // if (userColIndex != undefined) {
    //   targetRow = findLowestEmptyRow(newGrid, userColIndex);
    // }
    // //TODO: здесь нужно поменять логику, по идее можно просто объединять блоки по возможности с теми, где блок изменил позицию
    // //Проверяем, если объединение произошло в пользовательской колонке или рядом с ней
    // //&& newGrid[targetRow]?.[targetCol]?.value.equals(newGrid[targetRow]?.[userColIndex]?.value)
    if (userColIndex != undefined && (targetCol === userColIndex || targetCol === userColIndex - 1 || targetCol === userColIndex + 1)
    ) {
      // && target.row == targetRow
      targetCol = userColIndex;  // Перемещаем блок в колонку пользователя
    }
    // } else {
    //   // Если объединение произошло не в пользовательской колонке, ищем колонку, где блок изменил свою позицию
    //   const movedBlock = movedBlocks.find(mb => mb.row === target.row && mb.col !== targetCol);
    //   if (movedBlock) {
    //     targetCol = movedBlock.col;  // Оставляем блок в колонке, где он изменил свою позицию
    //   }
    // }

    // Найдём свободную позицию в колонке, чтобы разместить объединённый блок
    // 
    // const lowestEmptyRow = findLowestEmptyRow(newGrid, targetCol);
    // if (lowestEmptyRow !== -1) {
    newGrid[targetRow][targetCol] = { value: target.value, currentRow: target.row, currentCol: targetCol, targetRow: target.row, targetCol: targetCol, isMerged: false };
//    }
  }

  return { gridAfterMerge: newGrid, merged };
};


// const animateTileMerging = async (row: number, col: number, targetRow: number, targetCol: number): Promise<T> {

// }


// Функция для поиска самой нижней свободной строки в столбце
const findLowestEmptyRow = (grid: Grid, colIndex: number): number => {
  for (let rowIndex = grid.length - 1; rowIndex >= 0; rowIndex--) {
    if (grid[rowIndex][colIndex] === null) {
      return rowIndex;
    }
  }
  return -1; // Если нет доступных ячеек
};

const findMergeGroups = (grid: Grid) => {
  const mergeGroups: { tiles: { row: number, col: number }[], center: { row: number, col: number } }[] = [];
  const visited: boolean[][] = grid.map(row => row.map(() => false));

  for (let rowIndex = 0; rowIndex < grid.length; rowIndex++) {
    for (let colIndex = 0; colIndex < grid[0].length; colIndex++) {
      if (visited[rowIndex][colIndex] || !grid[rowIndex][colIndex]) continue;
      
      const tile = grid[rowIndex][colIndex];
      const mergeableTiles = getMergeableTiles(grid, rowIndex, colIndex, tile!.value);

      if (mergeableTiles.length > 0) {
        // Добавляем сам стартовый блок в список, чтобы он тоже участвовал в объединении
        mergeableTiles.push({ row: rowIndex, col: colIndex });

        // Помечаем все блоки как посещенные
        mergeableTiles.forEach(({ row, col }) => visited[row][col] = true);

        // Выбираем центральный блок по позиции
        mergeableTiles.sort((a, b) => a.row - b.row || a.col - b.col); // Сортировка по строкам, затем по колонкам
        const centerIndex = Math.floor(mergeableTiles.length / 2);
        mergeGroups.push({ tiles: mergeableTiles, center: mergeableTiles[centerIndex] });
      }
    }
  }

  return mergeGroups;
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
