import React, { useRef, useState } from 'react';

import {
  Alert,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  useWindowDimensions,
} from 'react-native';

import { SafeAreaView } from 'react-native-safe-area-context';

import Ionicons from 'react-native-vector-icons/Ionicons';
import Toast from 'react-native-toast-message';

import { useSelector } from 'react-redux';

import { useResponsive } from '../../contexts/ResponsiveContext';

import { theme } from '../../constant';

import { usePrinter } from '../../contexts/PrinterContext';
/*
 * =========================================================
 * HELPERS
 * =========================================================
 */

const formatDuration = seconds => {
  const minutes = Math.floor((seconds || 0) / 60);

  const remainingSeconds = (seconds || 0) % 60;

  return `${String(minutes).padStart(2, '0')}:${String(
    remainingSeconds,
  ).padStart(2, '0')}`;
};

/*
 * =========================================================
 * INFO BOX
 * =========================================================
 */

const InfoBox = ({ label, value }) => {
  return (
    <View style={styles.infoBox}>
      <Text allowFontScaling={false} style={styles.infoLabel}>
        {label}
      </Text>

      <Text allowFontScaling={false} numberOfLines={2} style={styles.infoValue}>
        {value || '-'}
      </Text>
    </View>
  );
};

/*
 * =========================================================
 * DETAIL ROW
 * =========================================================
 */

const DetailRow = ({ label, value }) => {
  return (
    <View style={styles.detailRow}>
      <Text allowFontScaling={false} style={styles.detailLabel}>
        {label}
      </Text>

      <Text allowFontScaling={false} style={styles.detailValue}>
        {value || '-'}
      </Text>
    </View>
  );
};

/*
 * =========================================================
 * ORDER DETAILS SCREEN
 * =========================================================
 */

