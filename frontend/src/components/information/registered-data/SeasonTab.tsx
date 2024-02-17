import { useEffect, useState } from "react";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Autocomplete,
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
import { useMetadataContext } from "../../../contexts/MetadataContext";
import { useSeasonContext } from "../../../contexts/SeasonContext";
import { Season, parseSeason, deparseSeason } from "../../../types/season";

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

type FertilizerRecommendation = {
  fertilizer: string;
  recommendation?: number;
};

export default function SeasonInterest() {
  const notify = useNotificationContext();
  const { doRequest } = useAuthenticationContext();
  const { selectedFieldId, selectedSeasonId } = useSelectionContext();
  const { categories } = useMetadataContext();
  const { season, updateSeason, deleteSeason } = useSeasonContext();
  const [fertilizerRecommendation, setFertilizerRecommendation] =
    useState<FertilizerRecommendation>({ fertilizer: "" });

  const recommendSeasonFertilizer = () => {
    if (selectedFieldId && selectedSeasonId) {
      doRequest(
        `season/recommend_fertilizer/${selectedFieldId}/${selectedSeasonId}`,
        "POST",
        { fertilizer: fertilizerRecommendation.fertilizer }
      )
        .then(async (response) => {
          const responseBody = await response.json();
          setFertilizerRecommendation((prevFertilizerRecommendation) => ({
            ...prevFertilizerRecommendation,
            recommendation: responseBody["data"],
          }));
        })
        .catch((error) => notify({ message: error, isError: true }));
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
                <b>Fertilizer Application Recommendation</b>
              </Typography>
            </AccordionSummary>
            <AccordionDetails
              sx={{
                display: "flex",
                flexDirection: "column",
                gap: 1,
                alignItems: "start",
              }}
            >
              <Box
                sx={{
                  display: "flex",
                  flexDirection: "row",
                  width: "100%",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: 1,
                }}
              >
                <Autocomplete
                  fullWidth
                  size="small"
                  value={fertilizerRecommendation.fertilizer}
                  onChange={(_, value) =>
                    setFertilizerRecommendation({ fertilizer: value ?? "" })
                  }
                  options={categories?.fertilizer ?? []}
                  renderInput={(params) => (
                    <TextField {...params} variant="standard" />
                  )}
                />
                <Button
                  variant="outlined"
                  color="primary"
                  disabled={!fertilizerRecommendation.fertilizer}
                  onClick={recommendSeasonFertilizer}
                >
                  Recommend
                </Button>
              </Box>
              <Typography>
                Recommended Amount (mg/L):{" "}
                <b>
                  {fertilizerRecommendation.recommendation
                    ? fertilizerRecommendation.recommendation?.toFixed(3)
                    : "N/A"}
                </b>
              </Typography>
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
            sx={{ mb: 1 }}
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
