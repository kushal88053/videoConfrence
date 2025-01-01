import React, { FunctionComponent, useState } from "react";
import { Toolbar, Button, Box, Menu, MenuItem, Slider } from "@mui/material";
import { makeStyles } from "@mui/styles";
import { Clear as ClearIcon, EditOutlined as PencilIcon, Functions as InsertGraphIcon, InsertPhoto as InsertPictureIcon, PublishRounded as DownloadIcon, RedoRounded as RedoIcon, TextFields as TextIcon, UndoRounded as UndoIcon } from "@mui/icons-material";
import { SketchPicker, ColorResult } from "react-color";
import { FileUploadModal } from "../../../shared/components/FileUploadModal";
import { canvasManager, CANVAS_MODE } from "../services/CanvasManager";
import { useToolbarState } from "../services/ToolbarInteractor"; // Ensure this import is correct and the hook is properly defined
import { GraphCreatorModal } from "./GraphCreatorModal";

const colorOptions = ["#000", "#95a5a6", "#e74c3c", "#00bd9d", "#2c97df", "#9c56b8", "#e9c81d"];

const useStyles = makeStyles({
  toolbarBtn: {
    width: "28px",
    height: "28px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    marginRight: "3px",
    boxSizing: "border-box",
    "&:hover": {
      cursor: "pointer",
      backgroundColor: "#eee",
    },
  },
  active: {
    borderRadius: "3px",
    backgroundColor: "#eee",
  },
  colorOptionContainer: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    border: "2px solid #fff",
    cursor: "pointer",
  },
  colorOption: {
    width: "10px",
    height: "10px",
    borderRadius: "50%",
  },
  line: {
    width: "140px",
    backgroundColor: "#323e49",
    height: "1px",
  },
});

interface Props { }

const BoxCenter: FunctionComponent<any> = ({ style, children }) => (
  <Box display="flex" alignItems="center" justifyContent="center" style={style}>
    {children}
  </Box>
);

const getToolIcon = (tool: keyof typeof CANVAS_MODE | "clear"): JSX.Element => {
  const toolIcons = {
    [CANVAS_MODE.FREEDRAW]: <PencilIcon fontSize="small" />,
    [CANVAS_MODE.PICKER]: <img src="https://img.icons8.com/metro/344/cursor.png" alt="" style={{ width: "16px", height: "16px" }} />,
    [CANVAS_MODE.LINE]: <img src="https://img.icons8.com/metro/344/line.png" alt="" style={{ width: "16px", height: "16px" }} />,
    [CANVAS_MODE.RECT]: <div style={{ width: "16px", height: "8px", border: "1.2px solid #323e49" }} />,
    [CANVAS_MODE.CIRCLE]: <div style={{ width: "16px", height: "16px", borderRadius: "50%", border: "1.2px solid #323e49" }} />,
    [CANVAS_MODE.TEXT]: <TextIcon fontSize="small" />,
    [CANVAS_MODE.ERASER]: <img src="https://img.icons8.com/ios-glyphs/344/erase.png" alt="" style={{ width: "16px", height: "16px" }} />,
    "clear": <ClearIcon fontSize="small" />,
  };
  return toolIcons[tool as keyof typeof toolIcons] || <PencilIcon fontSize="small" />;
};

