import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
  Platform,
  Alert as RNAlert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { gql } from '@apollo/client';
import { useQuery, useMutation, useLazyQuery } from '@apollo/client/react';
import { useSelector } from 'react-redux';
import type { RootState } from '../../store';
import { CameraView, useCameraPermissions } from 'expo-camera';
import DateTimePicker from '@react-native-community/datetimepicker';
import QRCode from 'react-native-qrcode-svg';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import { Alert } from '../../components/ui/Alert';
import type { LocationData, LotData, DrugData } from '../../types';

const GET_LOCATIONS = gql`
  query GetLocations {
    getLocations {
      locationId
      name
      temp
    }
  }
`;

const GET_LOTS = gql`
  query GetLots {
    getLots {
      lotId
      source
      locationId
      dateCreated
      maxCapacity
      currentCapacity
      availableCapacity
    }
  }
`;

const CREATE_LOT = gql`
  mutation CreateLot($input: CreateLotInput!) {
    createLot(input: $input) {
      lotId
      source
      note
      maxCapacity
    }
  }
`;

const SEARCH_DRUGS = gql`
  query SearchDrugs($query: String!) {
    searchDrugs(query: $query) {
      drugId
      medicationName
      genericName
      strength
      strengthUnit
      ndcId
      form
      inInventory
    }
  }
`;

const CREATE_UNIT = gql`
  mutation CreateUnit($input: CreateUnitInput!) {
    createUnit(input: $input) {
      unitId
      totalQuantity
      availableQuantity
      expiryDate
      drug {
        medicationName
        genericName
      }
    }
  }
`;

