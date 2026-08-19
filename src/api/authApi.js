import api from './axiosInstance';

export const AUTH_ROUTES = {
  SEND_OTP: '/backend/kot/phone_login',
  VERIFY_OTP: '/backend/kot/verify_phone_otp',
  RESEND_OTP: '/backend/kot/resend_otp',
};

export const sendOtpRequest = async phone => {
  const response = await api.post(AUTH_ROUTES.SEND_OTP, {
    phone,
  });

  return response.data;
};

export const verifyOtpRequest = async ({ phone, otp }) => {
  const response = await api.post(AUTH_ROUTES.VERIFY_OTP, {
    phone,
    otp,
  });

  return response.data;
};

export const resendOtpRequest = async phone => {
  const response = await api.post(AUTH_ROUTES.RESEND_OTP, {
    phone,
  });

  return response.data;
};
