import React, { useState } from 'react';
import { View, StyleSheet, FlatList, ScrollView, Alert } from 'react-native';
import {
  Searchbar,
  Chip,
  Text,
  Button,
  Card,
  IconButton,
  FAB,
  Surface,
  useTheme,
} from 'react-native-paper';
import { useAppDispatch, useAppSelector } from '../store';
import {
  addNewProduct,
  updateProduct,
  deleteProduct,
  setCategoryFilter,
  setSearchQuery,
} from '../store/billingSlice';
import { AddProductModal } from '../components/AddProductModal';
import { EditProductModal } from '../components/EditProductModal';
import { EmptyState } from '../components/EmptyState';
import { PRODUCT_CATEGORIES, formatCurrency } from '../utils/constants';
import { Product } from '../types';

export const ProductsScreen: React.FC = () => {
  const theme = useTheme();
  const dispatch = useAppDispatch();
  const { products, selectedCategory, searchQuery } = useAppSelector(
    (state) => state.billing
  );
  const settings = useAppSelector((state) => state.settings.settings);

  const [addModalVisible, setAddModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const filteredProducts = products.filter((p) => {
    const matchesCat =
      selectedCategory === 'All' || p.category === selectedCategory;
    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.category.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  const handleAddProduct = (newProd: Product) => {
    dispatch(addNewProduct(newProd));
  };

  const handleEditPress = (product: Product) => {
    setEditingProduct(product);
    setEditModalVisible(true);
  };

  const handleSaveEditedProduct = (updated: Product) => {
    dispatch(updateProduct(updated));
  };

  const handleDeleteProduct = (productId: string, productName: string) => {
    Alert.alert(
      'Delete Product',
      `Are you sure you want to delete "${productName}" from inventory?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => dispatch(deleteProduct(productId)),
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      {/* Search & Header Bar */}
      <Surface style={styles.headerSurface} elevation={2}>
        <Searchbar
          placeholder="Search inventory products..."
          onChangeText={(txt) => dispatch(setSearchQuery(txt))}
          value={searchQuery}
          style={styles.searchbar}
          inputStyle={styles.searchInput}
        />

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.catRow}>
          {PRODUCT_CATEGORIES.map((cat) => (
            <Chip
              key={cat}
              selected={selectedCategory === cat}
              onPress={() => dispatch(setCategoryFilter(cat))}
              style={[
                styles.chip,
                selectedCategory === cat && { backgroundColor: theme.colors.primary },
              ]}
              textStyle={{
                color: selectedCategory === cat ? '#FFFFFF' : '#424242',
                fontWeight: selectedCategory === cat ? 'bold' : 'normal',
              }}
            >
              {cat}
            </Chip>
          ))}
        </ScrollView>
      </Surface>

      {/* Product List */}
      <FlatList
        data={filteredProducts}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <Card style={styles.card} mode="elevated">
            <Card.Content style={styles.cardContent}>
              <View style={styles.rowTop}>
                <View style={styles.nameAndBadgesCol}>
                  <Text variant="titleMedium" style={styles.prodName}>
                    {item.name}
                  </Text>
                  <View style={styles.badgesRow}>
                    <View style={styles.categoryBadge}>
                      <Text style={styles.categoryBadgeText}>{item.category}</Text>
                    </View>
                    <View style={styles.gstBadge}>
                      <Text style={styles.gstBadgeText}>
                        GST {item.gstRate !== undefined ? item.gstRate : 5}%
                      </Text>
                    </View>
                  </View>
                </View>
              </View>

              <View style={styles.rowBottom}>
                <View style={styles.priceCol}>
                  <Text variant="titleLarge" style={[styles.priceText, { color: theme.colors.primary }]}>
                    {formatCurrency(item.price, settings.currencySymbol)}
                  </Text>
                  <Text variant="bodySmall" style={styles.unitText}>
                    per {item.unit}
                  </Text>
                </View>

                {/* Edit & Delete Actions */}
                <View style={styles.actionCol}>
                  <Button
                    mode="contained-tonal"
                    icon="pencil"
                    compact
                    onPress={() => handleEditPress(item)}
                    style={styles.editBtn}
                  >
                    Edit
                  </Button>

                  <IconButton
                    icon="trash-can-outline"
                    iconColor="#D32F2F"
                    size={22}
                    onPress={() => handleDeleteProduct(item.id, item.name)}
                  />
                </View>
              </View>
            </Card.Content>
          </Card>
        )}
        ListEmptyComponent={
          <EmptyState
            icon="package-variant-closed"
            title="No Products Found"
            description="Tap the '+ Add Product' button below to add custom inventory products."
          />
        }
      />

      {/* Floating Action Button to Add New Product */}
      <FAB
        icon="plus"
        label="Add Product"
        style={[styles.fab, { backgroundColor: theme.colors.primary }]}
        color="#FFFFFF"
        onPress={() => setAddModalVisible(true)}
      />

      {/* Add Product Modal */}
      <AddProductModal
        visible={addModalVisible}
        onDismiss={() => setAddModalVisible(false)}
        onAddProduct={handleAddProduct}
      />

      {/* Edit Product Modal */}
      <EditProductModal
        visible={editModalVisible}
        product={editingProduct}
        onDismiss={() => setEditModalVisible(false)}
        onSaveProduct={handleSaveEditedProduct}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    height: '100%',
    backgroundColor: '#F5F7FA',
    overflow: 'hidden',
  },
  headerSurface: {
    padding: 10,
    backgroundColor: '#FFFFFF',
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
  },
  searchbar: {
    elevation: 1,
    backgroundColor: '#F0F2F5',
    borderRadius: 10,
    height: 44,
    marginBottom: 8,
  },
  searchInput: {
    fontSize: 13,
    minHeight: 44,
  },
  catRow: {
    flexDirection: 'row',
  },
  chip: {
    marginRight: 6,
    height: 32,
  },
  listContent: {
    padding: 12,
    paddingBottom: 80,
  },
  card: {
    marginBottom: 10,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
  },
  cardContent: {
    padding: 12,
  },
  rowTop: {
    marginBottom: 8,
  },
  nameAndBadgesCol: {
    flex: 1,
  },
  prodName: {
    fontWeight: 'bold',
    fontSize: 16,
    color: '#0F172A',
    marginBottom: 6,
  },
  badgesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  categoryBadge: {
    backgroundColor: '#E0E7FF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginRight: 6,
    marginBottom: 4,
  },
  categoryBadgeText: {
    fontSize: 11,
    color: '#3730A3',
    fontWeight: 'bold',
  },
  gstBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginBottom: 4,
  },
  gstBadgeText: {
    fontSize: 11,
    color: '#D97706',
    fontWeight: 'bold',
  },
  rowBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  priceCol: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  priceText: {
    fontWeight: 'bold',
  },
  unitText: {
    color: '#757575',
    marginLeft: 4,
  },
  actionCol: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  editBtn: {
    borderRadius: 8,
    marginRight: 4,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
    borderRadius: 28,
  },
});
