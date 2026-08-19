import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';

import {
  sendOtpRequest,
  verifyOtpRequest,
  resendOtpRequest,
} from '../../api/authApi';

/*
|--------------------------------------------------------------------------
| ERROR HELPER
|--------------------------------------------------------------------------
*/

const getApiError = error => {
  return (
    error?.response?.data?.msg ||
    error?.response?.data?.message ||
    error?.message ||
    'Something went wrong'
  );
};

/*
|--------------------------------------------------------------------------
| SEND OTP
|--------------------------------------------------------------------------
|
| POST
| /backend/kot/phone_login
|
| {
|   phone: "XXXXXXXXXX"
| }
|
*/

export const sendPhoneOtp = createAsyncThunk(
  'auth/sendPhoneOtp',

  async ({ phone }, { rejectWithValue }) => {
    try {
      const response = await sendOtpRequest(phone);

      if (response?.success === 0) {
        return rejectWithValue(response.msg || 'Unable to send OTP');
      }

      return {
        response,
        phone,
      };
    } catch (error) {
      return rejectWithValue(getApiError(error));
    }
  },
);

/*
|--------------------------------------------------------------------------
| VERIFY OTP
|--------------------------------------------------------------------------
|
| POST
| /backend/kot/verify_phone_otp
|
| {
|   phone: "XXXXXXXXXX",
|   otp: "123456"
| }
|
*/

export const verifyPhoneOtp = createAsyncThunk(
  'auth/verifyPhoneOtp',

  async ({ phone, otp }, { rejectWithValue }) => {
    try {
      const response = await verifyOtpRequest({
        phone,
        otp,
      });

      if (response?.success === 0 || response?.success === '0') {
        return rejectWithValue(response.msg || 'OTP verification failed');
      }

      return response;
    } catch (error) {
      return rejectWithValue(getApiError(error));
    }
  },
);

/*
|--------------------------------------------------------------------------
| RESEND OTP
|--------------------------------------------------------------------------
|
| POST
| /backend/kot/resend_otp
|
| {
|   phone: "XXXXXXXXXX"
| }
|
*/

export const resendPhoneOtp = createAsyncThunk(
  'auth/resendPhoneOtp',

  async ({ phone }, { rejectWithValue }) => {
    try {
      const response = await resendOtpRequest(phone);

      return response;
    } catch (error) {
      return rejectWithValue(getApiError(error));
    }
  },
);

/*
|--------------------------------------------------------------------------
| INITIAL STATE
|--------------------------------------------------------------------------
*/

const initialState = {
  // Logged in KOT
  user: null,
  token: null,
  isAuthenticated: false,

  // Phone being authenticated
  phone: null,

  // OTP state
  otpSent: false,

  // Loading
  sendOtpLoading: false,
  verifyOtpLoading: false,
  resendOtpLoading: false,

  // Error
  error: null,

  // Optional API responses
  sendOtpResponse: null,
  verifyOtpResponse: null,
  resendOtpResponse: null,
};

/*
|--------------------------------------------------------------------------
| SLICE
|--------------------------------------------------------------------------
*/

const authSlice = createSlice({
  name: 'auth',

  initialState,

  reducers: {
    setAuth: (state, action) => {
      state.user = action.payload.user;

      state.token = action.payload.token;

      state.isAuthenticated = true;
    },

    setUser: (state, action) => {
      state.user = action.payload;
    },

    clearAuthError: state => {
      state.error = null;
    },

    resetOtp: state => {
      state.otpSent = false;

      state.sendOtpResponse = null;

      state.verifyOtpResponse = null;

      state.resendOtpResponse = null;

      state.error = null;
    },

    logout: state => {
      state.user = null;

      state.token = null;

      state.phone = null;

      state.isAuthenticated = false;

      state.otpSent = false;

      state.error = null;

      state.sendOtpResponse = null;

      state.verifyOtpResponse = null;

      state.resendOtpResponse = null;
    },
  },

  extraReducers: builder => {
    /*
    |--------------------------------------------------------------------------
    | SEND OTP
    |--------------------------------------------------------------------------
    */

    builder

      .addCase(
        sendPhoneOtp.pending,

        state => {
          state.sendOtpLoading = true;

          state.error = null;

          state.otpSent = false;
        },
      )

      .addCase(
        sendPhoneOtp.fulfilled,

        (state, action) => {
          state.sendOtpLoading = false;

          state.otpSent = true;

          state.phone = action.payload.phone;

          state.sendOtpResponse = action.payload.response;

          state.error = null;
        },
      )

      .addCase(
        sendPhoneOtp.rejected,

        (state, action) => {
          state.sendOtpLoading = false;

          state.otpSent = false;

          state.error = action.payload;
        },
      );

    /*
    |--------------------------------------------------------------------------
    | VERIFY OTP
    |--------------------------------------------------------------------------
    */

    builder
      .addCase(verifyPhoneOtp.pending, state => {
        state.verifyOtpLoading = true;
        state.error = null;
      })

      .addCase(verifyPhoneOtp.fulfilled, (state, action) => {
        state.verifyOtpLoading = false;

        const response = action.payload;
        const isSuccessful =
          response?.success === 1 ||
          response?.success === '1' ||
          response?.success === true;

        if (isSuccessful && response?.token) {
          state.token = response.token;

          state.user = response.data ?? response.user ?? null;

          state.isAuthenticated = true;

          state.verifyOtpResponse = response;

          state.error = null;

          return;
        }

        state.token = null;

        state.user = null;

        state.isAuthenticated = false;

        state.error = response?.msg || 'OTP verification failed';
      })

      .addCase(verifyPhoneOtp.rejected, (state, action) => {
        state.verifyOtpLoading = false;

        state.isAuthenticated = false;

        state.token = null;

        state.user = null;

        state.error = action.payload || 'OTP verification failed';
      });

    /*
    |--------------------------------------------------------------------------
    | RESEND OTP
    |--------------------------------------------------------------------------
    */

    builder

      .addCase(
        resendPhoneOtp.pending,

        state => {
          state.resendOtpLoading = true;

          state.error = null;
        },
      )

      .addCase(
        resendPhoneOtp.fulfilled,

        (state, action) => {
          state.resendOtpLoading = false;

          state.resendOtpResponse = action.payload;

          state.otpSent = true;

          state.error = null;
        },
      )

      .addCase(
        resendPhoneOtp.rejected,

        (state, action) => {
          state.resendOtpLoading = false;

          state.error = action.payload;
        },
      );
  },
});

export const { setAuth, setUser, clearAuthError, resetOtp, logout } =
  authSlice.actions;

export default authSlice.reducer;
