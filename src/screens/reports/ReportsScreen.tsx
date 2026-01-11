import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { gql } from '@apollo/client';
import { useQuery } from '@apollo/client/react';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import { Ionicons } from '@expo/vector-icons';
import { colors, borderRadius, fontSize, fontWeight, spacing, shadows, layout } from '../../lib/theme';
import Badge from '../../components/ui/Badge';
import { Alert } from '../../components/ui/Alert';
import Card from '../../components/ui/Card';

const GET_TRANSACTIONS = gql`
  query GetTransactions($page: Int, $pageSize: Int, $search: String, $clinicId: ID) {
    getTransactions(page: $page, pageSize: $pageSize, search: $search, clinicId: $clinicId) {
      transactions {
        transactionId
        timestamp
        type
        quantity
        notes
        patientName
        patientReferenceId
        user {
          userId
          username
        }
        unit {
          unitId
          totalQuantity
          availableQuantity
          expiryDate
          optionalNotes
          drug {
            medicationName
            genericName
            strength
            strengthUnit
            ndcId
            form
          }
          lot {
            source
            location {
              name
              temp
            }
          }
        }
      }
      total
      page
      pageSize
    }
  }
`;

const GET_DASHBOARD_STATS = gql`
  query GetDashboardStats($clinicId: ID!) {
    getDashboardStats(clinicId: $clinicId) {
      totalUnits
      unitsExpiringSoon
      recentCheckIns
      recentCheckOuts
      lowStockAlerts
    }
  }
`;

interface Transaction {
  transactionId: string;
  timestamp: string;
  type: 'check_in' | 'check_out' | 'adjust';
  quantity: number;
  notes?: string;
  patientName?: string;
  patientReferenceId?: string;
  user: {
    userId: string;
    username: string;
  };
  unit: {
    unitId: string;
    totalQuantity: number;
    availableQuantity: number;
    expiryDate: string;
    optionalNotes?: string;
    drug: {
      medicationName: string;
      genericName?: string;
      strength?: number;
      strengthUnit?: string;
      ndcId?: string;
      form?: string;
    };
    lot: {
      source: string;
      location: {
        name: string;
        temp: 'fridge' | 'room_temp';
      };
    };
  };
}

interface DashboardStats {
  totalUnits: number;
  unitsExpiringSoon: number;
  recentCheckIns: number;
  recentCheckOuts: number;
  lowStockAlerts: number;
}

const TransactionCard = ({
  transaction,
  onPress,
}: {
  transaction: Transaction;
  onPress: () => void;
}) => {
  const getTypeColor = (type: string): 'default' | 'success' | 'destructive' | 'warning' => {
    switch (type) {
      case 'check_in':
        return 'success';
      case 'check_out':
        return 'destructive';
      case 'adjust':
        return 'warning';
      default:
        return 'default';
    }
  };

  const getTypeLabel = (type: string): string => {
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

  const getQuantityColor = (type: string): string => {
    switch (type) {
      case 'check_in':
        return colors.success;
      case 'check_out':
        return colors.destructive;
      default:
        return colors.foreground;
    }
  };

  const isExpired = new Date(transaction.unit.expiryDate) < new Date();
  const formattedDate = new Date(transaction.timestamp).toLocaleDateString();
  const formattedTime = new Date(transaction.timestamp).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
      <Card style={styles.transactionCard}>
        <View style={styles.cardHeader}>
          <View style={styles.cardHeaderLeft}>
            <Text style={styles.medicationName} numberOfLines={2}>
              {transaction.unit.drug.medicationName}
            </Text>
            {transaction.unit.drug.strength && (
              <Text style={styles.strengthText}>
                {transaction.unit.drug.strength} {transaction.unit.drug.strengthUnit}
              </Text>
            )}
          </View>
          <View style={styles.cardHeaderRight}>
            <Text style={[styles.quantityText, { color: getQuantityColor(transaction.type) }]}>
              {transaction.type === 'check_in' ? '+' : transaction.type === 'check_out' ? '-' : ''}
              {transaction.quantity}
            </Text>
          </View>
        </View>

        <View style={styles.cardBadges}>
          <Badge variant={getTypeColor(transaction.type)} style={styles.typeBadge}>
            {getTypeLabel(transaction.type)}
          </Badge>
          <Badge variant="outline" style={styles.locationBadge}>
            <Ionicons
              name={transaction.unit.lot.location.temp === 'fridge' ? 'snow' : 'thermometer'}
              size={12}
              color={colors.foreground}
            />{' '}
            {transaction.unit.lot.location.name}
          </Badge>
          {isExpired && (
            <Badge variant="destructive" style={styles.expiredBadge}>
              Expired
            </Badge>
          )}
        </View>

        <View style={styles.cardFooter}>
          <View style={styles.cardFooterLeft}>
            <Text style={styles.dateText}>
              {formattedDate} • {formattedTime}
            </Text>
            <Text style={styles.userText}>by {transaction.user.username}</Text>
          </View>
        </View>

        {transaction.patientName && (
          <View style={styles.patientInfo}>
            <Ionicons name="person" size={14} color={colors.mutedForeground} />
            <Text style={styles.patientText}>
              {transaction.patientName}
              {transaction.patientReferenceId && ` (${transaction.patientReferenceId})`}
            </Text>
          </View>
        )}
      </Card>
    </TouchableOpacity>
  );
};

