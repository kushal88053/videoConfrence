import React, { ChangeEvent, useEffect, useRef, useState } from "react";
import {
  Button,
  Drawer,
  Paper,
  Typography,
  Theme,
  CssBaseline,
} from "@mui/material";
import { CloudUploadOutlined } from "@mui/icons-material";
import { makeStyles } from "@mui/styles"; // Correct import
import { FileComponent } from "../../../shared/components/FileComponent";
import { FileUploadModal } from "../../../shared/components/FileUploadModal";
import { Resource } from "../domain/resource";
import { IMeetingInteractor } from "../interactors/meetingInteractor";
import { meetingState } from "../state/meeting";
import { useResourceDrawer } from "../state/resourceDrawer";
import { ThemeProvider, createTheme } from "@mui/material/styles";

const useStyles = makeStyles<Theme>((theme) => ({
  container: {
    width: "420px",
    height: "100%",
    overflow: "hidden",
    position: "relative",
  },
  header: {
    height: "60px",
    borderBottom: `1px solid ${theme?.palette?.divider || '#e0e0e0'}`, // Fallback to static color
    boxSizing: "border-box",
    padding: "16px",
    display: "flex",
    alignItems: "center",
  },
  title: {
    fontWeight: 500,
    fontSize: "1.2rem",
  },
  resources: {
    height: `calc(100vh - 140px)`,
    position: "absolute",
    right: 0,
    bottom: 80,
    left: 0,
    top: 60,
    overflowY: "auto",
    backgroundColor: theme?.palette?.background?.default || "#fafafa", // Fallback to a light background color
  },
  resourceCreator: {
    position: "absolute",
    left: 0,
    bottom: 0,
    right: 0,
    zIndex: 10,
    backgroundColor: theme?.palette?.background?.paper || "#ffffff", // Fallback to white if undefined
    minHeight: "80px",
    borderTop: `1px solid ${theme?.palette?.divider || '#e0e0e0'}`, // Fallback to a static color
    boxSizing: "border-box",
    padding: "16px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
  },
  file: {
    width: "95%",
    height: "35px",
    boxShadow: theme?.shadows ? theme.shadows[1] : "0px 2px 4px rgba(0, 0, 0, 0.1)", // Fallback to a default shadow
    margin: "4px auto",
  },
}));


interface Props {
  meetingInteractor: IMeetingInteractor;
  meetingId: string;
}

export const ResourceDrawer: React.FC<Props> = (props) => {
  const classes = useStyles();
  const { meeting } = meetingState();
  const { visible, toggle } = useResourceDrawer();
  const [isUploading, setIsUploading] = useState(false);

  if (!meeting) return <div />;

  const deleteResource = (resourceId: string) => {
    props.meetingInteractor.deleteResource(meeting.id, resourceId);
  };

  const downloadResource = ({ name, publicURL }: Resource) => {
    const link = document.createElement("a");
    link.download = name;
    link.href = publicURL;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Drawer anchor="left" open={visible} onClose={toggle}>
      <Paper square className={classes.container}>
        <div className={classes.header}>
          <Typography className={classes.title} color="textPrimary">
            Attachments
          </Typography>
        </div>
        <div className={classes.resources}>
          {meeting.resources.map((r: Resource) => (
            <FileComponent
              name={r.name}
              key={r.id}
              style={{
                margin: "3px auto",
                width: "95%",
              }}
              onDownload={() => downloadResource(r)}
              onDelete={() => deleteResource(r.id)}
            />
          ))}
          <AlwaysScrollToBottom />
        </div>
        <div className={classes.resourceCreator}>
          <Button
            color="primary"
            variant="contained"
            fullWidth
            onClick={() => setIsUploading(true)}
            startIcon={<CloudUploadOutlined />}
            size="large"
          >
            UPLOAD
          </Button>
        </div>
      </Paper>
      {isUploading && (
        <FileUploadModal
          open
          onClose={() => setIsUploading(false)}
          onDone={() => setIsUploading(false)}
        />
      )}
    </Drawer>
  );
};

const AlwaysScrollToBottom: React.FC = () => {
  const elementRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (elementRef.current) {
      elementRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, []);

  return <div ref={elementRef} />;
};

// Wrapping component with ThemeProvider
const theme = createTheme();

const App: React.FC = () => {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <ResourceDrawer
        meetingInteractor={{} as IMeetingInteractor}
        meetingId="sample-meeting-id"
      />
    </ThemeProvider>
  );
};

export default App;
