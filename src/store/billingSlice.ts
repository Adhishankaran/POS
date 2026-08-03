import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { BillingState, Product, DiscountType } from '../types';
import { INITIAL_PRODUCTS } from '../utils/constants';
import { storageService } from '../services/storageService';

const initialState: BillingState = {
  cart: [],
  products: INITIAL_PRODUCTS,
  discount: {
    type: 'percentage',
    value: 0,
  },
  selectedCategory: 'All',
  searchQuery: '',
};

export const fetchProducts = createAsyncThunk('billing/fetchProducts', async () => {
  const prods = await storageService.getProducts();
  return prods;
});

export const addNewProductAsync = createAsyncThunk(
  'billing/addNewProduct',
  async (product: Product, { getState }) => {
    const state = getState() as any;
    const currentProds = state.billing.products as Product[];
    const updated = [product, ...currentProds];
    await storageService.saveProducts(updated);
    return updated;
  }
);

export const updateProductAsync = createAsyncThunk(
  'billing/updateProduct',
  async (product: Product, { getState }) => {
    const state = getState() as any;
    const currentProds = state.billing.products as Product[];
    const updated = currentProds.map((p) => (p.id === product.id ? product : p));
    await storageService.saveProducts(updated);
    return { updated, updatedProduct: product };
  }
);

export const deleteProductAsync = createAsyncThunk(
  'billing/deleteProduct',
  async (productId: string, { getState }) => {
    const state = getState() as any;
    const currentProds = state.billing.products as Product[];
    const updated = currentProds.filter((p) => p.id !== productId);
    await storageService.saveProducts(updated);
    return { updated, productId };
  }
);

export const billingSlice = createSlice({
  name: 'billing',
  initialState,
  reducers: {
    setProductsList: (state, action: PayloadAction<Product[]>) => {
      state.products = action.payload;
    },

    addNewProduct: (state, action: PayloadAction<Product>) => {
      state.products.unshift(action.payload);
    },

    updateProduct: (state, action: PayloadAction<Product>) => {
      const updatedProd = action.payload;
      const index = state.products.findIndex((p) => p.id === updatedProd.id);
      if (index >= 0) {
        state.products[index] = updatedProd;
      }
      const cartItem = state.cart.find((ci) => ci.product.id === updatedProd.id);
      if (cartItem) {
        cartItem.product = updatedProd;
      }
    },

    deleteProduct: (state, action: PayloadAction<string>) => {
      const prodId = action.payload;
      state.products = state.products.filter((p) => p.id !== prodId);
      state.cart = state.cart.filter((ci) => ci.product.id !== prodId);
    },

    addToCart: (state, action: PayloadAction<Product>) => {
      const existingIndex = state.cart.findIndex(
        (item) => item.product.id === action.payload.id
      );
      if (existingIndex >= 0) {
        state.cart[existingIndex].quantity += 1;
      } else {
        state.cart.push({
          product: action.payload,
          quantity: 1,
        });
      }
    },

    updateQuantity: (
      state,
      action: PayloadAction<{ productId: string; quantity: number }>
    ) => {
      const { productId, quantity } = action.payload;
      if (quantity <= 0) {
        state.cart = state.cart.filter((item) => item.product.id !== productId);
      } else {
        const item = state.cart.find((i) => i.product.id === productId);
        if (item) {
          item.quantity = quantity;
        }
      }
    },

    removeFromCart: (state, action: PayloadAction<string>) => {
      state.cart = state.cart.filter((item) => item.product.id !== action.payload);
    },

    setDiscount: (
      state,
      action: PayloadAction<{ type: DiscountType; value: number }>
    ) => {
      state.discount = action.payload;
    },

    setCategoryFilter: (state, action: PayloadAction<string>) => {
      state.selectedCategory = action.payload;
    },

    setSearchQuery: (state, action: PayloadAction<string>) => {
      state.searchQuery = action.payload;
    },

    clearCart: (state) => {
      state.cart = [];
      state.discount = { type: 'percentage', value: 0 };
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchProducts.fulfilled, (state, action) => {
        state.products = action.payload;
      })
      .addCase(addNewProductAsync.fulfilled, (state, action) => {
        state.products = action.payload;
      })
      .addCase(updateProductAsync.fulfilled, (state, action) => {
        state.products = action.payload.updated;
        const cartItem = state.cart.find(
          (ci) => ci.product.id === action.payload.updatedProduct.id
        );
        if (cartItem) {
          cartItem.product = action.payload.updatedProduct;
        }
      })
      .addCase(deleteProductAsync.fulfilled, (state, action) => {
        state.products = action.payload.updated;
        state.cart = state.cart.filter((ci) => ci.product.id !== action.payload.productId);
      });
  },
});

export const {
  setProductsList,
  addNewProduct,
  updateProduct,
  deleteProduct,
  addToCart,
  updateQuantity,
  removeFromCart,
  setDiscount,
  setCategoryFilter,
  setSearchQuery,
  clearCart,
} = billingSlice.actions;

export default billingSlice.reducer;
