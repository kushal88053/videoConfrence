import {  Paper, Typography } from "@mui/material";
import { makeStyles } from "@mui/styles";
import { blue, red } from "@mui/material/colors";
import { detectDevice } from "mediasoup-client";
import { AccessTime, Error } from "@mui/icons-material";
import clsx from "clsx";
import { Fragment, useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Supports } from "../modules/media/services/support";
import { meetingInteractor } from "../modules/meeting/interactors";
import { meetingState } from "../modules/meeting/state/meeting";
import { NettuProgress } from "../shared/components/NettuProgress";
import bowser from "bowser";
import { logger } from "../logger";

const useStyles = makeStyles((theme) => ({
  container: {
    width: "100%",
    height: "100%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  card: {
    width: "400px",
    height: "430px",
    maxWidth: "95%",
    boxShadow: "0 4px 6px rgba(32,33,36,.28)",
    overflow: "hidden",
    borderBottomLeftRadius: "8px",
    borderBottomRightRadius: "8px",
  },
  errorCard: {
    borderTop: `4px solid ${red["700"]}`,
    boxSizing: "border-box",
    padding: "30px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "column",
  },
  errorIcon: {
    marginBottom: "25px",
  },
  errorText: {
    color: red["700"],
    fontWeight: 500,
    fontSize: "1.2rem",
  },
  waitingCard: {
    borderTop: `4px solid ${blue["700"]}`,
    boxSizing: "border-box",
    padding: "30px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "column",
  },
  waitingIcon: {
    marginBottom: "25px",
  },
  waitingText: {
    fontWeight: 500,
    fontSize: "1.2rem",
  },
}));

function deviceInfo() {
  const ua = navigator.userAgent;
  const browser = bowser.getParser(ua);

  let flag;

  if (browser.satisfies({ chrome: ">=0", chromium: ">=0" })) flag = "chrome";
  else if (browser.satisfies({ firefox: ">=0" })) flag = "firefox";
  else if (browser.satisfies({ safari: ">=0" })) flag = "safari";
  else if (browser.satisfies({ opera: ">=0" })) flag = "opera";
  else if (browser.satisfies({ "microsoft edge": ">=0" })) flag = "edge";
  else flag = "unknown";

  return {
    flag,
    os: browser.getOSName(true), // ios, android, linux...
    platform: browser.getPlatformType(true), // mobile, desktop, tablet
    name: browser.getBrowserName(true),
    version: browser.getBrowserVersion(),
    browser,
  };
}

interface RouteParams {
  meetingId: string;
}

