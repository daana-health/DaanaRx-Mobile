import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { colors } from '../../lib/theme';

interface SeparatorProps {
  orientation?: 'horizontal' | 'vertical';
  style?: ViewStyle;
}

export default function Separator({ orientation = 'horizontal', style }: SeparatorProps) {
  return (
    <View
      style={[
        styles.separator,
        orientation === 'horizontal' ? styles.horizontal : styles.vertical,
        style,
      ]}
    />
  );
}

const styles = StyleSheet.create({
  separator: {
    backgroundColor: colors.border,
  },
  horizontal: {
    height: 1,
    width: '100%',
  },
  vertical: {
    width: 1,
    height: '100%',
  },
});
