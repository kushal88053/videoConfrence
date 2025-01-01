import {
  AppBar,
  Box,
  Button,
  ButtonGroup,
  Divider,
  ThemeProvider,
  Toolbar,
  Typography,
} from "@mui/material";

import { makeStyles, createStyles } from "@mui/styles";
import { Fragment, useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { NettuLogoWithLabel } from "../shared/components/NettuLogoWithLabel";

import { CallEnd as LeaveIcon, VideocamOutlined as VideoCamIcon, VideocamOffRounded as VideoCamOffIcon, MicOutlined as MicIcon, MicOffRounded as MicOffIcon, ScreenShareOutlined as ScreenShareIcon, StopScreenShareOutlined as StopScreenShareIcon, SettingsOutlined as SettingsIcon } from "@mui/icons-material";

import { Timer } from "../shared/components/Timer";
import { CanvasToolbar } from "../modules/canvas/components/CanvasToolbar";
import { Canvas } from "../modules/canvas/components/Canvas";
import { ChatBtn } from "../modules/chat/components/ChatBtn";
import { PageMenu } from "../modules/canvas/components/PageMenu";
import { PeersVideoLayout } from "../modules/media/components/PeersVideoLayout";
import { meetingState } from "../modules/meeting/state/meeting";
import { meetingInteractor } from "../modules/meeting/interactors";
import { ChatDrawer } from "../modules/chat/components/ChatDrawer";
import { chatInteractor } from "../modules/chat/interactors/chatInteractor";
import { ResourceBtn } from "../modules/meeting/components/ResourceBtn";
import { ResourceDrawer } from "../modules/meeting/components/ResourceDrawer";
import { leaveRoom } from "../modules/media/state/utils";
import { useLayoutState } from "../shared/services/layout/layout";
import { darkTheme } from "../shared/services/theme/darkTheme";
import { lightTheme } from "../shared/services/theme/lightTheme";
import { useLocalStreams } from "../modules/media/state/state";
import { DeviceSelectPopover } from "../shared/components/DeviceSelectPopover";

import { Theme } from "@mui/material/styles";

const useStyles = makeStyles<Theme>((theme) =>
  createStyles({
    container: {
      width: "100%",
      height: "100%",
      backgroundColor: "#fff", // Fallback to default color
    },
    canvasPageMenu: {
      marginBottom: 16, // Fallback to 16px if theme.spacing is undefined
    },
    appbar: {
      backgroundColor: "#fff", // Fallback to default color
      boxShadow:
        "0 2px 2px 0 rgba(0,0,0,.14), 0 1px 5px 0 rgba(0,0,0,.12), 0 3px 1px -2px rgba(0,0,0,.2)",
    },
    body: {
      position: "relative",
    },
    videoSidebarContainer: {
      position: "fixed",
      right: 0,
      top: 0,
      bottom: 0,
      width: "400px",
      boxShadow: "0px 2px 4px rgba(0,0,0,0.2)", // Fallback to default shadow if theme.shadows is undefined
    },
    videoSidebar: {},
    meetingModeBtn: {
      height: "40px",
      width: "100%",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      color: "#fff",
      backgroundColor: "#29303b",
      fontSize: "1rem",
      "&:hover": {
        cursor: "pointer",
        backgroundColor: "#51575f",
      },
    },
  })
);

const styles = {
  mediaIcon: {
    fontSize: "1.2rem",
    color: "#3f51b5",
  },
  mediaIconActive: {
    color: "#fff",
  },
};

const MeetingRoom = () => {
  console.log("MeetingRoom");
  const classes = useStyles();
  const navigate = useNavigate();
  const { meetingId } = useParams<{ meetingId: string }>();

  const [, setS] = useState(Math.random());
  const [devicesAnchorEl, setDevicesAnchorEl] = useState<any>(null);

  const {
    config,
    muteAudio,
    unmuteAudio,
    muteScreen,
    unmuteScreen,
    muteWebcam,
    unmuteWebcam,
  } = useLocalStreams();
  const { meeting } = meetingState();
  const { videoMode, toggleVideoMode } = useLayoutState();

  const displayUpperToolbar = () => (
    <Toolbar variant="dense">
      <Box
        display="flex"
        alignItems="center"
        justifyContent="space-between"
        width="100%"
      >
        <NettuLogoWithLabel label={meeting ? meeting.title : "No titele"} />
        <ButtonGroup disableElevation color="primary">
          <Button
            variant={config.webcam ? "outlined" : "contained"}
            onClick={() => (config.webcam ? muteWebcam() : unmuteWebcam())}
          >
            {config.webcam ? (
              <VideoCamOffIcon style={styles.mediaIcon} />
            ) : (
              <VideoCamIcon
                style={{ ...styles.mediaIcon, ...styles.mediaIconActive }}
              />
            )}
          </Button>
          <Button
            variant={config.audio ? "outlined" : "contained"}
            onClick={() => (config.audio ? muteAudio() : unmuteAudio())}
          >
            {config.audio ? (
              <MicOffIcon style={styles.mediaIcon} />
            ) : (
              <MicIcon
                style={{ ...styles.mediaIcon, ...styles.mediaIconActive }}
              />
            )}
          </Button>
          <Button
            variant={config.screen ? "outlined" : "contained"}
            onClick={() => (config.screen ? muteScreen() : unmuteScreen())}
          >
            {config.screen ? (
              <StopScreenShareIcon style={styles.mediaIcon} />
            ) : (
              <ScreenShareIcon
                style={{ ...styles.mediaIcon, ...styles.mediaIconActive }}
              />
            )}
          </Button>
          <Button
            variant="contained"
            onClick={(e) => setDevicesAnchorEl(e.currentTarget)}
          >
            <SettingsIcon />
          </Button>
          <DeviceSelectPopover
            anchorEl={devicesAnchorEl}
            open={Boolean(devicesAnchorEl)}
            onClose={() => setDevicesAnchorEl(undefined)}
          />
        </ButtonGroup>
        <Box display="flex" alignItems="center" justifyContent="flex-end">
          {videoMode && (
            <Button
              color="primary"
              variant="outlined"
              size="small"
              style={{ marginRight: "15px" }}
              onClick={() => toggleVideoMode()}
            >
              TO CANVAS
            </Button>
          )}
          <ChatBtn chatInteractor={chatInteractor} />
          <ResourceBtn />
          <div style={{ width: "30px" }}></div>
          <Timer />
          <Button
            variant="outlined"
            color="secondary"
            size="small"
            style={{ marginLeft: "25px" }}
            onClick={async () => {
              if (!meeting) return;
              await leaveRoom();
              navigate(`${meeting.redirectURI}`);
            }}
            startIcon={<LeaveIcon />}
          >
            Leave
          </Button>
        </Box>
      </Box>
    </Toolbar>
  );

  const displayTopPadding = () => (
    <Fragment>
      <Toolbar variant="dense" />
      {videoMode ? null : (
        <Fragment>
          <Divider />
          <Toolbar variant="dense" />
        </Fragment>
      )}
    </Fragment>
  );

  useEffect(() => {
    const handleResize = () => {
      // Only update state if the window size has changed significantly
      setS((prevState) => (prevState !== Math.random() ? Math.random() : prevState));
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const displayCanvasModusBody = () => (
    <div
      style={{
        zIndex: videoMode ? -100 : undefined,
        position: videoMode ? "fixed" : undefined,
      }}
    >
      <div className={classes.canvasPageMenu}>
        <PageMenu
          pages={
            meeting
              ? meeting.canvasIds.map((canvasId: string) => ({
                id: canvasId,
                active: canvasId === meeting.activeCanvasId,
              }))
              : []
          }
          onChange={(canvasId) => meetingInteractor.setActiveCanvas(canvasId)}
          onCreate={() =>
            meetingInteractor.createCanvas(meetingId!)
          }
        />
      </div>
      <Canvas
        width={window.innerWidth - 400}
        height={window.innerHeight - 96}
      />
      <div className={classes.videoSidebarContainer}>
        {displayTopPadding()}
        <PeersVideoLayout
          sidebarMode={true}
          size={{
            width: 400,
            height: window.innerHeight - 97 - 40,
          }}
        />
        <div
          className={classes.meetingModeBtn}
          onClick={() => toggleVideoMode()}
        >
          <Typography>Video mode</Typography>
        </div>
      </div>
    </div>
  );

  const displayVideoModusBody = () => (
    <ThemeProvider theme={darkTheme}>
      <PeersVideoLayout
        sidebarMode={false}
        size={{
          width: window.innerWidth,
          height: window.innerHeight - 48,
        }}
      />
    </ThemeProvider>
  );

  const theme = videoMode ? darkTheme : lightTheme;

  return (
    <ThemeProvider theme={theme}>
      <div className={classes.container}>
        <AppBar
          position="fixed"
          className={classes.appbar}
          style={{
            backgroundColor: theme.palette.background.paper,
          }}
        >
          {displayUpperToolbar()}
          {!videoMode && <Divider />}
          {!videoMode && <CanvasToolbar />}
        </AppBar>
        <div className={classes.body}>
          {displayTopPadding()}
          {videoMode && displayVideoModusBody()}
          {displayCanvasModusBody()}
        </div>
        <ChatDrawer chatInteractor={chatInteractor} />
        <ResourceDrawer
          meetingInteractor={meetingInteractor}
          meetingId={meetingId || ""}
        />
      </div>
    </ThemeProvider>
  );
};

export default MeetingRoom;
