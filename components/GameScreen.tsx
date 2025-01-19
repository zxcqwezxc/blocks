import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Text } from 'react-native';
import Tile from './Tile';
import { initializeGrid, Grid, GridCell, dropTile } from './GameLogic';
import { AvailableBlocks, GameState } from './storage';
import { NextTile } from './NextTile';
import { BigNumber } from './BigNumber';
import { BlockModal } from './BlockModal';
import { applyGravity } from './gravity';
import isEqual from 'lodash.isequal';
import { mergeTilesUntilStable } from './mergeLogic';

interface GameScreenProps {
  gameState: GameState | null;
  setGameState: (state: GameState) => void;
  DBBlocks: BigNumber[] | undefined;
  setDBAvailableBlocks: (blocks: BigNumber[]) => void;
}

const GameScreen: React.FC<GameScreenProps> = ({ gameState, setGameState, DBBlocks, setDBAvailableBlocks }) => {
  // Инициализация grid: если есть сохранённое состояние, загружаем его, иначе создаём пустую сетку
  const [grid, setGrid] = useState<Grid>(gameState?.grid || initializeGrid());
  const isInitialRender = useRef(true);
  const [mergedTiles, setMergedTiles] = useState<{ row: number, col: number }[]>([]);
  const [availableBlocks, setAvailableBlocks] = useState<BigNumber[]>(DBBlocks || [
    new BigNumber(1), new BigNumber(2), new BigNumber(4), new BigNumber(8), new BigNumber(16), new BigNumber(32)
  ]);
  const [nextTile, setNextTile] = useState<BigNumber>(DBBlocks && DBBlocks[0] || availableBlocks[0]);
  const [removedBlock, setRemovedBlock] = useState<BigNumber | null>(null);
  const [newBlock, setNewBlock] = useState<BigNumber | null>(null);
  const [isModalVisible, setModalVisible] = useState(false);
  const gridRef = useRef(grid);


  useEffect(() => {
      console.log("Saving updated grid to gameState");
      setGameState({ grid });
  }, [grid, setGameState]);
  
  useEffect(() => {
    gridRef.current = grid;
  }, [grid]);

  useEffect(() => {
    if (gameState?.grid && isEqual(grid, initializeGrid())) {
      console.log("Loading saved grid from gameState");
      setGrid(gameState.grid);
    }
  }, [gameState]);

  useEffect(() => {
    console.log("Saving updated availbleBlocks");
    setDBAvailableBlocks(availableBlocks);
  }, [availableBlocks, setDBAvailableBlocks]);

  useEffect(() => {
    if (DBBlocks) {
      console.log("Loading saved blocks from DBBLocks");
      setNextTile(DBBlocks[0]);
      setAvailableBlocks(DBBlocks);
    }
  }, [DBBlocks]);

  const getRandomTile = (): BigNumber => {
    let randomTile: BigNumber;
    const minBlock = availableBlocks[0];
  
    do {
      const randomIndex = Math.floor(Math.random() * availableBlocks.length);
      randomTile = availableBlocks[randomIndex];
    } while (randomTile.lessThan(minBlock)); // Повторный выбор, если блок слишком мал
  
    return randomTile;
  };

  // const handleRemoveModalClose = () => {
  //   setRemoveModalVisible(false);
  //   setTimeout(() => {
  //     setUnlockModalVisible(true);
  //   }, 200);
  // };

  // const handleUnlockModalClose = () => {
  //   setUnlockModalVisible(false);
  //   applyGravity(grid); // Применяем гравитацию после модальных окон
  // };

  const updateAvailableBlocks = (newBlock: BigNumber, newGrid: typeof grid) => {
    setAvailableBlocks((prevBlocks: BigNumber[]) => {
      const updatedBlocks = [...prevBlocks];
      updatedBlocks.shift(); // Удаляем минимальный блок
      updatedBlocks.push(newBlock); // Добавляем новый блок
  
      const minAvailableBlock = updatedBlocks[0];
      const removedBlocks: BigNumber[] = [];
  
      const updatedGrid = newGrid.map(row => 
        row.map(cell => {
          if (cell && cell.value.lessThan(minAvailableBlock)) {
            removedBlocks.push(cell.value); // Отслеживаем удалённые блоки
            return null;
          }
          return cell;
        })
      );
      
      setGrid(updatedGrid);

      setRemovedBlock(minAvailableBlock.divide(1));
      setNewBlock(newBlock);
      return updatedBlocks;
    });
    setDBAvailableBlocks(availableBlocks);
    setModalVisible(true);
  };
  
  const handleModalClose = async () => {
    setModalVisible(false);
  
    setRemovedBlock(null);
    setNewBlock(null);
    // Вызываем последовательное объединение и гравитацию
    let updatedGrid = await mergeTilesUntilStable(gridRef.current, setGrid);
    updatedGrid = await applyGravity(updatedGrid, setGrid);
  
    // Обновляем состояние сетки и nextTile
    setGrid(updatedGrid);
  
    // Перезагружаем значение для следующего блока
    const minTile = getMinTile();
    const newNextTile = nextTile.lessThan(minTile) ? getRandomTile() : nextTile;
    setNextTile(newNextTile);
  };
  
  
  
  const onTilePress = async (colIndex: number) => {
    const { newGrid, mergedPositions } = await dropTile(grid, colIndex, nextTile, setGrid);
    //setGrid(newGrid);
    setGameState({ grid: newGrid });
    setMergedTiles(mergedPositions);
    gridRef.current = newGrid;
  
    const maxTile = newGrid
    .flat()
    .filter((val): val is GridCell => val !== null && val.value !== undefined) // Явная проверка на GridCell
    .reduce((max, tile) =>
      tile && max && tile.value.greaterThan(max.value) ? tile : max,
      { value: new BigNumber(0), currentRow: 0, currentCol: 0, targetRow: null, targetCol: null, isMerged: false }
    );
  
  
    const maxAvailableBlock = availableBlocks[availableBlocks.length - 1];
    if (maxTile && maxTile.value.greaterThan(maxAvailableBlock.multiply(2))) {
      const newBlock = maxAvailableBlock.multiply(1);
      // let updatedGrid = await mergeTilesUntilStable(newGrid);
      // updatedGrid = applyGravity(updatedGrid);
      updateAvailableBlocks(newBlock, newGrid);
      //setModalVisible(true);
    }
  
    setNextTile(getRandomTile());
  };

  const getMinTile = (): BigNumber => {
    const tiles = grid.flat().filter((tile): tile is GridCell => tile !== null);
    if (tiles.length === 0) return availableBlocks[0];
  
    const minTile = tiles.reduce((minTile, tile) =>
      tile && minTile && tile.value.lessThan(minTile.value) ? tile : minTile,
      tiles[0] // Установите первый элемент как начальное значение
    );
  
    // Гарантируем возврат BigNumber, даже если reduce вернёт undefined
    return minTile?.value ?? new BigNumber(0);
  };
  
  return (
    <>
      <BlockModal
        isVisible={isModalVisible}
        removedBlock={removedBlock}
        newBlock={newBlock}
        onClose={handleModalClose}
      />
      <View style={styles.container}>
        <View style={styles.grid}>
          {Array.from({ length: 5 }, (_, colIndex) => (
            <View
              key={colIndex}
              style={[styles.column, colIndex === 4 && styles.lastColumn]}
            >
              {grid && Array.isArray(grid) ? (
                grid.map((row, rowIndex) => (
                  <TouchableOpacity
                    key={rowIndex}
                    onPress={() => onTilePress(colIndex)}
                    style={styles.cell}
                  >
                    {row[colIndex] && (
                     <Tile
                     value={row[colIndex]?.value ?? new BigNumber(2)} // Значение по умолчанию
                     rowIndex={rowIndex}
                     colIndex={colIndex}
                     targetRowIndex={row[colIndex]?.targetRow}
                     targetColIndex={row[colIndex]?.targetCol}
                     isMerged={mergedTiles.some(tile => tile.row === rowIndex && tile.col === colIndex)}
                     prevRowIndex={rowIndex}
                     prevColIndex={colIndex}
                   />
                   
                    )}
                  </TouchableOpacity>
                ))
              ) : (
                <Text>Loading...</Text>
              )}
            </View>
          ))}
        </View>
        <NextTile value={nextTile} />
      </View>
    </>
  );
  
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center', 
    backgroundColor: '#333',
  },
  grid: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  column: {
    flexDirection: 'column',
    alignItems: 'center',
    marginHorizontal: 1,
    paddingRight: 5,
    borderRightWidth: 2,
    borderRightColor: '#888',
  },
  lastColumn: {
    borderRightWidth: 0,
  },
  cell: {
    justifyContent: 'center',
    alignItems: 'center',
    height: 70,
    width: 70,
    marginBottom: 2,
  },
});

export default GameScreen;
