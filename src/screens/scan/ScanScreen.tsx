import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
  ActivityIndicator,
  RefreshControl,
  Alert as RNAlert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { gql } from '@apollo/client';
import { useLazyQuery } from '@apollo/client/react';
import { useSelector } from 'react-redux';
import type { RootState } from '../../store';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import type { UnitData, TransactionData } from '../../types';
import { colors, fontSize, fontWeight, spacing, layout, borderRadius } from '../../lib/theme';

const GET_UNIT = gql`
  query GetUnit($unitId: ID!) {
    getUnit(unitId: $unitId) {
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
        form
      }
      lot {
        source
      }
    }
  }
`;

const GET_TRANSACTIONS = gql`
  query GetTransactions($unitId: ID!) {
    getTransactions(unitId: $unitId, page: 1, pageSize: 10) {
      transactions {
        transactionId
        timestamp
        type
        quantity
        notes
      }
    }
  }
`;

const SEARCH_UNITS = gql`
  query SearchUnits($query: String!) {
    searchUnitsByQuery(query: $query) {
      unitId
      availableQuantity
      expiryDate
      drug {
        medicationName
        genericName
      }
    }
  }
`;

interface GetUnitResponse {
  getUnit: UnitData;
}

interface GetTransactionsResponse {
  getTransactions: {
    transactions: TransactionData[];
  };
}

interface SearchUnitsResponse {
  searchUnitsByQuery: UnitData[];
}