const OrderDetailsScreen = ({ route, navigation }) => {
  const { isTablet } = useResponsive();

  const { width, height } = useWindowDimensions();

  /*
   * Prevent multiple print clicks.
   */
  const [isPrinting, setIsPrinting] = useState(false);
  const printActionRef = useRef(false);
  const { printer, printReceipt } = usePrinter();

  const isLandscape = width > height;

  /*
   * Only show side-by-side layout
   * on tablet landscape.
   */
  const isTabletLandscape = isTablet && isLandscape;

  /*
   * Logged-in KOT user.
   */
  const user = useSelector(state => state.auth.user);

  /*
   * Order passed through navigation.
   */
  const order = route?.params?.order || {};

  const isHistory = Boolean(route?.params?.isHistory);

  const items = Array.isArray(order?.items) ? order.items : [];

  /*
   * =======================================================
   * ORDER STATUS
   * =======================================================
   */

  const isPreparing = String(order.status || '').toLowerCase() === 'preparing';

  const normalizedStatus = String(order.status || '').toLowerCase();

  const historyStatus =
    normalizedStatus === 'delivered'
      ? 'Completed'
      : normalizedStatus.charAt(0).toUpperCase() + normalizedStatus.slice(1);

  /*
   * =======================================================
   * COLLECTION POINT
   * =======================================================
   */

  const collectionPoint =
    order.collectionPoint ||
    order.locationName ||
    user?.location?.locationName ||
    '-';

  /*
   * =======================================================
   * TOTAL QUANTITY
   * =======================================================
   */

  const totalQuantity = items.reduce(
    (total, item) => total + Number(item.quantity || 0),

    0,
  );

  /*
   * =======================================================
   * PRINT RECEIPT
   * =======================================================
   */

  const handlePrintReceipt = async () => {
    if (printActionRef.current) {
      return;
    }

    printActionRef.current = true;

    try {
      /*
       * Printer hasn't been configured yet.
       */
      if (!printer) {
        printActionRef.current = false;

        Alert.alert(
          'Printer not configured',
          'Configure a printer before printing receipts.',
          [
            {
              text: 'Cancel',
              style: 'cancel',
            },
            {
              text: 'Printer Settings',

              onPress: () =>
                navigation.navigate('Profile', {
                  screen: 'PrinterSettingsScreen',
                }),
            },
          ],
        );

        return;
      }

      const orderNumber = order.orderNumber || order.id || '-';

      Alert.alert(
        'Print receipt',

        `Print receipt for Order #${orderNumber}?`,

        [
          {
            text: 'Cancel',

            style: 'cancel',

            onPress: () => {
              printActionRef.current = false;
            },
          },

          {
            text: 'Print',

            onPress: async () => {
              try {
                setIsPrinting(true);

                const receiptOrder = {
                  ...order,

                  collectionPoint,

                  locationId:
                    order.locationId || order.location_id || user?.location_id,
                };

                await printReceipt(receiptOrder);

                Toast.show({
                  type: 'success',
                  text1: 'Receipt sent',
                  text2: `Order #${orderNumber} was sent to ${
                    printer?.name || 'the printer'
                  }.`,
                  position: 'top',
                  topOffset: isTablet ? 20 : Math.max((height - 64) / 2, 20),
                  props: { isTablet },
                });
              } catch (error) {
                console.log('[OrderDetails] Print:', error);

                if (error?.code === 'PRINTER_NOT_CONFIGURED') {
                  navigation.navigate('Profile', {
                    screen: 'PrinterSettingsScreen',
                  });

                  return;
                }

                Alert.alert(
                  'Printer error',

                  error?.message || 'Unable to send receipt to printer.',
                );
              } finally {
                printActionRef.current = false;
                setIsPrinting(false);
              }
            },
          },
        ],
      );
    } catch (error) {
      printActionRef.current = false;

      Alert.alert(
        'Printer error',
        error?.message || 'Unable to load printer configuration.',
      );
    }
  };

  /*
   * =======================================================
   * MAIN ORDER CARD
   * =======================================================
   */

  const renderMainCard = () => {
    return (
      <View style={styles.mainCard}>
        {/* ORDER HEADER */}

        <View style={styles.orderHeader}>
          <View style={styles.orderHeading}>
            <Text allowFontScaling={false} style={styles.orderNumber}>
              Order #{order.orderNumber || order.id}
            </Text>

            <Text allowFontScaling={false} style={styles.orderMeta}>
              KOT #{order.id}
              {' · '}
              {order.status === 'confirmed' ? 'Confirmed' : 'Preparing'}
              {' · '}
              {order.orderTime}
            </Text>
          </View>

          <View style={styles.amountContainer}>
            <Text allowFontScaling={false} style={styles.paymentType}>
              {order.paymentType || 'Wallet paid'}
            </Text>

            <Text allowFontScaling={false} style={styles.totalAmount}>
              ₹{order.totalAmount || 0}
            </Text>
          </View>
        </View>

        <View style={styles.sectionDivider} />

        {/* SUMMARY */}

        <View
          style={[styles.infoRow, !isTabletLandscape && styles.infoRowStack]}
        >
          <InfoBox label="CUSTOMER" value={order.customerName} />

          <InfoBox label="COLLECTION POINT" value={collectionPoint} />

          <InfoBox label="TOTAL QUANTITY" value={`${totalQuantity} items`} />
        </View>

        {/* ITEMS */}

        <View style={styles.itemsList}>
          {items.map((item, index) => (
            <View key={item.id ?? index} style={styles.itemCard}>
              <View style={styles.itemQuantityBox}>
                <Text allowFontScaling={false} style={styles.itemQuantity}>
                  {item.quantity}×
                </Text>
              </View>

              <View style={styles.itemInfo}>
                <Text allowFontScaling={false} style={styles.itemName}>
                  {item.name}
                </Text>

                <Text allowFontScaling={false} style={styles.itemDescription}>
                  {item.category ? `${item.category} · ` : ''}

                  {item.description}
                </Text>
              </View>

              <Text allowFontScaling={false} style={styles.itemPrice}>
                ₹{item.price}
              </Text>
            </View>
          ))}
        </View>
      </View>
    );
  };

  /*
   * =======================================================
   * SIDE CARD
   * =======================================================
   */

  const renderSideCard = () => {
    return (
      <View
        style={[styles.sideCard, isTabletLandscape && styles.sideCardLandscape]}
      >
        <Text allowFontScaling={false} style={styles.sideTitle}>
          Order status
        </Text>

        <View
          style={[
            styles.statusPill,

            isPreparing && styles.preparingPill,

            isHistory &&
              normalizedStatus !== 'cancelled' &&
              styles.completedPill,

            isHistory &&
              normalizedStatus === 'cancelled' &&
              styles.cancelledPill,
          ]}
        >
          <Text
            allowFontScaling={false}
            style={[
              styles.statusPillText,

              isPreparing && styles.preparingPillText,

              isHistory &&
                normalizedStatus !== 'cancelled' &&
                styles.completedPillText,

              isHistory &&
                normalizedStatus === 'cancelled' &&
                styles.cancelledPillText,
            ]}
          >
            {isHistory
              ? historyStatus
              : isPreparing
              ? 'Preparing'
              : `Confirmed · Queue #${order.rank || 1}`}
          </Text>
        </View>

        <DetailRow
          label="Waiting time"
          value={formatDuration(order.elapsedSeconds)}
        />

        <DetailRow label="Payment" value={order.paymentType || 'Wallet paid'} />

        <View style={styles.sectionDivider} />

        <Text allowFontScaling={false} style={styles.sideTitle}>
          Preparation note
        </Text>

        <View style={styles.noteBox}>
          <Text allowFontScaling={false} style={styles.noteText}>
            {order.preparationNote || 'Prepare all items together.'}
          </Text>
        </View>

        <View style={styles.sectionDivider} />

        <Text allowFontScaling={false} style={styles.sideTitle}>
          Transaction
        </Text>

        <DetailRow
          label="Reference"
          value={order.transactionReference || '-'}
        />

        <DetailRow
          label="Location ID"
          value={String(order.locationId || user?.location_id || '-')}
        />

        {/* push actions to bottom only in landscape tablet */}

        {isTabletLandscape && <View style={styles.actionSpacer} />}

        {!isHistory && (
          <View style={styles.actions}>
            {!isPreparing ? (
              <>
                <TouchableOpacity
                  activeOpacity={0.8}
                  style={styles.startButton}
                >
                  <Text allowFontScaling={false} style={styles.startButtonText}>
                    Start preparation
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  activeOpacity={0.8}
                  style={styles.cancelButton}
                >
                  <Text allowFontScaling={false} style={styles.cancelText}>
                    Cancel
                  </Text>
                </TouchableOpacity>
              </>
            ) : (
              <View style={styles.lockedButton}>
                <Text allowFontScaling={false} style={styles.lockedText}>
                  Preparation in progress
                </Text>
              </View>
            )}
          </View>
        )}

        {/* PRINT RECEIPT */}

        <TouchableOpacity
          activeOpacity={0.8}
          disabled={isPrinting}
          onPress={handlePrintReceipt}
          style={[styles.printButton, isPrinting && styles.printButtonDisabled]}
        >
          <Ionicons
            name="print-outline"
            size={18}
            color={
              isPrinting ? theme.colors.textSecondary : theme.colors.textPrimary
            }
          />

          <Text
            allowFontScaling={false}
            style={[
              styles.printButtonText,

              isPrinting && styles.printButtonTextDisabled,
            ]}
          >
            {isPrinting ? 'Printing...' : 'Print receipt'}
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

  /*
   * =======================================================
   * SCREEN
   * =======================================================
   */

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {/* TOP BACK HEADER */}

      <View style={styles.topHeader}>
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Ionicons
            name="chevron-back"
            size={24}
            color={theme.colors.textPrimary}
          />
        </TouchableOpacity>

        <Text allowFontScaling={false} style={styles.backText}>
          {isHistory ? 'Back to order history' : 'Back to active orders'}
        </Text>
      </View>

      {/* TABLET LANDSCAPE */}

      {isTabletLandscape ? (
        <View style={styles.landscapeBody}>
          <ScrollView
            style={styles.leftScroll}
            contentContainerStyle={styles.leftScrollContent}
            showsVerticalScrollIndicator={false}
          >
            {renderMainCard()}
          </ScrollView>

          <View style={styles.rightPanel}>{renderSideCard()}</View>
        </View>
      ) : (
        /*
         * MOBILE + TABLET PORTRAIT
         */

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.pageContent}
          showsVerticalScrollIndicator={false}
        >
          {renderMainCard()}

          <View style={styles.portraitStatusSpacing} />

          {renderSideCard()}
        </ScrollView>
      )}
    </SafeAreaView>
  );
};

