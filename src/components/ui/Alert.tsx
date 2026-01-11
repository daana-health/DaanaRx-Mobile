import React from 'react';
import { View, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, borderRadius, fontSize, fontWeight, spacing } from '../../lib/theme';

type AlertVariant = 'default' | 'destructive' | 'success' | 'warning';

interface AlertProps {
  children?: React.ReactNode;
  title?: string;
  message?: string;
  variant?: AlertVariant;
  icon?: keyof typeof Ionicons.glyphMap;
  style?: ViewStyle;
}

export function Alert({ children, title, message, variant = 'default', icon, style }: AlertProps) {
  const getAlertStyles = () => {
    const baseStyles: ViewStyle[] = [styles.alert];

    if (variant === 'default') baseStyles.push(styles.alertDefault as ViewStyle);
    if (variant === 'destructive') baseStyles.push(styles.alertDestructive as ViewStyle);
    if (variant === 'success') baseStyles.push(styles.alertSuccess as ViewStyle);
    if (variant === 'warning') baseStyles.push(styles.alertWarning as ViewStyle);

    if (style) baseStyles.push(style);
    return baseStyles;
  };

  const getIconColor = () => {
    if (variant === 'destructive') return colors.destructive;
    if (variant === 'success') return colors.success;
    if (variant === 'warning') return colors.warning;
    return colors.primary;
  };

  const defaultIcon: keyof typeof Ionicons.glyphMap = variant === 'destructive'
    ? 'alert-circle'
    : variant === 'success'
    ? 'checkmark-circle'
    : variant === 'warning'
    ? 'warning'
    : 'information-circle';

  return (
    <View style={getAlertStyles()}>
      {(icon !== null) && (
        <Ionicons
          name={icon || defaultIcon}
          size={20}
          color={getIconColor()}
          style={styles.icon}
        />
      )}
      <View style={styles.content}>
        {title && <AlertTitle>{title}</AlertTitle>}
        {(message || children) && <AlertDescription>{message || children}</AlertDescription>}
      </View>
    </View>
  );
}

export function AlertTitle({ children }: { children: React.ReactNode }) {
  return <Text style={styles.title}>{children}</Text>;
}

export function AlertDescription({ children }: { children: React.ReactNode }) {
  return <Text style={styles.description}>{children}</Text>;
}

const styles = StyleSheet.create({
  alert: {
    flexDirection: 'row',
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
  },
  alertDefault: {
    backgroundColor: colors.accent,
    borderColor: colors.border,
  },
  alertDestructive: {
    backgroundColor: '#fef2f2',
    borderColor: '#fecaca',
  },
  alertSuccess: {
    backgroundColor: '#f0fdf4',
    borderColor: '#bbf7d0',
  },
  alertWarning: {
    backgroundColor: '#fffbeb',
    borderColor: '#fef3c7',
  },
  icon: {
    marginTop: 2,
    marginRight: spacing.md,
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.foreground,
    marginBottom: spacing.xs,
  },
  description: {
    fontSize: fontSize.sm,
    color: colors.mutedForeground,
    lineHeight: 20,
  },
});
