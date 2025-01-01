import { Paper, Tooltip, Typography, IconButton } from "@mui/material";
import { CloudDownloadOutlined, DeleteOutlined, AttachFileOutlined } from "@mui/icons-material";
import { styled } from "@mui/system"; // Import styled from MUI system

// Styled components using `styled` API
const Container = styled(Paper)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  justifyContent: "flex-start",
  padding: "0px 16px",
  borderRadius: "4px",
  boxShadow: '0px 4px 6px rgba(0, 0, 0, 0.1)', // Fallback to static value if not present
  boxSizing: "border-box",
}));

const Btns = styled("div")({
  display: "flex",
  alignItems: "center",
  justifyContent: "flex-end",
  marginLeft: "auto",
});

const Name = styled(Typography)({
  fontSize: "1rem",
});

interface Props {
  name: string;
  style?: React.CSSProperties;
  onDelete: () => void;
  onDownload?: () => void; // Optional function
}

export const FileComponent = (props: Props) => {
  return (
    <Container style={props.style}>
      <AttachFileOutlined
        style={{
          marginRight: "8px",
          fontSize: "1.1rem",
        }}
      />
      <Name>{props.name}</Name>
      <Btns>
        {props.onDownload && (
          <Tooltip placement="top" title="Download">
            <IconButton onClick={props.onDownload}>
              <CloudDownloadOutlined
                style={{
                  marginRight: "8px",
                  fontSize: "1.1rem",
                }}
              />
            </IconButton>
          </Tooltip>
        )}
        <Tooltip placement="top" title="Delete">
          <IconButton onClick={props.onDelete}>
            <DeleteOutlined
              style={{
                fontSize: "1.1rem",
              }}
            />
          </IconButton>
        </Tooltip>
      </Btns>
    </Container>
  );
};
