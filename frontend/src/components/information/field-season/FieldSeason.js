import { useState } from "react";
import {
  Box,
  Button,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Tab,
  Tabs,
} from "@mui/material";
import { useFieldContext } from "../../../contexts/FieldContext";
import { usePeriodContext } from "../../../contexts/PeriodContext";
import FieldTab from "./FieldTab";
import SeasonTab from "./SeasonTab";
import MeasurementTab from "./MeasurementTab";

const tabs = [
  { name: "Field", component: <FieldTab /> },
  { name: "Season", component: <SeasonTab /> },
  { name: "Measurement", component: <MeasurementTab /> },
];

export default function FieldSeason() {
  const { fields, selectedField, setSelectedField } = useFieldContext();
  const { periods, selectedPeriod, setSelectedPeriod } = usePeriodContext();
  const [selections, setSelections] = useState({
    field: selectedField?.id,
    period: selectedPeriod,
  });
  const [tab, setTab] = useState(0);

  return (
    <Box>
      <Box
        sx={{
          display: "flex",
          flexDirection: "row",
          justifyContent: "space-between",
          gap: 1,
          mb: 2,
        }}
      >
        <FormControl fullWidth size="small">
          <InputLabel id="field-select-label">Field</InputLabel>
          <Select
            labelId="field-select-label"
            id="field-select"
            value={selections.field}
            label="Field"
            onChange={(e) =>
              setSelections((prevSelections) => ({
                ...prevSelections,
                field: e.target.value,
              }))
            }
          >
            <MenuItem value={undefined}>
              <em>None</em>
            </MenuItem>
            {fields.map(({ id, name }) => (
              <MenuItem key={id} value={id}>
                {name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <FormControl fullWidth size="small">
          <InputLabel id="period-select-label">Period</InputLabel>
          <Select
            labelId="period-select-label"
            id="period-select"
            value={selections.period}
            label="Period"
            onChange={(e) =>
              setSelections((prevSelections) => ({
                ...prevSelections,
                period: e.target.value,
              }))
            }
          >
            <MenuItem value={undefined}>
              <em>None</em>
            </MenuItem>
            {periods.map(({ id, data }) => (
              <MenuItem key={id} value={id}>
                {data}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <Button
          onClick={() => {
            if (selections.field !== selectedField?.id) {
              setSelectedField({ id: selections.field });
            }
            if (selections.period !== selectedPeriod) {
              setSelectedPeriod(selections.period);
            }
          }}
        >
          Retrieve data
        </Button>
      </Box>
      <Tabs
        value={tab}
        sx={{
          borderBottom: 1,
          borderColor: "divider",
          marginTop: "40px",
        }}
        variant="scrollable"
        onChange={(_, newTab) => setTab(newTab)}
      >
        {tabs.map(({ name }, i) => (
          <Tab key={name} label={name} value={i} />
        ))}
      </Tabs>
      {tabs.map(({ name, component }, i) => (
        <Box key={name} hidden={tab !== i}>
          {component}
        </Box>
      ))}
    </Box>
  );
}
