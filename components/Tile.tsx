import React, { useEffect } from 'react';
import { Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
} from 'react-native-reanimated';
import { BigNumber } from './BigNumber';

const TILE_SIZE = 70; // Используем размер ячейки сетки
const GRID_HEIGHT = 7; // Высота сетки для расчёта вертикальной позиции

const COLORS = [
  '#556B2F', '#6A5ACD', '#2F4F4F', '#708090', '#4682B4', '#8FBC8F', '#5F9EA0', '#7B68EE',
  '#483D8B', '#6B8E23', '#8B4513', '#A0522D', '#D2B48C', '#B8860B', '#CD853F', '#BC8F8F',
  '#D2691E', '#8B0000', '#FF4500', '#FF6347', '#FFD700', '#BDB76B', '#32CD32', '#9ACD32',
  '#66CDAA', '#20B2AA', '#8A2BE2', '#9932CC', '#BA55D3', '#C71585', '#DB7093', '#FF69B4',
  '#87CEFA', '#778899', '#B0C4DE', '#ADD8E6', '#90EE90', '#98FB98', '#D3D3D3', '#778899',
];

const getColorByValue = (value: BigNumber): string => {
  const index = Math.floor(value.toNumber()) % COLORS.length;
  return COLORS[index];
};

interface TileProps {
  value: BigNumber | null;
  rowIndex: number;
  colIndex: number;
  prevRowIndex: number;
  prevColIndex: number;
  targetRowIndex?: number | null;
  targetColIndex?: number | null;
  isMerged: boolean;
}

const Tile: React.FC<TileProps> = ({
  value,
  rowIndex,
  colIndex,
  prevRowIndex,
  prevColIndex,
  targetRowIndex,
  targetColIndex,
  isMerged,
}) => {
  const translateX = useSharedValue(colIndex);
  const translateY = useSharedValue(rowIndex); //prevRowIndex !== null ? 100 * (7 - prevRowIndex) : 100 * (7 - rowIndex)
  const scale = useSharedValue(1);

  useEffect(() => {
    if (value != null && targetRowIndex != null && targetColIndex != null && targetColIndex != undefined && targetRowIndex != undefined) {
      if (targetColIndex > colIndex) {
        translateX.value = withTiming(targetColIndex + 80, { duration: 150 });
      }
      if (targetColIndex < colIndex) {
        translateX.value = withTiming(targetColIndex - 80, { duration: 150 });
      }
      if (targetRowIndex < rowIndex) {
        translateY.value = withTiming(targetRowIndex - 80 * (rowIndex - targetRowIndex), { duration: 150 });
      }
      if (targetRowIndex > rowIndex) {
        translateY.value = withTiming(targetRowIndex - 80 * (rowIndex - targetRowIndex), { duration: 150 });
      }
      if (targetRowIndex == rowIndex) {
        translateY.value = withTiming(rowIndex, { duration: 150 });
      }
      if (targetColIndex == colIndex) {
        translateX.value = withTiming(colIndex, { duration: 150 });
      }
      // Анимация перемещения
      //translateY.value = withTiming(targetRowIndex, { duration: 300 });
      scale.value = withSpring(1.2, { damping: 10 }, () => {
        scale.value = withSpring(1);
      });
    } else {
        // Обычное движение вниз
        translateX.value = withTiming(colIndex, { duration: 150 });
        if (targetColIndex == null) {
          translateY.value = withTiming(100 * (7 - rowIndex), { duration: 0 }); 
          translateY.value = withTiming(rowIndex, { duration: 150 });
        }
        scale.value = withSpring(1);
      }
  }, [value, targetRowIndex, targetColIndex]);

  const tileColor = value ?  getColorByValue(value) : '#333';

  const animatedStyle = useAnimatedStyle(() => ({

    backgroundColor: tileColor,
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
    ],
  }));

  return (
    <Animated.View style={[styles.tile, animatedStyle]}>
      <Text style={styles.text}>{value ? value.toString() : ''}</Text>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  tile: {
    position: 'absolute',
    width: TILE_SIZE,
    height: TILE_SIZE,
    margin: 2,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 5,
  },
  text: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
});

export default Tile;
