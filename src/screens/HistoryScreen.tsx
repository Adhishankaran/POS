import React, { useEffect, useState } from 'react';
import { View, StyleSheet, FlatList, Alert, TouchableOpacity, Platform } from 'react-native';
import {
  Searchbar,
  Card,
  Text,
  Button,
  Chip,
  IconButton,
  Surface,
  useTheme,
  ActivityIndicator,
} from 'react-native-paper';
import { useAppDispatch, useAppSelector } from '../store';
import {
  fetchInvoices,
  setCurrentInvoice,
  clearInvoicesAsync,
} from '../store/invoiceSlice';
import { saveSettingsAsync } from '../store/settingsSlice';
import { ReceiptModal } from '../components/ReceiptModal';
import { EmptyState } from '../components/EmptyState';
import { formatCurrency } from '../utils/constants';
import { exportInvoicesToExcel, requestFolderAccessPermission } from '../services/excelService';
import { Invoice } from '../types';

export const HistoryScreen: React.FC = () => {
  const theme = useTheme();
  const dispatch = useAppDispatch();
  const { invoices, currentInvoice, loading } = useAppSelector(
    (state) => state.invoice
  );
  const settings = useAppSelector((state) => state.settings.settings);

  const [searchQuery, setSearchQuery] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [exportingAll, setExportingAll] = useState(false);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  useEffect(() => {
    dispatch(fetchInvoices());
  }, [dispatch]);

  const filteredInvoices = invoices.filter((inv) => {
    return (
      inv.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inv.date.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inv.items.some((i) =>
        i.product.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    );
  });

  const handleOpenReceipt = (invoice: Invoice) => {
    dispatch(setCurrentInvoice(invoice));
    setModalVisible(true);
  };

  const handleSelectFolder = async () => {
    const result = await requestFolderAccessPermission();
    if (result) {
      await dispatch(
        saveSettingsAsync({
          ...settings,
          exportFolderUri: result.uri,
          exportFolderName: result.name,
        })
      );
      Alert.alert(
        'Storage Folder Set!',
        `All Excel reports will be saved directly into: ${result.name}`
      );
    } else {
      Alert.alert(
        'Default Storage Active',
        'Excel files will be generated and shared directly to your device apps.'
      );
    }
  };

  const handleExportAllToExcel = async () => {
    if (invoices.length === 0) {
      Alert.alert('No Invoices', 'There are no billing records to export.');
      return;
    }

    let activeFolderUri = settings.exportFolderUri;
    let folderName = settings.exportFolderName;

    // Prompt user to select Downloads folder if not already set
    if (!activeFolderUri && Platform.OS === 'android') {
      await new Promise<void>((resolve) => {
        Alert.alert(
          'Choose Downloads Folder',
          "To save Excel files directly into your phone's Downloads folder, please tap 'Select Folder' and then tap 'USE THIS FOLDER' at the bottom of your screen.",
          [
            {
              text: 'Select Folder',
              onPress: async () => {
                const result = await requestFolderAccessPermission();
                if (result) {
                  activeFolderUri = result.uri;
                  folderName = result.name;
                  await dispatch(
                    saveSettingsAsync({
                      ...settings,
                      exportFolderUri: result.uri,
                      exportFolderName: result.name,
                    })
                  );
                }
                resolve();
              },
            },
            { text: 'Cancel', style: 'cancel', onPress: () => resolve() },
          ]
        );
      });
    }

    try {
      setExportingAll(true);
      setStatusMsg(null);
      const res = await exportInvoicesToExcel(
        invoices,
        'Adhi_Stores_MasterSalesLog',
        activeFolderUri
      );
      const msg = `Excel file created in ${folderName || res.folderName}!\nFile: ${res.fileName}`;
      setStatusMsg(`Saved to: ${folderName || res.folderName}`);
      Alert.alert('Excel Exported Successfully! 📊', msg);
    } catch (e: any) {
      setStatusMsg(`Export Error: ${e.message || e}`);
      Alert.alert('Export Error', `Could not create Excel file: ${e.message || e}`);
    } finally {
      setExportingAll(false);
    }
  };

  const handleClearHistory = () => {
    Alert.alert(
      'Clear History',
      'Are you sure you want to delete all invoice history? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete All',
          style: 'destructive',
          onPress: () => dispatch(clearInvoicesAsync()),
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      {/* Search & Actions Bar */}
      <Surface style={styles.actionHeader} elevation={2}>
        <Searchbar
          placeholder="Search by invoice #, date, or item..."
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={styles.searchbar}
          inputStyle={styles.searchInput}
        />

        {/* Folder Location Info */}
        <View style={styles.folderRow}>
          <Text variant="bodySmall" style={styles.folderText} numberOfLines={1}>
            📁 Export Location: {settings.exportFolderName || 'Device Storage / Downloads'}
          </Text>
          <TouchableOpacity onPress={handleSelectFolder}>
            <Text style={styles.changeFolderLink}>Change Folder ✏️</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.headerButtonsRow}>
          <Button
            mode="contained"
            icon="file-excel"
            onPress={handleExportAllToExcel}
            loading={exportingAll}
            style={styles.actionBtn}
            labelStyle={styles.btnLabel}
          >
            Export All to Excel
          </Button>

          {invoices.length > 0 && (
            <IconButton
              icon="trash-can-outline"
              iconColor="#D32F2F"
              size={22}
              onPress={handleClearHistory}
            />
          )}
        </View>

        {statusMsg && (
          <Text style={styles.statusBanner}>{statusMsg}</Text>
        )}
      </Surface>

      {/* Invoice List */}
      {loading ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>Loading Billing History...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredInvoices}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <Card
              style={styles.card}
              mode="elevated"
              onPress={() => handleOpenReceipt(item)}
            >
              <Card.Content style={styles.cardContent}>
                <View style={styles.topRow}>
                  <Text variant="titleMedium" style={styles.invNumber}>
                    {item.invoiceNumber}
                  </Text>
                  <Chip compact style={styles.itemBadge} textStyle={styles.itemBadgeText}>
                    {item.items.reduce((a, b) => a + b.quantity, 0)} items
                  </Chip>
                </View>

                <View style={styles.dateTimeRow}>
                  <Text variant="bodySmall" style={styles.dateText}>
                    📅 {item.date} at {item.time}
                  </Text>
                </View>

                <View style={styles.bottomRow}>
                  <Text variant="headlineSmall" style={[styles.amountText, { color: theme.colors.primary }]}>
                    {formatCurrency(item.grandTotal, item.currencySymbol)}
                  </Text>
                  <Button
                    mode="outlined"
                    compact
                    icon="receipt"
                    onPress={() => handleOpenReceipt(item)}
                  >
                    View Receipt
                  </Button>
                </View>
              </Card.Content>
            </Card>
          )}
          ListEmptyComponent={
            <EmptyState
              icon="history"
              title="No Billing History"
              description="Generated receipts and sales invoices will be displayed here."
            />
          }
        />
      )}

      {/* Receipt Modal Preview */}
      <ReceiptModal
        visible={modalVisible}
        invoice={currentInvoice}
        onDismiss={() => setModalVisible(false)}
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
  actionHeader: {
    padding: 12,
    backgroundColor: '#FFFFFF',
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
  },
  searchbar: {
    elevation: 0,
    backgroundColor: '#F0F2F5',
    borderRadius: 8,
    height: 44,
  },
  searchInput: {
    fontSize: 14,
    minHeight: 44,
  },
  folderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    paddingHorizontal: 2,
  },
  folderText: {
    color: '#424242',
    fontWeight: '600',
    flex: 1,
    marginRight: 6,
  },
  changeFolderLink: {
    color: '#3F51B5',
    fontWeight: 'bold',
    fontSize: 12,
  },
  headerButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  actionBtn: {
    flex: 1,
    marginRight: 8,
    borderRadius: 8,
  },
  btnLabel: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  statusBanner: {
    marginTop: 6,
    textAlign: 'center',
    fontSize: 11,
    fontWeight: 'bold',
    color: '#2E7D32',
    backgroundColor: '#E8F5E9',
    paddingVertical: 4,
    borderRadius: 4,
  },
  listContent: {
    padding: 12,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 8,
    color: '#757575',
  },
  card: {
    marginBottom: 10,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    elevation: 2,
  },
  cardContent: {
    padding: 12,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  invNumber: {
    fontWeight: 'bold',
    color: '#1A237E',
  },
  itemBadge: {
    backgroundColor: '#E8EAF6',
  },
  itemBadgeText: {
    fontSize: 10,
    color: '#3F51B5',
    fontWeight: 'bold',
  },
  dateTimeRow: {
    marginVertical: 4,
  },
  dateText: {
    color: '#616161',
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6,
  },
  amountText: {
    fontWeight: 'bold',
    fontSize: 18,
  },
});
