import React, { useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import GameScreen from '@/components/GameScreen';
import { loadGameState, saveGameState, GameState } from '@/components/storage';
import 'react-native-gesture-handler';
import Reanimated from 'react-native-reanimated';


const Game: React.FC = () => {
  const [gameState, setGameState] = useState<GameState | null>(null);

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

  return (
    <View style={styles.container}>
      <GameScreen gameState={gameState} setGameState={setGameState} />
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
