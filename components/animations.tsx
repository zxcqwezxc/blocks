import { Animated } from 'react-native';

export const morphAnimation = (fromValue: Animated.ValueXY, toValue: { x: number, y: number }, duration: number = 300) => {
  Animated.timing(fromValue, {
    toValue,
    duration,
    useNativeDriver: false,
  }).start();
};


// Анимация падения плитки
export const animateTileDrop = async (fromValue: { x: number, y: number }, toValue: { x: number, y: number }, duration: number = 300) => {
  return new Promise<void>((resolve) => {
    Animated.timing(
      new Animated.ValueXY(fromValue),
      {
        toValue: toValue,
        duration,
        useNativeDriver: true,
      }
    ).start(() => resolve());
  });
};

// Анимация объединения плиток
export const animateTileMerge = async (fromValue: { x: number, y: number }, toValue: { x: number, y: number }, duration: number = 300) => {
  return new Promise<void>((resolve) => {
    Animated.timing(
      new Animated.ValueXY(fromValue),
      {
        toValue: toValue,
        duration,
        useNativeDriver: true,
      }
    ).start(() => resolve());
  });
};

// export const animateTileRemove = async (tileCoordinates: { row: number, col: number }) => {
//   // Задайте анимацию удаления, например, уменьшая масштаб или используя затухание
//   return new Promise<void>(resolve => {
//     // Ваша анимация здесь
//     // В конце вызовите resolve() для завершения анимации
//     resolve();
//   });
// };

// // Измените код удаления в mergeTiles
// for (let rowIndex = 0; rowIndex < newGrid.length; rowIndex++) {
//   for (let colIndex = 0; colIndex < newGrid[0].length; colIndex++) {
//     const tileValue = newGrid[rowIndex]?.[colIndex];

//     if (tileValue === null) continue;

//     const mergeableTiles = getMergeableTiles(newGrid, rowIndex, colIndex, tileValue);
//     if (mergeableTiles.length > 0) {
//       const combinedValue = tileValue * Math.pow(2, mergeableTiles.length);
//       mergeTargets.push({ row: rowIndex, col: colIndex, value: combinedValue });

//       // Анимация удаления перед очисткой
//       await animateTileRemove({ row: rowIndex, col: colIndex });
//       newGrid[rowIndex][colIndex] = null;

//       for (const tile of mergeableTiles) {
//         await animateTileRemove({ row: tile.row, col: tile.col });
//         newGrid[tile.row][tile.col] = null;
//       }

//       merged = true;
//     }
//   }
// }