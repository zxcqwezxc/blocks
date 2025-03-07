import React from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Tile from './Tile';
import { BigNumber } from './BigNumber';

interface BlockModalProps {
  isVisible: boolean;
  removedBlock: BigNumber | null;
  newBlock: BigNumber | null;
  onClose: () => void;
}

export const BlockModal: React.FC<BlockModalProps> = ({ isVisible, removedBlock, newBlock, onClose }) => {
  return (
    <Modal transparent={true} visible={isVisible} animationType="fade">
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.title}>Изменения блоков</Text>
          
          <View style={styles.blockContainer}>
            {/* Удалённый блок */}
            <View style={styles.blockSection}>
              <Text style={styles.blockLabel}>Удалённый блок</Text>
              <Tile value={removedBlock} rowIndex={0} isMerged={false} prevRowIndex={0} colIndex={0} prevColIndex={0} />
            </View>
            
            {/* Разделительная линия */}
            <View style={styles.divider} />

            {/* Новый блок */}
            <View style={styles.blockSection}>
              <Text style={styles.blockLabel}>Новый блок</Text>
              <Tile value={newBlock} rowIndex={0} isMerged={false} prevRowIndex={0} colIndex={0} prevColIndex={0} />
            </View>
          </View>
          
          {/* Кнопка для закрытия */}
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Text style={styles.closeButtonText}>OK</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: 320,
    padding: 25,
    backgroundColor: '#333',
    borderRadius: 12,
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#f0f0f0',
    marginBottom: 15,
  },
  blockContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 20,
  },
  blockSection: {
    flex: 1,
    alignItems: 'center',
    position: 'relative',
  },
  blockLabel: {
    fontSize: 16,
    color: '#aaa',
    position: 'absolute',
    top: -35,
    textAlign: 'center',
  },
  tileContainer: {
    marginTop: -5,
  },
  divider: {
    width: 1,
    height: 80,
    backgroundColor: '#666',
    marginHorizontal: 10,
  },
  closeButton: {
    backgroundColor: '#32CD32',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 5,
  },
  closeButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});

export default BlockModal;
