import { useState, useCallback, Fragment } from "react";
import { useDropzone } from "react-dropzone";
import clsx from "clsx";
import {
  Dialog,
  Paper,
  Button,
} from "@mui/material";
import { styled } from "@mui/system"; // Use styled from @mui/system
import { Resource } from "../../modules/meeting/domain/resource";
import { meetingInteractor } from "../../modules/meeting/interactors";
import { meetingState } from "../../modules/meeting/state/meeting";
import { FileComponent } from "./FileComponent";

// Styled components using @mui/system
const Container = styled(Paper)({
  width: "100%",
  padding: "24px",
  boxSizing: "border-box",
});

const Dropzone = styled("div")({
  width: "100%",
  height: "300px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  border: "2px dashed #DFE3E8",
  "&:hover": {
    backgroundColor: "#f2f4f7",
  },
});

const Files = styled("div")({
  margin: "24px",
});

interface UploadSuccessResponse {
  uploadedResources: Resource[];
}

interface Props {
  open: boolean;
  toCanvas?: boolean;
  accept?: string;
  onDone: (data: UploadSuccessResponse) => void;
  onClose: () => void;
}

export const FileUploadModal = (props: Props) => {
  const meeting = meetingState();
  const [files, setFiles] = useState<any[]>([]);

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      setFiles(
        [...files, ...acceptedFiles].map((f: File & { id?: string }) => {
          f.id = Math.random() + "";
          return f;
        })
      );
    },
    [files]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: props.accept ? { "application/*": [props.accept] } : undefined,
  });

  if (!meeting.meeting) {
    return <Fragment></Fragment>;
  }

  const meetingId = meeting.meeting.id;

  const removeFile = (fileId: string) => {
    setFiles([...files].filter((f) => f.id !== fileId));
  };

  const uploadFiles = async () => {
    const resources = [];
    for (const file of files) {
      try {
        const res = await meetingInteractor.createResource(
          file,
          meetingId,
          props.toCanvas ? meeting.meeting!.activeCanvasId : undefined
        );
        const resource = res.getValue().resource;
        resources.push(resource);
      } catch (error) {
        if (error instanceof Error && "response" in error) {
          alert((error as any).response.data.message);
        } else if (error instanceof Error) {
          alert(error.message);
        } else {
          alert("An unknown error occurred");
        }
      }
    }
    props.onDone({
      uploadedResources: resources,
    });
  };

  return (
    <Dialog
      maxWidth="sm"
      fullWidth
      open={props.open}
      onClose={() => props.onClose()}
    >
      <Container>
        <Dropzone
          {...getRootProps()}
          className={clsx({
            "drag-hover": isDragActive,
          })}
        >
          <input {...getInputProps()} />
          {isDragActive ? (
            <p>Drop the files here ...</p>
          ) : (
            <p>Drag 'n' drop some files here, or click to select files</p>
          )}
        </Dropzone>
        <Files>
          {files.map((f) => (
            <FileComponent
              name={f.name}
              key={f.id}
              style={{
                margin: "3px 0",
              }}
              onDelete={() => removeFile(f.id)}
            />
          ))}
        </Files>
        <Button
          color="primary"
          variant="contained"
          size="large"
          fullWidth
          onClick={() => uploadFiles()}
          disabled={files.length === 0}
          style={{ marginTop: "24px" }}
        >
          UPLOAD
        </Button>
      </Container>
    </Dialog>
  );
};
