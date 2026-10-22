import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  View,
} from 'react-native';
import { Palette } from '@/constants/Colors';
import { Typography } from '@/constants/Theme';

interface FieldInputProps extends TextInputProps {
  label: string;
  error?: string;
  hint?: string;
  mono?: boolean;
}

export const FieldInput: React.FC<FieldInputProps> = ({
  label,
  error,
  hint,
  mono = false,
  style,
  ...rest
}) => {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <View style={styles.container}>
      <View style={styles.labelRow}>
        <Text style={styles.label}>{label.toUpperCase()}</Text>
        {hint && <Text style={styles.hint}>{hint}</Text>}
      </View>

      <TextInput
        style={[
          styles.input,
          mono && styles.mono,
          isFocused && styles.focused,
          error ? styles.inputError : null,
          rest.multiline && styles.multiline,
          style,
        ]}
        placeholderTextColor={Palette.mutedGrayGreen}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        {...rest}
      />

      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  label: {
    fontFamily: Typography.fontFamily.mono,
    fontSize: 10,
    fontWeight: '800',
    color: Palette.charcoal,
    letterSpacing: 0.8,
  },
  hint: {
    fontFamily: Typography.fontFamily.sans,
    fontSize: 11,
    color: Palette.mutedGrayGreen,
  },
  input: {
    backgroundColor: Palette.paperWhite,
    borderWidth: 1.5,
    borderColor: Palette.subtleBorder,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontFamily: Typography.fontFamily.sans,
    fontSize: Typography.fontSize.bodySm,
    color: Palette.charcoal,
    minHeight: 48,
  },
  mono: {
    fontFamily: Typography.fontFamily.mono,
  },
  focused: {
    borderColor: Palette.forestGreen,
  },
  inputError: {
    borderColor: Palette.error,
    backgroundColor: Palette.errorLight,
  },
  multiline: {
    minHeight: 96,
    textAlignVertical: 'top',
  },
  errorText: {
    fontFamily: Typography.fontFamily.sans,
    fontSize: 11,
    color: Palette.error,
    marginTop: 4,
  },
});
