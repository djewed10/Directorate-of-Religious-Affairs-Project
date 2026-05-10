import { Platform, Pressable, StyleSheet, View } from 'react-native';
import Animated, { FadeIn, LinearTransition, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppText } from './AppText';
import { useTheme } from '@/theme/theme';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function BottomTabBar({ state, descriptors, navigation }: any) {
  const { colors, radius, spacing, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <View
      pointerEvents="box-none"
      style={[
        styles.shell,
        {
          paddingHorizontal: spacing.lg,
          paddingBottom: Math.max(insets.bottom + spacing.sm, spacing.xl),
        },
      ]}
    >
      <View
        style={[
          styles.wrap,
          {
            backgroundColor: isDark ? colors.elevatedSurface : colors.tabBar,
            borderColor: colors.tabBarBorder,
            borderRadius: radius.full,
            shadowColor: colors.shadowStrong,
            paddingHorizontal: spacing.xs,
          },
        ]}
      >
        {state.routes.map((route: any) => {
          const { options } = descriptors[route.key];
          const label = options.tabBarLabel ?? options.title ?? route.name;
          const focused = state.index === state.routes.indexOf(route);
          const color = focused ? colors.tabActive : isDark ? colors.tabInactive : colors.textPrimary;

          const onPress = () => {
            const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
            if (!focused && !event.defaultPrevented) navigation.navigate(route.name, route.params);
          };

          return <TabButton key={route.key} label={label} focused={focused} color={color} options={options} onPress={onPress} />;
        })}
      </View>
    </View>
  );
}

function TabButton({ label, focused, color, options, onPress }: any) {
  const { colors, radius, spacing } = useTheme();
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={() => {
        scale.value = withTiming(0.95, { duration: 90 });
      }}
      onPressOut={() => {
        scale.value = withTiming(1, { duration: 120 });
      }}
      style={[styles.item, animatedStyle]}
    >
      <View style={[styles.iconSlot, { marginBottom: spacing.xs }]}>
        {focused ? (
          <Animated.View
            entering={FadeIn.duration(140)}
            layout={LinearTransition.springify().damping(20)}
            style={[StyleSheet.absoluteFill, {borderColor: colors.tabActive, borderWidth: 2, borderRadius: radius.full }]}
          />
        ) : null}
        {options.tabBarIcon?.({ focused, color, size: focused ? 20 : 19 })}
      </View>
      <AppText variant="caption" color={color} style={[styles.label, focused && styles.activeLabel]} numberOfLines={1}>
        {label}
      </AppText>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  shell: {
    position: 'absolute',
    start: 0,
    end: 0,
    bottom: 0,
    alignItems: 'center',
  },
  wrap: {
    width: '100%',
    maxWidth: 560,
    minHeight: 64,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 1,
    shadowRadius: 22,
    elevation: 12,
    overflow: Platform.OS === 'android' ? 'hidden' : 'visible',
  },
  item: {
    flex: 1,
    height: 58,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconSlot: {
    width: 36,
    height: 31,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  label: {
    textAlign: 'center',
    fontSize: 10,
    lineHeight: 13,
  },
  activeLabel: {
    fontWeight: '600',
  },
});
