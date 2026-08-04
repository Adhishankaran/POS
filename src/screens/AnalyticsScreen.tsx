import React, { useState, useMemo } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Text as RNText,
} from 'react-native';
import {
  Surface,
  Button,
  Divider,
  ProgressBar,
  useTheme,
  Card,
  Menu,
} from 'react-native-paper';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useAppSelector } from '../store';
import { formatCurrency } from '../utils/constants';
import { exportInvoicesToExcel } from '../services/excelService';

const MONTH_LIST = [
  { label: 'All Months', key: 'ALL' },
  { label: 'January', key: '01' },
  { label: 'February', key: '02' },
  { label: 'March', key: '03' },
  { label: 'April', key: '04' },
  { label: 'May', key: '05' },
  { label: 'June', key: '06' },
  { label: 'July', key: '07' },
  { label: 'August', key: '08' },
  { label: 'September', key: '09' },
  { label: 'October', key: '10' },
  { label: 'November', key: '11' },
  { label: 'December', key: '12' },
];

export const AnalyticsScreen: React.FC = () => {
  const theme = useTheme();
  const invoices = useAppSelector((state) => state.invoice.invoices);
  const products = useAppSelector((state) => state.billing.products);
  const settings = useAppSelector((state) => state.settings.settings);

  const currentYear = new Date().getFullYear().toString();
  const currentMonth = (new Date().getMonth() + 1).toString().padStart(2, '0');

  // State for Year & Month Dropdowns
  const [selectedYear, setSelectedYear] = useState<string>(currentYear);
  const [selectedMonth, setSelectedMonth] = useState<string>(currentMonth);

  const [yearMenuVisible, setYearMenuVisible] = useState(false);
  const [monthMenuVisible, setMonthMenuVisible] = useState(false);

  const [productTab, setProductTab] = useState<'sold' | 'unsold'>('sold');
  const [exportingExcel, setExportingExcel] = useState(false);

  // Available Years extracted from invoices + current/past years
  const yearOptions = useMemo(() => {
    const yearsSet = new Set<string>();
    yearsSet.add(currentYear);
    yearsSet.add((parseInt(currentYear) - 1).toString());

    invoices.forEach((inv) => {
      const dateObj = new Date(inv.timestamp);
      if (!isNaN(dateObj.getTime())) {
        yearsSet.add(dateObj.getFullYear().toString());
      }
    });

    const sortedYears = Array.from(yearsSet).sort((a, b) => b.localeCompare(a));
    return [{ label: 'All Years', key: 'ALL' }, ...sortedYears.map((y) => ({ label: y, key: y }))];
  }, [invoices, currentYear]);

  // Filter Invoices based on Year & Month Dropdowns
  const filteredInvoices = useMemo(() => {
    return invoices.filter((inv) => {
      const dateObj = new Date(inv.timestamp);
      if (isNaN(dateObj.getTime())) return false;

      const invYear = dateObj.getFullYear().toString();
      const invMonth = (dateObj.getMonth() + 1).toString().padStart(2, '0');

      const matchesYear = selectedYear === 'ALL' || invYear === selectedYear;
      const matchesMonth = selectedMonth === 'ALL' || invMonth === selectedMonth;

      return matchesYear && matchesMonth;
    });
  }, [invoices, selectedYear, selectedMonth]);

  // Compute Metrics & Daily Graph Data
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

    // Daily breakdown for graph
    const dailySalesMap = new Map<string, number>();
    filteredInvoices.forEach((inv) => {
      const dateObj = new Date(inv.timestamp);
      const dayLabel = !isNaN(dateObj.getTime())
        ? `${dateObj.getDate()} ${dateObj.toLocaleString('en-US', { month: 'short' })}`
        : inv.date;

      const prev = dailySalesMap.get(dayLabel) || 0;
      dailySalesMap.set(dayLabel, prev + inv.grandTotal);
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

    // Categorize Store Products -> Sold & Unsold Lists
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

  const monthLabel = MONTH_LIST.find((m) => m.key === selectedMonth)?.label || 'All Months';
  const yearLabel = selectedYear === 'ALL' ? 'All Years' : selectedYear;
  const selectedPeriodText = `${monthLabel} ${selectedYear === 'ALL' ? '' : yearLabel}`.trim();

  const handleExportAnalyticsExcel = async () => {
    if (filteredInvoices.length === 0) {
      Alert.alert('No Data', 'No sales invoices available for the selected period to export.');
      return;
    }

    try {
      setExportingExcel(true);
      const res = await exportInvoicesToExcel(
        filteredInvoices,
        `POS_Analytics_${selectedPeriodText.replace(/\s+/g, '_')}`,
        settings.exportFolderUri,
        true
      );
      Alert.alert(
        'Analytics Report Exported! 📊',
        `Successfully generated Excel report for ${selectedPeriodText}.\nFile: ${res.fileName}`
      );
    } catch (e: any) {
      Alert.alert('Export Failed', e.message || 'Could not export analytics Excel.');
    } finally {
      setExportingExcel(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Dropdown Filters Section */}
      <Surface style={styles.filterSection} elevation={2}>
        <View style={styles.filterHeader}>
          <RNText style={styles.filterTitle}>📅 Sales Filter Period</RNText>
          <Button
            mode="contained-tonal"
            icon="file-excel-box"
            compact
            onPress={handleExportAnalyticsExcel}
            loading={exportingExcel}
            labelStyle={styles.exportBtnText}
          >
            Export Excel
          </Button>
        </View>

        {/* Dropdown Controls Row */}
        <View style={styles.dropdownsRow}>
          {/* Year Dropdown */}
          <Menu
            visible={yearMenuVisible}
            onDismiss={() => setYearMenuVisible(false)}
            anchor={
              <TouchableOpacity
                style={styles.dropdownPicker}
                onPress={() => setYearMenuVisible(true)}
              >
                <MaterialCommunityIcons name="calendar" size={18} color={theme.colors.primary} />
                <RNText style={styles.dropdownPickerText}>{yearLabel}</RNText>
                <MaterialCommunityIcons name="chevron-down" size={20} color="#64748B" />
              </TouchableOpacity>
            }
          >
            {yearOptions.map((opt) => (
              <Menu.Item
                key={opt.key}
                onPress={() => {
                  setSelectedYear(opt.key);
                  setYearMenuVisible(false);
                }}
                title={opt.label}
                leadingIcon={selectedYear === opt.key ? 'check' : undefined}
              />
            ))}
          </Menu>

          {/* Month Dropdown */}
          <Menu
            visible={monthMenuVisible}
            onDismiss={() => setMonthMenuVisible(false)}
            anchor={
              <TouchableOpacity
                style={styles.dropdownPicker}
                onPress={() => setMonthMenuVisible(true)}
              >
                <MaterialCommunityIcons name="calendar-month" size={18} color={theme.colors.primary} />
                <RNText style={styles.dropdownPickerText}>{monthLabel}</RNText>
                <MaterialCommunityIcons name="chevron-down" size={20} color="#64748B" />
              </TouchableOpacity>
            }
          >
            <ScrollView style={{ maxHeight: 300 }}>
              {MONTH_LIST.map((m) => (
                <Menu.Item
                  key={m.key}
                  onPress={() => {
                    setSelectedMonth(m.key);
                    setMonthMenuVisible(false);
                  }}
                  title={m.label}
                  leadingIcon={selectedMonth === m.key ? 'check' : undefined}
                />
              ))}
            </ScrollView>
          </Menu>
        </View>
      </Surface>

      {/* KPI Summary Cards */}
      <View style={styles.kpiGrid}>
        {/* Revenue */}
        <Surface style={[styles.kpiCard, { borderLeftColor: '#10B981', borderLeftWidth: 4 }]} elevation={2}>
          <View style={styles.kpiHeaderRow}>
            <RNText style={styles.kpiLabel}>TOTAL REVENUE</RNText>
            <MaterialCommunityIcons name="currency-inr" size={20} color="#10B981" />
          </View>
          <RNText style={[styles.kpiValue, { color: '#10B981' }]}>
            {formatCurrency(analyticsData.totalRevenue, settings.currencySymbol)}
          </RNText>
          <RNText style={styles.kpiSubText}>{selectedPeriodText}</RNText>
        </Surface>

        {/* Orders */}
        <Surface style={[styles.kpiCard, { borderLeftColor: '#2563EB', borderLeftWidth: 4 }]} elevation={2}>
          <View style={styles.kpiHeaderRow}>
            <RNText style={styles.kpiLabel}>TOTAL ORDERS</RNText>
            <MaterialCommunityIcons name="receipt" size={20} color="#2563EB" />
          </View>
          <RNText style={[styles.kpiValue, { color: '#2563EB' }]}>
            {analyticsData.totalOrders}
          </RNText>
          <RNText style={styles.kpiSubText}>{analyticsData.totalItemsSold} items sold</RNText>
        </Surface>

        {/* Average Order Value */}
        <Surface style={[styles.kpiCard, { borderLeftColor: '#8B5CF6', borderLeftWidth: 4 }]} elevation={2}>
          <View style={styles.kpiHeaderRow}>
            <RNText style={styles.kpiLabel}>AVG ORDER VALUE</RNText>
            <MaterialCommunityIcons name="calculator" size={20} color="#8B5CF6" />
          </View>
          <RNText style={[styles.kpiValue, { color: '#8B5CF6' }]}>
            {formatCurrency(analyticsData.avgOrderValue, settings.currencySymbol)}
          </RNText>
          <RNText style={styles.kpiSubText}>Per customer bill</RNText>
        </Surface>

        {/* Tax & Discount */}
        <Surface style={[styles.kpiCard, { borderLeftColor: '#F59E0B', borderLeftWidth: 4 }]} elevation={2}>
          <View style={styles.kpiHeaderRow}>
            <RNText style={styles.kpiLabel}>TAX & DISCOUNTS</RNText>
            <MaterialCommunityIcons name="percent" size={20} color="#F59E0B" />
          </View>
          <RNText style={[styles.kpiValueSmall, { color: '#F59E0B' }]}>
            GST: {formatCurrency(analyticsData.totalGst, settings.currencySymbol)}
          </RNText>
          <RNText style={styles.kpiSubText}>
            Discount: {formatCurrency(analyticsData.totalDiscount, settings.currencySymbol)}
          </RNText>
        </Surface>
      </View>

      {/* Neat Daily Sales Bar Graph */}
      <Card style={styles.cardSection} mode="elevated">
        <Card.Content>
          <View style={styles.sectionHeaderRow}>
            <MaterialCommunityIcons name="chart-bar" size={22} color={theme.colors.primary} />
            <RNText style={styles.sectionTitle}>
              Sales Trend Graph ({selectedPeriodText})
            </RNText>
          </View>
          <Divider style={{ marginVertical: 10 }} />

          {analyticsData.dailySalesGraph.length === 0 ? (
            <View style={styles.noGraphBox}>
              <MaterialCommunityIcons name="chart-bell-curve" size={32} color="#CBD5E1" />
              <RNText style={styles.emptyText}>No sales recorded for this filter period.</RNText>
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
                        <RNText style={styles.barValueText}>
                          {settings.currencySymbol}{Math.round(item.amount)}
                        </RNText>
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
                        <RNText style={styles.barLabelText}>{item.day}</RNText>
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
            <RNText style={styles.sectionTitle}>
              Category Sales Share
            </RNText>
          </View>
          <Divider style={{ marginVertical: 8 }} />

          {analyticsData.categoryDistribution.length === 0 ? (
            <RNText style={styles.emptyText}>No category sales available.</RNText>
          ) : (
            analyticsData.categoryDistribution.map((cat) => {
              const percentage =
                analyticsData.totalRevenue > 0
                  ? (cat.revenue / analyticsData.totalRevenue) * 100
                  : 0;
              return (
                <View key={cat.category} style={styles.categoryProgressRow}>
                  <View style={styles.catNameRow}>
                    <RNText style={styles.catName}>{cat.category}</RNText>
                    <RNText style={styles.catVal}>
                      {formatCurrency(cat.revenue, settings.currencySymbol)} ({percentage.toFixed(1)}%)
                    </RNText>
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
            <RNText style={styles.sectionTitle}>
              Inventory Performance ({selectedPeriodText})
            </RNText>
          </View>
          <Divider style={{ marginVertical: 8 }} />

          {/* High-Contrast Custom Switch for Sold / Unsold */}
          <View style={styles.tabToggleRow}>
            <TouchableOpacity
              style={[
                styles.tabToggleBtn,
                productTab === 'sold' && styles.tabToggleActiveSold,
              ]}
              onPress={() => setProductTab('sold')}
            >
              <MaterialCommunityIcons
                name="check-circle-outline"
                size={18}
                color={productTab === 'sold' ? '#FFFFFF' : '#059669'}
              />
              <RNText
                style={[
                  styles.tabToggleText,
                  productTab === 'sold' ? styles.tabToggleTextActive : { color: '#059669' },
                ]}
              >
                Sold ({analyticsData.soldProductsList.length})
              </RNText>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.tabToggleBtn,
                productTab === 'unsold' && styles.tabToggleActiveUnsold,
              ]}
              onPress={() => setProductTab('unsold')}
            >
              <MaterialCommunityIcons
                name="alert-circle-outline"
                size={18}
                color={productTab === 'unsold' ? '#FFFFFF' : '#DC2626'}
              />
              <RNText
                style={[
                  styles.tabToggleText,
                  productTab === 'unsold' ? styles.tabToggleTextActive : { color: '#DC2626' },
                ]}
              >
                Unsold ({analyticsData.unsoldProductsList.length})
              </RNText>
            </TouchableOpacity>
          </View>

          <View style={styles.productListContainer}>
            {productTab === 'sold' ? (
              analyticsData.soldProductsList.length === 0 ? (
                <RNText style={styles.emptyText}>No products were sold in this period.</RNText>
              ) : (
                analyticsData.soldProductsList.map((item, idx) => (
                  <View key={item.product.id} style={styles.productRow}>
                    <View style={styles.prodRankBadge}>
                      <RNText style={styles.prodRankText}>#{idx + 1}</RNText>
                    </View>

                    <View style={styles.prodDetails}>
                      <RNText style={styles.prodName}>{item.product.name}</RNText>
                      <RNText style={styles.prodSub}>
                        Category: {item.product.category} | Sold: {item.qtySold} units
                      </RNText>
                    </View>

                    <View style={styles.prodRightCol}>
                      <RNText style={styles.soldRevenue}>
                        {formatCurrency(item.revenue, settings.currencySymbol)}
                      </RNText>
                      <View style={styles.soldBadge}>
                        <RNText style={styles.soldBadgeText}>🟢 Sold</RNText>
                      </View>
                    </View>
                  </View>
                ))
              )
            ) : analyticsData.unsoldProductsList.length === 0 ? (
              <RNText style={styles.emptyText}>🎉 Excellent! All products in store had sales in this period.</RNText>
            ) : (
              analyticsData.unsoldProductsList.map((prod) => (
                <View key={prod.id} style={[styles.productRow, styles.unsoldRow]}>
                  <View style={styles.unsoldIconBox}>
                    <MaterialCommunityIcons name="package-variant-closed-remove" size={22} color="#EF4444" />
                  </View>

                  <View style={styles.prodDetails}>
                    <RNText style={styles.prodName}>{prod.name}</RNText>
                    <RNText style={styles.prodSub}>
                      Category: {prod.category} | Price: {formatCurrency(prod.price, settings.currencySymbol)}
                    </RNText>
                  </View>

                  <View style={styles.unsoldBadge}>
                    <RNText style={styles.unsoldBadgeText}>🔴 0 Sales</RNText>
                  </View>
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
    marginBottom: 12,
  },
  filterTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  exportBtnText: {
    fontSize: 11,
    fontWeight: 'bold',
  },
  dropdownsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  dropdownPicker: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    width: '48.5%',
  },
  dropdownPickerText: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#1E293B',
    flex: 1,
    marginLeft: 6,
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
    fontSize: 20,
    fontWeight: 'bold',
    marginVertical: 4,
  },
  kpiValueSmall: {
    fontSize: 15,
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
    fontSize: 15,
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
  tabToggleRow: {
    flexDirection: 'row',
    gap: 8,
    marginVertical: 10,
  },
  tabToggleBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F1F5F9',
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 10,
  },
  tabToggleActiveSold: {
    backgroundColor: '#059669',
  },
  tabToggleActiveUnsold: {
    backgroundColor: '#DC2626',
  },
  tabToggleText: {
    fontSize: 13,
    fontWeight: 'bold',
    marginLeft: 6,
  },
  tabToggleTextActive: {
    color: '#FFFFFF',
  },
  productListContainer: {
    marginTop: 6,
  },
  productRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  unsoldRow: {
    backgroundColor: '#FEF2F2',
    paddingHorizontal: 10,
    borderRadius: 10,
    marginVertical: 4,
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
    fontSize: 14,
    color: '#0F172A',
  },
  prodSub: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  prodRightCol: {
    alignItems: 'flex-end',
  },
  soldRevenue: {
    fontWeight: 'bold',
    fontSize: 14,
    color: '#059669',
    marginBottom: 4,
  },
  soldBadge: {
    backgroundColor: '#059669',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  soldBadgeText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  unsoldBadge: {
    backgroundColor: '#DC2626',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  unsoldBadgeText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
});
