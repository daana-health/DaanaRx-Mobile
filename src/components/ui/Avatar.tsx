import React from 'react';
import { View, Text, Image, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { colors, borderRadius, fontSize, fontWeight } from '../../lib/theme';

interface AvatarProps {
  source?: { uri: string } | number;
  fallback?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  style?: ViewStyle;
}

export default function Avatar({ source, fallback, size = 'md', style }: AvatarProps) {
  const sizeStyles = {
    sm: { width: 32, height: 32 },
    md: { width: 40, height: 40 },
    lg: { width: 48, height: 48 },
    xl: { width: 64, height: 64 },
  };

  const fontSizes = {
    sm: fontSize.xs,
    md: fontSize.sm,
    lg: fontSize.base,
    xl: fontSize.lg,
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((word) => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <View style={[styles.avatar, sizeStyles[size], style]}>
      {source ? (
        <Image source={source} style={[styles.image, sizeStyles[size]]} />
      ) : (
        <View style={[styles.fallback, sizeStyles[size]]}>
          <Text style={[styles.fallbackText, { fontSize: fontSizes[size] }]}>
            {fallback ? getInitials(fallback) : '?'}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  avatar: {
    borderRadius: borderRadius.full,
    overflow: 'hidden',
  },
  image: {
    borderRadius: borderRadius.full,
  },
  fallback: {
    backgroundColor: colors.muted,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: borderRadius.full,
  },
  fallbackText: {
    color: colors.mutedForeground,
    fontWeight: fontWeight.medium,
  },
});
