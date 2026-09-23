import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { WorkItemStatus } from '@/types/work-item';

interface FilterState {
  statusFilter: WorkItemStatus | 'ALL';
}

const initialState: FilterState = {
  statusFilter: 'ALL',
};

export const filterSlice = createSlice({
  name: 'filter',
  initialState,
  reducers: {
    setStatusFilter(state, action: PayloadAction<WorkItemStatus | 'ALL'>) {
      state.statusFilter = action.payload;
    },
  },
});

export const { setStatusFilter } = filterSlice.actions;
export default filterSlice.reducer;