const StatsCard = ({ stats }: { stats: DashboardStats }) => {
  return (
    <Card style={styles.statsCard}>
      <Text style={styles.statsTitle}>Inventory Statistics</Text>
      <View style={styles.statsGrid}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{stats.totalUnits}</Text>
          <Text style={styles.statLabel}>Total Units</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: colors.warning }]}>{stats.unitsExpiringSoon}</Text>
          <Text style={styles.statLabel}>Expiring Soon</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: colors.success }]}>{stats.recentCheckIns}</Text>
          <Text style={styles.statLabel}>Recent Check-Ins</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: colors.destructive }]}>{stats.recentCheckOuts}</Text>
          <Text style={styles.statLabel}>Recent Check-Outs</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: colors.destructive }]}>{stats.lowStockAlerts}</Text>
          <Text style={styles.statLabel}>Low Stock Alerts</Text>
        </View>
      </View>
    </Card>
  );
};

const TransactionDetailsModal = ({
  transaction,
  visible,
  onClose,
}: {
  transaction: Transaction | null;
  visible: boolean;
  onClose: () => void;
}) => {
  if (!transaction) return null;

  const isExpired = new Date(transaction.unit.expiryDate) < new Date();
  const formattedDate = new Date(transaction.timestamp).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  const formattedTime = new Date(transaction.timestamp).toLocaleTimeString();
  const formattedExpiry = new Date(transaction.unit.expiryDate).toLocaleDateString();

  const getTypeLabel = (type: string): string => {
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

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Transaction Details</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color={colors.foreground} />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
          {/* Action Details */}
          <Card style={styles.detailCard}>
            <Text style={styles.detailCardTitle}>Action Details</Text>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Transaction ID</Text>
              <Text style={styles.detailValue} numberOfLines={1}>
                {transaction.transactionId}
              </Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Type</Text>
              <Text style={styles.detailValue}>{getTypeLabel(transaction.type)}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Quantity</Text>
              <Text style={styles.detailValue}>
                {transaction.type === 'check_in' ? '+' : transaction.type === 'check_out' ? '-' : ''}
                {transaction.quantity}
              </Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Performed By</Text>
              <Text style={styles.detailValue}>{transaction.user.username}</Text>
            </View>
            {transaction.notes && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Notes</Text>
                <Text style={styles.detailValue}>{transaction.notes}</Text>
              </View>
            )}
          </Card>

          {/* Timestamp */}
          <Card style={styles.detailCard}>
            <Text style={styles.detailCardTitle}>Timestamp</Text>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Date</Text>
              <Text style={styles.detailValue}>{formattedDate}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Time</Text>
              <Text style={styles.detailValue}>{formattedTime}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>ISO String</Text>
              <Text style={styles.detailValue} numberOfLines={1}>
                {transaction.timestamp}
              </Text>
            </View>
          </Card>

          {/* Patient Information */}
          {(transaction.patientName || transaction.patientReferenceId) && (
            <Card style={styles.detailCard}>
              <Text style={styles.detailCardTitle}>Patient Information</Text>
              {transaction.patientName && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Patient Name</Text>
                  <Text style={styles.detailValue}>{transaction.patientName}</Text>
                </View>
              )}
              {transaction.patientReferenceId && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Reference ID</Text>
                  <Text style={styles.detailValue}>{transaction.patientReferenceId}</Text>
                </View>
              )}
            </Card>
          )}

          {/* Medication Information */}
          <Card style={styles.detailCard}>
            <Text style={styles.detailCardTitle}>Medication Information</Text>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Medication Name</Text>
              <Text style={styles.detailValue}>{transaction.unit.drug.medicationName}</Text>
            </View>
            {transaction.unit.drug.genericName && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Generic Name</Text>
                <Text style={styles.detailValue}>{transaction.unit.drug.genericName}</Text>
              </View>
            )}
            {transaction.unit.drug.strength && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Strength</Text>
                <Text style={styles.detailValue}>
                  {transaction.unit.drug.strength} {transaction.unit.drug.strengthUnit}
                </Text>
              </View>
            )}
            {transaction.unit.drug.form && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Form</Text>
                <Text style={styles.detailValue}>{transaction.unit.drug.form}</Text>
              </View>
            )}
            {transaction.unit.drug.ndcId && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>NDC</Text>
                <Text style={styles.detailValue}>{transaction.unit.drug.ndcId}</Text>
              </View>
            )}
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Current Stock</Text>
              <Text style={styles.detailValue}>
                {transaction.unit.availableQuantity} / {transaction.unit.totalQuantity} available
              </Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Expiry Date</Text>
              <View style={styles.expiryBadgeContainer}>
                <Text style={styles.detailValue}>{formattedExpiry}</Text>
                {isExpired && (
                  <Badge variant="destructive" style={styles.expiredBadgeSmall}>
                    Expired
                  </Badge>
                )}
              </View>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Lot Source</Text>
              <Text style={styles.detailValue}>{transaction.unit.lot.source}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Storage Location</Text>
              <Text style={styles.detailValue}>
                {transaction.unit.lot.location.name} (
                {transaction.unit.lot.location.temp === 'fridge' ? 'Refrigerated' : 'Room Temperature'})
              </Text>
            </View>
            {transaction.unit.optionalNotes && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Unit Notes</Text>
                <Text style={styles.detailValue}>{transaction.unit.optionalNotes}</Text>
              </View>
            )}
          </Card>
        </ScrollView>
      </View>
    </Modal>
  );
};

