import React from 'react';
import { Switch as RNSwitch, StyleSheet, View, Text, ViewStyle } from 'react-native';
import { colors, spacing, fontSize, fontWeight } from '../../lib/theme';

interface SwitchProps {
  value: boolean;
  onValueChange: (value: boolean) => void;
  label?: string;
  disabled?: boolean;
  containerStyle?: ViewStyle;
}

export default function Switch({ value, onValueChange, label, disabled, containerStyle }: SwitchProps) {
  if (label) {
    return (
      <View style={[styles.container, containerStyle]}>
        <Text style={styles.label}>{label}</Text>
        <RNSwitch
          value={value}
          onValueChange={onValueChange}
          disabled={disabled}
          trackColor={{ false: colors.muted, true: colors.primary + '80' }}
          thumbColor={value ? colors.primary : colors.background}
          ios_backgroundColor={colors.muted}
        />
      </View>
    );
  }

  return (
    <RNSwitch
      value={value}
      onValueChange={onValueChange}
      disabled={disabled}
      trackColor={{ false: colors.muted, true: colors.primary + '80' }}
      thumbColor={value ? colors.primary : colors.background}
      ios_backgroundColor={colors.muted}
      style={containerStyle}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
  },
  label: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.medium,
    color: colors.foreground,
    flex: 1,
    marginRight: spacing.md,
  },
});
