import { Box, Typography } from "@mui/material";
import ndvi2RBGA from "./ndvi2RBGA";

type GradientBarProps = {
  caption: string;
  low: number;
  high: number;
  lowLabel: number;
  highLabel: number;
  unknownColor?: string;
};

export default function GradientBar({
  caption,
  low,
  high,
  lowLabel,
  highLabel,
  unknownColor,
}: GradientBarProps) {
  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        gap: 1,
      }}
    >
      <Box sx={{ display: "flex", flexDirection: "column", width: "500px" }}>
        <Typography variant="caption">
          <b>{caption}</b>
        </Typography>
        <Box
          sx={{
            display: "flex",
            flexDirection: "row",
            width: "100%",
            height: "15px",
            paddingX: "2px",
            background: `linear-gradient(
              to right, 
              ${ndvi2RBGA(low)},
              ${ndvi2RBGA(high)}
            )`,
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Typography variant="caption" align="center">
            <b>{lowLabel.toFixed(3)}</b>
          </Typography>
          <Typography variant="caption" align="center">
            <b>{highLabel.toFixed(3)}</b>
          </Typography>
        </Box>
      </Box>
      {unknownColor && (
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            width: "fit-content",
          }}
        >
          <Typography variant="caption">
            <b>N/A</b>
          </Typography>
          <Box
            sx={{
              width: "15px",
              background: unknownColor,
              height: "15px",
            }}
          />
        </Box>
      )}
    </Box>
  );
}
