import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { gql } from '@apollo/client';
import { useQuery } from '@apollo/client/react';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import Input from '../../components/ui/Input';
import Card from '../../components/ui/Card';
import { colors, fontSize, fontWeight, spacing, layout, borderRadius } from '../../lib/theme';

const GET_UNITS_ADVANCED = gql`
  query GetUnitsAdvanced($filters: InventoryFilters, $page: Int, $pageSize: Int) {
    getUnitsAdvanced(filters: $filters, page: $page, pageSize: $pageSize) {
      units {
        unitId
        totalQuantity
        availableQuantity
        expiryDate
        optionalNotes
        drug {
          drugId
          medicationName
          genericName
          strength
          strengthUnit
          form
        }
        lot {
          lotId
          source
          location {
            name
            temp
          }
        }
      }
      total
      page
      pageSize
    }
  }
`;

interface Unit {
  unitId: string;
  totalQuantity: number;
  availableQuantity: number;
  expiryDate: string;
  optionalNotes?: string | null;
  drug: {
    medicationName: string;
    genericName: string;
    strength: number;
    strengthUnit: string;
    form: string;
  };
  lot: {
    source: string;
    location: {
      name: string;
      temp: string;
    };
  };
}

function UnitCard({ unit, onPress }: { unit: Unit; onPress: () => void }) {
  const expiryDate = new Date(unit.expiryDate);
  const today = new Date();
  const daysUntilExpiry = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  let expiryStatus: 'expired' | 'expiring_soon' | 'good' = 'good';
  if (daysUntilExpiry < 0) {
    expiryStatus = 'expired';
  } else if (daysUntilExpiry <= 30) {
    expiryStatus = 'expiring_soon';
  }

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
      <Card style={styles.unitCard}>
        <View style={styles.unitHeader}>
          <View style={styles.unitTitleContainer}>
            <Text style={styles.medicationName} numberOfLines={2}>
              {unit.drug.medicationName}
            </Text>
            <Text style={styles.genericName} numberOfLines={1}>
              {unit.drug.genericName}
            </Text>
          </View>
          {expiryStatus === 'expired' && (
            <View style={styles.expiredBadge}>
              <Text style={styles.expiredText}>Expired</Text>
            </View>
          )}
          {expiryStatus === 'expiring_soon' && (
            <View style={styles.expiringSoonBadge}>
              <Text style={styles.expiringSoonText}>Expiring</Text>
            </View>
          )}
        </View>

        <View style={styles.unitDetails}>
          <View style={styles.detailRow}>
            <Ionicons name="medical-outline" size={16} color="#6b7280" />
            <Text style={styles.detailText}>
              {unit.drug.strength}
              {unit.drug.strengthUnit}<Text> </Text>{unit.drug.form}
            </Text>
          </View>

          <View style={styles.detailRow}>
            <Ionicons name="cube-outline" size={16} color="#6b7280" />
            <Text style={styles.detailText}>
              {unit.availableQuantity}<Text> / </Text>{unit.totalQuantity}<Text> available</Text>
            </Text>
          </View>

          <View style={styles.detailRow}>
            <Ionicons name="calendar-outline" size={16} color="#6b7280" />
            <Text style={[
              styles.detailText,
              expiryStatus === 'expired' && styles.expiredDate,
              expiryStatus === 'expiring_soon' && styles.expiringSoonDate,
            ]}>
              <Text>Exp: {expiryDate.toLocaleDateString()}</Text>
            </Text>
          </View>

          <View style={styles.detailRow}>
            <Ionicons name="location-outline" size={16} color="#6b7280" />
            <Text style={styles.detailText}>
              {unit.lot.location.name}
            </Text>
          </View>
        </View>

        {unit.availableQuantity === 0 && (
          <View style={styles.outOfStockBadge}>
            <Ionicons name="alert-circle" size={14} color="#dc2626" />
            <Text style={styles.outOfStockText}>
              <Text>Out of Stock</Text>
            </Text>
          </View>
        )}
      </Card>
    </TouchableOpacity>
  );
}

