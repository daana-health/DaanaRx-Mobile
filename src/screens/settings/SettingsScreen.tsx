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
  Clipboard,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { gql } from '@apollo/client';
import { useQuery, useMutation } from '@apollo/client/react';
import { useDispatch, useSelector } from 'react-redux';
import { logout, switchClinic } from '../../store/authSlice';
import { RootState } from '../../store';
import { Ionicons } from '@expo/vector-icons';
import { colors, borderRadius, fontSize, fontWeight, spacing, layout } from '../../lib/theme';
import Card from '../../components/ui/Card';
import { Alert } from '../../components/ui/Alert';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';

const GET_USER_CLINICS = gql`
  query GetUserClinics {
    getUserClinics {
      clinicId
      name
      primaryColor
      secondaryColor
      logoUrl
      createdAt
      userJoinedAt
    }
  }
`;

const GET_INVITATIONS = gql`
  query GetInvitations($clinicId: ID!) {
    getInvitations(clinicId: $clinicId) {
      invitationId
      email
      userRole
      status
      token
      invitedBy {
        userId
        username
      }
      createdAt
      expiresAt
      acceptedAt
    }
  }
`;

const GET_USERS = gql`
  query GetUsers($clinicId: ID!) {
    getUsers(clinicId: $clinicId) {
      userId
      username
      email
      userRole
      createdAt
    }
  }
`;

const SEND_INVITATION = gql`
  mutation SendInvitation($input: SendInvitationInput!) {
    sendInvitation(input: $input) {
      invitationId
      email
      userRole
      status
      token
    }
  }
`;

const RESEND_INVITATION = gql`
  mutation ResendInvitation($invitationId: ID!) {
    resendInvitation(invitationId: $invitationId) {
      invitationId
      status
    }
  }
`;

const CANCEL_INVITATION = gql`
  mutation CancelInvitation($invitationId: ID!) {
    cancelInvitation(invitationId: $invitationId)
  }
`;

const SWITCH_CLINIC = gql`
  mutation SwitchClinic($clinicId: ID!) {
    switchClinic(clinicId: $clinicId) {
      userId
      clinicId
    }
  }
`;

interface Clinic {
  clinicId: string;
  name: string;
  primaryColor?: string;
  secondaryColor?: string;
  logoUrl?: string;
  createdAt: string;
  userJoinedAt: string;
}

interface Invitation {
  invitationId: string;
  email: string;
  userRole: string;
  status: 'invited' | 'accepted' | 'expired';
  token: string;
  invitedBy: {
    userId: string;
    username: string;
  };
  createdAt: string;
  expiresAt: string;
  acceptedAt?: string;
}

interface User {
  userId: string;
  username: string;
  email: string;
  userRole: string;
  createdAt: string;
}

const ClinicCard = ({
  clinic,
  isActive,
  onSwitch,
}: {
  clinic: Clinic;
  isActive: boolean;
  onSwitch: () => void;
}) => {
  const joinedDate = new Date(clinic.userJoinedAt).toLocaleDateString();

  return (
    <Card style={[styles.clinicCard, isActive ? styles.clinicCardActive : undefined]}>
      <View style={styles.clinicCardContent}>
        <View style={styles.clinicCardLeft}>
          <View style={styles.clinicNameRow}>
            <Text style={styles.clinicName}>{clinic.name}</Text>
            {isActive && (
              <Badge variant="success" style={styles.activeBadge}>
                Active
              </Badge>
            )}
          </View>
          <Text style={styles.clinicDate}>Joined: {joinedDate}</Text>
        </View>
        {!isActive && (
          <Button title="Switch" size="sm" onPress={onSwitch} />
        )}
      </View>
    </Card>
  );
};

