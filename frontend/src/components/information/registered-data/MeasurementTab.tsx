import React, { useEffect, useState } from "react";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Button,
  CircularProgress,
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
import { useAuthenticationContext } from "../../../contexts/AuthenticationContext";
import { useSelectionContext } from "../../../contexts/SelectionContext";
import { useMeasurementContext } from "../../../contexts/MeasurementContext";
import { useNotificationContext } from "../../../contexts/NotificationContext";
import {
  Measurement,
  NutrientMeasurement,
  MeasurementNutrientField,
  parseMeasurement,
} from "../../../types/measurement";

export default function MeasurementTab() {
  const { doRequest } = useAuthenticationContext();
  const { selectedFieldId, selectedSeasonId } = useSelectionContext();
  const {
    visibility,
    setupMeasurementLayer,
    toggleMeasurementRegion,
    recommendationVisible,
    toggleRecommendationVisible,
    updateSubFieldRecommendedFertilizer,
  } = useMeasurementContext();
  const notify = useNotificationContext();
  const [measurements, setMeasurements] = useState<Measurement[] | undefined>(
    undefined
  );
  const [isDetermining, setIsDetermining] = useState(false);

  const initializeMeasurements = (
    fetchedMeasurements: any[],
    fetchedSubFields: any[]
  ) => {
    const measurements = fetchedMeasurements
      .map((fetchedMeasurement) => parseMeasurement(fetchedMeasurement))
      .sort((m1, m2) => m1.ndvi - m2.ndvi);
    setMeasurements(measurements);
    setupMeasurementLayer(fetchedMeasurements, fetchedSubFields);
  };

  useEffect(() => {
    const reset = () => setMeasurements(undefined);
    if (selectedFieldId && selectedSeasonId) {
      Promise.all([
        doRequest(
          `measurement/subfield/${selectedFieldId}/${selectedSeasonId}`,
          "GET"
        ),
        doRequest(`measurement/${selectedFieldId}/${selectedSeasonId}`, "GET"),
      ])
        .then(async ([subfieldResponse, measurementResponse]) => {
          const subfieldResponseBody = await subfieldResponse.json();
          const measurementResponseBody = await measurementResponse.json();
          initializeMeasurements(measurementResponseBody, subfieldResponseBody);
        })
        .catch(reset);
    } else reset();
  }, [selectedFieldId, selectedSeasonId]);

  const determineMeasurementPositions = () => {
    setIsDetermining(true);
    doRequest(
      `measurement/position/${selectedFieldId}/${selectedSeasonId}`,
      "GET"
    )
      .then(async (response) => {
        const responseBody = await response.json();
        const { measurements, subfields } = responseBody;
        initializeMeasurements(measurements, subfields);
        notify({
          message: "Measurement poisitions were determined",
          isError: false,
        });
      })
      .catch((error) => notify({ message: error, isError: true }))
      .finally(() => setIsDetermining(false));
  };

  const updateMeasurement = (
    measurementId: number,
    options: NutrientMeasurement
  ) => {
    doRequest(`measurement/upgister/${measurementId}`, "PUT", options).then(
      async (response) => {
        const responseBody = await response.json();
        const measurement = responseBody["measurement"];
        const updatedMeasurement = parseMeasurement(measurement);
        setMeasurements((prevMeasurements) => {
          if (prevMeasurements) {
            const index = prevMeasurements.findIndex(
              (prevMeasurement) => prevMeasurement.id === updatedMeasurement.id
            );
            if (index !== -1) {
              prevMeasurements[index] = {
                ...prevMeasurements[index],
                ...updatedMeasurement,
              };
              prevMeasurements = [...prevMeasurements];
            }
          }
          return prevMeasurements;
        });
        const subfieldRecommendedFertilizer =
          responseBody["subfield_recommended_fertilizer"];
        updateSubFieldRecommendedFertilizer(
          updatedMeasurement.id,
          subfieldRecommendedFertilizer
        );
        notify({
          message: "Successfully updated measurement",
          isError: false,
        });
      }
    );
  };

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
                  <b>Measurement {measurement.id}</b>
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
                <MeasurementValues
                  measurement={measurement}
                  updateMeasurement={updateMeasurement}
                />
                <Button
                  fullWidth
                  size="small"
                  variant="outlined"
                  color="success"
                  endIcon={
                    visibility?.[measurement.id] ? (
                      <VisibilityOffIcon />
                    ) : (
                      <VisibilityIcon />
                    )
                  }
                  onClick={() => toggleMeasurementRegion(measurement.id)}
                >
                  {visibility?.[measurement.id]
                    ? "Hide measurement subfield"
                    : "Show measurement subfield"}
                </Button>
              </AccordionDetails>
            </Accordion>
          ))}
          <Button
            fullWidth
            size="small"
            variant="outlined"
            sx={{ my: 1 }}
            endIcon={recommendationVisible ? <GridOffIcon /> : <GridOnIcon />}
            disabled={Object.keys(visibility ?? {}).length === 0}
            onClick={toggleRecommendationVisible}
          >
            {recommendationVisible
              ? "Hide Fertilizer Recommendation"
              : "Show Fertilizer Recommendation"}
          </Button>
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
            onClick={determineMeasurementPositions}
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
    options: NutrientMeasurement
  ) => void;
};

const fields = [
  { name: "nitrate", label: "Nitrate" },
  { name: "phosphor", label: "Phosphor" },
  { name: "potassium", label: "Potassium" },
];

function MeasurementValues(props: MeasurementValuesProps) {
  const { measurement, updateMeasurement } = props;
  const [options, setOptions] = useState<NutrientMeasurement>({});

  const resetMeasurementValues = () => {
    setOptions(measurement);
  };

  useEffect(resetMeasurementValues, [measurement]);

  const onChangeOptions = (e: React.ChangeEvent<HTMLInputElement>) => {
    setOptions((prevOptions) => {
      const name = e.target.name;
      const value = +e.target.value;
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
          label={label + " (mg/L)"}
          type="number"
          value={options?.[name as MeasurementNutrientField] ?? ""}
          onChange={onChangeOptions}
        />
      ))}
      <Box className="button-row-container">
        <Button
          fullWidth
          size="small"
          variant="outlined"
          endIcon={<UpgradeIcon />}
          disabled={fields.every(
            ({ name }) =>
              options[name as MeasurementNutrientField] ===
              measurement[name as MeasurementNutrientField]
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
