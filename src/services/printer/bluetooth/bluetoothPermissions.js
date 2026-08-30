import { PermissionsAndroid, Platform } from 'react-native';

const ANDROID_12_API_LEVEL = 31;

const createPermissionError = message => {
  const error = new Error(message);

  error.code = 'BLUETOOTH_PERMISSION_REQUIRED';

  return error;
};

const getPermissions = ({ discovery = false } = {}) => {
  if (Platform.OS !== 'android') {
    return [];
  }

  const apiLevel = Number(Platform.Version);

  if (apiLevel >= ANDROID_12_API_LEVEL) {
    return [
      PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
      ...(discovery
        ? [PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN]
        : []),
    ];
  }

  if (discovery) {
    return [PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION];
  }

  return [];
};

export const hasBluetoothPermissions = async options => {
  const permissions = getPermissions(options);

  if (!permissions.length) {
    return true;
  }

  const results = await Promise.all(
    permissions.map(permission => PermissionsAndroid.check(permission)),
  );

  return results.every(Boolean);
};

export const requestBluetoothPermissions = async options => {
  const permissions = getPermissions(options);

  if (!permissions.length) {
    return true;
  }

  const result = await PermissionsAndroid.requestMultiple(permissions);

  return permissions.every(
    permission => result[permission] === PermissionsAndroid.RESULTS.GRANTED,
  );
};

export const requireBluetoothPermissions = async (
  options,
  { request = false } = {},
) => {
  const granted = request
    ? await requestBluetoothPermissions(options)
    : await hasBluetoothPermissions(options);

  if (!granted) {
    throw createPermissionError(
      'Bluetooth permission is required to use a Bluetooth printer.',
    );
  }

  return true;
};

