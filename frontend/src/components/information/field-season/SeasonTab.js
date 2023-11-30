import { useEffect, useState } from "react";
import { Box, Button, TextField } from "@mui/material";
import SendIcon from "@mui/icons-material/Send";
import { useAuthenticationContext } from "../../../contexts/AuthenticationContext";
import { useFieldContext } from "../../../contexts/FieldContext";
import { usePeriodContext } from "../../../contexts/PeriodContext";
import { useNotificationContext } from "../../../contexts/NotificationContext";

const fieldGroups = [
  [
    {
      name: "max_allowed_fertilizer",
      label: "Max Allowed Fertilizer",
      isNumber: true,
    },
    { name: "seed_density", label: "Seed Density", isNumber: true },
  ],
  [
    { name: "soil_type", label: "Soil Type" },
    { name: "variety", label: "Variety" },
  ],

  [
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
  ],
  [
    { name: "first_soil_tillage", label: "1. Soil Tillage" },
    { name: "second_soil_tillage", label: "2. Soil Tillage" },
  ],
  [
    { name: "first_crop_protection", label: "1. Crop Protection" },
    { name: "second_crop_protection", label: "2. Crop Protection" },
  ],
  [
    { name: "nitrate", label: "Nitrate", isNumber: true },
    { name: "phosphor", label: "Phosphor", isNumber: true },
    { name: "potassium", label: "Potassium", isNumber: true },
  ],
  [
    { name: "ph", label: "Ph", isNumber: true },
    { name: "yield", label: "Yield", isNumber: true, disabled: true },
  ],
  [
    {
      name: "recommended_fertilizer_amount",
      label: "Recommended Fertilizer Amount",
      isNumber: true,
      disabled: true,
    },
  ],
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
        .catch((error) => notify({ message: error.message, isError: true }));
    } else {
      setSeason(undefined);
      setOptions(undefined);
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

  const onChangeOptions = (e) => {
    setOptions((prevOptions) => {
      const name = e.target.name;
      const value =
        e.target.type === "number" ? +e.target.value : e.target.value;
      return { ...prevOptions, [name]: value };
    });
  };

  return (
    <Box
      className="general-container"
      sx={{ p: 0, overflow: "auto", maxHeight: "calc(100vh - 190px)", pr: 1 }}
    >
      {fieldGroups.map((fieldGroup) => (
        <Box
          sx={{
            display: "flex",
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 1,
          }}
        >
          {fieldGroup.map(({ name, label, isNumber, disabled }) => (
            <TextField
              fullWidth
              size="small"
              disabled={disabled}
              key={name}
              name={name}
              label={label}
              type={isNumber ? "number" : "text"}
              value={options?.[name] ?? ""}
              onChange={onChangeOptions}
            />
          ))}
        </Box>
      ))}
      <Button
        fullWidth
        size="small"
        variant="outlined"
        color="warning"
        endIcon={<SendIcon />}
        disabled={fieldGroups
          .flat()
          .every(({ name }) => options?.[name] === season?.[name])}
        onClick={updateSeason}
      >
        Update season
      </Button>
    </Box>
  );
}