export default function ScanScreen() {
  const clinic = useSelector((state: RootState) => state.auth.clinic);
  const [permission, requestPermission] = useCameraPermissions();
  const [showScanner, setShowScanner] = useState(false);
  const [showManualInput, setShowManualInput] = useState(false);
  const [unitId, setUnitId] = useState('');
  const [manualUnitId, setManualUnitId] = useState('');
  const [unit, setUnit] = useState<UnitData | null>(null);
  const [transactions, setTransactions] = useState<TransactionData[]>([]);
  const [scanned, setScanned] = useState(false);

  const [getUnit, { data: unitData, error: unitError, loading: unitLoading }] =
    useLazyQuery<GetUnitResponse>(GET_UNIT);

  const [getTransactions, { data: transactionsData }] =
    useLazyQuery<GetTransactionsResponse>(GET_TRANSACTIONS);

  const [searchUnits, { data: searchData, loading: searchLoading }] =
    useLazyQuery<SearchUnitsResponse>(SEARCH_UNITS);

  // Handle unit data
  useEffect(() => {
    if (unitData?.getUnit) {
      setUnit(unitData.getUnit);
      getTransactions({ variables: { unitId: unitData.getUnit.unitId } });
    }
  }, [unitData]);

  // Handle unit error
  useEffect(() => {
    if (unitError) {
      RNAlert.alert('Error', 'Unit not found');
    }
  }, [unitError]);

  // Handle transactions
  useEffect(() => {
    if (transactionsData?.getTransactions) {
      setTransactions(transactionsData.getTransactions.transactions);
    }
  }, [transactionsData]);

  const handleBarCodeScanned = ({ data }: { data: string }) => {
    if (!scanned) {
      setScanned(true);
      setShowScanner(false);
      setUnitId(data);
      getUnit({ variables: { unitId: data } });
      setTimeout(() => setScanned(false), 2000);
    }
  };

  const handleOpenScanner = async () => {
    if (!permission?.granted) {
      const result = await requestPermission();
      if (!result.granted) {
        RNAlert.alert(
          'Camera Permission',
          'Camera permission is required to scan QR codes',
          [{ text: 'OK' }]
        );
        return;
      }
    }
    setShowScanner(true);
  };

  const handleSearch = () => {
    if (unitId.length >= 3) {
      if (unitId.length === 36) {
        // Full UUID
        getUnit({ variables: { unitId } });
      } else {
        // Partial search
        searchUnits({ variables: { query: unitId } });
      }
    }
  };

  const handleSelectUnit = (selectedUnit: UnitData) => {
    setUnitId(selectedUnit.unitId);
    getUnit({ variables: { unitId: selectedUnit.unitId } });
  };

  const handleClear = () => {
    setUnitId('');
    setUnit(null);
    setTransactions([]);
  };

  const handleManualSubmit = () => {
    if (manualUnitId.trim()) {
      setShowManualInput(false);
      setUnitId(manualUnitId.trim());
      getUnit({ variables: { unitId: manualUnitId.trim() } });
      setManualUnitId('');
    }
  };

  const renderSearchResults = () => {
    if (!searchData?.searchUnitsByQuery || searchData.searchUnitsByQuery.length === 0) {
      return null;
    }

    return (
      <Card style={styles.searchResults}>
        <Text style={styles.sectionTitle}>Search Results</Text>
        {searchData.searchUnitsByQuery.map((searchUnit) => {
          const isExpired = new Date(searchUnit.expiryDate) < new Date();
          const isExpiringSoon =
            new Date(searchUnit.expiryDate) < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

          return (
            <TouchableOpacity
              key={searchUnit.unitId}
              style={styles.searchResultCard}
              onPress={() => handleSelectUnit(searchUnit)}
            >
              <View style={styles.searchResultHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.medicationName}>{searchUnit.drug.medicationName}</Text>
                  <Text style={styles.genericName}>{searchUnit.drug.genericName}</Text>
                </View>
                <Badge variant={searchUnit.availableQuantity > 0 ? 'default' : 'destructive'}>
                  {searchUnit.availableQuantity}
                </Badge>
              </View>
              <View style={styles.searchResultFooter}>
                <Badge
                  variant={isExpired ? 'destructive' : isExpiringSoon ? 'warning' : 'secondary'}
                >
                  {new Date(searchUnit.expiryDate).toLocaleDateString()}
                </Badge>
                <Text style={styles.tapToSelect}>Tap to select →</Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </Card>
    );
  };

  const renderUnitDetails = () => {
    if (!unit) return null;

    const isExpired = new Date(unit.expiryDate) < new Date();

    return (
      <>
        <Card style={styles.unitCard}>
          <View style={styles.unitHeader}>
            <Text style={styles.unitTitle}>{unit.drug.medicationName}</Text>
            <Badge variant={unit.availableQuantity > 0 ? 'default' : 'destructive'}>
              {unit.availableQuantity}<Text> / </Text>{unit.totalQuantity}
            </Badge>
          </View>

          <View style={styles.detailsGrid}>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Generic Name</Text>
              <Text style={styles.detailValue}>{unit.drug.genericName}</Text>
            </View>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Strength</Text>
              <Badge variant="outline">
                {unit.drug.strength}<Text> </Text>{unit.drug.strengthUnit}
              </Badge>
            </View>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Form</Text>
              <Text style={styles.detailValue}>{unit.drug.form}</Text>
            </View>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Source</Text>
              <Text style={styles.detailValue}>{unit.lot?.source}</Text>
            </View>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Expiry Date</Text>
              <Badge variant={isExpired ? 'destructive' : 'secondary'}>
                {new Date(unit.expiryDate).toLocaleDateString()}
              </Badge>
            </View>
          </View>

          {unit.optionalNotes && (
            <View style={styles.notesSection}>
              <Text style={styles.detailLabel}>Notes</Text>
              <Text style={styles.notesText}>{unit.optionalNotes}</Text>
            </View>
          )}
        </Card>

        <Card style={styles.transactionsCard}>
          <Text style={styles.sectionTitle}>Transaction History</Text>
          {transactions.length > 0 ? (
            transactions.map((tx) => (
              <View key={tx.transactionId} style={styles.transactionRow}>
                <View style={styles.transactionLeft}>
                  <Text style={styles.transactionDate}>
                    {new Date(tx.timestamp).toLocaleDateString()}
                  </Text>
                  <Badge variant={tx.type === 'check_in' ? 'default' : 'secondary'}>
                    {tx.type.replace('_', ' ')}
                  </Badge>
                </View>
                <View style={styles.transactionRight}>
                  <Text style={styles.transactionQuantity}>{tx.quantity}</Text>
                  {tx.notes && <Text style={styles.transactionNotes}>{tx.notes}</Text>}
                </View>
              </View>
            ))
          ) : (
            <Text style={styles.emptyText}>No transactions yet</Text>
          )}
        </Card>
      </>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={false}
            onRefresh={() => {
              if (unitId) {
                getUnit({ variables: { unitId } });
              }
            }}
          />
        }
      >
      <View style={styles.header}>
        <Text style={styles.title}>Scan / Lookup</Text>
        <Text style={styles.subtitle}>Quick access to unit information</Text>
      </View>

      <Card style={styles.actionCard}>
        <Button
          variant="outline"
          onPress={handleOpenScanner}
          style={styles.scanButton}
        >
          Scan QR Code
        </Button>

        <View style={styles.searchSection}>
          <Text style={styles.searchLabel}>Unit ID or Search</Text>
          <View style={styles.searchInputRow}>
            <TextInput
              style={styles.searchInput}
              placeholder="Enter unit ID or search"
              value={unitId}
              onChangeText={(text) => {
                setUnitId(text);
                if (text.length >= 3) {
                  handleSearch();
                }
              }}
              onSubmitEditing={handleSearch}
            />
            {unitId && (
              <TouchableOpacity onPress={handleClear} style={styles.clearButton}>
                <Text style={styles.clearButtonText}>✕</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        <Button
          variant="ghost"
          onPress={() => setShowManualInput(true)}
        >
          Manual Entry
        </Button>
      </Card>

      {searchLoading && (
        <ActivityIndicator size="large" color="#2563eb" style={styles.loader} />
      )}

      {renderSearchResults()}

      {unitLoading && (
        <ActivityIndicator size="large" color="#2563eb" style={styles.loader} />
      )}

      {renderUnitDetails()}

      {/* QR Scanner Modal */}
      <Modal
        visible={showScanner}
        animationType="slide"
        onRequestClose={() => setShowScanner(false)}
      >
        <View style={styles.scannerContainer}>
          <CameraView
            style={styles.camera}
            facing="back"
            onBarcodeScanned={handleBarCodeScanned}
            barcodeScannerSettings={{
              barcodeTypes: ['qr'],
            }}
          >
            <View style={styles.scannerOverlay}>
              <View style={styles.scannerHeader}>
                <Text style={styles.scannerTitle}>Scan DaanaRX QR Code</Text>
                <Text style={styles.scannerSubtitle}>
                  Position the QR code within the frame
                </Text>
              </View>
              <View style={styles.scannerFrame} />
              <View style={styles.scannerActions}>
                <Button
                  variant="outline"
                  onPress={() => setShowScanner(false)}
                  style={styles.scannerButton}
                >
                  Cancel
                </Button>
              </View>
            </View>
          </CameraView>
        </View>
      </Modal>

      {/* Manual Input Modal */}
      <Modal
        visible={showManualInput}
        transparent
        animationType="fade"
        onRequestClose={() => setShowManualInput(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Manual Entry</Text>
            <Text style={styles.modalLabel}>Unit ID</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Enter unit ID manually"
              value={manualUnitId}
              onChangeText={setManualUnitId}
              onSubmitEditing={handleManualSubmit}
              autoFocus
            />
            <View style={styles.modalActions}>
              <Button
                variant="outline"
                onPress={() => setShowManualInput(false)}
                style={styles.modalButton}
              >
                Cancel
              </Button>
              <Button onPress={handleManualSubmit} style={styles.modalButton}>
                Submit
              </Button>
            </View>
          </View>
        </View>
      </Modal>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.muted,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: layout.screenPadding,
    paddingVertical: spacing.lg,
  },
  header: {
    marginBottom: layout.sectionSpacing,
  },
  title: {
    fontSize: fontSize['4xl'],
    fontWeight: fontWeight.bold,
    color: colors.foreground,
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: fontSize.base,
    color: colors.mutedForeground,
  },
  actionCard: {
    marginBottom: spacing.lg,
  },
  scanButton: {
    marginBottom: spacing.lg,
  },
  searchSection: {
    marginBottom: spacing.lg,
  },
  searchLabel: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.foreground,
    marginBottom: spacing.sm,
  },
  searchInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    fontSize: fontSize.sm,
    backgroundColor: colors.background,
    minHeight: 44,
  },
  clearButton: {
    marginLeft: spacing.sm,
    padding: spacing.sm,
  },
  clearButtonText: {
    fontSize: fontSize.lg,
    color: colors.mutedForeground,
  },
  loader: {
    marginVertical: spacing.lg,
  },
  searchResults: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.foreground,
    marginBottom: spacing.md,
  },
  searchResultCard: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    backgroundColor: colors.background,
  },
  searchResultHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  medicationName: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.foreground,
  },
  genericName: {
    fontSize: fontSize.xs,
    color: colors.mutedForeground,
    marginTop: spacing.xxs,
  },
  searchResultFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.muted,
  },
  tapToSelect: {
    fontSize: fontSize.xs,
    color: colors.primary,
    fontWeight: fontWeight.medium,
  },
  unitCard: {
    marginBottom: spacing.lg,
  },
  unitHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.lg,
  },
  unitTitle: {
    fontSize: fontSize['2xl'],
    fontWeight: fontWeight.bold,
    color: colors.foreground,
    flex: 1,
    marginRight: spacing.md,
  },
  detailsGrid: {
    marginBottom: spacing.lg,
  },
  detailItem: {
    marginBottom: spacing.md,
  },
  detailLabel: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
    color: colors.mutedForeground,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing.xs,
  },
  detailValue: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
    color: colors.foreground,
  },
  notesSection: {
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  notesText: {
    fontSize: fontSize.sm,
    color: colors.foreground,
  },
  transactionsCard: {
    marginBottom: spacing.lg,
  },
  transactionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.muted,
  },
  transactionLeft: {
    flex: 1,
  },
  transactionDate: {
    fontSize: fontSize.xs,
    color: colors.mutedForeground,
    marginBottom: spacing.xs,
  },
  transactionRight: {
    alignItems: 'flex-end',
  },
  transactionQuantity: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.bold,
    color: colors.foreground,
  },
  transactionNotes: {
    fontSize: fontSize.xs,
    color: colors.mutedForeground,
    marginTop: spacing.xxs,
  },
  emptyText: {
    fontSize: fontSize.sm,
    color: colors.mutedForeground,
    textAlign: 'center',
    paddingVertical: spacing['2xl'],
  },
  scannerContainer: {
    flex: 1,
    backgroundColor: '#000000',
  },
  camera: {
    flex: 1,
  },
  scannerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'space-between',
    padding: spacing['2xl'],
  },
  scannerHeader: {
    alignItems: 'center',
    paddingTop: spacing['4xl'],
  },
  scannerTitle: {
    fontSize: fontSize['2xl'],
    fontWeight: fontWeight.bold,
    color: '#ffffff',
    marginBottom: spacing.sm,
  },
  scannerSubtitle: {
    fontSize: fontSize.base,
    color: '#d1d5db',
  },
  scannerFrame: {
    width: 250,
    height: 250,
    alignSelf: 'center',
    borderWidth: 2,
    borderColor: '#ffffff',
    borderRadius: borderRadius.md,
  },
  scannerActions: {
    paddingBottom: spacing['2xl'],
  },
  scannerButton: {
    backgroundColor: '#ffffff',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing['2xl'],
  },
  modalContent: {
    backgroundColor: colors.background,
    borderRadius: borderRadius.lg,
    padding: spacing['2xl'],
    width: '100%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.foreground,
    marginBottom: spacing.lg,
  },
  modalLabel: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.foreground,
    marginBottom: spacing.sm,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    fontSize: fontSize.sm,
    marginBottom: spacing.lg,
    minHeight: 44,
  },
  modalActions: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  modalButton: {
    flex: 1,
  },
});
