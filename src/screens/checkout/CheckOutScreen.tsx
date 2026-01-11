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
  Alert as RNAlert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { gql } from '@apollo/client';
import { useLazyQuery, useMutation, useQuery } from '@apollo/client/react';
import { useSelector } from 'react-redux';
import type { RootState } from '../../store';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import { Alert } from '../../components/ui/Alert';
import type { UnitData } from '../../types';

// GraphQL Queries and Mutations
const GET_UNIT = gql`
  query GetUnit($unitId: ID!) {
    getUnit(unitId: $unitId) {
      unitId
      totalQuantity
      availableQuantity
      expiryDate
      optionalNotes
      manufacturerLotNumber
      drug {
        medicationName
        genericName
        strength
        strengthUnit
        form
        ndcId
      }
      lot {
        source
        note
        locationId
        location {
          name
          temp
        }
      }
    }
  }
`;

const SEARCH_UNITS = gql`
  query SearchUnits($query: String!) {
    searchUnitsByQuery(query: $query) {
      unitId
      totalQuantity
      availableQuantity
      expiryDate
      optionalNotes
      manufacturerLotNumber
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
          locationId
          name
          temp
        }
      }
    }
  }
`;

const GET_DASHBOARD_STATS = gql`
  query GetDashboardStats($clinicId: ID) {
    getDashboardStats(clinicId: $clinicId) {
      totalUnits
    }
  }
`;

const CHECK_OUT_UNIT = gql`
  mutation CheckOutUnit($input: CheckOutInput!) {
    checkOutUnit(input: $input) {
      transactionId
      timestamp
      quantity
    }
  }
`;

const CHECK_OUT_FEFO = gql`
  mutation CheckOutMedicationFEFO($input: FEFOCheckOutInput!) {
    checkOutMedicationFEFO(input: $input) {
      totalQuantityDispensed
      unitsUsed {
        unitId
        quantityTaken
        expiryDate
        medicationName
      }
      transactions {
        transactionId
        timestamp
        quantity
      }
    }
  }
`;

interface GetUnitResponse {
  getUnit: UnitData;
}

interface SearchUnitsResponse {
  searchUnitsByQuery: UnitData[];
}

interface CheckOutResponse {
  checkOutUnit: {
    transactionId: string;
    timestamp: string;
    quantity: number;
  };
}

interface CheckOutFEFOResponse {
  checkOutMedicationFEFO: {
    totalQuantityDispensed: number;
    unitsUsed: Array<{
      unitId: string;
      quantityTaken: number;
      expiryDate: string;
      medicationName: string;
    }>;
    transactions: Array<{
      transactionId: string;
      timestamp: string;
      quantity: number;
    }>;
  };
}

