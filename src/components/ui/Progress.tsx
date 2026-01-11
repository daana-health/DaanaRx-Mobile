import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { colors, borderRadius } from '../../lib/theme';

interface ProgressProps {
  value: number; // 0-100
  style?: ViewStyle;
  indicatorStyle?: ViewStyle;
  variant?: 'default' | 'success' | 'warning' | 'destructive';
}

export default function Progress({ value, style, indicatorStyle, variant = 'default' }: ProgressProps) {
  const clampedValue = Math.max(0, Math.min(100, value));

  const getIndicatorColor = () => {
    if (variant === 'success') return colors.success;
    if (variant === 'warning') return colors.warning;
    if (variant === 'destructive') return colors.destructive;
    return colors.primary;
  };

  return (
    <View style={[styles.container, style]}>
      <View
        style={[
          styles.indicator,
          { width: `${clampedValue}%`, backgroundColor: getIndicatorColor() },
          indicatorStyle,
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 8,
    backgroundColor: colors.muted,
    borderRadius: borderRadius.full,
    overflow: 'hidden',
  },
  indicator: {
    height: '100%',
    borderRadius: borderRadius.full,
  },
});
