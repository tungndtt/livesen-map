import { ChangeEvent, useEffect, useState } from "react";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Button,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Typography,
} from "@mui/material";
import UpgradeIcon from "@mui/icons-material/Upgrade";
import ClearIcon from "@mui/icons-material/Clear";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { useAuthenticationContext } from "../../../contexts/AuthenticationContext";
import { useFieldContext } from "../../../contexts/FieldContext";
import { usePeriodContext } from "../../../contexts/PeriodContext";
import { useNotificationContext } from "../../../contexts/NotificationContext";
import { Season, SeasonField } from "../../../types/season";

type Field = {
  name: string;
  label: string;
  isNumber?: boolean;
  disabled?: boolean;
};

type FieldGroup = {
  label: string;
  fields: Field[];
};

const fieldGroups = [
  { name: "soil_type", label: "Soil Type" },
  { name: "variety", label: "Variety" },
  { name: "seed_density", label: "Seed Density", isNumber: true },
  { name: "yield", label: "Yield", isNumber: true, disabled: true },
  {
    label: "Fertilizer Amount",
    fields: [
      {
        name: "max_allowed_fertilizer",
        label: "Max Allowed Fertilizer",
        isNumber: true,
      },
      {
        name: "first_fertilizer_amount",
        label: "1. Fertilizer Amount",
        isNumber: true,
      },
      {
        name: "second_fertilizer_amount",
        label: "2. Fertilizer Amount",
        isNumber: true,
      },
      {
        name: "recommended_fertilizer_amount",
        label: "Recommended Fertilizer Amount",
        isNumber: true,
        disabled: true,
      },
    ],
  },
  {
    label: "Soil Tillage",
    fields: [
      { name: "first_soil_tillage", label: "1. Soil Tillage" },
      { name: "second_soil_tillage", label: "2. Soil Tillage" },
    ],
  },
  {
    label: "Crop Protection",
    fields: [
      { name: "first_crop_protection", label: "1. Crop Protection" },
      { name: "second_crop_protection", label: "2. Crop Protection" },
    ],
  },
  {
    label: "Nutrient Values",
    fields: [
      { name: "nitrate", label: "Nitrate", isNumber: true },
      { name: "phosphor", label: "Phosphor", isNumber: true },
      { name: "potassium", label: "Potassium", isNumber: true },
      { name: "ph", label: "Ph", isNumber: true },
    ],
  },
] as (Field | FieldGroup)[];

export default function SeasonTab() {
  const { authenticationToken } = useAuthenticationContext();
  const { selectedField } = useFieldContext();
  const { selectedPeriod } = usePeriodContext();
  const notify = useNotificationContext();
  const [season, setSeason] = useState<Season | undefined>(undefined);
  const [options, setOptions] = useState<Season>({});
  const serverUrl = process.env.REACT_APP_SERVER_URL + "/season";

  useEffect(() => {
    if (selectedField?.id && selectedPeriod && authenticationToken) {
      fetch(`${serverUrl}/${selectedField.id}/${selectedPeriod}`, {
        headers: { "Auth-Token": authenticationToken },
        method: "GET",
      })
        .then(async (response) => {
          const responseBody = await response.json();
          if (response.ok) {
            setSeason(responseBody);
            setOptions(responseBody);
          }
        })
        .catch((error) => notify({ message: error.message, isError: true }));
    } else {
      setSeason(undefined);
      setOptions({});
    }
  }, [selectedField?.id, selectedPeriod, authenticationToken]);

  const updateSeason = () => {
    if (selectedField?.id && selectedPeriod && authenticationToken) {
      fetch(`${serverUrl}/upregister/${selectedField.id}/${selectedPeriod}`, {
        headers: {
          "Content-Type": "application/json",
          "Auth-Token": authenticationToken,
        },
        method: "POST",
        body: JSON.stringify(options),
      })
        .then(async (response) => {
          const responseBody = await response.json();
          if (response.ok) {
            setSeason(responseBody);
            setOptions(responseBody);
            notify({
              message: "Successfully update the season information",
              isError: false,
            });
          } else {
            notify({ message: responseBody["data"], isError: true });
          }
        })
        .catch((error) => notify({ message: error.message, isError: true }));
    }
  };

  const onChangeOptions = (e: ChangeEvent<HTMLInputElement>) => {
    setOptions((prevOptions) => {
      const name = e.target.name;
      const value =
        e.target.type === "number" ? +e.target.value : e.target.value;
      return { ...prevOptions, [name]: value };
    });
  };

  return (
    <Box className="general-container subtab-container">
      <FormControl fullWidth size="small">
        <InputLabel id="intercop-select-label">Intercrop</InputLabel>
        <Select
          labelId="intercop-select-label"
          id="intercrop-select"
          value={options?.["intercrop"] ?? false}
          type="checkbox"
          name="intercrop"
          label="Intercrop"
          //@ts-ignore
          onChange={onChangeOptions}
        >
          {/*  @ts-ignore */}
          <MenuItem value={false}>False</MenuItem>
          {/*  @ts-ignore */}
          <MenuItem value={true}>True</MenuItem>
        </Select>
      </FormControl>
      {fieldGroups.map((fieldGroup) => {
        //@ts-ignore
        if (fieldGroup?.fields) {
          const group = fieldGroup as FieldGroup;
          return (
            <Accordion
              key={group.label}
              disableGutters
              sx={{
                boxShadow: "none",
                border: "2px solid #c7c7c7",
                borderRadius: "2px",
              }}
            >
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography>
                  <b>{group.label}</b>
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
                {group.fields.map(({ name, label, isNumber, disabled }) => (
                  <TextField
                    key={name}
                    fullWidth
                    size="small"
                    disabled={disabled}
                    name={name}
                    label={label}
                    type={isNumber ? "number" : "text"}
                    value={options?.[name as SeasonField] ?? ""}
                    onChange={onChangeOptions}
                  />
                ))}
              </AccordionDetails>
            </Accordion>
          );
        } else {
          const field = fieldGroup as Field;
          return (
            <TextField
              key={field.label}
              fullWidth
              size="small"
              disabled={field?.disabled}
              name={field.name}
              label={field.label}
              type={field?.isNumber ? "number" : "text"}
              value={options?.[field.name as SeasonField] ?? ""}
              onChange={onChangeOptions}
            />
          );
        }
      })}
      <Box className="button-row-container">
        <Button
          fullWidth
          size="small"
          variant="outlined"
          color="warning"
          endIcon={<UpgradeIcon />}
          disabled={
            options?.["intercrop"] === season?.["intercrop"] &&
            //@ts-ignore
            fieldGroups.every(function check(fieldGroup) {
              //@ts-ignore
              if (fieldGroup?.fields) {
                const group = fieldGroup as FieldGroup;
                return group.fields.every(check);
              } else {
                const field = fieldGroup as Field;
                const name = field.name;
                return (
                  options?.[name as SeasonField] ===
                  season?.[name as SeasonField]
                );
              }
            })
          }
          onClick={updateSeason}
        >
          Update season
        </Button>
        <Button
          sx={{ width: "40%" }}
          size="small"
          variant="outlined"
          color="error"
          endIcon={<ClearIcon />}
          onClick={() => setOptions(season ?? {})}
        >
          Reset
        </Button>
      </Box>
    </Box>
  );
}
