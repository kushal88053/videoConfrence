import { Paper, ThemeProvider } from "@mui/material";
import React from "react";
import "./App.css";
import Routes from "./pages/routes";
import { lightTheme } from "./shared/services/theme/lightTheme";
import { useThemeState } from "./shared/services/theme/theme";

// Subscribers to canvasmanager
import "./modules/canvas/services/CanvasConnector";
// import "./modules/canvas/services/ImageCleanup";
function App() {
  const theme = lightTheme;

  console.log("Theme object:", theme); // Debug log

  return (
    <ThemeProvider theme={lightTheme}>
      <Paper
        square
        className="root"
        style={{
          backgroundColor:
            theme?.palette?.mode === "dark"
              ? theme?.palette?.background?.default || "#000000"
              : theme?.palette?.background?.default || "#ffffff",
        }}
      >
        <Routes />
      </Paper>
    </ThemeProvider>
  );
}


export default App;
