import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { InvoiceState, Invoice } from '../types';
import { storageService } from '../services/storageService';
import { exportInvoicesToExcel } from '../services/excelService';

const initialState: InvoiceState = {
  invoices: [],
  currentInvoice: null,
  loading: false,
  error: null,
};

export const fetchInvoices = createAsyncThunk(
  'invoice/fetchInvoices',
  async () => {
    const invoices = await storageService.getInvoices();
    return invoices;
  }
);

export const createInvoiceAsync = createAsyncThunk(
  'invoice/createInvoice',
  async (invoice: Invoice, { getState }) => {
    const state = getState() as any;
    const exportFolderUri = state?.settings?.settings?.exportFolderUri;

    // 1. Export Excel Sheet to custom granted folder or date/time folder
    try {
      const report = await exportInvoicesToExcel(
        [invoice],
        `Invoice_${invoice.invoiceNumber}`,
        exportFolderUri,
        false
      );
      invoice.excelSavedPath = report.filePath;
    } catch (e) {
      console.warn('Excel auto-export warning:', e);
    }

    // 2. Persist to local AsyncStorage
    const updatedInvoices = await storageService.saveInvoice(invoice);
    return { invoice, invoices: updatedInvoices };
  }
);

export const clearInvoicesAsync = createAsyncThunk(
  'invoice/clearInvoices',
  async () => {
    const cleared = await storageService.clearInvoices();
    return cleared;
  }
);

export const invoiceSlice = createSlice({
  name: 'invoice',
  initialState,
  reducers: {
    setCurrentInvoice: (state, action: PayloadAction<Invoice | null>) => {
      state.currentInvoice = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchInvoices.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchInvoices.fulfilled, (state, action: PayloadAction<Invoice[]>) => {
        state.loading = false;
        state.invoices = action.payload;
      })
      .addCase(fetchInvoices.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch invoices';
      })
      .addCase(createInvoiceAsync.pending, (state) => {
        state.loading = true;
      })
      .addCase(createInvoiceAsync.fulfilled, (state, action) => {
        state.loading = false;
        state.currentInvoice = action.payload.invoice;
        state.invoices = action.payload.invoices;
      })
      .addCase(createInvoiceAsync.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to generate invoice';
      })
      .addCase(clearInvoicesAsync.fulfilled, (state, action) => {
        state.invoices = action.payload;
        state.currentInvoice = null;
      });
  },
});

export const { setCurrentInvoice } = invoiceSlice.actions;

export default invoiceSlice.reducer;
