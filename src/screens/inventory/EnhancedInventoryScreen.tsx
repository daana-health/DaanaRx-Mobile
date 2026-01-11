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
  TextInput,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { gql } from '@apollo/client';
import { useMutation, useQuery } from '@apollo/client/react';
import { useSelector } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import type { RootState } from '../../store';
import Input from '../../components/ui/Input';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import QRCode from 'react-native-qrcode-svg';
import DateTimePicker from '@react-native-community/datetimepicker';

const GET_UNITS_ADVANCED = gql`
  query GetUnitsAdvanced($filters: InventoryFilters, $page: Int, $pageSize: Int) {
    getUnitsAdvanced(filters: $filters, page: $page, pageSize: $pageSize) {
      units {
        unitId
        totalQuantity
        availableQuantity
        expiryDate
        optionalNotes
        manufacturerLotNumber
        drug {
          drugId
          medicationName
          genericName
          strength
          strengthUnit
          form
          ndcId
        }
        lot {
          lotId
          source
          location {
            locationId
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

const GET_LOCATIONS = gql`
  query GetLocations {
    getLocations {
      locationId
      name
      temp
    }
  }
`;

const UPDATE_UNIT = gql`
  mutation UpdateUnit($unitId: ID!, $input: UpdateUnitInput!) {
    updateUnit(unitId: $unitId, input: $input) {
      unitId
      totalQuantity
      availableQuantity
      expiryDate
      optionalNotes
    }
  }
