import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, IconButton, Divider, useTheme } from 'react-native-paper';
import { CartItem } from '../types';
import { formatCurrency } from '../utils/constants';

interface CartItemRowProps {
  item: CartItem;
  currencySymbol: string;
  onIncrement: (productId: string, currentQty: number) => void;
  onDecrement: (productId: string, currentQty: number) => void;
  onRemove: (productId: string) => void;
}

export const CartItemRow: React.FC<CartItemRowProps> = ({
  item,
  currencySymbol,
  onIncrement,
  onDecrement,
  onRemove,
}) => {
  const theme = useTheme();
  const itemTotal = item.product.price * item.quantity;

  return (
    <View style={styles.container}>
      <View style={styles.detailsColumn}>
        <Text variant="titleSmall" style={styles.productName} numberOfLines={1}>
          {item.product.name}
        </Text>
        <Text variant="bodySmall" style={styles.pricePerUnit}>
          {formatCurrency(item.product.price, currencySymbol)} x {item.quantity} {item.product.unit}
        </Text>
      </View>

      <View style={styles.quantityControls}>
        <IconButton
          icon="minus-circle-outline"
          size={20}
          iconColor={theme.colors.primary}
          onPress={() => onDecrement(item.product.id, item.quantity)}
        />
        <Text variant="titleMedium" style={styles.qtyText}>
          {item.quantity}
        </Text>
        <IconButton
          icon="plus-circle-outline"
          size={20}
          iconColor={theme.colors.primary}
          onPress={() => onIncrement(item.product.id, item.quantity)}
        />
      </View>

      <View style={styles.totalColumn}>
        <Text variant="titleMedium" style={styles.totalText}>
          {formatCurrency(itemTotal, currencySymbol)}
        </Text>
        <IconButton
          icon="trash-can-outline"
          size={18}
          iconColor="#D32F2F"
          onPress={() => onRemove(item.product.id)}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  detailsColumn: {
    flex: 2,
  },
  productName: {
    fontWeight: 'bold',
    color: '#212121',
  },
  pricePerUnit: {
    color: '#757575',
    fontSize: 12,
    marginTop: 2,
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1.5,
  },
  qtyText: {
    fontWeight: 'bold',
    minWidth: 20,
    textAlign: 'center',
  },
  totalColumn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    flex: 1.5,
  },
  totalText: {
    fontWeight: 'bold',
    color: '#1B5E20',
  },
});