const InvitationCard = ({
  invitation,
  onResend,
  onCancel,
  onCopyLink,
}: {
  invitation: Invitation;
  onResend: () => void;
  onCancel: () => void;
  onCopyLink: () => void;
}) => {
  const sentDate = new Date(invitation.createdAt).toLocaleDateString();
  const expiryDate = new Date(invitation.expiresAt).toLocaleDateString();

  const getStatusColor = (status: string): 'default' | 'success' | 'destructive' => {
    switch (status) {
      case 'accepted':
        return 'success';
      case 'expired':
        return 'destructive';
      default:
        return 'default';
    }
  };

  return (
    <Card style={styles.invitationCard}>
      <View style={styles.invitationHeader}>
        <View style={styles.invitationHeaderLeft}>
          <Text style={styles.invitationEmail}>{invitation.email}</Text>
          <View style={styles.invitationMeta}>
            <Badge variant="outline" style={styles.roleBadge}>
              {invitation.userRole}
            </Badge>
            <Badge variant={getStatusColor(invitation.status)} style={styles.statusBadge}>
              {invitation.status}
            </Badge>
          </View>
        </View>
      </View>
      <View style={styles.invitationDetails}>
        <Text style={styles.invitationDetailText}>
          Invited by {invitation.invitedBy.username}
        </Text>
        <Text style={styles.invitationDetailText}>Sent: {sentDate}</Text>
        <Text style={styles.invitationDetailText}>Expires: {expiryDate}</Text>
      </View>
      <View style={styles.invitationActions}>
        <TouchableOpacity onPress={onCopyLink} style={styles.invitationActionButton}>
          <Ionicons name="copy" size={16} color={colors.primary} />
          <Text style={styles.invitationActionText}>Copy Link</Text>
        </TouchableOpacity>
        {invitation.status === 'invited' && (
          <>
            <TouchableOpacity onPress={onResend} style={styles.invitationActionButton}>
              <Ionicons name="send" size={16} color={colors.primary} />
              <Text style={styles.invitationActionText}>Resend</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={onCancel} style={styles.invitationActionButton}>
              <Ionicons name="close-circle" size={16} color={colors.destructive} />
              <Text style={[styles.invitationActionText, { color: colors.destructive }]}>Cancel</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </Card>
  );
};

const UserCard = ({ user }: { user: User }) => {
  const joinedDate = new Date(user.createdAt).toLocaleDateString();

  return (
    <Card style={styles.userCard}>
      <View style={styles.userCardContent}>
        <View style={styles.userCardLeft}>
          <Text style={styles.userName}>{user.username}</Text>
          <Text style={styles.userEmail}>{user.email}</Text>
          <View style={styles.userMeta}>
            <Badge variant="outline" style={styles.roleBadge}>
              {user.userRole}
            </Badge>
            <Text style={styles.userDate}>Joined: {joinedDate}</Text>
          </View>
        </View>
      </View>
    </Card>
  );
};

const SendInvitationModal = ({
  visible,
  onClose,
  onSubmit,
}: {
  visible: boolean;
  onClose: () => void;
  onSubmit: (email: string, role: string) => void;
}) => {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'admin' | 'employee'>('employee');

  const handleSubmit = () => {
    if (!email.trim()) {
      RNAlert.alert('Validation Error', 'Email is required');
      return;
    }
    if (!email.includes('@')) {
      RNAlert.alert('Validation Error', 'Please enter a valid email address');
      return;
    }
    onSubmit(email.trim(), role);
    setEmail('');
    setRole('employee');
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Send Invitation</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color={colors.foreground} />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.modalContent}>
          <View style={styles.formGroup}>
            <Text style={styles.label}>Email Address</Text>
            <TextInput
              style={styles.input}
              placeholder="user@example.com"
              placeholderTextColor={colors.mutedForeground}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>User Role</Text>
            <View style={styles.radioGroup}>
              <TouchableOpacity
                style={[styles.radioOption, role === 'employee' && styles.radioOptionActive]}
                onPress={() => setRole('employee')}
              >
                <View style={styles.radioCircle}>
                  {role === 'employee' && <View style={styles.radioCircleInner} />}
                </View>
                <View style={styles.radioContent}>
                  <Text style={styles.radioLabel}>Employee</Text>
                  <Text style={styles.radioDescription}>Can check in/out medications</Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.radioOption, role === 'admin' && styles.radioOptionActive]}
                onPress={() => setRole('admin')}
              >
                <View style={styles.radioCircle}>
                  {role === 'admin' && <View style={styles.radioCircleInner} />}
                </View>
                <View style={styles.radioContent}>
                  <Text style={styles.radioLabel}>Admin</Text>
                  <Text style={styles.radioDescription}>Can manage locations and settings</Text>
                </View>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.modalActions}>
            <Button title="Cancel" variant="outline" onPress={onClose} style={styles.modalButton} />
            <Button title="Send Invitation" onPress={handleSubmit} style={styles.modalButton} />
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
};

