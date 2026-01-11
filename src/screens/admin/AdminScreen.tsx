import React, { useState } from 'react';
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
import { gql } from '@apollo/client';
import { useQuery, useMutation } from '@apollo/client/react';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import { Ionicons } from '@expo/vector-icons';
import { colors, borderRadius, fontSize, fontWeight, spacing, layout } from '../../lib/theme';
import Card from '../../components/ui/Card';
import { Alert } from '../../components/ui/Alert';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';

const GET_LOCATIONS = gql`
  query GetLocations($clinicId: ID!) {
    getLocations(clinicId: $clinicId) {
      locationId
      name
      temp
      createdAt
    }
  }
`;

const CREATE_LOCATION = gql`
  mutation CreateLocation($input: CreateLocationInput!) {
    createLocation(input: $input) {
      locationId
      name
      temp
      createdAt
    }
  }
`;

const UPDATE_LOCATION = gql`
  mutation UpdateLocation($input: UpdateLocationInput!) {
    updateLocation(input: $input) {
      locationId
      name
      temp
    }
  }
`;

const DELETE_LOCATION = gql`
  mutation DeleteLocation($locationId: ID!) {
    deleteLocation(locationId: $locationId)
  }
`;

interface Location {
  locationId: string;
  name: string;
  temp: 'fridge' | 'room_temp';
  createdAt: string;
}

type TempType = 'fridge' | 'room_temp';

const LocationCard = ({
  location,
  onEdit,
  onDelete,
}: {
  location: Location;
  onEdit: () => void;
  onDelete: () => void;
}) => {
  const formattedDate = new Date(location.createdAt).toLocaleDateString();

  const getTempLabel = (temp: TempType): string => {
    return temp === 'fridge' ? 'Refrigerated' : 'Room Temperature';
  };

  const getTempIcon = (temp: TempType): string => {
    return temp === 'fridge' ? 'snow' : 'thermometer';
  };

  return (
    <Card style={styles.locationCard}>
      <View style={styles.locationCardHeader}>
        <View style={styles.locationCardLeft}>
          <Text style={styles.locationName}>{location.name}</Text>
          <View style={styles.locationMeta}>
            <Badge variant="outline" style={styles.tempBadge}>
              <Ionicons name={getTempIcon(location.temp) as any} size={12} color={colors.foreground} />{' '}
              {getTempLabel(location.temp)}
            </Badge>
          </View>
          <Text style={styles.locationDate}>Created: {formattedDate}</Text>
        </View>
        <View style={styles.locationActions}>
          <TouchableOpacity onPress={onEdit} style={styles.actionButton}>
            <Ionicons name="pencil" size={20} color={colors.primary} />
          </TouchableOpacity>
          <TouchableOpacity onPress={onDelete} style={styles.actionButton}>
            <Ionicons name="trash" size={20} color={colors.destructive} />
          </TouchableOpacity>
        </View>
      </View>
    </Card>
  );
};

const CreateLocationModal = ({
  visible,
  onClose,
  onSubmit,
  editingLocation,
}: {
  visible: boolean;
  onClose: () => void;
  onSubmit: (name: string, temp: TempType) => void;
  editingLocation?: Location | null;
}) => {
  const [name, setName] = useState(editingLocation?.name || '');
  const [temp, setTemp] = useState<TempType>(editingLocation?.temp || 'room_temp');

  React.useEffect(() => {
    if (editingLocation) {
      setName(editingLocation.name);
      setTemp(editingLocation.temp);
    } else {
      setName('');
      setTemp('room_temp');
    }
  }, [editingLocation, visible]);

  const handleSubmit = () => {
    if (!name.trim()) {
      RNAlert.alert('Validation Error', 'Location name is required');
      return;
    }
    onSubmit(name.trim(), temp);
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>{editingLocation ? 'Edit Location' : 'Create Location'}</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color={colors.foreground} />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.modalContent}>
          <View style={styles.formGroup}>
            <Text style={styles.label}>Location Name</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., Main Storage, Emergency Kit"
              placeholderTextColor={colors.mutedForeground}
              value={name}
              onChangeText={setName}
              autoCapitalize="words"
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Temperature Requirement</Text>
            <View style={styles.radioGroup}>
              <TouchableOpacity
                style={[styles.radioOption, temp === 'room_temp' && styles.radioOptionActive]}
                onPress={() => setTemp('room_temp')}
              >
                <View style={styles.radioCircle}>
                  {temp === 'room_temp' && <View style={styles.radioCircleInner} />}
                </View>
                <View style={styles.radioContent}>
                  <View style={styles.radioLabelRow}>
                    <Ionicons name="thermometer" size={20} color={colors.foreground} />
                    <Text style={styles.radioLabel}>Room Temperature</Text>
                  </View>
                  <Text style={styles.radioDescription}>Standard storage conditions</Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.radioOption, temp === 'fridge' && styles.radioOptionActive]}
                onPress={() => setTemp('fridge')}
              >
                <View style={styles.radioCircle}>
                  {temp === 'fridge' && <View style={styles.radioCircleInner} />}
                </View>
                <View style={styles.radioContent}>
                  <View style={styles.radioLabelRow}>
                    <Ionicons name="snow" size={20} color={colors.foreground} />
                    <Text style={styles.radioLabel}>Refrigerated</Text>
                  </View>
                  <Text style={styles.radioDescription}>Cold storage (2-8°C)</Text>
                </View>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.modalActions}>
            <Button title="Cancel" variant="outline" onPress={onClose} style={styles.modalButton} />
            <Button
              title={editingLocation ? 'Update' : 'Create'}
              onPress={handleSubmit}
              style={styles.modalButton}
            />
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
};

