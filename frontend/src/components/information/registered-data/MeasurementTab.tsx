import { useEffect, useState } from "react";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Button,
  Card,
  CardMedia,
  CircularProgress,
  FormControl,
  InputLabel,
  MenuItem,
  Modal,
  Select,
  TextField,
  Typography,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ViewQuiltIcon from "@mui/icons-material/ViewQuilt";
import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import GridOnIcon from "@mui/icons-material/GridOn";
import GridOffIcon from "@mui/icons-material/GridOff";
import UpgradeIcon from "@mui/icons-material/Upgrade";
import ClearIcon from "@mui/icons-material/Clear";
import AddPhotoAlternateIcon from "@mui/icons-material/AddPhotoAlternate";
import ImageIcon from "@mui/icons-material/Image";
import { useSelectionContext } from "../../../contexts/SelectionContext";
import { useMeasurementContext } from "../../../contexts/MeasurementContext";
import { useMetadataContext } from "../../../contexts/MetadataContext";
import { Measurement, MeasurementValues } from "../../../types/measurement";

export default function MeasurementTab() {
  const { selectedFieldId, selectedSeasonId } = useSelectionContext();
  const {
    measurements,
    determineMeasurementPositions,
    updateMeasurement,
    updateMeasurementSample,
    showMeasurementSample,
    measurementVisible,
    toggleMeasurementVisible,
    recommendationVisible,
    toggleAllMeasurementVisible,
    toggleRecommendationVisible,
  } = useMeasurementContext();
  const [isDetermining, setIsDetermining] = useState(false);
  const [sampleImageUrl, setSampleImageUrl] = useState("");
  const [showAll, setShowAll] = useState(false);

  return (
    <Box className="tab-container">
      {measurements ? (
        <>
          {measurements.map((measurement) => (
            <Accordion
              key={measurement.id}
              disableGutters
              sx={{
                boxShadow: "none",
                border: "2px solid #c7c7c7",
                borderRadius: "2px",
                mb: 2,
              }}
            >
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography>
                  <b>Measurement {measurement.idx}</b>
                </Typography>
              </AccordionSummary>
              <AccordionDetails
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 2,
                }}
              >
                <TextField
                  fullWidth
                  size="small"
                  disabled
                  label="NDVI"
                  value={measurement.ndvi.toFixed(3)}
                />
                <TextField
                  fullWidth
                  size="small"
                  disabled
                  label="Position"
                  value={`${measurement.position.lng.toFixed(
                    3
                  )}, ${measurement.position.lat.toFixed(3)}`}
                />
                <MeasurementValuesUpdate
                  measurement={measurement}
                  updateMeasurement={updateMeasurement}
                />
                <Box className="button-row-container" pb={0}>
                  <Button
                    sx={{ width: "40%" }}
                    size="small"
                    variant="outlined"
                    component="label"
                    color="secondary"
                    endIcon={<AddPhotoAlternateIcon />}
                  >
                    <input
                      type="file"
                      accept=".png,.jpeg,.jpg,.svg,.tiff,.tif,.webp"
                      style={{ display: "none" }}
                      onChange={(e) => {
                        updateMeasurementSample(
                          measurement.id,
                          e.target?.files?.[0]!
                        );
                        e.target.value = "";
                      }}
                    />
                    Upload sample
                  </Button>
                  <Button
                    sx={{ width: "60%" }}
                    size="small"
                    variant="outlined"
                    endIcon={<ImageIcon />}
                    onClick={() => {
                      showMeasurementSample(measurement.id).then((imageUrl) =>
                        setSampleImageUrl(imageUrl)
                      );
                    }}
                  >
                    Show sample
                  </Button>
                </Box>
                <Button
                  fullWidth
                  size="small"
                  variant="outlined"
                  color="success"
                  endIcon={
                    measurementVisible?.[measurement.id] ? (
                      <VisibilityOffIcon />
                    ) : (
                      <VisibilityIcon />
                    )
                  }
                  onClick={() => toggleMeasurementVisible(measurement.id)}
                >
                  {measurementVisible?.[measurement.id]
                    ? "Hide measurement subfield"
                    : "Show measurement subfield"}
                </Button>
              </AccordionDetails>
            </Accordion>
          ))}
          <Box className="button-row-container">
            <Button
              sx={{ width: "30%" }}
              size="small"
              variant="outlined"
              color="success"
              endIcon={showAll ? <VisibilityOffIcon /> : <VisibilityIcon />}
              onClick={() => {
                toggleAllMeasurementVisible(!showAll);
                setShowAll(!showAll);
              }}
            >
              {showAll ? "Hide all" : "Show all"}
            </Button>
            <Button
              fullWidth
              size="small"
              variant="outlined"
              endIcon={recommendationVisible ? <GridOffIcon /> : <GridOnIcon />}
              disabled={Object.keys(measurementVisible ?? {}).length === 0}
              onClick={toggleRecommendationVisible}
            >
              {recommendationVisible
                ? "Hide Fertilizer Recommendation"
                : "Show Fertilizer Recommendation"}
            </Button>
          </Box>
          <Modal
            open={!!sampleImageUrl}
            onClose={() => setSampleImageUrl("")}
            sx={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <Card raised>
              <CardMedia
                component="img"
                image={sampleImageUrl}
                alt="Sample Image"
                sx={{
                  objectFit: "contain",
                  maxHeight: "70vh",
                }}
              />
            </Card>
          </Modal>
        </>
      ) : (
        <>
          <Box
            mt={10}
            mb={2}
            display="flex"
            flexDirection="row"
            justifyContent="center"
            alignItems="center"
            gap={2}
          >
            <Typography>
              <b>No measurement positions available</b>
            </Typography>
            {isDetermining && <CircularProgress size="30px" />}
          </Box>
          <Button
            fullWidth
            size="small"
            variant="outlined"
            color="warning"
            endIcon={<ViewQuiltIcon />}
            disabled={!selectedFieldId || !selectedSeasonId || isDetermining}
            onClick={() => {
              setIsDetermining(true);
              determineMeasurementPositions().finally(() =>
                setIsDetermining(false)
              );
            }}
          >
            Determine measurement positions
          </Button>
        </>
      )}
    </Box>
  );
}

