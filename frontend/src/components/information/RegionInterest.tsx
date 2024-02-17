import { useState } from "react";
import { Box, Button, TextField } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import ClearIcon from "@mui/icons-material/Clear";
import { useAuthenticationContext } from "../../contexts/AuthenticationContext";
import { useRegionInterestContext } from "../../contexts/RegionInterestContext";
import { useNotificationContext } from "../../contexts/NotificationContext";
import { useFieldContext } from "../../contexts/FieldContext";
import { Coordinate, parseCoordinates } from "../../types/coordinate";

export default function RegionInterest() {
  const notify = useNotificationContext();
  const { doRequest } = useAuthenticationContext();
  const { roi, setRoi, roiName, setRoiName } = useRegionInterestContext();
  const { registerField } = useFieldContext();

  const uploadRegionInterest = (e: React.ChangeEvent<HTMLInputElement>) => {
    const reader = new FileReader();
    reader.onload = function (event) {
      const content = event.target?.result as string;
      const regionInterest = JSON.parse(content ?? "{}");
      const coordinates = regionInterest?.["coordinates"];
      if (coordinates) {
        const roi = parseCoordinates(coordinates) as Coordinate[][];
        if (roi.every((r) => r?.length)) {
          setRoi(roi);
          const name = regionInterest?.["name"];
          if (name) setRoiName(name);
        } else {
          notify({
            message:
              "The coordinates from uploaded file must follow the example format",
            isError: true,
          });
        }
      } else {
        notify({
          message: "Cannot find the coordinates from uploaded file",
          isError: true,
        });
      }
    };
    reader.readAsText(e.target?.files?.[0] as Blob);
    e.target.value = "";
  };

  const clearRegion = () => {
    setRoi(undefined);
    setRoiName("");
  };

  const registerRegion = () => {
    if (!roi) {
      notify({ message: "No valid region is specified", isError: true });
      return;
    }
    registerField();
  };

  return (
    <Box className="information-container">
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
      <Box
        display="flex"
        justifyContent="flex-start"
        alignItems="center"
        gap={1}
      >
        <label
          style={{
            border: "1px solid #ccc",
            borderRadius: "4px",
            fontSize: "small",
            display: "inline-block",
            padding: "4px 12px",
            cursor: "pointer",
          }}
        >
          <input
            name="upload-region-interest"
            type="file"
            accept="application/json"
            style={{ display: "none" }}
            onChange={uploadRegionInterest}
          />
          Upload region
        </label>
        <label style={{ fontSize: "small" }}>
          <a href="example.json" download>
            example format
          </a>
        </label>
      </Box>
      <Box className="button-row-container">
        <Button
          fullWidth
          size="small"
          disabled={!roi || !roiName}
          variant="outlined"
          color="success"
          endIcon={<AddIcon />}
          onClick={registerRegion}
        >
          Register Region
        </Button>
        <Button
          sx={{ width: "30%" }}
          size="small"
          disabled={!roi}
          variant="outlined"
          color="error"
          endIcon={<ClearIcon />}
          onClick={clearRegion}
        >
          Reset
        </Button>
      </Box>
    </Box>
  );
}
