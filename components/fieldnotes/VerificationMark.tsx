import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Palette } from '@/constants/Colors';
import { Typography } from '@/constants/Theme';

interface VerificationMarkProps {
  label?: string;
  showText?: boolean;
}

export const VerificationMark: React.FC<VerificationMarkProps> = ({
  label = 'VERIFIED TECH',
  showText = true,
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.badge}>
        <Feather name="check" size={10} color={Palette.forestGreen} />
      </View>
      {showText && <Text style={styles.text}>{label}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  badge: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: Palette.citrusLime,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontFamily: Typography.fontFamily.mono,
    fontSize: 10,
    fontWeight: '700',
    color: Palette.forestGreen,
    letterSpacing: 0.6,
  },
});