export default OrderDetailsScreen;

/*
 * =========================================================
 * STYLES
 * =========================================================
 */

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },

  topHeader: {
    height: 64,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    backgroundColor: theme.colors.background,
  },

  backButton: {
    width: 42,
    height: 42,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.xl,
    backgroundColor: theme.colors.surface,
  },

  backText: {
    color: theme.colors.textPrimary,
    fontSize: 14,
    fontWeight: '800',
  },

  /* LANDSCAPE */

  landscapeBody: {
    flex: 1,
    flexDirection: 'row',
    gap: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.lg,
  },

  leftScroll: {
    flex: 1.65,
  },

  leftScrollContent: {
    paddingBottom: theme.spacing.lg,
  },

  rightPanel: {
    flex: 1,
  },

  /* PORTRAIT */

  scroll: {
    flex: 1,
  },

  pageContent: {
    paddingHorizontal: theme.spacing.lg,

    paddingBottom: theme.spacing.xxl,
  },

  portraitStatusSpacing: {
    height: theme.spacing.md,
  },

  /* CARDS */

  mainCard: {
    padding: theme.spacing.lg,

    borderWidth: 1,

    borderColor: theme.colors.border,

    borderRadius: theme.radius.card,

    backgroundColor: theme.colors.surface,
  },

  sideCard: {
    padding: theme.spacing.lg,

    borderWidth: 1,

    borderColor: theme.colors.border,

    borderRadius: theme.radius.card,

    backgroundColor: theme.colors.surface,
  },

  sideCardLandscape: {
    flex: 1,
  },

  /* HEADER */

  orderHeader: {
    flexDirection: 'row',

    justifyContent: 'space-between',

    alignItems: 'flex-start',
  },

  orderHeading: {
    flex: 1,

    paddingRight: theme.spacing.md,
  },

  orderNumber: {
    color: theme.colors.textPrimary,

    fontSize: 28,

    lineHeight: 34,

    fontWeight: '800',
  },

  orderMeta: {
    marginTop: theme.spacing.xs,

    color: theme.colors.textSecondary,

    fontSize: 11,
  },

  amountContainer: {
    alignItems: 'flex-end',
  },

  paymentType: {
    color: theme.colors.textSecondary,

    fontSize: 11,
  },

  totalAmount: {
    marginTop: 3,

    color: theme.colors.textPrimary,

    fontSize: 25,

    fontWeight: '800',
  },

  sectionDivider: {
    height: 1,

    marginVertical: theme.spacing.md,

    backgroundColor: theme.colors.border,
  },

  /* INFO */

  infoRow: {
    flexDirection: 'row',

    gap: theme.spacing.sm,
  },

  infoRowStack: {
    flexDirection: 'column',
  },

  infoBox: {
    flex: 1,

    minHeight: 68,

    justifyContent: 'center',

    padding: theme.spacing.md,

    borderRadius: theme.radius.xl,

    backgroundColor: theme.colors.surfaceSecondary,
  },

  infoLabel: {
    color: theme.colors.textSecondary,

    fontSize: 9,

    fontWeight: '800',

    letterSpacing: 0.5,
  },

  infoValue: {
    marginTop: theme.spacing.xs,

    color: theme.colors.textPrimary,

    fontSize: 13,

    fontWeight: '700',
  },

  /* ITEMS */

  itemsList: {
    marginTop: theme.spacing.md,

    gap: theme.spacing.md,
  },

  itemCard: {
    minHeight: 78,

    flexDirection: 'row',

    alignItems: 'center',

    padding: theme.spacing.md,

    borderWidth: 1,

    borderColor: theme.colors.border,

    borderRadius: theme.radius.xxl,

    backgroundColor: theme.colors.surface,
  },

  itemQuantityBox: {
    width: 44,

    height: 44,

    alignItems: 'center',

    justifyContent: 'center',

    marginRight: theme.spacing.md,

    borderRadius: theme.radius.xl,

    backgroundColor: theme.colors.primaryLight,
  },

  itemQuantity: {
    color: theme.colors.textPrimary,

    fontSize: 15,

    fontWeight: '800',
  },

  itemInfo: {
    flex: 1,
  },

  itemName: {
    color: theme.colors.textPrimary,

    fontSize: 15,

    fontWeight: '800',
  },

  itemDescription: {
    marginTop: 4,

    color: theme.colors.textSecondary,

    fontSize: 10,
  },

  itemPrice: {
    marginLeft: theme.spacing.md,

    color: theme.colors.textPrimary,

    fontSize: 14,

    fontWeight: '800',
  },

  /* SIDE PANEL */

  sideTitle: {
    color: theme.colors.textPrimary,

    fontSize: 15,

    fontWeight: '800',
  },

  statusPill: {
    alignSelf: 'flex-start',

    marginTop: theme.spacing.sm,

    marginBottom: theme.spacing.sm,

    paddingHorizontal: theme.spacing.md,

    paddingVertical: theme.spacing.sm,

    borderRadius: theme.radius.round,

    backgroundColor: theme.colors.primaryLight,
  },

  preparingPill: {
    backgroundColor: '#E8EFFC',
  },

  statusPillText: {
    color: theme.colors.textPrimary,

    fontSize: 10,

    fontWeight: '800',
  },

  preparingPillText: {
    color: theme.colors.info,
  },

  completedPill: {
    backgroundColor: '#E7F7F0',
  },

  completedPillText: {
    color: theme.colors.success,
  },

  cancelledPill: {
    backgroundColor: '#FDEAEA',
  },

  cancelledPillText: {
    color: theme.colors.error,
  },

  detailRow: {
    minHeight: 34,

    flexDirection: 'row',

    alignItems: 'center',

    justifyContent: 'space-between',
  },

  detailLabel: {
    color: theme.colors.textSecondary,

    fontSize: 10,
  },

  detailValue: {
    maxWidth: '60%',

    color: theme.colors.textPrimary,

    fontSize: 10,

    fontWeight: '700',

    textAlign: 'right',
  },

  noteBox: {
    marginTop: theme.spacing.sm,

    padding: theme.spacing.md,

    borderRadius: theme.radius.xl,

    backgroundColor: theme.colors.primaryLight,
  },

  noteText: {
    color: theme.colors.textPrimary,

    fontSize: 10,

    lineHeight: 15,
  },

  /* ACTIONS */

  actionSpacer: {
    flex: 1,
  },

  actions: {
    flexDirection: 'row',

    gap: theme.spacing.sm,

    marginTop: theme.spacing.lg,
  },

  startButton: {
    flex: 1,

    height: 54,

    justifyContent: 'center',

    alignItems: 'center',

    borderRadius: theme.radius.xl,

    backgroundColor: theme.colors.primary,
  },

  startButtonText: {
    color: theme.colors.textOnPrimary,

    fontSize: 12,

    fontWeight: '800',

    textAlign: 'center',
  },

  cancelButton: {
    minWidth: 110,

    height: 54,

    justifyContent: 'center',

    alignItems: 'center',

    borderWidth: 1,

    borderColor: '#F2A4A4',

    borderRadius: theme.radius.xl,

    backgroundColor: theme.colors.surface,
  },

  cancelText: {
    color: theme.colors.error,

    fontSize: 11,

    fontWeight: '800',
  },

  /* PRINT */

  printButton: {
    width: '100%',

    height: 46,

    flexDirection: 'row',

    alignItems: 'center',

    justifyContent: 'center',

    gap: theme.spacing.sm,

    marginTop: theme.spacing.sm,

    borderWidth: 1,

    borderColor: theme.colors.borderDark,

    borderRadius: theme.radius.xl,

    backgroundColor: theme.colors.surface,
  },

  printButtonDisabled: {
    opacity: 0.55,
  },

  printButtonText: {
    color: theme.colors.textPrimary,

    fontSize: 11,

    fontWeight: '800',
  },

  printButtonTextDisabled: {
    color: theme.colors.textSecondary,
  },

  lockedButton: {
    flex: 1,

    height: 54,

    justifyContent: 'center',

    alignItems: 'center',

    borderRadius: theme.radius.xl,

    backgroundColor: theme.colors.surfaceSecondary,
  },

  lockedText: {
    color: theme.colors.textSecondary,

    fontSize: 11,

    fontWeight: '700',

    textAlign: 'center',
  },
});
