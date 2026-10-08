import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Pressable,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme/ThemeContext';
import {
  formatPublicArea,
  loadPhilippineAreas,
} from '../../lib/philippineAreas';

export default function PhilippineAreaPicker({ disabled, onSelect }) {
  const { colors } = useTheme();
  const [selection, setSelection] = useState({});
  const [level, setLevel] = useState(null);
  const [items, setItems] = useState([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [retry, setRetry] = useState(0);
  const labels = {
    region: 'Region',
    city: 'City / municipality',
    barangay: 'Barangay',
  };
  const path =
    level === 'region'
      ? 'regions'
      : level === 'city'
        ? `regions/${selection.region?.code}/cities-municipalities`
        : level === 'barangay'
          ? `cities-municipalities/${selection.city?.code}/barangays`
          : null;

  useEffect(() => {
    if (!path) return;
    let active = true;
    setItems([]);
    setQuery('');
    setError('');
    setLoading(true);
    loadPhilippineAreas(path)
      .then((result) => {
        if (active) setItems(result);
      })
      .catch(() => {
        if (active)
          setError(
            'Could not load areas. Retry or close and type your public area below.',
          );
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [path, retry]);

  const choose = (item) => {
    const next =
      level === 'region'
        ? { region: item }
        : level === 'city'
          ? { region: selection.region, city: item }
          : { ...selection, barangay: item };
    setSelection(next);
    if (next.city) onSelect(formatPublicArea(next));
    else if (selection.city) onSelect('');
    setLevel(
      level === 'region' ? 'city' : level === 'city' ? 'barangay' : null,
    );
  };

  return (
    <View style={{ gap: 8 }}>
      <Text style={{ color: colors.textMuted, fontSize: 12 }}>
        Choose your area instead of typing. This does not move the map pin.
      </Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {Object.keys(labels).map((key) => {
          const unavailable =
            disabled ||
            (key === 'city' && !selection.region) ||
            (key === 'barangay' && !selection.city);
          return (
            <Pressable
              key={key}
              accessibilityRole="button"
              accessibilityLabel={`Choose ${labels[key]}`}
              disabled={unavailable}
              onPress={() => setLevel(key)}
              style={{
                flexGrow: 1,
                flexBasis: 150,
                opacity: unavailable ? 0.5 : 1,
                padding: 12,
                borderRadius: 12,
                borderWidth: 1,
                borderColor: colors.border,
                backgroundColor: colors.surfaceAlt,
              }}
            >
              <Text style={{ color: colors.textMuted, fontSize: 11 }}>
                {labels[key]}
              </Text>
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 6,
                  marginTop: 4,
                }}
              >
                <Text
                  numberOfLines={2}
                  style={{
                    flex: 1,
                    color: colors.text,
                    fontSize: 13,
                    fontWeight: '600',
                  }}
                >
                  {selection[key]?.name || 'Select'}
                </Text>
                <Ionicons
                  name="chevron-down"
                  size={14}
                  color={colors.link}
                />
              </View>
            </Pressable>
          );
        })}
      </View>
      <Modal
        visible={Boolean(level)}
        transparent
        animationType="fade"
        onRequestClose={() => setLevel(null)}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: colors.backdrop,
            justifyContent: 'center',
            padding: 20,
          }}
        >
          <View
            accessibilityViewIsModal
            style={{
              width: '100%',
              maxWidth: 480,
              height: '75%',
              maxHeight: 560,
              alignSelf: 'center',
              borderRadius: 20,
              backgroundColor: colors.card,
              padding: 20,
              gap: 14,
            }}
          >
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <Text
                style={{ fontSize: 18, fontWeight: '700', color: colors.text }}
              >
                Choose {labels[level]}
              </Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Close area picker"
                onPress={() => setLevel(null)}
                style={{ padding: 8 }}
              >
                <Ionicons
                  name="close"
                  size={22}
                  color={colors.text}
                />
              </Pressable>
            </View>
            <TextInput
              accessibilityLabel="Search areas"
              value={query}
              onChangeText={setQuery}
              placeholder="Search by name"
              placeholderTextColor={colors.textMuted}
              style={{
                padding: 12,
                borderWidth: 1,
                borderColor: colors.border,
                borderRadius: 10,
                color: colors.text,
              }}
            />
            {loading ? (
              <ActivityIndicator color={colors.link} />
            ) : error ? (
              <View style={{ gap: 12 }}>
                <Text
                  accessibilityRole="alert"
                  style={{ color: colors.danger }}
                >
                  {error}
                </Text>
                <Pressable
                  accessibilityRole="button"
                  onPress={() => setRetry((count) => count + 1)}
                >
                  <Text style={{ color: colors.link, fontWeight: '700' }}>
                    Retry area lookup
                  </Text>
                </Pressable>
              </View>
            ) : (
              <FlatList
                data={items.filter((item) =>
                  item.name.toLowerCase().includes(query.trim().toLowerCase()),
                )}
                keyExtractor={(item) => item.code}
                keyboardShouldPersistTaps="handled"
                ListEmptyComponent={
                  <Text style={{ color: colors.textMuted }}>
                    No matching areas. You can type your area manually.
                  </Text>
                }
                renderItem={({ item }) => (
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={`Select ${item.name}`}
                    onPress={() => choose(item)}
                    style={{
                      paddingVertical: 14,
                      borderBottomWidth: 1,
                      borderBottomColor: colors.border,
                    }}
                  >
                    <Text style={{ color: colors.text }}>{item.name}</Text>
                    {item.province ? (
                      <Text style={{ color: colors.textMuted, fontSize: 12 }}>
                        {typeof item.province === 'string'
                          ? item.province
                          : item.province.name}
                      </Text>
                    ) : null}
                  </Pressable>
                )}
              />
            )}
            <Text style={{ fontSize: 11, color: colors.textMuted }}>
              Area directory: PSGC Cloud
            </Text>
          </View>
        </View>
      </Modal>
    </View>
  );
}
