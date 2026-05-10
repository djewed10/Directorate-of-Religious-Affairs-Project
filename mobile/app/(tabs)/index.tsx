import { useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import { Image } from 'expo-image';
import { useEffect, useState, type ReactNode } from 'react';
import { ActivityIndicator, Platform, Pressable, ScrollView, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import Animated, {
  FadeInDown,
  FadeInUp,
  runOnJS,
  useAnimatedReaction,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { api } from '@/api/queries';
import { AppCard } from '@/components/AppCard';
import { AppText } from '@/components/AppText';
import { EmptyState } from '@/components/EmptyState';
import { QuickActionCard } from '@/components/QuickActionCard';
import { Screen } from '@/components/Screen';
import {
  BellRinging,
  CalendarCheck,
  CheckCircle,
  ClipboardText,
  ClockCountdown,
  ClockCounterClockwise,
  CurrencyCircleDollar,
  FileArrowUp,
  FilePlus,
  HandCoins,
  type Icon,
  MagnifyingGlass,
  Mosque,
  PaperPlaneTilt,
  Receipt,
  ShieldCheck,
  TrendUp,
  WarningOctagon,
} from '@/components/ui/icons';
import { IconBadge, ImageIconBadge } from '@/components/ui';
import type { DashboardSummary } from '@/types/api';
import { useAppTheme } from '@/theme/theme';
import { useResponsive } from '@/theme/responsive';
import { dateAr, money } from '@/utils/format';
import { uiImageIcons } from '@/constants/uiImageIcons';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);
// const RELIGIOUS_DIRECTION_LOGO_URI = 'https://placehold.co/160x160/e7f2fc/0072ce.png';
const RELIGIOUS_DIRECTION_LOGO_URI = '/assets/religious-directorate.jpg';

type Tone = 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'info';

type NotificationRow = {
  id: string;
  isRead: boolean;
};

type ActivityData = {
  id: string;
  icon: Icon;
  tone: Tone;
  title: string;
  mosqueName: string;
  meta: string;
  date?: string;
  badge: string;
  mosqueId?: string;
  imageSource?: any;
  documentId?: string;
  consumptionId?: string;
  progressionId?: string;
  externalRequestId?: string;
};

type AttentionData = {
  id: string;
  icon: Icon;
  tone: Tone;
  title: string;
  mosqueName: string;
  meta: string;
  badge: string;
  mosqueId?: string;
  imageSource?: any;
  documentId?: string;
  consumptionId?: string;
  progressionId?: string;
  externalRequestId?: string;
};

export default function DashboardScreen() {
  const { colors } = useAppTheme();
  const { isWide } = useResponsive();
  const dashboard = useQuery({ queryKey: ['dashboard'], queryFn: api.dashboard });
  const notifications = useQuery({ queryKey: ['notifications'], queryFn: () => api.notifications(), staleTime: 60_000 });

  if (dashboard.isLoading) {
    return (
      <Screen>
        <ActivityIndicator color={colors.primary} />
      </Screen>
    );
  }

  if (!dashboard.data) {
    return (
      <Screen>
        <EmptyState title="لا توجد بيانات" body="شغل seed للبدء ببيانات تجريبية." />
      </Screen>
    );
  }

  const data = dashboard.data;
  const cards = data.cards;
  const notificationRows = (notifications.data ?? []) as NotificationRow[];
  const unreadCount = notificationRows.filter((item) => item.isRead === false).length;
  const activities = buildActivityItems(data);
  const attentionItems = buildAttentionItems(data);

  return (
    <Screen contentStyle={styles.screen}>
      <CompactDashboardHeader unreadCount={unreadCount} />

      <DashboardSection
        title="المؤشرات الرئيسية"
        subtitle="قراءة مالية وتشغيلية مختصرة لما يحتاج قرارًا سريعًا"
        delay={80}
      >
        <View style={[styles.featuredGrid, isWide && styles.featuredGridWide]}>
          <FeaturedKpiCard
            title="إجمالي الاستهلاك"
            helper="مصروفات مسجلة على ملفات المساجد"
            value={numberValue(cards.totalConsumedAmount)}
            valueFormatter={money}
            suffix=" دج"
            tone="info"
            imageSource={uiImageIcons.consumption}
            icon={CurrencyCircleDollar}
            delay={120}
          />
          <FeaturedKpiCard
            title="المتبقي تقديريًا"
            helper={numberValue(cards.remainingEstimate) < 0 ? 'تجاوز يحتاج مراجعة مالية' : 'مقارنة مع الكلفة المتبقية'}
            value={numberValue(cards.remainingEstimate)}
            valueFormatter={money}
            suffix=" دج"
            tone={numberValue(cards.remainingEstimate) < 0 ? 'danger' : 'success'}
            imageSource={uiImageIcons.estimatedRemaining}
            icon={HandCoins}
            delay={170}
          />
          <FeaturedKpiCard
            title="وثائق تحتاج حسمًا"
            helper={`${numberValue(cards.expiredDocuments)} منتهية · ${numberValue(cards.expiringSoonDocuments)} ستنتهي قريبًا`}
            value={numberValue(cards.expiredDocuments) + numberValue(cards.expiringSoonDocuments)}
            tone="warning"
            imageSource={uiImageIcons.documentsAlert}
            icon={WarningOctagon}
            delay={220}
            onPress={() => router.push({ pathname: '/search', params: { filter: 'expired_documents' } })}
          />
        </View>
      </DashboardSection>

      <DashboardSection title="إجراءات سريعة" subtitle="أوامر يومية مختصرة بدون ازدحام في الواجهة" delay={160}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.actions}>
          <QuickActionCard title="إضافة وثيقة" subtitle="رفع وربط بالمسجد" icon={FilePlus} tone="info" onPress={() => router.push('/documents/new')} />
          <QuickActionCard title="إرسال طلب تحديث" subtitle="رابط آمن للجمعية" icon={PaperPlaneTilt} onPress={() => router.push('/requests/new')} />
          <QuickActionCard title="عرض التنبيهات" subtitle={`${unreadCount} غير مقروءة`} icon={BellRinging} tone="warning" onPress={() => router.push('/notifications')} />
          <QuickActionCard title="البحث عن مسجد" subtitle="بالرقم أو الاسم" icon={MagnifyingGlass} tone="secondary" onPress={() => router.push('/search')} />
          <QuickActionCard title="إضافة استفادة" subtitle="منحة أو تبرع" icon={HandCoins} tone="success" onPress={() => router.push('/aids/new')} />
          <QuickActionCard title="رفع استهلاك" subtitle="صك وفواتير" icon={Receipt} tone="info" onPress={() => router.push('/consumption/new')} />
        </ScrollView>
      </DashboardSection>

      <DashboardSection title="حالة المساجد" subtitle="نظرة صغيرة على توزيع الملفات الحالية" delay={220}>
        <View style={[styles.statusGrid, isWide && styles.statusGridWide]}>
          <CompactStatusCard
            title="قيد البناء"
            value={numberValue(cards.underConstruction)}
            helper="أولوية تقدم"
            tone="warning"
            icon={Mosque}
            imageSource={uiImageIcons.mosqueConstruction}
            onPress={() => router.push({ pathname: '/mosques', params: { filter: 'under_construction' } })}
          />
          <CompactStatusCard
            title="قيد الترميم"
            value={numberValue(cards.renovation)}
            helper="متابعة دورية"
            tone="primary"
            icon={ClockCounterClockwise}
            imageSource={uiImageIcons.mosqueRenovation}
            onPress={() => router.push({ pathname: '/mosques', params: { filter: 'renovation' } })}
          />
          <CompactStatusCard
            title="مكتملة"
            value={numberValue(cards.completed)}
            helper="ملفات مستقرة"
            tone="success"
            icon={CheckCircle}
            imageSource={uiImageIcons.mosqueCompleted}
            onPress={() => router.push({ pathname: '/mosques', params: { filter: 'completed' } })}
          />
          <CompactStatusCard
            title="جوارية بدون جمعة"
            value={numberValue(cards.neighborhoodNoFriday)}
            helper="تصنيف خاص"
            tone="info"
            icon={Mosque}
            imageSource={uiImageIcons.mosqueJouaria}
            onPress={() => router.push({ pathname: '/mosques', params: { filter: 'neighborhood_no_friday' } })}
          />
        </View>
      </DashboardSection>

      <View style={[styles.columns, isWide && styles.columnsWide]}>
        <DashboardSection title="آخر النشاطات" subtitle="أحدث ما تغير في الملفات" delay={260} style={styles.column}>
          <View style={styles.list}>
            {activities.length ? (
              activities.map((item, index) => <ActivityCard key={item.id} item={item} delay={320 + index * 50} />)
            ) : (
              <SoftEmptyCard title="لا توجد نشاطات حديثة" body="ستظهر الوثائق والتحديثات والاستهلاك هنا بعد تسجيلها." icon={CalendarCheck} />
            )}
          </View>
        </DashboardSection>

        <DashboardSection title="بحاجة متابعة" subtitle="ملفات تستحق زيارة قريبة" delay={300} style={styles.column}>
          <View style={styles.list}>
            {attentionItems.length ? (
              attentionItems.map((item, index) => <AttentionCard key={item.id} item={item} delay={360 + index * 50} />)
            ) : (
              <SoftEmptyCard title="لا توجد عناصر حرجة" body="كل الملفات الأساسية تبدو مستقرة في هذه اللحظة." icon={ShieldCheck} />
            )}
          </View>
        </DashboardSection>
      </View>
    </Screen>
  );
}

function CompactDashboardHeader({ unreadCount }: { unreadCount: number }) {
  const { colors, isDark } = useAppTheme();

  return (
    <Animated.View
      entering={FadeInDown.duration(320)}
      style={[
        styles.compactHeader,
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
          shadowColor: colors.shadowStrong,
          shadowOpacity: isDark ? 0 : 1,
        },
      ]}
    >
      <View style={styles.headerActions}>
        <HeaderIconButton imageSource={uiImageIcons.search} tone="primary" onPress={() => router.push('/search')} />
        <HeaderIconButton imageSource={uiImageIcons.notifBell} tone="info" count={unreadCount} onPress={() => router.push('/notifications')} />
      </View>
      <HeaderLogo />
    </Animated.View>
  );
}

