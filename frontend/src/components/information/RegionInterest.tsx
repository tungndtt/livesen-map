import { Box, Button, TextField } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import ClearIcon from "@mui/icons-material/Clear";
import { useNotificationContext } from "../../contexts/NotificationContext";
import { useRegionInterestContext } from "../../contexts/RegionInterestContext";
import { Coordinate, parseCoordinates } from "../../types/coordinate";

export default function RegionInterest() {
  const notify = useNotificationContext();
  const { roi, setRoi, roiName, setRoiName, registerField } =
    useRegionInterestContext();

  const uploadRegionInterest = (e: React.ChangeEvent<HTMLInputElement>) => {
    const reader = new FileReader();
    reader.onload = function (event) {
      const content = event.target?.result as string;
      let regionInterest;
      try {
        regionInterest = JSON.parse(content ?? "{}");
      } catch {
        notify({
          message: "The uploaded file must be GeoJson",
          isError: true,
        });
        return;
      }
      const properties = regionInterest?.["properties"];
      if (!properties) {
        notify({
          message: "Cannot find 'properties' from uploaded file",
          isError: true,
        });
        return;
      }
      const name = properties?.["FeldID"];
      if (!name) {
        notify({
          message: "Cannot find 'FeldID' from uploaded file",
          isError: true,
        });
        return;
      }
      const geometry = regionInterest?.["geometry"];
      if (!geometry) {
        notify({
          message: "Cannot find 'geometry' from uploaded file",
          isError: true,
        });
        return;
      }
      const type = geometry?.["type"];
      if (type !== "Polygon") {
        notify({
          message: "Cannot find geometry 'type' from uploaded file",
          isError: true,
        });
        return;
      } else if (type !== "Polygon") {
        notify({
          message: "Only support field of type 'Polygon'",
          isError: true,
        });
        return;
      }
      const coordinates = geometry?.["coordinates"];
      if (!coordinates) {
        notify({
          message: "Cannot find 'coordinates' from uploaded file",
          isError: true,
        });
        return;
      }
      let roi;
      try {
        roi = parseCoordinates(coordinates) as Coordinate[][];
      } catch {
        notify({
          message:
            "The coordinates from uploaded file is incorrect. Please refer to the example",
          isError: true,
        });
        return;
      }
      if (!roi?.every((r) => r?.length)) {
        notify({
          message:
            "The coordinates from uploaded file is incorrect. Please refer to the example",
          isError: true,
        });
        return;
      }
      setRoiName(name);
      setRoi(roi);
    };
    reader.readAsText(e.target?.files?.[0]!);
    e.target.value = "";
  };

  const clearRegion = () => {
    setRoi(undefined);
    setRoiName("");
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
            accept=".json,.geojson"
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
          onClick={registerField}
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
