import { useState } from "react";
import { Box, Button, TextField } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import ClearIcon from "@mui/icons-material/Clear";
import { useRegionInterestContext } from "../../contexts/RegionInterestContext";
import { useFieldContext } from "../../contexts/FieldContext";
import { useNotificationContext } from "../../contexts/NotificationContext";

export default function RegionInterest() {
  const { roi, setRoi } = useRegionInterestContext();
  const { registerField } = useFieldContext();
  const notify = useNotificationContext();
  const [roiName, setRoiName] = useState("");

  const onUploadRegionInterest = (e) => {
    const reader = new FileReader();
    reader.onload = function (event) {
      const content = event.target?.result;
      const regionInterest = JSON.parse(content ?? "{}");
      const coordinates = regionInterest?.["coordinates"];
      if (coordinates) {
        setRoi(
          coordinates.map(function t(coord) {
            return coord[0] instanceof Number
              ? { lng: coord[0], lat: coord[1] }
              : coord.map(t);
          })
        );
      } else {
        notify({
          message: "Cannot find the coordinates from uploaded file",
          isError: true,
        });
      }
      const name = regionInterest?.["name"];
      if (name) setRoiName(name);
    };
    reader.readAsText(e.target.files?.[0]);
  };

  return (
    <Box className="general-container">
      <TextField
        size="small"
        fullWidth
        required
        id="region-name"
        label="Region Name"
        value={roiName}
        onChange={(e) => setRoiName(e.target.value)}
      />
      <TextField
        disabled
        fullWidth
        id="region-coordinates"
        multiline={true}
        rows={5}
        label="Region Coordinates"
        value={JSON.stringify(roi) ?? "[]"}
      />
      <input
        name="upload-region-interest"
        type="file"
        accept="application/json"
        onChange={onUploadRegionInterest}
      />
      <Box sx={{ display: "flex", justifyContent: "space-between", gap: 1 }}>
        <Button
          size="small"
          fullWidth
          disabled={!roi || !roiName}
          variant="outlined"
          color="success"
          endIcon={<AddIcon />}
          onClick={() => {
            registerField(roiName)
              .then((message) => notify({ message: message, isError: false }))
              .catch((error) => notify({ message: error, isError: true }));
          }}
        >
          Register region
        </Button>
        <Button
          size="small"
          fullWidth
          disabled={!roi}
          variant="outlined"
          color="error"
          endIcon={<ClearIcon />}
          onClick={() => setRoi(undefined)}
        >
          Clear region
        </Button>
      </Box>
    </Box>
  );
}
