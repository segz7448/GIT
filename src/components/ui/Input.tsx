import React, { useState } from 'react';
import { View, TextInput, StyleSheet, TextInputProps, ViewStyle, TextStyle } from 'react-native';
import { spacing, typography } from '../../theme';
import { useTheme } from '../../theme/ThemeContext';
import PremiumIcon from '../icons/PremiumIcon';
import { resolveGlyphName } from '../icons/legacyMap';

export interface InputProps extends TextInputProps {
  icon?: string;
  style?: ViewStyle;
  inputStyle?: TextStyle;
  mono?: boolean;
}

export default function Input({ icon, style, inputStyle, mono = false, ...textInputProps }: InputProps) {
  const { palette, glass, radius } = useTheme();
  const [focused, setFocused] = useState(false);
  const glyph = icon ? resolveGlyphName(icon) : undefined;

  return (
    <View
      style={[
        styles.wrap,
        { backgroundColor: glass.fill.thin, borderColor: glass.border, borderRadius: radius.md },
        focused && { borderColor: palette.azureBright, backgroundColor: glass.fill.regular },
        style,
      ]}
    >
      {glyph && (
        <PremiumIcon
          name={glyph}
          size={16}
          color={focused ? palette.azureBright : palette.ink500}
          style={styles.icon}
        />
      )}
      <TextInput
        style={[styles.input, { color: palette.ink100 }, mono && styles.mono, inputStyle]}
        placeholderTextColor={palette.ink700}
        onFocus={(e) => {
          setFocused(true);
          textInputProps.onFocus?.(e);
        }}
        onBlur={(e) => {
          setFocused(false);
          textInputProps.onBlur?.(e);
        }}
        {...textInputProps}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    paddingHorizontal: spacing.md,
  },
  icon: { marginRight: spacing.sm },
  input: { flex: 1, fontSize: typography.sizeMd, paddingVertical: spacing.md },
  mono: { fontFamily: typography.mono },
});
