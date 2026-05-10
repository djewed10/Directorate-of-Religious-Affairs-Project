import { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Platform, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import Animated, { FadeInDown, FadeOut, SlideInUp } from 'react-native-reanimated';
import { AppText } from './AppText';
import { BottomSheet, type BottomSheetRef } from './BottomSheet';
import { DatePickerField } from './DatePickerField';
import { MagnifyingGlass, X } from './icons';
import { useTheme } from '@/theme/theme';
import type { DocumentType } from '@/types/api';

const groupLabels: Record<DocumentType['group'], string> = {
  mosque_file: 'ملف المسجد',
  association_file: 'ملف الجمعية',
  technical: 'تقنية',
  financial: 'مالية',
  consumption: 'استهلاك',
  progression: 'تقدم',
  other: 'أخرى',
};

interface Props {
  types: DocumentType[];
  value: DocumentType | null;
  onChange: (type: DocumentType | null) => void;
  expirationDate?: string;
  onExpirationDateChange?: (text: string) => void;
  label?: string;
  placeholder?: string;
  useSheet?: boolean;
  loading?: boolean;
  error?: string;
}

function normalize(value: string) {
  return value.trim().toLocaleLowerCase('ar-DZ');
}

export function SmartSearchInput({
  types,
  value,
  onChange,
  expirationDate,
  onExpirationDateChange,
  label = 'نوع الوثيقة',
  placeholder = 'ابحث عن نوع الوثيقة...',
  loading,
  error,
}: Props) {
  const { colors, radius, spacing, typography } = useTheme();
  const [query, setQuery] = useState(value?.labelAr ?? '');
  const [open, setOpen] = useState(false);
  const sheetMode = Platform.OS !== 'web';
  const sheetRef = useRef<BottomSheetRef>(null);

  useEffect(() => {
    setQuery(value?.labelAr ?? '');
  }, [value?.id, value?.labelAr]);

  const suggestions = useMemo(() => {
    const q = normalize(query);
    const active = types.filter((type) => type.isActive !== false);
    if (!q || value?.labelAr === query) return active.slice(0, 5);
    return active
      .filter((type) => normalize(type.labelAr).includes(q) || normalize(type.code).includes(q))
      .sort((a, b) => {
        const aStarts = normalize(a.labelAr).startsWith(q) ? 0 : 1;
        const bStarts = normalize(b.labelAr).startsWith(q) ? 0 : 1;
        return aStarts - bStarts || a.sortOrder - b.sortOrder;
      })
      .slice(0, 20);
  }, [query, types, value?.labelAr]);

  function openSuggestions() {
    setOpen(true);
    if (sheetMode) sheetRef.current?.present();
  }

  function closeSuggestions() {
    setOpen(false);
    if (sheetMode) sheetRef.current?.dismiss();
  }

  function handleQueryChange(text: string) {
    setQuery(text);
    if (value && text !== value.labelAr) onChange(null);
    openSuggestions();
  }

  function selectType(type: DocumentType) {
    onChange(type);
    setQuery(type.labelAr);
    closeSuggestions();
  }

  function clearSelection() {
    setQuery('');
    onChange(null);
    openSuggestions();
  }

  const searchField = (
    <View
      style={[
        styles.inputWrap,
        {
          backgroundColor: colors.card,
          borderColor: error ? colors.danger : open ? colors.primary : colors.border,
          borderRadius: radius.lg,
          paddingHorizontal: spacing.md,
        },
      ]}
    >
      <MagnifyingGlass size={20} color={open ? colors.primary : colors.textMuted} weight="duotone" />
      <TextInput
        value={query}
        onChangeText={handleQueryChange}
        onFocus={openSuggestions}
        placeholder={placeholder}
        placeholderTextColor={colors.textMuted}
        textAlign="right"
        autoFocus={sheetMode && open}
        showSoftInputOnFocus
        style={[
          styles.input,
          {
            color: colors.textPrimary,
            fontFamily: typography.families.regular,
          },
        ]}
      />
      {query ? (
        <Pressable onPress={clearSelection} style={styles.clearButton}>
          <X size={17} color={colors.textMuted} weight="bold" />
        </Pressable>
      ) : null}
    </View>
  );

  const suggestionsList = (
    <SuggestionsList
      suggestions={suggestions}
      onSelect={selectType}
      loading={loading}
      empty={!loading && !suggestions.length}
    />
  );

  return (
    <View style={[styles.wrap, { gap: spacing.xs }]}>
      <AppText variant="caption" color={open ? colors.primary : colors.textSecondary}>
        {label}
      </AppText>
      {sheetMode ? (
        <Pressable
          onPress={openSuggestions}
          style={[
            styles.inputWrap,
            {
              backgroundColor: colors.card,
              borderColor: error ? colors.danger : open ? colors.primary : colors.border,
              borderRadius: radius.lg,
              paddingHorizontal: spacing.md,
            },
          ]}
        >
          <MagnifyingGlass size={20} color={open ? colors.primary : colors.textMuted} weight="duotone" />
          <AppText color={query ? colors.textPrimary : colors.textMuted} style={styles.triggerText} numberOfLines={1}>
            {query || placeholder}
          </AppText>
          {query ? (
            <Pressable
              onPress={(event) => {
                event.stopPropagation();
                clearSelection();
              }}
              style={styles.clearButton}
            >
              <X size={17} color={colors.textMuted} weight="bold" />
            </Pressable>
          ) : null}
        </Pressable>
      ) : (
        <View
          style={[
            styles.inputWrap,
            {
              backgroundColor: colors.card,
              borderColor: error ? colors.danger : open ? colors.primary : colors.border,
              borderRadius: radius.lg,
              paddingHorizontal: spacing.md,
            },
          ]}
        >
          <MagnifyingGlass size={20} color={open ? colors.primary : colors.textMuted} weight="duotone" />
          <TextInput
            value={query}
            onChangeText={handleQueryChange}
            onFocus={openSuggestions}
            placeholder={placeholder}
            placeholderTextColor={colors.textMuted}
            textAlign="right"
            style={[
              styles.input,
              {
                color: colors.textPrimary,
                fontFamily: typography.families.regular,
              },
            ]}
          />
          {query ? (
            <Pressable onPress={clearSelection} style={styles.clearButton}>
              <X size={17} color={colors.textMuted} weight="bold" />
            </Pressable>
          ) : null}
        </View>
      )}
      {error ? (
        <AppText variant="caption" color={colors.danger}>
          {error}
        </AppText>
      ) : null}
      {open && !sheetMode ? (
        <Animated.View
          entering={FadeInDown.duration(170)}
          exiting={FadeOut.duration(120)}
          style={[
            styles.dropdown,
            {
              backgroundColor: colors.elevatedSurface,
              borderColor: colors.border,
              borderRadius: radius.xl,
              shadowColor: colors.shadowStrong,
            },
          ]}
        >
          {suggestionsList}
        </Animated.View>
      ) : null}
      {value?.supportsExpiration && onExpirationDateChange ? (
        <Animated.View entering={SlideInUp.duration(190)} exiting={FadeOut.duration(120)} style={{ marginTop: spacing.sm }}>
          <DatePickerField label="تاريخ الانتهاء اختياري" value={expirationDate} onChangeText={onExpirationDateChange} />
        </Animated.View>
      ) : null}
      <BottomSheet ref={sheetRef} visible={open && sheetMode} onClose={() => setOpen(false)} snapPoints={['55%', '86%']}>
        <AppText variant="subtitle">اختيار نوع الوثيقة</AppText>
        {searchField}
        {suggestionsList}
      </BottomSheet>
    </View>
  );
}

function SuggestionsList({
  suggestions,
  onSelect,
  loading,
  empty,
}: {
  suggestions: DocumentType[];
  onSelect: (type: DocumentType) => void;
  loading?: boolean;
  empty?: boolean;
}) {
  const { colors, radius, spacing } = useTheme();
  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }
  if (empty) {
    return (
      <View style={[styles.loading, { padding: spacing.lg }]}>
        <AppText color={colors.textMuted}>لا توجد أنواع مطابقة</AppText>
      </View>
    );
  }
  return (
    <ScrollView keyboardShouldPersistTaps="handled" nestedScrollEnabled showsVerticalScrollIndicator={false} style={styles.suggestionsScroll}>
      {suggestions.map((type) => (
        <Pressable
          key={type.id}
          onPress={() => onSelect(type)}
          style={({ pressed }) => [
            styles.row,
            {
              borderBottomColor: colors.divider,
              padding: spacing.md,
              opacity: pressed ? 0.78 : 1,
            },
          ]}
        >
          <View style={styles.rowText}>
            <AppText variant="body" style={styles.typeName}>
              {type.labelAr}
            </AppText>
            <AppText variant="caption" color={colors.textSecondary}>
              {groupLabels[type.group] ?? type.group}
            </AppText>
          </View>
          <View
            style={[
              styles.expiryBadge,
              {
                backgroundColor: type.supportsExpiration ? colors.secondarySoft : colors.cardAlt,
                borderRadius: radius.full,
                paddingHorizontal: spacing.sm,
              },
            ]}
          >
            <AppText variant="caption" color={type.supportsExpiration ? colors.secondary : colors.textMuted} style={styles.badgeText}>
              {type.supportsExpiration ? 'يدعم تاريخ انتهاء' : 'بدون تاريخ انتهاء'}
            </AppText>
          </View>
        </Pressable>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  wrap: {
    zIndex: 20,
  },
  inputWrap: {
    minHeight: 52,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  input: {
    flex: 1,
    fontSize: 15,
    writingDirection: 'rtl',
  },
  triggerText: {
    flex: 1,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  clearButton: {
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dropdown: {
    borderWidth: 1,
    maxHeight: 292,
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 1,
    shadowRadius: 18,
    elevation: 8,
  },
  suggestionsScroll: {
    maxHeight: 292,
  },
  loading: {
    minHeight: 88,
    alignItems: 'center',
    justifyContent: 'center',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  rowText: {
    flex: 1,
    gap: 3,
  },
  typeName: {
    fontWeight: '600',
  },
  expiryBadge: {
    minHeight: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    fontWeight: '600',
  },
});
