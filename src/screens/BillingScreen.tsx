import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import {
  Searchbar,
  Chip,
  Text,
  Button,
  Surface,
  Divider,
  TextInput,
  Modal,
  Portal,
  useTheme,
  IconButton,
} from 'react-native-paper';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useAppDispatch, useAppSelector } from '../store';
import {
  addToCart,
  updateQuantity,
  removeFromCart,
  setDiscount,
  setCategoryFilter,
  setSearchQuery,
  clearCart,
  addNewProduct,
} from '../store/billingSlice';
import { createInvoiceAsync } from '../store/invoiceSlice';
import { ProductCard } from '../components/ProductCard';
import { CartItemRow } from '../components/CartItemRow';
import { EmptyState } from '../components/EmptyState';
import { ReceiptModal } from '../components/ReceiptModal';
import { AddProductModal } from '../components/AddProductModal';
import {
  PRODUCT_CATEGORIES,
  formatCurrency,
  generateInvoiceNumber,
  formatDateTime,
} from '../utils/constants';
import { Product, DiscountType, Invoice } from '../types';

export const BillingScreen: React.FC = () => {
  const theme = useTheme();
  const dispatch = useAppDispatch();

  const { cart, products, discount, selectedCategory, searchQuery } = useAppSelector(
    (state) => state.billing
  );
  const settings = useAppSelector((state) => state.settings.settings);
  const currentInvoice = useAppSelector((state) => state.invoice.currentInvoice);

  const [isCartExpanded, setIsCartExpanded] = useState(false);
  const [discountModalVisible, setDiscountModalVisible] = useState(false);
  const [addProductModalVisible, setAddProductModalVisible] = useState(false);
  const [tempDiscountVal, setTempDiscountVal] = useState(discount.value.toString());
  const [tempDiscountType, setTempDiscountType] = useState<DiscountType>(discount.type);
  const [receiptVisible, setReceiptVisible] = useState(false);

  // Filter products by search and category
  const filteredProducts = products.filter((product) => {
    const matchesCategory =
      selectedCategory === 'All' || product.category === selectedCategory;
    const matchesSearch =
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.category.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const totalCartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  // Subtotal Calculation
  const subtotal = cart.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0
  );

  let discountAmount = 0;
  if (discount.type === 'percentage') {
    discountAmount = (subtotal * discount.value) / 100;
  } else {
    discountAmount = Math.min(discount.value, subtotal);
  }

  const taxableAmount = Math.max(0, subtotal - discountAmount);

  // Itemized Per-Product GST Calculation
  const gstAmount = settings.gstEnabled
    ? cart.reduce((acc, item) => {
        const itemSubtotal = item.product.price * item.quantity;
        const itemDiscountRatio = subtotal > 0 ? (subtotal - discountAmount) / subtotal : 1;
        const itemTaxable = itemSubtotal * itemDiscountRatio;
        const itemGstRate =
          item.product.gstRate !== undefined
            ? item.product.gstRate
            : settings.gstPercentage;
        return acc + (itemTaxable * itemGstRate) / 100;
      }, 0)
    : 0;

  const grandTotal = taxableAmount + gstAmount;

  const handleAddToCart = (product: Product) => {
    dispatch(addToCart(product));
  };

  const handleIncrement = (productId: string, currentQty: number) => {
    dispatch(updateQuantity({ productId, quantity: currentQty + 1 }));
  };

  const handleDecrement = (productId: string, currentQty: number) => {
    dispatch(updateQuantity({ productId, quantity: currentQty - 1 }));
  };

  const handleRemove = (productId: string) => {
    dispatch(removeFromCart(productId));
  };

  const handleApplyDiscount = () => {
    const val = parseFloat(tempDiscountVal) || 0;
    dispatch(setDiscount({ type: tempDiscountType, value: val }));
    setDiscountModalVisible(false);
  };

  const handleAddCustomProduct = (newProd: Product) => {
    dispatch(addNewProduct(newProd));
  };

  const handleGenerateInvoice = async () => {
    if (cart.length === 0) {
      Alert.alert('Empty Cart', 'Please add products to cart before generating invoice.');
      return;
    }

    const timestamp = Date.now();
    const { date, time } = formatDateTime(timestamp);

    const invoiceData: Invoice = {
      id: `inv_${timestamp}`,
      invoiceNumber: generateInvoiceNumber(),
      date,
      time,
      timestamp,
      items: cart,
      subtotal,
      discount,
      discountAmount,
      taxableAmount,
      gstPercentage: settings.gstPercentage,
      gstAmount,
      grandTotal,
      storeName: settings.storeName,
      address: settings.address,
      phone: settings.phone,
      footerMessage: settings.footerMessage,
      currencySymbol: settings.currencySymbol,
    };

    // Save invoice & trigger Excel output
    await dispatch(createInvoiceAsync(invoiceData));
    dispatch(clearCart());
    setIsCartExpanded(false);
    setReceiptVisible(true);
  };

  return (
    <View style={styles.container}>
      {/* Product Catalog Section (Scrollable & Responsive) */}
      <View style={styles.productsSection}>
        {/* Top Search Bar */}
        <View style={styles.searchRow}>
          <Searchbar
            placeholder="Search products or category..."
            onChangeText={(text) => dispatch(setSearchQuery(text))}
            value={searchQuery}
            style={styles.searchbar}
            inputStyle={styles.searchInput}
          />
        </View>

        {/* Category Pills */}
        <View style={styles.categoryContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {PRODUCT_CATEGORIES.map((cat) => (
              <Chip
                key={cat}
                selected={selectedCategory === cat}
                onPress={() => dispatch(setCategoryFilter(cat))}
                style={[
                  styles.categoryChip,
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
        </View>

        {/* Product Grid */}
        <FlatList
          data={filteredProducts}
          keyExtractor={(item) => item.id}
          numColumns={2}
          renderItem={({ item }) => {
            const cartItem = cart.find((ci) => ci.product.id === item.id);
            return (
              <ProductCard
                product={item}
                currencySymbol={settings.currencySymbol}
                onAddToCart={handleAddToCart}
                cartQuantity={cartItem?.quantity || 0}
              />
            );
          }}
          contentContainerStyle={styles.gridContent}
          ListEmptyComponent={
            <EmptyState
              icon="package-variant"
              title="No Products Found"
              description="Click '+ Add' above to create a custom product."
            />
          }
        />
      </View>

      {/* Collapsible / Expandable Cart Bottom Sheet */}
      <Surface style={[styles.cartPanel, isCartExpanded && styles.cartPanelExpanded]} elevation={4}>
        {/* Cart Bar Header / Toggle */}
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => setIsCartExpanded(!isCartExpanded)}
          style={styles.cartHeaderTouch}
        >
          <View style={styles.cartHeaderLeft}>
            <MaterialCommunityIcons
              name={isCartExpanded ? 'chevron-down' : 'cart-outline'}
              size={24}
              color={theme.colors.primary}
            />
            <Text variant="titleMedium" style={styles.cartTitle}>
              Cart ({totalCartCount} items)
            </Text>
          </View>

          <View style={styles.cartHeaderRight}>
            <Text style={[styles.headerTotal, { color: theme.colors.primary }]}>
              {formatCurrency(grandTotal, settings.currencySymbol)}
            </Text>

            <Chip
              compact
              style={[
                styles.toggleChip,
                { backgroundColor: isCartExpanded ? '#E8EAF6' : theme.colors.primary },
              ]}
              textStyle={{
                color: isCartExpanded ? theme.colors.primary : '#FFFFFF',
                fontSize: 11,
                fontWeight: 'bold',
              }}
            >
              {isCartExpanded ? 'Hide ▲' : 'View Cart ▼'}
            </Chip>
          </View>
        </TouchableOpacity>

        {/* Expanded View Content */}
        {isCartExpanded && (
          <View style={styles.expandedContent}>
            <Divider style={{ marginVertical: 6 }} />

            <View style={styles.cartActionsRow}>
              <Text style={styles.cartListHeader}>Item Details</Text>
              {cart.length > 0 && (
                <TouchableOpacity onPress={() => dispatch(clearCart())}>
                  <Text style={styles.clearText}>Clear All</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Cart Item List */}
            <View style={styles.cartListArea}>
              {cart.length === 0 ? (
                <Text style={styles.emptyCartText}>Cart is empty. Select products above.</Text>
              ) : (
                <FlatList
                  data={cart}
                  keyExtractor={(item) => item.product.id}
                  renderItem={({ item }) => (
                    <CartItemRow
                      item={item}
                      currencySymbol={settings.currencySymbol}
                      onIncrement={handleIncrement}
                      onDecrement={handleDecrement}
                      onRemove={handleRemove}
                    />
                  )}
                />
              )}
            </View>

            <Divider />

            {/* Cart Summary & Total */}
            <View style={styles.summaryContainer}>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Subtotal:</Text>
                <Text style={styles.summaryVal}>
                  {formatCurrency(subtotal, settings.currencySymbol)}
                </Text>
              </View>

              <View style={styles.summaryRow}>
                <TouchableOpacity onPress={() => setDiscountModalVisible(true)}>
                  <Text style={styles.discountLink}>
                    Discount ({discount.value}
                    {discount.type === 'percentage' ? '%' : ' ' + settings.currencySymbol}) ✏️
                  </Text>
                </TouchableOpacity>
                <Text style={[styles.summaryVal, { color: '#D32F2F' }]}>
                  -{formatCurrency(discountAmount, settings.currencySymbol)}
                </Text>
              </View>

              {settings.gstEnabled && (
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>GST Tax (Itemized):</Text>
                  <Text style={styles.summaryVal}>
                    {formatCurrency(gstAmount, settings.currencySymbol)}
                  </Text>
                </View>
              )}

              <Divider style={{ marginVertical: 6 }} />

              <View style={styles.grandTotalRow}>
                <Text style={styles.grandTotalLabel}>Grand Total:</Text>
                <Text style={[styles.grandTotalVal, { color: theme.colors.primary }]}>
                  {formatCurrency(grandTotal, settings.currencySymbol)}
                </Text>
              </View>

              <Button
                mode="contained"
                icon="receipt"
                onPress={handleGenerateInvoice}
                disabled={cart.length === 0}
                style={styles.checkoutBtn}
                contentStyle={styles.checkoutBtnContent}
                labelStyle={styles.checkoutBtnLabel}
              >
                Generate Invoice
              </Button>
            </View>
          </View>
        )}
      </Surface>

      {/* Add Custom Product Modal */}
      <AddProductModal
        visible={addProductModalVisible}
        onDismiss={() => setAddProductModalVisible(false)}
        onAddProduct={handleAddCustomProduct}
      />

      {/* Discount Modal */}
      <Portal>
        <Modal
          visible={discountModalVisible}
          onDismiss={() => setDiscountModalVisible(false)}
          contentContainerStyle={styles.modalStyle}
        >
          <Text variant="titleMedium" style={styles.modalTitle}>
            Apply Bill Discount
          </Text>
          <View style={styles.discountTypeRow}>
            <Chip
              selected={tempDiscountType === 'percentage'}
              onPress={() => setTempDiscountType('percentage')}
              style={styles.discChip}
            >
              Percentage (%)
            </Chip>
            <Chip
              selected={tempDiscountType === 'fixed'}
              onPress={() => setTempDiscountType('fixed')}
              style={styles.discChip}
            >
              Fixed Amount ({settings.currencySymbol})
            </Chip>
          </View>
          <TextInput
            label="Discount Value"
            value={tempDiscountVal}
            onChangeText={setTempDiscountVal}
            keyboardType="numeric"
            style={styles.discInput}
            mode="outlined"
          />
          <View style={styles.modalActions}>
            <Button onPress={() => setDiscountModalVisible(false)}>Cancel</Button>
            <Button mode="contained" onPress={handleApplyDiscount}>
              Apply
            </Button>
          </View>
        </Modal>
      </Portal>

      {/* Receipt Modal */}
      <ReceiptModal
        visible={receiptVisible}
        invoice={currentInvoice}
        onDismiss={() => setReceiptVisible(false)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    height: '100%',
    backgroundColor: '#F5F7FA',
  },
  productsSection: {
    flex: 1,
    paddingHorizontal: 8,
    paddingTop: 8,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  searchbar: {
    flex: 1,
    elevation: 2,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    height: 44,
  },
  searchInput: {
    fontSize: 13,
    minHeight: 44,
  },
  addProductBtn: {
    marginLeft: 6,
    borderRadius: 10,
    height: 44,
    justifyContent: 'center',
  },
  addProductBtnLabel: {
    fontSize: 13,
    fontWeight: 'bold',
  },
  categoryContainer: {
    marginBottom: 6,
  },
  categoryChip: {
    marginRight: 6,
    height: 32,
  },
  gridContent: {
    paddingBottom: 90, // Room for collapsible cart bar at bottom
  },
  cartPanel: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 10,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  cartPanelExpanded: {
    maxHeight: '65%',
  },
  cartHeaderTouch: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  cartHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cartTitle: {
    fontWeight: 'bold',
    color: '#212121',
    marginLeft: 6,
    fontSize: 15,
  },
  cartHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTotal: {
    fontWeight: 'bold',
    fontSize: 16,
    marginRight: 8,
  },
  toggleChip: {
    height: 28,
  },
  expandedContent: {
    marginTop: 4,
  },
  cartActionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  cartListHeader: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#616161',
  },
  clearText: {
    color: '#D32F2F',
    fontWeight: 'bold',
    fontSize: 12,
  },
  cartListArea: {
    maxHeight: 140,
    minHeight: 60,
  },
  emptyCartText: {
    textAlign: 'center',
    color: '#9E9E9E',
    marginTop: 15,
    fontStyle: 'italic',
    fontSize: 13,
  },
  summaryContainer: {
    paddingTop: 6,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 2,
  },
  summaryLabel: {
    color: '#616161',
    fontSize: 13,
  },
  discountLink: {
    color: '#3F51B5',
    fontWeight: 'bold',
    fontSize: 13,
  },
  summaryVal: {
    fontWeight: '600',
    fontSize: 13,
  },
  grandTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 4,
  },
  grandTotalLabel: {
    fontWeight: 'bold',
    fontSize: 15,
    color: '#212121',
  },
  grandTotalVal: {
    fontWeight: 'bold',
    fontSize: 17,
  },
  checkoutBtn: {
    marginTop: 6,
    borderRadius: 10,
  },
  checkoutBtnContent: {
    height: 44,
  },
  checkoutBtnLabel: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  modalStyle: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    margin: 20,
    borderRadius: 12,
  },
  modalTitle: {
    fontWeight: 'bold',
    marginBottom: 12,
  },
  discountTypeRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 12,
  },
  discChip: {
    marginHorizontal: 4,
  },
  discInput: {
    marginBottom: 16,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
});