function HeaderLogo() {
  const { colors } = useAppTheme();
  return (
    <View style={[styles.logoFrame, { borderColor: colors.border }]}>
    <Image
      source={require("../../assets/religious-directorate-logos/religious-directorate-logo-white.webp")}
      style={styles.logoImage}
      contentFit="cover"
      transition={180}
      alt="Mosque Dossiers"
    />
  </View>
  );
}

function HeaderIconButton({ 
  icon: IconComponent, 
  imageSource, 
  tone, 
  count, 
  onPress 
}: { 
  icon?: Icon; 
  imageSource?: any;
  tone: Tone; 
  count?: number; 
  onPress: () => void 
}) {
  const { colors } = useAppTheme();
  const pulse = useSharedValue(1);

  useEffect(() => {
    if (count && count > 0) {
      pulse.value = withRepeat(withSequence(withTiming(1.1, { duration: 700 }), withTiming(1, { duration: 700 })), -1);
    } else {
      pulse.value = withTiming(1, { duration: 160 });
    }
  }, [count, pulse]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }],
  }));

  return (
    <ScalePressable
      onPress={onPress}
      style={[styles.headerIconButton, { backgroundColor: 'transparent', borderColor: 'transparent' }]}
    >
      {imageSource ? (
        <ImageIconBadge
          source={imageSource}
          fallbackIcon={IconComponent || MagnifyingGlass}
          tone={tone}
          size={50}
          imageSize={45}
          rounded="circle"
        />
      ) : IconComponent ? (
        <IconComponent color={colors[tone]} size={24} weight="duotone" />
      ) : null}
      {typeof count === 'number' ? (
        <Animated.View
          style={[
            styles.headerBadge,
            Platform.OS === 'web' ? styles.headerBadgeWeb : styles.headerBadgeNative,
            { backgroundColor: colors.danger },
            animatedStyle,
          ]}
        >
          <AppText variant="caption" color={colors.white} style={styles.headerBadgeText}>
            {count > 99 ? '+99' : count}
          </AppText>
        </Animated.View>
      ) : null}
    </ScalePressable>
  );
} 

