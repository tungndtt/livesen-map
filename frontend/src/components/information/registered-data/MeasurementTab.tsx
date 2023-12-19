import React, { useEffect, useState } from "react";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Button,
  TextField,
  Typography,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ViewQuiltIcon from "@mui/icons-material/ViewQuilt";
import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import UpgradeIcon from "@mui/icons-material/Upgrade";
import ClearIcon from "@mui/icons-material/Clear";
import { useAuthenticationContext } from "../../../contexts/AuthenticationContext";
import { useSelectionContext } from "../../../contexts/SelectionContext";
import { useMeasurementContext } from "../../../contexts/MeasurementContext";
import { useNotificationContext } from "../../../contexts/NotificationContext";
import {
  Measurement,
  SubField,
  NutrientMeasurement,
  MeasurementNutrientField,
  parseMeasurement,
  parseSubfield,
} from "../../../types/measurement";

export default function MeasurementTab() {
  const { authenticationToken } = useAuthenticationContext();
  const { selectedFieldId, selectedSeasonId } = useSelectionContext();
  const {
    measurementCoordinates,
    setupMeasurementLayer,
    toggleMeasurementRegion,
  } = useMeasurementContext();
  const notify = useNotificationContext();
  const [measurements, setMeasurements] = useState<Measurement[] | undefined>(
    undefined
  );
  const serverUrl = process.env.REACT_APP_SERVER_URL + "/measurement";

  const initializeMeasurements = (
    fetchedMeasurements: any[],
    fetchedSubfields: any[]
  ) => {
    const subfieldsMap = {} as { [measurementId: number]: SubField[] };
    fetchedSubfields.forEach((fetchedSubfield) => {
      const subfield = parseSubfield(fetchedSubfield);
      if (!subfieldsMap?.[subfield.measurementId]) {
        subfieldsMap[subfield.measurementId] = [];
      }
      subfieldsMap[subfield.measurementId].push(subfield);
    });
    const measurements = fetchedMeasurements
      .map((fetchedMeasurement) => {
        const measurement = parseMeasurement(fetchedMeasurement);
        measurement.subfields = subfieldsMap[measurement.id];
        return measurement;
      })
      .sort((m1, m2) => m1.ndvi - m2.ndvi);
    setMeasurements(measurements);
    setupMeasurementLayer(measurements);
  };

  useEffect(() => {
    const reset = () => setMeasurements(undefined);
    if (authenticationToken && selectedFieldId && selectedSeasonId) {
      Promise.all([
        fetch(`${serverUrl}/subfield/${selectedFieldId}/${selectedSeasonId}`, {
          headers: { "Auth-Token": authenticationToken },
          method: "GET",
        }),
        fetch(`${serverUrl}/${selectedFieldId}/${selectedSeasonId}`, {
          headers: { "Auth-Token": authenticationToken },
          method: "GET",
        }),
      ])
        .then(async ([subfieldResponse, measurementResponse]) => {
          const subfieldResponseBody = await subfieldResponse.json();
          const measurementResponseBody = await measurementResponse.json();
          if (subfieldResponse.ok && measurementResponse.ok) {
            initializeMeasurements(
              measurementResponseBody,
              subfieldResponseBody
            );
          } else reset();
        })
        .catch((errors) => {
          for (let i = 0; i < errors.length; i++) {
            const error = errors[i];
            if (error) {
              notify({ message: error.message, isError: true });
              break;
            }
          }
          reset();
        });
    } else reset();
  }, [authenticationToken, selectedFieldId, selectedSeasonId]);

  const determineMeasurementPositions = () => {
    fetch(
      `${serverUrl}/determine_positions/${selectedFieldId}/${selectedSeasonId}`,
      {
        headers: { "Auth-Token": authenticationToken },
        method: "GET",
      }
    )
      .then(async (response) => {
        const responseBody = await response.json();
        if (response.ok) {
          const { measurements, subfields } = responseBody;
          initializeMeasurements(measurements, subfields);
          notify({
            message: "Measurement poisitions were determined",
            isError: false,
          });
        } else notify({ message: responseBody["data"], isError: true });
      })
      .catch((error) => notify({ message: error.message, isError: true }));
  };

  const updateMeasurement = (
    measurementId: number,
    options: NutrientMeasurement
  ) => {
    fetch(`${serverUrl}/upgister/${measurementId}`, {
      headers: {
        "Auth-Token": authenticationToken,
        "Content-Type": "application/json",
      },
      method: "PUT",
      body: JSON.stringify(options),
    })
      .then(async (response) => {
        const responseBody = await response.json();
        if (response.ok) {
          const updatedMeasurement = parseMeasurement(responseBody);
          setMeasurements((prevMeasurements) => {
            if (prevMeasurements) {
              const index = prevMeasurements.findIndex(
                (prevMeasurement) =>
                  prevMeasurement.id === updatedMeasurement.id
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
          notify({
            message: "Successfully updated measurement",
            isError: false,
          });
        } else notify({ message: responseBody["data"], isError: true });
      })
      .catch((error) => notify({ message: error.message, isError: true }));
  };

  return (
    <Box className="tab-container">
      {measurements ? (
        measurements.map((measurement, i) => {
          const { id, position, ndvi, subfields } = measurement;
          return (
            <Accordion
              key={id}
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
                  <b>Measurement {i}</b>
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
                  disabled={true}
                  label="Measurement Position (long, lat)"
                  value={`${position.lng}, ${position.lat}`}
                />
                <TextField
                  fullWidth
                  size="small"
                  disabled={true}
                  label="NDVI"
                  value={ndvi}
                />
                {subfields.map(
                  ({ id, area, recommendedFertilizerAmount }, i) => (
                    <Accordion
                      key={id}
                      disableGutters
                      sx={{
                        width: "100%",
                        boxShadow: "none",
                        border: "2px solid #c7c7c7",
                        borderRadius: "2px",
                      }}
                    >
                      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                        <Typography>Subfield {i}</Typography>
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
                          disabled={true}
                          label="Subfield Area"
                          value={area}
                        />
                        <TextField
                          fullWidth
                          size="small"
                          disabled={true}
                          label="Subfield Recommended Fertilizer"
                          value={recommendedFertilizerAmount}
                        />
                      </AccordionDetails>
                    </Accordion>
                  )
                )}
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
                    measurementCoordinates?.[id] ? (
                      <VisibilityOffIcon />
                    ) : (
                      <VisibilityIcon />
                    )
                  }
                  onClick={() => toggleMeasurementRegion(measurement)}
                >
                  {measurementCoordinates?.[id]
                    ? "Hide measurement subfield"
                    : "Show measurement subfield"}
                </Button>
              </AccordionDetails>
            </Accordion>
          );
        })
      ) : (
        <>
          <Typography mt={10} mb={2}>
            <b>No measurement positions available</b>
          </Typography>
          <Button
            fullWidth
            size="small"
            variant="outlined"
            color="warning"
            endIcon={<ViewQuiltIcon />}
            disabled={!selectedFieldId || !selectedSeasonId}
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
          label={label}
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
          sx={{ width: "40%" }}
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
