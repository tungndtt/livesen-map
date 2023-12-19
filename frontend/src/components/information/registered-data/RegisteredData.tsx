import { useState } from "react";
import {
  Box,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Tab,
  Tabs,
} from "@mui/material";
import { useSelectionContext } from "../../../contexts/SelectionContext";
import FieldTab from "./FieldTab";
import SeasonTab from "./SeasonTab";
import MeasurementTab from "./MeasurementTab";

export default function RegisteredData() {
  const {
    fieldOptions,
    selectedFieldId,
    setSelectedFieldId,
    seasonOptions,
    selectedSeasonId,
    setSelectedSeasonId,
  } = useSelectionContext();
  const [tab, setTab] = useState(0);

  return (
    <Box className="information-container">
      <Box
        sx={{
          display: "flex",
          flexDirection: "row",
          justifyContent: "space-between",
          gap: 1,
          maxHeight: "30px",
        }}
      >
        <FormControl fullWidth size="small">
          <InputLabel id="field-select-label">Field</InputLabel>
          <Select
            labelId="field-select-label"
            id="field-select"
            value={selectedFieldId ?? ""}
            type="number"
            label="Field"
            onChange={(e) => setSelectedFieldId(+e.target.value)}
          >
            {fieldOptions?.map(({ id, name }) => (
              <MenuItem key={id} value={id}>
                {name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <FormControl fullWidth size="small">
          <InputLabel id="season-select-label">Season</InputLabel>
          <Select
            labelId="season-select-label"
            id="season-select"
            value={selectedSeasonId ?? ""}
            label="Season"
            onChange={(e) => setSelectedSeasonId(e.target.value)}
          >
            {seasonOptions?.map(({ id, label }) => (
              <MenuItem key={id} value={id}>
                {label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>
      <Box maxHeight="calc(100% - 30px)" display="flex" flexDirection="column">
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
        <Box
          sx={{
            display: tab === 0 ? "flex" : "none",
            overflow: "hidden",
            overflowY: "auto",
          }}
        >
          <FieldTab />
        </Box>
        <Box
          sx={{
            display: tab === 1 ? "flex" : "none",
            overflow: "hidden",
            overflowY: "auto",
          }}
        >
          <SeasonTab />
        </Box>
        <Box
          sx={{
            display: tab === 2 ? "flex" : "none",
            overflow: "hidden",
            overflowY: "auto",
          }}
        >
          <MeasurementTab />
        </Box>
      </Box>
    </Box>
  );
}
