import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import {
  Modal,
  Portal,
  Text,
  TextInput,
  Button,
  Chip,
  useTheme,
} from 'react-native-paper';
import { Product } from '../types';
import { PRODUCT_CATEGORIES, GST_RATE_OPTIONS } from '../utils/constants';

interface EditProductModalProps {
  visible: boolean;
  product: Product | null;
  onDismiss: () => void;
  onSaveProduct: (updatedProduct: Product) => void;
}

export const EditProductModal: React.FC<EditProductModalProps> = ({
  visible,
  product,
  onDismiss,
  onSaveProduct,
}) => {
  const theme = useTheme();

  const [name, setName] = useState('');
  const [category, setCategory] = useState('Groceries');
  const [price, setPrice] = useState('');
  const [unit, setUnit] = useState('pack');
  const [gstRate, setGstRate] = useState<number>(5);

  useEffect(() => {
    if (product) {
      setName(product.name);
      setCategory(product.category);
      setPrice(product.price.toString());
      setUnit(product.unit);
      setGstRate(product.gstRate !== undefined ? product.gstRate : 5);
    }
  }, [product]);

  if (!product) return null;

  const handleSave = () => {
    if (!name.trim()) {
      alert('Please enter a valid product name');
      return;
    }
    const numPrice = parseFloat(price);
    if (isNaN(numPrice) || numPrice <= 0) {
      alert('Please enter a valid price');
      return;
    }

    const updated: Product = {
      ...product,
      name: name.trim(),
      category,
      price: numPrice,
      unit: unit.trim() || 'item',
      gstRate: gstRate,
    };

    onSaveProduct(updated);
    onDismiss();
  };

  return (
    <Portal>
      <Modal
        visible={visible}
        onDismiss={onDismiss}
        contentContainerStyle={styles.modalContent}
      >
        <ScrollView contentContainerStyle={styles.scrollArea}>
          <Text variant="titleLarge" style={styles.title}>
            ✏️ Edit Product Details
          </Text>
          <Text variant="bodySmall" style={styles.subtitle}>
            Modify product name, price, category, unit, or GST rate
          </Text>

          <TextInput
            label="Product Name"
            value={name}
            onChangeText={setName}
            mode="outlined"
            style={styles.input}
          />

          <View style={styles.row}>
            <TextInput
              label="Price (₹)"
              value={price}
              onChangeText={setPrice}
              keyboardType="numeric"
              mode="outlined"
              style={[styles.input, { flex: 1, marginRight: 6 }]}
            />
            <TextInput
              label="Unit (e.g. kg, pack, cup)"
              value={unit}
              onChangeText={setUnit}
              mode="outlined"
              style={[styles.input, { flex: 1, marginLeft: 6 }]}
            />
          </View>

          {/* Category Selection */}
          <Text variant="labelMedium" style={styles.label}>
            Select Category:
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
            {PRODUCT_CATEGORIES.filter((c) => c !== 'All').map((cat) => (
              <Chip
                key={cat}
                selected={category === cat}
                onPress={() => setCategory(cat)}
                style={styles.chip}
              >
                {cat}
              </Chip>
            ))}
          </ScrollView>

          {/* Per-Product Specific GST Rate */}
          <Text variant="labelMedium" style={styles.label}>
            Product Specific GST Rate (%):
          </Text>
          <View style={styles.gstSegmentRow}>
            {GST_RATE_OPTIONS.map((rate) => (
              <Chip
                key={rate}
                selected={gstRate === rate}
                onPress={() => setGstRate(rate)}
                style={[
                  styles.gstChip,
                  gstRate === rate && { backgroundColor: theme.colors.primary },
                ]}
                textStyle={{
                  color: gstRate === rate ? '#FFFFFF' : '#212121',
                  fontWeight: 'bold',
                }}
              >
                {rate}% GST
              </Chip>
            ))}
          </View>

          <View style={styles.actions}>
            <Button onPress={onDismiss} style={styles.btn}>
              Cancel
            </Button>
            <Button mode="contained" onPress={handleSave} style={styles.btn}>
              Save Changes
            </Button>
          </View>
        </ScrollView>
      </Modal>
    </Portal>
  );
};

const styles = StyleSheet.create({
  modalContent: {
    backgroundColor: '#FFFFFF',
    margin: 20,
    borderRadius: 16,
    padding: 20,
    maxHeight: '90%',
  },
  scrollArea: {
    paddingBottom: 10,
  },
  title: {
    fontWeight: 'bold',
    color: '#1A237E',
  },
  subtitle: {
    color: '#757575',
    marginBottom: 16,
  },
  input: {
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
  },
  label: {
    fontWeight: 'bold',
    marginTop: 8,
    marginBottom: 6,
    color: '#424242',
  },
  chipRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  chip: {
    marginRight: 6,
  },
  gstSegmentRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
  },
  gstChip: {
    margin: 3,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 8,
  },
  btn: {
    marginLeft: 8,
  },
});
