
import { createSlice } from '@reduxjs/toolkit';

// Load initial state from localStorage
const loadUserFromStorage = () => {
  try {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  } catch (error) {
    console.error('Error loading user from localStorage:', error);
    return null;
  }
};

const initialState = {
  user: loadUserFromStorage(),
  isAuthenticated: !!loadUserFromStorage(),
  token: localStorage.getItem('authToken') || null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    loginUser: (state, action) => {
      state.user = action.payload.user;
      state.token = action.payload.token || null;
      state.isAuthenticated = true;
      
      // Persist to localStorage
      localStorage.setItem('user', JSON.stringify(action.payload.user));
      if (action.payload.token) {
        localStorage.setItem('authToken', action.payload.token);
      }
    },
    logoutUser: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      
      // Clear localStorage
      localStorage.removeItem('user');
      localStorage.removeItem('authToken');
    },
    updateUser: (state, action) => {
      state.user = { ...state.user, ...action.payload };
      
      // Update localStorage
      localStorage.setItem('user', JSON.stringify(state.user));
    },
    setToken: (state, action) => {
      state.token = action.payload;
      localStorage.setItem('authToken', action.payload);
    },
  },
});

export const { loginUser, logoutUser, updateUser, setToken } = authSlice.actions;
export default authSlice.reducer;
