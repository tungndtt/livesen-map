import { useEffect, useState } from "react";
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
import ScatterPlotIcon from "@mui/icons-material/ScatterPlot";
import { useFieldContext } from "../../../contexts/FieldContext";
import { usePeriodContext } from "../../../contexts/PeriodContext";
import { useMeasurementContext } from "../../../contexts/MeasurementContext";
import { useNotificationContext } from "../../../contexts/NotificationContext";

export default function MeasurementTab() {
  const { selectedField } = useFieldContext();
  const { selectedPeriod } = usePeriodContext();
  const {
    measurements,
    determineMeasurementPositions,
    selectedMeasurements,
    setSelectedMeasurement,
  } = useMeasurementContext();
  const notify = useNotificationContext();

  const determineMeasurement = () => {
    determineMeasurementPositions()
      .then((message) => notify({ message: message, isError: false }))
      .catch((error) => notify({ message: error, isError: true }));
  };

  return (
    <Box className="general-container subtab-container">
      {measurements ? (
        measurements.map((measurement, i) => {
          const { id, position, ndvi_value, subfield } = measurement;
          return (
            <Accordion
              key={id}
              defaultExpanded
              disableGutters
              sx={{
                boxShadow: "none",
                border: "1px solid #c7c7c7",
                borderRadius: "2px",
              }}
            >
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography>Measurement {i}</Typography>
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
                  value={ndvi_value}
                />
                <TextField
                  fullWidth
                  size="small"
                  disabled={true}
                  label="Subfield Area"
                  value={subfield?.area}
                />
                <TextField
                  fullWidth
                  size="small"
                  disabled={true}
                  label="Subfield Recommended Fertilizer"
                  value={subfield?.recommendedFertilizerAmount}
                />
                <Button
                  fullWidth
                  size="small"
                  variant="outlined"
                  onClick={() => setSelectedMeasurement(id)}
                >
                  {selectedMeasurements?.[id]
                    ? "Hide measurement subfield"
                    : "Show measurement subfield"}
                </Button>
                <MeasurementValues measurement={measurement} />
              </AccordionDetails>
            </Accordion>
          );
        })
      ) : (
        <>
          <Typography m={4}>
            <b>No measurement positions available</b>
          </Typography>
          <Button
            fullWidth
            size="small"
            variant="outlined"
            endIcon={<ScatterPlotIcon />}
            disabled={!selectedField || !selectedPeriod}
            onClick={determineMeasurement}
          >
            Determine measurement positions
          </Button>
        </>
      )}
    </Box>
  );
}

const fields = [
  { name: "nitrate_measurement", label: "Nitrate" },
  { name: "phosphor_measurement", label: "Phosphor" },
  { name: "potassium_measurement", label: "Potassium" },
];

function MeasurementValues({ measurement }) {
  const { updateMeasurement } = useMeasurementContext();
  const notify = useNotificationContext();
  const [options, setOptions] = useState(undefined);

  useEffect(() => {
    setOptions(
      fields.reduce(
        ({ name }, currentValue) => ({
          ...currentValue,
          [name]: measurement[name],
        }),
        {}
      )
    );
  }, [measurement]);

  const onChangeOptions = (e) => {
    setOptions((prevOptions) => {
      const name = e.target.name;
      const value = +e.target.value;
      return { ...prevOptions, [name]: value };
    });
  };

  const updateMeasurementValues = () => {
    updateMeasurement(measurement.id, options)
      .then((message) => notify({ message: message, isError: false }))
      .catch((error) => notify({ message: error, isError: true }));
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
          value={options?.[name] ?? -1}
          onChange={onChangeOptions}
        />
      ))}
      <Button
        fullWidth
        size="small"
        variant="outlined"
        disabled={fields.every(
          ({ name }) => options?.[name] === measurement?.[name]
        )}
        onClick={updateMeasurementValues}
      >
        Update measurement values
      </Button>
    </>
  );
}
