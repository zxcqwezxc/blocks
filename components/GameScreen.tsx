import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import Tile from './Tile';
import { initializeGrid, Grid, dropTile } from './GameLogic';
import { GameState } from './storage';
import { NextTile } from './NextTile';
import { BigNumber } from './BigNumber';
import { BlockModal } from './BlockModal';
import { applyGravity } from './gravity';
import isEqual from 'lodash.isequal';
import { mergeTilesUntilStable } from './mergeLogic';

interface GameScreenProps {
  gameState: GameState | null;
  setGameState: (state: GameState) => void;
}

const GameScreen: React.FC<GameScreenProps> = ({ gameState, setGameState }) => {
  // Инициализация grid: если есть сохранённое состояние, загружаем его, иначе создаём пустую сетку
  const [grid, setGrid] = useState<Grid>(gameState?.grid || initializeGrid());
  const isInitialRender = useRef(true);
  const [nextTile, setNextTile] = useState<BigNumber>(new BigNumber(4));
  const [mergedTiles, setMergedTiles] = useState<{ row: number, col: number }[]>([]);
  const [availableBlocks, setAvailableBlocks] = useState<BigNumber[]>([
    new BigNumber(1), new BigNumber(2), new BigNumber(4), new BigNumber(8), new BigNumber(16), new BigNumber(32)
  ]);
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
    setAvailableBlocks((prevBlocks) => {
      const updatedBlocks = [...prevBlocks];
      updatedBlocks.shift(); // Удаляем минимальный блок
      updatedBlocks.push(newBlock); // Добавляем новый блок
  
      const minAvailableBlock = updatedBlocks[0];
      const removedBlocks: BigNumber[] = [];
  
      const updatedGrid = newGrid.map(row => 
        row.map(cell => {
          if (cell && cell.lessThan(minAvailableBlock)) {
            removedBlocks.push(cell); // Отслеживаем удалённые блоки
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
    setModalVisible(true);
  };
  
  const handleModalClose = async () => {
    setModalVisible(false);
  
    setRemovedBlock(null);
    setNewBlock(null);
    // Вызываем последовательное объединение и гравитацию
    let updatedGrid = await mergeTilesUntilStable(gridRef.current);
    updatedGrid = applyGravity(updatedGrid);
  
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
  
    const maxTile = newGrid.flat().filter((val): val is BigNumber => val !== null).reduce((max, tile) =>
      tile.greaterThan(max) ? tile : max, new BigNumber(1));
  
    const maxAvailableBlock = availableBlocks[availableBlocks.length - 1];
    if (maxTile.greaterThan(maxAvailableBlock.multiply(2))) {
      const newBlock = maxAvailableBlock.multiply(1);
      // let updatedGrid = await mergeTilesUntilStable(newGrid);
      // updatedGrid = applyGravity(updatedGrid);
      updateAvailableBlocks(newBlock, newGrid);
      //setModalVisible(true);
    }
  
    setNextTile(getRandomTile());
  };

  const getMinTile = (): BigNumber => {
    const tiles = grid.flat().filter((tile): tile is BigNumber => tile !== null);
    if (tiles.length === 0) return availableBlocks[0];
    return tiles.reduce((minTile, tile) => (tile.lessThan(minTile) ? tile : minTile));
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
              {grid.map((row, rowIndex) => (
                <TouchableOpacity
                  key={rowIndex}
                  onPress={() => onTilePress(colIndex)}
                  style={styles.cell}
                >
                  {row[colIndex] && (
                    <Tile
                      value={row[colIndex]}
                      rowIndex={rowIndex}
                      isMerged={mergedTiles.some(tile => tile.row === rowIndex && tile.col === colIndex)}
                    />
                  )}
                </TouchableOpacity>
              ))}
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
    marginHorizontal: 2,
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
