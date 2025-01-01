import { Avatar, Box, createStyles, Theme, Button, Drawer, Typography, Paper, TextField } from "@mui/material";

import { makeStyles } from "@mui/styles";
import { ChatMessage } from "../models/chat";
import { useEffect, useRef, useState } from "react";
import { signalingChannel } from "../../../shared/services/theme/signalling";
import { IChatInteractor } from "../interactors/chatInteractor";
import { useChatState } from "../state/chat";
import { ChatMessageComponent } from "./ChatMessage";

const useStyles = makeStyles<Theme>((theme) =>
  createStyles({
    chatContainer: {
      width: "420px",
      height: "100%",
      overflow: "hidden",
      position: "relative",
    },
    header: {
      height: "60px",
      borderBottom: `1px solid ${theme?.palette?.divider || '#e0e0e0'}`, // Fallback to a static color
      boxSizing: "border-box",
      padding: "16px",
      display: "flex",
      alignItems: "center",
    },
    title: {
      fontWeight: 500,
      fontSize: "1.2rem",
    },
    messages: {
      height: window.innerHeight - 150,
      position: "absolute",
      right: 0,
      bottom: 80,
      left: 0,
      top: 60,
      overflowY: "auto",
    },
    messageCreator: {
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
    textField: {
      width: "300px",
    },
  })
);


interface Props {
  chatInteractor: IChatInteractor;
}

export const ChatDrawer = (props: Props) => {
  const classes = useStyles();

  const { visible, chat } = useChatState();

  const [content, setContent] = useState("");

  if (!chat) return <div></div>;

  const isMessageSentByMe = (message: ChatMessage) => {
    if (message.sender.entity === "socket") {
      return message.sender.id === signalingChannel.id;
    }
    return false;
  };

  const toggleChatVisibility = () => {
    props.chatInteractor.toggleChatVisibility();
  };

  const sendMessage = () => {
    setContent("");
    props.chatInteractor.sendChatMessage(content);
  };

  return (
    <Drawer anchor="left" open={visible} onClose={() => toggleChatVisibility()}>
      <Paper square className={classes.chatContainer}>
        <div className={classes.header}>
          <Typography className={classes.title} color="textPrimary">
            Messages
          </Typography>
        </div>
        <div className={classes.messages}>
          {chat.messages.map((m) => (
            <ChatMessageComponent
              sentByMe={isMessageSentByMe(m)}
              message={m}
              key={m.id}
            />
          ))}
          <AlwaysScrollToBottom />
        </div>
        <div className={classes.messageCreator}>
          <TextField
            maxRows={10} // Use `maxRows` instead of `rowsMax`
            autoFocus
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault(); // Prevents unintended behavior when pressing Enter
                sendMessage();
              }
            }}
            variant="outlined"
            className={classes.textField}
            multiline
            value={content}
            onChange={(e) => setContent(e.target.value)}
          />

          <Button
            color="primary"
            variant="contained"
            disabled={content.length === 0}
            size="small"
            onClick={() => sendMessage()}
          >
            SEND
          </Button>
        </div>
      </Paper>
    </Drawer>
  );
};

const AlwaysScrollToBottom = () => {
  const elementRef = useRef<any>();
  useEffect(() => elementRef.current.scrollIntoView({ behaviour: "smooth" }));
  return <div ref={elementRef} />;
};



