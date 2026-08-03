import React, { useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Modal, Portal, Text, Button, Surface, useTheme } from 'react-native-paper';
import { Invoice } from '../types';
import { formatCurrency } from '../utils/constants';
import { exportInvoicesToExcel } from '../services/excelService';
import { printInvoicePdf, shareInvoicePdf } from '../services/pdfService';

interface ReceiptModalProps {
  visible: boolean;
  invoice: Invoice | null;
  onDismiss: () => void;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({
  visible,
  invoice,
  onDismiss,
}) => {
  const theme = useTheme();
  const [exportingExcel, setExportingExcel] = useState(false);
  const [exportingPdf, setExportingPdf] = useState(false);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  if (!invoice) return null;

  const handleExportExcel = async () => {
    try {
      setExportingExcel(true);
      setStatusMsg(null);
      const res = await exportInvoicesToExcel([invoice], `Adhi_Stores_Invoice_${invoice.invoiceNumber}`);
      setStatusMsg(`Saved Excel: ${res.fileName}`);
    } catch (e: any) {
      setStatusMsg(`Excel error: ${e.message || e}`);
    } finally {
      setExportingExcel(false);
    }
  };

  const handlePrintPdf = async () => {
    try {
      setExportingPdf(true);
      setStatusMsg(null);
      await printInvoicePdf(invoice);
    } catch (e: any) {
      setStatusMsg(`PDF error: ${e.message || e}`);
    } finally {
      setExportingPdf(false);
    }
  };

  const handleSharePdf = async () => {
    try {
      setExportingPdf(true);
      setStatusMsg(null);
      await shareInvoicePdf(invoice);
    } catch (e: any) {
      setStatusMsg(`Share error: ${e.message || e}`);
    } finally {
      setExportingPdf(false);
    }
  };

  return (
    <Portal>
      <Modal
        visible={visible}
        onDismiss={onDismiss}
        contentContainerStyle={styles.modalContent}
      >
        <ScrollView contentContainerStyle={styles.scrollArea}>
          <Surface style={styles.thermalPaper} elevation={3}>
            {/* Store Header */}
            <Text style={styles.dashedSeparator}>==========================================</Text>
            <Text style={styles.storeTitle}>
              {(invoice.storeName || 'ADHI STORES').toUpperCase()}
            </Text>
            <Text style={styles.storeSubtitle}>{invoice.address}</Text>
            <Text style={styles.storeSubtitle}>Ph: {invoice.phone}</Text>
            <Text style={styles.dashedSeparator}>==========================================</Text>

            {/* Meta Info */}
            <View style={styles.metaRow}>
              <Text style={styles.thermalTextBold}>Invoice No :</Text>
              <Text style={styles.thermalTextBold}>{invoice.invoiceNumber}</Text>
            </View>
            <View style={styles.metaRow}>
              <Text style={styles.thermalText}>Date & Time:</Text>
              <Text style={styles.thermalText}>
                {invoice.date}  {invoice.time}
              </Text>
            </View>

            <Text style={styles.dashedLine}>------------------------------------------</Text>

            {/* Reference Table Header */}
            <View style={styles.tableHeaderRow}>
              <Text style={[styles.tableHeaderCell, { flex: 2.2, textAlign: 'left' }]}>ITEM</Text>
              <Text style={[styles.tableHeaderCell, { flex: 0.8, textAlign: 'center' }]}>QTY</Text>
              <Text style={[styles.tableHeaderCell, { flex: 1.2, textAlign: 'right' }]}>PRICE</Text>
              <Text style={[styles.tableHeaderCell, { flex: 1.2, textAlign: 'right' }]}>TOTAL</Text>
            </View>
            <Text style={styles.dashedLine}>------------------------------------------</Text>

            {/* Product Item Rows */}
            {invoice.items.map((item, idx) => (
              <View key={idx} style={styles.tableBodyRow}>
                <Text style={[styles.tableBodyCellItem, { flex: 2.2 }]} numberOfLines={2}>
                  {item.product.name}
                </Text>
                <Text style={[styles.tableBodyCell, { flex: 0.8, textAlign: 'center' }]}>
                  {item.quantity}
                </Text>
                <Text style={[styles.tableBodyCell, { flex: 1.2, textAlign: 'right' }]}>
                  {formatCurrency(item.product.price, invoice.currencySymbol)}
                </Text>
                <Text style={[styles.tableBodyCellBold, { flex: 1.2, textAlign: 'right' }]}>
                  {formatCurrency(item.product.price * item.quantity, invoice.currencySymbol)}
                </Text>
              </View>
            ))}

            <Text style={styles.dashedLine}>------------------------------------------</Text>

            {/* Subtotal */}
            <View style={styles.calcRow}>
              <Text style={styles.calcLabel}>Subtotal</Text>
              <Text style={styles.calcValue}>
                {formatCurrency(invoice.subtotal, invoice.currencySymbol)}
              </Text>
            </View>

            {/* Discount */}
            {invoice.discountAmount > 0 && (
              <View style={styles.calcRow}>
                <Text style={styles.calcLabel}>
                  Discount ({invoice.discount.value}
                  {invoice.discount.type === 'percentage' ? '%' : ' ' + invoice.currencySymbol})
                </Text>
                <Text style={[styles.calcValue, { color: '#D32F2F' }]}>
                  -{formatCurrency(invoice.discountAmount, invoice.currencySymbol)}
                </Text>
              </View>
            )}

            {/* GST */}
            {invoice.gstAmount > 0 && (
              <View style={styles.calcRow}>
                <Text style={styles.calcLabel}>GST Tax Amount</Text>
                <Text style={styles.calcValue}>
                  {formatCurrency(invoice.gstAmount, invoice.currencySymbol)}
                </Text>
              </View>
            )}

            <Text style={styles.dashedLine}>------------------------------------------</Text>

            {/* Grand Total */}
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>TOTAL</Text>
              <Text style={styles.totalValue}>
                {formatCurrency(invoice.grandTotal, invoice.currencySymbol)}
              </Text>
            </View>

            <Text style={styles.dashedSeparator}>==========================================</Text>
            <Text style={styles.thankYouMsg}>{invoice.footerMessage || 'Thank You! Visit Again.'}</Text>
            <Text style={styles.dashedSeparator}>==========================================</Text>

            {statusMsg && (
              <Text style={styles.statusText}>{statusMsg}</Text>
            )}
          </Surface>
        </ScrollView>

        {/* Action Buttons: PDF Receipt & Excel */}
        <View style={styles.actionColumn}>
          <View style={styles.actionRow}>
            <Button
              mode="contained-tonal"
              icon="file-pdf-box"
              onPress={handleSharePdf}
              loading={exportingPdf}
              style={styles.btn}
              labelStyle={styles.btnLabel}
            >
              PDF Receipt
            </Button>
            <Button
              mode="contained-tonal"
              icon="printer"
              onPress={handlePrintPdf}
              style={styles.btn}
              labelStyle={styles.btnLabel}
            >
              Print
            </Button>
          </View>

          <View style={styles.actionRow}>
            <Button
              mode="outlined"
              icon="file-excel-box"
              onPress={handleExportExcel}
              loading={exportingExcel}
              style={styles.btn}
              textColor="#FFFFFF"
              labelStyle={styles.btnLabel}
            >
              Save Excel
            </Button>
            <Button
              mode="contained"
              icon="check-circle"
              onPress={onDismiss}
              style={styles.btn}
              labelStyle={styles.btnLabel}
            >
              Done
            </Button>
          </View>
        </View>
      </Modal>
    </Portal>
  );
};

const styles = StyleSheet.create({
  modalContent: {
    backgroundColor: '#1E1E1E',
    margin: 16,
    borderRadius: 14,
    maxHeight: '92%',
    padding: 16,
    alignSelf: 'center',
    width: '100%',
    maxWidth: 520,
  },
  scrollArea: {
    maxHeight: '80%',
  },
  thermalPaper: {
    backgroundColor: '#FFFFFA',
    padding: 18,
    borderRadius: 6,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },
  dashedSeparator: {
    textAlign: 'center',
    fontWeight: 'bold',
    color: '#000000',
    letterSpacing: -0.5,
    marginVertical: 2,
    fontFamily: 'monospace',
  },
  dashedLine: {
    textAlign: 'center',
    color: '#424242',
    marginVertical: 4,
    letterSpacing: -0.5,
    fontFamily: 'monospace',
  },
  storeTitle: {
    fontWeight: 'bold',
    fontSize: 20,
    textAlign: 'center',
    color: '#000000',
    marginVertical: 4,
    letterSpacing: 1.5,
    fontFamily: 'monospace',
  },
  storeSubtitle: {
    textAlign: 'center',
    fontSize: 12,
    color: '#424242',
    marginBottom: 2,
    fontFamily: 'monospace',
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 2,
  },
  thermalText: {
    fontSize: 13,
    color: '#212121',
    fontFamily: 'monospace',
  },
  thermalTextBold: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#000000',
    fontFamily: 'monospace',
  },
  tableHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 2,
  },
  tableHeaderCell: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#000000',
    fontFamily: 'monospace',
    letterSpacing: 0.5,
  },
  tableBodyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 4,
  },
  tableBodyCellItem: {
    fontSize: 13,
    fontWeight: '600',
    color: '#000000',
    fontFamily: 'monospace',
  },
  tableBodyCell: {
    fontSize: 13,
    color: '#212121',
    fontFamily: 'monospace',
  },
  tableBodyCellBold: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#000000',
    fontFamily: 'monospace',
  },
  calcRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 3,
  },
  calcLabel: {
    fontSize: 13,
    color: '#424242',
    fontFamily: 'monospace',
  },
  calcValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#000000',
    fontFamily: 'monospace',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 6,
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000000',
    fontFamily: 'monospace',
  },
  totalValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000000',
    fontFamily: 'monospace',
  },
  thankYouMsg: {
    textAlign: 'center',
    fontSize: 14,
    fontWeight: 'bold',
    color: '#212121',
    marginVertical: 8,
    fontFamily: 'monospace',
  },
  statusText: {
    textAlign: 'center',
    fontSize: 11,
    color: '#2E7D32',
    fontWeight: 'bold',
    marginTop: 4,
  },
  actionColumn: {
    marginTop: 10,
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 3,
  },
  btn: {
    flex: 1,
    marginHorizontal: 3,
    borderRadius: 8,
  },
  btnLabel: {
    fontSize: 12,
    fontWeight: 'bold',
  },
});