export default function AdminScreen() {
  const clinic = useSelector((state: RootState) => state.auth.clinic);
  const user = useSelector((state: RootState) => state.auth.user);
  const userRole = user?.userRole || 'employee';
  const isAdmin = userRole === 'admin' || userRole === 'superadmin';

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingLocation, setEditingLocation] = useState<Location | null>(null);

  const { data, loading, error, refetch } = useQuery(GET_LOCATIONS, {
    variables: {
      clinicId: clinic?.clinicId,
    },
    skip: !clinic?.clinicId,
  });

  const [createLocation, { loading: creating }] = useMutation(CREATE_LOCATION, {
    refetchQueries: ['GetLocations', 'GetDashboardStats'],
    onCompleted: () => {
      setShowCreateModal(false);
      RNAlert.alert('Success', 'Location created successfully');
    },
    onError: (error) => {
      RNAlert.alert('Error', error.message);
    },
  });

  const [updateLocation, { loading: updating }] = useMutation(UPDATE_LOCATION, {
    refetchQueries: ['GetLocations'],
    onCompleted: () => {
      setEditingLocation(null);
      setShowCreateModal(false);
      RNAlert.alert('Success', 'Location updated successfully');
    },
    onError: (error) => {
      RNAlert.alert('Error', error.message);
    },
  });

  const [deleteLocation, { loading: deleting }] = useMutation(DELETE_LOCATION, {
    refetchQueries: ['GetLocations', 'GetDashboardStats'],
    onCompleted: () => {
      RNAlert.alert('Success', 'Location deleted successfully');
    },
    onError: (error) => {
      RNAlert.alert('Error', error.message);
    },
  });

  const locations: Location[] = data?.getLocations || [];

  const handleCreateLocation = (name: string, temp: TempType) => {
    if (editingLocation) {
      updateLocation({
        variables: {
          input: {
            locationId: editingLocation.locationId,
            name,
            temp,
          },
        },
      });
    } else {
      createLocation({
        variables: {
          input: {
            name,
            temp,
            clinicId: clinic?.clinicId,
          },
        },
      });
    }
  };

  const handleEditLocation = (location: Location) => {
    setEditingLocation(location);
    setShowCreateModal(true);
  };

  const handleDeleteLocation = (location: Location) => {
    RNAlert.alert(
      'Delete Location',
      `Are you sure you want to delete "${location.name}"? This action cannot be undone.`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            deleteLocation({
              variables: {
                locationId: location.locationId,
              },
            });
          },
        },
      ]
    );
  };

  const handleRefresh = () => {
    refetch();
  };

  if (!isAdmin) {
    return (
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <View style={styles.unauthorizedContainer}>
          <Ionicons name="lock-closed" size={64} color={colors.mutedForeground} />
          <Text style={styles.unauthorizedTitle}>Access Denied</Text>
          <Text style={styles.unauthorizedText}>
            You need administrator privileges to access this page.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!clinic) {
    return (
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <Alert variant="destructive" title="No Clinic Selected" message="Please select a clinic to manage settings." />
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
          <View style={styles.headerTop}>
            <Ionicons name="settings" size={32} color={colors.primary} />
            <Text style={styles.title}>Admin</Text>
          </View>
          <Text style={styles.subtitle}>Manage storage locations and clinic settings</Text>
        </View>

        {/* Create Location Button */}
        <View style={styles.actionsContainer}>
          <Button
            title="Create Location"
            icon={<Ionicons name="add" size={20} color={colors.primaryForeground} />}
            iconPosition="left"
            onPress={() => {
              setEditingLocation(null);
              setShowCreateModal(true);
            }}
            style={styles.createButton}
          />
        </View>

        {/* Info Alert */}
        <Alert
          variant="default"
          icon="information-circle"
          style={styles.infoAlert}
        >
          Storage locations are used to organize your medication inventory by temperature requirements.
        </Alert>

        {/* Locations Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Storage Locations</Text>

          {/* Error State */}
          {error && <Alert variant="destructive" title="Error Loading Locations" message={error.message} />}

          {/* Loading State */}
          {loading && locations.length === 0 && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.primary} />
            </View>
          )}

          {/* Empty State */}
          {!loading && locations.length === 0 && !error && (
            <Card style={styles.emptyCard}>
              <Ionicons name="location-outline" size={48} color={colors.mutedForeground} />
              <Text style={styles.emptyTitle}>No locations yet</Text>
              <Text style={styles.emptyText}>Create your first storage location to get started</Text>
            </Card>
          )}

          {/* Locations List */}
          {locations.length > 0 && (
            <View style={styles.locationsList}>
              {locations.map((location) => (
                <LocationCard
                  key={location.locationId}
                  location={location}
                  onEdit={() => handleEditLocation(location)}
                  onDelete={() => handleDeleteLocation(location)}
                />
              ))}
            </View>
          )}

          {/* Summary */}
          {locations.length > 0 && (
            <View style={styles.summary}>
              <Text style={styles.summaryText}>
                Total Locations: {locations.length} •{' '}
                {locations.filter((l) => l.temp === 'fridge').length} Refrigerated •{' '}
                {locations.filter((l) => l.temp === 'room_temp').length} Room Temperature
              </Text>
            </View>
          )}
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* Create/Edit Location Modal */}
      <CreateLocationModal
        visible={showCreateModal}
        onClose={() => {
          setShowCreateModal(false);
          setEditingLocation(null);
        }}
        onSubmit={handleCreateLocation}
        editingLocation={editingLocation}
      />

      {/* Loading Overlay */}
      {(creating || updating || deleting) && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      )}
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
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
    gap: spacing.sm,
  },
  title: {
    fontSize: fontSize['2xl'],
    fontWeight: fontWeight.bold,
    color: colors.foreground,
  },
  subtitle: {
    fontSize: fontSize.sm,
    color: colors.mutedForeground,
  },
  actionsContainer: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  createButton: {
    width: '100%',
  },
  infoAlert: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  section: {
    paddingHorizontal: spacing.lg,
  },
  sectionTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.foreground,
    marginBottom: spacing.md,
  },
  loadingContainer: {
    paddingVertical: spacing['2xl'],
    alignItems: 'center',
  },
  emptyCard: {
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
  locationsList: {
    gap: spacing.md,
  },
  locationCard: {
    padding: spacing.md,
  },
  locationCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  locationCardLeft: {
    flex: 1,
    marginRight: spacing.md,
  },
  locationName: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
    color: colors.foreground,
    marginBottom: spacing.sm,
  },
  locationMeta: {
    marginBottom: spacing.xs,
  },
  tempBadge: {
    alignSelf: 'flex-start',
  },
  locationDate: {
    fontSize: fontSize.xs,
    color: colors.mutedForeground,
  },
  locationActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  actionButton: {
    padding: spacing.sm,
    borderRadius: borderRadius.md,
    backgroundColor: colors.muted,
  },
  summary: {
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  summaryText: {
    fontSize: fontSize.sm,
    color: colors.mutedForeground,
    textAlign: 'center',
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
    paddingTop: spacing.lg,
  },
  formGroup: {
    marginBottom: spacing.lg,
  },
  label: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: colors.foreground,
    marginBottom: spacing.sm,
  },
  input: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: fontSize.base,
    color: colors.foreground,
    minHeight: 48,
  },
  radioGroup: {
    gap: spacing.sm,
  },
  radioOption: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.card,
  },
  radioOptionActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryForeground,
  },
  radioCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.border,
    marginRight: spacing.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioCircleInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.primary,
  },
  radioContent: {
    flex: 1,
  },
  radioLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.xs,
  },
  radioLabel: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.medium,
    color: colors.foreground,
  },
  radioDescription: {
    fontSize: fontSize.sm,
    color: colors.mutedForeground,
  },
  modalActions: {
    flexDirection: 'row',
    gap: spacing.md,
    paddingVertical: spacing.lg,
  },
  modalButton: {
    flex: 1,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Unauthorized State
  unauthorizedContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  unauthorizedTitle: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.foreground,
    marginTop: spacing.md,
    marginBottom: spacing.xs,
  },
  unauthorizedText: {
    fontSize: fontSize.base,
    color: colors.mutedForeground,
    textAlign: 'center',
  },
});
