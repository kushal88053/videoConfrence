import { Avatar, Box, createStyles, Theme } from "@mui/material";
import clsx from "clsx";
import React from "react";
import { makeStyles } from "@mui/styles";
import { ChatMessage } from "../models/chat";

// Fix the styles to work with the theme
const useStyles = makeStyles<Theme>((theme) =>
  createStyles({
    root: {
      margin: "30px 14px",
    },
    profilePicture: {
      marginRight: "16px",
      marginLeft: "16px",
      width: "40px",
      height: "40px",
    },
    messageContainer: {
      backgroundColor:
        theme.palette.mode === "dark"
          ? "rgba(255, 255, 255, 0.16)"
          : theme.palette.background.default,
      color:
        theme.palette.mode === "dark"
          ? theme.palette.text.secondary
          : "#737980",
      padding: "12px 15px",
      borderRadius: "8px",
      width: "400px",
    },
    myMessageContainer: {
      backgroundColor: "#3082ff",
      color: "#fff",
    },
  })
);

interface Props {
  sentByMe: boolean;
  message: ChatMessage;
}

export const ChatMessageComponent = (props: Props) => {
  const classes = useStyles();

  // If sender has avatarUrl, use it; otherwise, fallback to a default image
  const avatarUrl = props.message.sender.avatarUrl || "default-avatar-url.png";

  return (
    <div className={clsx(classes.root)}>
      <Box
        display="flex"
        alignItems="flex-start"
        justifyContent="flex-start"
        flexDirection={props.sentByMe ? "row-reverse" : "row"}
      >
        <div className={classes.profilePicture}>
          {/* Set the Avatar with a dynamic image URL if available */}
          <Avatar alt={props.message.sender.id} src={avatarUrl} />
        </div>
        <div
          className={clsx(classes.messageContainer, {
            [classes.myMessageContainer]: props.sentByMe,
          })}
        >
          {props.message.content}
        </div>
      </Box>
    </div>
  );
};
