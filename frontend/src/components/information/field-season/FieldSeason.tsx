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
import GetAppIcon from "@mui/icons-material/GetApp";
import ClearIcon from "@mui/icons-material/Clear";
import { useFieldContext } from "../../../contexts/FieldContext";
import { usePeriodContext } from "../../../contexts/PeriodContext";
import FieldTab from "./FieldTab";
import SeasonTab from "./SeasonTab";
import MeasurementTab from "./MeasurementTab";

export default function FieldSeason() {
  const { fields, selectedField, setSelectedField } = useFieldContext();
  const { periods, selectedPeriod, setSelectedPeriod } = usePeriodContext();
  const [selections, setSelections] = useState({
    field: selectedField?.id || -1,
    period: selectedPeriod || "",
  });
  const [tab, setTab] = useState(0);

  return (
    <Box className="general-container">
      <Box sx={{ display: "flex", flexDirection: "column" }}>
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
              type="number"
              label="Field"
              onChange={(e) =>
                setSelections((prevSelections) => ({
                  ...prevSelections,
                  field: e.target.value as number,
                }))
              }
            >
              {fields?.map(({ id, name }) => (
                <MenuItem key={id} value={id}>
                  {name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl fullWidth size="small">
            <InputLabel id="period-select-label">Season</InputLabel>
            <Select
              labelId="period-select-label"
              id="period-select"
              value={selections.period}
              label="Season"
              onChange={(e) =>
                setSelections((prevSelections) => ({
                  ...prevSelections,
                  period: e.target.value,
                }))
              }
            >
              {periods?.map(({ id, data }) => (
                <MenuItem key={id} value={id}>
                  {data}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
        <Box className="button-row-container">
          <Button
            fullWidth
            size="small"
            variant="outlined"
            endIcon={<GetAppIcon />}
            disabled={selections.field === -1}
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
          <Button
            sx={{ width: "42%" }}
            size="small"
            variant="outlined"
            color="error"
            endIcon={<ClearIcon />}
            onClick={() => {
              setSelectedField(undefined);
              setSelectedPeriod("");
              setSelections({ field: -1, period: "" });
            }}
          >
            Reset data
          </Button>
        </Box>
      </Box>
      <Tabs
        value={tab}
        sx={{
          borderBottom: 1,
          borderColor: "divider",
        }}
        variant="scrollable"
        onChange={(_, newTab) => setTab(newTab)}
      >
        {["Field", "Season", "Measurement"].map((name, i) => (
          <Tab key={name} label={name} value={i} />
        ))}
      </Tabs>
      <Box display={tab === 0 ? "flex" : "none"}>
        <FieldTab />
      </Box>
      <Box display={tab === 1 ? "flex" : "none"}>
        <SeasonTab />
      </Box>
      <Box display={tab === 2 ? "flex" : "none"}>
        <MeasurementTab />
      </Box>
    </Box>
  );
}
