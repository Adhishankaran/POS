import React, { useState, useMemo } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  FlatList,
} from 'react-native';
import {
  Text,
  Surface,
  Chip,
  Button,
  Divider,
  ProgressBar,
  useTheme,
  Card,
  IconButton,
} from 'react-native-paper';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useAppSelector } from '../store';
import { formatCurrency } from '../utils/constants';
import { exportInvoicesToExcel } from '../services/excelService';
import { Invoice } from '../types';

export const AnalyticsScreen: React.FC = () => {
  const theme = useTheme();
  const invoices = useAppSelector((state) => state.invoice.invoices);
  const settings = useAppSelector((state) => state.settings.settings);

  const [selectedMonthKey, setSelectedMonthKey] = useState<string>('ALL');
  const [exportingExcel, setExportingExcel] = useState(false);

  // Extract unique months from invoice history (e.g. "Aug 2026", "Jul 2026")
  const monthOptions = useMemo(() => {
    const monthsMap = new Map<string, { label: string; key: string }>();

    invoices.forEach((inv) => {
      const dateObj = new Date(inv.timestamp);
      if (!isNaN(dateObj.getTime())) {
        const monthLabel = dateObj.toLocaleString('en-US', {
          month: 'short',
          year: 'numeric',
        });
        const monthKey = `${dateObj.getFullYear()}-${(dateObj.getMonth() + 1)
          .toString()
          .padStart(2, '0')}`;
        monthsMap.set(monthKey, { label: monthLabel, key: monthKey });
      }
    });

    const sorted = Array.from(monthsMap.values()).sort((a, b) =>
      b.key.localeCompare(a.key)
    );
    return [{ label: 'All Time', key: 'ALL' }, ...sorted];
  }, [invoices]);

  // Filter invoices based on selected month
  const filteredInvoices = useMemo(() => {
    if (selectedMonthKey === 'ALL') return invoices;

    return invoices.filter((inv) => {
      const dateObj = new Date(inv.timestamp);
      if (isNaN(dateObj.getTime())) return false;
      const monthKey = `${dateObj.getFullYear()}-${(dateObj.getMonth() + 1)
        .toString()
        .padStart(2, '0')}`;
      return monthKey === selectedMonthKey;
    });
  }, [invoices, selectedMonthKey]);

  // Analytics Metrics Calculations
  const analyticsData = useMemo(() => {
    const totalRevenue = filteredInvoices.reduce((sum, i) => sum + i.grandTotal, 0);
    const totalOrders = filteredInvoices.length;
    const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
    const totalGst = filteredInvoices.reduce((sum, i) => sum + i.gstAmount, 0);
    const totalDiscount = filteredInvoices.reduce((sum, i) => sum + i.discountAmount, 0);
    const totalItemsSold = filteredInvoices.reduce(
      (sum, i) => sum + i.items.reduce((s, item) => s + item.quantity, 0),
      0
    );

    // Product performance map
    const productMap = new Map<
      string,
      { id: string; name: string; category: string; qty: number; revenue: number }
    >();

    // Category performance map
    const categoryMap = new Map<string, { category: string; revenue: number; qty: number }>();

    filteredInvoices.forEach((inv) => {
      inv.items.forEach((item) => {
        const prodId = item.product.id;
        const itemRevenue = item.product.price * item.quantity;

        // Product stats
        const existingProd = productMap.get(prodId) || {
          id: prodId,
          name: item.product.name,
          category: item.product.category,
          qty: 0,
          revenue: 0,
        };
        existingProd.qty += item.quantity;
        existingProd.revenue += itemRevenue;
        productMap.set(prodId, existingProd);

        // Category stats
        const catName = item.product.category || 'General';
        const existingCat = categoryMap.get(catName) || {
          category: catName,
          revenue: 0,
          qty: 0,
        };
        existingCat.revenue += itemRevenue;
        existingCat.qty += item.quantity;
        categoryMap.set(catName, existingCat);
      });
    });

    const topProducts = Array.from(productMap.values()).sort((a, b) => b.revenue - a.revenue);
    const topCategories = Array.from(categoryMap.values()).sort((a, b) => b.revenue - a.revenue);

    return {
      totalRevenue,
      totalOrders,
      avgOrderValue,
      totalGst,
      totalDiscount,
      totalItemsSold,
      topProducts,
      topCategories,
    };
  }, [filteredInvoices]);

  const handleExportAnalyticsExcel = async () => {
    if (filteredInvoices.length === 0) {
      Alert.alert('No Data', 'No sales invoices available for the selected month to export.');
      return;
    }

    try {
      setExportingExcel(true);
      const selectedMonthLabel =
        monthOptions.find((m) => m.key === selectedMonthKey)?.label || 'Report';

      const res = await exportInvoicesToExcel(
        filteredInvoices,
        `POS_Analytics_${selectedMonthLabel.replace(/\s+/g, '_')}`,
        settings.exportFolderUri,
        true
      );
      Alert.alert(
        'Analytics Report Exported! 📊',
        `Successfully generated Excel report for ${selectedMonthLabel}.\nFile: ${res.fileName}`
      );
    } catch (e: any) {
      Alert.alert('Export Failed', e.message || 'Could not export analytics Excel.');
    } finally {
      setExportingExcel(false);
    }
  };

  const selectedMonthLabel =
    monthOptions.find((m) => m.key === selectedMonthKey)?.label || 'All Time';

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Month Filter Selector */}
      <Surface style={styles.filterSection} elevation={2}>
        <View style={styles.filterHeader}>
          <Text variant="titleMedium" style={styles.filterTitle}>
            📊 Sales Period Insights
          </Text>
          <Button
            mode="contained-tonal"
            icon="file-excel-box"
            compact
            onPress={handleExportAnalyticsExcel}
            loading={exportingExcel}
            labelStyle={styles.exportBtnText}
          >
            Export Report
          </Button>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.monthScroll}>
          {monthOptions.map((opt) => (
            <Chip
              key={opt.key}
              selected={selectedMonthKey === opt.key}
              onPress={() => setSelectedMonthKey(opt.key)}
              style={[
                styles.monthChip,
                selectedMonthKey === opt.key && { backgroundColor: theme.colors.primary },
              ]}
              textStyle={{
                color: selectedMonthKey === opt.key ? '#FFFFFF' : '#424242',
                fontWeight: selectedMonthKey === opt.key ? 'bold' : '600',
                fontSize: 12,
              }}
            >
              {opt.label}
            </Chip>
          ))}
        </ScrollView>
      </Surface>

      {/* KPI Cards Grid */}
      <View style={styles.kpiGrid}>
        {/* Total Revenue */}
        <Surface style={[styles.kpiCard, { borderLeftColor: '#10B981', borderLeftWidth: 5 }]} elevation={2}>
          <View style={styles.kpiHeaderRow}>
            <Text style={styles.kpiLabel}>TOTAL REVENUE</Text>
            <MaterialCommunityIcons name="currency-inr" size={22} color="#10B981" />
          </View>
          <Text variant="headlineMedium" style={[styles.kpiValue, { color: '#10B981' }]}>
            {formatCurrency(analyticsData.totalRevenue, settings.currencySymbol)}
          </Text>
          <Text style={styles.kpiSubText}>
            Month: <Text style={{ fontWeight: 'bold' }}>{selectedMonthLabel}</Text>
          </Text>
        </Surface>

        {/* Total Orders */}
        <Surface style={[styles.kpiCard, { borderLeftColor: '#2563EB', borderLeftWidth: 5 }]} elevation={2}>
          <View style={styles.kpiHeaderRow}>
            <Text style={styles.kpiLabel}>TOTAL INVOICES</Text>
            <MaterialCommunityIcons name="receipt" size={22} color="#2563EB" />
          </View>
          <Text variant="headlineMedium" style={[styles.kpiValue, { color: '#2563EB' }]}>
            {analyticsData.totalOrders}
          </Text>
          <Text style={styles.kpiSubText}>{analyticsData.totalItemsSold} items sold</Text>
        </Surface>

        {/* Avg Order Value */}
        <Surface style={[styles.kpiCard, { borderLeftColor: '#8B5CF6', borderLeftWidth: 5 }]} elevation={2}>
          <View style={styles.kpiHeaderRow}>
            <Text style={styles.kpiLabel}>AVG ORDER VALUE</Text>
            <MaterialCommunityIcons name="calculator" size={22} color="#8B5CF6" />
          </View>
          <Text variant="headlineMedium" style={[styles.kpiValue, { color: '#8B5CF6' }]}>
            {formatCurrency(analyticsData.avgOrderValue, settings.currencySymbol)}
          </Text>
          <Text style={styles.kpiSubText}>Per billing receipt</Text>
        </Surface>

        {/* Total GST & Discounts */}
        <Surface style={[styles.kpiCard, { borderLeftColor: '#F59E0B', borderLeftWidth: 5 }]} elevation={2}>
          <View style={styles.kpiHeaderRow}>
            <Text style={styles.kpiLabel}>TAX & DISCOUNTS</Text>
            <MaterialCommunityIcons name="percent" size={22} color="#F59E0B" />
          </View>
          <Text variant="titleLarge" style={[styles.kpiValue, { color: '#F59E0B' }]}>
            GST: {formatCurrency(analyticsData.totalGst, settings.currencySymbol)}
          </Text>
          <Text style={styles.kpiSubText}>
            Discount Given: {formatCurrency(analyticsData.totalDiscount, settings.currencySymbol)}
          </Text>
        </Surface>
      </View>

      {/* Category Performance Breakdown */}
      <Card style={styles.cardSection} mode="elevated">
        <Card.Content>
          <View style={styles.sectionHeaderRow}>
            <MaterialCommunityIcons name="shape-outline" size={20} color={theme.colors.primary} />
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Category Sales Contribution
            </Text>
          </View>
          <Divider style={{ marginVertical: 8 }} />

          {analyticsData.topCategories.length === 0 ? (
            <Text style={styles.emptyText}>No sales recorded for this period.</Text>
          ) : (
            analyticsData.topCategories.map((cat) => {
              const percentage =
                analyticsData.totalRevenue > 0
                  ? (cat.revenue / analyticsData.totalRevenue) * 100
                  : 0;
              return (
                <View key={cat.category} style={styles.categoryProgressRow}>
                  <View style={styles.catNameRow}>
                    <Text style={styles.catName}>{cat.category}</Text>
                    <Text style={styles.catVal}>
                      {formatCurrency(cat.revenue, settings.currencySymbol)} ({percentage.toFixed(1)}%)
                    </Text>
                  </View>
                  <ProgressBar
                    progress={percentage / 100}
                    color={theme.colors.primary}
                    style={styles.progressBar}
                  />
                </View>
              );
            })
          )}
        </Card.Content>
      </Card>

      {/* Top Performing Products */}
      <Card style={styles.cardSection} mode="elevated">
        <Card.Content>
          <View style={styles.sectionHeaderRow}>
            <MaterialCommunityIcons name="trophy" size={20} color="#F59E0B" />
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Top Selling Products
            </Text>
          </View>
          <Divider style={{ marginVertical: 8 }} />

          {analyticsData.topProducts.length === 0 ? (
            <Text style={styles.emptyText}>No product sales data available.</Text>
          ) : (
            analyticsData.topProducts.slice(0, 5).map((prod, index) => (
              <View key={prod.id} style={styles.topProdRow}>
                <View
                  style={[
                    styles.rankBadge,
                    {
                      backgroundColor:
                        index === 0 ? '#FEF3C7' : index === 1 ? '#E0E7FF' : '#F3F4F6',
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.rankText,
                      {
                        color:
                          index === 0 ? '#D97706' : index === 1 ? '#4338CA' : '#4B5563',
                      },
                    ]}
                  >
                    #{index + 1}
                  </Text>
                </View>

                <View style={styles.prodDetails}>
                  <Text style={styles.prodName}>{prod.name}</Text>
                  <Text style={styles.prodMeta}>
                    Category: {prod.category} | Qty Sold: {prod.qty}
                  </Text>
                </View>

                <Text style={styles.prodRevenue}>
                  {formatCurrency(prod.revenue, settings.currencySymbol)}
                </Text>
              </View>
            ))
          )}
        </Card.Content>
      </Card>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  content: {
    padding: 12,
    paddingBottom: 40,
  },
  filterSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
  },
  filterHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  filterTitle: {
    fontWeight: 'bold',
    color: '#1E293B',
  },
  exportBtnText: {
    fontSize: 11,
    fontWeight: 'bold',
  },
  monthScroll: {
    flexDirection: 'row',
  },
  monthChip: {
    marginRight: 6,
    height: 34,
  },
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  kpiCard: {
    width: '48.5%',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
  },
  kpiHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  kpiLabel: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#64748B',
    letterSpacing: 0.5,
  },
  kpiValue: {
    fontWeight: 'bold',
    marginVertical: 4,
  },
  kpiSubText: {
    fontSize: 11,
    color: '#94A3B8',
  },
  cardSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    marginBottom: 12,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionTitle: {
    fontWeight: 'bold',
    marginLeft: 8,
    color: '#0F172A',
  },
  emptyText: {
    textAlign: 'center',
    color: '#94A3B8',
    marginVertical: 12,
    fontStyle: 'italic',
  },
  categoryProgressRow: {
    marginVertical: 6,
  },
  catNameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  catName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
  },
  catVal: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  progressBar: {
    height: 7,
    borderRadius: 4,
    backgroundColor: '#E2E8F0',
  },
  topProdRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 6,
  },
  rankBadge: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  rankText: {
    fontWeight: 'bold',
    fontSize: 13,
  },
  prodDetails: {
    flex: 1,
  },
  prodName: {
    fontWeight: 'bold',
    fontSize: 14,
    color: '#1E293B',
  },
  prodMeta: {
    fontSize: 11,
    color: '#64748B',
  },
  prodRevenue: {
    fontWeight: 'bold',
    fontSize: 14,
    color: '#059669',
  },
});
