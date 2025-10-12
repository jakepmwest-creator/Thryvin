// Mock React Native Paper components for development
import React from 'react';
import { View, TouchableOpacity, TextInput as RNTextInput } from 'react-native';

export const Text = ({ children, style, variant, ...props }: any) => (
  <View style={[{ padding: 4 }, style]} {...props}>
    {typeof children === 'string' ? children : 'Text'}
  </View>
);

export const Button = ({ children, onPress, mode, loading, disabled, style, ...props }: any) => (
  <TouchableOpacity
    onPress={onPress}
    disabled={disabled || loading}
    style={[
      {
        backgroundColor: mode === 'contained' ? '#7A3CF3' : 'transparent',
        padding: 12,
        borderRadius: 8,
        borderWidth: mode === 'outlined' ? 1 : 0,
        borderColor: '#7A3CF3',
        opacity: disabled ? 0.5 : 1,
      },
      style,
    ]}
    {...props}
  >
    <Text style={{ color: mode === 'contained' ? 'white' : '#7A3CF3', textAlign: 'center' }}>
      {loading ? 'Loading...' : children}
    </Text>
  </TouchableOpacity>
);

export const Card = ({ children, style, ...props }: any) => (
  <View style={[{ backgroundColor: 'white', borderRadius: 8, elevation: 2, margin: 8 }, style]} {...props}>
    {children}
  </View>
);

Card.Content = ({ children, style, ...props }: any) => (
  <View style={[{ padding: 16 }, style]} {...props}>
    {children}
  </View>
);

export const Surface = ({ children, style, ...props }: any) => (
  <View style={[{ backgroundColor: 'white', borderRadius: 8, elevation: 1 }, style]} {...props}>
    {children}
  </View>
);

export const TextInput = ({ label, value, onChangeText, mode, style, right, ...props }: any) => (
  <View style={[{ marginVertical: 8 }, style]}>
    {label && <Text style={{ marginBottom: 4, color: '#666' }}>{label}</Text>}
    <View style={{ position: 'relative' }}>
      <RNTextInput
        value={value}
        onChangeText={onChangeText}
        style={{
          borderWidth: 1,
          borderColor: '#ddd',
          borderRadius: 8,
          padding: 12,
          backgroundColor: 'white',
        }}
        {...props}
      />
      {right && (
        <View style={{ position: 'absolute', right: 12, top: 12 }}>
          {right}
        </View>
      )}
    </View>
  </View>
);

TextInput.Icon = ({ icon, onPress }: any) => (
  <TouchableOpacity onPress={onPress}>
    <Text>{icon === 'eye' ? '👁️' : '🙈'}</Text>
  </TouchableOpacity>
);

export const ActivityIndicator = ({ size, color }: any) => (
  <View
    style={{
      width: size === 'large' ? 40 : 20,
      height: size === 'large' ? 40 : 20,
      backgroundColor: color || '#7A3CF3',
      borderRadius: size === 'large' ? 20 : 10,
    }}
  />
);

export const ProgressBar = ({ progress, color, style }: any) => (
  <View style={[{ height: 4, backgroundColor: '#e0e0e0', borderRadius: 2 }, style]}>
    <View
      style={{
        width: `${(progress || 0) * 100}%`,
        height: '100%',
        backgroundColor: color || '#7A3CF3',
        borderRadius: 2,
      }}
    />
  </View>
);

export const Switch = ({ value, onValueChange }: any) => (
  <TouchableOpacity
    onPress={() => onValueChange?.(!value)}
    style={{
      width: 50,
      height: 30,
      backgroundColor: value ? '#7A3CF3' : '#ccc',
      borderRadius: 15,
      justifyContent: 'center',
      paddingHorizontal: 2,
    }}
  >
    <View
      style={{
        width: 26,
        height: 26,
        backgroundColor: 'white',
        borderRadius: 13,
        alignSelf: value ? 'flex-end' : 'flex-start',
      }}
    />
  </TouchableOpacity>
);

export const Divider = ({ style }: any) => (
  <View style={[{ height: 1, backgroundColor: '#e0e0e0', marginVertical: 8 }, style]} />
);

export const FAB = ({ icon, onPress, style }: any) => (
  <TouchableOpacity
    onPress={onPress}
    style={[
      {
        position: 'absolute',
        bottom: 16,
        right: 16,
        width: 56,
        height: 56,
        backgroundColor: '#7A3CF3',
        borderRadius: 28,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 4,
      },
      style,
    ]}
  >
    <Text style={{ color: 'white', fontSize: 24 }}>+</Text>
  </TouchableOpacity>
);