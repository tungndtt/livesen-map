import { useEffect, useState } from "react";
import { Box, Button, TextField } from "@mui/material";
import { useAuthenticationContext } from "../../contexts/AuthenticationContext";
import { useFieldContext } from "../../../contexts/FieldContext";
import { usePeriodContext } from "../../../contexts/PeriodContext";
import { useNotificationContext } from "./NotificationContext";

const fields = [
  {
    name: "max_allowed_fertilizer",
    label: "Max Allowed Fertilizer",
    isNumber: true,
  },
  { name: "soil_type", label: "Soil Type" },
  { name: "variety", label: "Variety" },
  { name: "seed_density", lael: "Seed Density", isNumber: true },
  {
    name: "first_fertilizer_amount",
    lael: "First Fertilizer Amount",
    isNumber: true,
  },
  {
    name: "second_fertilizer_amount",
    lael: "Second Fertilizer Amount",
    isNumber: true,
  },
  { name: "first_soil_tillage", label: "First Soil Tillage" },
  { name: "second_soil_tillage", label: "Second Soil Tillage" },
  { name: "first_crop_protection", label: "First Crop Protection" },
  { name: "second_crop_protection", label: "Second Crop Protection" },
  { name: "nitrate", label: "Nitrate", isNumber: true },
  { name: "phosphor", label: "Phosphor", isNumber: true },
  { name: "potassium", label: "Potassium", isNumber: true },
  { name: "ph", label: "Ph", isNumber: true },
  {
    name: "recommended_fertilizer_amount",
    label: "Recommended Fertilizer Amount",
    isNumber: true,
    disabled: true,
  },
  { name: "yield", label: "Yield", isNumber: true, disabled: true },
];

export default function SeasonTab() {
  const { authenticationToken } = useAuthenticationContext();
  const { selectedField } = useFieldContext();
  const { selectedPeriod } = usePeriodContext();
  const notify = useNotificationContext();
  const [season, setSeason] = useState(undefined);
  const [options, setOptions] = useState(undefined);
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
          } else notify({ message: responseBody["data"], isError: true });
        })
        .catch((error) => notify({ message: error, isError: true }));
    } else setSeason(undefined);
  }, [selectedField?.id, selectedPeriod, authenticationToken]);

  const updateSeason = () => {
    if (selectedField?.id && selectedPeriod && authenticationToken) {
      fields.forEach(({ name, isNumber }) => {
        if (isNumber && name in options) {
          options[name] = +options[name];
        }
      });
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
        .catch((error) => notify({ message: error, isError: true }));
    }
  };

  const onChangeOptions = (e) => {
    setOptions((prevOptions) => {
      const option = e.target.name;
      const value = e.target.value;
      if (value) prevOptions[option] = value;
      else delete prevOptions?.[option];
      return { ...prevOptions };
    });
  };

  return (
    <Box>
      {fields.map(({ name, label, isNumber, disabled }) => (
        <TextField
          fullWidth
          disabled={disabled}
          key={name}
          name={name}
          label={label}
          value={options?.[name] ?? ""}
          onChange={onChangeOptions}
          error={
            isNumber && name in options && !(options[name] instanceof Number)
          }
        />
      ))}
      <Button
        disabled={
          fields.every(({ name }) => options?.[name] === season?.[name]) ||
          fields.filter(
            ({ name, isNumber }) =>
              isNumber && name in options && !(options[name] instanceof Number)
          )
        }
        onClick={updateSeason}
      >
        Update season
      </Button>
    </Box>
  );
}