function FeaturedKpiCard({
  title,
  helper,
  value,
  valueFormatter,
  suffix,
  tone,
  icon,
  imageSource,
  delay,
  onPress,
}: {
  title: string;
  helper: string;
  value: number;
  valueFormatter?: (value: number) => string;
  suffix?: string;
  tone: Tone;
  icon?: Icon;
  imageSource?: any;
  delay: number;
  onPress?: () => void;
}) {
  const { colors, isDark } = useAppTheme();
  const color = colors[tone];
  const soft = softColor(colors, tone);

  return (
    <AppCard
      onPress={onPress}
      enteringDelay={delay}
      style={[
        styles.featuredCard,
        {
          backgroundColor: isDark ? colors.card : colors.white,
          borderColor: isDark ? colors.border : soft,
        },
      ]}
    >
      <View style={[styles.kpiAccent, { backgroundColor: color }]} />
      <View style={styles.kpiTop}>
        {imageSource ? (
          <ImageIconBadge 
            source={imageSource} 
            fallbackIcon={icon || CurrencyCircleDollar} 
            tone={tone} 
            size={90} 
            imageSize={90}
            rounded="square"
          />
        ) : icon ? (
          <IconBadge icon={icon} tone={tone} size={48} iconSize={28} />
        ) : null} 
        <View style={styles.kpiText}>
          <AppText variant="caption" color={colors.textMuted}>
            {title}
          </AppText>
          <AppText variant="caption" color={colors.textSecondary} numberOfLines={2}>
            {helper}
          </AppText>
        </View>
      </View>
      <AnimatedMetric value={value} formatter={valueFormatter} suffix={suffix} color={color} />
    </AppCard>
  );
}

