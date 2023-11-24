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

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
      <TextField
        size="small"
        required
        id="region-name"
        label="Region Name"
        value={roiName}
        onChange={(e) => setRoiName(e.target.value)}
      />
      <TextField
        disabled
        id="region-coordinates"
        multiline={true}
        rows={5}
        label="Region Coordinates"
        value={JSON.stringify(roi) ?? "[]"}
      />
      <Box sx={{ display: "flex", justifyContent: "space-between", gap: 1 }}>
        <Button
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