const EntryPage = () => {
  const classes = useStyles();
  const navigate = useNavigate();
  const { meetingId } = useParams<Record<string, string>>();

  const isSupportedBrowser =
    Supports.isBrowserSupported() && Supports.isWebRTCSupported();

  const [dummyProgressDone, setDummyProgressDone] = useState(false);

  const { meeting, isLoadingMeeting } = meetingState();
  const [error, setError] = useState({
    tooEarly: false,
    tooLate: false,
    notFound: false,
    browser: false,
  });

  useEffect(() => {
    try {
      const supportedBrowsers = {
        windows: {
          "internet explorer": ">12",
        },
        safari: ">12",
        firefox: ">=60",
        chrome: ">=74",
        chromium: ">=74",
        opera: ">=62",
        "samsung internet for android": ">=11.1.1.52",
        "Microsoft Edge": ">18",
      };
      // Get current device.
      const device = deviceInfo();
      if (
        navigator.mediaDevices === undefined ||
        navigator.mediaDevices.getUserMedia === undefined ||
        window.RTCPeerConnection === undefined
      ) {
        logger.error(
          'Your browser is not supported [deviceInfo:"%o"]',
          device
        );
        throw "Webrtc not supported";
      } else if (!device.browser.satisfies(supportedBrowsers)) {
        logger.error(
          'Your browser is not supported [deviceInfo:"%o"]',
          device
        );

        throw "Webrtc not supported";
      }

      const handlerName = detectDevice();
      if (handlerName) {
        logger.info("detected handler: %s", handlerName);
      } else {
        logger.warn("no suitable handler found for current browser/device");
        throw "Bad device";
      }
    } catch (error) {
      const urlSearchParams = new URLSearchParams(window.location.search);
      const params = Object.fromEntries(urlSearchParams.entries());
      if (params.ignoreBrowser) {
        meetingInteractor.moveToMeetingLobby();
        return;
      }
      setError((error) => ({
        ...error,
        browser: true,
      }));
    }
  }, []);

  useEffect(() => {
      if (meetingId) {
        meetingInteractor.getMeetingById(meetingId);
      }
    }, [meetingId]);

  useEffect(() => {
    if (dummyProgressDone && !isLoadingMeeting && isSupportedBrowser) {
      if (meeting == null) {
        setError((error) => ({
          ...error,
          notFound: true,
        }));
        return;
      }
      if (meeting && meeting.openingTime) {
        if (meeting.openingTime.startTS > new Date().valueOf()) {
          setError((error) => ({
            ...error,
            tooEarly: true,
          }));
          setTimeout(() => {
            window.location.reload();
          }, meeting.openingTime.startTS - new Date().valueOf());
          return;
        }
        if (meeting.openingTime.endTS < new Date().valueOf()) {
          setError((error) => ({
            ...error,
            tooLate: true,
          }));
          return;
        }
        setTimeout(() => {
          alert("Meeting has now closed");
          window.location.href = meeting.redirectURI;
        }, meeting.openingTime.endTS - new Date().valueOf());
      }
      meetingInteractor.moveToMeetingLobby();
    }
  }, [dummyProgressDone, isLoadingMeeting, meeting, isSupportedBrowser]);

  const displayLoading = () => (
    <Paper className={classes.card}>
      <NettuProgress onDone={() => setDummyProgressDone(true)} duration={0.1} />
    </Paper>
  );

  const displayUnsupportedBrowser = () => (
    <Paper className={clsx(classes.card, classes.errorCard)}>
      <div className={classes.errorIcon}>
        <Error
          style={{
            color: red[700],
            fontSize: "4rem",
          }}
        />
      </div>
      <Typography className={classes.errorText} align="center">
        This browser is not supported, please use the most recent version of
        Chrome or Safari.
      </Typography>
    </Paper>
  );

  const displayNotFound = () => (
    <Paper className={clsx(classes.card, classes.errorCard)}>
      <div className={classes.errorIcon}>
        <Error
          style={{
            color: red[700],
            fontSize: "4rem",
          }}
        />
      </div>
      <Typography className={classes.errorText} align="center">
        This meeting does not exist
      </Typography>
    </Paper>
  );

  const displayTooLate = () => (
    <Paper className={clsx(classes.card, classes.errorCard)}>
      <div className={classes.errorIcon}>
        <AccessTime
          style={{
            color: red[700],
            fontSize: "4rem",
          }}
        />
      </div>
      <Typography className={classes.errorText} align="center">
        This meeting has finished and is closed
      </Typography>
    </Paper>
  );

  const displayTooEarly = () => (
    <Paper className={clsx(classes.card, classes.waitingCard)}>
      <div className={classes.waitingIcon}>
        <AccessTime
          style={{
            color: blue[700],
            fontSize: "4rem",
          }}
        />
      </div>
      <Typography className={classes.waitingText} align="center">
        This meeting will open in:{" "}
        <CountDown startTS={meeting!.openingTime!.startTS + 1000 * 60 * 60} />
      </Typography>
    </Paper>
  );

  const anyError =
    error.notFound || error.tooEarly || error.tooLate || error.browser;

  return (
    <div className={classes.container}>
      {!anyError
        ? displayLoading()
        : error.browser
        ? displayUnsupportedBrowser()
        : error.notFound
        ? displayNotFound()
        : error.tooLate
        ? displayTooLate()
        : displayTooEarly()}
    </div>
  );
};

interface CountDownProps {
  startTS: number;
}

const CountDown = (props: CountDownProps) => {
  const [{ minutes, seconds }, setTime] = useState({
    minutes: 0,
    seconds: 0,
  });

  useEffect(() => {
    const int = setInterval(() => {
      const secs = Math.floor((props.startTS - new Date().valueOf()) / 1000);
      if (secs < 0) {
        setTime({ minutes: 0, seconds: 0 });
        clearInterval(int);
      } else {
        setTime({
          minutes: Math.floor(secs / 60),
          seconds: secs % 60,
        });
      }
    }, 1000);

    return () => clearInterval(int);
  }, [props.startTS]);

  return (
    <Fragment>
      {minutes < 10 ? "0" + minutes : minutes}:
      {seconds < 10 ? "0" + seconds : seconds}
    </Fragment>
  );
};

export default EntryPage;
