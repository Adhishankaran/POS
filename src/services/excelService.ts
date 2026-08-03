import * as XLSX from 'xlsx';
import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { Invoice, ExcelExportReport } from '../types';

/**
 * Pure JS Uint8Array to Base64 String converter
 * Works reliably on all Hermes, React Native, iOS & Android runtimes
 */
const uint8ArrayToBase64 = (bytes: Uint8Array): string => {
  const base64Chars =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  let base64 = '';
  let i = 0;
  const len = bytes.byteLength;

  while (i < len) {
    const a = bytes[i++];
    const b = i < len ? bytes[i++] : NaN;
    const c = i < len ? bytes[i++] : NaN;

    const triple =
      (a << 16) | ((isNaN(b) ? 0 : b) << 8) | (isNaN(c) ? 0 : c);

    base64 += base64Chars[(triple >> 18) & 0x3f];
    base64 += base64Chars[(triple >> 12) & 0x3f];
    base64 += isNaN(b) ? '=' : base64Chars[(triple >> 6) & 0x3f];
    base64 += isNaN(c) ? '=' : base64Chars[triple & 0x3f];
  }

  return base64;
};

/**
 * Requests Directory Access Permission from the user (Android SAF / Web / iOS)
 */
export const requestFolderAccessPermission = async (): Promise<{
  uri: string;
  name: string;
} | null> => {
  try {
    if (Platform.OS === 'android' && FileSystem.StorageAccessFramework) {
      const permissions =
        await FileSystem.StorageAccessFramework.requestDirectoryPermissionsAsync();
      if (permissions.granted) {
        const uri = permissions.directoryUri;
        const decoded = decodeURIComponent(uri);
        const folderName = decoded.split(':').pop() || 'Selected Export Folder';
        return { uri, name: folderName };
      }
    }
  } catch (error) {
    console.error('Error requesting directory permission:', error);
  }
  return null;
};

/**
 * Generates Excel sheet for Adhi Stores
 * Saves into user granted folder path or default cache/document directory
 * Filename format: Adhi_Stores_Sales_YYYY-MM-DD_HH-MM-SS.xlsx
 */
export const exportInvoicesToExcel = async (
  invoices: Invoice[],
  customTitle: string = 'Adhi_Stores_Sales',
  customFolderUri?: string
): Promise<ExcelExportReport> => {
  const now = new Date();
  const year = now.getFullYear();
  const month = (now.getMonth() + 1).toString().padStart(2, '0');
  const day = now.getDate().toString().padStart(2, '0');
  const dateFolder = `${year}-${month}-${day}`;

  const hours = now.getHours().toString().padStart(2, '0');
  const minutes = now.getMinutes().toString().padStart(2, '0');
  const seconds = now.getSeconds().toString().padStart(2, '0');
  const timeStampStr = `${hours}-${minutes}-${seconds}`;

  const fileName = `${customTitle}_${dateFolder}_${timeStampStr}.xlsx`;

  // Map invoice data into structured tabular format
  const excelRows: any[] = [];

  invoices.forEach((inv) => {
    inv.items.forEach((item, idx) => {
      excelRows.push({
        'Store Name': inv.storeName || 'Adhi Stores',
        'Invoice Number': inv.invoiceNumber,
        'Date': inv.date,
        'Time': inv.time,
        'Item S.No': idx + 1,
        'Product Name': item.product.name,
        'Category': item.product.category,
        'Unit Price': item.product.price,
        'Quantity': item.quantity,
        'Item Total': item.product.price * item.quantity,
        'Bill Subtotal': idx === 0 ? inv.subtotal : '',
        'Discount Amount': idx === 0 ? inv.discountAmount : '',
        'Taxable Subtotal': idx === 0 ? inv.taxableAmount : '',
        [`GST (${inv.gstPercentage}%)`]: idx === 0 ? inv.gstAmount : '',
        'Grand Total': idx === 0 ? `${inv.currencySymbol}${inv.grandTotal}` : '',
      });
    });
  });

  // Build SheetJS workbook
  const worksheet = XLSX.utils.json_to_sheet(excelRows);

  worksheet['!cols'] = [
    { wch: 18 }, // Store Name
    { wch: 20 }, // Invoice Number
    { wch: 12 }, // Date
    { wch: 10 }, // Time
    { wch: 10 }, // Item S.No
    { wch: 26 }, // Product Name
    { wch: 14 }, // Category
    { wch: 12 }, // Unit Price
    { wch: 10 }, // Quantity
    { wch: 12 }, // Item Total
    { wch: 14 }, // Bill Subtotal
    { wch: 14 }, // Discount Amount
    { wch: 14 }, // Taxable Subtotal
    { wch: 14 }, // GST
    { wch: 16 }, // Grand Total
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Adhi Stores Sales');

  // Generate binary array buffer output & encode to Base64
  const wboutArray = XLSX.write(workbook, { type: 'array', bookType: 'xlsx' });
  const base64Data = uint8ArrayToBase64(new Uint8Array(wboutArray));

  if (Platform.OS === 'web') {
    // Browser download
    const blob = new Blob([wboutArray], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    return {
      folderName: `Downloads/${dateFolder}`,
      fileName,
      filePath: `Downloads/${fileName}`,
      exportTime: `${dateFolder} ${hours}:${minutes}:${seconds}`,
      recordCount: invoices.length,
    };
  } else {
    // Check if custom user-granted SAF folder is available on Android
    if (
      Platform.OS === 'android' &&
      customFolderUri &&
      FileSystem.StorageAccessFramework
    ) {
      try {
        const fileUri = await FileSystem.StorageAccessFramework.createFileAsync(
          customFolderUri,
          fileName,
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        );
        await FileSystem.writeAsStringAsync(fileUri, base64Data, {
          encoding: 'base64',
        });

        return {
          folderName: 'User Authorized Folder',
          fileName,
          filePath: fileUri,
          exportTime: `${dateFolder} ${hours}:${minutes}:${seconds}`,
          recordCount: invoices.length,
        };
      } catch (err) {
        console.warn('Failed writing to SAF custom folder, falling back to cacheDirectory', err);
      }
    }

    // Default Native FileSystem location (cacheDirectory avoids permission errors)
    const directoryPath = FileSystem.cacheDirectory || FileSystem.documentDirectory || '';
    const filePath = `${directoryPath}${fileName}`;

    await FileSystem.writeAsStringAsync(filePath, base64Data, {
      encoding: 'base64',
    });

    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(filePath, {
        mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        dialogTitle: `Export Adhi Stores Excel - ${fileName}`,
        UTI: 'com.microsoft.excel.xlsx',
      });
    }

    return {
      folderName: `Exports/${dateFolder}`,
      fileName,
      filePath,
      exportTime: `${dateFolder} ${hours}:${minutes}:${seconds}`,
      recordCount: invoices.length,
    };
  }
};
