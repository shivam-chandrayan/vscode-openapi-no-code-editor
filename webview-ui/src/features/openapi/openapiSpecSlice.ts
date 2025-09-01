import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";

export interface OpenAPISpecState {
  specData: {
    openapi: string;
    info: {
      title: string;
      description: string;
      version: string;
    };

    servers: {
      url: string;
      description: string;
    }[];
  };
}

const initialState: OpenAPISpecState = {
  specData: {
    openapi: "",
    info: {
      title: "",
      description: "",
      version: "",
    },

    servers: [],
  },
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
