import { createSlice, configureStore } from '@reduxjs/toolkit';
import cartSlice from './cartSlice';

// Simple auth slice
const authSlice = createSlice({
  name: 'auth',
  initialState: {
    user: JSON.parse(localStorage.getItem('user')) || null,
    company: JSON.parse(localStorage.getItem('company')) || null,
    isAuthenticated: !!localStorage.getItem('token'),
  },
  reducers: {
    setCredentials: (state, action) => {
      state.user = action.payload.user;
      state.company = action.payload.company;
      state.isAuthenticated = true;
    },
    logout: (state) => {
      state.user = null;
      state.company = null;
      state.isAuthenticated = false;
    },
  },
});

export const { setCredentials, logout } = authSlice.actions;


export const store = configureStore({
  reducer: {
    auth: authSlice.reducer,
    cart: cartSlice.reducer,
    cart: cartSlice,
  },
});

