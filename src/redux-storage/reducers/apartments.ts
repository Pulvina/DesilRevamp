import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface Floor {
  id: number;
  name: string;
  picture: string;
  icon: string;
  data: number[][][];
}

export interface Apartment {
  id: string;
  name: string;
  client: string;
  createdAt: string;
  stage: string;
  progress: number;
  floors: Floor[];
  [key: string]: string | number | Floor[];
}

export interface User {
  id: string;
  role_id: string;
  username: string;
  apartments: Apartment[];
}

interface UsersState {
  list: User[];
}

interface UpdateFloorProps { 
  userId: string;
  apartmentId: string;
  floor: Floor;
}

interface UpdateApartmentProps {
  userId: string;
  apartment: Apartment;
}

const initialState: UsersState = {
  list: [],
};

const usersSlice = createSlice({
  name: 'users',
  initialState,
  reducers: {
    setUsers: (state, action: PayloadAction<User[]>) => {
      state.list = action.payload;
    },
    addUser: (state, action: PayloadAction<User>) => {
      state.list.push(action.payload);
    },
    updateUser: (state, action: PayloadAction<User>) => {
      const index = state.list.findIndex(user => user.id === action.payload.id);
      if (index !== -1) {
        state.list[index] = action.payload;
      }
    },
    addApartment: (state, action: PayloadAction<UpdateApartmentProps>) => {
      const { userId, apartment } = action.payload;
      const userIndex = state.list.findIndex(user => user.id === userId);
      if (userIndex !== -1) {
        state.list[userIndex].apartments.push(apartment);
      }
    },
    updateApartment: (state, action: PayloadAction<UpdateApartmentProps>) => {
      const { userId, apartment } = action.payload;
      const userIndex = state.list.findIndex(user => user.id === userId);
      if (userIndex !== -1) {
        const apartmentIndex = state.list[userIndex].apartments.findIndex(apt => apt.id === apartment.id);
        if (apartmentIndex !== -1) {
          state.list[userIndex].apartments[apartmentIndex] = apartment;
        }
      }
    },
    updateFloor: (state, action: PayloadAction<UpdateFloorProps>) => {
      const { userId, apartmentId, floor } = action.payload;
      const userIndex = state.list.findIndex(user => user.id === userId);
      if (userIndex !== -1) {
        const apartmentIndex = state.list[userIndex].apartments.findIndex(apt => apt.id === apartmentId);
        if (apartmentIndex !== -1) {
          const floorIndex = state.list[userIndex].apartments[apartmentIndex].floors.findIndex(f => f.id === floor.id);
          if (floorIndex !== -1) {
            console.log(floor)
            state.list[userIndex].apartments[apartmentIndex].floors[floorIndex] = {...state.list[userIndex].apartments[apartmentIndex].floors[floorIndex], ...floor};
          }
        }
      }
    },
    deleteApartment: (state, action: PayloadAction<{ userId: string; apartmentId: string }>) => {
      const { userId, apartmentId } = action.payload;
      const userIndex = state.list.findIndex(user => user.id === userId);
      if (userIndex !== -1) {
        state.list[userIndex].apartments = state.list[userIndex].apartments.filter(apt => apt.id !== apartmentId);
      }
    },
  },
});

export const { 
  setUsers, 
  addUser, 
  updateUser, 
  addApartment, 
  updateApartment, 
  updateFloor, 
  deleteApartment 
} = usersSlice.actions;

export default usersSlice.reducer;