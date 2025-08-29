import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";

export interface OpenAPISpecState {
  title: string;
  version: string;
  description: string;
}

const initialState: OpenAPISpecState = {
  title: "",
  version: "",
  description: "",
};

export const oepnAPISpecSlice = createSlice({
  name: "openAPISpec",
  initialState,
  reducers: {
    setSpec: (state, action: PayloadAction<OpenAPISpecState>) => {
      return { ...state, ...action.payload };
    },
  },
});

// Action creators are generated for each case reducer function
export const { setSpec } = oepnAPISpecSlice.actions;

export default oepnAPISpecSlice.reducer;
