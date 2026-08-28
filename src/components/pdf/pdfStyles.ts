import { StyleSheet } from '@react-pdf/renderer';

export const colors = {
  bgPage: '#FAFAF9',
  bgCard: '#FFFFFF',
  bgCardAlt: '#F7F7F6',
  bgHero: '#141417',
  bgHeroCard: '#1E1E22',
  bgPill: '#F4F4F5',
  bgAccentLight: '#FEF9EE',
  bgEmeraldLight: '#F0FDF4',
  textPrimary: '#18181B',
  textSecondary: '#3F3F46',
  textBody: '#4B5563',
  textMuted: '#71717A',
  textWhite: '#FFFFFF',
  textHeroMuted: '#A1A1AA',
  accentGold: '#B48228',
  accentGoldLight: '#D4AF37',
  accentEmerald: '#0D9488',
  borderLight: '#E4E4E7',
  borderMedium: '#D4D4D8',
  borderGold: '#E6CA65',
  borderEmerald: '#99F6E4',
};

export const pdfStyles = StyleSheet.create({
  page: {
    size: 'A4',
    paddingTop: 36,
    paddingBottom: 36,
    paddingHorizontal: 36,
    backgroundColor: colors.bgPage,
    fontFamily: 'Helvetica',
    fontSize: 9,
    color: colors.textSecondary,
    lineHeight: 1.45,
  },
  
  // Header / Footer (Fixed on each page)
  pageHeader: {
    position: 'absolute',
    top: 14,
    left: 36,
    right: 36,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 0.5,
    borderBottomColor: colors.borderLight,
    paddingBottom: 4,
  },
  pageHeaderText: {
    fontSize: 7,
    fontFamily: 'Helvetica-Bold',
    color: colors.accentGold,
    letterSpacing: 0.5,
  },
  pageHeaderRight: {
    fontSize: 7,
    fontFamily: 'Helvetica',
    color: colors.textMuted,
  },
  pageFooter: {
    position: 'absolute',
    bottom: 14,
    left: 36,
    right: 36,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 0.5,
    borderTopColor: colors.borderLight,
    paddingTop: 4,
  },
  pageFooterText: {
    fontSize: 6.5,
    fontFamily: 'Helvetica',
    color: colors.textMuted,
  },
  pageFooterPageNum: {
    fontSize: 7,
    fontFamily: 'Helvetica-Bold',
    color: colors.textSecondary,
  },

  // Section Headers
  sectionContainer: {
    marginBottom: 16,
  },
  sectionNumberTitleRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 3,
  },
  sectionNumber: {
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
    color: colors.accentGold,
    marginRight: 6,
  },
  sectionTitle: {
    fontSize: 13,
    fontFamily: 'Helvetica-Bold',
    color: colors.textPrimary,
    letterSpacing: -0.2,
  },
  sectionSubtitle: {
    fontSize: 8,
    fontFamily: 'Helvetica',
    color: colors.textMuted,
    marginBottom: 6,
  },
  sectionDivider: {
    width: 32,
    height: 1.5,
    backgroundColor: colors.accentGold,
    marginBottom: 10,
  },

  // Subheadings
  subheading: {
    fontSize: 9.5,
    fontFamily: 'Helvetica-Bold',
    color: colors.textPrimary,
    marginTop: 8,
    marginBottom: 5,
  },
  subheadingMuted: {
    fontSize: 7.5,
    fontFamily: 'Helvetica-Bold',
    color: colors.accentGold,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: 3,
  },

  // Cards
  card: {
    backgroundColor: colors.bgCard,
    borderRadius: 4,
    borderWidth: 0.5,
    borderColor: colors.borderLight,
    padding: 10,
    marginBottom: 8,
  },
  cardHighlight: {
    backgroundColor: colors.bgAccentLight,
    borderRadius: 4,
    borderWidth: 0.5,
    borderColor: colors.borderGold,
    padding: 10,
    marginBottom: 8,
  },
  cardEmerald: {
    backgroundColor: colors.bgEmeraldLight,
    borderRadius: 4,
    borderWidth: 0.5,
    borderColor: colors.borderEmerald,
    padding: 10,
    marginBottom: 8,
  },

  // Grid & Flex Utilities
  row: {
    flexDirection: 'row',
    alignItems: 'stretch',
    marginBottom: 8,
  },
  col2: {
    flex: 1,
    marginRight: 6,
  },
  col2Last: {
    flex: 1,
    marginRight: 0,
  },
  col3: {
    flex: 1,
    marginRight: 6,
  },
  col3Last: {
    flex: 1,
    marginRight: 0,
  },
  col4: {
    flex: 1,
    marginRight: 4,
  },
  col4Last: {
    flex: 1,
    marginRight: 0,
  },

  // Typography
  bodyText: {
    fontSize: 8.2,
    fontFamily: 'Helvetica',
    color: colors.textBody,
    lineHeight: 1.45,
    marginBottom: 6,
  },
  bodyTextBold: {
    fontSize: 8.2,
    fontFamily: 'Helvetica-Bold',
    color: colors.textPrimary,
  },
  captionText: {
    fontSize: 7,
    fontFamily: 'Helvetica',
    color: colors.textMuted,
    lineHeight: 1.35,
  },
  metricLabel: {
    fontSize: 6.5,
    fontFamily: 'Helvetica-Bold',
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginBottom: 2,
  },
  metricValue: {
    fontSize: 11,
    fontFamily: 'Helvetica-Bold',
    color: colors.textPrimary,
  },
  metricValueGold: {
    fontSize: 11,
    fontFamily: 'Helvetica-Bold',
    color: colors.accentGold,
  },
  metricValueEmerald: {
    fontSize: 11,
    fontFamily: 'Helvetica-Bold',
    color: colors.accentEmerald,
  },
  metricSub: {
    fontSize: 6.5,
    fontFamily: 'Helvetica',
    color: colors.textMuted,
    marginTop: 1.5,
  },

  // Tables
  tableContainer: {
    borderRadius: 4,
    borderWidth: 0.5,
    borderColor: colors.borderLight,
    backgroundColor: colors.bgCard,
    marginBottom: 10,
    overflow: 'hidden',
  },
  tableHeaderRow: {
    flexDirection: 'row',
    backgroundColor: colors.bgHero,
    paddingVertical: 5,
    paddingHorizontal: 8,
    alignItems: 'center',
  },
  tableHeaderCell: {
    fontSize: 6.8,
    fontFamily: 'Helvetica-Bold',
    color: colors.textWhite,
    letterSpacing: 0.3,
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 5,
    paddingHorizontal: 8,
    borderTopWidth: 0.5,
    borderTopColor: colors.borderLight,
    alignItems: 'center',
  },
  tableRowAlt: {
    flexDirection: 'row',
    paddingVertical: 5,
    paddingHorizontal: 8,
    borderTopWidth: 0.5,
    borderTopColor: colors.borderLight,
    backgroundColor: colors.bgCardAlt,
    alignItems: 'center',
  },
  tableCell: {
    fontSize: 7.5,
    fontFamily: 'Helvetica',
    color: colors.textSecondary,
  },
  tableCellBold: {
    fontSize: 7.5,
    fontFamily: 'Helvetica-Bold',
    color: colors.textPrimary,
  },

  // Badges & Pills
  badge: {
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 2,
    alignSelf: 'flex-start',
    backgroundColor: colors.bgPill,
  },
  badgeText: {
    fontSize: 6,
    fontFamily: 'Helvetica-Bold',
    color: colors.textSecondary,
    textTransform: 'uppercase',
  },
  badgeGold: {
    backgroundColor: colors.bgAccentLight,
    borderWidth: 0.5,
    borderColor: colors.borderGold,
  },
  badgeGoldText: {
    fontSize: 6,
    fontFamily: 'Helvetica-Bold',
    color: colors.accentGold,
    textTransform: 'uppercase',
  },
  badgeEmerald: {
    backgroundColor: colors.bgEmeraldLight,
    borderWidth: 0.5,
    borderColor: colors.borderEmerald,
  },
  badgeEmeraldText: {
    fontSize: 6,
    fontFamily: 'Helvetica-Bold',
    color: colors.accentEmerald,
    textTransform: 'uppercase',
  },

  // Disclaimer & Callout
  calloutBox: {
    backgroundColor: colors.bgCardAlt,
    borderLeftWidth: 2,
    borderLeftColor: colors.accentGold,
    padding: 8,
    marginVertical: 6,
  },
  calloutText: {
    fontSize: 7.2,
    fontFamily: 'Helvetica-Oblique',
    color: colors.textSecondary,
    lineHeight: 1.4,
  },
});

export function formatPriceDisplay(price?: number, currency: string = '₹'): string {
  if (typeof price !== 'number' || isNaN(price)) return 'Price on Request';
  if (currency === '₹') {
    if (price >= 10000000) {
      return `₹${(price / 10000000).toFixed(2)} Cr`;
    }
    if (price >= 100000) {
      return `₹${(price / 100000).toFixed(2)} Lakhs`;
    }
    return `₹${price.toLocaleString('en-IN')}`;
  }
  if (price >= 1000000) {
    return `${currency}${(price / 1000000).toFixed(2)}M`;
  }
  return `${currency}${price.toLocaleString('en-US')}`;
}

export function formatRateDisplay(rate?: number, currency: string = '₹'): string {
  if (typeof rate !== 'number' || isNaN(rate) || rate <= 0) return 'Market Benchmark';
  return `${currency}${rate.toLocaleString()}/sq.ft`;
}
