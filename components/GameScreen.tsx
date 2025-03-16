import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Text, Animated } from 'react-native';
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
  screenWidth: number,
  screenHeight: number
}

const GameScreen: React.FC<GameScreenProps> = ({ gameState, setGameState, DBBlocks, setDBAvailableBlocks, screenWidth, screenHeight }) => {
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
  const [greeting, setGreeting] = useState<string | null>(null);
  const numColumns = 5;
  const numRows = 7;
  const tileSize = Math.min(screenWidth / numColumns, screenHeight / numRows);


  useEffect(() => {
      console.log("Saving updated grid to gameState");
      setGameState({ grid });
  }, [grid, setGameState]);
  
  useEffect(() => {
    gridRef.current = grid;
  }, [grid]);

  const fadeAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (gameState?.grid && isEqual(grid, initializeGrid())) {
      setGrid(gameState.grid);
      const currentHour = new Date().getHours();
      let greetingText = "gn<3<3<3<3";

      if (currentHour >= 6 && currentHour < 12) {
        greetingText = "gmgmgm<3<3<3<3";
      } else if (currentHour >= 12 && currentHour < 18) {
        greetingText = "haiiiiiiii<3<3<3<3<3";
      } else if (currentHour >= 18 && currentHour < 22) {
        greetingText = "haiiiiiiii<3<3<3<3<3";
      }

      setGreeting(greetingText);
      fadeAnim.setValue(1);

      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 4000,
        useNativeDriver: true,
      }).start(() => setGreeting(null));
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

  const updateAvailableBlocks = (newGrid: typeof grid) => {
    let updatedBlocks = [...availableBlocks];
    let minAvailableBlock = updatedBlocks[0];
    let removedBlock: BigNumber | null = null;
    let newBlock: BigNumber | null = null;
    let changesMade = false;
  
    do {
      changesMade = false;
      minAvailableBlock = updatedBlocks[0];
  
      const updatedGrid = newGrid.map(row =>
        row.map(cell => {
          if (cell && cell.value.lessThan(minAvailableBlock)) {
            removedBlock = cell.value;
            return null;
          }
          return cell;
        })
      );
      
      const maxTile = updatedGrid.flat()
        .filter((cell): cell is GridCell => cell !== null)
        .reduce((max, tile) => tile && tile.value.greaterThan(max.value) ? tile : max, { value: new BigNumber(0) });
  
      const maxAvailableBlock = updatedBlocks[updatedBlocks.length - 1];
      if (maxTile.value.greaterThan(maxAvailableBlock.multiply(5))) {
        newBlock = maxAvailableBlock.multiply(1);
        updatedBlocks.shift();
        updatedBlocks.push(newBlock);
        changesMade = true;
      }
  
      setGrid(updatedGrid);
    } while (changesMade);
  
    if (removedBlock || newBlock) {
      setRemovedBlock(removedBlock);
      setNewBlock(newBlock);
      setAvailableBlocks(updatedBlocks);
      setDBAvailableBlocks(updatedBlocks);
      setModalVisible(true);
    }
  };
  
  const handleModalClose = async () => {
    setModalVisible(false);
    setRemovedBlock(null);
    setNewBlock(null);
  
    let updatedGrid = await mergeTilesUntilStable(gridRef.current, setGrid);
    updatedGrid = await applyGravity(updatedGrid, setGrid);
  
    setGrid(updatedGrid);
  
    const minTile = getMinTile();
    const newNextTile = nextTile.lessThan(minTile) ? getRandomTile() : nextTile;
    setNextTile(newNextTile);
  };
  
  const onTilePress = async (colIndex: number) => {
    const { newGrid, mergedPositions } = await dropTile(grid, colIndex, nextTile, setGrid);
    setGameState({ grid: newGrid });
    setMergedTiles(mergedPositions);
    gridRef.current = newGrid;
  
    updateAvailableBlocks(newGrid);
  
    setNextTile(getRandomTile());
  };
  

  const getMinTile = (): BigNumber => {
    const tiles = grid.flat().filter((tile): tile is GridCell => tile !== null);
    if (tiles.length === 0) return availableBlocks[0];
  
    const minTile = tiles.reduce((minTile, tile) =>
      tile && minTile && tile.value.lessThan(minTile.value) ? tile : minTile,
      tiles[0]
    );
  
    return minTile?.value ?? new BigNumber(0);
  };
  
  return (
    <>
      {greeting && (
        <Animated.View style={[styles.greetingContainer, { opacity: fadeAnim }]}> 
          <Text style={styles.greetingText}>{greeting}</Text>
        </Animated.View>
      )}
      <BlockModal
        isVisible={isModalVisible}
        removedBlock={removedBlock}
        newBlock={newBlock}
        onClose={handleModalClose}
      />
      <View style={[styles.container, {width: screenWidth, height: screenHeight}]}>
        <View style={styles.grid}>
          {Array.from({ length: 5 }, (_, colIndex) => (
            <View
              key={colIndex}
              style={[styles.column, colIndex === 4 && styles.lastColumn, colIndex === 0 && styles.firstColumn, {width: tileSize}]}
            >
              {grid && Array.isArray(grid) ? (
                grid.map((row, rowIndex) => (
                  <TouchableOpacity
                    key={rowIndex}
                    onPress={() => onTilePress(colIndex)}
                    style={[styles.cell, {width: tileSize, height: tileSize}]}
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
  firstColumn: {
    borderLeftWidth: 2,
    borderLeftColor: '#888'
  },
  lastColumn: {
    borderRightWidth: 2,
  },
  cell: {
    justifyContent: 'center',
    alignItems: 'center',
    height: 70,
    width: 70,
    marginBottom: 2,
  },
  greetingContainer: {
    position: 'absolute',
    top: '30%',
    left: '45%',
    transform: [{ translateX: -50 }],
    padding: 10,
    backgroundColor: 'rgba(0, 128, 0, 0.8)',
    borderRadius: 10,
    zIndex: 10,
  },
  greetingText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
    textShadowColor: 'black',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 5,
  },
});

export default GameScreen;
