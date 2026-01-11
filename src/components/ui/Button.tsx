import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, ViewStyle, TextStyle, View } from 'react-native';
import { colors, borderRadius, fontSize, fontWeight, shadows } from '../../lib/theme';

type ButtonVariant = 'default' | 'destructive' | 'success' | 'warning' | 'outline' | 'secondary' | 'ghost' | 'link';
type ButtonSize = 'default' | 'sm' | 'lg' | 'icon';

interface ButtonProps {
  title?: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  children?: React.ReactNode;
}

export default function Button({
  title,
  onPress,
  variant = 'default',
  size = 'default',
  disabled = false,
  loading = false,
  style,
  textStyle,
  icon,
  iconPosition = 'left',
  children,
}: ButtonProps) {
  const getButtonStyles = () => {
    const baseStyles: ViewStyle[] = [styles.button];

    // Size variants
    if (size === 'sm') baseStyles.push(styles.buttonSm as ViewStyle);
    if (size === 'lg') baseStyles.push(styles.buttonLg as ViewStyle);
    if (size === 'icon') baseStyles.push(styles.buttonIcon as ViewStyle);

    // Variant styles
    if (variant === 'default') baseStyles.push(styles.buttonDefault as ViewStyle);
    if (variant === 'destructive') baseStyles.push(styles.buttonDestructive as ViewStyle);
    if (variant === 'success') baseStyles.push(styles.buttonSuccess as ViewStyle);
    if (variant === 'warning') baseStyles.push(styles.buttonWarning as ViewStyle);
    if (variant === 'outline') baseStyles.push(styles.buttonOutline as ViewStyle);
    if (variant === 'secondary') baseStyles.push(styles.buttonSecondary as ViewStyle);
    if (variant === 'ghost') baseStyles.push(styles.buttonGhost as ViewStyle);
    if (variant === 'link') baseStyles.push(styles.buttonLink as ViewStyle);

    if (disabled) baseStyles.push(styles.buttonDisabled as ViewStyle);

    if (style) baseStyles.push(style);
    return baseStyles;
  };

  const getTextStyles = () => {
    const baseStyles: TextStyle[] = [styles.text];

    // Size text variants
    if (size === 'sm') baseStyles.push(styles.textSm as TextStyle);
    if (size === 'lg') baseStyles.push(styles.textLg as TextStyle);

    // Variant text styles
    if (variant === 'default') baseStyles.push(styles.textDefault as TextStyle);
    if (variant === 'destructive') baseStyles.push(styles.textDestructive as TextStyle);
    if (variant === 'success') baseStyles.push(styles.textSuccess as TextStyle);
    if (variant === 'warning') baseStyles.push(styles.textWarning as TextStyle);
    if (variant === 'outline') baseStyles.push(styles.textOutline as TextStyle);
    if (variant === 'secondary') baseStyles.push(styles.textSecondary as TextStyle);
    if (variant === 'ghost') baseStyles.push(styles.textGhost as TextStyle);
    if (variant === 'link') baseStyles.push(styles.textLink as TextStyle);

    if (disabled) baseStyles.push(styles.textDisabled as TextStyle);

    if (textStyle) baseStyles.push(textStyle);
    return baseStyles;
  };

  const renderContent = () => {
    if (loading) {
      return (
        <ActivityIndicator
          color={variant === 'outline' || variant === 'ghost' || variant === 'link' ? colors.primary : colors.primaryForeground}
        />
      );
    }

    if (children) {
      // Check if children is a string or contains strings
      if (typeof children === 'string' || typeof children === 'number') {
        return <Text style={getTextStyles()}>{children}</Text>;
      }
      return children;
    }

    if (icon && title) {
      return (
        <View style={styles.buttonContent}>
          {iconPosition === 'left' && icon}
          <Text style={getTextStyles()}>{title}</Text>
          {iconPosition === 'right' && icon}
        </View>
      );
    }

    if (icon) {
      return icon;
    }

    return <Text style={getTextStyles()}>{title}</Text>;
  };

  return (
    <TouchableOpacity
      style={getButtonStyles()}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.7}
    >
      {renderContent()}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: borderRadius.lg,
    paddingVertical: 12,
    paddingHorizontal: 20,
    minHeight: 44,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  // Size variants
  buttonSm: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    minHeight: 36,
    borderRadius: borderRadius.md,
  },
  buttonLg: {
    paddingVertical: 14,
    paddingHorizontal: 32,
    minHeight: 48,
    borderRadius: borderRadius.lg,
  },
  buttonIcon: {
    width: 44,
    height: 44,
    paddingHorizontal: 0,
    paddingVertical: 0,
  },

  // Variant styles
  buttonDefault: {
    backgroundColor: colors.primary,
    ...shadows.soft,
  },
  buttonDestructive: {
    backgroundColor: colors.destructive,
    ...shadows.soft,
  },
  buttonSuccess: {
    backgroundColor: colors.success,
    ...shadows.soft,
  },
  buttonWarning: {
    backgroundColor: colors.warning,
    ...shadows.soft,
  },
  buttonOutline: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.border,
  },
  buttonSecondary: {
    backgroundColor: colors.secondary,
  },
  buttonGhost: {
    backgroundColor: 'transparent',
  },
  buttonLink: {
    backgroundColor: 'transparent',
    paddingHorizontal: 0,
  },
  buttonDisabled: {
    backgroundColor: colors.muted,
    opacity: 0.5,
  },

  // Text styles
  text: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
  },
  textSm: {
    fontSize: fontSize.xs,
  },
  textLg: {
    fontSize: fontSize.base,
  },
  textDefault: {
    color: colors.primaryForeground,
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
    color: colors.primary,
  },
  textSecondary: {
    color: colors.secondaryForeground,
  },
  textGhost: {
    color: colors.foreground,
  },
  textLink: {
    color: colors.primary,
    textDecorationLine: 'underline',
  },
  textDisabled: {
    color: colors.mutedForeground,
  },
});