export default function CheckInScreen() {
  const user = useSelector((state: RootState) => state.auth.user);
  const [activeStep, setActiveStep] = useState(0);

  // Step 1: Lot
  const [lotSource, setLotSource] = useState('');
  const [lotNote, setLotNote] = useState('');
  const [lotMaxCapacity, setLotMaxCapacity] = useState('');
  const [selectedLocationId, setSelectedLocationId] = useState('');
  const [selectedLotId, setSelectedLotId] = useState('');
  const [selectedLot, setSelectedLot] = useState<LotData | null>(null);
  const [useExistingLot, setUseExistingLot] = useState(false);
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const [showLotPicker, setShowLotPicker] = useState(false);

  // Step 2: Drug
  const [searchInput, setSearchInput] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [selectedDrug, setSelectedDrug] = useState<DrugData | null>(null);
  const [showManualEntry, setShowManualEntry] = useState(false);
  const [manualDrug, setManualDrug] = useState({
    medicationName: '',
    genericName: '',
    strength: 0,
    strengthUnit: 'mg',
    ndcId: '',
    form: 'Tablet',
  });
  const [showBarcodeScanner, setShowBarcodeScanner] = useState(false);
  const [scanned, setScanned] = useState(false);

  // Step 3: Unit
  const [totalQuantity, setTotalQuantity] = useState('');
  const [expiryDate, setExpiryDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [manufacturerLotNumber, setManufacturerLotNumber] = useState('');
  const [unitNotes, setUnitNotes] = useState('');
  const [createdUnitId, setCreatedUnitId] = useState('');
  const [createdUnit, setCreatedUnit] = useState<any>(null);

  // Camera permissions
  const [permission, requestPermission] = useCameraPermissions();

  // Queries
  const { data: locationsData } = useQuery(GET_LOCATIONS);
  const { data: lotsData, refetch: refetchLots } = useQuery(GET_LOTS);
  const [searchDrugs, { loading: searchLoading }] = useLazyQuery(SEARCH_DRUGS, {
    onCompleted: (data) => {
      setSearchResults(data.searchDrugs || []);
    },
  });

  // Mutations
  const [createLot, { loading: creatingLot }] = useMutation(CREATE_LOT, {
    onCompleted: (data) => {
      setSelectedLotId(data.createLot.lotId);
      setSelectedLot(data.createLot);
      refetchLots();
      RNAlert.alert('Success', 'Lot created successfully');
      setActiveStep(1);
    },
    onError: (error) => {
      RNAlert.alert('Error', error.message);
    },
  });

  const [createUnit, { loading: creatingUnit }] = useMutation(CREATE_UNIT, {
    refetchQueries: ['GetDashboardStats', 'GetUnits', 'GetUnitsAdvanced'],
    awaitRefetchQueries: true,
    onCompleted: (data) => {
      setCreatedUnitId(data.createUnit.unitId);
      setCreatedUnit(data.createUnit);
      RNAlert.alert('Success', 'Unit created successfully! Inventory updated.');
      setActiveStep(3);
    },
    onError: (error) => {
      RNAlert.alert('Error', error.message);
    },
  });

  // Search effect
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchInput.trim().length >= 2) {
        searchDrugs({ variables: { query: searchInput } });
      } else {
        setSearchResults([]);
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [searchInput]);

  const handleBarcodeScanned = ({ data }: { data: string }) => {
    if (!scanned) {
      setScanned(true);
      setShowBarcodeScanner(false);
      setSearchInput(data);
      setTimeout(() => setScanned(false), 2000);
    }
  };

  const handleOpenScanner = async () => {
    if (!permission?.granted) {
      const result = await requestPermission();
      if (!result.granted) {
        RNAlert.alert(
          'Camera Permission',
          'Camera permission is required to scan barcodes'
        );
        return;
      }
    }
    setShowBarcodeScanner(true);
  };

  const handleSelectDrug = (drug: any) => {
    const mappedDrug: DrugData = {
      drugId: drug.drugId,
      medicationName: drug.medicationName,
      genericName: drug.genericName,
      strength: drug.strength,
      strengthUnit: drug.strengthUnit,
      ndcId: drug.ndcId,
      form: drug.form,
      inInventory: drug.inInventory || false,
    };

    setSelectedDrug(mappedDrug);
    setSearchInput(drug.medicationName);
    setSearchResults([]);
    setShowManualEntry(false);
  };

  const handleCreateLot = () => {
    if (useExistingLot) {
      if (!selectedLotId) {
        RNAlert.alert('Error', 'Please select a lot');
        return;
      }
      setActiveStep(1);
      return;
    }

    const maxCap = lotMaxCapacity ? parseInt(lotMaxCapacity, 10) : undefined;
    createLot({
      variables: {
        input: {
          source: lotSource,
          note: lotNote,
          locationId: selectedLocationId,
          maxCapacity: maxCap,
        },
      },
    });
  };

  const handleCreateUnit = () => {
    if (!selectedLotId || !expiryDate) {
      RNAlert.alert('Error', 'Please fill all required fields');
      return;
    }

    const drugData = selectedDrug || manualDrug;
    const qty = parseInt(totalQuantity, 10);

    // Validate quantity
    if (isNaN(qty) || qty <= 0) {
      RNAlert.alert('Error', 'Total quantity must be a valid positive number');
      return;
    }

    // Format expiry date as YYYY-MM-DD
    const formattedExpiryDate = expiryDate.toISOString().split('T')[0];

    const cleanDrugData = !selectedDrug?.drugId
      ? {
          medicationName: drugData.medicationName,
          genericName: drugData.genericName,
          strength: drugData.strength,
          strengthUnit: drugData.strengthUnit,
          ndcId: drugData.ndcId,
          form: drugData.form,
        }
      : undefined;

    createUnit({
      variables: {
        input: {
          totalQuantity: qty,
          availableQuantity: qty,
          lotId: selectedLotId,
          expiryDate: formattedExpiryDate,
          drugId: selectedDrug?.drugId,
          drugData: cleanDrugData,
          manufacturerLotNumber: manufacturerLotNumber || undefined,
          optionalNotes: unitNotes,
        },
      },
    });
  };

  const handleReset = () => {
    setActiveStep(0);
    setLotSource('');
    setLotNote('');
    setLotMaxCapacity('');
    setSelectedLocationId('');
    setSelectedLotId('');
    setSelectedLot(null);
    setCreatedUnitId('');
    setCreatedUnit(null);
    setUseExistingLot(false);
    setSearchInput('');
    setSelectedDrug(null);
    setShowManualEntry(false);
    setManualDrug({
      medicationName: '',
      genericName: '',
      strength: 0,
      strengthUnit: 'mg',
      ndcId: '',
      form: 'Tablet',
    });
    setTotalQuantity('');
    setExpiryDate(new Date());
    setManufacturerLotNumber('');
    setUnitNotes('');
    setCreatedUnitId('');
  };

  const isAdmin = user?.userRole === 'admin' || user?.userRole === 'superadmin';
  const hasLocations =
    locationsData?.getLocations && locationsData.getLocations.length > 0;

  const isStep1Valid = () => {
    if (useExistingLot) {
      return selectedLotId !== '';
    }
    return lotSource.trim() !== '' && selectedLocationId !== '';
  };

  const isStep2Valid = () => {
    if (selectedDrug) return true;
    return (
      manualDrug.medicationName.trim() !== '' &&
      manualDrug.genericName.trim() !== '' &&
      manualDrug.strength > 0 &&
      manualDrug.ndcId.trim() !== ''
    );
  };

  const isStep3Valid = () => {
    const qty = parseInt(totalQuantity, 10);
    return (
      !isNaN(qty) &&
      qty > 0 &&
      expiryDate instanceof Date &&
      manufacturerLotNumber.trim() !== ''
    );
  };

  const renderStep1 = () => (
    <Card style={styles.card}>
      <Text style={styles.stepTitle}>Step 1: Create or Select Lot</Text>
      <Text style={styles.stepSubtitle}>Choose donation source</Text>

      <View style={styles.buttonRow}>
        <TouchableOpacity
          style={[styles.toggleButton, !useExistingLot && styles.toggleButtonActive]}
          onPress={() => setUseExistingLot(false)}
        >
          <Text
            style={[
              styles.toggleButtonText,
              !useExistingLot && styles.toggleButtonTextActive,
            ]}
          >
            Create New
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.toggleButton, useExistingLot && styles.toggleButtonActive]}
          onPress={() => setUseExistingLot(true)}
        >
          <Text
            style={[
              styles.toggleButtonText,
              useExistingLot && styles.toggleButtonTextActive,
            ]}
          >
            Use Existing
          </Text>
        </TouchableOpacity>
      </View>

      {useExistingLot ? (
        <View style={styles.section}>
          <Text style={styles.label}>Select Lot *</Text>
          <TouchableOpacity
            style={styles.picker}
            onPress={() => setShowLotPicker(true)}
          >
            <Text style={styles.pickerText}>
              {selectedLotId
                ? lotsData?.getLots.find((l: LotData) => l.lotId === selectedLotId)
                    ?.source || 'Select lot'
                : 'Select lot'}
            </Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <View style={styles.section}>
            <Text style={styles.label}>Donation Source *</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., CVS Pharmacy"
              value={lotSource}
              onChangeText={setLotSource}
            />
          </View>

          <View style={styles.section}>
            <Text style={styles.label}>Storage Location *</Text>
            <TouchableOpacity
              style={styles.picker}
              onPress={() => setShowLocationPicker(true)}
            >
              <Text style={styles.pickerText}>
                {selectedLocationId
                  ? locationsData?.getLocations.find(
                      (l: LocationData) => l.locationId === selectedLocationId
                    )?.name || 'Select location'
                  : 'Select location'}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.section}>
            <Text style={styles.label}>Maximum Capacity (Optional)</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., 100"
              keyboardType="numeric"
              value={lotMaxCapacity}
              onChangeText={setLotMaxCapacity}
            />
          </View>

          <View style={styles.section}>
            <Text style={styles.label}>Notes (Optional)</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Any additional information"
              multiline
              numberOfLines={3}
              value={lotNote}
              onChangeText={setLotNote}
            />
          </View>
        </>
      )}

      <View style={styles.buttonContainer}>
        {!useExistingLot && (
          <Button
            onPress={handleCreateLot}
            disabled={creatingLot || !isStep1Valid()}
            style={{ marginBottom: 12 }}
          >
            {creatingLot ? 'Creating...' : 'Create Lot & Continue'}
          </Button>
        )}
        {useExistingLot && (
          <Button onPress={() => setActiveStep(1)} disabled={!isStep1Valid()}>
            Continue
          </Button>
        )}
      </View>
    </Card>
  );

  const renderStep2 = () => (
    <Card style={styles.card}>
      <Text style={styles.stepTitle}>Step 2: Find Drug</Text>
      <Text style={styles.stepSubtitle}>Search or scan NDC barcode</Text>

      <Button variant="outline" onPress={handleOpenScanner} style={{ marginBottom: 16 }}>
        Scan Barcode
      </Button>

      <View style={styles.section}>
        <Text style={styles.label}>Search by Drug Name or NDC</Text>
        <TextInput
          style={styles.input}
          placeholder="Start typing..."
          value={searchInput}
          onChangeText={setSearchInput}
        />
        {searchLoading && (
          <ActivityIndicator size="small" color="#2563eb" style={{ marginTop: 8 }} />
        )}
      </View>

      {searchResults.length > 0 && !selectedDrug && (
        <View style={styles.searchResults}>
          <ScrollView style={{ maxHeight: 200 }}>
            {searchResults.map((drug, index) => (
              <TouchableOpacity
                key={index}
                style={styles.searchResultItem}
                onPress={() => handleSelectDrug(drug)}
              >
                <View style={{ flex: 1 }}>
                  <Text style={styles.drugName}>{drug.medicationName}</Text>
                  <Text style={styles.drugDetails}>
                    {drug.strength}<Text> </Text>{drug.strengthUnit}<Text> - </Text>{drug.form}
                  </Text>
                  {drug.ndcId && (
                    <Text style={styles.drugNdc}><Text>NDC: </Text>{drug.ndcId}</Text>
                  )}
                </View>
                {drug.inInventory && (
                  <Badge variant="secondary" style={{ marginLeft: 8 }}>
                    In Stock
                  </Badge>
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {selectedDrug && (
        <Card style={styles.selectedDrug}>
          <Text style={styles.selectedDrugName}>{selectedDrug.medicationName}</Text>
          <Text style={styles.selectedDrugDetails}>
            {selectedDrug.strength}<Text> </Text>{selectedDrug.strengthUnit}<Text> - </Text>{selectedDrug.form}
          </Text>
          {selectedDrug.ndcId && (
            <Text style={styles.selectedDrugNdc}><Text>NDC: </Text>{selectedDrug.ndcId}</Text>
          )}
          <Button
            variant="outline"
            onPress={() => setSelectedDrug(null)}
            style={{ marginTop: 12 }}
          >
            Change Drug
          </Button>
        </Card>
      )}

      {!selectedDrug && (
        <>
          <Button
            variant="outline"
            onPress={() => setShowManualEntry(!showManualEntry)}
            style={{ marginTop: 16 }}
          >
            {showManualEntry ? 'Hide Manual Entry' : 'Enter Drug Manually'}
          </Button>

          {showManualEntry && (
            <View style={styles.manualEntry}>
              <Text style={styles.manualEntryTitle}>Manual Drug Entry</Text>

              <View style={styles.section}>
                <Text style={styles.label}>Medication Name *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g., Fluoxetine"
                  value={manualDrug.medicationName}
                  onChangeText={(text) =>
                    setManualDrug({ ...manualDrug, medicationName: text })
                  }
                />
              </View>

              <View style={styles.section}>
                <Text style={styles.label}>Generic Name *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g., Prozac"
                  value={manualDrug.genericName}
                  onChangeText={(text) =>
                    setManualDrug({ ...manualDrug, genericName: text })
                  }
                />
              </View>

              <View style={styles.row}>
                <View style={{ flex: 1, marginRight: 8 }}>
                  <Text style={styles.label}>Strength *</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="10"
                    keyboardType="numeric"
                    value={manualDrug.strength ? String(manualDrug.strength) : ''}
                    onChangeText={(text) =>
                      setManualDrug({ ...manualDrug, strength: Number(text) || 0 })
                    }
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.label}>Unit *</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="mg"
                    value={manualDrug.strengthUnit}
                    onChangeText={(text) =>
                      setManualDrug({ ...manualDrug, strengthUnit: text })
                    }
                  />
                </View>
              </View>

              <View style={styles.section}>
                <Text style={styles.label}>NDC ID *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter NDC code"
                  value={manualDrug.ndcId}
                  onChangeText={(text) => setManualDrug({ ...manualDrug, ndcId: text })}
                />
              </View>

              <View style={styles.section}>
                <Text style={styles.label}>Form *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Tablet"
                  value={manualDrug.form}
                  onChangeText={(text) => setManualDrug({ ...manualDrug, form: text })}
                />
              </View>
            </View>
          )}
        </>
      )}

      <View style={styles.buttonContainer}>
        <View style={styles.buttonRow}>
          <Button
            variant="outline"
            onPress={() => setActiveStep(0)}
            style={{ flex: 1, marginRight: 8 }}
          >
            Previous
          </Button>
          <Button
            onPress={() => setActiveStep(2)}
            disabled={!isStep2Valid()}
            style={{ flex: 1 }}
          >
            Next
          </Button>
        </View>
      </View>
    </Card>
  );

  const renderStep3 = () => {
    const qty = parseInt(totalQuantity, 10) || 0;
    const currentCapacity = selectedLot?.currentCapacity ?? 0;
    const lotCapacityPercent = selectedLot?.maxCapacity
      ? ((currentCapacity + qty) / selectedLot.maxCapacity) * 100
      : 0;
    const willExceedCapacity =
      selectedLot?.maxCapacity && currentCapacity + qty > selectedLot.maxCapacity;
    const willBeNearFull = lotCapacityPercent >= 80 && !willExceedCapacity;

    return (
      <Card style={styles.card}>
        <Text style={styles.stepTitle}>Step 3: Create Unit</Text>
        <Text style={styles.stepSubtitle}>Set quantity and expiry</Text>

        {selectedLot?.maxCapacity && (
          <View style={styles.capacityInfo}>
            <Text style={styles.capacityLabel}>
              Lot Capacity: {currentCapacity + qty}/{selectedLot.maxCapacity} units
            </Text>
            {willExceedCapacity && (
              <Alert
                variant="destructive"
                title="Capacity Exceeded"
                message={`This quantity will exceed the lot's maximum capacity. Reduce quantity to ${
                  selectedLot.maxCapacity - currentCapacity
                } or less.`}
              />
            )}
            {willBeNearFull && (
              <Alert
                variant="warning"
                title="Lot Near Capacity"
                message={`Adding this unit will bring the lot to ${Math.round(
                  lotCapacityPercent
                )}% capacity.`}
              />
            )}
          </View>
        )}

      <View style={styles.section}>
        <Text style={styles.label}>Total Quantity *</Text>
        <TextInput
          style={styles.input}
          placeholder="100"
          keyboardType="numeric"
          value={totalQuantity}
          onChangeText={setTotalQuantity}
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Expiry Date *</Text>
        <TouchableOpacity
          style={styles.datePickerButton}
          onPress={() => setShowDatePicker(true)}
        >
          <Text style={styles.datePickerText}>
            {expiryDate.toLocaleDateString()}
          </Text>
        </TouchableOpacity>
        {showDatePicker && (
          <DateTimePicker
            value={expiryDate}
            mode="date"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={(event, selectedDate) => {
              setShowDatePicker(Platform.OS === 'ios');
              if (selectedDate) {
                setExpiryDate(selectedDate);
              }
            }}
            minimumDate={new Date()}
          />
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Manufacturer Lot Number *</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter lot number from package"
          value={manufacturerLotNumber}
          onChangeText={setManufacturerLotNumber}
        />
        <Text style={styles.hint}>
          Required for recall tracking. Find on medication package.
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Notes (Optional)</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Any additional notes"
          multiline
          numberOfLines={3}
          value={unitNotes}
          onChangeText={setUnitNotes}
        />
      </View>

      <View style={styles.buttonContainer}>
        <View style={styles.buttonRow}>
          <Button
            variant="outline"
            onPress={() => setActiveStep(1)}
            style={{ flex: 1, marginRight: 8 }}
          >
            Previous
          </Button>
          <Button
            onPress={handleCreateUnit}
            disabled={!isStep3Valid() || creatingUnit}
            style={{ flex: 1 }}
          >
            {creatingUnit ? 'Creating...' : 'Create Unit'}
          </Button>
        </View>
      </View>
    </Card>
    );
  };

  const renderStep4 = () => (
    <ScrollView contentContainerStyle={{ padding: 16 }}>
      <Card style={styles.card}>
        <Text style={styles.confirmationTitle}>✓ Unit Created Successfully!</Text>
        <Text style={styles.confirmationText}>
          Unit has been added to inventory.
        </Text>

        {createdUnit && (
          <View style={styles.unitSummary}>
            <Text style={styles.summaryTitle}>Medication Details</Text>
            <Text style={styles.summaryText}>
              {createdUnit.drug.medicationName} ({createdUnit.drug.genericName})
            </Text>
            <Text style={styles.summaryLabel}>Quantity: {createdUnit.totalQuantity} units</Text>
            <Text style={styles.summaryLabel}>
              Expiry: {new Date(createdUnit.expiryDate).toLocaleDateString()}
            </Text>
          </View>
        )}

        {createdUnitId && (
          <View style={styles.qrContainer}>
            <Text style={styles.qrTitle}>Unit QR Code</Text>
            <View style={styles.qrCodeWrapper}>
              <QRCode
                value={createdUnitId}
                size={200}
                color="#000000"
                backgroundColor="#ffffff"
              />
            </View>
            <Text style={styles.qrHint}>
              Scan this code to quickly access this unit
            </Text>
            <Text style={styles.unitIdLabel}>Unit ID:</Text>
            <Text style={styles.unitIdValue}>{createdUnitId}</Text>
          </View>
        )}

        <View style={styles.buttonContainer}>
          <Button onPress={handleReset}>Add Another Unit</Button>
        </View>
      </Card>
    </ScrollView>
  );

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.title}>Check In</Text>
        <Text style={styles.subtitle}>Add new medications to inventory</Text>
      </View>

      {!hasLocations && (
        <Card style={styles.alert}>
          <Text style={styles.alertText}>
            {isAdmin
              ? 'You need to create at least one storage location before checking in medications.'
              : 'No storage locations are available. Please contact your administrator.'}
          </Text>
        </Card>
      )}

      {hasLocations && (
        <>
          <View style={styles.stepper}>
            <View style={styles.stepperItem}>
              <View
                style={[
                  styles.stepperCircle,
                  activeStep >= 0 && styles.stepperCircleActive,
                ]}
              >
                <Text
                  style={[
                    styles.stepperNumber,
                    activeStep >= 0 && styles.stepperNumberActive,
                  ]}
                >
                  1
                </Text>
              </View>
              <Text style={styles.stepperLabel}>Lot</Text>
            </View>
            <View style={styles.stepperLine} />
            <View style={styles.stepperItem}>
              <View
                style={[
                  styles.stepperCircle,
                  activeStep >= 1 && styles.stepperCircleActive,
                ]}
              >
                <Text
                  style={[
                    styles.stepperNumber,
                    activeStep >= 1 && styles.stepperNumberActive,
                  ]}
                >
                  2
                </Text>
              </View>
              <Text style={styles.stepperLabel}>Drug</Text>
            </View>
            <View style={styles.stepperLine} />
            <View style={styles.stepperItem}>
              <View
                style={[
                  styles.stepperCircle,
                  activeStep >= 2 && styles.stepperCircleActive,
                ]}
              >
                <Text
                  style={[
                    styles.stepperNumber,
                    activeStep >= 2 && styles.stepperNumberActive,
                  ]}
                >
                  3
                </Text>
              </View>
              <Text style={styles.stepperLabel}>Unit</Text>
            </View>
          </View>

          {activeStep === 0 && renderStep1()}
          {activeStep === 1 && renderStep2()}
          {activeStep === 2 && renderStep3()}
          {activeStep === 3 && renderStep4()}
        </>
      )}

      {/* Location Picker Modal */}
      <Modal
        visible={showLocationPicker}
        transparent
        animationType="fade"
        onRequestClose={() => setShowLocationPicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Location</Text>
            <ScrollView style={styles.modalScroll}>
              {locationsData?.getLocations.map((loc: LocationData) => (
                <TouchableOpacity
                  key={loc.locationId}
                  style={styles.modalItem}
                  onPress={() => {
                    setSelectedLocationId(loc.locationId);
                    setShowLocationPicker(false);
                  }}
                >
                  <View>
                    <Text style={styles.modalItemText}>
                      {loc.name} (<Text>{loc.temp}</Text><Text>)</Text>
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <Button
              variant="outline"
              onPress={() => setShowLocationPicker(false)}
              style={{ marginTop: 16 }}
            >
              Cancel
            </Button>
          </View>
        </View>
      </Modal>

      {/* Lot Picker Modal */}
      <Modal
        visible={showLotPicker}
        transparent
        animationType="fade"
        onRequestClose={() => setShowLotPicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Lot</Text>
            <ScrollView style={styles.modalScroll}>
              {lotsData?.getLots.map((lot: LotData) => {
                const capacityPercent = lot.maxCapacity && lot.currentCapacity
                  ? (lot.currentCapacity / lot.maxCapacity) * 100
                  : 0;
                const isNearFull = capacityPercent >= 80;
                const isFull = lot.availableCapacity === 0;

                return (
                  <TouchableOpacity
                    key={lot.lotId}
                    style={styles.modalItem}
                    onPress={() => {
                      setSelectedLotId(lot.lotId);
                      setSelectedLot(lot);
                      setShowLotPicker(false);
                    }}
                    disabled={isFull}
                  >
                    <View style={{ flex: 1 }}>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Text style={[styles.modalItemText, isFull && { color: '#9ca3af' }]}>
                          {lot.source}
                        </Text>
                        {isFull && (
                          <Badge variant="destructive">Full</Badge>
                        )}
                        {!isFull && isNearFull && (
                          <Badge variant="warning">Near Full</Badge>
                        )}
                      </View>
                      <Text style={styles.modalItemSubtext}>
                        {new Date(lot.dateCreated).toLocaleDateString()}
                        {lot.maxCapacity && (
                          <Text> • {lot.currentCapacity}/{lot.maxCapacity} units</Text>
                        )}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
            <Button
              variant="outline"
              onPress={() => setShowLotPicker(false)}
              style={{ marginTop: 16 }}
            >
              Cancel
            </Button>
          </View>
        </View>
      </Modal>

      {/* Barcode Scanner Modal */}
      <Modal
        visible={showBarcodeScanner}
        animationType="slide"
        onRequestClose={() => setShowBarcodeScanner(false)}
      >
        <View style={styles.scannerContainer}>
          <CameraView
            style={styles.camera}
            facing="back"
            onBarcodeScanned={handleBarcodeScanned}
            barcodeScannerSettings={{
              barcodeTypes: ['upc_a', 'upc_e', 'ean13', 'ean8', 'code128', 'code39'],
            }}
          >
            <View style={styles.scannerOverlay}>
              <View style={styles.scannerHeader}>
                <Text style={styles.scannerTitle}>Scan NDC Barcode</Text>
                <Text style={styles.scannerSubtitle}>
                  Position the barcode within the frame
                </Text>
              </View>
              <View style={styles.scannerFrame} />
              <View style={styles.scannerActions}>
                <Button
                  variant="outline"
                  onPress={() => setShowBarcodeScanner(false)}
                  style={styles.scannerButton}
                >
                  Cancel
                </Button>
              </View>
            </View>
          </CameraView>
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
  alert: {
    backgroundColor: '#fef2f2',
    borderColor: '#fca5a5',
    marginBottom: 16,
  },
  alertText: {
    color: '#991b1b',
    fontSize: 14,
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  stepperItem: {
    alignItems: 'center',
  },
  stepperCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#e5e7eb',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  stepperCircleActive: {
    backgroundColor: '#2563eb',
  },
  stepperNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#6b7280',
  },
  stepperNumberActive: {
    color: '#ffffff',
  },
  stepperLabel: {
    fontSize: 12,
    color: '#6b7280',
  },
  stepperLine: {
    width: 40,
    height: 2,
    backgroundColor: '#e5e7eb',
    marginHorizontal: 8,
  },
  card: {
    marginBottom: 16,
  },
  stepTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  stepSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 16,
  },
  buttonRow: {
    flexDirection: 'row',
  },
  toggleButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d1d5db',
    backgroundColor: '#ffffff',
    alignItems: 'center',
  },
  toggleButtonActive: {
    backgroundColor: '#2563eb',
    borderColor: '#2563eb',
  },
  toggleButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  toggleButtonTextActive: {
    color: '#ffffff',
  },
  section: {
    marginTop: 16,
  },
  label: {
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
    textAlignVertical: 'top',
  },
  picker: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#ffffff',
  },
  pickerText: {
    fontSize: 14,
    color: '#374151',
  },
  buttonContainer: {
    marginTop: 24,
  },
  row: {
    flexDirection: 'row',
    marginTop: 16,
  },
  searchResults: {
    marginTop: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    backgroundColor: '#ffffff',
    padding: 8,
  },
  searchResultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  drugName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  drugDetails: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
  drugNdc: {
    fontSize: 11,
    color: '#2563eb',
    marginTop: 2,
  },
  selectedDrug: {
    backgroundColor: '#eff6ff',
    borderColor: '#93c5fd',
    marginTop: 16,
  },
  selectedDrugName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
  },
  selectedDrugDetails: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 4,
  },
  selectedDrugNdc: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
  manualEntry: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  manualEntryTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 8,
  },
  hint: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
  },
  confirmationTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#10b981',
    textAlign: 'center',
    marginBottom: 12,
  },
  confirmationText: {
    fontSize: 16,
    color: '#374151',
    textAlign: 'center',
    marginBottom: 8,
  },
  unitId: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 24,
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
    maxWidth: 400,
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 16,
  },
  modalScroll: {
    maxHeight: 300,
  },
  modalItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  modalItemText: {
    fontSize: 14,
    color: '#374151',
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
  datePickerButton: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#ffffff',
  },
  datePickerText: {
    fontSize: 14,
    color: '#111827',
  },
  capacityInfo: {
    marginBottom: 16,
  },
  capacityLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  modalItemSubtext: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
  unitSummary: {
    backgroundColor: '#eff6ff',
    borderRadius: 8,
    padding: 16,
    marginVertical: 16,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e40af',
    marginBottom: 8,
  },
  summaryText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#374151',
    marginTop: 2,
  },
  qrContainer: {
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    marginVertical: 16,
  },
  qrTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
  qrCodeWrapper: {
    padding: 16,
    backgroundColor: '#ffffff',
    borderRadius: 8,
    marginBottom: 12,
  },
  qrHint: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 16,
  },
  unitIdLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6b7280',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  unitIdValue: {
    fontSize: 11,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    color: '#374151',
    textAlign: 'center',
  },
});