function CompactStatusCard({
  title,
  value,
  helper,
  tone,
  icon,
  imageSource,
  onPress,
}: {
  title: string;
  value: number;
  helper: string;
  tone: Tone;
  icon?: Icon;
  imageSource?: any;
  onPress?: () => void;
}) {
  const { colors, isDark } = useAppTheme();
  return (
    <AppCard
      onPress={onPress}
      style={[
        styles.statusCard,
        {
          backgroundColor: isDark ? colors.card : colors.white,
        },
      ]}
    >
      <View style={styles.statusHead}>
        {imageSource ? (
          <ImageIconBadge
            source={imageSource}
            fallbackIcon={icon || Mosque}
            tone={tone}
            size={80}
            imageSize={70}
          />
        ) : icon ? (
          <IconBadge icon={icon} tone={tone} size={44} iconSize={26} />
        ) : null} 
        <View style={styles.statusCopy}>
          <AppText variant="caption" color={colors.textMuted}>
            {title}
          </AppText>
          <AppText variant="caption" color={colors.textSecondary}>
            {helper}
          </AppText>
        </View>
      </View>
      <AnimatedMetric value={value} color={colors[tone]} style={styles.statusMetric} />
    </AppCard>
  );
}

function ActivityCard({ item, delay }: { item: ActivityData; delay: number }) {
  const { colors, isDark } = useAppTheme();
  return (
    <AppCard
      onPress={
        item.mosqueId
          ? () => {
              const section = item.documentId ? 'documents' : item.consumptionId ? 'consumption' : item.progressionId ? 'progression' : 'overview';
              void router.push({
                pathname: '/mosques/[id]',
                params: {
                  id: item.mosqueId,
                  section,
                  documentId: item.documentId ?? '',
                  consumptionId: item.consumptionId ?? '',
                  progressionId: item.progressionId ?? '',
                  externalRequestId: item.externalRequestId ?? '',
                },
              });
            }
          : undefined
      }
      enteringDelay={delay}
      style={[
        styles.activityCard,
        {
          backgroundColor: isDark ? colors.card : colors.white,
        },
      ]}
    >
      <View style={styles.itemIconColumn}>
        {item.imageSource ? (
          <ImageIconBadge
            source={item.imageSource}
            fallbackIcon={item.icon}
            tone={item.tone}
            size={80}
            imageSize={70}
          />
        ) : (
          <IconBadge icon={item.icon} tone={item.tone} size={44} iconSize={28} />
        )} 
        <View style={[styles.timelineLine, { backgroundColor: softColor(colors, item.tone) }]} />
      </View>
      <View style={styles.itemBody}>
        <View style={styles.itemTop}>
          <StatusMiniBadge label={item.badge} tone={item.tone} />
          {item.date ? (
            <AppText variant="caption" color={colors.textMuted}>
              {dateAr(item.date)}
            </AppText>
          ) : null}
        </View>
        <AppText variant="button">{item.title}</AppText>
        <AppText color={colors.textSecondary} numberOfLines={1}>
          {item.mosqueName}
        </AppText>
        <AppText variant="caption" color={colors.textMuted} numberOfLines={1}>
          {item.meta}
        </AppText>
      </View>
    </AppCard>
  );
}

