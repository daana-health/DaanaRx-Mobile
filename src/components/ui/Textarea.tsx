import React from 'react';
import { View, TextInput, Text, StyleSheet, ViewStyle, TextInputProps } from 'react-native';
import { colors, borderRadius, fontSize, fontWeight, spacing } from '../../lib/theme';

interface TextareaProps extends TextInputProps {
  label?: string;
  error?: string;
  containerStyle?: ViewStyle;
  rows?: number;
}

export default function Textarea({ label, error, containerStyle, rows = 4, style, ...props }: TextareaProps) {
  return (
    <View style={[styles.container, containerStyle]}>
      {label && <Text style={styles.label}>{label}</Text>}
      <TextInput
        style={[styles.textarea, { height: rows * 24 }, error && styles.textareaError, style]}
        multiline
        numberOfLines={rows}
        textAlignVertical="top"
        placeholderTextColor={colors.mutedForeground}
        {...props}
      />
      {error && <Text style={styles.error}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.lg,
  },
  label: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    marginBottom: spacing.sm,
    color: colors.foreground,
  },
  textarea: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    fontSize: fontSize.base,
    backgroundColor: colors.background,
    color: colors.foreground,
  },
  textareaError: {
    borderColor: colors.destructive,
  },
  error: {
    color: colors.destructive,
    fontSize: fontSize.xs,
    marginTop: spacing.xs,
  },
});
