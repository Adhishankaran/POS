import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { SettingsState, AppSettings } from '../types';
import { storageService } from '../services/storageService';
import { DEFAULT_SETTINGS } from '../utils/constants';

const initialState: SettingsState = {
  settings: DEFAULT_SETTINGS,
  loading: false,
  error: null,
};

export const fetchSettings = createAsyncThunk(
  'settings/fetchSettings',
  async () => {
    const settings = await storageService.getSettings();
    return settings;
  }
);

export const saveSettingsAsync = createAsyncThunk(
  'settings/saveSettings',
  async (newSettings: AppSettings) => {
    const saved = await storageService.saveSettings(newSettings);
    return saved;
  }
);

export const settingsSlice = createSlice({
  name: 'settings',
  initialState,
  reducers: {
    updateLocalSettings: (state, action: PayloadAction<Partial<AppSettings>>) => {
      state.settings = { ...state.settings, ...action.payload };
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchSettings.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchSettings.fulfilled, (state, action: PayloadAction<AppSettings>) => {
        state.loading = false;
        state.settings = action.payload;
      })
      .addCase(fetchSettings.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to load settings';
      })
      .addCase(saveSettingsAsync.pending, (state) => {
        state.loading = true;
      })
      .addCase(saveSettingsAsync.fulfilled, (state, action: PayloadAction<AppSettings>) => {
        state.loading = false;
        state.settings = action.payload;
      })
      .addCase(saveSettingsAsync.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to save settings';
      });
  },
});

export const { updateLocalSettings } = settingsSlice.actions;

export default settingsSlice.reducer;
