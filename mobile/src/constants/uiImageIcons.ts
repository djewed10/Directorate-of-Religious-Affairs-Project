/**
 * Semantic mapping of UI image icons.
 * These are 3D icon assets used throughout the dashboard.
 * Prefer using these constants over hardcoded require() calls.
 */

export const uiImageIcons = {
  // Header icons
  notifBell: require('../../assets/ui3d-icons/notif_bell.webp'),
  search: require('../../assets/ui3d-icons/search.webp'),

  // KPI / Main indicators
  financialReport: require('../../assets/ui3d-icons/financial_report.webp'),
  documentsAlert: require('../../assets/ui3d-icons/documents_alert.webp'),
  progressUpdate: require('../../assets/ui3d-icons/progress_update.webp'),
  consumption: require('../../assets/ui3d-icons/consumption.webp'),
  estimatedRemaining: require('../../assets/ui3d-icons/estimated_remaining.webp'),

  // Mosque status cards
  mosqueJouaria: require('../../assets/ui3d-icons/mosque_jouaria.webp'),
  mosqueCompleted: require('../../assets/ui3d-icons/mosque_completed.webp'),
  mosqueRenovation: require('../../assets/ui3d-icons/mosque_renovation.webp'),
  mosqueConstruction: require('../../assets/ui3d-icons/mosque_construction.webp'),

  // Activity types (for latest activities and needs attention)
  // Note: Some icons are reused across different contexts
  totalConsumption: require('../../assets/ui3d-icons/consumption.webp'),
  mosqueHonored: require('../../assets/ui3d-icons/mosque_jouaria.webp'),
  mosqueJouaria2: require('../../assets/ui3d-icons/mosque_jouaria.webp'),
} as const;

/**
 * Type for icon asset keys
 */
export type UIImageIconKey = keyof typeof uiImageIcons;
