import { LinearProgress, Paper, styled } from "@mui/material";
import { useState, useEffect } from "react";
import { NettuLogoProgress } from "./NettuLogoProgress";

// Styled components using MUI v5 `styled` API
const Container = styled(Paper)(({ theme }) => ({
  position: "relative",
  boxSizing: "border-box",
  width: "100%",
  height: "100%",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
}));

const BorderLinearProgress = styled(LinearProgress)(({ theme }) => ({
  position: "absolute",
  top: 0,
  left: 0,
  right: 0,
  height: "6px",
}));

interface Props {
  onDone: () => void;
  duration: number;
  style?: React.CSSProperties;
}

export const NettuProgress = (props: Props) => {
  return (
    <Container elevation={0} style={props.style}>
      <TopBorderProgress duration={props.duration} onDone={props.onDone} />
      <div style={{ width: "100px", height: "100px" }}>
        <NettuLogoProgress />
      </div>
    </Container>
  );
};

const TopBorderProgress = (props: Props) => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const incremener = 1 / props.duration;
    const timer = setInterval(() => {
      const calcNewProgress = (old: number) => {
        if (old >= 100) {
          props.onDone();
          return 100;
        }
        if (old < 10) {
          return old + 2 * incremener;
        }
        if (old < 30) {
          return old + 6 * incremener;
        }
        if (old < 50) {
          return old + 10 * incremener;
        }
        return old + 15 * incremener;
      };
      setProgress((prevProgress) => calcNewProgress(prevProgress));
    }, 100);

    return () => {
      clearInterval(timer);
    };
  }, [props]);

  return <BorderLinearProgress variant="determinate" value={progress} />;
};
