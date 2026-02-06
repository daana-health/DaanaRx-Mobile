import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Modal,
  ScrollView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { gql } from '@apollo/client';
import { useQuery } from '@apollo/client/react';
import { useSelector } from 'react-redux';
import DateTimePicker from '@react-native-community/datetimepicker';
import type { RootState } from '../../store';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Input from '../../components/ui/Input';
import { colors, fontSize, fontWeight, spacing, layout, borderRadius } from '../../lib/theme';

const GET_ALL_TRANSACTIONS = gql`
  query GetAllTransactions(
    $page: Int
    $pageSize: Int
    $type: String
    $startDate: Date
    $endDate: Date
    $medicationName: String
  ) {
    getAllTransactions(
      page: $page
      pageSize: $pageSize
      type: $type
      startDate: $startDate
      endDate: $endDate
      medicationName: $medicationName
    ) {
      transactions {
        transactionId
        timestamp
        type
        quantity
        notes
        unit {
          unitId
          drug {
            medicationName
            strength
            strengthUnit
          }
        }
        user {
          username
          email
        }
      }
      total
      page
      pageSize
    }
  }
`;

interface Transaction {
  transactionId: string;
  timestamp: string;
  type: 'check_in' | 'check_out' | 'adjust';
  quantity: number;
  notes?: string;
  unit?: {
    unitId: string;
    drug: {
      medicationName: string;
      strength: number;
      strengthUnit: string;
    };
  };
  user?: {
    username: string;
    email: string;
  };
}

type TransactionFilter = 'all' | 'check_in' | 'check_out' | 'adjust';

