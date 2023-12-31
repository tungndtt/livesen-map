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
import DeleteIcon from "@mui/icons-material/Delete";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import FieldGroups, { FieldGroup } from "../../../utils/FieldGroups";
import { useAuthenticationContext } from "../../../contexts/AuthenticationContext";
import { useNotificationContext } from "../../../contexts/NotificationContext";
import { useSelectionContext } from "../../../contexts/SelectionContext";
import { useSeasonContext } from "../../../contexts/SeasonContext";
import { Season, parseSeason, deparseSeason } from "../../../types/season";

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
      { fieldId: "nitrogen", label: "Plant-shared Nitrogen", type: "number" },
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
      { fieldId: "nitrate", label: "Nitrate", type: "number" },
      { fieldId: "phosphor", label: "Phosphor", type: "number" },
      { fieldId: "potassium", label: "Potassium", type: "number" },
      { fieldId: "rks", label: "RKS", type: "number" },
      { fieldId: "ph", label: "Ph", type: "number" },
    ],
  },
  {
    group: "Harvest Information",
    fields: [
      { fieldId: "harvestWeight", label: "Harvest Weight", type: "number" },
      { fieldId: "harvestDate", label: "Harvest Date", type: "date" },
    ],
  },
] as FieldGroup[];

export default function SeasonInterest() {
  const { authenticationToken } = useAuthenticationContext();
  const { selectedFieldId, selectedSeasonId, refreshSeasonOptions } =
    useSelectionContext();
  const { recommendedFertilizer, setRecommendedFertilizer } =
    useSeasonContext();
  const notify = useNotificationContext();
  const [season, setSeason] = useState<Season | undefined>(undefined);
  const serverUrl = process.env.REACT_APP_SERVER_URL + "/season";

  useEffect(() => {
    if (selectedFieldId && selectedSeasonId && authenticationToken) {
      fetch(`${serverUrl}/${selectedFieldId}/${selectedSeasonId}`, {
        headers: { "Auth-Token": authenticationToken },
        method: "GET",
      })
        .then(async (response) => {
          const responseBody = await response.json();
          if (response.ok) {
            const parsedSeason = parseSeason(responseBody);
            setSeason(parsedSeason);
            setRecommendedFertilizer(parsedSeason.recommendedFertilizerAmount);
          } else setSeason(undefined);
        })
        .catch((error) => notify({ message: error.message, isError: true }));
    } else {
      setSeason(undefined);
    }
  }, [selectedFieldId, selectedSeasonId, authenticationToken]);

  const updateSeason = (data: any) => {
    if (selectedFieldId && selectedSeasonId && authenticationToken) {
      fetch(`${serverUrl}/upgister/${selectedFieldId}/${selectedSeasonId}`, {
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
            setSeason(parseSeason(responseBody));
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

  const deleteSeason = () => {
    if (selectedFieldId && selectedSeasonId && authenticationToken) {
      fetch(`${serverUrl}/unregister/${selectedFieldId}/${selectedSeasonId}`, {
        headers: { "Auth-Token": authenticationToken },
        method: "DELETE",
      })
        .then(async (response) => {
          if (response.ok) {
            refreshSeasonOptions();
            notify({
              message: "Successfully unregister the season",
              isError: false,
            });
          } else {
            notify({
              message: "Failed to unregister the season",
              isError: true,
            });
          }
        })
        .catch((error) => notify({ message: error.message, isError: true }));
    }
  };

  return (
    <Box className="tab-container">
      {selectedFieldId && selectedSeasonId ? (
        <>
          <Accordion
            disableGutters
            sx={{
              boxShadow: "none",
              border: "2px solid #c7c7c7",
              borderRadius: "2px",
              mb: 2,
            }}
          >
            <AccordionSummary
              sx={{ maxHeight: "fit-content" }}
              expandIcon={<ExpandMoreIcon />}
            >
              <Typography>
                <b>Recommended Fertilizer Amount</b>
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              <TextField
                fullWidth
                size="small"
                name="recommendedFertilizerAmount"
                label="Recommended Fertilizer Amount"
                type="text"
                disabled
                value={recommendedFertilizer ?? "-"}
              />
            </AccordionDetails>
          </Accordion>
          <FieldGroups
            fieldGroups={fieldGroups}
            data={season}
            submitProps={{
              submitTitle: "Update Season",
              submitDisabled: !selectedFieldId || !selectedSeasonId,
              onSubmit: updateSeason,
            }}
          />
          <Button
            fullWidth
            size="small"
            variant="outlined"
            color="error"
            sx={{ mb: 2 }}
            endIcon={<DeleteIcon />}
            disabled={!selectedFieldId || !selectedSeasonId}
            onClick={deleteSeason}
          >
            Delete Season
          </Button>
        </>
      ) : (
        <Typography mt={10}>
          <b>No season selected</b>
        </Typography>
      )}
    </Box>
  );
}