export default function ReportsScreen() {
  const clinic = useSelector((state: RootState) => state.auth.clinic);
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  const pageSize = 20;

  // Debounce search input
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setPage(1); // Reset to first page on new search
    }, 400);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const { data, loading, error, refetch } = useQuery(GET_TRANSACTIONS, {
    variables: {
      page,
      pageSize,
      search: debouncedSearch || undefined,
      clinicId: clinic?.clinicId,
    },
    skip: !clinic?.clinicId,
  });

  const { data: statsData, loading: statsLoading } = useQuery(GET_DASHBOARD_STATS, {
    variables: {
      clinicId: clinic?.clinicId,
    },
    skip: !clinic?.clinicId,
  });

  const transactions: Transaction[] = data?.getTransactions?.transactions || [];
  const total = data?.getTransactions?.total || 0;
  const totalPages = Math.ceil(total / pageSize);
  const stats: DashboardStats | null = statsData?.getDashboardStats || null;

  const handleTransactionPress = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setShowDetailsModal(true);
  };

  const handleNextPage = () => {
    if (page < totalPages) {
      setPage(page + 1);
    }
  };

  const handlePrevPage = () => {
    if (page > 1) {
      setPage(page - 1);
    }
  };

  const handleRefresh = () => {
    refetch();
  };

  if (!clinic) {
    return (
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <Alert variant="destructive" title="No Clinic Selected" message="Please select a clinic to view reports." />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={handleRefresh} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Reports</Text>
          <Text style={styles.subtitle}>Transaction history and analytics</Text>
        </View>

        {/* Stats Card */}
        {stats && !statsLoading && <StatsCard stats={stats} />}

        {/* Info Alert */}
        <Alert
          variant="default"
          icon="information-circle"
          style={styles.infoAlert}
        >
          Tap on any transaction to view full details
        </Alert>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color={colors.mutedForeground} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search transactions..."
            placeholderTextColor={colors.mutedForeground}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearButton}>
              <Ionicons name="close-circle" size={20} color={colors.mutedForeground} />
            </TouchableOpacity>
          )}
        </View>

        {/* Results Summary */}
        <View style={styles.resultsHeader}>
          <Text style={styles.resultsText}>
            {loading ? 'Loading...' : `${total} transaction${total !== 1 ? 's' : ''} found`}
          </Text>
          {totalPages > 1 && (
            <Text style={styles.pageText}>
              Page {page} of {totalPages}
            </Text>
          )}
        </View>

        {/* Error State */}
        {error && (
          <Alert variant="destructive" title="Error Loading Transactions" message={error.message} />
        )}

        {/* Loading State */}
        {loading && transactions.length === 0 && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        )}

        {/* Empty State */}
        {!loading && transactions.length === 0 && !error && (
          <Card style={styles.emptyCard}>
            <Ionicons name="document-text-outline" size={48} color={colors.mutedForeground} />
            <Text style={styles.emptyTitle}>No transactions found</Text>
            <Text style={styles.emptyText}>
              {searchQuery ? 'Try adjusting your search query' : 'Transactions will appear here as they occur'}
            </Text>
          </Card>
        )}

        {/* Transaction List */}
        <View style={styles.transactionList}>
          {transactions.map((transaction) => (
            <TransactionCard
              key={transaction.transactionId}
              transaction={transaction}
              onPress={() => handleTransactionPress(transaction)}
            />
          ))}
        </View>

        {/* Pagination */}
        {totalPages > 1 && (
          <View style={styles.pagination}>
            <TouchableOpacity
              style={[styles.paginationButton, page === 1 && styles.paginationButtonDisabled]}
              onPress={handlePrevPage}
              disabled={page === 1}
            >
              <Ionicons name="chevron-back" size={20} color={page === 1 ? colors.mutedForeground : colors.primary} />
              <Text style={[styles.paginationButtonText, page === 1 && styles.paginationButtonTextDisabled]}>
                Previous
              </Text>
            </TouchableOpacity>

            <View style={styles.pageNumbers}>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum: number;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (page <= 3) {
                  pageNum = i + 1;
                } else if (page >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = page - 2 + i;
                }

                return (
                  <TouchableOpacity
                    key={pageNum}
                    style={[styles.pageNumber, page === pageNum && styles.pageNumberActive]}
                    onPress={() => setPage(pageNum)}
                  >
                    <Text style={[styles.pageNumberText, page === pageNum && styles.pageNumberTextActive]}>
                      {pageNum}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <TouchableOpacity
              style={[styles.paginationButton, page === totalPages && styles.paginationButtonDisabled]}
              onPress={handleNextPage}
              disabled={page === totalPages}
            >
              <Text
                style={[styles.paginationButtonText, page === totalPages && styles.paginationButtonTextDisabled]}
              >
                Next
              </Text>
              <Ionicons
                name="chevron-forward"
                size={20}
                color={page === totalPages ? colors.mutedForeground : colors.primary}
              />
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* Transaction Details Modal */}
      <TransactionDetailsModal
        transaction={selectedTransaction}
        visible={showDetailsModal}
        onClose={() => setShowDetailsModal(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: spacing.xl,
  },
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: spacing.md,
  },
  title: {
    fontSize: fontSize['2xl'],
    fontWeight: fontWeight.bold,
    color: colors.foreground,
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: fontSize.sm,
    color: colors.mutedForeground,
  },
  statsCard: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    padding: spacing.lg,
  },
  statsTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.foreground,
    marginBottom: spacing.md,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statItem: {
    width: '30%',
    marginBottom: spacing.md,
    alignItems: 'center',
  },
  statValue: {
    fontSize: fontSize['2xl'],
    fontWeight: fontWeight.bold,
    color: colors.primary,
    marginBottom: spacing.xs,
  },
  statLabel: {
    fontSize: fontSize.xs,
    color: colors.mutedForeground,
    textAlign: 'center',
  },
  infoAlert: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    paddingHorizontal: spacing.md,
    height: 48,
    borderWidth: 1,
    borderColor: colors.border,
  },
  searchIcon: {
    marginRight: spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: fontSize.base,
    color: colors.foreground,
    paddingVertical: spacing.sm,
  },
  clearButton: {
    padding: spacing.xs,
  },
  resultsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  resultsText: {
    fontSize: fontSize.sm,
    color: colors.mutedForeground,
  },
  pageText: {
    fontSize: fontSize.sm,
    color: colors.mutedForeground,
    fontWeight: fontWeight.medium,
  },
  loadingContainer: {
    paddingVertical: spacing['2xl'],
    alignItems: 'center',
  },
  emptyCard: {
    marginHorizontal: spacing.lg,
    padding: spacing['2xl'],
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.foreground,
    marginTop: spacing.md,
    marginBottom: spacing.xs,
  },
  emptyText: {
    fontSize: fontSize.sm,
    color: colors.mutedForeground,
    textAlign: 'center',
  },
  transactionList: {
    paddingHorizontal: spacing.lg,
  },
  transactionCard: {
    marginBottom: spacing.md,
    padding: spacing.md,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  cardHeaderLeft: {
    flex: 1,
    marginRight: spacing.md,
  },
  cardHeaderRight: {
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  medicationName: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
    color: colors.foreground,
    marginBottom: spacing.xs,
  },
  strengthText: {
    fontSize: fontSize.sm,
    color: colors.mutedForeground,
  },
  quantityText: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
  },
  cardBadges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: spacing.sm,
    gap: spacing.xs,
  },
  typeBadge: {
    marginRight: spacing.xs,
  },
  locationBadge: {
    marginRight: spacing.xs,
  },
  expiredBadge: {
    marginRight: spacing.xs,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardFooterLeft: {
    flex: 1,
  },
  dateText: {
    fontSize: fontSize.xs,
    color: colors.mutedForeground,
    marginBottom: 2,
  },
  userText: {
    fontSize: fontSize.xs,
    color: colors.mutedForeground,
  },
  patientInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: spacing.xs,
  },
  patientText: {
    fontSize: fontSize.xs,
    color: colors.mutedForeground,
    flex: 1,
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    marginTop: spacing.lg,
  },
  paginationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  paginationButtonDisabled: {
    opacity: 0.5,
  },
  paginationButtonText: {
    fontSize: fontSize.sm,
    color: colors.primary,
    fontWeight: fontWeight.medium,
    marginHorizontal: spacing.xs,
  },
  paginationButtonTextDisabled: {
    color: colors.mutedForeground,
  },
  pageNumbers: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  pageNumber: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: borderRadius.md,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  pageNumberActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  pageNumberText: {
    fontSize: fontSize.sm,
    color: colors.foreground,
    fontWeight: fontWeight.medium,
  },
  pageNumberTextActive: {
    color: colors.primaryForeground,
  },
  bottomSpacer: {
    height: spacing.xl,
  },

  // Modal Styles
  modalContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalTitle: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.foreground,
  },
  closeButton: {
    padding: spacing.xs,
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  detailCard: {
    marginBottom: spacing.md,
    padding: spacing.lg,
  },
  detailCardTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.foreground,
    marginBottom: spacing.md,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
    gap: spacing.md,
  },
  detailLabel: {
    fontSize: fontSize.sm,
    color: colors.mutedForeground,
    fontWeight: fontWeight.medium,
    flex: 1,
  },
  detailValue: {
    fontSize: fontSize.sm,
    color: colors.foreground,
    flex: 1,
    textAlign: 'right',
  },
  expiryBadgeContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: spacing.xs,
  },
  expiredBadgeSmall: {
    paddingVertical: 2,
    paddingHorizontal: spacing.xs,
  },
});