export default function InventoryScreen() {
  const clinicId = useSelector((state: RootState) => state.auth.clinic?.clinicId);
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const pageSize = 20;

  const { data, loading, error, refetch } = useQuery(GET_UNITS_ADVANCED, {
    variables: {
      filters: {
        medicationName: searchQuery || undefined,
        sortBy: 'CREATED_DATE',
        sortOrder: 'DESC',
      },
      page,
      pageSize,
    },
    fetchPolicy: 'network-only',
  });

  const units = data?.getUnitsAdvanced?.units || [];
  const total = data?.getUnitsAdvanced?.total || 0;

  const handleRefresh = () => {
    refetch();
  };

  const handleLoadMore = () => {
    if (units.length < total) {
      setPage(page + 1);
    }
  };

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="cube-outline" size={64} color="#d1d5db" />
      <Text style={styles.emptyTitle}>No inventory units found</Text>
      <Text style={styles.emptyText}>
        {searchQuery
          ? 'Try adjusting your search'
          : 'Start by checking in some medications'
        }
      </Text>
    </View>
  );

  const renderError = () => (
    <View style={styles.errorContainer}>
      <Ionicons name="alert-circle" size={64} color="#dc2626" />
      <Text style={styles.errorTitle}>Error loading inventory</Text>
      <Text style={styles.errorText}>{error?.message}</Text>
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
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <FlatList
        data={units}
        renderItem={({ item }) => (
          <UnitCard
            unit={item}
            onPress={() => {
              // TODO: Navigate to unit details
            }}
          />
        )}
        keyExtractor={(item) => item.unitId}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={loading && page === 1}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
          />
        }
        ListHeaderComponent={
          <>
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.headerTitle}>Inventory</Text>
              <Text style={styles.headerSubtitle}>
                {total} unit{total !== 1 ? 's' : ''}
              </Text>
            </View>

            {/* Search */}
            <View style={styles.searchContainer}>
              <Input
                placeholder="Search medications..."
                value={searchQuery}
                onChangeText={setSearchQuery}
                containerStyle={styles.searchInput}
              />
            </View>
          </>
        }
        stickyHeaderIndices={[0]}
        ListEmptyComponent={!loading ? (error ? renderError() : renderEmptyState()) : null}
        ListFooterComponent={renderFooter}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.muted,
  },
  header: {
    backgroundColor: colors.background,
    paddingHorizontal: layout.screenPadding,
    paddingTop: spacing['2xl'],
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: {
    fontSize: fontSize['4xl'],
    fontWeight: fontWeight.bold,
    color: colors.foreground,
    marginBottom: spacing.xs,
  },
  headerSubtitle: {
    fontSize: fontSize.base,
    color: colors.mutedForeground,
  },
  searchContainer: {
    paddingHorizontal: layout.screenPadding,
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
    backgroundColor: colors.background,
  },
  searchInput: {
    marginBottom: 0,
  },
  listContent: {
    paddingHorizontal: layout.screenPadding,
    paddingBottom: spacing['3xl'],
  },
  unitCard: {
    marginBottom: layout.itemSpacing,
  },
  unitHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  unitTitleContainer: {
    flex: 1,
    marginRight: spacing.md,
  },
  medicationName: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
    color: colors.foreground,
    marginBottom: spacing.xxs,
  },
  genericName: {
    fontSize: fontSize.sm,
    color: colors.mutedForeground,
  },
  expiredBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    backgroundColor: '#fee2e2',
    borderRadius: borderRadius.xs,
    borderWidth: 1,
    borderColor: colors.destructive,
  },
  expiredText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
    color: '#991b1b',
  },
  expiringSoonBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    backgroundColor: '#fef3c7',
    borderRadius: borderRadius.xs,
    borderWidth: 1,
    borderColor: colors.warning,
  },
  expiringSoonText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
    color: '#92400e',
  },
  unitDetails: {
    gap: spacing.xs,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  detailText: {
    fontSize: fontSize.sm,
    color: colors.foreground,
  },
  expiredDate: {
    color: colors.destructive,
    fontWeight: fontWeight.medium,
  },
  expiringSoonDate: {
    color: colors.warning,
    fontWeight: fontWeight.medium,
  },
  outOfStockBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: '#fee2e2',
  },
  outOfStockText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: colors.destructive,
  },
  emptyContainer: {
    paddingVertical: spacing['4xl'],
    paddingHorizontal: spacing['2xl'],
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.foreground,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  emptyText: {
    fontSize: fontSize.sm,
    color: colors.mutedForeground,
    textAlign: 'center',
  },
  errorContainer: {
    paddingVertical: spacing['4xl'],
    paddingHorizontal: spacing['2xl'],
    alignItems: 'center',
  },
  errorTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.destructive,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  errorText: {
    fontSize: fontSize.sm,
    color: colors.mutedForeground,
    textAlign: 'center',
  },
  footerLoading: {
    paddingVertical: spacing.xl,
    alignItems: 'center',
  },
});
