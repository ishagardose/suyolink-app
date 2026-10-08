import React from 'react';
import useRequestTheme from '../useRequestTheme';
import { View, Text, TouchableOpacity, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CATEGORIES } from '../../../data/suyoRequests';

export default function RequestCategorySection({
  CATEGORY_ICONS,
  PLACEHOLDER_COLOR,
  busy,
  draft,
  fieldErrors,
  setDraft,
  setFieldErrors,
}) {
  const { styles, resolveColor } = useRequestTheme();
  return (
    <View style={styles.card}>
      <View style={styles.cardHeaderRow}>
        <Ionicons
          name="create-outline"
          size={18}
          color={resolveColor('#1E4D2B')}
        />
        <Text style={styles.cardTitle}>Task Overview</Text>
      </View>

      {/* Title */}
      <View style={styles.fieldBlock}>
        <View style={styles.fieldLabelRow}>
          <Text
            style={[
              styles.fieldLabel,
              fieldErrors.title && styles.fieldLabelError,
            ]}
          >
            Task Title *
          </Text>
          <Text style={styles.counterText}>{draft.title.length}/100</Text>
        </View>
        <View
          style={[
            styles.inputWithIcon,
            fieldErrors.title && styles.inputErrorBorder,
          ]}
        >
          <Ionicons
            name="document-text-outline"
            size={18}
            color={
              fieldErrors.title
                ? resolveColor('#DC2626')
                : resolveColor('#1E4D2B')
            }
            style={styles.leadingIcon}
          />
          <TextInput
            style={styles.textInputInner}
            placeholder="e.g. Drop off documents - Unit 402"
            placeholderTextColor={resolveColor(PLACEHOLDER_COLOR)}
            value={draft.title}
            onChangeText={(val) => {
              setDraft((p) => ({ ...p, title: val }));
              if (fieldErrors.title)
                setFieldErrors((p) => ({ ...p, title: undefined }));
            }}
            maxLength={100}
            editable={!busy}
          />
        </View>
        {fieldErrors.title && (
          <Text style={styles.fieldErrorText}>{fieldErrors.title}</Text>
        )}
      </View>

      {/* Category Selector */}
      <View style={styles.fieldBlock}>
        <Text style={styles.fieldLabel}>Category (Optional)</Text>
        <View style={styles.categoryGrid}>
          {CATEGORIES.map((cat) => {
            const isSelected = draft.category === cat;
            const iconName = CATEGORY_ICONS[cat] || 'cube-outline';
            return (
              <TouchableOpacity
                key={cat}
                style={[
                  styles.categoryBtn,
                  isSelected
                    ? styles.categoryBtnActive
                    : styles.categoryBtnInactive,
                ]}
                onPress={() => {
                  setDraft((p) => ({ ...p, category: cat }));
                }}
                disabled={busy}
                activeOpacity={0.7}
              >
                <Ionicons
                  name={iconName}
                  size={16}
                  color={
                    isSelected
                      ? resolveColor('#FFFFFF')
                      : resolveColor('#1E4D2B')
                  }
                />
                <Text
                  style={[
                    styles.categoryBtnText,
                    isSelected
                      ? styles.categoryBtnTextActive
                      : styles.categoryBtnTextInactive,
                  ]}
                >
                  {cat}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Task Details */}
      <View style={styles.fieldBlock}>
        <View style={styles.fieldLabelRow}>
          <Text style={styles.fieldLabel}>
            Detailed Instructions (Optional)
          </Text>
          <Text style={styles.counterText}>{draft.details.length}/2000</Text>
        </View>
        <View style={styles.textareaWrapper}>
          <TextInput
            style={styles.textareaInput}
            placeholder="Step-by-step instructions, specific items, or handling details..."
            placeholderTextColor={resolveColor(PLACEHOLDER_COLOR)}
            value={draft.details}
            onChangeText={(val) => {
              setDraft((p) => ({ ...p, details: val }));
            }}
            multiline
            numberOfLines={4}
            maxLength={2000}
            textAlignVertical="top"
            editable={!busy}
          />
        </View>
      </View>
    </View>
  );
}
