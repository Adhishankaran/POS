import React, { useEffect, useState } from 'react';
import { Platform, View, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { Provider as ReduxProvider } from 'react-redux';
import {
  MD3LightTheme,
  PaperProvider,
} from 'react-native-paper';
import * as SplashScreen from 'expo-splash-screen';
import { store, useAppDispatch } from './src/store';
import { fetchSettings } from './src/store/settingsSlice';
import { fetchInvoices } from './src/store/invoiceSlice';
import { fetchProducts } from './src/store/billingSlice';
import { TabNavigator } from './src/navigation/TabNavigator';
import { SplashScreenComponent } from './src/components/SplashScreen';

// Keep the native splash screen visible while resources load
SplashScreen.preventAutoHideAsync().catch(() => {});

// Fix full-height viewport on Web and mobile device emulators (e.g. Pixel 7)
if (Platform.OS === 'web' && typeof document !== 'undefined') {
  const styleId = 'expo-web-responsive-fix';
  if (!document.getElementById(styleId)) {
    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
      html, body, #root {
        height: 100% !important;
        max-height: 100vh !important;
        width: 100% !important;
        margin: 0 !important;
        padding: 0 !important;
        overflow: hidden !important;
        display: flex !important;
        flex-direction: column !important;
      }
    `;
    document.head.appendChild(style);
  }
}

// Custom Material Design Theme with Rich Vibrant Palette
const theme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: '#2563EB', // Vibrant Sapphire Blue
    onPrimary: '#FFFFFF',
    primaryContainer: '#DBEAFE',
    secondary: '#10B981', // Emerald Green
    secondaryContainer: '#D1FAE5',
    tertiary: '#8B5CF6', // Violet
    surface: '#FFFFFF',
    background: '#F8FAFC', // Slate Clean Gray
    error: '#EF4444',
  },
};

const AppContent: React.FC = () => {
  const dispatch = useAppDispatch();
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    dispatch(fetchSettings());
    dispatch(fetchInvoices());
    dispatch(fetchProducts());
    SplashScreen.hideAsync().catch(() => {});
  }, [dispatch]);

  if (showSplash) {
    return <SplashScreenComponent onFinish={() => setShowSplash(false)} />;
  }

  return (
    <NavigationContainer>
      <TabNavigator />
    </NavigationContainer>
  );
};

export default function App() {
  return (
    <ReduxProvider store={store}>
      <PaperProvider theme={theme}>
        <SafeAreaProvider style={styles.rootContainer}>
          <StatusBar style="light" backgroundColor="#1E3A8A" />
          <AppContent />
        </SafeAreaProvider>
      </PaperProvider>
    </ReduxProvider>
  );
}

const styles = StyleSheet.create({
  rootContainer: {
    flex: 1,
    height: '100%',
    width: '100%',
  },
});
