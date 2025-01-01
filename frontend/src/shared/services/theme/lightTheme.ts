import { createTheme } from "@mui/material/styles";

export const lightTheme = createTheme({
  palette: {
    mode: "light",
    background: {
      paper: "#fff",
      default: "#f2f4f6",
    },
    text: {
      primary: "#263238",
      secondary: "#546e7a",
    },
  },
});
