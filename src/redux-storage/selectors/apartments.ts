import { createSelector } from '@reduxjs/toolkit';
import { Apartment, User } from 'redux-storage/reducers/apartments';
import { RootState } from 'redux-storage/store';

export const selectUsers = (state: RootState): User[] => state.apartments.list;