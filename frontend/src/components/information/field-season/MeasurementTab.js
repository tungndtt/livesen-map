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
    <Box>
      {measurements ? (
        measurements.map((measurement, i) => {
          const { id, position, ndvi_value, subfield } = measurement;
          return (
            <Accordion key={id}>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography>Measurement {i}</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <TextField
                  fullWidth
                  disabled={true}
                  label="Measurement Position (long, lat)"
                  value={`${position.lng}, ${position.lat}`}
                />
                <TextField
                  fullWidth
                  disabled={true}
                  label="NDVI"
                  value={ndvi_value}
                />
                <TextField
                  fullWidth
                  disabled={true}
                  label="Subfield Area"
                  value={subfield?.area}
                />
                <TextField
                  fullWidth
                  disabled={true}
                  label="Subfield Recommended Fertilizer"
                  value={subfield?.recommendedFertilizerAmount}
                />
                <Button
                  onClick={() =>
                    setSelectedMeasurement(
                      id,
                      "positions",
                      id in selectedMeasurements.positions
                        ? undefined
                        : position
                    )
                  }
                >
                  {id in selectedMeasurements.positions
                    ? "Hide measurement position"
                    : "Show measurement position"}
                </Button>
                <Button
                  onClick={() =>
                    setSelectedMeasurement(
                      id,
                      "subfields",
                      id in selectedMeasurements.subfields
                        ? undefined
                        : subfield.coordinates
                    )
                  }
                >
                  {id in selectedMeasurements.subfields
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
          <Typography>
            No measurement positions available. <br />
            Make sure field and season selected before determining the
            measurement positions
          </Typography>
          <Button
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
      const option = e.target.name;
      const value = e.target.value;
      const options = { ...prevOptions };
      if (value) options[option] = value;
      else delete options?.[option];
      return options;
    });
  };

  const updateMeasurementValues = () => {
    fields.forEach(({ name, isNumber }) => {
      if (isNumber && name in options) {
        options[name] = +options[name];
      }
    });
    updateMeasurement(measurement.id, options)
      .then((message) => notify({ message: message, isError: false }))
      .catch((error) => notify({ message: error, isError: true }));
  };

  return (
    <>
      {fields.map(({ name, label }) => (
        <TextField
          fullWidth
          name={name}
          label={label}
          value={measurement?.[name]}
          onChange={onChangeOptions}
          error={name in options && !(options[name] instanceof Number)}
        />
      ))}
      <Button
        disabled={
          fields.every(({ name }) => options?.[name] === measurement[name]) ||
          fields.filter(
            ({ name }) => name in options && !(options[name] instanceof Number)
          )
        }
        onClick={updateMeasurementValues}
      >
        Update measurement values
      </Button>
    </>
  );
}