`;

interface Unit {
  unitId: string;
  totalQuantity: number;
  availableQuantity: number;
  expiryDate: string;
  optionalNotes?: string | null;
  manufacturerLotNumber?: string | null;
  drug: {
    drugId: string;
    medicationName: string;
    genericName: string;
    strength: number;
    strengthUnit: string;
    form: string;
    ndcId?: string | null;
  };
  lot: {
    lotId: string;
    source: string;
    location: {
      locationId: string;
      name: string;
      temp: string;
    };
  };
}

type SortField = 'MEDICATION_NAME' | 'EXPIRY_DATE' | 'QUANTITY' | 'CREATED_DATE';
type SortOrder = 'ASC' | 'DESC';
type StockFilter = 'ALL' | 'IN_STOCK' | 'OUT_OF_STOCK' | 'EXPIRING_SOON';

function UnitCard({ unit, onPress, onQuickAction }: {
  unit: Unit;
  onPress: () => void;
  onQuickAction: (action: string, unit: Unit) => void;
}) {
  const [showActions, setShowActions] = useState(false);
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
          <TouchableOpacity
            style={styles.actionsButton}
            onPress={() => setShowActions(true)}
          >
            <Ionicons name="ellipsis-vertical" size={20} color="#6b7280" />
          </TouchableOpacity>
        </View>

        <View style={styles.badgeRow}>
          {expiryStatus === 'expired' && (
            <Badge variant="destructive">Expired</Badge>
          )}
          {expiryStatus === 'expiring_soon' && (
            <Badge variant="warning">Expiring Soon</Badge>
          )}
          {unit.availableQuantity === 0 && (
            <Badge variant="destructive">Out of Stock</Badge>
          )}
          {unit.availableQuantity > 0 && expiryStatus === 'good' && (
            <Badge variant="default">In Stock</Badge>
          )}
        </View>

        <View style={styles.unitDetails}>
          <View style={styles.detailRow}>
            <Ionicons name="medical-outline" size={16} color="#6b7280" />
            <Text style={styles.detailText}>
              {unit.drug.strength}{unit.drug.strengthUnit} {unit.drug.form}
            </Text>
          </View>

          <View style={styles.detailRow}>
            <Ionicons name="cube-outline" size={16} color="#6b7280" />
            <Text style={styles.detailText}>
              {unit.availableQuantity} / {unit.totalQuantity} available
            </Text>
          </View>

          <View style={styles.detailRow}>
            <Ionicons name="calendar-outline" size={16} color="#6b7280" />
            <Text style={[
              styles.detailText,
              expiryStatus === 'expired' && styles.expiredDate,
              expiryStatus === 'expiring_soon' && styles.expiringSoonDate,
            ]}>
              Exp: {expiryDate.toLocaleDateString()}
            </Text>
          </View>

          <View style={styles.detailRow}>
            <Ionicons name="location-outline" size={16} color="#6b7280" />
            <Text style={styles.detailText}>
              {unit.lot.location.name}
            </Text>
          </View>
        </View>

        {/* Quick Actions Modal */}
        <Modal
          visible={showActions}
          transparent
          animationType="fade"
          onRequestClose={() => setShowActions(false)}
        >
          <TouchableOpacity
            style={styles.actionsOverlay}
            activeOpacity={1}
            onPress={() => setShowActions(false)}
          >
            <View style={styles.actionsMenu}>
              <TouchableOpacity
                style={styles.actionItem}
                onPress={() => {
                  setShowActions(false);
                  onQuickAction('view', unit);
                }}
              >
                <Ionicons name="eye-outline" size={20} color="#374151" />
                <Text style={styles.actionText}>View Details</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.actionItem}
                onPress={() => {
                  setShowActions(false);
                  onQuickAction('qr', unit);
                }}
              >
                <Ionicons name="qr-code-outline" size={20} color="#374151" />
                <Text style={styles.actionText}>View QR Code</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.actionItem}
                onPress={() => {
                  setShowActions(false);
                  onQuickAction('edit', unit);
                }}
              >
                <Ionicons name="create-outline" size={20} color="#374151" />
                <Text style={styles.actionText}>Edit Unit</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionItem, styles.actionItemLast]}
                onPress={() => {
                  setShowActions(false);
                  onQuickAction('checkout', unit);
                }}
                disabled={unit.availableQuantity === 0}
              >
                <Ionicons
                  name="arrow-forward-outline"
                  size={20}
                  color={unit.availableQuantity === 0 ? '#9ca3af' : '#2563eb'}
                />
                <Text style={[
                  styles.actionText,
                  unit.availableQuantity === 0 && styles.actionTextDisabled,
                  unit.availableQuantity > 0 && styles.actionTextPrimary,
                ]}>
                  Check Out
                </Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </Modal>
      </Card>
    </TouchableOpacity>
  );
}

export default function EnhancedInventoryScreen() {
  const clinicId = useSelector((state: RootState) => state.auth.clinic?.clinicId);
  const navigation = useNavigation();

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLocation, setSelectedLocation] = useState<string | null>(null);
  const [stockFilter, setStockFilter] = useState<StockFilter>('ALL');
  const [expiryStartDate, setExpiryStartDate] = useState<Date | null>(null);
  const [expiryEndDate, setExpiryEndDate] = useState<Date | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState<'start' | 'end' | null>(null);

  // Sorting
  const [sortBy, setSortBy] = useState<SortField>('CREATED_DATE');
  const [sortOrder, setSortOrder] = useState<SortOrder>('DESC');

  // Modals
  const [selectedUnit, setSelectedUnit] = useState<Unit | null>(null);
  const [showUnitDetails, setShowUnitDetails] = useState(false);
  const [showQRCode, setShowQRCode] = useState(false);
  const [showEditUnit, setShowEditUnit] = useState(false);

  // Edit form
  const [editTotalQty, setEditTotalQty] = useState('');
  const [editAvailableQty, setEditAvailableQty] = useState('');
  const [editExpiryDate, setEditExpiryDate] = useState<Date>(new Date());
  const [editNotes, setEditNotes] = useState('');

  // Pagination
  const [page, setPage] = useState(1);
  const pageSize = 20;

  // Queries
  const { data: locationsData } = useQuery(GET_LOCATIONS);

  const filters: any = {
    sortBy,
    sortOrder,
  };

  if (searchQuery) filters.medicationName = searchQuery;
  if (selectedLocation) filters.locationId = selectedLocation;
  if (expiryStartDate) filters.expiryDateStart = expiryStartDate.toISOString().split('T')[0];
  if (expiryEndDate) filters.expiryDateEnd = expiryEndDate.toISOString().split('T')[0];

  switch (stockFilter) {
    case 'IN_STOCK':
      filters.inStock = true;
      break;
    case 'OUT_OF_STOCK':
      filters.outOfStock = true;
      break;
    case 'EXPIRING_SOON':
      filters.expiringSoon = true;
      break;
  }

  const { data, loading, error, refetch } = useQuery(GET_UNITS_ADVANCED, {
    variables: { filters, page, pageSize },
    fetchPolicy: 'network-only',
  });

  const [updateUnit, { loading: updating }] = useMutation(UPDATE_UNIT, {
    refetchQueries: ['GetUnitsAdvanced', 'GetDashboardStats'],
    onCompleted: () => {
      setShowEditUnit(false);
      setSelectedUnit(null);
    },
  });

  const units = data?.getUnitsAdvanced?.units || [];
  const total = data?.getUnitsAdvanced?.total || 0;

  const handleRefresh = () => {
    setPage(1);
    refetch();
  };

  const handleLoadMore = () => {
    if (units.length < total) {
      setPage(page + 1);
    }
  };

  const handleQuickAction = (action: string, unit: Unit) => {
    setSelectedUnit(unit);
    switch (action) {
      case 'view':
        setShowUnitDetails(true);
        break;
      case 'qr':
        setShowQRCode(true);
        break;
      case 'edit':
        setEditTotalQty(unit.totalQuantity.toString());
        setEditAvailableQty(unit.availableQuantity.toString());
        setEditExpiryDate(new Date(unit.expiryDate));
        setEditNotes(unit.optionalNotes || '');
        setShowEditUnit(true);
        break;
      case 'checkout':
        (navigation as any).navigate('CheckOut', { unitId: unit.unitId });
        break;
    }
  };

  const handleSaveEdit = () => {
    if (!selectedUnit) return;

    const totalQty = parseInt(editTotalQty, 10);
    const availableQty = parseInt(editAvailableQty, 10);

    if (isNaN(totalQty) || isNaN(availableQty) || totalQty < 0 || availableQty < 0) {
      alert('Please enter valid quantities');
      return;
    }

    if (availableQty > totalQty) {
      alert('Available quantity cannot exceed total quantity');
      return;
    }

    updateUnit({
      variables: {
        unitId: selectedUnit.unitId,
        input: {
          totalQuantity: totalQty,
          availableQuantity: availableQty,
          expiryDate: editExpiryDate.toISOString().split('T')[0],
          optionalNotes: editNotes || undefined,
        },
      },
    });
  };

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedLocation(null);
    setStockFilter('ALL');
    setExpiryStartDate(null);
    setExpiryEndDate(null);
    setSortBy('CREATED_DATE');
    setSortOrder('DESC');
  };

  const activeFiltersCount = [
    searchQuery,
    selectedLocation,
    stockFilter !== 'ALL',
    expiryStartDate,
    expiryEndDate,
  ].filter(Boolean).length;

  const renderHeader = () => (
    <View style={styles.headerContainer}>
      <View style={styles.headerRow}>
        <View style={styles.headerLeft}>
          <Text style={styles.headerTitle}>Inventory</Text>
          <Text style={styles.headerSubtitle}>
            {total} unit{total !== 1 ? 's' : ''}
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

      <View style={styles.searchContainer}>
        <Input
          placeholder="Search medications..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          containerStyle={styles.searchInput}
        />
      </View>
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="cube-outline" size={64} color="#d1d5db" />
      <Text style={styles.emptyTitle}>No inventory units found</Text>
      <Text style={styles.emptyText}>
        {activeFiltersCount > 0
          ? 'Try adjusting your filters'
          : 'Start by checking in some medications'
        }
      </Text>
      {activeFiltersCount > 0 && (
        <Button variant="outline" onPress={clearFilters} style={{ marginTop: 16 }}>
          Clear Filters
        </Button>
      )}
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
      {renderHeader()}

      {error ? (
        renderError()
      ) : (
        <FlatList
          data={units}
          renderItem={({ item }) => (
            <UnitCard
              unit={item}
              onPress={() => {
                setSelectedUnit(item);
                setShowUnitDetails(true);
              }}
              onQuickAction={handleQuickAction}
            />
          )}
          keyExtractor={(item) => item.unitId}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={loading && page === 1}
              onRefresh={handleRefresh}
              tintColor="#2563eb"
            />
          }
          ListEmptyComponent={!loading ? renderEmptyState : null}
          ListFooterComponent={renderFooter}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.5}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Filters Modal - Continuing in next part due to length */}
      <Modal
        visible={showFilters}
        animationType="slide"
        onRequestClose={() => setShowFilters(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Filters & Sorting</Text>
            <TouchableOpacity onPress={() => setShowFilters(false)}>
              <Ionicons name="close" size={24} color="#111827" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            {/* Stock Status Filter */}
            <View style={styles.filterSection}>
              <Text style={styles.filterLabel}>Stock Status</Text>
              <View style={styles.chipRow}>
                {(['ALL', 'IN_STOCK', 'OUT_OF_STOCK', 'EXPIRING_SOON'] as StockFilter[]).map((status) => (
                  <TouchableOpacity
                    key={status}
                    style={[
                      styles.chip,
                      stockFilter === status && styles.chipActive,
                    ]}
                    onPress={() => setStockFilter(status)}
                  >
                    <Text style={[
                      styles.chipText,
                      stockFilter === status && styles.chipTextActive,
                    ]}>
                      {status.replace('_', ' ')}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Location Filter */}
            <View style={styles.filterSection}>
              <Text style={styles.filterLabel}>Location</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.chipRow}>
                  <TouchableOpacity
                    style={[
                      styles.chip,
                      selectedLocation === null && styles.chipActive,
                    ]}
                    onPress={() => setSelectedLocation(null)}
                  >
                    <Text style={[
                      styles.chipText,
                      selectedLocation === null && styles.chipTextActive,
                    ]}>
                      All Locations
                    </Text>
                  </TouchableOpacity>
                  {locationsData?.getLocations?.map((loc: any) => (
                    <TouchableOpacity
                      key={loc.locationId}
                      style={[
                        styles.chip,
                        selectedLocation === loc.locationId && styles.chipActive,
                      ]}
                      onPress={() => setSelectedLocation(loc.locationId)}
                    >
                      <Text style={[
                        styles.chipText,
                        selectedLocation === loc.locationId && styles.chipTextActive,
                      ]}>
                        {loc.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            </View>

            {/* Expiry Date Range */}
            <View style={styles.filterSection}>
              <Text style={styles.filterLabel}>Expiry Date Range</Text>
              <View style={styles.dateRangeRow}>
                <TouchableOpacity
                  style={styles.dateButton}
                  onPress={() => setShowDatePicker('start')}
                >
                  <Text style={styles.dateButtonLabel}>Start</Text>
                  <Text style={styles.dateButtonValue}>
                    {expiryStartDate ? expiryStartDate.toLocaleDateString() : 'Any'}
                  </Text>
                </TouchableOpacity>
                <Text style={styles.dateSeparator}>→</Text>
                <TouchableOpacity
                  style={styles.dateButton}
                  onPress={() => setShowDatePicker('end')}
                >
                  <Text style={styles.dateButtonLabel}>End</Text>
                  <Text style={styles.dateButtonValue}>
                    {expiryEndDate ? expiryEndDate.toLocaleDateString() : 'Any'}
                  </Text>
                </TouchableOpacity>
              </View>
              {(expiryStartDate || expiryEndDate) && (
                <Button
                  variant="outline"
                  size="sm"
                  onPress={() => {
                    setExpiryStartDate(null);
                    setExpiryEndDate(null);
                  }}
                >
                  Clear Dates
                </Button>
              )}
            </View>

            {/* Sorting */}
            <View style={styles.filterSection}>
              <Text style={styles.filterLabel}>Sort By</Text>
              <View style={styles.chipRow}>
                {([
                  { key: 'MEDICATION_NAME', label: 'Name' },
                  { key: 'EXPIRY_DATE', label: 'Expiry' },
                  { key: 'QUANTITY', label: 'Quantity' },
                  { key: 'CREATED_DATE', label: 'Date Added' },
                ] as const).map(({ key, label }) => (
                  <TouchableOpacity
                    key={key}
                    style={[
                      styles.chip,
                      sortBy === key && styles.chipActive,
                    ]}
                    onPress={() => setSortBy(key)}
                  >
                    <Text style={[
                      styles.chipText,
                      sortBy === key && styles.chipTextActive,
                    ]}>
                      {label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={[styles.filterLabel, { marginTop: 12 }]}>Order</Text>
              <View style={styles.chipRow}>
                <TouchableOpacity
                  style={[
                    styles.chip,
                    sortOrder === 'ASC' && styles.chipActive,
                  ]}
                  onPress={() => setSortOrder('ASC')}
                >
                  <Text style={[
                    styles.chipText,
                    sortOrder === 'ASC' && styles.chipTextActive,
                  ]}>
                    Ascending
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.chip,
                    sortOrder === 'DESC' && styles.chipActive,
                  ]}
                  onPress={() => setSortOrder('DESC')}
                >
                  <Text style={[
                    styles.chipText,
                    sortOrder === 'DESC' && styles.chipTextActive,
                  ]}>
                    Descending
                  </Text>
                </TouchableOpacity>
              </View>
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
                ? expiryStartDate || new Date()
                : expiryEndDate || new Date()
            }
            mode="date"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={(event, selectedDate) => {
              setShowDatePicker(null);
              if (selectedDate) {
                if (showDatePicker === 'start') {
                  setExpiryStartDate(selectedDate);
                } else {
                  setExpiryEndDate(selectedDate);
                }
              }
            }}
          />
        )}
      </Modal>

      {/* Unit Details Modal */}
      <Modal
        visible={showUnitDetails}
        animationType="slide"
        onRequestClose={() => setShowUnitDetails(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Unit Details</Text>
            <TouchableOpacity onPress={() => setShowUnitDetails(false)}>
              <Ionicons name="close" size={24} color="#111827" />
            </TouchableOpacity>
          </View>

          {selectedUnit && (
            <ScrollView style={styles.modalContent}>
              <View style={styles.detailsSection}>
                <Text style={styles.detailsSectionTitle}>Medication</Text>
                <Card>
                  <Text style={styles.detailsTitle}>{selectedUnit.drug.medicationName}</Text>
                  <Text style={styles.detailsSubtitle}>
                    Generic: {selectedUnit.drug.genericName}
                  </Text>
                  <View style={styles.detailsRow}>
                    <Text style={styles.detailsLabel}>Strength:</Text>
                    <Text style={styles.detailsValue}>
                      {selectedUnit.drug.strength} {selectedUnit.drug.strengthUnit}
                    </Text>
                  </View>
                  <View style={styles.detailsRow}>
                    <Text style={styles.detailsLabel}>Form:</Text>
                    <Text style={styles.detailsValue}>{selectedUnit.drug.form}</Text>
                  </View>
                  {selectedUnit.drug.ndcId && (
                    <View style={styles.detailsRow}>
                      <Text style={styles.detailsLabel}>NDC:</Text>
                      <Text style={styles.detailsValue}>{selectedUnit.drug.ndcId}</Text>
                    </View>
                  )}
                </Card>
              </View>

              <View style={styles.detailsSection}>
                <Text style={styles.detailsSectionTitle}>Stock Information</Text>
                <Card>
                  <View style={styles.detailsRow}>
                    <Text style={styles.detailsLabel}>Total Quantity:</Text>
                    <Text style={styles.detailsValue}>{selectedUnit.totalQuantity}</Text>
                  </View>
                  <View style={styles.detailsRow}>
                    <Text style={styles.detailsLabel}>Available:</Text>
                    <Text style={styles.detailsValue}>
                      {selectedUnit.availableQuantity}
                    </Text>
                  </View>
                  <View style={styles.detailsRow}>
                    <Text style={styles.detailsLabel}>Expiry Date:</Text>
                    <Text style={styles.detailsValue}>
                      {new Date(selectedUnit.expiryDate).toLocaleDateString()}
                    </Text>
                  </View>
                  {selectedUnit.manufacturerLotNumber && (
                    <View style={styles.detailsRow}>
                      <Text style={styles.detailsLabel}>Mfr. Lot #:</Text>
                      <Text style={styles.detailsValue}>
                        {selectedUnit.manufacturerLotNumber}
                      </Text>
                    </View>
                  )}
                </Card>
              </View>

              <View style={styles.detailsSection}>
                <Text style={styles.detailsSectionTitle}>Location</Text>
                <Card>
                  <View style={styles.detailsRow}>
                    <Text style={styles.detailsLabel}>Storage Location:</Text>
                    <Text style={styles.detailsValue}>{selectedUnit.lot.location.name}</Text>
                  </View>
                  <View style={styles.detailsRow}>
                    <Text style={styles.detailsLabel}>Temperature:</Text>
                    <Text style={styles.detailsValue}>{selectedUnit.lot.location.temp}</Text>
                  </View>
                  <View style={styles.detailsRow}>
                    <Text style={styles.detailsLabel}>Source:</Text>
                    <Text style={styles.detailsValue}>{selectedUnit.lot.source}</Text>
                  </View>
                </Card>
              </View>

              {selectedUnit.optionalNotes && (
                <View style={styles.detailsSection}>
                  <Text style={styles.detailsSectionTitle}>Notes</Text>
                  <Card>
                    <Text style={styles.detailsValue}>{selectedUnit.optionalNotes}</Text>
                  </Card>
                </View>
              )}

              <View style={styles.detailsSection}>
                <Button
                  onPress={() => {
                    setShowUnitDetails(false);
                    setShowQRCode(true);
                  }}
                >
                  View QR Code
                </Button>
              </View>
            </ScrollView>
          )}
        </SafeAreaView>
      </Modal>

      {/* QR Code Modal */}
      <Modal
        visible={showQRCode}
        animationType="fade"
        transparent
        onRequestClose={() => setShowQRCode(false)}
      >
        <View style={styles.qrModalOverlay}>
          <View style={styles.qrModalContent}>
            <TouchableOpacity
              style={styles.qrCloseButton}
              onPress={() => setShowQRCode(false)}
            >
              <Ionicons name="close-circle" size={32} color="#ffffff" />
            </TouchableOpacity>

            {selectedUnit && (
              <View style={styles.qrContainer}>
                <Text style={styles.qrTitle}>Unit QR Code</Text>
                <View style={styles.qrCodeWrapper}>
                  <QRCode
                    value={selectedUnit.unitId}
                    size={250}
                    color="#000000"
                    backgroundColor="#ffffff"
                  />
                </View>
                <Text style={styles.qrMedicationName}>
                  {selectedUnit.drug.medicationName}
                </Text>
                <Text style={styles.qrDetails}>
                  {selectedUnit.drug.strength} {selectedUnit.drug.strengthUnit} •{' '}
                  {selectedUnit.availableQuantity} available
                </Text>
                <View style={styles.qrIdContainer}>
                  <Text style={styles.qrIdLabel}>UNIT ID</Text>
                  <Text style={styles.qrIdValue}>{selectedUnit.unitId}</Text>
                </View>
              </View>
            )}
          </View>
        </View>
      </Modal>

      {/* Edit Unit Modal */}
      <Modal
        visible={showEditUnit}
        animationType="slide"
        onRequestClose={() => setShowEditUnit(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Edit Unit</Text>
            <TouchableOpacity onPress={() => setShowEditUnit(false)}>
              <Ionicons name="close" size={24} color="#111827" />
            </TouchableOpacity>
          </View>

          {selectedUnit && (
            <ScrollView style={styles.modalContent}>
              <View style={styles.editSection}>
                <Text style={styles.editMedicationName}>
                  {selectedUnit.drug.medicationName}
                </Text>
                <Text style={styles.editMedicationDetails}>
                  {selectedUnit.drug.strength} {selectedUnit.drug.strengthUnit} •{' '}
                  {selectedUnit.drug.form}
                </Text>
              </View>

              <View style={styles.filterSection}>
                <Text style={styles.filterLabel}>Total Quantity *</Text>
                <TextInput
                  style={styles.editInput}
                  value={editTotalQty}
                  onChangeText={setEditTotalQty}
                  keyboardType="number-pad"
                  placeholder="Enter total quantity"
                />
              </View>

              <View style={styles.filterSection}>
                <Text style={styles.filterLabel}>Available Quantity *</Text>
                <TextInput
                  style={styles.editInput}
                  value={editAvailableQty}
                  onChangeText={setEditAvailableQty}
                  keyboardType="number-pad"
                  placeholder="Enter available quantity"
                />
                <Text style={styles.editHint}>
                  Cannot exceed total quantity
                </Text>
              </View>

              <View style={styles.filterSection}>
                <Text style={styles.filterLabel}>Expiry Date *</Text>
                <TouchableOpacity
                  style={styles.dateButton}
                  onPress={() => setShowDatePicker('start')}
                >
                  <Text style={styles.dateButtonValue}>
                    {editExpiryDate.toLocaleDateString()}
                  </Text>
                  <Ionicons name="calendar-outline" size={20} color="#6b7280" />
                </TouchableOpacity>
              </View>

              <View style={styles.filterSection}>
                <Text style={styles.filterLabel}>Notes (Optional)</Text>
                <TextInput
                  style={[styles.editInput, styles.editTextArea]}
                  value={editNotes}
                  onChangeText={setEditNotes}
                  multiline
                  numberOfLines={4}
                  placeholder="Enter any notes about this unit"
                  textAlignVertical="top"
                />
              </View>
            </ScrollView>
          )}

          <View style={styles.modalFooter}>
            <Button
              variant="outline"
              onPress={() => setShowEditUnit(false)}
              disabled={updating}
              style={{ flex: 1, marginRight: 8 }}
            >
              Cancel
            </Button>
            <Button
              onPress={handleSaveEdit}
              disabled={updating}
              style={{ flex: 1 }}
            >
              {updating ? 'Saving...' : 'Save Changes'}
            </Button>
          </View>

          {/* Date Picker for Edit */}
          {showDatePicker === 'start' && (
            <DateTimePicker
              value={editExpiryDate}
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={(event, selectedDate) => {
                setShowDatePicker(null);
                if (selectedDate) {
                  setEditExpiryDate(selectedDate);
                }
              }}
              minimumDate={new Date()}
            />
          )}
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  headerContainer: {
    backgroundColor: '#2563eb',
    paddingBottom: 12,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  headerLeft: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#dbeafe',
  },
  filterButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
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
  searchContainer: {
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  searchInput: {
    marginBottom: 0,
  },
  listContent: {
    padding: 16,
    paddingBottom: 32,
  },
  unitCard: {
    marginBottom: 12,
  },
  unitHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  unitTitleContainer: {
    flex: 1,
    marginRight: 12,
  },
  medicationName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
  },
  genericName: {
    fontSize: 13,
    color: '#6b7280',
  },
  actionsButton: {
    padding: 4,
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 12,
  },
  unitDetails: {
    gap: 4,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailText: {
    fontSize: 14,
    color: '#374151',
  },
  expiredDate: {
    color: '#dc2626',
    fontWeight: '500',
  },
  expiringSoonDate: {
    color: '#f59e0b',
    fontWeight: '500',
  },
  actionsOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  actionsMenu: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingVertical: 8,
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  actionItemLast: {
    borderBottomWidth: 0,
  },
  actionText: {
    fontSize: 16,
    color: '#374151',
  },
  actionTextDisabled: {
    color: '#9ca3af',
  },
  actionTextPrimary: {
    color: '#2563eb',
    fontWeight: '600',
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
    textTransform: 'capitalize',
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
    fontSize: 18,
    color: '#9ca3af',
    marginHorizontal: 8,
  },
  detailsSection: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  detailsSectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6b7280',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  detailsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  detailsSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 12,
  },
  detailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  detailsLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6b7280',
  },
  detailsValue: {
    fontSize: 14,
    color: '#111827',
    textAlign: 'right',
    flex: 1,
    marginLeft: 12,
  },
  qrModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  qrModalContent: {
    width: '90%',
    maxWidth: 400,
  },
  qrCloseButton: {
    alignSelf: 'flex-end',
    marginBottom: 16,
  },
  qrContainer: {
    alignItems: 'center',
    padding: 24,
  },
  qrTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 24,
  },
  qrCodeWrapper: {
    padding: 20,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    marginBottom: 24,
  },
  qrMedicationName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 8,
  },
  qrDetails: {
    fontSize: 14,
    color: '#d1d5db',
    textAlign: 'center',
    marginBottom: 16,
  },
  qrIdContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  qrIdLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#9ca3af',
    letterSpacing: 1,
    marginBottom: 4,
  },
  qrIdValue: {
    fontSize: 11,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    color: '#ffffff',
  },
  editSection: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#eff6ff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  editMedicationName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  editMedicationDetails: {
    fontSize: 14,
    color: '#6b7280',
  },
  editInput: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    fontSize: 14,
    backgroundColor: '#ffffff',
  },
  editTextArea: {
    minHeight: 100,
    paddingTop: 12,
  },
  editHint: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
  },
});
