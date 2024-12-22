import React, { useEffect } from 'react';
import { Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
} from 'react-native-reanimated';
import { BigNumber } from './BigNumber';

const TILE_SIZE = 70;
const TILE_MARGIN = 2;

const COLORS = [
  '#556B2F', '#6A5ACD', '#2F4F4F', '#708090', '#4682B4', '#8FBC8F', '#5F9EA0', '#7B68EE',
  '#483D8B', '#6B8E23', '#8B4513', '#A0522D', '#D2B48C', '#B8860B', '#CD853F', '#BC8F8F',
  '#D2691E', '#8B0000', '#FF4500', '#FF6347', '#FFD700', '#BDB76B', '#32CD32', '#9ACD32',
  '#66CDAA', '#20B2AA', '#8A2BE2', '#9932CC', '#BA55D3', '#C71585', '#DB7093', '#FF69B4',
  '#87CEFA', '#778899', '#B0C4DE', '#ADD8E6', '#90EE90', '#98FB98', '#D3D3D3', '#778899',
];

const getColorIndexByValue = (value: BigNumber): number => {
  const numericValue = Math.floor(value.toNumber());
  return numericValue % COLORS.length; // Cyclically wrap the index
};

const getColorByValue = (value: BigNumber): string => {
  const index = getColorIndexByValue(value);
  return COLORS[index];
};

interface TileProps {
  value: BigNumber | null;
  rowIndex: number;
  colIndex: number; // Добавлено для вычисления анимации по X
  prevRowIndex: number; // Начальная строка, откуда двигался блок
  prevColIndex: number; // Начальный столбец, откуда двигался блок
  targetRowIndex?: number | null; // Целевая строка
  targetColIndex?: number | null; // Целевой столбец
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
  const translateX = useSharedValue(prevColIndex !== null ? prevColIndex : colIndex);
  const translateY = useSharedValue(prevRowIndex !== null ? 100 * (7 - prevRowIndex) : 100 * (7 - rowIndex));
  const scale = useSharedValue(1);

  useEffect(() => {
    if (value !== null) {
      if (targetRowIndex !== null && targetColIndex !== null && targetRowIndex !== undefined && targetColIndex !== undefined) {
        // Анимация перемещения к целевому блоку
        translateX.value = withTiming(targetColIndex, { duration: 300 });
        translateY.value = withTiming(targetRowIndex, { duration: 300 });
        scale.value = withSpring(1.2, { damping: 10 }, () => {
          scale.value = withSpring(1);
        });
      } else {
        // Обычное движение вниз
        translateX.value = withTiming(colIndex, { duration: 500 });
        translateY.value = withTiming(rowIndex, { duration: 500 });
        scale.value = withSpring(1);
      }
    }
  }, [value, rowIndex, colIndex, isMerged, targetRowIndex, targetColIndex]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      backgroundColor: value ? getColorByValue(value) : '#FFA726',
      transform: [
        { translateX: translateX.value },
        { translateY: translateY.value },
        { scale: scale.value },
      ],
    };
  });

  return (
    <Animated.View style={[styles.tile, animatedStyle]}>
      <Text style={styles.text}>{value ? value.toString() : ''}</Text>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  tile: {
    position: 'absolute',
    width: 70,
    height: 70,
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
