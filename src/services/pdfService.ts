import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Invoice } from '../types';
import { formatCurrency } from '../utils/constants';

/**
 * Generates formatted HTML string for POS receipt
 */
export const generateInvoiceHtml = (invoice: Invoice): string => {
  const storeName = (invoice.storeName || 'ADHI STORES').toUpperCase();
  const address = invoice.address || 'Pollachi, Tamil Nadu';
  const phone = invoice.phone || '+91 9876543210';
  const currencySymbol = invoice.currencySymbol || '₹';
  const footerMessage = invoice.footerMessage || 'Thank You for Shopping! Visit Again.';

  const itemsHtml = invoice.items
    .map(
      (item, idx) => `
      <tr>
        <td style="padding: 6px 0;">${idx + 1}. ${item.product.name}</td>
        <td style="text-align: center; padding: 6px 0;">${item.quantity}</td>
        <td style="text-align: right; padding: 6px 0;">${formatCurrency(item.product.price, currencySymbol)}</td>
        <td style="text-align: right; font-weight: bold; padding: 6px 0;">${formatCurrency(
          item.product.price * item.quantity,
          currencySymbol
        )}</td>
      </tr>
    `
    )
    .join('');

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <style>
          body {
            font-family: 'Courier New', Courier, monospace, sans-serif;
            margin: 0;
            padding: 20px;
            color: #000;
            background-color: #fff;
            max-width: 480px;
            margin: 0 auto;
          }
          .header {
            text-align: center;
            border-bottom: 2px dashed #000;
            padding-bottom: 10px;
            margin-bottom: 12px;
          }
          .title {
            font-size: 22px;
            font-weight: bold;
            letter-spacing: 1px;
            margin: 0;
            color: #1A237E;
          }
          .subtitle {
            font-size: 12px;
            margin-top: 4px;
            color: #333;
          }
          .meta-row {
            display: flex;
            justify-content: space-between;
            font-size: 13px;
            margin-bottom: 4px;
          }
          .meta-label {
            font-weight: bold;
          }
          .divider {
            border-top: 1px dashed #000;
            margin: 8px 0;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            font-size: 13px;
            margin-top: 6px;
          }
          th {
            border-bottom: 1px solid #000;
            padding: 6px 0;
            font-size: 12px;
            text-transform: uppercase;
          }
          .summary-row {
            display: flex;
            justify-content: space-between;
            font-size: 13px;
            margin: 4px 0;
          }
          .grand-total-row {
            display: flex;
            justify-content: space-between;
            font-size: 18px;
            font-weight: bold;
            margin-top: 8px;
            padding-top: 8px;
            border-top: 2px dashed #000;
            color: #1A237E;
          }
          .footer {
            text-align: center;
            margin-top: 16px;
            padding-top: 10px;
            border-top: 2px dashed #000;
            font-weight: bold;
            font-size: 13px;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1 class="title">${storeName}</h1>
          <div class="subtitle">${address}</div>
          <div class="subtitle">Ph: ${phone}</div>
        </div>

        <div class="meta-row">
          <span class="meta-label">Invoice No:</span>
          <span>${invoice.invoiceNumber}</span>
        </div>
        <div class="meta-row">
          <span class="meta-label">Date & Time:</span>
          <span>${invoice.date} ${invoice.time}</span>
        </div>

        <div class="divider"></div>

        <table>
          <thead>
            <tr>
              <th style="text-align: left;">Item</th>
              <th style="text-align: center;">Qty</th>
              <th style="text-align: right;">Price</th>
              <th style="text-align: right;">Total</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHtml}
          </tbody>
        </table>

        <div class="divider"></div>

        <div class="summary-row">
          <span>Subtotal:</span>
          <span>${formatCurrency(invoice.subtotal, currencySymbol)}</span>
        </div>

        ${
          invoice.discountAmount > 0
            ? `<div class="summary-row">
                <span>Discount (${invoice.discount.value}${
                invoice.discount.type === 'percentage' ? '%' : ' ' + currencySymbol
              }):</span>
                <span style="color: #D32F2F;">-${formatCurrency(
                  invoice.discountAmount,
                  currencySymbol
                )}</span>
              </div>`
            : ''
        }

        ${
          invoice.gstAmount > 0
            ? `<div class="summary-row">
                <span>GST Tax (Itemized):</span>
                <span>${formatCurrency(invoice.gstAmount, currencySymbol)}</span>
              </div>`
            : ''
        }

        <div class="grand-total-row">
          <span>GRAND TOTAL:</span>
          <span>${formatCurrency(invoice.grandTotal, currencySymbol)}</span>
        </div>

        <div class="footer">
          ${footerMessage}
        </div>
      </body>
    </html>
  `;
};

/**
 * Direct Print PDF Receipt
 */
export const printInvoicePdf = async (invoice: Invoice): Promise<void> => {
  try {
    const html = generateInvoiceHtml(invoice);
    await Print.printAsync({ html });
  } catch (error) {
    console.error('Error printing PDF:', error);
    throw error;
  }
};

/**
 * Generates PDF File & Launches System Share Modal (Save to PDF / Share)
 */
export const shareInvoicePdf = async (invoice: Invoice): Promise<string> => {
  try {
    const html = generateInvoiceHtml(invoice);
    const { uri } = await Print.printToFileAsync({ html });

    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(uri, {
        mimeType: 'application/pdf',
        dialogTitle: `Share Invoice Receipt - ${invoice.invoiceNumber}`,
        UTI: 'com.adobe.pdf',
      });
    }
    return uri;
  } catch (error) {
    console.error('Error sharing PDF:', error);
    throw error;
  }
};
