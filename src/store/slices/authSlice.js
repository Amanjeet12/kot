import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: true,
};

const authSlice = createSlice({
  name: 'auth',

  initialState,

  reducers: {
    setAuth: (state, action) => {
      state.user = action.payload.user;
      state.token = action.payload.token;
      state.isAuthenticated = true;
      state.isLoading = false;
    },

    setUser: (state, action) => {
      state.user = action.payload;
    },

    setAuthLoading: (state, action) => {
      state.isLoading = action.payload;
    },

    logout: state => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      state.isLoading = false;
    },
  },
});

export const { setAuth, setUser, setAuthLoading, logout } = authSlice.actions;

export default authSlice.reducer;
