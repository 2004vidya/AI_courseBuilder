// src/redux/courseSlice.js
import { createSlice } from '@reduxjs/toolkit';

const courseSlice = createSlice({
  name: 'course',
  initialState: {
    currentCourse: null,
  },
  reducers: {
    setCourseData: (state, action) => {
      state.currentCourse = action.payload;
    },
    clearCourseData: (state) => {
      state.currentCourse = null;
    },
  },
});

export const { setCourseData, clearCourseData } = courseSlice.actions;
export default courseSlice.reducer;