export default function CheckOutScreen() {
  const clinic = useSelector((state: RootState) => state.auth.clinic);
  const [permission, requestPermission] = useCameraPermissions();

  // State
  const [unitId, setUnitId] = useState('');
  const [selectedUnit, setSelectedUnit] = useState<UnitData | null>(null);
  const [quantity, setQuantity] = useState('');
  const [patientName, setPatientName] = useState('');
  const [patientReference, setPatientReference] = useState('');
  const [notes, setNotes] = useState('');
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [showCheckoutConfirm, setShowCheckoutConfirm] = useState(false);
  const [pendingQty, setPendingQty] = useState<number | null>(null);
  const [scanned, setScanned] = useState(false);

  // Check if inventory is empty
  const { data: dashboardData, loading: loadingStats } = useQuery(GET_DASHBOARD_STATS, {
    variables: { clinicId: clinic?.clinicId },
    fetchPolicy: 'network-only',
  });
  const hasInventory = dashboardData?.getDashboardStats?.totalUnits > 0;

  // Queries
  const [getUnit, { data: unitData, loading: loadingUnit, error: unitError }] =
    useLazyQuery<GetUnitResponse>(GET_UNIT);

  const [searchUnits, { data: searchData, loading: searchingUnits }] =
    useLazyQuery<SearchUnitsResponse>(SEARCH_UNITS);

  // Mutations
  const [checkOut, { loading: checkingOut }] = useMutation<CheckOutResponse>(CHECK_OUT_UNIT, {
    onCompleted: () => {
      RNAlert.alert('Success', 'Unit checked out successfully');
      handleReset();
    },
    onError: (error) => {
      RNAlert.alert('Error', error.message);
    },
  });

  const [checkOutFEFO, { loading: checkingOutFEFO }] = useMutation<CheckOutFEFOResponse>(
    CHECK_OUT_FEFO,
    {
      onCompleted: (data) => {
        const result = data.checkOutMedicationFEFO;
        RNAlert.alert(
          'Success',
          `Checked out ${result.totalQuantityDispensed} units from ${result.unitsUsed.length} container(s) using FEFO logic`
        );
        handleReset();
      },
      onError: (error) => {
        RNAlert.alert('Error', error.message);
      },
    }
  );

  // Handle unit data changes
  useEffect(() => {
    if (unitData?.getUnit) {
      setSelectedUnit(unitData.getUnit);
    }
  }, [unitData]);

  // Handle unit errors
  useEffect(() => {
    if (unitError) {
      RNAlert.alert('Error', 'Unit not found');
    }
  }, [unitError]);

  // Debounced search
  useEffect(() => {
    const trimmed = unitId.trim();
    if (trimmed.length === 0) return;

    const timeoutId = setTimeout(() => {
      if (trimmed.length >= 2) {
        if (unitId.length === 36) {
          getUnit({ variables: { unitId } });
        } else {
          searchUnits({ variables: { query: unitId } });
        }
      }
    }, 400);

    return () => clearTimeout(timeoutId);
  }, [unitId]);

  const handleSearch = () => {
    if (unitId.trim().length >= 2) {
      if (unitId.length === 36) {
        getUnit({ variables: { unitId } });
      } else {
        searchUnits({ variables: { query: unitId } });
      }
    }
  };

  const handleSelectUnit = (unit: UnitData) => {
    setUnitId(unit.unitId);
    getUnit({ variables: { unitId: unit.unitId } });
  };

  const handleCheckOut = () => {
    const qty = parseInt(quantity, 10);
    if (!selectedUnit) {
      RNAlert.alert('Error', 'Please scan or select a unit first');
      return;
    }

    if (isNaN(qty) || qty <= 0) {
      RNAlert.alert('Error', 'Please enter valid quantity');
      return;
    }

    setPendingQty(qty);
    setShowCheckoutConfirm(true);
  };

  const submitSpecificUnitCheckout = () => {
    if (!selectedUnit || pendingQty === null) return;

    if (pendingQty > selectedUnit.availableQuantity) {
      RNAlert.alert(
        'Insufficient Quantity',
        `Available in scanned unit: ${selectedUnit.availableQuantity}. Choose FEFO to pull across multiple units.`
      );
      return;
    }

    setShowCheckoutConfirm(false);
    checkOut({
      variables: {
        input: {
          unitId: selectedUnit.unitId,
          quantity: pendingQty,
          patientName: patientName || undefined,
          patientReferenceId: patientReference || undefined,
          notes: notes || undefined,
        },
      },
    });
  };

  const submitFEFOCheckout = () => {
    if (!selectedUnit || pendingQty === null) return;

    const ndcFromSelectedUnit = selectedUnit.drug.ndcId?.trim();
    const input: Record<string, unknown> = {
      quantity: pendingQty,
      patientName: patientName || undefined,
      patientReferenceId: patientReference || undefined,
      notes: notes || undefined,
    };

    if (ndcFromSelectedUnit) {
      input.ndcId = ndcFromSelectedUnit;
    } else {
      input.medicationName = selectedUnit.drug.medicationName;
      input.strength = selectedUnit.drug.strength;
      input.strengthUnit = selectedUnit.drug.strengthUnit;
    }

    setShowCheckoutConfirm(false);
    checkOutFEFO({ variables: { input } });
  };

  const handleReset = () => {
    setUnitId('');
    setSelectedUnit(null);
    setQuantity('');
    setPatientName('');
    setPatientReference('');
    setNotes('');
    setShowCheckoutConfirm(false);
    setPendingQty(null);
  };

  const handleQRScanned = ({ data }: { data: string }) => {
    if (!scanned) {
      setScanned(true);
      setShowQRScanner(false);
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
          'Camera permission is required to scan QR codes'
        );
        return;
      }
    }
    setShowQRScanner(true);
  };

  const renderSearchResults = () => {
    if (!unitId.trim() || unitId.length < 2) return null;
    if (!searchData?.searchUnitsByQuery || searchData.searchUnitsByQuery.length === 0) {
      if (!searchingUnits && unitId.trim().length >= 2) {
        return (
          <Alert
            variant="warning"
            title="No Results"
            message={`No units found matching "${unitId}". Try a different search term or scan a QR code.`}
          />
        );
      }
      return null;
    }

    return (
      <Card style={styles.searchResults}>
        <Text style={styles.sectionTitle}>
          Search Results ({searchData.searchUnitsByQuery.length})
        </Text>
        {searchData.searchUnitsByQuery.map((unit: UnitData) => {
          const isExpired = new Date(unit.expiryDate) < new Date();
          const isExpiringSoon =
            new Date(unit.expiryDate) < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

          return (
            <TouchableOpacity
              key={unit.unitId}
              style={styles.searchResultCard}
              onPress={() => handleSelectUnit(unit)}
            >
              <View style={styles.searchResultHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.medicationName}>{unit.drug.medicationName}</Text>
                  <Text style={styles.genericName}>{unit.drug.genericName}</Text>
                </View>
                <Badge variant={unit.availableQuantity > 0 ? 'default' : 'secondary'}>
                  {unit.availableQuantity}/{unit.totalQuantity}
                </Badge>
              </View>

              <View style={styles.badgeRow}>
                <Badge variant="outline">
                  {unit.drug.strength} {unit.drug.strengthUnit}
                </Badge>
                <Badge
                  variant={isExpired ? 'destructive' : isExpiringSoon ? 'warning' : 'secondary'}
                >
                  {new Date(unit.expiryDate).toLocaleDateString()}
                </Badge>
                {unit.lot?.location && (
                  <Badge variant="outline">{unit.lot.location.name}</Badge>
                )}
              </View>

              <View style={styles.searchResultFooter}>
                <Text style={styles.sourceText} numberOfLines={1}>
                  {unit.lot?.source || 'No source'}
                </Text>
                <Button
                  size="sm"
                  onPress={() => handleSelectUnit(unit)}
                  disabled={unit.availableQuantity === 0}
                >
                  Select
                </Button>
              </View>
            </TouchableOpacity>
          );
        })}
      </Card>
    );
  };

  const renderSelectedUnit = () => {
    if (!selectedUnit) return null;

    const isExpired = new Date(selectedUnit.expiryDate) < new Date();

    return (
      <Card style={styles.selectedUnitCard}>
        <View style={styles.unitHeader}>
          <Text style={styles.unitHeaderTitle}>Unit Details</Text>
          <Badge variant={selectedUnit.availableQuantity > 0 ? 'default' : 'destructive'}>
            {selectedUnit.availableQuantity} Available
          </Badge>
        </View>

        <Card style={styles.drugInfoCard}>
          <Text style={styles.drugTitle}>{selectedUnit.drug.medicationName}</Text>
          <Text style={styles.drugGeneric}>Generic: {selectedUnit.drug.genericName}</Text>
          <View style={styles.drugDetailsRow}>
            <Text style={styles.drugLabel}>Strength:</Text>
            <Badge variant="outline">
              {selectedUnit.drug.strength} {selectedUnit.drug.strengthUnit}
            </Badge>
          </View>
          <Text style={styles.drugDetail}>
            <Text style={styles.drugLabel}>Form:</Text> {selectedUnit.drug.form}
          </Text>
          {selectedUnit.drug.ndcId && (
            <Text style={styles.drugDetail}>
              <Text style={styles.drugLabel}>NDC:</Text> {selectedUnit.drug.ndcId}
            </Text>
          )}
        </Card>

        <View style={styles.statsGrid}>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Total Quantity</Text>
            <Badge variant="secondary">{selectedUnit.totalQuantity}</Badge>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Expiry Date</Text>
            <Badge variant={isExpired ? 'destructive' : 'secondary'}>
              {new Date(selectedUnit.expiryDate).toLocaleDateString()}
            </Badge>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Source</Text>
            <Text style={styles.statValue}>{selectedUnit.lot?.source}</Text>
          </View>
        </View>

        {selectedUnit.optionalNotes && (
          <View style={styles.notesSection}>
            <Text style={styles.notesLabel}>Notes</Text>
            <Text style={styles.notesText}>{selectedUnit.optionalNotes}</Text>
          </View>
        )}

        <View style={styles.separator} />

        <Text style={styles.formTitle}>Dispense Medication</Text>

        <View style={styles.formField}>
          <Text style={styles.fieldLabel}>Quantity to Dispense *</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter quantity"
            keyboardType="number-pad"
            value={quantity}
            onChangeText={setQuantity}
          />
        </View>

        <View style={styles.formField}>
          <Text style={styles.fieldLabel}>Patient Name (Optional)</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter patient or recipient name"
            value={patientName}
            onChangeText={setPatientName}
          />
        </View>

        <View style={styles.formField}>
          <Text style={styles.fieldLabel}>Patient Reference ID (Optional)</Text>
          <TextInput
            style={styles.input}
            placeholder="Patient identifier or code"
            value={patientReference}
            onChangeText={setPatientReference}
          />
        </View>

        <View style={styles.formField}>
          <Text style={styles.fieldLabel}>Notes (Optional)</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Any additional notes"
            multiline
            numberOfLines={3}
            textAlignVertical="top"
            value={notes}
            onChangeText={setNotes}
          />
        </View>

        <View style={styles.actionButtons}>
          <Button
            onPress={handleCheckOut}
            disabled={checkingOut || checkingOutFEFO}
            style={{ flex: 1 }}
          >
            {(checkingOut || checkingOutFEFO) ? 'Processing...' : 'Check Out'}
          </Button>
          <Button variant="outline" onPress={handleReset} style={{ flex: 1 }}>
            Cancel
          </Button>
        </View>
      </Card>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Check Out</Text>
          <Text style={styles.subtitle}>Dispense medications to patients</Text>
        </View>

        {!loadingStats && !hasInventory && (
          <Alert
            variant="warning"
            title="No Inventory"
            message="There are no medications in your inventory. Please check in medications before checking them out."
          />
        )}

        <Card>
          <Button variant="outline" onPress={handleOpenScanner} style={styles.scanButton}>
            Scan QR Code
          </Button>

          <View style={styles.searchSection}>
            <Text style={styles.searchLabel}>Search by Unit ID or Medication Name</Text>
            <View style={styles.searchInputRow}>
              <TextInput
                style={styles.searchInput}
                placeholder="Type unit ID or medication name..."
                value={unitId}
                onChangeText={setUnitId}
                onSubmitEditing={handleSearch}
              />
            </View>
            <Text style={styles.searchHint}>
              Results appear automatically as you type (minimum 2 characters)
            </Text>
          </View>

          <Button onPress={handleSearch} disabled={loadingUnit}>
            {loadingUnit ? 'Searching...' : 'Search'}
          </Button>
        </Card>

        {searchingUnits && (
          <ActivityIndicator size="large" color="#2563eb" style={styles.loader} />
        )}

        {renderSearchResults()}

        {renderSelectedUnit()}

        {/* QR Scanner Modal */}
        <Modal
          visible={showQRScanner}
          animationType="slide"
          onRequestClose={() => setShowQRScanner(false)}
        >
          <View style={styles.scannerContainer}>
            <CameraView
              style={styles.camera}
              facing="back"
              onBarcodeScanned={handleQRScanned}
              barcodeScannerSettings={{
                barcodeTypes: ['qr'],
              }}
            >
              <View style={styles.scannerOverlay}>
                <View style={styles.scannerHeader}>
                  <Text style={styles.scannerTitle}>Scan DaanaRX QR Code</Text>
                  <Text style={styles.scannerSubtitle}>
                    Scan the QR code on the medication unit to check it out
                  </Text>
                </View>
                <View style={styles.scannerFrame} />
                <View style={styles.scannerActions}>
                  <Button
                    variant="outline"
                    onPress={() => setShowQRScanner(false)}
                    style={styles.scannerButton}
                  >
                    Cancel
                  </Button>
                </View>
              </View>
            </CameraView>
          </View>
        </Modal>

        {/* Checkout Confirmation Modal */}
        <Modal
          visible={showCheckoutConfirm}
          transparent
          animationType="fade"
          onRequestClose={() => setShowCheckoutConfirm(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Choose checkout method</Text>
              <Text style={styles.modalDescription}>
                {selectedUnit && pendingQty !== null
                  ? `You're dispensing ${pendingQty} of ${selectedUnit.drug.medicationName} (${selectedUnit.drug.strength} ${selectedUnit.drug.strengthUnit}).`
                  : 'Select how you want to dispense this medication.'}
              </Text>

              {selectedUnit && pendingQty !== null && pendingQty > selectedUnit.availableQuantity && (
                <Alert
                  variant="warning"
                  title="Quantity exceeds scanned unit"
                  message={`This unit only has ${selectedUnit.availableQuantity} available. FEFO can pull the remaining quantity from other matching units (earliest expiry first).`}
                  style={styles.modalAlert}
                />
              )}

              <View style={styles.modalActions}>
                <Button
                  variant="outline"
                  onPress={() => setShowCheckoutConfirm(false)}
                  disabled={checkingOut || checkingOutFEFO}
                  style={styles.modalButton}
                >
                  Cancel
                </Button>
                <Button
                  variant="secondary"
                  onPress={submitSpecificUnitCheckout}
                  disabled={checkingOut || checkingOutFEFO}
                  style={styles.modalButton}
                >
                  Use scanned unit only
                </Button>
                <Button
                  onPress={submitFEFOCheckout}
                  disabled={checkingOut || checkingOutFEFO}
                  style={styles.modalButton}
                >
                  Use FEFO (recommended)
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
    backgroundColor: '#f9fafb',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
  },
  scanButton: {
    marginBottom: 16,
  },
  searchSection: {
    marginBottom: 16,
  },
  searchLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  searchInputRow: {
    marginBottom: 4,
  },
  searchInput: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    fontSize: 14,
    backgroundColor: '#ffffff',
  },
  searchHint: {
    fontSize: 12,
    color: '#6b7280',
  },
  loader: {
    marginVertical: 16,
  },
  searchResults: {
    marginTop: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 12,
  },
  searchResultCard: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    backgroundColor: '#ffffff',
  },
  searchResultHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  medicationName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  genericName: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 8,
  },
  searchResultFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  sourceText: {
    fontSize: 12,
    color: '#6b7280',
    flex: 1,
    marginRight: 8,
  },
  selectedUnitCard: {
    marginTop: 16,
  },
  unitHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  unitHeaderTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
  },
  drugInfoCard: {
    backgroundColor: '#eff6ff',
    borderColor: '#bfdbfe',
    marginBottom: 16,
  },
  drugTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  drugGeneric: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 8,
  },
  drugDetailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    gap: 8,
  },
  drugLabel: {
    fontWeight: '600',
    color: '#374151',
  },
  drugDetail: {
    fontSize: 14,
    color: '#111827',
    marginBottom: 4,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
    flexWrap: 'wrap',
    gap: 12,
  },
  statItem: {
    flex: 1,
    minWidth: '30%',
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6b7280',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#111827',
  },
  notesSection: {
    marginBottom: 16,
  },
  notesLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 4,
  },
  notesText: {
    fontSize: 14,
    color: '#374151',
  },
  separator: {
    height: 1,
    backgroundColor: '#e5e7eb',
    marginVertical: 16,
  },
  formTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 16,
  },
  formField: {
    marginBottom: 16,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    fontSize: 14,
    backgroundColor: '#ffffff',
  },
  textArea: {
    minHeight: 80,
    paddingTop: 12,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
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
    padding: 24,
  },
  scannerHeader: {
    alignItems: 'center',
    paddingTop: 48,
  },
  scannerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 8,
  },
  scannerSubtitle: {
    fontSize: 16,
    color: '#d1d5db',
    textAlign: 'center',
  },
  scannerFrame: {
    width: 250,
    height: 250,
    alignSelf: 'center',
    borderWidth: 2,
    borderColor: '#ffffff',
    borderRadius: 8,
  },
  scannerActions: {
    paddingBottom: 24,
  },
  scannerButton: {
    backgroundColor: '#ffffff',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 24,
    width: '100%',
    maxWidth: 500,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 8,
  },
  modalDescription: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 16,
  },
  modalAlert: {
    marginBottom: 16,
  },
  modalActions: {
    gap: 12,
  },
  modalButton: {
    marginBottom: 0,
  },
});
