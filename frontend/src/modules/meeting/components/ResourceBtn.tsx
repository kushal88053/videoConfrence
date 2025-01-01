import { Badge } from "@mui/material";
import { IconButton } from "@mui/material";
import { FileCopyOutlined } from "@mui/icons-material";
import { useResourceDrawer } from "../state/resourceDrawer";

interface Props { }

export const ResourceBtn = (props: Props) => {
  const { toggle, unseenCount } = useResourceDrawer();

  return (
    <IconButton onClick={toggle}>
      <Badge badgeContent={unseenCount} color="primary">
        <FileCopyOutlined />
      </Badge>
    </IconButton>
  );
};