export default function SettingsScreen() {
  const dispatch = useDispatch();
  const user = useSelector((state: RootState) => state.auth.user);
  const clinic = useSelector((state: RootState) => state.auth.clinic);
  const isSuperadmin = user?.userRole === 'superadmin';

  const [showInvitationModal, setShowInvitationModal] = useState(false);

  const { data: clinicsData, loading: clinicsLoading, refetch: refetchClinics } = useQuery(GET_USER_CLINICS);

  const { data: invitationsData, loading: invitationsLoading, refetch: refetchInvitations } = useQuery(
    GET_INVITATIONS,
    {
      variables: { clinicId: clinic?.clinicId },
      skip: !isSuperadmin || !clinic?.clinicId,
    }
  );

  const { data: usersData, loading: usersLoading, refetch: refetchUsers } = useQuery(GET_USERS, {
    variables: { clinicId: clinic?.clinicId },
    skip: !isSuperadmin || !clinic?.clinicId,
  });

  const [sendInvitation, { loading: sendingInvitation }] = useMutation(SEND_INVITATION, {
    onCompleted: () => {
      setShowInvitationModal(false);
      refetchInvitations();
      RNAlert.alert('Success', 'Invitation sent successfully');
    },
    onError: (error) => {
      RNAlert.alert('Error', error.message);
    },
  });

  const [resendInvitation] = useMutation(RESEND_INVITATION, {
    onCompleted: () => {
      RNAlert.alert('Success', 'Invitation resent successfully');
    },
    onError: (error) => {
      RNAlert.alert('Error', error.message);
    },
  });

  const [cancelInvitation] = useMutation(CANCEL_INVITATION, {
    refetchQueries: ['GetInvitations'],
    onCompleted: () => {
      RNAlert.alert('Success', 'Invitation cancelled successfully');
    },
    onError: (error) => {
      RNAlert.alert('Error', error.message);
    },
  });

  const [switchClinicMutation] = useMutation(SWITCH_CLINIC, {
    onCompleted: (data) => {
      const newClinic = clinics.find((c) => c.clinicId === data.switchClinic.clinicId);
      if (newClinic) {
        dispatch(switchClinic(newClinic));
        RNAlert.alert('Success', `Switched to ${newClinic.name}`);
      }
    },
    onError: (error) => {
      RNAlert.alert('Error', error.message);
    },
  });

  const clinics: Clinic[] = clinicsData?.getUserClinics || [];
  const invitations: Invitation[] = invitationsData?.getInvitations || [];
  const users: User[] = usersData?.getUsers || [];

  const handleLogout = () => {
    RNAlert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: () => dispatch(logout()),
      },
    ]);
  };

  const handleSendInvitation = (email: string, role: string) => {
    sendInvitation({
      variables: {
        input: {
          email,
          userRole: role,
          clinicId: clinic?.clinicId,
        },
      },
    });
  };

  const handleResendInvitation = (invitationId: string) => {
    resendInvitation({ variables: { invitationId } });
  };

  const handleCancelInvitation = (invitation: Invitation) => {
    RNAlert.alert('Cancel Invitation', `Cancel invitation for ${invitation.email}?`, [
      { text: 'No', style: 'cancel' },
      {
        text: 'Yes',
        style: 'destructive',
        onPress: () => {
          cancelInvitation({ variables: { invitationId: invitation.invitationId } });
        },
      },
    ]);
  };

  const handleCopyInvitationLink = (invitation: Invitation) => {
    const invitationUrl = `https://daanarx.com/accept-invitation?token=${invitation.token}`;
    Clipboard.setString(invitationUrl);
    RNAlert.alert('Success', 'Invitation link copied to clipboard');
  };

  const handleSwitchClinic = (clinicId: string) => {
    switchClinicMutation({ variables: { clinicId } });
  };

  const handleRefresh = () => {
    refetchClinics();
    if (isSuperadmin) {
      refetchInvitations();
      refetchUsers();
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={clinicsLoading || invitationsLoading || usersLoading}
            onRefresh={handleRefresh}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Settings</Text>
          <Text style={styles.subtitle}>Manage your account and preferences</Text>
        </View>

        {/* User Profile Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Profile</Text>
          <Card style={styles.profileCard}>
            <View style={styles.profileRow}>
              <Text style={styles.profileLabel}>Username</Text>
              <Text style={styles.profileValue}>{user?.username}</Text>
            </View>
            <View style={styles.profileRow}>
              <Text style={styles.profileLabel}>Email</Text>
              <Text style={styles.profileValue}>{user?.email}</Text>
            </View>
            <View style={styles.profileRow}>
              <Text style={styles.profileLabel}>Role</Text>
              <Badge variant="outline">{user?.userRole}</Badge>
            </View>
            <View style={styles.profileRow}>
              <Text style={styles.profileLabel}>Current Clinic</Text>
              <Text style={styles.profileValue}>{clinic?.name}</Text>
            </View>
          </Card>
        </View>

        {/* Clinics Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>My Clinics</Text>
          {clinicsLoading ? (
            <ActivityIndicator size="large" color={colors.primary} />
          ) : (
            <View style={styles.clinicsList}>
              {clinics.map((c) => (
                <ClinicCard
                  key={c.clinicId}
                  clinic={c}
                  isActive={c.clinicId === clinic?.clinicId}
                  onSwitch={() => handleSwitchClinic(c.clinicId)}
                />
              ))}
            </View>
          )}
        </View>

        {/* Invitations Section (Superadmin only) */}
        {isSuperadmin && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>User Invitations</Text>
              <Button
                title="Send Invitation"
                size="sm"
                icon={<Ionicons name="mail" size={16} color={colors.primaryForeground} />}
                iconPosition="left"
                onPress={() => setShowInvitationModal(true)}
              />
            </View>
            {invitationsLoading ? (
              <ActivityIndicator size="large" color={colors.primary} />
            ) : invitations.length === 0 ? (
              <Card style={styles.emptyCard}>
                <Ionicons name="mail-outline" size={48} color={colors.mutedForeground} />
                <Text style={styles.emptyTitle}>No invitations</Text>
                <Text style={styles.emptyText}>Send invitations to add users to your clinic</Text>
              </Card>
            ) : (
              <View style={styles.invitationsList}>
                {invitations.map((invitation) => (
                  <InvitationCard
                    key={invitation.invitationId}
                    invitation={invitation}
                    onResend={() => handleResendInvitation(invitation.invitationId)}
                    onCancel={() => handleCancelInvitation(invitation)}
                    onCopyLink={() => handleCopyInvitationLink(invitation)}
                  />
                ))}
              </View>
            )}
          </View>
        )}

        {/* Active Users Section (Superadmin only) */}
        {isSuperadmin && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Active Users</Text>
            {usersLoading ? (
              <ActivityIndicator size="large" color={colors.primary} />
            ) : (
              <View style={styles.usersList}>
                {users.map((u) => (
                  <UserCard key={u.userId} user={u} />
                ))}
              </View>
            )}
          </View>
        )}

        {/* About Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About</Text>
          <Card style={styles.aboutCard}>
            <Text style={styles.aboutText}>DaanaRx Mobile v1.0.0</Text>
            <Text style={styles.aboutText}>HIPAA-Compliant Medication Tracking</Text>
          </Card>
        </View>

        {/* Logout Button */}
        <View style={styles.section}>
          <Button
            title="Logout"
            variant="destructive"
            icon={<Ionicons name="log-out" size={20} color={colors.destructiveForeground} />}
            iconPosition="left"
            onPress={handleLogout}
          />
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* Send Invitation Modal */}
      <SendInvitationModal
        visible={showInvitationModal}
        onClose={() => setShowInvitationModal(false)}
        onSubmit={handleSendInvitation}
      />

      {/* Loading Overlay */}
      {sendingInvitation && (
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
  section: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.foreground,
    marginBottom: spacing.md,
  },
  profileCard: {
    padding: spacing.lg,
  },
  profileRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  profileLabel: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: colors.mutedForeground,
  },
  profileValue: {
    fontSize: fontSize.sm,
    color: colors.foreground,
  },
  clinicsList: {
    gap: spacing.md,
  },
  clinicCard: {
    padding: spacing.md,
  },
  clinicCardActive: {
    borderWidth: 2,
    borderColor: colors.primary,
  },
  clinicCardContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  clinicCardLeft: {
    flex: 1,
    marginRight: spacing.md,
  },
  clinicNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
    gap: spacing.sm,
  },
  clinicName: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
    color: colors.foreground,
  },
  activeBadge: {
    paddingVertical: 2,
    paddingHorizontal: spacing.xs,
  },
  clinicDate: {
    fontSize: fontSize.xs,
    color: colors.mutedForeground,
  },
  invitationsList: {
    gap: spacing.md,
  },
  invitationCard: {
    padding: spacing.md,
  },
  invitationHeader: {
    marginBottom: spacing.sm,
  },
  invitationHeaderLeft: {
    flex: 1,
  },
  invitationEmail: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
    color: colors.foreground,
    marginBottom: spacing.xs,
  },
  invitationMeta: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  roleBadge: {
    paddingVertical: 2,
    paddingHorizontal: spacing.xs,
  },
  statusBadge: {
    paddingVertical: 2,
    paddingHorizontal: spacing.xs,
  },
  invitationDetails: {
    marginBottom: spacing.sm,
  },
  invitationDetailText: {
    fontSize: fontSize.xs,
    color: colors.mutedForeground,
    marginBottom: 2,
  },
  invitationActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  invitationActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: borderRadius.md,
    backgroundColor: colors.muted,
    gap: spacing.xs,
  },
  invitationActionText: {
    fontSize: fontSize.xs,
    color: colors.primary,
    fontWeight: fontWeight.medium,
  },
  usersList: {
    gap: spacing.md,
  },
  userCard: {
    padding: spacing.md,
  },
  userCardContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  userCardLeft: {
    flex: 1,
  },
  userName: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
    color: colors.foreground,
    marginBottom: spacing.xs,
  },
  userEmail: {
    fontSize: fontSize.sm,
    color: colors.mutedForeground,
    marginBottom: spacing.xs,
  },
  userMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  userDate: {
    fontSize: fontSize.xs,
    color: colors.mutedForeground,
  },
  aboutCard: {
    padding: spacing.lg,
  },
  aboutText: {
    fontSize: fontSize.sm,
    color: colors.mutedForeground,
    marginBottom: spacing.xs,
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
  radioLabel: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.medium,
    color: colors.foreground,
    marginBottom: spacing.xs,
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
});