type MeasurementValuesProps = {
  measurement: Measurement;
  updateMeasurement: (
    measurementId: number,
    measurementValues: MeasurementValues
  ) => void;
};

const fields = [
  { name: "nitrate", label: "Nitrate (mg/L)" },
  { name: "phosphor", label: "Phosphor (mg/L)" },
  { name: "potassium", label: "Potassium (mg/L)" },
  { name: "charge", label: "Charge of Plant Juice" },
  { name: "stadium", label: "Stadium" },
];

function MeasurementValuesUpdate(props: MeasurementValuesProps) {
  const { measurement, updateMeasurement } = props;
  const { categories } = useMetadataContext();
  const [options, setOptions] = useState<MeasurementValues>({});

  const resetMeasurementValues = () => {
    setOptions(measurement);
  };

  useEffect(resetMeasurementValues, [measurement]);

  const onChangeOptions = (e: any) => {
    setOptions((prevOptions) => {
      const name = e.target.name;
      const value =
        e.target.type === "number" ? +e.target.value : e.target.value;
      return { ...prevOptions, [name]: value };
    });
  };

  const updateMeasurementValues = () => {
    updateMeasurement(measurement.id, options);
  };

  return (
    <>
      {fields.map(({ name, label }) => (
        <TextField
          key={name}
          fullWidth
          size="small"
          name={name}
          label={label}
          type="number"
          //@ts-ignore
          value={options[name] ?? ""}
          onChange={onChangeOptions}
        />
      ))}
      <FormControl fullWidth size="small">
        <InputLabel>Soil Condition</InputLabel>
        <Select
          value={options.soilCondition ?? ""}
          name="soilCondition"
          label="Soil Condition"
          onChange={onChangeOptions}
        >
          {categories["soilCondition"]?.map((soilCondition) => (
            <MenuItem key={soilCondition} value={soilCondition}>
              {soilCondition}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
      <Box className="button-row-container" pb={0}>
        <Button
          fullWidth
          size="small"
          variant="outlined"
          endIcon={<UpgradeIcon />}
          disabled={fields.every(
            ({ name }) =>
              //@ts-ignore
              options[name] === measurement[name] &&
              options.soilCondition === measurement.soilCondition
          )}
          onClick={updateMeasurementValues}
        >
          Update measurement
        </Button>
        <Button
          sx={{ width: "35%" }}
          size="small"
          variant="outlined"
          color="error"
          endIcon={<ClearIcon />}
          onClick={resetMeasurementValues}
        >
          Reset
        </Button>
      </Box>
    </>
  );
}
