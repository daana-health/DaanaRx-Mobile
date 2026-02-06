import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { gql } from '@apollo/client';
import { useQuery } from '@apollo/client/react';
import { useSelector } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import type { RootState } from '../store';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import { colors, fontSize, fontWeight, spacing, layout, borderRadius } from '../lib/theme';
import type { NavigationProp } from '@react-navigation/native';

const GET_DASHBOARD_STATS = gql`
  query GetDashboardStats($clinicId: ID) {
    getDashboardStats(clinicId: $clinicId) {
      totalUnits
      unitsExpiringSoon
      recentCheckIns
      recentCheckOuts
      lowStockAlerts
    }
  }
`;

interface DashboardStats {
  totalUnits: number;
  unitsExpiringSoon: number;
  recentCheckIns: number;
  recentCheckOuts: number;
  lowStockAlerts: number;
}

interface StatCardProps {
  title: string;
  value: number;
  icon: string;
  color: string;
  variant?: 'default' | 'warning' | 'danger';
}

function StatCard({ title, value, icon, color, variant = 'default' }: StatCardProps) {
  const getColorStyle = () => {
    switch (color) {
      case 'blue':
        return styles.iconBlue;
      case 'orange':
        return styles.iconOrange;
      case 'red':
        return styles.iconRed;
      case 'green':
        return styles.iconGreen;
      case 'teal':
        return styles.iconTeal;
      default:
        return styles.iconBlue;
    }
  };

  return (
    <Card style={styles.statCard}>
      <View style={styles.statHeader}>
        <Text style={styles.statTitle}>{title}</Text>
        <View style={[styles.iconContainer, getColorStyle()]}>
          <Ionicons name={icon as any} size={20} color="#ffffff" />
        </View>
      </View>
      <Text style={styles.statValue}>{value.toLocaleString()}</Text>
      {variant === 'warning' && value > 0 && (
        <Badge variant="warning" style={styles.statBadge}>
          <Text style={styles.badgeText}>Needs attention</Text>
        </Badge>
      )}
      {variant === 'danger' && value > 0 && (
        <Badge variant="destructive" style={styles.statBadge}>
          <Text style={styles.badgeText}>Action required</Text>
        </Badge>
      )}
    </Card>
  );
}

interface QuickActionCardProps {
  title: string;
  description: string;
  icon: string;
  color: string;
  onPress: () => void;
}

function QuickActionCard({ title, description, icon, color, onPress }: QuickActionCardProps) {
  const getColorStyle = () => {
    switch (color) {
      case 'blue':
        return styles.actionBlue;
      case 'green':
        return styles.actionGreen;
      case 'violet':
        return styles.actionViolet;
      case 'teal':
        return styles.actionTeal;
      case 'indigo':
        return styles.actionIndigo;
      default:
        return styles.actionBlue;
    }
  };

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
      <Card style={styles.actionCard}>
        <View style={styles.actionHeader}>
          <View style={[styles.actionIconContainer, getColorStyle()]}>
            <Ionicons name={icon as any} size={24} color="#2563eb" />
          </View>
          <Ionicons name="arrow-forward" size={20} color="#9ca3af" />
        </View>
        <Text style={styles.actionTitle}>{title}</Text>
        <Text style={styles.actionDescription}>{description}</Text>
      </Card>
    </TouchableOpacity>
  );
}

