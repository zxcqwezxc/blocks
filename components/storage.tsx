import AsyncStorage from '@react-native-async-storage/async-storage';
import { Grid } from './GameLogic';
import { BigNumber } from './BigNumber';

export interface GameState {
  grid: Grid;
}

export const saveGameState = async (state: GameState) => {
  try {
    const jsonValue = JSON.stringify(state, (_, value) => {
      if (value instanceof BigNumber) {
        return { _isBigNumber: true, value: value.toNumber(), suffix: value.getSuffix() || '' };
      }
      return value;
    });
    await AsyncStorage.setItem('gameState', jsonValue);
  } catch (e) {
    console.error('Failed to save the game state.', e);
  }
};

export const loadGameState = async (): Promise<GameState | null> => {
  try {
    const jsonValue = await AsyncStorage.getItem('gameState');
    if (!jsonValue) return null;

    const state = JSON.parse(jsonValue, (_, value) => {
      if (value && value._isBigNumber) {
        return new BigNumber(value.value, value.suffix);
      }
      return value;
    });
    return state;
  } catch (e) {
    console.error('Failed to load the game state.', e);
    return null;
  }
};