function AttentionCard({ item, delay }: { item: AttentionData; delay: number }) {
  const { colors, isDark } = useAppTheme();
  return (
    <AppCard
      onPress={
        item.mosqueId
          ? () => {
              const section = item.documentId ? 'documents' : item.consumptionId ? 'consumption' : item.progressionId ? 'progression' : 'overview';
              void router.push({
                pathname: '/mosques/[id]',
                params: {
                  id: item.mosqueId,
                  section,
                  documentId: item.documentId ?? '',
                  consumptionId: item.consumptionId ?? '',
                  progressionId: item.progressionId ?? '',
                  externalRequestId: item.externalRequestId ?? '',
                },
              });
            }
          : undefined
      }
      enteringDelay={delay}
      style={[
        styles.attentionCard,
        {
          backgroundColor: isDark ? colors.card : colors.white,
          borderColor: softColor(colors, item.tone),
        },
      ]}
    >
      {item.imageSource ? (
        <ImageIconBadge
          source={item.imageSource}
          fallbackIcon={item.icon}
          tone={item.tone}
          size={80}
          imageSize={70}
        />
      ) : (
        <IconBadge icon={item.icon} tone={item.tone} size={44} iconSize={28} />
      )} 
      <View style={styles.itemBody}>
        <View style={styles.itemTop}>
          <StatusMiniBadge label={item.badge} tone={item.tone} />
        </View>
        <AppText variant="button">{item.title}</AppText>
        <AppText color={colors.textSecondary} numberOfLines={1}>
          {item.mosqueName}
        </AppText>
        <AppText variant="caption" color={colors.textMuted} numberOfLines={2}>
          {item.meta}
        </AppText>
      </View>
    </AppCard>
  );
}

function DashboardSection({
  title,
  subtitle,
  delay,
  children,
  style,
}: {
  title: string;
  subtitle?: string;
  delay: number;
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  const { colors } = useAppTheme();
  return (
    <Animated.View entering={FadeInUp.delay(delay).duration(260)} style={[styles.section, style]}>
      <View style={styles.sectionHeader}>
        <View style={styles.sectionTitleBlock}>
          <AppText variant="subtitle">{title}</AppText>
          {subtitle ? (
            <AppText variant="caption" color={colors.textMuted}>
              {subtitle}
            </AppText>
          ) : null}
        </View>
      </View>
      {children}
    </Animated.View>
  );
}

function StatusMiniBadge({ label, tone }: { label: string; tone: Tone }) {
  const { colors } = useAppTheme();
  return (
    <View style={[styles.statusBadge, { backgroundColor: softColor(colors, tone) }]}>
      <AppText variant="caption" color={colors[tone]} style={styles.statusBadgeText} numberOfLines={1}>
        {label}
      </AppText>
    </View>
  );
}

function SoftEmptyCard({ title, body, icon }: { title: string; body: string; icon: Icon }) {
  const { colors, isDark } = useAppTheme();
  return (
    <AppCard style={[styles.emptyCard, { backgroundColor: isDark ? colors.card : colors.white }]}>
      <IconBadge icon={icon} tone="success" size={38} iconSize={18} />
      <View style={styles.itemBody}>
        <AppText variant="button">{title}</AppText>
        <AppText variant="caption" color={colors.textMuted}>
          {body}
        </AppText>
      </View>
    </AppCard>
  );
}

function ScalePressable({
  children,
  style,
  onPress,
}: {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  onPress?: () => void;
}) {
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={() => {
        scale.value = withSpring(0.97, { damping: 18, stiffness: 260 });
      }}
      onPressOut={() => {
        scale.value = withSpring(1, { damping: 18, stiffness: 260 });
      }}
      style={[style, animatedStyle]}
    >
      {children}
    </AnimatedPressable>
  );
}

function AnimatedMetric({
  value,
  formatter,
  suffix,
  color,
  style,
}: {
  value: number;
  formatter?: (value: number) => string;
  suffix?: string;
  color: string;
  style?: StyleProp<ViewStyle>;
}) {
  const progress = useSharedValue(0);
  const [displayValue, setDisplayValue] = useState(0);
  const format = formatter ?? ((next: number) => String(next));

  useEffect(() => {
    progress.value = 0;
    progress.value = withTiming(value, { duration: 760 });
  }, [progress, value]);

  useAnimatedReaction(
    () => progress.value,
    (current) => {
      runOnJS(setDisplayValue)(Math.round(current));
    },
    [],
  );

  return (
    <Animated.View style={style}>
      <AppText variant="metric" color={color}>
        {format(displayValue)}
        {suffix}
      </AppText>
    </Animated.View>
  );
}