export default function LogsScreen() {
  const clinicId = useSelector((state: RootState) => state.auth.clinic?.clinicId);

  // Filters
  const [transactionType, setTransactionType] = useState<TransactionFilter>('all');
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [medicationName, setMedicationName] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState<'start' | 'end' | null>(null);

  // Pagination
  const [page, setPage] = useState(1);
  const pageSize = 20;

  // Build variables
  const variables: any = {
    page,
    pageSize,
  };

  if (transactionType !== 'all') {
    variables.type = transactionType;
  }
  if (startDate) {
    variables.startDate = startDate.toISOString().split('T')[0];
  }
  if (endDate) {
    variables.endDate = endDate.toISOString().split('T')[0];
  }
  if (medicationName.trim()) {
    variables.medicationName = medicationName.trim();
  }

  const { data, loading, error, refetch } = useQuery(GET_ALL_TRANSACTIONS, {
    variables,
    fetchPolicy: 'network-only',
  });

  const transactions = data?.getAllTransactions?.transactions || [];
  const total = data?.getAllTransactions?.total || 0;

  const handleRefresh = () => {
    setPage(1);
    refetch();
  };

  const handleLoadMore = () => {
    if (transactions.length < total) {
      setPage(page + 1);
    }
  };

  const clearFilters = () => {
    setTransactionType('all');
    setStartDate(null);
    setEndDate(null);
    setMedicationName('');
    setPage(1);
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'check_in':
        return 'Check In';
      case 'check_out':
        return 'Check Out';
      case 'adjust':
        return 'Adjustment';
      default:
        return type;
    }
  };

  const getTypeBadgeVariant = (type: string): 'default' | 'secondary' | 'destructive' | 'warning' | 'outline' => {
    switch (type) {
      case 'check_in':
        return 'default';
      case 'check_out':
        return 'secondary';
      case 'adjust':
        return 'warning';
      default:
        return 'outline';
    }
  };

  const activeFiltersCount = [
    transactionType !== 'all',
    startDate,
    endDate,
    medicationName.trim(),
  ].filter(Boolean).length;

  const renderTransaction = ({ item }: { item: Transaction }) => {
    const date = new Date(item.timestamp);
    const formattedDate = date.toLocaleDateString();
    const formattedTime = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    return (
      <Card style={styles.transactionCard}>
        <View style={styles.transactionHeader}>
          <Badge variant={getTypeBadgeVariant(item.type)}>
            {getTypeLabel(item.type)}
          </Badge>
          <Text style={styles.transactionDate}>{formattedDate} {formattedTime}</Text>
        </View>

        {item.unit?.drug && (
          <View style={styles.medicationInfo}>
            <Text style={styles.medicationName}>{item.unit.drug.medicationName}</Text>
            <Text style={styles.medicationDetails}>
              {item.unit.drug.strength} {item.unit.drug.strengthUnit}
            </Text>
          </View>
        )}

        <View style={styles.transactionDetails}>
          <View style={styles.detailRow}>
            <Ionicons name="cube-outline" size={16} color="#6b7280" />
            <Text style={styles.detailText}>Quantity: {item.quantity}</Text>
          </View>

          {item.user && (
            <View style={styles.detailRow}>
              <Ionicons name="person-outline" size={16} color="#6b7280" />
              <Text style={styles.detailText}>{item.user.username}</Text>
            </View>
          )}

          {item.notes && (
            <View style={styles.detailRow}>
              <Ionicons name="document-text-outline" size={16} color="#6b7280" />
              <Text style={styles.detailText} numberOfLines={2}>{item.notes}</Text>
            </View>
          )}
        </View>
      </Card>
    );
  };

  const renderHeader = () => (
    <View style={styles.headerContainer}>
      <View style={styles.headerRow}>
        <View style={styles.headerLeft}>
          <Text style={styles.headerTitle}>Activity Logs</Text>
          <Text style={styles.headerSubtitle}>
            {total} transaction{total !== 1 ? 's' : ''}
          </Text>
        </View>
        <TouchableOpacity
          style={styles.filterButton}
          onPress={() => setShowFilters(true)}
        >
          <Ionicons name="options-outline" size={20} color="#ffffff" />
          {activeFiltersCount > 0 && (
            <View style={styles.filterBadge}>
              <Text style={styles.filterBadgeText}>{activeFiltersCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="document-text-outline" size={64} color="#d1d5db" />
      <Text style={styles.emptyTitle}>No transactions found</Text>
      <Text style={styles.emptyText}>
        {activeFiltersCount > 0
          ? 'Try adjusting your filters'
          : 'Transactions will appear here after check-ins and check-outs'
        }
      </Text>
      {activeFiltersCount > 0 && (
        <Button variant="outline" onPress={clearFilters} style={{ marginTop: 16 }}>
          Clear Filters
        </Button>
      )}
    </View>
  );

  const renderFooter = () => {
    if (!loading) return null;
    return (
      <View style={styles.footerLoading}>
        <ActivityIndicator size="small" color="#2563eb" />
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {renderHeader()}

      {error ? (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={64} color="#dc2626" />
          <Text style={styles.errorTitle}>Error loading logs</Text>
          <Text style={styles.errorText}>{error.message}</Text>
        </View>
      ) : (
        <FlatList
          data={transactions}
          renderItem={renderTransaction}
          keyExtractor={(item) => item.transactionId}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={loading && page === 1}
              onRefresh={handleRefresh}
              tintColor="#2563eb"
            />
          }
          ListEmptyComponent={!loading ? renderEmpty : null}
          ListFooterComponent={renderFooter}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.5}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Filters Modal */}
      <Modal
        visible={showFilters}
        animationType="slide"
        onRequestClose={() => setShowFilters(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Filters</Text>
            <TouchableOpacity onPress={() => setShowFilters(false)}>
              <Ionicons name="close" size={24} color="#111827" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            {/* Transaction Type Filter */}
            <View style={styles.filterSection}>
              <Text style={styles.filterLabel}>Transaction Type</Text>
              <View style={styles.chipRow}>
                {(['all', 'check_in', 'check_out', 'adjust'] as TransactionFilter[]).map((type) => (
                  <TouchableOpacity
                    key={type}
                    style={[
                      styles.chip,
                      transactionType === type && styles.chipActive,
                    ]}
                    onPress={() => setTransactionType(type)}
                  >
                    <Text style={[
                      styles.chipText,
                      transactionType === type && styles.chipTextActive,
                    ]}>
                      {type === 'all' ? 'All' : getTypeLabel(type)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Date Range Filter */}
            <View style={styles.filterSection}>
              <Text style={styles.filterLabel}>Date Range</Text>
              <View style={styles.dateRangeRow}>
                <TouchableOpacity
                  style={styles.dateButton}
                  onPress={() => setShowDatePicker('start')}
                >
                  <Text style={styles.dateButtonLabel}>Start Date</Text>
                  <Text style={styles.dateButtonValue}>
                    {startDate ? startDate.toLocaleDateString() : 'Any'}
                  </Text>
                </TouchableOpacity>
                <Text style={styles.dateSeparator}>to</Text>
                <TouchableOpacity
                  style={styles.dateButton}
                  onPress={() => setShowDatePicker('end')}
                >
                  <Text style={styles.dateButtonLabel}>End Date</Text>
                  <Text style={styles.dateButtonValue}>
                    {endDate ? endDate.toLocaleDateString() : 'Any'}
                  </Text>
                </TouchableOpacity>
              </View>
              {(startDate || endDate) && (
                <Button
                  variant="outline"
                  size="sm"
                  onPress={() => {
                    setStartDate(null);
                    setEndDate(null);
                  }}
                >
                  Clear Dates
                </Button>
              )}
            </View>

            {/* Medication Name Filter */}
            <View style={styles.filterSection}>
              <Text style={styles.filterLabel}>Medication Name</Text>
              <Input
                placeholder="Search by medication name..."
                value={medicationName}
                onChangeText={setMedicationName}
              />
            </View>
          </ScrollView>

          <View style={styles.modalFooter}>
            <Button
              variant="outline"
              onPress={clearFilters}
              style={{ flex: 1, marginRight: 8 }}
            >
              Clear All
            </Button>
            <Button
              onPress={() => {
                setShowFilters(false);
                setPage(1);
                refetch();
              }}
              style={{ flex: 1 }}
            >
              Apply Filters
            </Button>
          </View>
        </SafeAreaView>

        {/* Date Pickers */}
        {showDatePicker && (
          <DateTimePicker
            value={
              showDatePicker === 'start'
                ? startDate || new Date()
                : endDate || new Date()
            }
            mode="date"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={(event, selectedDate) => {
              setShowDatePicker(null);
              if (selectedDate) {
                if (showDatePicker === 'start') {
                  setStartDate(selectedDate);
                } else {
                  setEndDate(selectedDate);
                }
              }
            }}
          />
        )}
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.muted,
  },
  headerContainer: {
    backgroundColor: colors.background,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: layout.screenPadding,
    paddingTop: spacing['2xl'],
  },
  headerLeft: {
    flex: 1,
  },
  headerTitle: {
    fontSize: fontSize['4xl'],
    fontWeight: fontWeight.bold,
    color: colors.foreground,
  },
  headerSubtitle: {
    fontSize: fontSize.base,
    color: colors.mutedForeground,
  },
  filterButton: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#dc2626',
    borderRadius: 10,
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterBadgeText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  listContent: {
    paddingHorizontal: layout.screenPadding,
    paddingVertical: spacing.md,
    paddingBottom: spacing['3xl'],
  },
  transactionCard: {
    marginBottom: 12,
  },
  transactionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  transactionDate: {
    fontSize: 12,
    color: '#6b7280',
  },
  medicationInfo: {
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  medicationName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
  },
  medicationDetails: {
    fontSize: 14,
    color: '#6b7280',
  },
  transactionDetails: {
    gap: 6,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailText: {
    fontSize: 14,
    color: '#374151',
    flex: 1,
  },
  emptyContainer: {
    padding: 48,
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
  },
  errorContainer: {
    padding: 48,
    alignItems: 'center',
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#dc2626',
    marginTop: 16,
    marginBottom: 8,
  },
  errorText: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
  },
  footerLoading: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
  },
  modalContent: {
    flex: 1,
  },
  modalFooter: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  filterSection: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#ffffff',
    marginBottom: 8,
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: '#f3f4f6',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  chipActive: {
    backgroundColor: '#2563eb',
    borderColor: '#2563eb',
  },
  chipText: {
    fontSize: 14,
    color: '#374151',
  },
  chipTextActive: {
    color: '#ffffff',
    fontWeight: '600',
  },
  dateRangeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  dateButton: {
    flex: 1,
    padding: 12,
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  dateButtonLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 4,
  },
  dateButtonValue: {
    fontSize: 14,
    color: '#111827',
    fontWeight: '500',
  },
  dateSeparator: {
    fontSize: 14,
    color: '#9ca3af',
    marginHorizontal: 8,
  },
});
