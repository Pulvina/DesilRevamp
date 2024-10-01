import { configureStore } from '@reduxjs/toolkit'

import apartmentsReducer from './reducers/apartments'
import authReducer from './reducers/auth'

export const store = configureStore({
  reducer: {
    apartments: apartmentsReducer,
    auth: authReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch