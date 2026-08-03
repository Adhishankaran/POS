# 🛒 Modern React Native POS Billing Application (TypeScript)

A production-quality, scalable Point of Sale (POS) Billing Application built with **React Native**, **TypeScript**, **Redux Toolkit**, **AsyncStorage**, **React Native Paper**, and **SheetJS (XLSX)** for date/time structured Excel local storage exports.

---

## 🌟 Key Features

1. **Billing & Cart Engine**:
   - Product catalog with search and category chip filters (Groceries, Dairy, Beverages, Snacks).
   - Dynamic cart sheet with quantity increment, decrement, and item removal.
   - Discount support (Percentage `%` or Fixed amount `₹`).
   - Automated Subtotal, GST Tax (configurable %), and Grand Total calculation.
   - One-tap Invoice & Receipt generation.

2. **Excel Sheet Local Storage & Evidence**:
   - Every invoice is automatically structured and saved as an Excel Spreadsheet (`.xlsx`).
   - Organized into Date/Time timestamped folders: `POS_Exports/YYYY-MM-DD/`.
   - Filenames include exact invoice ID and timestamp: `Invoice_INV-20260801-XXXX_21-19-24.xlsx`.
   - Complete Master Log export for all historical invoices.

3. **Receipt Screen**:
   - Thermal receipt style layout showing Store Name, Address, Phone, Invoice No, Date & Time.
   - Itemized product list with price, quantity, subtotal, discount, GST, and total.
   - Quick "Save Excel" download/share action.

4. **Billing History**:
   - Persistent store of all past sales invoices powered by `@react-native-async-storage/async-storage`.
   - Search history by invoice number, date, or item name.
   - Open printable receipt modals for any past bill.
   - Bulk "Export All History to Excel" button.

5. **Store Settings & Customization**:
   - Store Name, Address, Phone Number.
   - GST Enable/Disable switch & percentage configuration.
   - Currency symbol customization (`₹`, `$`, `€`, `£`).
   - Custom footer message & Auto-print toggle.
   - Settings persisted locally.

---

## 🏗️ Clean Folder Architecture

```text
src/
 ├── assets/             # App icons & splash images
 ├── components/         # Reusable Material Design UI components
 │    ├── HeaderBar.tsx
 │    ├── ProductCard.tsx
 │    ├── CartItemRow.tsx
 │    ├── ReceiptModal.tsx
 │    └── EmptyState.tsx
 ├── hooks/              # Custom React hooks
 ├── navigation/         # React Navigation setup
 │    └── TabNavigator.tsx
 ├── screens/            # Application Screens
 │    ├── BillingScreen.tsx
 │    ├── HistoryScreen.tsx
 │    └── SettingsScreen.tsx
 ├── services/           # Local storage & Excel export services
 │    ├── storageService.ts
 │    └── excelService.ts
 ├── store/              # Redux Toolkit State Management
 │    ├── index.ts
 │    ├── billingSlice.ts
 │    ├── settingsSlice.ts
 │    └── invoiceSlice.ts
 ├── types/              # Strong TypeScript type definitions
 │    └── index.ts
 └── utils/              # Product catalog & constants
      └── constants.ts
```

---

## 🚀 Getting Started / Running Locally

### 1. Prerequisites
- Node.js (v18+)
- npm or yarn

### 2. Installation
```bash
npm install
```

### 3. Running the App
- **Web Browser (Instant Local Run)**:
  ```bash
  npm run web
  ```
- **Android / iOS (Expo Go)**:
  ```bash
  npm start
  ```

---

## 📁 Excel Storage Folder Structure & Evidence

When an invoice is generated or exported, it is saved under:
```text
POS_Exports/
 └── 2026-08-01/
      ├── Invoice_INV-20260801-4821_21-19-24.xlsx
      └── All_Invoices_MasterLog_2026-08-01_21-25-00.xlsx
```

**Sheet Columns Included:**
| Invoice No | Date | Time | Store Name | Item S.No | Product Name | Category | Unit Price | Quantity | Item Total | Subtotal | Discount | GST | Grand Total |

---

## 📱 APK Generation & Production Build Instructions

### Building Android APK using EAS (Expo Application Services)

1. Install EAS CLI globally:
   ```bash
   npm install -g eas-cli
   ```
2. Login to Expo account:
   ```bash
   eas login
   ```
3. Initialize EAS project:
   ```bash
   eas build:configure
   ```
4. Generate Android APK:
   ```bash
   npm run build:apk
   # Or directly:
   eas build -p android --profile preview
   ```
5. Once completed, the download link for your compiled `.apk` file will be printed in the terminal.

---

## 📜 License
MIT License - Free to use and customize for commercial POS deployments.
