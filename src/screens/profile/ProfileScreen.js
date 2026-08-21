import React from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useDispatch, useSelector } from 'react-redux';

import { theme } from '../../constant';
import { useResponsive } from '../../contexts/ResponsiveContext';
import { logout } from '../../store/slices/authSlice';

const SettingRow = ({ title, description, value, last }) => (
  <View style={[styles.settingRow, last && styles.settingRowLast]}>
    <View style={styles.settingCopy}>
      <Text style={styles.settingTitle}>{title}</Text>
      <Text style={styles.settingDescription}>{description}</Text>
    </View>
    <Text style={styles.settingValue}>{value}</Text>
  </View>
);

const ProfileScreen = () => {
  const dispatch = useDispatch();
  const user = useSelector(state => state.auth.user);
  const { isMobile, isPortrait, isLargeTablet } = useResponsive();
  const shouldStack = isMobile || isPortrait;
  const location = user?.location || {};
  const displayName = user?.name || user?.operatorName || user?.companyName || 'Tuck Shop Operator';
  const email = user?.email || user?.operatorEmail || 'tuckshop@workfood.in';
  const operatorId = user?.operatorId || user?.operator_id || user?.id || 'WTF-TS-002';
  const companyId = user?.companyId || user?.company_id || '2';
  const paymentMode = user?.paymentMode || user?.payment_mode || 'Corporate wallet';
  const locationName = location?.locationName || user?.locationName || 'Main Cafeteria';
  const locationNumber = location?.locationId || user?.locationId || '2';
  const initials = displayName.split(' ').map(word => word[0]).slice(0, 2).join('').toUpperCase();

  const handleLogout = () => Alert.alert(
    'End this tablet session?',
    'New orders will stop appearing after logout.',
    [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Log out', style: 'destructive', onPress: () => dispatch(logout()) },
    ],
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView
        style={styles.screen}
        contentContainerStyle={[
          styles.container,
          isMobile && styles.containerMobile,
          isLargeTablet && styles.containerLarge,
        ]}
      >
        <Text style={styles.title}>Profile</Text>
        <Text style={styles.subtitle}>Operator account and current tablet assignment.</Text>

        <View style={[styles.columns, shouldStack && styles.columnsStacked]}>
        <View style={[styles.card, styles.profileCard, shouldStack && styles.cardStacked]}>
          <View style={styles.identityPanel}>
            <View style={styles.avatar}><Text style={styles.avatarText}>{initials}</Text></View>
            <View style={styles.identityCopy}>
              <Text style={styles.operatorName}>{displayName}</Text>
              <Text style={styles.accountType}>Corporate food counter account</Text>
              <View style={styles.statusPill}><Text style={styles.statusText}>Active account</Text></View>
            </View>
          </View>

          <View style={styles.detailsGrid}>
            <View style={[styles.detailCell, styles.detailCellBorderRight]}><Text style={styles.detailLabel}>OPERATOR ID</Text><Text style={styles.detailValue}>{operatorId}</Text></View>
            <View style={styles.detailCell}><Text style={styles.detailLabel}>PAYMENT MODE</Text><Text style={styles.detailValue}>{paymentMode}</Text></View>
            <View style={[styles.detailCell, styles.detailCellTop, styles.detailCellBorderRight]}><Text style={styles.detailLabel}>EMAIL</Text><Text style={styles.detailValue} numberOfLines={1}>{email}</Text></View>
            <View style={[styles.detailCell, styles.detailCellTop]}><Text style={styles.detailLabel}>COMPANY ID</Text><Text style={styles.detailValue}>{companyId}</Text></View>
          </View>

          <View style={styles.logoutPanel}>
            <View style={styles.logoutCopy}><Text style={styles.logoutTitle}>End this tablet session</Text><Text style={styles.logoutDescription}>New orders stop appearing after logout.</Text></View>
            <TouchableOpacity style={styles.logoutButton} onPress={handleLogout} activeOpacity={0.75}><Text style={styles.logoutButtonText}>Log out</Text></TouchableOpacity>
          </View>
        </View>

        <View style={[styles.card, styles.settingsCard, shouldStack && styles.cardStacked]}>
          <SettingRow title="Collection point" description="Orders are collected from this location." value={`${locationName} · Location ${locationNumber}`} />
          <SettingRow title="Order notifications" description="Sound and visual alert preferences." value="Sound on · High priority" />
          <SettingRow title="Printer and KOT" description="Kitchen order ticket output." value="Printer connected" />
          <SettingRow title="Help and support" description="Report an issue with this device." value="View support" last />
        </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default ProfileScreen;

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: theme.colors.background },
  screen: { flex: 1, backgroundColor: theme.colors.background },
  container: {
    flexGrow: 1,
    paddingTop: theme.spacing.lg,
    paddingHorizontal: theme.spacing.xl,
    paddingBottom: theme.spacing.xxxl,
  },
  containerMobile: {
    paddingTop: theme.spacing.md,
    paddingHorizontal: theme.spacing.md,
  },
  containerLarge: { paddingHorizontal: theme.spacing.xxl },
  title: { color: theme.colors.textPrimary, fontSize: 30, fontWeight: '700', lineHeight: 36 },
  subtitle: { color: theme.colors.textSecondary, fontSize: 12, marginTop: 2, marginBottom: 16 },
  columns: { flex: 1, flexDirection: 'row', gap: 16 },
  columnsStacked: { flexDirection: 'column' },
  card: { backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: '#DADDD6', borderRadius: 20, overflow: 'hidden' },
  cardStacked: { flex: 0, minHeight: 0, width: '100%' },
  profileCard: { flex: 0.85, padding: 20, alignSelf: 'stretch' },
  settingsCard: { flex: 1.15, alignSelf: 'stretch' },
  identityPanel: { minHeight: 160, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 20, borderRadius: 20, backgroundColor: '#101211' },
  avatar: { width: 76, height: 76, borderRadius: 38, alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFC400', marginRight: 20 },
  avatarText: { color: '#111111', fontSize: 28, fontWeight: '800' },
  identityCopy: { flex: 1 },
  operatorName: { color: theme.colors.white, fontSize: 22, fontWeight: '700' },
  accountType: { color: '#E5E7E5', fontSize: 13, marginTop: 4 },
  statusPill: { alignSelf: 'flex-start', borderRadius: 999, backgroundColor: '#123D28', paddingHorizontal: 12, paddingVertical: 8, marginTop: 12 },
  statusText: { color: '#35E58B', fontSize: 12, fontWeight: '700' },
  detailsGrid: { flexDirection: 'row', flexWrap: 'wrap', borderWidth: 1, borderColor: '#DADDD6', borderRadius: 16, overflow: 'hidden', marginTop: 12 },
  detailCell: { width: '50%', minHeight: 72, justifyContent: 'center', paddingHorizontal: 13 },
  detailCellBorderRight: { borderRightWidth: 1, borderRightColor: '#DADDD6' },
  detailCellTop: { borderTopWidth: 1, borderTopColor: '#DADDD6' },
  detailLabel: { color: theme.colors.textSecondary, fontSize: 10, fontWeight: '800', letterSpacing: 0.5 },
  detailValue: { color: theme.colors.textPrimary, fontSize: 14, fontWeight: '700', marginTop: 6 },
  logoutPanel: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#F0C5C0', borderRadius: 16, padding: 12, marginTop: 12 },
  logoutCopy: { flex: 1, paddingLeft: 6 },
  logoutTitle: { color: theme.colors.textPrimary, fontSize: 15, fontWeight: '700' },
  logoutDescription: { color: theme.colors.textSecondary, fontSize: 11, marginTop: 5 },
  logoutButton: { minWidth: 102, minHeight: 50, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#EDB9B3', borderRadius: 12, marginLeft: 12 },
  logoutButtonText: { color: theme.colors.error, fontSize: 13, fontWeight: '700' },
  settingRow: { minHeight: 90, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#DADDD6' },
  settingRowLast: { borderBottomWidth: 0 },
  settingCopy: { flex: 1, paddingRight: 16 },
  settingTitle: { color: theme.colors.textPrimary, fontSize: 14, fontWeight: '700' },
  settingDescription: { color: theme.colors.textSecondary, fontSize: 11, marginTop: 6 },
  settingValue: { maxWidth: '48%', color: theme.colors.textPrimary, fontSize: 14, fontWeight: '700', textAlign: 'right' },
});
