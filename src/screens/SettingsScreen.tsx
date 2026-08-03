import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import {
  TextInput,
  Switch,
  Button,
  Text,
  Card,
  Divider,
  Snackbar,
  useTheme,
  ActivityIndicator,
} from 'react-native-paper';
import { useAppDispatch, useAppSelector } from '../store';
import { fetchSettings, saveSettingsAsync } from '../store/settingsSlice';
import { requestFolderAccessPermission } from '../services/excelService';
import { AppSettings } from '../types';

export const SettingsScreen: React.FC = () => {
  const theme = useTheme();
  const dispatch = useAppDispatch();
  const { settings, loading } = useAppSelector((state) => state.settings);

  const [formState, setFormState] = useState<AppSettings>(settings);
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMsg, setSnackbarMsg] = useState('');

  useEffect(() => {
    dispatch(fetchSettings());
  }, [dispatch]);

  useEffect(() => {
    setFormState(settings);
  }, [settings]);

  const handleChange = (field: keyof AppSettings, value: any) => {
    setFormState((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSave = async () => {
    if (!formState.storeName.trim()) {
      Alert.alert('Validation Error', 'Store Name cannot be empty.');
      return;
    }

    try {
      await dispatch(saveSettingsAsync(formState)).unwrap();
      setSnackbarMsg('Settings saved successfully!');
      setSnackbarVisible(true);
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to save settings');
    }
  };

  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={{ marginTop: 8 }}>Loading Settings...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Store Info Card */}
        <Card style={styles.card} mode="elevated">
          <Card.Title title="Store Branding & Profile" subtitle="General store information for receipts" />
          <Card.Content>
            <TextInput
              label="Store Name"
              value={formState.storeName}
              onChangeText={(txt) => handleChange('storeName', txt)}
              mode="outlined"
              style={styles.input}
              left={<TextInput.Icon icon="store" />}
            />

            <TextInput
              label="Store Address"
              value={formState.address}
              onChangeText={(txt) => handleChange('address', txt)}
              mode="outlined"
              multiline
              numberOfLines={2}
              style={styles.input}
              left={<TextInput.Icon icon="map-marker" />}
            />

            <TextInput
              label="Phone Number"
              value={formState.phone}
              onChangeText={(txt) => handleChange('phone', txt)}
              mode="outlined"
              keyboardType="phone-pad"
              style={styles.input}
              left={<TextInput.Icon icon="phone" />}
            />
          </Card.Content>
        </Card>

        {/* Tax & Financial Settings */}
        <Card style={styles.card} mode="elevated">
          <Card.Title title="Tax & Currency Settings" subtitle="Configure GST percentage & symbols" />
          <Card.Content>
            <View style={styles.switchRow}>
              <View style={styles.switchTextCol}>
                <Text variant="titleMedium">Enable GST Calculation</Text>
                <Text variant="bodySmall" style={styles.subText}>
                  Automatically add tax to checkout totals
                </Text>
              </View>
              <Switch
                value={formState.gstEnabled}
                onValueChange={(val) => handleChange('gstEnabled', val)}
                color={theme.colors.primary}
              />
            </View>

            {formState.gstEnabled && (
              <TextInput
                label="GST Percentage (%)"
                value={formState.gstPercentage.toString()}
                onChangeText={(txt) =>
                  handleChange('gstPercentage', parseFloat(txt) || 0)
                }
                mode="outlined"
                keyboardType="numeric"
                style={styles.input}
                left={<TextInput.Icon icon="percent" />}
              />
            )}

            <Divider style={styles.divider} />

            <TextInput
              label="Currency Symbol"
              value={formState.currencySymbol}
              onChangeText={(txt) => handleChange('currencySymbol', txt)}
              mode="outlined"
              style={styles.input}
              left={<TextInput.Icon icon="currency-usd" />}
            />
          </Card.Content>
        </Card>

        {/* Preferences & Print */}
        <Card style={styles.card} mode="elevated">
          <Card.Title title="Receipt & System Preferences" subtitle="Receipt footer and auto printing" />
          <Card.Content>
            <TextInput
              label="Receipt Footer Message"
              value={formState.footerMessage}
              onChangeText={(txt) => handleChange('footerMessage', txt)}
              mode="outlined"
              multiline
              numberOfLines={2}
              style={styles.input}
              left={<TextInput.Icon icon="text" />}
            />

            <View style={styles.switchRow}>
              <View style={styles.switchTextCol}>
                <Text variant="titleMedium">Auto Print Receipt</Text>
                <Text variant="bodySmall" style={styles.subText}>
                  Open receipt modal immediately upon invoice generation
                </Text>
              </View>
              <Switch
                value={formState.autoPrint}
                onValueChange={(val) => handleChange('autoPrint', val)}
                color={theme.colors.primary}
              />
            </View>
          </Card.Content>
        </Card>

        {/* Storage & Daily Folder Permissions */}
        <Card style={styles.card} mode="elevated">
          <Card.Title
            title="Folder & Storage Permissions"
            subtitle="Daily automatic Excel bill saving location"
          />
          <Card.Content>
            <Text variant="bodyMedium" style={{ fontWeight: 'bold', color: '#1A237E', marginBottom: 4 }}>
              📁 Current Storage Location:
            </Text>
            <Text variant="bodySmall" style={{ color: '#424242', marginBottom: 12 }}>
              {formState.exportFolderName
                ? `Authorized Folder: ${formState.exportFolderName}`
                : 'Default System Storage (POS_Exports/YYYY-MM-DD/)'}
            </Text>

            <Button
              mode="outlined"
              icon="folder-key-network"
              onPress={async () => {
                const result = await requestFolderAccessPermission();
                if (result) {
                  handleChange('exportFolderUri', result.uri);
                  handleChange('exportFolderName', result.name);
                  Alert.alert('Permission Granted', `Selected storage folder: ${result.name}`);
                } else {
                  Alert.alert(
                    'Folder Permission',
                    'Storage access granted for local downloads & app storage.'
                  );
                }
              }}
              style={styles.folderBtn}
            >
              {formState.exportFolderName ? 'Change Storage Folder' : 'Grant Custom Folder Permission'}
            </Button>
          </Card.Content>
        </Card>

        <Button
          mode="contained"
          icon="content-save"
          onPress={handleSave}
          style={styles.saveBtn}
          contentStyle={styles.saveBtnContent}
          labelStyle={styles.saveBtnLabel}
        >
          Save Settings
        </Button>
      </ScrollView>

      <Snackbar
        visible={snackbarVisible}
        onDismiss={() => setSnackbarVisible(false)}
        duration={3000}
        style={{ backgroundColor: '#2E7D32' }}
      >
        {snackbarMsg}
      </Snackbar>
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
  scrollContent: {
    padding: 12,
    paddingBottom: 30,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    marginBottom: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
  },
  input: {
    marginBottom: 12,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 8,
  },
  switchTextCol: {
    flex: 1,
    paddingRight: 10,
  },
  subText: {
    color: '#757575',
    marginTop: 2,
  },
  divider: {
    marginVertical: 10,
  },
  saveBtn: {
    marginTop: 8,
    borderRadius: 10,
  },
  saveBtnContent: {
    height: 48,
  },
  saveBtnLabel: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  folderBtn: {
    marginTop: 4,
    borderRadius: 8,
  },
});
