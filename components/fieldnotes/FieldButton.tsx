import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleProp,
  StyleSheet,
  Text,
  ViewStyle,
} from 'react-native';
import { Palette } from '@/constants/Colors';
import { Typography } from '@/constants/Theme';

interface FieldButtonProps {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'accent' | 'outline' | 'destructive';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  disabled?: boolean;
  icon?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}

export const FieldButton: React.FC<FieldButtonProps> = ({
  label,
  onPress,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  icon,
  style,
}) => {
  let btnBg: string = Palette.forestGreen;
  let textColor: string = Palette.paperWhite;
  let borderColor: string = Palette.forestGreen;

  if (variant === 'secondary') {
    btnBg = Palette.paperWhite;
    textColor = Palette.charcoal;
    borderColor = Palette.subtleBorder;
  } else if (variant === 'accent') {
    btnBg = Palette.citrusLime;
    textColor = Palette.forestGreen;
    borderColor = Palette.citrusLime;
  } else if (variant === 'outline') {
    btnBg = 'transparent';
    textColor = Palette.forestGreen;
    borderColor = Palette.forestGreen;
  } else if (variant === 'destructive') {
    btnBg = Palette.errorLight;
    textColor = Palette.error;
    borderColor = Palette.error;
  }

  const isSmall = size === 'sm';
  const isLarge = size === 'lg';

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.button,
        {
          backgroundColor: btnBg,
          borderColor: borderColor,
          opacity: disabled ? 0.5 : pressed ? 0.85 : 1,
        },
        isSmall && styles.btnSm,
        isLarge && styles.btnLg,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variant === 'primary' ? Palette.paperWhite : Palette.forestGreen}
        />
      ) : (
        <>
          {icon}
          <Text
            style={[
              styles.text,
              { color: textColor },
              isSmall && styles.textSm,
              isLarge && styles.textLg,
            ]}
          >
            {label}
          </Text>
        </>
      )}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  button: {
    minHeight: 48,
    paddingHorizontal: 20,
    borderRadius: 8,
    borderWidth: 1.5,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  btnSm: {
    minHeight: 36,
    paddingHorizontal: 12,
    borderRadius: 6,
    borderWidth: 1,
  },
  btnLg: {
    minHeight: 54,
    paddingHorizontal: 24,
    borderRadius: 10,
  },
  text: {
    fontFamily: Typography.fontFamily.sans,
    fontSize: Typography.fontSize.body,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  textSm: {
    fontSize: Typography.fontSize.caption,
  },
  textLg: {
    fontSize: Typography.fontSize.subtitle,
  },
});
