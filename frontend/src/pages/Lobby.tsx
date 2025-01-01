/**
 * This is the entrypage where users will first arrive from the external application.
 * https://meet.nettu.no/:roomId/:code?
 * - roomId is the room which the user wants to access
 * - code is an optional param provided by the external application that can be used to retrieve user information
 * The entry page will just redirect the user and not display anything other than a splash screen
 * - if meetingroom is public then redirect to lobby with or without valid code
 * - if meetingroom is private then redirect to lobby if valid code otherwise to signup page
 */import {
  Button,
  Paper,
  Tooltip,
  TextField,
} from "@mui/material";
import { makeStyles } from "@mui/styles";
import MicOffIcon from "@mui/icons-material/MicOffRounded";
import MicIcon from "@mui/icons-material/MicOutlined";
import VideoCamOffIcon from "@mui/icons-material/VideocamOffRounded";
import VideoCamIcon from "@mui/icons-material/VideocamOutlined";
import SettingsIcon from "@mui/icons-material/SettingsOutlined";
import clsx from "clsx";
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom"; // Updated to useNavigate
import { chatInteractor } from "../modules/chat/interactors/chatInteractor";
import { useSoundMeter } from "../modules/media/services/SoundMeter";
import {
  requestPermissions,
  useLocalStreams,
  useProducerStore,
} from "../modules/media/state/state";
import { joinRoom } from "../modules/media/state/utils";
import { meetingInteractor } from "../modules/meeting/interactors";
import { meetingState } from "../modules/meeting/state/meeting";
import { NettuLogoWithLabel } from "../shared/components/NettuLogoWithLabel";
import { DeviceSelectPopover } from "../shared/components/DeviceSelectPopover";

