import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { BigNumber } from './BigNumber';

interface NextTileProps {
  value: BigNumber;
}

const COLORS = [
  '#556B2F', '#6A5ACD', '#2F4F4F', '#708090', '#4682B4', '#8FBC8F', '#5F9EA0', '#7B68EE',
  '#483D8B', '#6B8E23', '#8B4513', '#A0522D', '#D2B48C', '#B8860B', '#CD853F', '#BC8F8F',
  '#D2691E', '#8B0000', '#FF4500', '#FF6347', '#FFD700', '#BDB76B', '#32CD32', '#9ACD32',
  '#66CDAA', '#20B2AA', '#8A2BE2', '#9932CC', '#BA55D3', '#C71585', '#DB7093', '#FF69B4',
  '#87CEFA', '#778899', '#B0C4DE', '#ADD8E6', '#90EE90', '#98FB98', '#D3D3D3', '#778899'
];


const getColorIndexByValue = (value: BigNumber): number => {
  const numericValue = Math.floor(value.toNumber());
  return numericValue % COLORS.length; // Cyclically wrap the index
};

const getColorByValue = (value: BigNumber): string => {
  const index = getColorIndexByValue(value);
  return COLORS[index];
};

export const NextTile: React.FC<NextTileProps> = ({ value }) => {

  const tileColor = value ?  getColorByValue(value) : '#FFA726'

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Next:</Text>
      <View style={[styles.tile, { backgroundColor: tileColor }]}>
        <Text style={styles.text}>{value.toString()}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 20,
    alignItems: 'center',
  },
  label: {
    fontSize: 18,
    color: '#FFF',
    marginBottom: 10,
  },
  tile: {
    width: 70,
    height: 70,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFA726', // Цвет блока
    borderRadius: 5,
  },
  text: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFF',
  },
});