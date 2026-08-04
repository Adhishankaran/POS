import React, { useState, useMemo } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
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
  SegmentedButtons,
} from 'react-native-paper';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useAppSelector } from '../store';
import { formatCurrency } from '../utils/constants';
import { exportInvoicesToExcel } from '../services/excelService';

export const AnalyticsScreen: React.FC = () => {
  const theme = useTheme();
  const invoices = useAppSelector((state) => state.invoice.invoices);
  const products = useAppSelector((state) => state.billing.products);
  const settings = useAppSelector((state) => state.settings.settings);

  const currentYear = new Date().getFullYear();
  const currentMonthIdx = new Date().getMonth();

  // Generate 12 months for current year + All Time option
  const monthOptions = useMemo(() => {
    const monthNames = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
    ];

    const list = [{ label: 'All Time', key: 'ALL' }];

    // Show months up to current month (or all 12 months)
    for (let i = 0; i < 12; i++) {
      const monthKey = `${currentYear}-${(i + 1).toString().padStart(2, '0')}`;
      list.push({
        label: `${monthNames[i]} ${currentYear}`,
        key: monthKey,
      });
    }

    return list;
  }, [currentYear]);

  // Default to current month key e.g. "2026-08" or "ALL"
  const defaultMonthKey = `${currentYear}-${(currentMonthIdx + 1).toString().padStart(2, '0')}`;
  const [selectedMonthKey, setSelectedMonthKey] = useState<string>(defaultMonthKey);
  const [productTab, setProductTab] = useState<'sold' | 'unsold'>('sold');
  const [exportingExcel, setExportingExcel] = useState(false);

  // Filter invoices for selected month
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

  // Analytics Metrics & Daily Trend Graph Data
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

    // Map sales by day of month for the Bar Graph
    const dailySalesMap = new Map<string, number>();
    filteredInvoices.forEach((inv) => {
      const dateObj = new Date(inv.timestamp);
      const dayLabel = !isNaN(dateObj.getTime())
        ? `${dateObj.getDate()} ${dateObj.toLocaleString('en-US', { month: 'short' })}`
        : inv.date;

      const currentDaySales = dailySalesMap.get(dayLabel) || 0;
      dailySalesMap.set(dayLabel, currentDaySales + inv.grandTotal);
    });

    const dailySalesGraph = Array.from(dailySalesMap.entries()).map(([day, amount]) => ({
      day,
      amount,
    }));

    const maxDailySales = Math.max(...dailySalesGraph.map((d) => d.amount), 1);

    // Sold products map (ID -> quantity sold & revenue)
    const soldMap = new Map<string, { qty: number; revenue: number }>();
    filteredInvoices.forEach((inv) => {
      inv.items.forEach((item) => {
        const id = item.product.id;
        const existing = soldMap.get(id) || { qty: 0, revenue: 0 };
        existing.qty += item.quantity;
        existing.revenue += item.product.price * item.quantity;
        soldMap.set(id, existing);
      });
    });

    // Categorize all store inventory products into Sold and Unsold
    const soldProductsList: Array<{
      product: typeof products[0];
      qtySold: number;
      revenue: number;
    }> = [];

    const unsoldProductsList: Array<typeof products[0]> = [];

    products.forEach((p) => {
      const soldData = soldMap.get(p.id);
      if (soldData && soldData.qty > 0) {
        soldProductsList.push({
          product: p,
          qtySold: soldData.qty,
          revenue: soldData.revenue,
        });
      } else {
        unsoldProductsList.push(p);
      }
    });

    // Sort sold products by revenue descending
    soldProductsList.sort((a, b) => b.revenue - a.revenue);

    // Category Sales Distribution
    const categoryMap = new Map<string, number>();
    soldProductsList.forEach((sp) => {
      const cat = sp.product.category || 'General';
      const prev = categoryMap.get(cat) || 0;
      categoryMap.set(cat, prev + sp.revenue);
    });

    const categoryDistribution = Array.from(categoryMap.entries())
      .map(([category, revenue]) => ({ category, revenue }))
      .sort((a, b) => b.revenue - a.revenue);

    return {
      totalRevenue,
      totalOrders,
      avgOrderValue,
      totalGst,
      totalDiscount,
      totalItemsSold,
      dailySalesGraph,
      maxDailySales,
      soldProductsList,
      unsoldProductsList,
      categoryDistribution,
    };
  }, [filteredInvoices, products]);

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
      {/* Month Selection Bar */}
      <Surface style={styles.filterSection} elevation={2}>
        <View style={styles.filterHeader}>
          <Text variant="titleMedium" style={styles.filterTitle}>
            📅 Select Sales Month
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
                color: selectedMonthKey === opt.key ? '#FFFFFF' : '#334155',
                fontWeight: selectedMonthKey === opt.key ? 'bold' : '600',
                fontSize: 12,
              }}
            >
              {opt.label}
            </Chip>
          ))}
        </ScrollView>
      </Surface>

      {/* Overview KPI Cards */}
      <View style={styles.kpiGrid}>
        {/* Total Revenue */}
        <Surface style={[styles.kpiCard, { borderLeftColor: '#10B981', borderLeftWidth: 4 }]} elevation={2}>
          <View style={styles.kpiHeaderRow}>
            <Text style={styles.kpiLabel}>TOTAL REVENUE</Text>
            <MaterialCommunityIcons name="currency-inr" size={20} color="#10B981" />
          </View>
          <Text variant="headlineSmall" style={[styles.kpiValue, { color: '#10B981' }]}>
            {formatCurrency(analyticsData.totalRevenue, settings.currencySymbol)}
          </Text>
          <Text style={styles.kpiSubText}>{selectedMonthLabel}</Text>
        </Surface>

        {/* Total Invoices */}
        <Surface style={[styles.kpiCard, { borderLeftColor: '#2563EB', borderLeftWidth: 4 }]} elevation={2}>
          <View style={styles.kpiHeaderRow}>
            <Text style={styles.kpiLabel}>TOTAL ORDERS</Text>
            <MaterialCommunityIcons name="receipt" size={20} color="#2563EB" />
          </View>
          <Text variant="headlineSmall" style={[styles.kpiValue, { color: '#2563EB' }]}>
            {analyticsData.totalOrders}
          </Text>
          <Text style={styles.kpiSubText}>{analyticsData.totalItemsSold} items sold</Text>
        </Surface>

        {/* Avg Order Value */}
        <Surface style={[styles.kpiCard, { borderLeftColor: '#8B5CF6', borderLeftWidth: 4 }]} elevation={2}>
          <View style={styles.kpiHeaderRow}>
            <Text style={styles.kpiLabel}>AVG ORDER VALUE</Text>
            <MaterialCommunityIcons name="calculator" size={20} color="#8B5CF6" />
          </View>
          <Text variant="titleLarge" style={[styles.kpiValue, { color: '#8B5CF6' }]}>
            {formatCurrency(analyticsData.avgOrderValue, settings.currencySymbol)}
          </Text>
          <Text style={styles.kpiSubText}>Per customer bill</Text>
        </Surface>

        {/* Tax & Discounts */}
        <Surface style={[styles.kpiCard, { borderLeftColor: '#F59E0B', borderLeftWidth: 4 }]} elevation={2}>
          <View style={styles.kpiHeaderRow}>
            <Text style={styles.kpiLabel}>TAX & DISCOUNTS</Text>
            <MaterialCommunityIcons name="percent" size={20} color="#F59E0B" />
          </View>
          <Text variant="titleMedium" style={[styles.kpiValue, { color: '#F59E0B' }]}>
            GST: {formatCurrency(analyticsData.totalGst, settings.currencySymbol)}
          </Text>
          <Text style={styles.kpiSubText}>
            Discount: {formatCurrency(analyticsData.totalDiscount, settings.currencySymbol)}
          </Text>
        </Surface>
      </View>

      {/* Simple Neat Daily Sales Bar Graph */}
      <Card style={styles.cardSection} mode="elevated">
        <Card.Content>
          <View style={styles.sectionHeaderRow}>
            <MaterialCommunityIcons name="chart-bar" size={22} color={theme.colors.primary} />
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Sales Trend Graph ({selectedMonthLabel})
            </Text>
          </View>
          <Divider style={{ marginVertical: 10 }} />

          {analyticsData.dailySalesGraph.length === 0 ? (
            <View style={styles.noGraphBox}>
              <MaterialCommunityIcons name="chart-bell-curve" size={32} color="#CBD5E1" />
              <Text style={styles.emptyText}>No sales recorded for this month to display graph.</Text>
            </View>
          ) : (
            <View style={styles.graphContainer}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.barsRow}>
                  {analyticsData.dailySalesGraph.map((item, idx) => {
                    const heightPercent = Math.max(
                      12,
                      (item.amount / analyticsData.maxDailySales) * 100
                    );
                    return (
                      <View key={idx} style={styles.barColumn}>
                        <Text style={styles.barValueText}>
                          {settings.currencySymbol}{Math.round(item.amount)}
                        </Text>
                        <View style={styles.barTrack}>
                          <View
                            style={[
                              styles.barFill,
                              {
                                height: `${heightPercent}%`,
                                backgroundColor:
                                  item.amount === analyticsData.maxDailySales
                                    ? '#10B981'
                                    : theme.colors.primary,
                              },
                            ]}
                          />
                        </View>
                        <Text style={styles.barLabelText}>{item.day}</Text>
                      </View>
                    );
                  })}
                </View>
              </ScrollView>
            </View>
          )}
        </Card.Content>
      </Card>

      {/* Category Performance Contribution */}
      <Card style={styles.cardSection} mode="elevated">
        <Card.Content>
          <View style={styles.sectionHeaderRow}>
            <MaterialCommunityIcons name="shape-outline" size={20} color={theme.colors.primary} />
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Category Sales Share
            </Text>
          </View>
          <Divider style={{ marginVertical: 8 }} />

          {analyticsData.categoryDistribution.length === 0 ? (
            <Text style={styles.emptyText}>No category sales available.</Text>
          ) : (
            analyticsData.categoryDistribution.map((cat) => {
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

      {/* Sold vs Unsold Products List Section */}
      <Card style={styles.cardSection} mode="elevated">
        <Card.Content>
          <View style={styles.sectionHeaderRow}>
            <MaterialCommunityIcons name="package-variant" size={20} color="#2563EB" />
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Inventory Performance ({selectedMonthLabel})
            </Text>
          </View>
          <Divider style={{ marginVertical: 8 }} />

          {/* Segmented Switch for Sold / Unsold */}
          <SegmentedButtons
            value={productTab}
            onValueChange={(val) => setProductTab(val as 'sold' | 'unsold')}
            buttons={[
              {
                value: 'sold',
                label: `Sold Products (${analyticsData.soldProductsList.length})`,
                icon: 'check-circle-outline',
              },
              {
                value: 'unsold',
                label: `Unsold Products (${analyticsData.unsoldProductsList.length})`,
                icon: 'alert-circle-outline',
              },
            ]}
            style={styles.segmentedBtn}
          />

          <View style={styles.productListContainer}>
            {productTab === 'sold' ? (
              analyticsData.soldProductsList.length === 0 ? (
                <Text style={styles.emptyText}>No products were sold in this period.</Text>
              ) : (
                analyticsData.soldProductsList.map((item, idx) => (
                  <View key={item.product.id} style={styles.productRow}>
                    <View style={styles.prodRankBadge}>
                      <Text style={styles.prodRankText}>#{idx + 1}</Text>
                    </View>

                    <View style={styles.prodDetails}>
                      <Text style={styles.prodName}>{item.product.name}</Text>
                      <Text style={styles.prodSub}>
                        Category: {item.product.category} | Sold: {item.qtySold} units
                      </Text>
                    </View>

                    <View style={styles.prodRightCol}>
                      <Text style={styles.soldRevenue}>
                        {formatCurrency(item.revenue, settings.currencySymbol)}
                      </Text>
                      <Chip compact style={styles.soldChip} textStyle={styles.soldChipText}>
                        🟢 Sold
                      </Chip>
                    </View>
                  </View>
                ))
              )
            ) : analyticsData.unsoldProductsList.length === 0 ? (
              <Text style={styles.emptyText}>🎉 Excellent! All products in store had sales in this period.</Text>
            ) : (
              analyticsData.unsoldProductsList.map((prod) => (
                <View key={prod.id} style={[styles.productRow, styles.unsoldRow]}>
                  <View style={styles.unsoldIconBox}>
                    <MaterialCommunityIcons name="package-variant-closed-remove" size={22} color="#EF4444" />
                  </View>

                  <View style={styles.prodDetails}>
                    <Text style={styles.prodName}>{prod.name}</Text>
                    <Text style={styles.prodSub}>
                      Category: {prod.category} | Price: {formatCurrency(prod.price, settings.currencySymbol)}
                    </Text>
                  </View>

                  <Chip compact style={styles.unsoldChip} textStyle={styles.unsoldChipText}>
                    🔴 0 Sales
                  </Chip>
                </View>
              ))
            )}
          </View>
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
    color: '#0F172A',
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
    fontSize: 10,
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
  noGraphBox: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  emptyText: {
    textAlign: 'center',
    color: '#94A3B8',
    marginVertical: 12,
    fontStyle: 'italic',
    fontSize: 13,
  },
  graphContainer: {
    marginVertical: 8,
  },
  barsRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    minHeight: 150,
    paddingBottom: 4,
    paddingHorizontal: 8,
  },
  barColumn: {
    alignItems: 'center',
    marginRight: 14,
    width: 48,
  },
  barValueText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#475569',
    marginBottom: 4,
  },
  barTrack: {
    width: 22,
    height: 110,
    backgroundColor: '#F1F5F9',
    borderRadius: 6,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  barFill: {
    width: '100%',
    borderRadius: 6,
  },
  barLabelText: {
    fontSize: 10,
    color: '#64748B',
    marginTop: 6,
    fontWeight: '600',
    textAlign: 'center',
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
  segmentedBtn: {
    marginVertical: 8,
  },
  productListContainer: {
    marginTop: 6,
  },
  productRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  unsoldRow: {
    backgroundColor: '#FEF2F2',
    paddingHorizontal: 8,
    borderRadius: 8,
    marginVertical: 3,
    borderBottomWidth: 0,
  },
  prodRankBadge: {
    width: 28,
    height: 28,
    borderRadius: 6,
    backgroundColor: '#E0E7FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  prodRankText: {
    fontWeight: 'bold',
    fontSize: 11,
    color: '#3730A3',
  },
  unsoldIconBox: {
    marginRight: 10,
  },
  prodDetails: {
    flex: 1,
  },
  prodName: {
    fontWeight: 'bold',
    fontSize: 13,
    color: '#1E293B',
  },
  prodSub: {
    fontSize: 11,
    color: '#64748B',
  },
  prodRightCol: {
    alignItems: 'flex-end',
  },
  soldRevenue: {
    fontWeight: 'bold',
    fontSize: 13,
    color: '#059669',
    marginBottom: 2,
  },
  soldChip: {
    backgroundColor: '#D1FAE5',
    height: 22,
  },
  soldChipText: {
    fontSize: 10,
    color: '#065F46',
    fontWeight: 'bold',
  },
  unsoldChip: {
    backgroundColor: '#FEE2E2',
    height: 22,
  },
  unsoldChipText: {
    fontSize: 10,
    color: '#991B1B',
    fontWeight: 'bold',
  },
});