export const CanvasToolbar: FunctionComponent<Props> = () => {
  const [onGraphInserter, setOnGraphInserter] = useState(false);
  const [onPictureInserter, setOnPictureInserter] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const toolbarState = useToolbarState();
  const { mode, color, brushWidth, selectedObject } = toolbarState;
  const classes = useStyles();

  const handleClick = (event: React.MouseEvent<HTMLElement>) => setAnchorEl(event.currentTarget);
  const handleClose = () => setAnchorEl(null);

  const canSelectColor = [CANVAS_MODE.FREEDRAW, CANVAS_MODE.LINE, CANVAS_MODE.RECT, CANVAS_MODE.CIRCLE].includes(mode as CANVAS_MODE);

  return (
    <Toolbar variant="dense">
      <div className={classes.toolbarBtn} onClick={() => canvasManager.undo()}>
        <UndoIcon fontSize="small" />
      </div>
      <div className={classes.toolbarBtn} onClick={() => canvasManager.redo()}>
        <RedoIcon fontSize="small" />
      </div>
      <BoxCenter>
        {[CANVAS_MODE.FREEDRAW, CANVAS_MODE.PICKER, CANVAS_MODE.ERASER, CANVAS_MODE.LINE, CANVAS_MODE.RECT, CANVAS_MODE.CIRCLE, "clear"].map((tool) => (
          <div
            key={tool}
            onClick={() => tool === "clear" ? canvasManager.clear() : canvasManager.setMode(tool)}
            className={`${classes.toolbarBtn} ${mode === tool ? classes.active : ""}`}
          >
            {getToolIcon(tool as keyof typeof CANVAS_MODE | "clear")}
          </div>
        ))}
      </BoxCenter>

      {canSelectColor && (
        <BoxCenter style={{ margin: "0 10px" }}>
          <SketchPicker
            color={color}
            onChangeComplete={(c: ColorResult) => canvasManager.setColor(c.hex)}
            presetColors={colorOptions}
          />
        </BoxCenter>
      )}

      {canSelectColor && (
        <BoxCenter style={{ margin: "0 10px" }}>
          <div style={{ color: "black", marginRight: "10px" }}>Brush Width:</div>
          <Slider
            style={{ width: "150px" }}
            value={brushWidth}
            onChange={(e, newValue) => canvasManager.setBrushWidth(newValue as number)}
            aria-labelledby="brush-width"
            min={3}
            max={16}
            step={1}
            valueLabelDisplay="auto"
          />
        </BoxCenter>
      )}

      {selectedObject && (
        <BoxCenter style={{ marginLeft: "auto" }}>
          {["Back", "Backwards", "Forwards", "Front"].map((label, index) => (
            <Button key={label} onClick={() => canvasManager.setSelectedObjectZPos(index as 0 | 1 | 2 | 3)}>
              {label}
            </Button>
          ))}
        </BoxCenter>
      )}

      <Button aria-controls="simple-menu" aria-haspopup="true" onClick={handleClick} style={{ marginLeft: "auto", color: "#323e49" }}>
        <InsertGraphIcon fontSize="small" style={{ marginRight: "6px" }} />
        Insert
      </Button>
      <Button onClick={() => canvasManager.downloadCanvas()} style={{ marginLeft: "15px", color: "#323e49" }}>
        <DownloadIcon fontSize="small" style={{ transform: "rotateX(180deg)", marginRight: "6px" }} />
        Download
      </Button>

      <Menu id="simple-menu" anchorEl={anchorEl} keepMounted open={Boolean(anchorEl)} onClose={handleClose}>
        <MenuItem onClick={() => { setOnGraphInserter(true); handleClose(); }}>
          <InsertGraphIcon fontSize="small" style={{ marginRight: "6px" }} />
          Graph
        </MenuItem>
        <MenuItem onClick={() => { setOnPictureInserter(true); handleClose(); }}>
          <InsertPictureIcon fontSize="small" style={{ marginRight: "6px" }} />
          Picture
        </MenuItem>
      </Menu>

      {onGraphInserter && (
        <GraphCreatorModal
          open={true}
          onClose={() => setOnGraphInserter(false)}
          onDone={async (resource) => { canvasManager.insertImage(resource.publicURL, resource.id); setOnGraphInserter(false); }}
        />
      )}
      {onPictureInserter && (
        <FileUploadModal
          open={true}
          accept="image/*"
          onClose={() => setOnPictureInserter(false)}
          onDone={async ({ uploadedResources }) => { uploadedResources.forEach((r) => canvasManager.insertImage(r.publicURL, r.id)); setOnPictureInserter(false); }}
          toCanvas={true}
        />
      )}
    </Toolbar>
  );
};
