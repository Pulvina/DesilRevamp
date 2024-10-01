import { RootState } from 'redux-storage/store';

export const selectUserId = (state: RootState) => state.auth.user?.id;