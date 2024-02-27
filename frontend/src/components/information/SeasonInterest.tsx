import { useState } from "react";
import { Box, FormControl, InputLabel, MenuItem, Select } from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers";
import FieldGroups, { FieldGroup } from "../../utils/FieldGroups";
import { useNotificationContext } from "../../contexts/NotificationContext";
import { useAuthenticationContext } from "../../contexts/AuthenticationContext";
import { useSelectionContext } from "../../contexts/SelectionContext";
import date2YMD from "../../utils/date2YMD";
import dayjs from "dayjs";
import { deparseSeason } from "../../types/season";

const fieldGroups = [
  {
    group: "General",
    fields: [
      {
        fieldId: "maincrop",
        label: "Main Crop",
        type: "category",
        categoryId: "crop",
      },
      {
        fieldId: "intercrop",
        label: "Inter Crop",
        type: "category",
        categoryId: "crop",
      },
      {
        fieldId: "soilType",
        label: "Soil Type",
        type: "category",
        categoryId: "soil",
      },
      {
        fieldId: "variety",
        label: "Variety",
        type: "category",
        categoryId: "variety",
      },
      { fieldId: "seedDensity", label: "Seed Density", type: "number" },
      { fieldId: "seedDate", label: "Seed Date", type: "date" },
    ],
  },
  {
    groupId: "fertilizerApplications",
    group: "Fertilizer Application",
    fields: [
      {
        fieldId: "fertilizer",
        label: "Fertilizer",
        type: "category",
        categoryId: "fertilizer",
      },
      {
        fieldId: "type",
        label: "Fertilizer Type",
        type: "category",
        categoryId: "fertilizerType",
      },
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
    group: "Soil Tillage",
    fields: [
      {
        fieldId: "type",
        label: "Soil Tillage Type",
        type: "category",
        categoryId: "soilTillage",
      },
      { fieldId: "date", label: "Soil Tillage Date", type: "date" },
    ],
  },
  {
    groupId: "cropProtectionApplications",
    group: "Crop Protection",
    fields: [
      {
        fieldId: "type",
        label: "Crop Protection Type",
        type: "category",
        categoryId: "cropProtection",
      },
      { fieldId: "amount", label: "Crop Protection Amount", type: "number" },
      { fieldId: "date", label: "Crop Protection Date", type: "date" },
    ],
  },
  {
    group: "Nutrient",
    fields: [
      { fieldId: "nitrate", label: "Nitrate (mg/L)", type: "number" },
      { fieldId: "phosphor", label: "Phosphor (mg/L)", type: "number" },
      { fieldId: "potassium", label: "Potassium (mg/L)", type: "number" },
      { fieldId: "rks", label: "RKS (mg/L)", type: "number" },
      { fieldId: "ph", label: "Ph (mg/L)", type: "number" },
    ],
  },
  {
    group: "Harvestment",
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

export default function SeasonInterest() {
  const { doRequest } = useAuthenticationContext();
  const { fieldOptions } = useSelectionContext();
  const notify = useNotificationContext();
  const [fieldId, setFieldId] = useState<number | undefined>(undefined);
  const [season, setSeason] = useState<Date | undefined>(undefined);

  const registerSeason = (data: any) => {
    if (fieldId && season) {
      const seasonId = date2YMD(season);
      doRequest(
        `season/register/${fieldId}/${seasonId}`,
        "POST",
        deparseSeason(data)
      )
        .then(() => {
          notify({
            message: "Successfully register the season information",
            isError: false,
          });
        })
        .catch((error) => notify({ message: error, isError: true }));
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
        data={{}}
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
