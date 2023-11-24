import { Box, Button, TextField } from "@mui/material";
import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import LayersIcon from "@mui/icons-material/Layers";
import LayersClearIcon from "@mui/icons-material/LayersClear";
import DeleteIcon from "@mui/icons-material/Delete";
import { useFieldContext } from "../../../contexts/FieldContext";
import { useNotificationContext } from "../../../contexts/NotificationContext";

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
  const notify = useNotificationContext();

  const field = fields.find(({ id }) => id === selectedField?.id);

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
    if (ndvi) {
      getFieldNdvi()
        .then((message) => notify({ message: message, isError: false }))
        .catch((error) => notify({ message: error, isError: true }));
    } else {
      setNdvi(undefined);
    }
  };

  return (
    <Box>
      <TextField
        sx={{ mb: 2 }}
        fullWidth
        disabled
        label="Field Name"
        value={field?.name}
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
        <TextField fullWidth disabled label="Field Area" value={field?.area} />
        <TextField
          fullWidth
          disabled
          label="Straubing Distance"
          value={field?.straubingDistance}
        />
      </Box>
      <TextField
        sx={{ mb: 2 }}
        fullWidth
        disabled
        multiline={true}
        rows={5}
        label="Coordinates"
        value={JSON.stringify(selectedField?.coordinates) ?? "[]"}
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
          disabled={!selectedField}
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
            ? "Show Region"
            : "Hide Region"}
        </Button>
        <Button
          variant="outlined"
          color="success"
          disabled={!selectedRoiId || !selectedPeriod}
          fullWidth
          endIcon={ndvi ? <LayersClearIcon /> : <LayersIcon />}
          onClick={toggleNdviDisplay}
        >
          {ndvi ? "Hide NDVI Layer" : "Show NDVI Layer"}
        </Button>
      </Box>
      <Button
        variant="outlined"
        color="error"
        disabled={!selectedRoiId}
        fullWidth
        endIcon={<DeleteIcon />}
        onClick={onUnregisterField}
      >
        Delete Field
      </Button>
    </Box>
  );
}
