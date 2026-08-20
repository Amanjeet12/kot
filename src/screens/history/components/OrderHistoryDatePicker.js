import React, { useEffect, useMemo, useState } from 'react';

import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import Ionicons from 'react-native-vector-icons/Ionicons';

import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isAfter,
  isBefore,
  isSameDay,
  isSameMonth,
  isWithinInterval,
  parseISO,
  startOfMonth,
  startOfWeek,
  subMonths,
} from 'date-fns';

import { theme } from '../../../constant';

import { useResponsive } from '../../../contexts/ResponsiveContext';

/*
|--------------------------------------------------------------------------
| WEEK DAYS
|--------------------------------------------------------------------------
*/

const WEEK_DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

/*
|--------------------------------------------------------------------------
| HELPERS
|--------------------------------------------------------------------------
*/

const dateToString = date => {
  if (!date) {
    return null;
  }

  return format(date, 'yyyy-MM-dd');
};

const stringToDate = value => {
  if (!value) {
    return null;
  }

  return parseISO(value);
};

/*
|--------------------------------------------------------------------------
| COMPONENT
|--------------------------------------------------------------------------
*/

const OrderHistoryDatePicker = ({
  visible,

  startDate,
  endDate,

  onClose,
  onApply,
}) => {
  const { isTablet } = useResponsive();

  /*
  |--------------------------------------------------------------------------
  | TEMPORARY DATE SELECTION
  |--------------------------------------------------------------------------
  */

  const [tempStartDate, setTempStartDate] = useState(startDate);

  const [tempEndDate, setTempEndDate] = useState(endDate);

  /*
  |--------------------------------------------------------------------------
  | CURRENT MONTH
  |--------------------------------------------------------------------------
  */

  const [currentMonth, setCurrentMonth] = useState(() =>
    startDate ? stringToDate(startDate) : new Date(),
  );

  /*
  |--------------------------------------------------------------------------
  | RESET WHEN OPENING
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    if (!visible) {
      return;
    }

    setTempStartDate(startDate);

    setTempEndDate(endDate);

    setCurrentMonth(startDate ? stringToDate(startDate) : new Date());
  }, [visible, startDate, endDate]);

  /*
  |--------------------------------------------------------------------------
  | MONTH DAYS
  |--------------------------------------------------------------------------
  */

  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);

    const monthEnd = endOfMonth(currentMonth);

    const calendarStart = startOfWeek(monthStart, {
      weekStartsOn: 0,
    });

    const calendarEnd = endOfWeek(monthEnd, {
      weekStartsOn: 0,
    });

    return eachDayOfInterval({
      start: calendarStart,

      end: calendarEnd,
    });
  }, [currentMonth]);

  /*
  |--------------------------------------------------------------------------
  | SELECT DATE
  |--------------------------------------------------------------------------
  */

  const handleDatePress = date => {
    const selectedValue = dateToString(date);

    /*
    |--------------------------------------------------------------------------
    | FIRST DATE
    |--------------------------------------------------------------------------
    */

    if (!tempStartDate) {
      setTempStartDate(selectedValue);

      setTempEndDate(null);

      return;
    }

    /*
    |--------------------------------------------------------------------------
    | RANGE ALREADY SELECTED
    |--------------------------------------------------------------------------
    |
    | Clicking again starts a new selection.
    |
    */

    if (tempStartDate && tempEndDate) {
      setTempStartDate(selectedValue);

      setTempEndDate(null);

      return;
    }

    const start = stringToDate(tempStartDate);

    /*
    |--------------------------------------------------------------------------
    | SAME DATE
    |--------------------------------------------------------------------------
    |
    | Single date selection.
    |
    */

    if (isSameDay(date, start)) {
      setTempEndDate(null);

      return;
    }

    /*
    |--------------------------------------------------------------------------
    | DATE BEFORE START
    |--------------------------------------------------------------------------
    |
    | Restart range.
    |
    */

    if (isBefore(date, start)) {
      setTempStartDate(selectedValue);

      setTempEndDate(null);

      return;
    }

    /*
    |--------------------------------------------------------------------------
    | DATE AFTER START
    |--------------------------------------------------------------------------
    |
    | Complete range.
    |
    */

    if (isAfter(date, start)) {
      setTempEndDate(selectedValue);
    }
  };

  /*
  |--------------------------------------------------------------------------
  | DATE OBJECTS
  |--------------------------------------------------------------------------
  */

  const selectedStart = tempStartDate ? stringToDate(tempStartDate) : null;

  const selectedEnd = tempEndDate ? stringToDate(tempEndDate) : null;

  /*
  |--------------------------------------------------------------------------
  | DATE CHECKS
  |--------------------------------------------------------------------------
  */

  const isStartDate = date => {
    if (!selectedStart) {
      return false;
    }

    return isSameDay(date, selectedStart);
  };

  const isEndDate = date => {
    if (!selectedEnd) {
      return false;
    }

    return isSameDay(date, selectedEnd);
  };

  const isDateBetween = date => {
    if (!selectedStart || !selectedEnd) {
      return false;
    }

    return isWithinInterval(date, {
      start: selectedStart,

      end: selectedEnd,
    });
  };

  /*
  |--------------------------------------------------------------------------
  | TODAY
  |--------------------------------------------------------------------------
  */

  const handleToday = () => {
    const today = new Date();

    setTempStartDate(dateToString(today));

    setTempEndDate(null);

    setCurrentMonth(today);
  };

  /*
  |--------------------------------------------------------------------------
  | CLEAR
  |--------------------------------------------------------------------------
  */

  const handleClear = () => {
    setTempStartDate(null);

    setTempEndDate(null);
  };

  /*
  |--------------------------------------------------------------------------
  | APPLY
  |--------------------------------------------------------------------------
  */

  const handleApply = () => {
    if (!tempStartDate) {
      return;
    }

    onApply?.({
      startDate: tempStartDate,

      endDate: tempEndDate || null,
    });

    onClose?.();
  };

  /*
  |--------------------------------------------------------------------------
  | CHANGE MONTH
  |--------------------------------------------------------------------------
  */

  const previousMonth = () => {
    setCurrentMonth(month => subMonths(month, 1));
  };

  const nextMonth = () => {
    setCurrentMonth(month => addMonths(month, 1));
  };

  /*
  |--------------------------------------------------------------------------
  | RENDER
  |--------------------------------------------------------------------------
  */

  return (
    <Modal
      visible={visible}
      transparent
      statusBarTranslucent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        {/* BACKDROP */}

        <Pressable style={StyleSheet.absoluteFillObject} onPress={onClose} />

        {/* CALENDAR */}

        <View style={[styles.container, !isTablet && styles.containerMobile]}>
          {/* TOP HEADER */}

          <View style={styles.topHeader}>
            <View style={styles.headingContainer}>
              <Text allowFontScaling={false} style={styles.title}>
                Select date
              </Text>

              <Text allowFontScaling={false} style={styles.subtitle}>
                Select one date or choose a start and end date.
              </Text>
            </View>

            <TouchableOpacity
              activeOpacity={0.7}
              onPress={onClose}
              style={styles.closeButton}
            >
              <Ionicons
                name="close"
                size={17}
                color={theme.colors.textPrimary}
              />
            </TouchableOpacity>
          </View>

          {/* MONTH */}

          <View style={styles.monthHeader}>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={previousMonth}
              style={styles.monthButton}
            >
              <Ionicons
                name="chevron-back"
                size={17}
                color={theme.colors.textPrimary}
              />
            </TouchableOpacity>

            <Text allowFontScaling={false} style={styles.monthText}>
              {format(currentMonth, 'MMMM yyyy')}
            </Text>

            <TouchableOpacity
              activeOpacity={0.7}
              onPress={nextMonth}
              style={styles.monthButton}
            >
              <Ionicons
                name="chevron-forward"
                size={17}
                color={theme.colors.textPrimary}
              />
            </TouchableOpacity>
          </View>

          {/* WEEK DAYS */}

          <View style={styles.weekRow}>
            {WEEK_DAYS.map(day => (
              <View key={day} style={styles.weekCell}>
                <Text allowFontScaling={false} style={styles.weekText}>
                  {day}
                </Text>
              </View>
            ))}
          </View>

          {/* DATE GRID */}

          <View style={styles.daysGrid}>
            {calendarDays.map(date => {
              const key = dateToString(date);

              const start = isStartDate(date);

              const end = isEndDate(date);

              const range = isDateBetween(date);

              const selected = start || end;

              const sameMonth = isSameMonth(date, currentMonth);

              return (
                <View key={key} style={styles.dayCell}>
                  <View
                    style={[
                      styles.rangeBackground,

                      range && styles.rangeBackgroundActive,

                      start && styles.rangeStart,

                      end && styles.rangeEnd,
                    ]}
                  >
                    <TouchableOpacity
                      activeOpacity={0.75}
                      onPress={() => {
                        /*
                         * If user taps
                         * adjacent month,
                         * move calendar too.
                         */

                        if (!sameMonth) {
                          setCurrentMonth(date);
                        }

                        handleDatePress(date);
                      }}
                      style={[styles.dayButton, selected && styles.selectedDay]}
                    >
                      <Text
                        allowFontScaling={false}
                        style={[
                          styles.dayText,

                          !sameMonth && styles.outsideMonthText,

                          selected && styles.selectedDayText,
                        ]}
                      >
                        {format(date, 'd')}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}
          </View>

          {/* SELECTED RANGE */}

          <View style={styles.selectedContainer}>
            {/* FROM */}

            <View style={styles.selectedItem}>
              <Text allowFontScaling={false} style={styles.selectedLabel}>
                FROM
              </Text>

              <Text allowFontScaling={false} style={styles.selectedValue}>
                {selectedStart
                  ? format(selectedStart, 'dd MMM yyyy')
                  : 'Select date'}
              </Text>
            </View>

            <Ionicons
              name="arrow-forward"
              size={13}
              color={theme.colors.textSecondary}
            />

            {/* TO */}

            <View style={styles.selectedItem}>
              <Text allowFontScaling={false} style={styles.selectedLabel}>
                TO
              </Text>

              <Text allowFontScaling={false} style={styles.selectedValue}>
                {selectedEnd
                  ? format(selectedEnd, 'dd MMM yyyy')
                  : selectedStart
                  ? 'Same day'
                  : 'Select date'}
              </Text>
            </View>
          </View>

          {/* ACTIONS */}

          <View style={styles.actions}>
            <View style={styles.leftActions}>
              <TouchableOpacity
                activeOpacity={0.75}
                onPress={handleToday}
                style={styles.secondaryButton}
              >
                <Text
                  allowFontScaling={false}
                  style={styles.secondaryButtonText}
                >
                  Today
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.75}
                onPress={handleClear}
                style={styles.clearButton}
              >
                <Text allowFontScaling={false} style={styles.clearText}>
                  Clear
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.rightActions}>
              <TouchableOpacity
                activeOpacity={0.75}
                onPress={onClose}
                style={styles.cancelButton}
              >
                <Text allowFontScaling={false} style={styles.cancelText}>
                  Cancel
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.8}
                disabled={!tempStartDate}
                onPress={handleApply}
                style={[
                  styles.applyButton,

                  !tempStartDate && styles.applyButtonDisabled,
                ]}
              >
                <Text allowFontScaling={false} style={styles.applyText}>
                  Apply
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default OrderHistoryDatePicker;

/*
|--------------------------------------------------------------------------
| STYLES
|--------------------------------------------------------------------------
*/

const styles = StyleSheet.create({
  overlay: {
    flex: 1,

    alignItems: 'center',

    justifyContent: 'center',

    padding: theme.spacing.lg,

    backgroundColor: 'rgba(0,0,0,0.28)',
  },

  container: {
    width: 420,

    maxWidth: '100%',

    padding: theme.spacing.lg,

    borderWidth: 1,

    borderColor: theme.colors.border,

    borderRadius: theme.radius.card,

    backgroundColor: theme.colors.surface,
  },

  containerMobile: {
    width: '100%',

    padding: theme.spacing.md,
  },

  /*
    |--------------------------------------------------------------------------
    | TOP
    |--------------------------------------------------------------------------
    */

  topHeader: {
    flexDirection: 'row',

    alignItems: 'flex-start',

    justifyContent: 'space-between',

    marginBottom: theme.spacing.md,
  },

  headingContainer: {
    flex: 1,

    paddingRight: theme.spacing.md,
  },

  title: {
    color: theme.colors.textPrimary,

    fontSize: 16,

    fontWeight: '800',
  },

  subtitle: {
    marginTop: 3,

    color: theme.colors.textSecondary,

    fontSize: 9,

    lineHeight: 13,
  },

  closeButton: {
    width: 30,

    height: 30,

    alignItems: 'center',

    justifyContent: 'center',

    borderWidth: 1,

    borderColor: theme.colors.border,

    borderRadius: 9,
  },

  /*
    |--------------------------------------------------------------------------
    | MONTH
    |--------------------------------------------------------------------------
    */

  monthHeader: {
    height: 40,

    flexDirection: 'row',

    alignItems: 'center',

    justifyContent: 'space-between',

    marginBottom: theme.spacing.sm,
  },

  monthButton: {
    width: 32,

    height: 32,

    alignItems: 'center',

    justifyContent: 'center',

    borderWidth: 1,

    borderColor: theme.colors.border,

    borderRadius: 9,
  },

  monthText: {
    color: theme.colors.textPrimary,

    fontSize: 13,

    fontWeight: '800',
  },

  /*
    |--------------------------------------------------------------------------
    | WEEK
    |--------------------------------------------------------------------------
    */

  weekRow: {
    flexDirection: 'row',

    marginBottom: 4,
  },

  weekCell: {
    width: '14.285714%',

    alignItems: 'center',

    justifyContent: 'center',
  },

  weekText: {
    color: theme.colors.textSecondary,

    fontSize: 8,

    fontWeight: '700',
  },

  /*
    |--------------------------------------------------------------------------
    | DAYS
    |--------------------------------------------------------------------------
    */

  daysGrid: {
    flexDirection: 'row',

    flexWrap: 'wrap',
  },

  dayCell: {
    width: '14.285714%',

    height: 40,

    alignItems: 'center',

    justifyContent: 'center',
  },

  rangeBackground: {
    width: '100%',

    height: 34,

    alignItems: 'center',

    justifyContent: 'center',
  },

  rangeBackgroundActive: {
    backgroundColor: '#FFF4C7',
  },

  rangeStart: {
    borderTopLeftRadius: 17,

    borderBottomLeftRadius: 17,
  },

  rangeEnd: {
    borderTopRightRadius: 17,

    borderBottomRightRadius: 17,
  },

  dayButton: {
    width: 34,

    height: 34,

    alignItems: 'center',

    justifyContent: 'center',

    borderRadius: 17,
  },

  selectedDay: {
    backgroundColor: theme.colors.primary,
  },

  dayText: {
    color: theme.colors.textPrimary,

    fontSize: 10,

    fontWeight: '600',
  },

  outsideMonthText: {
    color: '#BEBEBE',
  },

  selectedDayText: {
    color: '#111111',

    fontWeight: '800',
  },

  /*
    |--------------------------------------------------------------------------
    | SELECTED DATE
    |--------------------------------------------------------------------------
    */

  selectedContainer: {
    minHeight: 58,

    flexDirection: 'row',

    alignItems: 'center',

    gap: theme.spacing.md,

    marginTop: theme.spacing.md,

    paddingHorizontal: theme.spacing.md,

    paddingVertical: theme.spacing.sm,

    borderWidth: 1,

    borderColor: theme.colors.border,

    borderRadius: theme.radius.lg,

    backgroundColor: theme.colors.background,
  },

  selectedItem: {
    flex: 1,
  },

  selectedLabel: {
    marginBottom: 3,

    color: theme.colors.textSecondary,

    fontSize: 7,

    fontWeight: '800',

    letterSpacing: 0.3,
  },

  selectedValue: {
    color: theme.colors.textPrimary,

    fontSize: 10,

    fontWeight: '700',
  },

  /*
    |--------------------------------------------------------------------------
    | ACTIONS
    |--------------------------------------------------------------------------
    */

  actions: {
    flexDirection: 'row',

    alignItems: 'center',

    justifyContent: 'space-between',

    marginTop: theme.spacing.lg,

    gap: theme.spacing.sm,
  },

  leftActions: {
    flexDirection: 'row',

    alignItems: 'center',

    gap: theme.spacing.sm,
  },

  rightActions: {
    flexDirection: 'row',

    alignItems: 'center',

    gap: theme.spacing.sm,
  },

  secondaryButton: {
    height: 34,

    alignItems: 'center',

    justifyContent: 'center',

    paddingHorizontal: theme.spacing.md,

    borderWidth: 1,

    borderColor: theme.colors.border,

    borderRadius: theme.radius.lg,
  },

  secondaryButtonText: {
    color: theme.colors.textPrimary,

    fontSize: 9,

    fontWeight: '700',
  },

  clearButton: {
    height: 34,

    alignItems: 'center',

    justifyContent: 'center',

    paddingHorizontal: theme.spacing.sm,
  },

  clearText: {
    color: theme.colors.textSecondary,

    fontSize: 9,

    fontWeight: '700',
  },

  cancelButton: {
    height: 34,

    alignItems: 'center',

    justifyContent: 'center',

    paddingHorizontal: theme.spacing.sm,
  },

  cancelText: {
    color: theme.colors.textSecondary,

    fontSize: 9,

    fontWeight: '700',
  },

  applyButton: {
    minWidth: 70,

    height: 34,

    alignItems: 'center',

    justifyContent: 'center',

    paddingHorizontal: theme.spacing.md,

    borderRadius: theme.radius.lg,

    backgroundColor: theme.colors.primary,
  },

  applyButtonDisabled: {
    opacity: 0.4,
  },

  applyText: {
    color: '#111111',

    fontSize: 9,

    fontWeight: '800',
  },
});
