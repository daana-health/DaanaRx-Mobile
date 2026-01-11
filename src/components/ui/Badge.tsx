import React from 'react';
import { View, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { colors, borderRadius, fontSize, fontWeight, spacing } from '../../lib/theme';

type BadgeVariant = 'default' | 'secondary' | 'destructive' | 'success' | 'warning' | 'outline';

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export default function Badge({ children, variant = 'default', style, textStyle }: BadgeProps) {
  const getBadgeStyles = () => {
    const baseStyles: ViewStyle[] = [styles.badge];

    if (variant === 'default') baseStyles.push(styles.badgeDefault as ViewStyle);
    if (variant === 'secondary') baseStyles.push(styles.badgeSecondary as ViewStyle);
    if (variant === 'destructive') baseStyles.push(styles.badgeDestructive as ViewStyle);
    if (variant === 'success') baseStyles.push(styles.badgeSuccess as ViewStyle);
    if (variant === 'warning') baseStyles.push(styles.badgeWarning as ViewStyle);
    if (variant === 'outline') baseStyles.push(styles.badgeOutline as ViewStyle);

    if (style) baseStyles.push(style);
    return baseStyles;
  };

  const getTextStyles = () => {
    const baseStyles: TextStyle[] = [styles.text];

    if (variant === 'default') baseStyles.push(styles.textDefault as TextStyle);
    if (variant === 'secondary') baseStyles.push(styles.textSecondary as TextStyle);
    if (variant === 'destructive') baseStyles.push(styles.textDestructive as TextStyle);
    if (variant === 'success') baseStyles.push(styles.textSuccess as TextStyle);
    if (variant === 'warning') baseStyles.push(styles.textWarning as TextStyle);
    if (variant === 'outline') baseStyles.push(styles.textOutline as TextStyle);

    if (textStyle) baseStyles.push(textStyle);
    return baseStyles;
  };

  return (
    <View style={getBadgeStyles()}>
      <Text style={getTextStyles()}>{children}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    alignSelf: 'flex-start',
  },

  // Variant styles
  badgeDefault: {
    backgroundColor: colors.primary,
  },
  badgeSecondary: {
    backgroundColor: colors.secondary,
  },
  badgeDestructive: {
    backgroundColor: colors.destructive,
  },
  badgeSuccess: {
    backgroundColor: colors.success,
  },
  badgeWarning: {
    backgroundColor: colors.warning,
  },
  badgeOutline: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.border,
  },

  // Text styles
  text: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
  },
  textDefault: {
    color: colors.primaryForeground,
  },
  textSecondary: {
    color: colors.secondaryForeground,
  },
  textDestructive: {
    color: colors.destructiveForeground,
  },
  textSuccess: {
    color: colors.successForeground,
  },
  textWarning: {
    color: colors.warningForeground,
  },
  textOutline: {
    color: colors.foreground,
  },
});
