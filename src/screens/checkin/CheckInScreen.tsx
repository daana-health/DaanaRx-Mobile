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
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { gql } from '@apollo/client';
import { useQuery, useMutation, useLazyQuery } from '@apollo/client/react';
import { useSelector } from 'react-redux';
import type { RootState } from '../../store';
import DateTimePicker from '@react-native-community/datetimepicker';
import QRCode from 'react-native-qrcode-svg';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import type { LocationData, LotData, DrugData, BatchCreatedUnit } from '../../types';

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
      lotCode
      locationId
      dateCreated
      maxCapacity
      currentCapacity
      availableCapacity
    }
  }
`;

const GET_CLINIC = gql`
  query GetClinic {
    getClinic {
      clinicId
      requireLotLocation
    }
  }
`;

const CREATE_LOT = gql`
  mutation CreateLot($input: CreateLotInput!) {
    createLot(input: $input) {
      lotId
      source
      lotCode
      note
      maxCapacity
    }
  }
`;

const SEARCH_MEDICATIONS_BY_NAME = gql`
  query SearchMedicationsByName($query: String!) {
    searchMedicationsByName(query: $query) {
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

const BATCH_CREATE_UNITS = gql`
  mutation BatchCreateUnits($input: BatchCheckInInput!) {
    batchCreateUnits(input: $input) {
      unitId
      qrCode
      totalQuantity
      availableQuantity
      expiryDate
      drug {
        medicationName
        strength
        strengthUnit
        form
      }
    }
  }
`;

// Helper to get lot description from code
function getLotDescription(lotCode: string): string {
  if (!lotCode || lotCode.length === 0) return '';

  const firstChar = lotCode[0].toUpperCase();
  const drawerLetter = `Drawer ${firstChar}`;

  if (lotCode.length === 1) {
    return drawerLetter;
  }

  const secondChar = lotCode[1].toUpperCase();
  if (secondChar === 'L') {
    return `${drawerLetter} Left`;
  } else if (secondChar === 'R') {
    return `${drawerLetter} Right`;
  }

  return drawerLetter;
}

export default function CheckInScreen() {
  const user = useSelector((state: RootState) => state.auth.user);

  // Form state
  const [selectedLotId, setSelectedLotId] = useState('');
  const [selectedLot, setSelectedLot] = useState<LotData | null>(null);
  const [medicationName, setMedicationName] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [dosage, setDosage] = useState('');
  const [expiryDate, setExpiryDate] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [manufacturerLotNumber, setManufacturerLotNumber] = useState('');

  // Medication search state
  const [searchResults, setSearchResults] = useState<DrugData[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedMedication, setSelectedMedication] = useState<DrugData | null>(null);

  // New lot modal state
  const [showNewLotModal, setShowNewLotModal] = useState(false);
  const [newLotDrawer, setNewLotDrawer] = useState('A');
  const [newLotSide, setNewLotSide] = useState<'L' | 'R' | ''>('');
  const [newLotSource, setNewLotSource] = useState('');
  const [newLotNote, setNewLotNote] = useState('');
  const [newLotLocationId, setNewLotLocationId] = useState('');

  // Picker modals
  const [showLotPicker, setShowLotPicker] = useState(false);
  const [showDrawerPicker, setShowDrawerPicker] = useState(false);
  const [showLocationPicker, setShowLocationPicker] = useState(false);

  // Success state
  const [createdUnits, setCreatedUnits] = useState<BatchCreatedUnit[]>([]);
  const [showSuccess, setShowSuccess] = useState(false);

  // Queries
  const { data: locationsData } = useQuery(GET_LOCATIONS);
  const { data: lotsData, refetch: refetchLots } = useQuery(GET_LOTS);
  const { data: clinicData } = useQuery(GET_CLINIC);
  const [searchMedications, { loading: searchLoading }] = useLazyQuery(SEARCH_MEDICATIONS_BY_NAME, {
    onCompleted: (data) => {
      setSearchResults(data.searchMedicationsByName || []);
      setShowDropdown((data.searchMedicationsByName || []).length > 0);
    },
  });

  const hasLocations = locationsData?.getLocations && locationsData.getLocations.length > 0;
  const isAdmin = user?.userRole === 'admin' || user?.userRole === 'superadmin';
  const requireLotLocation = clinicData?.getClinic?.requireLotLocation ?? false;

  // Mutations
  const [createLot, { loading: creatingLot }] = useMutation(CREATE_LOT, {
    onCompleted: (data) => {
      setSelectedLotId(data.createLot.lotId);
      setSelectedLot(data.createLot);
      setShowNewLotModal(false);
      setNewLotDrawer('A');
      setNewLotSide('');
      setNewLotSource('');
      setNewLotNote('');
      setNewLotLocationId('');
      refetchLots();
      RNAlert.alert('Success', `Lot ${data.createLot.lotCode} created successfully`);
    },
    onError: (error) => {
      RNAlert.alert('Error', error.message);
    },
  });

  const [batchCreateUnits, { loading: creatingUnits }] = useMutation(BATCH_CREATE_UNITS, {
    refetchQueries: ['GetDashboardStats', 'GetUnits', 'GetUnitsAdvanced', 'GetLots'],
    awaitRefetchQueries: true,
    onCompleted: (data) => {
      setCreatedUnits(data.batchCreateUnits);
      setShowSuccess(true);
      RNAlert.alert('Success', `${data.batchCreateUnits.length} unit(s) created successfully!`);
    },
    onError: (error) => {
      RNAlert.alert('Error', error.message);
    },
  });

  // Debounced medication search
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (medicationName.trim().length >= 2 && !selectedMedication) {
        searchMedications({ variables: { query: medicationName } });
      } else {
        setSearchResults([]);
        setShowDropdown(false);
      }
    }, 400);

    return () => clearTimeout(timeoutId);
  }, [medicationName, selectedMedication]);

  const handleSelectMedication = (med: DrugData) => {
    setSelectedMedication(med);
    setMedicationName(med.medicationName);
    // Auto-fill dosage if strength info is available
    if (med.strength && med.strengthUnit) {
      setDosage(`${med.strength}${med.strengthUnit}`);
    }
    setSearchResults([]);
    setShowDropdown(false);
  };

  const handleClearMedication = () => {
    setSelectedMedication(null);
    setMedicationName('');
    setDosage('');
  };

  const handleCreateLot = () => {
    if (!newLotDrawer) {
      RNAlert.alert('Error', 'Please select a drawer letter');
      return;
    }

    if (requireLotLocation && !newLotSide) {
      RNAlert.alert('Error', 'Please select a side (L/R)');
      return;
    }

    if (!newLotLocationId) {
      RNAlert.alert('Error', 'Please select a storage location');
      return;
    }

    const lotCode = newLotSide ? `${newLotDrawer}${newLotSide}` : newLotDrawer;

    createLot({
      variables: {
        input: {
          lotCode,
          source: newLotSource || undefined,
          note: newLotNote || undefined,
          locationId: newLotLocationId,
        },
      },
    });
  };

  const handleSubmit = () => {
    // Validation
    if (!selectedLotId) {
      RNAlert.alert('Error', 'Please select a lot');
      return;
    }

    if (!medicationName.trim()) {
      RNAlert.alert('Error', 'Please enter a medication name');
      return;
    }

    if (!dosage.trim()) {
      RNAlert.alert('Error', 'Please enter the dosage');
      return;
    }

    const qty = parseInt(quantity, 10);
    if (isNaN(qty) || qty < 1) {
      RNAlert.alert('Error', 'Quantity must be at least 1');
      return;
    }

    batchCreateUnits({
      variables: {
        input: {
          lotId: selectedLotId,
          medicationName: medicationName.trim(),
          dosage: dosage.trim(),
          quantity: qty,
          expiryDate: expiryDate ? expiryDate.toISOString().split('T')[0] : undefined,
          manufacturerLotNumber: manufacturerLotNumber || undefined,
        },
      },
    });
  };

  const handleReset = () => {
    setSelectedLotId('');
    setSelectedLot(null);
    setMedicationName('');
    setSelectedMedication(null);
    setQuantity('1');
    setDosage('');
    setExpiryDate(null);
    setManufacturerLotNumber('');
    setCreatedUnits([]);
    setShowSuccess(false);
  };

  const isFormValid = () => {
    return (
      selectedLotId &&
      medicationName.trim() &&
      dosage.trim() &&
      parseInt(quantity, 10) >= 1
    );
  };

  // Success view - show created units with QR codes
  if (showSuccess && createdUnits.length > 0) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
          <View style={styles.header}>
            <Text style={styles.successTitle}>Check-In Complete</Text>
            <Text style={styles.successSubtitle}>
              {createdUnits.length} unit(s) created successfully
            </Text>
          </View>

          <Card style={styles.card}>
            <Text style={styles.sectionTitle}>Generated Labels ({createdUnits.length})</Text>
            <Text style={styles.sectionSubtitle}>
              Each unit has a unique QR code for tracking
            </Text>

            {createdUnits.map((unit, index) => (
              <View key={unit.unitId} style={styles.unitCard}>
                <View style={styles.qrContainer}>
                  <QRCode
                    value={unit.qrCode}
                    size={100}
                    color="#000000"
                    backgroundColor="#ffffff"
                  />
                </View>
                <View style={styles.unitInfo}>
                  <Text style={styles.qrCodeText}>{unit.qrCode}</Text>
                  <Text style={styles.unitMedName}>{unit.drug.medicationName}</Text>
                  <Text style={styles.unitMedDetails}>
                    {unit.drug.strength}{unit.drug.strengthUnit} - {unit.drug.form}
                  </Text>
                </View>
              </View>
            ))}
          </Card>

          <Button onPress={handleReset} style={styles.resetButton}>
            Check In More Medications
          </Button>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Check In</Text>
          <Text style={styles.subtitle}>Add new medications to inventory</Text>
        </View>

        {!hasLocations && (
          <Card style={styles.alertCard}>
            <Text style={styles.alertText}>
              {isAdmin
                ? 'You need to create at least one storage location before checking in medications.'
                : 'No storage locations are available. Please contact your administrator.'}
            </Text>
          </Card>
        )}

        {hasLocations && (
          <Card style={styles.card}>
            <Text style={styles.cardTitle}>New Check-In</Text>

            {/* Lot Selection */}
            <View style={styles.section}>
              <Text style={styles.label}>Lot # *</Text>
              <TouchableOpacity
                style={styles.picker}
                onPress={() => setShowLotPicker(true)}
              >
                <Text style={styles.pickerText}>
                  {selectedLot ? (
                    selectedLot.lotCode
                      ? `${selectedLot.lotCode} - ${getLotDescription(selectedLot.lotCode)}`
                      : selectedLot.source || 'Unnamed Lot'
                  ) : (
                    'Select lot'
                  )}
                </Text>
              </TouchableOpacity>
              {selectedLot?.maxCapacity && selectedLot.currentCapacity !== undefined && (
                <Text style={styles.hint}>
                  Capacity: {selectedLot.currentCapacity}/{selectedLot.maxCapacity}
                </Text>
              )}
            </View>

            {/* Medication Name */}
            <View style={styles.section}>
              <Text style={styles.label}>Medication Name *</Text>
              {selectedMedication ? (
                <View style={styles.selectedMedicationCard}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.selectedMedicationName}>
                      {selectedMedication.medicationName}
                    </Text>
                    <Text style={styles.selectedMedicationDetails}>
                      {selectedMedication.strength}{selectedMedication.strengthUnit} - {selectedMedication.form}
                    </Text>
                    {selectedMedication.inInventory && (
                      <Badge variant="secondary" style={{ marginTop: 4 }}>
                        In Stock
                      </Badge>
                    )}
                  </View>
                  <Button variant="outline" onPress={handleClearMedication}>
                    Change
                  </Button>
                </View>
              ) : (
                <>
                  <TextInput
                    style={styles.input}
                    placeholder="Type to search medications..."
                    value={medicationName}
                    onChangeText={(text) => {
                      setMedicationName(text);
                      setShowDropdown(true);
                    }}
                  />
                  {searchLoading && (
                    <ActivityIndicator size="small" color="#2563eb" style={{ marginTop: 8 }} />
                  )}
                  {showDropdown && searchResults.length > 0 && (
                    <View style={styles.searchResults}>
                      <ScrollView style={{ maxHeight: 200 }}>
                        {searchResults.map((med, index) => (
                          <TouchableOpacity
                            key={index}
                            style={styles.searchResultItem}
                            onPress={() => handleSelectMedication(med)}
                          >
                            <View style={{ flex: 1 }}>
                              <Text style={styles.drugName}>{med.medicationName}</Text>
                              <Text style={styles.drugDetails}>
                                {med.strength}{med.strengthUnit} - {med.form}
                              </Text>
                            </View>
                            {med.inInventory && (
                              <Badge variant="secondary">In Stock</Badge>
                            )}
                          </TouchableOpacity>
                        ))}
                      </ScrollView>
                    </View>
                  )}
                </>
              )}
              <Text style={styles.hint}>Search existing medications or type a new name</Text>
            </View>

            {/* Quantity */}
            <View style={styles.section}>
              <Text style={styles.label}>Quantity *</Text>
              <TextInput
                style={styles.input}
                placeholder="1"
                keyboardType="numeric"
                value={quantity}
                onChangeText={setQuantity}
              />
              <Text style={styles.hint}>Each unit will receive its own unique QR code label</Text>
            </View>

            {/* Dosage */}
            <View style={styles.section}>
              <Text style={styles.label}>Dosage *</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., 500mg, 10mg/5ml"
                value={dosage}
                onChangeText={setDosage}
              />
            </View>

            {/* Expiration Date - Optional */}
            <View style={styles.section}>
              <Text style={styles.label}>Expiration Date (Optional)</Text>
              <TouchableOpacity
                style={styles.picker}
                onPress={() => setShowDatePicker(true)}
              >
                <Text style={styles.pickerText}>
                  {expiryDate ? expiryDate.toLocaleDateString() : 'Select date'}
                </Text>
              </TouchableOpacity>
              {showDatePicker && (
                <DateTimePicker
                  value={expiryDate || new Date()}
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

            {/* Manufacturer Lot Number - Optional */}
            <View style={styles.section}>
              <Text style={styles.label}>Medication Lot # (Optional)</Text>
              <TextInput
                style={styles.input}
                placeholder="From medication package"
                value={manufacturerLotNumber}
                onChangeText={setManufacturerLotNumber}
              />
              <Text style={styles.hint}>
                The manufacturer's lot number from the medication package label
              </Text>
            </View>

            {/* Submit */}
            <Button
              onPress={handleSubmit}
              disabled={!isFormValid() || creatingUnits}
              style={styles.submitButton}
            >
              {creatingUnits
                ? 'Creating...'
                : `Check In ${parseInt(quantity, 10) > 1 ? `${quantity} Units` : '1 Unit'}`}
            </Button>
          </Card>
        )}

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
                {/* Add New Lot Option */}
                <TouchableOpacity
                  style={[styles.modalItem, styles.addNewItem]}
                  onPress={() => {
                    setShowLotPicker(false);
                    setShowNewLotModal(true);
                  }}
                >
                  <Text style={styles.addNewText}>+ Add New Lot</Text>
                </TouchableOpacity>

                {lotsData?.getLots.map((lot: LotData) => (
                  <TouchableOpacity
                    key={lot.lotId}
                    style={styles.modalItem}
                    onPress={() => {
                      setSelectedLotId(lot.lotId);
                      setSelectedLot(lot);
                      setShowLotPicker(false);
                    }}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={styles.modalItemText}>
                        {lot.lotCode
                          ? `${lot.lotCode} - ${getLotDescription(lot.lotCode)}`
                          : lot.source || 'Unnamed Lot'}
                      </Text>
                      <Text style={styles.modalItemSubtext}>
                        {new Date(lot.dateCreated).toLocaleDateString()}
                        {lot.maxCapacity && ` • ${lot.currentCapacity}/${lot.maxCapacity}`}
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </ScrollView>
              <Button variant="outline" onPress={() => setShowLotPicker(false)}>
                Cancel
              </Button>
            </View>
          </View>
        </Modal>

        {/* New Lot Modal */}
        <Modal
          visible={showNewLotModal}
          transparent
          animationType="fade"
          onRequestClose={() => setShowNewLotModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Create New Lot</Text>
              <ScrollView style={styles.modalScroll}>
                {/* Drawer Letter */}
                <View style={styles.section}>
                  <Text style={styles.label}>Drawer Letter *</Text>
                  <TouchableOpacity
                    style={styles.picker}
                    onPress={() => setShowDrawerPicker(true)}
                  >
                    <Text style={styles.pickerText}>Drawer {newLotDrawer}</Text>
                  </TouchableOpacity>
                </View>

                {/* Side (L/R) */}
                <View style={styles.section}>
                  <Text style={styles.label}>
                    Side {requireLotLocation ? '*' : '(Optional)'}
                  </Text>
                  <View style={styles.buttonRow}>
                    <TouchableOpacity
                      style={[
                        styles.toggleButton,
                        newLotSide === 'L' && styles.toggleButtonActive,
                      ]}
                      onPress={() => setNewLotSide(newLotSide === 'L' ? '' : 'L')}
                    >
                      <Text
                        style={[
                          styles.toggleButtonText,
                          newLotSide === 'L' && styles.toggleButtonTextActive,
                        ]}
                      >
                        L - Left
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[
                        styles.toggleButton,
                        newLotSide === 'R' && styles.toggleButtonActive,
                      ]}
                      onPress={() => setNewLotSide(newLotSide === 'R' ? '' : 'R')}
                    >
                      <Text
                        style={[
                          styles.toggleButtonText,
                          newLotSide === 'R' && styles.toggleButtonTextActive,
                        ]}
                      >
                        R - Right
                      </Text>
                    </TouchableOpacity>
                  </View>
                  <Text style={styles.hint}>
                    Lot code: {newLotSide ? `${newLotDrawer}${newLotSide}` : newLotDrawer}
                  </Text>
                </View>

                {/* Storage Location */}
                <View style={styles.section}>
                  <Text style={styles.label}>Storage Location *</Text>
                  <TouchableOpacity
                    style={styles.picker}
                    onPress={() => setShowLocationPicker(true)}
                  >
                    <Text style={styles.pickerText}>
                      {newLotLocationId
                        ? locationsData?.getLocations.find(
                            (l: LocationData) => l.locationId === newLotLocationId
                          )?.name || 'Select location'
                        : 'Select location'}
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* Donation Source - Optional */}
                <View style={styles.section}>
                  <Text style={styles.label}>Donation Source (Optional)</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="e.g., CVS Pharmacy"
                    value={newLotSource}
                    onChangeText={setNewLotSource}
                  />
                </View>

                {/* Note - Optional */}
                <View style={styles.section}>
                  <Text style={styles.label}>Note (Optional)</Text>
                  <TextInput
                    style={[styles.input, styles.textArea]}
                    placeholder="Any additional notes"
                    multiline
                    numberOfLines={3}
                    value={newLotNote}
                    onChangeText={setNewLotNote}
                  />
                </View>
              </ScrollView>

              <View style={styles.buttonRow}>
                <Button
                  variant="outline"
                  onPress={() => setShowNewLotModal(false)}
                  style={{ flex: 1, marginRight: 8 }}
                >
                  Cancel
                </Button>
                <Button
                  onPress={handleCreateLot}
                  disabled={creatingLot}
                  style={{ flex: 1 }}
                >
                  {creatingLot ? 'Creating...' : 'Create Lot'}
                </Button>
              </View>
            </View>
          </View>
        </Modal>

        {/* Drawer Picker Modal */}
        <Modal
          visible={showDrawerPicker}
          transparent
          animationType="fade"
          onRequestClose={() => setShowDrawerPicker(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Select Drawer</Text>
              <ScrollView style={styles.modalScroll}>
                {Array.from({ length: 26 }, (_, i) => String.fromCharCode(65 + i)).map(
                  (letter) => (
                    <TouchableOpacity
                      key={letter}
                      style={styles.modalItem}
                      onPress={() => {
                        setNewLotDrawer(letter);
                        setShowDrawerPicker(false);
                      }}
                    >
                      <Text style={styles.modalItemText}>Drawer {letter}</Text>
                    </TouchableOpacity>
                  )
                )}
              </ScrollView>
              <Button variant="outline" onPress={() => setShowDrawerPicker(false)}>
                Cancel
              </Button>
            </View>
          </View>
        </Modal>

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
                      setNewLotLocationId(loc.locationId);
                      setShowLocationPicker(false);
                    }}
                  >
                    <Text style={styles.modalItemText}>
                      {loc.name} ({loc.temp.replace('_', ' ')})
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
              <Button variant="outline" onPress={() => setShowLocationPicker(false)}>
                Cancel
              </Button>
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
  successTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#10b981',
    marginBottom: 4,
  },
  successSubtitle: {
    fontSize: 16,
    color: '#6b7280',
  },
  alertCard: {
    backgroundColor: '#fef2f2',
    borderColor: '#fca5a5',
    marginBottom: 16,
  },
  alertText: {
    color: '#991b1b',
    fontSize: 14,
  },
  card: {
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 16,
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 16,
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
  hint: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
  },
  searchResults: {
    marginTop: 8,
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
  selectedMedicationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderWidth: 1,
    borderColor: '#93c5fd',
    borderRadius: 8,
    backgroundColor: '#eff6ff',
  },
  selectedMedicationName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
  },
  selectedMedicationDetails: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 2,
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
    marginRight: 8,
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
  submitButton: {
    marginTop: 16,
  },
  resetButton: {
    marginTop: 16,
  },
  unitCard: {
    flexDirection: 'row',
    padding: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    marginBottom: 12,
    backgroundColor: '#ffffff',
  },
  qrContainer: {
    padding: 8,
    backgroundColor: '#ffffff',
    borderRadius: 4,
    marginRight: 12,
  },
  unitInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  qrCodeText: {
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontSize: 11,
    color: '#6b7280',
    marginBottom: 4,
  },
  unitMedName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  unitMedDetails: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
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
    marginBottom: 16,
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
  modalItemSubtext: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
  addNewItem: {
    backgroundColor: '#eff6ff',
    borderBottomWidth: 0,
    marginBottom: 8,
    borderRadius: 8,
  },
  addNewText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2563eb',
  },
});