export default function DashboardScreen() {
  const navigation = useNavigation<NavigationProp<any>>();
  const clinicId = useSelector((state: RootState) => state.auth.clinic?.clinicId);
  const { data, loading, error } = useQuery(GET_DASHBOARD_STATS, {
    variables: { clinicId },
    fetchPolicy: 'network-only',
  });

  const stats: DashboardStats | null = data?.getDashboardStats || null;

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.title}>Dashboard</Text>
            <Text style={styles.subtitle}>Overview of your clinic's medication inventory</Text>
          </View>
          <TouchableOpacity
            style={styles.settingsButton}
            onPress={() => navigation.navigate('Settings')}
            activeOpacity={0.7}
          >
            <Ionicons name="settings-outline" size={24} color={colors.foreground} />
          </TouchableOpacity>
        </View>

        {/* Stats Grid */}
        {loading && !stats ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#2563eb" />
          </View>
        ) : error ? (
          <Card style={styles.errorCard}>
            <View style={styles.errorContent}>
              <Ionicons name="alert-circle" size={48} color="#dc2626" />
              <Text style={styles.errorTitle}>Error loading dashboard</Text>
              <Text style={styles.errorMessage}>{error.message}</Text>
            </View>
          </Card>
        ) : stats ? (
          <>
            <View style={styles.statsGrid}>
              <StatCard
                title="Units"
                value={stats.totalUnits}
                icon="cube-outline"
                color="blue"
              />
              <StatCard
                title="Expiring"
                value={stats.unitsExpiringSoon}
                icon="warning-outline"
                color="orange"
                variant="warning"
              />
              <StatCard
                title="Low Stock"
                value={stats.lowStockAlerts}
                icon="alert-circle-outline"
                color="red"
                variant="danger"
              />
              <StatCard
                title="Check-Ins"
                value={stats.recentCheckIns}
                icon="trending-up-outline"
                color="green"
              />
              <StatCard
                title="Check-Outs"
                value={stats.recentCheckOuts}
                icon="trending-down-outline"
                color="teal"
              />
            </View>

            {/* Quick Actions */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Quick Actions</Text>
              <Text style={styles.sectionSubtitle}>Common tasks and workflows</Text>

              <View style={styles.actionsGrid}>
                <QuickActionCard
                  title="Check In Medications"
                  description="Add new medications to inventory"
                  icon="add-circle-outline"
                  color="blue"
                  onPress={() => navigation.navigate('CheckIn' as never)}
                />
                <QuickActionCard
                  title="Check Out Medications"
                  description="Dispense medications to patients"
                  icon="remove-circle-outline"
                  color="green"
                  onPress={() => navigation.navigate('CheckOut' as never)}
                />
                <QuickActionCard
                  title="Scan QR Code"
                  description="Quick lookup and actions"
                  icon="qr-code-outline"
                  color="violet"
                  onPress={() => navigation.navigate('Scan' as never)}
                />
                <QuickActionCard
                  title="View Inventory"
                  description="Browse all medications"
                  icon="grid-outline"
                  color="teal"
                  onPress={() => navigation.navigate('Inventory' as never)}
                />
                <QuickActionCard
                  title="Activity Logs"
                  description="View transaction history"
                  icon="clipboard-outline"
                  color="indigo"
                  onPress={() => navigation.navigate('Logs' as never)}
                />
              </View>
            </View>

            {/* Alerts Section */}
            {(stats.unitsExpiringSoon > 0 || stats.lowStockAlerts > 0) && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Alerts</Text>
                <View style={styles.alertsGrid}>
                  {stats.unitsExpiringSoon > 0 && (
                    <Card style={styles.warningAlert}>
                      <View style={styles.alertHeader}>
                        <Ionicons name="warning-outline" size={24} color="#f59e0b" />
                      </View>
                      <Text style={styles.alertTitle}>
                        {stats.unitsExpiringSoon} unit(s) expiring soon
                      </Text>
                      <TouchableOpacity
                        style={styles.alertButton}
                        onPress={() => navigation.navigate('Inventory' as never)}
                      >
                        <Text style={styles.alertButtonText}>View in Inventory</Text>
                      </TouchableOpacity>
                    </Card>
                  )}
                  {stats.lowStockAlerts > 0 && (
                    <Card style={styles.dangerAlert}>
                      <View style={styles.alertHeader}>
                        <Ionicons name="alert-circle-outline" size={24} color="#dc2626" />
                      </View>
                      <Text style={styles.alertTitle}>
                        {stats.lowStockAlerts} drug(s) with low stock
                      </Text>
                      <TouchableOpacity
                        style={styles.alertButton}
                        onPress={() => navigation.navigate('Inventory' as never)}
                      >
                        <Text style={styles.alertButtonText}>View in Inventory</Text>
                      </TouchableOpacity>
                    </Card>
                  )}
                </View>
              </View>
            )}
          </>
        ) : null}
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
    paddingBottom: spacing['3xl'],
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: layout.sectionSpacing,
  },
  headerLeft: {
    flex: 1,
  },
  settingsButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: spacing.md,
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
  loadingContainer: {
    paddingVertical: spacing['4xl'],
    alignItems: 'center',
  },
  errorCard: {
    backgroundColor: '#fef2f2',
    borderColor: '#fca5a5',
  },
  errorContent: {
    alignItems: 'center',
    paddingVertical: spacing['2xl'],
  },
  errorTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.destructive,
    marginTop: spacing.md,
    marginBottom: spacing.xs,
  },
  errorMessage: {
    fontSize: fontSize.sm,
    color: '#991b1b',
    textAlign: 'center',
  },
  statsGrid: {
    marginBottom: layout.sectionSpacing,
  },
  statCard: {
    marginBottom: layout.itemSpacing,
  },
  statHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  statTitle: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
    color: colors.mutedForeground,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBlue: {
    backgroundColor: colors.primary,
  },
  iconOrange: {
    backgroundColor: colors.warning,
  },
  iconRed: {
    backgroundColor: colors.destructive,
  },
  iconGreen: {
    backgroundColor: colors.success,
  },
  iconTeal: {
    backgroundColor: '#14b8a6',
  },
  statValue: {
    fontSize: fontSize['3xl'],
    fontWeight: fontWeight.bold,
    color: colors.foreground,
    marginBottom: spacing.sm,
  },
  statBadge: {
    alignSelf: 'flex-start',
  },
  badgeText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
  },
  section: {
    marginBottom: layout.sectionSpacing,
  },
  sectionTitle: {
    fontSize: fontSize['2xl'],
    fontWeight: fontWeight.bold,
    color: colors.foreground,
    marginBottom: spacing.xs,
  },
  sectionSubtitle: {
    fontSize: fontSize.sm,
    color: colors.mutedForeground,
    marginBottom: spacing.lg,
  },
  actionsGrid: {
    gap: layout.itemSpacing,
  },
  actionCard: {
    marginBottom: layout.itemSpacing,
  },
  actionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  actionIconContainer: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionBlue: {
    backgroundColor: '#dbeafe',
  },
  actionGreen: {
    backgroundColor: '#d1fae5',
  },
  actionViolet: {
    backgroundColor: '#ede9fe',
  },
  actionTeal: {
    backgroundColor: '#ccfbf1',
  },
  actionIndigo: {
    backgroundColor: '#e0e7ff',
  },
  actionTitle: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
    color: colors.foreground,
    marginBottom: spacing.xs,
  },
  actionDescription: {
    fontSize: fontSize.sm,
    color: colors.mutedForeground,
  },
  alertsGrid: {
    gap: layout.itemSpacing,
  },
  warningAlert: {
    backgroundColor: '#fffbeb',
    borderColor: '#fbbf24',
    marginBottom: layout.itemSpacing,
  },
  dangerAlert: {
    backgroundColor: '#fef2f2',
    borderColor: '#fca5a5',
    marginBottom: layout.itemSpacing,
  },
  alertHeader: {
    marginBottom: spacing.md,
  },
  alertTitle: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
    color: colors.foreground,
    marginBottom: spacing.md,
  },
  alertButton: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
    alignSelf: 'flex-start',
  },
  alertButtonText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: colors.foreground,
  },
});
