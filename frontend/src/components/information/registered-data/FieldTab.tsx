import { useEffect, useState } from "react";
import { Box, Button, TextField } from "@mui/material";
import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import LayersIcon from "@mui/icons-material/Layers";
import LayersClearIcon from "@mui/icons-material/LayersClear";
import DeleteIcon from "@mui/icons-material/Delete";
import { useSelectionContext } from "../../../contexts/SelectionContext";
import { useFieldContext } from "../../../contexts/FieldContext";
import { useNdviRasterContext } from "../../../contexts/NdviRasterContext";
import { useNotificationContext } from "../../../contexts/NotificationContext";

export default function FieldTab() {
  const { selectedFieldId, selectedSeasonId } = useSelectionContext();
  const { field, unregisterField, fieldVisible, toggleFieldVisible } =
    useFieldContext();
  const { ndviRasterVisible, toggleNdviRasterVisible } = useNdviRasterContext();

  return (
    <Box className="tab-container">
      <TextField
        sx={{ mb: 2 }}
        fullWidth
        size="small"
        disabled
        label="Field name"
        value={field?.name ?? ""}
      />
      <Box
        sx={{
          display: "flex",
          flexDirection: "row",
          justifyContent: "space-between",
          gap: 1,
          mb: 2,
        }}
      >
        <TextField
          fullWidth
          size="small"
          disabled
          label="Field Area (ha)"
          value={field?.area ? field?.area.toFixed(3) : "-"}
        />
        <TextField
          fullWidth
          size="small"
          disabled
          label="Straubing distance (km)"
          value={
            field?.straubingDistance ? field?.straubingDistance.toFixed(3) : "-"
          }
        />
      </Box>
      <TextField
        sx={{ mb: 2 }}
        fullWidth
        disabled
        multiline={true}
        rows={5}
        label="Coordinates"
        value={JSON.stringify(field?.coordinates) ?? "[]"}
      />
      <Box className="button-row-container">
        <Button
          variant="outlined"
          color="primary"
          disabled={!field}
          fullWidth
          endIcon={fieldVisible ? <VisibilityOffIcon /> : <VisibilityIcon />}
          onClick={toggleFieldVisible}
        >
          {!field || !fieldVisible ? "Show field" : "Hide field"}
        </Button>
        <Button
          variant="outlined"
          color="success"
          disabled={
            !selectedFieldId ||
            !selectedSeasonId ||
            ndviRasterVisible === undefined
          }
          fullWidth
          endIcon={ndviRasterVisible ? <LayersClearIcon /> : <LayersIcon />}
          onClick={toggleNdviRasterVisible}
        >
          {ndviRasterVisible ? "Hide ndvi" : "Show ndvi"}
        </Button>
      </Box>
      <Button
        sx={{ mb: 1 }}
        variant="outlined"
        color="error"
        disabled={!selectedFieldId}
        fullWidth
        endIcon={<DeleteIcon />}
        onClick={unregisterField}
      >
        Delete field
      </Button>
    </Box>
  );
}
