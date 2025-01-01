import { AppBar, Box, Button, Grid, Toolbar, Typography, useMediaQuery, useTheme, Snackbar } from "@mui/material";
import { VideoCall } from "@mui/icons-material";
import { useState, useEffect, Fragment } from "react";
import { useNavigate } from "react-router-dom";
import { NettuLogoWithLabel } from "../shared/components/NettuLogoWithLabel";
import VideoModusImg from "../assets/pictures/videomodus.png";
import CanvasImg from "../assets/pictures/canvas.png";
import { meetingService } from "../modules/meeting/services";
import { apiConfig, frontendUrl } from "../config/api";
import { GithubRepoBadge } from "../shared/components/GithubRepoBadge";

const LandingPage = () => {
  const [imageIndex, setImageIndex] = useState(0);
  const theme = useTheme();
  const navigate = useNavigate();
  const isMobile = useMediaQuery(theme.breakpoints.down("xs"));

  useEffect(() => {
    const intervalId = setInterval(() => {
      setImageIndex((prevIndex) => (prevIndex + 1) % 2);
    }, 4000);
    return () => clearInterval(intervalId);
  }, []);

  const createDemoMeeting = async () => {
    const windowOpen = window.open();
    const demo = await meetingService.createDemoMeeting();
    if (demo) {
      const location = `${frontendUrl}/meeting/${demo.getValue().meetingId}`;
      if (windowOpen) {
        windowOpen.location = location;
      } else {
        window.open(location);
      }
    } else {
      alert("Unable to create a demo meeting");
    }
  };

  return (
    <Box sx={{ width: "100%", height: "100%", backgroundColor: theme.palette.background.default }}>
      <AppBar sx={{ backgroundColor: theme.palette.background.paper, boxShadow: "0 0 1px 0 rgba(0,0,0,0.31), 0 3px 4px -2px rgba(0,0,0,0.25)" }} position="fixed">
        <Toolbar>
          <NettuLogoWithLabel label="Video Meet" />
          <Box sx={{ display: "flex", alignItems: "center", ml: "auto" }}>
            {/* <GithubRepoBadge /> */}
            {!isMobile && (
              <Fragment>
                {/* <Button onClick={() => window.location.href = apiConfig.docsUrl} size="small" sx={{ ml: 3, fontWeight: 500 }}>
                  Documentation
                </Button> */}
                {/* <Box sx={{ mx: 1, height: 22, width: 1, backgroundColor: theme.palette.divider }} /> */}
                <Button variant="contained" color="primary" size="small" onClick={() => navigate("/create")}>
                  GET STARTED
                </Button>
              </Fragment>
            )}
          </Box>
        </Toolbar>
      </AppBar>

      <Toolbar />

      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", position: "fixed", top: "64px", left: 0, right: 0, bottom: 0 }}>
        <Grid container spacing={3} sx={{ height: "100%", maxWidth: "1550px", overflowY: "auto", px: 3 }}>
          <Grid item md={5}>
            <Box sx={{ display: "flex", flexDirection: "column", alignItems: "flex-start", justifyContent: "center", height: "100%" }}>
              <Typography sx={{ fontSize: "2.75rem", paddingBottom: "0.5em", lineHeight: "3.25rem", maxWidth: "35rem" }}>
                Open source video conferencing for tutors
              </Typography>
              {[...[
                "Audio and video: Real-time sharing of audio and video.",
                "Shared whiteboard: Collaborate with students on a shared whiteboard.",
                "Screen sharing: Go to presenting mode by sharing your screen.",
                "Chat: Send simple messages to other participants of the meeting.",
                "File sharing: Upload relevant files to the meeting.",
                "Graph plotter: Insert mathematical graphs to the whiteboard.",
                // "Customizable: Create an account and upload your own logos."
              ]].map((feature, idx) => (
                <Box key={idx} sx={{ display: "flex", alignItems: "center", margin: "4px" }}>
                  <Typography variant="body2" sx={{ fontWeight: 600, marginRight: "5px" }}>
                    {feature.split(":")[0]}:
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 400 }}>
                    {feature.split(":")[1]}
                  </Typography>
                </Box>
              ))}
              <Box sx={{ display: "flex", alignItems: "center", marginTop: "3em" }}>
                <Button variant="contained" color="primary" sx={{ padding: "8px 12px", fontWeight: 500, fontSize: ".875rem", display: "flex", alignItems: "center" }} onClick={createDemoMeeting}>
                  <VideoCall sx={{ mr: 1 }} />
                  New meeting
                </Button>
                {isMobile && (
                  <Button variant="outlined" onClick={() => navigate("/create")} sx={{ height: "58px", ml: 2 }}>
                    Create account
                  </Button>
                )}
              </Box>
            </Box>
          </Grid>
          {/* <Grid item md={7}>
            <Box sx={{ width: "100%", boxShadow: "0 1px 2px 0 rgba(60,64,67,0.302), 0 2px 6px 2px rgba(60,64,67,0.149)", backgroundColor: theme.palette.background.paper, borderRadius: "0.5rem", overflow: "hidden" }}>
              <img src={imageIndex === 0 ? VideoModusImg : CanvasImg} alt="Visual Representation" style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "0.5rem" }} />
            </Box>
          </Grid> */}
        </Grid>
      </Box>
    </Box>
  );
};

export default LandingPage;
