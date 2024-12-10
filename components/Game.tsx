import React, { useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import GameScreen from '@/components/GameScreen';
import { loadGameState, saveGameState, GameState, saveAvailableBlocks, AvailableBlocks, loadAvailableBlocks } from '@/components/storage';
import 'react-native-gesture-handler';
import Reanimated from 'react-native-reanimated';
import { BigNumber } from './BigNumber';


const Game: React.FC = () => {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [availableBlocks, setAvailableBlocks] = useState<BigNumber[]>();

  useEffect(() => {
    const fetchData = async () => {
      const blocks = await loadAvailableBlocks();
      setAvailableBlocks(blocks.availableBlocks);
    };
    fetchData();
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      const state = await loadGameState();
      setGameState(state);
    };
    fetchData();
  }, []);

  useEffect(() => {
    if (gameState) {
      saveGameState(gameState);
    }
  }, [gameState]);

  useEffect(() => {
    if (availableBlocks) {
      saveAvailableBlocks({ availableBlocks: availableBlocks });
    }
  }, [availableBlocks]);

  return (
    <View style={styles.container}>
      <GameScreen gameState={gameState} setGameState={setGameState} DBBlocks={availableBlocks} setDBAvailableBlocks={setAvailableBlocks} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default Game;
