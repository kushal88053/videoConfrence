import { styled } from "@mui/system";
import { Typography } from "@mui/material";
import { useState } from "react";
import NettuLetter from "../../assets/logos/NettuLetter.png";
import { meetingState } from "../../modules/meeting/state/meeting";

// Styled components using the `styled` API
const Container = styled("div")({
  display: "flex",
  alignItems: "center",
  justifyContent: "flex-start",
});

const LogoLetter = styled("div")({
  height: "35px",
  width: "35px",
  marginRight: "14px",
  borderRadius: "50%",
  backgroundColor: "#fff",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  overflow: "hidden",
  "& img": {
    height: "35px",
  },
});

const LogoTitle = styled(Typography)({
  fontSize: "1rem",
  margin: 0,
  textOverflow: "ellipsis",
  maxWidth: "200px",
});

interface Props {
  label: string;
}

export const NettuLogoWithLabel = (props: Props) => {
  console.log("NettuLogoWithLabel", props);
  const { meeting } = meetingState();
  const [imgLoadError, setImgLoadError] = useState(false);

  const imgSrc =
    meeting && meeting.account.iconURL && !imgLoadError
      ? meeting.account.iconURL
      : NettuLetter;

  return (
    <Container>
      <LogoLetter>
        <img src={imgSrc} alt="Video Meet" onError={() => setImgLoadError(true)} />
      </LogoLetter>
      <LogoTitle color="textSecondary" align="left" noWrap>
        {props.label}
      </LogoTitle>
    </Container>
  );
};
