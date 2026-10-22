import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Palette } from '@/constants/Colors';
import { Typography } from '@/constants/Theme';
import { FieldButton } from './FieldButton';

interface EmptyStateProps {
  title: string;
  description: string;
  iconName?: keyof typeof Feather.glyphMap;
  actionLabel?: string;
  onAction?: () => void;
}

export const EmptyStateIllustration: React.FC<EmptyStateProps> = ({
  title,
  description,
  iconName = 'compass',
  actionLabel,
  onAction,
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.iconBox}>
        <Feather name={iconName} size={28} color={Palette.forestGreen} />
      </View>

      <Text style={styles.title}>{title}</Text>
      <Text style={styles.description}>{description}</Text>

      {actionLabel && onAction && (
        <View style={styles.actionWrap}>
          <FieldButton
            label={actionLabel}
            onPress={onAction}
            variant="secondary"
            size="sm"
          />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Palette.paperWhite,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: Palette.subtleBorder,
    borderRadius: 8,
    marginVertical: 16,
  },
  iconBox: {
    width: 56,
    height: 56,
    borderRadius: 8,
    backgroundColor: Palette.cardAlt,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Palette.subtleBorder,
    marginBottom: 16,
  },
  title: {
    fontFamily: Typography.fontFamily.serif,
    fontSize: Typography.fontSize.subtitle,
    fontWeight: '700',
    color: Palette.charcoal,
    textAlign: 'center',
    marginBottom: 6,
  },
  description: {
    fontFamily: Typography.fontFamily.sans,
    fontSize: Typography.fontSize.caption,
    color: Palette.mutedGrayGreen,
    textAlign: 'center',
    lineHeight: 18,
    maxWidth: 280,
    marginBottom: 16,
  },
  actionWrap: {
    marginTop: 4,
  },
});
