import { useState } from "react";
import { Box, FormControl, InputLabel, MenuItem, Select } from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers";
import FieldGroups, { FieldGroup } from "../../utils/FieldGroups";
import { useAuthenticationContext } from "../../contexts/AuthenticationContext";
import { useNotificationContext } from "../../contexts/NotificationContext";
import { useSelectionContext } from "../../contexts/SelectionContext";
import date2YMD from "../../utils/date2YMD";
import dayjs from "dayjs";
import { deparseSeason } from "../../types/season";

const fieldGroups = [
  {
    group: "General Information",
    fields: [
      { fieldId: "maincrop", label: "Main Crop", type: "string" },
      { fieldId: "intercrop", label: "Inter Crop", type: "string" },
      { fieldId: "soilType", label: "Soil Type", type: "string" },
      { fieldId: "variety", label: "Variety", type: "string" },
      { fieldId: "seedDensity", label: "Seed Density", type: "number" },
      { fieldId: "seedDate", label: "Seed Date", type: "date" },
    ],
  },
  {
    groupId: "fertilizerApplications",
    group: "Fertilizer Application Information",
    fields: [
      { fieldId: "fertilizer", label: "Fertilizer", type: "string" },
      { fieldId: "type", label: "Fertilizer Type", type: "string" },
      { fieldId: "amount", label: "Fertilizer Amount", type: "number" },
      {
        fieldId: "nitrogen",
        label: "Plant-shared Nitrogen (mg/L)",
        type: "number",
      },
      { fieldId: "date", label: "Fertilizer Date", type: "date" },
      { fieldId: "stadium", label: "EC Stadium", type: "number" },
    ],
  },
  {
    groupId: "soilTillageApplications",
    group: "Soil Tillage Application Information",
    fields: [
      { fieldId: "type", label: "Soil Tillage Type", type: "string" },
      { fieldId: "date", label: "Soil Tillage Date", type: "date" },
    ],
  },
  {
    groupId: "cropProtectionApplications",
    group: "Crop Protection Application Information",
    fields: [
      { fieldId: "type", label: "Crop Protection Type", type: "string" },
      { fieldId: "amount", label: "Crop Protection Amount", type: "number" },
      { fieldId: "date", label: "Crop Protection Date", type: "date" },
    ],
  },
  {
    group: "Nutrient Information",
    fields: [
      { fieldId: "nitrate", label: "Nitrate (mg/L)", type: "number" },
      { fieldId: "phosphor", label: "Phosphor (mg/L)", type: "number" },
      { fieldId: "potassium", label: "Potassium (mg/L)", type: "number" },
      { fieldId: "rks", label: "RKS (mg/L)", type: "number" },
      { fieldId: "ph", label: "Ph (mg/L)", type: "number" },
    ],
  },
  {
    group: "Harvest Information",
    fields: [
      {
        fieldId: "harvestWeight",
        label: "Harvest Weight (kg)",
        type: "number",
      },
      { fieldId: "harvestDate", label: "Harvest Date", type: "date" },
    ],
  },
] as FieldGroup[];

const data = {};

export default function SeasonInterest() {
  const { authenticationToken } = useAuthenticationContext();
  const { fieldOptions, selectedFieldId, refreshSeasonOptions } =
    useSelectionContext();
  const notify = useNotificationContext();
  const [fieldId, setFieldId] = useState<number | undefined>(undefined);
  const [season, setSeason] = useState<Date | undefined>(undefined);
  const serverUrl = process.env.REACT_APP_SERVER_URL + "/season";

  const registerSeason = (data: any) => {
    if (fieldId && season && authenticationToken) {
      const seasonId = date2YMD(season);
      fetch(`${serverUrl}/register/${fieldId}/${seasonId}`, {
        headers: {
          "Content-Type": "application/json",
          "Auth-Token": authenticationToken,
        },
        method: "POST",
        body: JSON.stringify(deparseSeason(data)),
      })
        .then(async (response) => {
          const responseBody = await response.json();
          if (response.ok) {
            if (selectedFieldId === fieldId) refreshSeasonOptions();
            notify({
              message: "Successfully register the season information",
              isError: false,
            });
          } else {
            notify({ message: responseBody["data"], isError: true });
          }
        })
        .catch((error) => notify({ message: error.message, isError: true }));
    }
  };

  return (
    <Box className="information-container">
      <FormControl fullWidth size="small">
        <InputLabel id="field-select-label">Field</InputLabel>
        <Select
          labelId="field-select-label"
          id="field-select"
          value={fieldId ?? ""}
          name="field"
          label="Field"
          onChange={(e) => setFieldId(+e.target.value as number)}
        >
          {fieldOptions?.map(({ id, name }) => (
            <MenuItem key={id} value={id}>
              {name}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
      <DatePicker
        label={"Season"}
        slotProps={{ textField: { size: "small", fullWidth: true } }}
        value={dayjs(season ?? null)}
        onChange={(value) => setSeason(value?.toDate())}
      />
      <FieldGroups
        fieldGroups={fieldGroups}
        data={data}
        submitProps={{
          submitTitle: "Register Season",
          submitDisabled: !fieldId || !season,
          onSubmit: registerSeason,
          resetOnSubmit: true,
        }}
      />
    </Box>
  );
}
