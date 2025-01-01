import { Badge, IconButton } from "@mui/material";
import { IChatInteractor } from "../interactors/chatInteractor";
import { useChatState } from "../state/chat";
import MailOutlineIcon from '@mui/icons-material/MailOutline'; // Correct import

interface Props {
  chatInteractor: IChatInteractor;
}

export const ChatBtn = (props: Props) => {
  const { chat, unreadCount } = useChatState();

  const toggleChatVisibility = () => {
    props.chatInteractor.toggleChatVisibility();
  };

  return (
    <IconButton onClick={() => toggleChatVisibility()} disabled={chat == null}>
      <Badge badgeContent={unreadCount} color="primary">
        <MailOutlineIcon /> {/* Use MailOutlineIcon here */}
      </Badge>
    </IconButton>
  );
};