function buildActivityItems(data: DashboardSummary): ActivityData[] {
  const latestDocument = data.latestDocuments?.[0];
  const latestProgression = data.latestProgression?.[0];
  const latestConsumption = data.latestConsumption?.[0];
  const items: Array<ActivityData | null> = [
    
    latestProgression
      ? {
          id: `progress-${getString(latestProgression.update.id) ?? latestProgression.officialCode}`,
          icon: TrendUp,
          tone: 'success',
          title: 'آخر تحديث تقدم',
          mosqueName: latestProgression.mosqueName,
          meta: progressionMeta(latestProgression.update, latestProgression.officialCode, latestProgression.commune),
          date: getString(latestProgression.update.createdAt),
          badge: progressionBadge(latestProgression.update),
          mosqueId: getString(latestProgression.update.mosqueId),
          imageSource: uiImageIcons.progressUpdate,
          progressionId: getString(latestProgression.update.id),
        }
      : null,
      latestDocument
      ? {
          id: `document-${getString(latestDocument.document.id) ?? latestDocument.officialCode}`,
          icon: FileArrowUp,
          tone: 'info',
          title: 'آخر وثيقة مرفوعة',
          mosqueName: latestDocument.mosqueName,
          meta: `رقم ${latestDocument.officialCode} · ${latestDocument.commune}`,
          date: getString(latestDocument.document.uploadedAt),
          badge: latestDocument.documentTypeLabel,
          mosqueId: getString(latestDocument.document.mosqueId),
          imageSource: uiImageIcons.documentsAlert,
          documentId: getString(latestDocument.document.id),
        }
      : null,
    latestConsumption
      ? {
          id: `consumption-${getString(latestConsumption.update.id) ?? latestConsumption.officialCode}`,
          icon: ClipboardText,
          tone: 'warning',
          title: 'آخر تحديث استهلاك',
          mosqueName: latestConsumption.mosqueName,
          meta: consumptionMeta(latestConsumption.update, latestConsumption.officialCode, latestConsumption.commune),
          date: getString(latestConsumption.update.createdAt),
          badge: 'استهلاك',
          mosqueId: getString(latestConsumption.update.mosqueId),
          imageSource: uiImageIcons.consumption,
          consumptionId: getString(latestConsumption.update.id),
        }
      : null,
  ];
  return items.filter(Boolean) as ActivityData[];
}

function buildAttentionItems(data: DashboardSummary): AttentionData[] {
  const expired = data.top.expiredDocuments[0];
  const noUpdate = data.top.noUpdateSincePeriod[0];
  const proof = data.top.consumptionWithoutEnoughProof[0];
  const items: Array<AttentionData | null> = [
    expired
      ? {
          id: `expired-${expired.mosqueId}`,
          icon: WarningOctagon,
          tone: 'danger',
          title: 'مسجد عنده وثيقة منتهية',
          mosqueName: expired.name,
          meta: `رقم ${expired.officialCode} · ${expired.commune} · ${expired.expiredCount} وثيقة منتهية`,
          badge: 'وثائق',
          mosqueId: expired.mosqueId,
          imageSource: uiImageIcons.documentsAlert,
        }
      : null,
    noUpdate
      ? {
          id: `stale-${noUpdate.id}`,
          icon: ClockCountdown,
          tone: 'warning',
          title: 'مسجد لم يرسل تحديثًا منذ شهرين',
          mosqueName: noUpdate.name,
          meta: `آخر نشاط: ${dateAr(noUpdate.lastActivityAt)} · ${noUpdate.commune}`,
          badge: 'متابعة',
          mosqueId: noUpdate.id,
        }
      : null,
    proof
      ? {
          id: `proof-${proof.mosqueId}`,
          icon: Receipt,
          tone: 'info',
          title: 'مسجد يحتاج متابعة استهلاك',
          mosqueName: proof.name,
          meta: `رقم ${proof.officialCode} · ${proof.commune} · ${proof.count} تحديث بدون إثبات كاف`,
          badge: 'استهلاك',
          mosqueId: proof.mosqueId,
          imageSource: uiImageIcons.consumption,
        }
      : null,
  ];
  return items.filter(Boolean) as AttentionData[];
}

function progressionBadge(update: Record<string, unknown>) {
  const percent = numberFromUnknown(update.progressPercent);
  return percent === undefined ? 'تقدم' : `${percent}%`;
}

