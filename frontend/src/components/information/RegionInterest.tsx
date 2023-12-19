import { useState } from "react";
import { Box, Button, TextField } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import ClearIcon from "@mui/icons-material/Clear";
import { useAuthenticationContext } from "../../contexts/AuthenticationContext";
import { useRegionInterestContext } from "../../contexts/RegionInterestContext";
import { useSelectionContext } from "../../contexts/SelectionContext";
import { useNotificationContext } from "../../contexts/NotificationContext";
import { Coordinate, parseCoordinates } from "../../types/coordinate";

export default function RegionInterest() {
  const { authenticationToken } = useAuthenticationContext();
  const { roi, setRoi } = useRegionInterestContext();
  const { refreshFieldOptions } = useSelectionContext();
  const notify = useNotificationContext();
  const [roiName, setRoiName] = useState("");
  const serverUrl = process.env.REACT_APP_SERVER_URL + "/field";

  const uploadRegionInterest = (e: React.ChangeEvent<HTMLInputElement>) => {
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

  const clearRegion = () => {
    setRoi(undefined);
    setRoiName("");
  };

  const registerRegion = () => {
    if (!roi || roi?.length < 3) {
      notify({ message: "No valid region is specified", isError: true });
      return;
    }
    fetch(`${serverUrl}/register`, {
      headers: {
        "Content-Type": "application/json",
        "Auth-Token": authenticationToken,
      },
      method: "POST",
      body: JSON.stringify({
        name: roiName,
        coordinates: roi.map(({ lat, lng }) => [lng, lat]),
      }),
    })
      .then(async (response) => {
        const responseBody = await response.json();
        if (response.ok) {
          refreshFieldOptions();
          clearRegion();
          notify({
            message: "Successfully register region of interest",
            isError: false,
          });
        } else notify({ message: responseBody["data"], isError: true });
      })
      .catch((error) => notify({ message: error.message, isError: true }));
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
      <input
        name="upload-region-interest"
        type="file"
        accept="application/json"
        onChange={uploadRegionInterest}
      />
      <Box className="button-row-container">
        <Button
          size="small"
          fullWidth
          disabled={!roi || !roiName}
          variant="outlined"
          color="success"
          endIcon={<AddIcon />}
          onClick={registerRegion}
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
          onClick={clearRegion}
        >
          Clear region
        </Button>
      </Box>
    </Box>
  );
}
