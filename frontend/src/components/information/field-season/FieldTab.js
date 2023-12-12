import { Box, Button, TextField } from "@mui/material";
import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import LayersIcon from "@mui/icons-material/Layers";
import LayersClearIcon from "@mui/icons-material/LayersClear";
import DeleteIcon from "@mui/icons-material/Delete";
import { useFieldContext } from "../../../contexts/FieldContext";
import { usePeriodContext } from "../../../contexts/PeriodContext";
import { useNotificationContext } from "../../../contexts/NotificationContext";
import { useMemo } from "react";

export default function FieldTab() {
  const {
    fields,
    selectedField,
    setSelectedField,
    unregisterField,
    getFieldNdvi,
    ndvi,
    setNdvi,
  } = useFieldContext();
  const { selectedPeriod } = usePeriodContext();
  const notify = useNotificationContext();

  const field = useMemo(
    () => fields?.find(({ id }) => id === selectedField?.id),
    [fields, selectedField?.id]
  );

  const onUnregisterField = () => {
    unregisterField()
      .then((message) => notify({ message: message, isError: false }))
      .catch((error) => notify({ message: error, isError: true }));
  };

  const toggleFieldDisplay = () => {
    setSelectedField((prevSelectedField) => ({
      ...prevSelectedField,
      coordinates: prevSelectedField?.coordinates
        ? undefined
        : field.coordinates,
    }));
  };

  const toggleNdviDisplay = () => {
    if (!ndvi) {
      getFieldNdvi()
        .then((message) => notify({ message: message, isError: false }))
        .catch((error) => notify({ message: error, isError: true }));
    } else {
      setNdvi(undefined);
    }
  };

  return (
    <Box className="subtab-container">
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
          label="Field Area"
          value={field?.area ?? ""}
        />
        <TextField
          fullWidth
          size="small"
          disabled
          label="Straubing distance"
          value={field?.straubingDistance ?? ""}
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
      <Box
        sx={{
          display: "flex",
          flexDirection: "row",
          justifyContent: "space-between",
          gap: 1,
          mb: 1,
        }}
      >
        <Button
          variant="outlined"
          color="primary"
          disabled={!selectedField?.id}
          fullWidth
          endIcon={
            !selectedField || !selectedField?.coordinates ? (
              <VisibilityIcon />
            ) : (
              <VisibilityOffIcon />
            )
          }
          onClick={toggleFieldDisplay}
        >
          {!selectedField || !selectedField?.coordinates
            ? "Show field"
            : "Hide field"}
        </Button>
        <Button
          variant="outlined"
          color="success"
          disabled={!selectedField?.id || !selectedPeriod}
          fullWidth
          endIcon={ndvi ? <LayersClearIcon /> : <LayersIcon />}
          onClick={toggleNdviDisplay}
        >
          {ndvi ? "Hide ndvi" : "Show ndvi"}
        </Button>
      </Box>
      <Button
        variant="outlined"
        color="error"
        disabled={!selectedField?.id}
        fullWidth
        endIcon={<DeleteIcon />}
        onClick={onUnregisterField}
      >
        Delete field
      </Button>
    </Box>
  );
}
