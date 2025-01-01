import { Theme, Typography } from "@mui/material";
import { alpha } from "@mui/material/styles";
import { makeStyles } from "@mui/styles";
import PersonIcon from "@mui/icons-material/PersonOutline"; // Corrected import for MUI v5
import { clsx } from "clsx"; // clsx is correct for conditional classnames
import { Person, SwapCalls } from "@mui/icons-material"; // Corrected import for MUI v5

const color = "#673ab7";

const useStyles = makeStyles<Theme>((theme) => ({
  container: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "column",
    position: "relative",
  },
  containerSpeaking: {
    boxShadow: theme?.shadows?.[12] || '0px 4px 12px rgba(0, 0, 0, 0.3)',  // Static fallback shadow
    transform: "scale(1.04)",
    border: "2px solid #673ab7",
    borderRadius: "50%",
  },
  speaking: {
    backgroundColor: "#673ab7",
    color: "#673ab7",
    animation: "$ripple 0.9s linear infinite",
    borderRadius: "50%",
    position: "absolute",
    transform: "scale(1.1)",
    boxShadow: `0 0 0 5em ${alpha(color, 0.1)}`,
    zIndex: -1,
  },
  avatar: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#673ab7",
    color: "#fff",
    borderRadius: "50%",
    boxShadow: theme?.shadows?.[10] || '0px 4px 6px rgba(0, 0, 0, 0.1)',  // Static fallback shadow
  },
  nameInitials: {
    color: "#fff",
    fontSize: "1.4rem",
    textAlign: "center",
    zIndex: 3,
  },
  "@keyframes ripple": {
    "0%": {
      boxShadow: `0 0 0 0 ${alpha(color, 0.3)}, 0 0 0 1em ${alpha(color, 0.3)}, 0 0 0 3em ${alpha(color, 0.3)}, 0 0 0 5em ${alpha(color, 0.3)}`,
    },
    "100%": {
      boxShadow: `0 0 0 1em ${alpha(color, 0.3)}, 0 0 0 3em ${alpha(color, 0.3)}, 0 0 0 5em ${alpha(color, 0.3)}, 0 0 0 8em ${alpha(color, 0)}`,
    },
  },
}));

interface Props {
  fullName?: string;
  size: string;
  isSpeaking: boolean;
}

export const UserAvatar = (props: Props) => {
  const classes = useStyles();

  const nameInitials = props.fullName
    ? props.fullName
      .split(" ")
      .map((n) => n[0].toUpperCase())
      .join("")
    : "";

  let unit = "px";
  let size = 0;

  // Extract size and unit (e.g., "40px", "3rem", etc.)
  for (const u of ["px", "rem", "em"]) {
    if (props.size.includes(u)) {
      unit = u;
      size = parseFloat(props.size.replace(u, ""));
      break;
    }
  }

  return (
    <div
      className={clsx(classes.container, {
        [classes.containerSpeaking]: props.isSpeaking,
      })}
    >
      <div
        className={classes.avatar}
        style={{
          width: props.size,
          height: props.size,
        }}
      >
        {props.isSpeaking && (
          <div
            className={classes.speaking}
            style={{
              width: size / 3 + unit,
              height: size / 3 + unit,
            }}
          ></div>
        )}
        {props.fullName ? (
          <Typography className={classes.nameInitials}>
            {nameInitials}
          </Typography>
        ) : (
          <PersonIcon
            style={{
              fontSize: "3rem",
            }}
          />
        )}
      </div>
    </div>
  );
};
