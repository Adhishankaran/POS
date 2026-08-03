import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Card, Text, Button, useTheme } from 'react-native-paper';
import { Product } from '../types';
import { formatCurrency } from '../utils/constants';

interface ProductCardProps {
  product: Product;
  currencySymbol: string;
  onAddToCart: (product: Product) => void;
  cartQuantity?: number;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  currencySymbol,
  onAddToCart,
  cartQuantity = 0,
}) => {
  const theme = useTheme();

  return (
    <Card style={styles.card} mode="elevated">
      <Card.Content style={styles.content}>
        {/* Crisp Header Badges */}
        <View style={styles.headerRow}>
          <View style={[styles.badge, { backgroundColor: '#E8EAF6' }]}>
            <Text style={[styles.badgeText, { color: '#3F51B5' }]}>
              {product.category}
            </Text>
          </View>

          <View style={[styles.badge, { backgroundColor: '#FFF3E0' }]}>
            <Text style={[styles.badgeText, { color: '#E65100' }]}>
              GST: {product.gstRate !== undefined ? product.gstRate : 5}%
            </Text>
          </View>

          {cartQuantity > 0 && (
            <View style={[styles.badge, { backgroundColor: '#E8F5E9' }]}>
              <Text style={[styles.badgeText, { color: '#2E7D32' }]}>
                Cart: {cartQuantity}
              </Text>
            </View>
          )}
        </View>

        {/* Product Name */}
        <Text variant="titleMedium" style={styles.productName} numberOfLines={2}>
          {product.name}
        </Text>

        {/* Price Row */}
        <View style={styles.priceRow}>
          <Text variant="headlineSmall" style={[styles.price, { color: theme.colors.primary }]}>
            {formatCurrency(product.price, currencySymbol)}
          </Text>
          <Text variant="bodySmall" style={styles.unitText}>
            / {product.unit}
          </Text>
        </View>
      </Card.Content>

      <Card.Actions style={styles.actions}>
        <Button
          mode="contained"
          icon="cart-plus"
          onPress={() => onAddToCart(product)}
          style={styles.addButton}
          labelStyle={styles.buttonLabel}
        >
          Add to Cart
        </Button>
      </Card.Actions>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    margin: 6,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    flex: 1,
    minWidth: 155,
  },
  content: {
    padding: 12,
  },
  headerRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginBottom: 8,
  },
  badge: {
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    lineHeight: 14,
  },
  productName: {
    fontWeight: '600',
    fontSize: 14,
    color: '#212121',
    minHeight: 36,
    marginBottom: 6,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginTop: 4,
  },
  price: {
    fontWeight: 'bold',
    fontSize: 16,
  },
  unitText: {
    color: '#757575',
    marginLeft: 4,
  },
  actions: {
    paddingHorizontal: 8,
    paddingBottom: 8,
    paddingTop: 0,
  },
  addButton: {
    borderRadius: 8,
    flex: 1,
  },
  buttonLabel: {
    fontSize: 12,
    fontWeight: 'bold',
  },
});
