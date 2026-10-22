import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Palette } from '@/constants/Colors';
import { Typography } from '@/constants/Theme';

interface SectionEyebrowProps {
  label: string;
  mono?: boolean;
  accent?: boolean;
}

export const SectionEyebrow: React.FC<SectionEyebrowProps> = ({ label, mono = true, accent = false }) => {
  return (
    <View style={styles.container}>
      <Text style={[styles.text, mono && styles.mono, accent && styles.accentText]}>
        {label.toUpperCase()}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 6,
    flexDirection: 'row',
    alignItems: 'center',
  },
  text: {
    fontSize: Typography.fontSize.tiny,
    fontWeight: '700',
    color: Palette.mutedGrayGreen,
    letterSpacing: 1.2,
  },
  mono: {
    fontFamily: Typography.fontFamily.mono,
  },
  accentText: {
    color: Palette.forestGreen,
  },
});
