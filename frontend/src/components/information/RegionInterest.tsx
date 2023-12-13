import { useState } from "react";
import { Box, Button, TextField } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import ClearIcon from "@mui/icons-material/Clear";
import { useRegionInterestContext } from "../../contexts/RegionInterestContext";
import { useFieldContext } from "../../contexts/FieldContext";
import { useNotificationContext } from "../../contexts/NotificationContext";
import { Coordinate, parseCoordinates } from "../../types/coordinate";

export default function RegionInterest() {
  const { roi, setRoi } = useRegionInterestContext();
  const { registerField } = useFieldContext();
  const notify = useNotificationContext();
  const [roiName, setRoiName] = useState("");

  const onUploadRegionInterest = (e: React.ChangeEvent<HTMLInputElement>) => {
    const reader = new FileReader();
    reader.onload = function (event) {
      const content = event.target?.result as string;
      const regionInterest = JSON.parse(content ?? "{}");
      const coordinates = regionInterest?.["coordinates"];
      if (coordinates) {
        setRoi(parseCoordinates(coordinates) as Coordinate[]);
      } else {
        notify({
          message: "Cannot find the coordinates from uploaded file",
          isError: true,
        });
      }
      const name = regionInterest?.["name"];
      if (name) setRoiName(name);
    };
    reader.readAsText(e.target?.files?.[0] as Blob);
    e.target.value = "";
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
      <Box className="button-row-container">
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