const useStyles = makeStyles((theme: any) => ({
  container: {
    width: "100%",
    height: "100%",
    backgroundColor: "#fff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  body: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "column",
    width: "700px",
    maxWidth: "95%",
  },
  header: {
    position: "fixed",
    left: 0,
    right: 0,
    top: 0,
    minHeight: "40px",
    display: "flex",
    alignItems: "center",
    justifyContent: "flex-start",
    padding: "16px 16px 0 16px",
  },
  videoPreview: {
    width: "100%",
    height: "420px",
    boxShadow:
      "0 1px 2px 0 rgba(60,64,67,.30), 0 1px 3px 1px rgba(60,64,67,.15)",
    overflow: "hidden",
    borderRadius: "8px",
    backgroundColor: "#202124",
    position: "relative",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
    "& video": {
      width: "100%",
      flex: 1,
      transform: "rotateY(180deg)", // Flip the video for correct orientation
    },
  },
  videPreviewFade: {
    height: "80px",
    position: "absolute",
    left: 0,
    right: 0,
    width: "100%",
    zIndex: 1,
  },
  videPreviewFadeTop: {
    top: 0,
    backgroundImage:
      "-webkit-linear-gradient(top,rgba(0,0,0,0.7) 0,rgba(0,0,0,0.3) 50%,rgba(0,0,0,0) 100%)",
  },
  videPreviewFadeBottom: {
    bottom: 0,
    backgroundImage:
      "-webkit-linear-gradient(bottom,rgba(0,0,0,0.7) 0,rgba(0,0,0,0.3) 50%,rgba(0,0,0,0) 100%)",
  },
  controls: {
    margin: "30px auto",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  control: {
    width: "56px",
    height: "56px",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    border: "1px solid #d93025",
    backgroundColor: "#d93025",
    color: "#fff",
    margin: "0 7px",
    boxShadow: theme?.shadows ? theme.shadows[2] : "0px 2px 4px rgba(0,0,0,0.2)", // Check theme.shadows before using
    "&:hover": {
      cursor: "pointer",
      boxShadow: theme?.shadows ? theme.shadows[2] : "0px 2px 4px rgba(0,0,0,0.2)", // Check theme.shadows before using
    },
  },
  controlEnabled: {
    borderColor: theme?.palette?.primary?.main || "#1976d2", // Fallback if primary color is undefined
    backgroundColor: theme?.palette?.primary?.main || "#1976d2", // Fallback if primary color is undefined

  },
  settings: {
    borderColor: theme?.palette?.grey?.[600] || "#757575", // Fallback if grey[600] is undefined
    backgroundColor: theme?.palette?.grey?.[600] || "#757575", // Fallback if grey[600] is undefined
  },
}));

interface Props { }

const NAME_LOCAL_STORAGE_KEY = "nettu-meet-display-name";

const Lobby = () => {
  const classes = useStyles();
  const videoRef = useRef<any>();
  const navigate = useNavigate(); // Using navigate from react-router

  const {
    audio,
    webcam,
    config,
    muteAudio,
    unmuteAudio,
    muteWebcam,
    unmuteWebcam,
  } = useLocalStreams();

  const [stream, setStream] = useState(new MediaStream());
  const [name, setName] = useState(localStorage.getItem(NAME_LOCAL_STORAGE_KEY) || "");
  const [devicesAnchorEl, setDevicesAnchorEl] = useState<any>(null);
  const [isJoining, setIsJoining] = useState(false);  // State to show loading feedback

  useEffect(() => {
    const mediaStream = new MediaStream();
    if (config.audio) mediaStream.addTrack(audio.getTracks()[0]);
    setStream(mediaStream);
  }, [config.audio]);

  useEffect(() => {
    videoRef.current.srcObject = webcam;
  }, [config.webcam]);

  useEffect(() => {
    requestPermissions();
  }, []);

  const { meeting } = meetingState();

  const soundMeter = useSoundMeter(stream);

  const goToMeeting = async () => {
    if (!meeting) {
      alert("Unable to join meeting, meeting could not be found. Please refresh and try again.");
      return;
    }

    setIsJoining(true);  // Set joining state to true to show loading feedback
    localStorage.setItem(NAME_LOCAL_STORAGE_KEY, name);

    try {
      await joinRoom(meeting.id, name);
      useProducerStore.getState().onStreamUpdate(useLocalStreams.getState());
      chatInteractor.setup();
      meetingInteractor.moveToMeetingRoom();
    } catch (error) {
      console.error("Error joining meeting:", error);
      alert("An error occurred while joining the meeting. Please try again.");
    } finally {
      setIsJoining(false);  // Reset loading state
    }
  };

  const isMeetingBtnLinkActive = () => {
    return name.length > 0 && (stream != null || (!config.audio && !config.webcam));
  };

  const soundTickers = Array.from({ length: 100 }, (_, i) => (i + 1) * 0.01);

  return (
    <div className={classes.container}>
      <div className={classes.header}>
        <NettuLogoWithLabel label="Video Meet" />
      </div>
      <div className={classes.body}>
        <Paper className={classes.videoPreview}>
          <div className={clsx(classes.videPreviewFade, classes.videPreviewFadeTop)}></div>
          <video ref={videoRef} id="tester" autoPlay muted></video>
          <div className={clsx(classes.videPreviewFade, classes.videPreviewFadeBottom)}></div>
        </Paper>
        <div className={classes.controls}>
          <Tooltip placement="bottom" title={config.audio ? "Mute microphone" : "Unmute microphone"}>
            <div
              className={clsx(classes.control, { [classes.controlEnabled]: config.audio })}
              onClick={() => (config.audio ? muteAudio() : unmuteAudio())}
            >
              {config.audio ? <MicIcon /> : <MicOffIcon />}
            </div>
          </Tooltip>

          <Tooltip placement="bottom" title={config.webcam ? "Turn off webcam" : "Turn on webcam"}>
            <div
              className={clsx(classes.control, { [classes.controlEnabled]: config.webcam })}
              onClick={() => (config.webcam ? muteWebcam() : unmuteWebcam())}
            >
              {config.webcam ? <VideoCamIcon /> : <VideoCamOffIcon />}
            </div>
          </Tooltip>

          <Tooltip placement="bottom" title={"Switch input device"}>
            <div
              className={clsx(classes.control, classes.settings)}
              onClick={(e) => {
                setDevicesAnchorEl(e.currentTarget);
                requestPermissions();
              }}
            >
              <SettingsIcon />
            </div>
          </Tooltip>
          <DeviceSelectPopover
            anchorEl={devicesAnchorEl}
            open={Boolean(devicesAnchorEl)}
            onClose={() => setDevicesAnchorEl(undefined)}
          />
        </div>
        {config.audio && (
          <div className="flex-center" style={{ margin: "20px" }}>
            {soundTickers.map((i) => (
              <div
                key={i}
                style={{
                  width: "2px",
                  height: "10px",
                  margin: "1px",
                  backgroundColor: i <= soundMeter.meter ? "#69ce2b" : "#e6e7e8",
                }}
              ></div>
            ))}
          </div>
        )}
        <TextField
          variant="filled"
          value={name}
          placeholder="Your name ..."
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setName(e.target.value)}
          fullWidth
          style={{ marginBottom: "20px" }}
        />
        <Button
          onClick={goToMeeting}
          variant="contained"
          color="secondary"
          fullWidth
          disabled={!isMeetingBtnLinkActive() || isJoining}
        >
          {isJoining ? "Joining..." : "Join Meeting"}
        </Button>
      </div>
    </div>
  );
};

export default Lobby;
