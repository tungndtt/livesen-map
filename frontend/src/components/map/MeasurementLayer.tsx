import { Fragment, useState, useEffect, useMemo } from "react";
import L from "leaflet";
import { useMap, Marker, Polygon, FeatureGroup } from "react-leaflet";
import proj4 from "proj4";
import { useMeasurementContext } from "../../contexts/MeasurementContext";
import { useFieldContext } from "../../contexts/FieldContext";
import ndvi2RBGA from "../../utils/ndvi2RBGA";
import { Box, Typography } from "@mui/material";

window.proj4 = proj4;

export default function MeasurementLayer() {
  const { measurementCoordinates, measurementNdviRange } =
    useMeasurementContext();
  const { coordinates } = useFieldContext();
  const field = useMemo(
    () => (coordinates ? new L.Polygon(coordinates) : undefined),
    [coordinates]
  );
  const measurementEntries = useMemo(
    () => Object.entries(measurementCoordinates ?? {}),
    [measurementCoordinates]
  );
  const map = useMap();
  const [highlights, setHighlights] = useState<{
    [measurementId: string]: boolean;
  }>({});

  useEffect(() => {
    if (measurementEntries.length > 0 && field) {
      map.fitBounds(field.getBounds());
    }
  }, [map, measurementEntries]);

  return (
    <FeatureGroup>
      {measurementNdviRange && measurementEntries.length > 0 && (
        <Box
          sx={{
            position: "absolute",
            right: "10px",
            top: "10px",
            zIndex: 1000,
          }}
        >
          <GradientBar {...measurementNdviRange} />
        </Box>
      )}
      {measurementEntries.map(([measurementId, { position, subfields }]) => {
        const eventHandlers = {
          mouseover: () =>
            setHighlights((prevHighlights) => ({
              ...prevHighlights,
              [measurementId]: true,
            })),
          mouseout: () =>
            setHighlights((prevHighlights) => ({
              ...prevHighlights,
              [measurementId]: false,
            })),
        };
        return (
          <Fragment key={measurementId}>
            {subfields.map(({ id, coordinates, ndvi }) => (
              <Fragment key={`${id}-${highlights?.[measurementId]}`}>
                <Polygon
                  eventHandlers={eventHandlers}
                  positions={coordinates}
                  color={ndvi2RBGA(ndvi)}
                  fillOpacity={highlights?.[measurementId] ? 0.9 : 0.8}
                  stroke={highlights?.[measurementId] ? true : false}
                />
              </Fragment>
            ))}
            <Marker eventHandlers={eventHandlers} position={position} />
          </Fragment>
        );
      })}
    </FeatureGroup>
  );
}

type GradientBarProps = {
  low: number;
  high: number;
  bins: number;
};

function GradientBar({ low, high, bins }: GradientBarProps) {
  const step = (high - low) / bins;
  return (
    <Box sx={{ display: "flex", flexDirection: "column", width: "500px" }}>
      <Box
        sx={{
          display: "flex",
          flexDirection: "row",
          width: "100%",
          height: "10px",
        }}
      >
        {Array.from(Array(bins).keys()).map((factor) => (
          <Box
            key={`bin-${factor}`}
            sx={{
              border: "1px solid black",
              background: `linear-gradient(to right, ${ndvi2RBGA(
                low + step * factor
              )}, ${ndvi2RBGA(low + step * (factor + 1))})`,
              width: "100%",
            }}
          />
        ))}
      </Box>
      <Box
        sx={{
          display: "flex",
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          width: "100%",
        }}
      >
        {Array.from(Array(bins + 1).keys()).map((factor) => (
          <Typography key={`ndvi-${factor}`} variant="caption" gutterBottom>
            <b>{(low + step * factor).toFixed(2)}</b>
          </Typography>
        ))}
      </Box>
    </Box>
  );
}
