import React, { forwardRef } from 'react';
import { TextInput } from 'react-native';
import { useTheme } from '../../theme/ThemeContext';
export default forwardRef(function ThemedTextInput({ style, ...props }, ref) {
  const { colors } = useTheme();
  return <TextInput ref={ref} placeholderTextColor={colors.muted} selectionColor={colors.link}
    {...props} style={[{ color: colors.text }, style]} />;
});