function progressionMeta(update: Record<string, unknown>, code: string, commune: string) {
  const note = getString(update.shortNote);
  if (note) return `${note} · رقم ${code}`;
  return `رقم ${code} · ${commune}`;
}

function consumptionMeta(update: Record<string, unknown>, code: string, commune: string) {
  const amount = numberFromUnknown(update.withdrawnAmount);
  if (amount !== undefined) return `${money(amount)} دج · رقم ${code}`;
  return `رقم ${code} · ${commune}`;
}

function softColor(colors: ReturnType<typeof useAppTheme>['colors'], tone: Tone) {
  return (colors[`${tone}Soft` as keyof typeof colors] as string | undefined) ?? colors.primarySoft;
}

function numberValue(value: unknown) {
  return numberFromUnknown(value) ?? 0;
}

function numberFromUnknown(value: unknown) {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim()) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  }
  return undefined;
}

function getString(value: unknown) {
  return typeof value === 'string' ? value : undefined;
}

const styles = StyleSheet.create({
  screen: {
    gap: 16,
  },
  compactHeader: {
    minHeight: 64,
    borderWidth: 1,
    borderRadius: 22,
    paddingHorizontal: 6,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowOffset: { width: 0, height: 10 },
    shadowRadius: 20,
  },
  logoFrame: {
    width: 46,
    height: 46,
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoImage: {
    width: '100%',
    height: '100%',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 0,
  },
  headerIconButton: {
    width: 50,
    height: 50,
    borderRadius: 20,
    borderWidth: 0,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'visible',
  },
  headerBadge: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 999,
  },
  headerBadgeWeb: {
    top: 0,
    right: 0,
    minWidth: 18,
    height: 16,
    paddingHorizontal: 4,
    paddingVertical: 0,
  },
  headerBadgeNative: {
    top: -0,
    left: -0,
    minWidth: 19,
    height: 17,
    paddingHorizontal: 4,
    paddingVertical: 0,
    borderRadius: 999,
  },
  headerBadgeText: {
    textAlign: 'center',
    lineHeight: 12,
    fontSize: 10,
  },
  section: {
    gap: 12,
  },
  sectionHeader: {
    flexDirection: 'row-reverse',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: 12,
  },
  sectionTitleBlock: {
    flex: 1,
    gap: 3,
  },
  featuredGrid: {
    gap: 10,
  },
  featuredGridWide: {
    flexDirection: 'row',
    alignItems: 'stretch',
  },
  featuredCard: {
    flex: 1,
    minHeight: 150,
    minWidth: 220,
    gap: 14,
  },
  kpiAccent: {
    position: 'absolute',
    top: 16,
    bottom: 16,
    right: 0,
    width: 4,
    borderTopLeftRadius: 999,
    borderBottomLeftRadius: 999,
  },
  kpiTop: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 10,
  },
  kpiText: {
    flex: 1,
    gap: 3,
  },
  actions: {
    flexDirection: 'row-reverse',
    gap: 10,
    paddingVertical: 2,
  },
  statusGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  statusGridWide: {
    flexWrap: 'nowrap',
  },
  statusCard: {
    minWidth: 155,
    flex: 1,
    gap: 12,
  },
  statusHead: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 9,
  },
  statusCopy: {
    flex: 1,
    gap: 2,
  },
  statusMetric: {
    alignItems: 'flex-end',
  },
  columns: {
    gap: 18,
  },
  columnsWide: {
    flexDirection: 'row-reverse',
    alignItems: 'flex-start',
  },
  column: {
    flex: 1,
  },
  list: {
    gap: 10,
  },
  activityCard: {
    flexDirection: 'row-reverse',
    alignItems: 'stretch',
    gap: 12,
  },
  attentionCard: {
    flexDirection: 'row-reverse',
    alignItems: 'flex-start',
    gap: 12,
  },
  emptyCard: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 12,
  },
  itemIconColumn: {
    alignItems: 'center',
    gap: 7,
  },
  timelineLine: {
    width: 2,
    flex: 1,
    minHeight: 34,
    borderRadius: 999,
  },
  itemBody: {
    flex: 1,
    minWidth: 0,
    gap: 4,
  },
  itemTop: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  statusBadge: {
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
    maxWidth: 140,
  },
  statusBadgeText: {
    lineHeight: 15,
  },
});
