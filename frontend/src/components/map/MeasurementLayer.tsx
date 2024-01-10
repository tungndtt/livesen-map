import { Fragment, useState, useEffect, useMemo } from "react";
import { Box, Menu, MenuItem, PopoverPosition } from "@mui/material";
import L from "leaflet";
import { useMap, Marker, Polygon, FeatureGroup, Tooltip } from "react-leaflet";
import proj4 from "proj4";
import { useMeasurementContext } from "../../contexts/MeasurementContext";
import { useFieldContext } from "../../contexts/FieldContext";
import { Coordinate } from "../../types/coordinate";
import GradientBar from "../../utils/GradientBar";
import ndvi2RBGA from "../../utils/ndvi2RBGA";
import number2RBG from "../../utils/number2RBG";

window.proj4 = proj4;

// TODO: change this hard-coded values
const unknownColor = "grey";
const maxFertilizer = 80;

export default function MeasurementLayer() {
  const {
    positions,
    subfields,
    visibility,
    recommendationVisible,
    updateMeasurementPosition,
  } = useMeasurementContext();
  const { coordinates } = useFieldContext();
  const field = useMemo(
    () => (coordinates ? new L.Polygon(coordinates) : undefined),
    [coordinates]
  );
  const measurementIds = useMemo(
    () => Object.keys(visibility ?? {}).map(Number),
    [visibility]
  );
  const [subfieldRecommendFertilizerLow, subfieldRecommendFertilizerHigh] =
    useMemo(() => {
      let low = maxFertilizer;
      let high = 0;
      Object.values(subfields ?? {}).forEach((subfield) =>
        subfield.forEach(({ recommendedFertilizerAmount }) => {
          low = Math.min(low, recommendedFertilizerAmount);
          high = Math.max(high, recommendedFertilizerAmount);
        })
      );
      return [low / maxFertilizer, high / maxFertilizer];
    }, [subfields]);
  const [menuContext, setMenuContext] = useState<
    | { anchor: PopoverPosition; position: Coordinate; measurementId: number }
    | undefined
  >(undefined);
  const map = useMap();

  useEffect(() => {
    if (measurementIds.length > 0 && field) {
      map.fitBounds(field.getBounds());
    }
  }, [map, measurementIds]);

  return (
    <FeatureGroup>
      {recommendationVisible && measurementIds.length > 0 && (
        <Box
          sx={{
            position: "absolute",
            right: "10px",
            zIndex: 1000,
          }}
        >
          <GradientBar
            caption="Subfield Recommended Fertilizer Amount (mg/L)"
            low={1 - subfieldRecommendFertilizerLow}
            high={1 - subfieldRecommendFertilizerHigh}
            lowLabel={subfieldRecommendFertilizerLow * maxFertilizer}
            highLabel={subfieldRecommendFertilizerHigh * maxFertilizer}
            unknownColor={unknownColor}
          />
        </Box>
      )}
      {measurementIds.map((measurementId) => (
        <Fragment key={`${measurementId}-${recommendationVisible}`}>
          {subfields?.[measurementId].map(
            ({ id, coordinates, ndvi, area, recommendedFertilizerAmount }) => (
              <Polygon
                key={`${id}-${recommendationVisible}-${recommendedFertilizerAmount}`}
                positions={coordinates}
                eventHandlers={{
                  contextmenu: (e) => {
                    const event = e.originalEvent;
                    event.preventDefault();
                    setMenuContext({
                      anchor: {
                        top: event.clientY,
                        left: event.clientX,
                      },
                      position: e.latlng,
                      measurementId: measurementId,
                    });
                  },
                }}
                color={
                  recommendationVisible
                    ? recommendedFertilizerAmount
                      ? ndvi2RBGA(
                          1 - recommendedFertilizerAmount / maxFertilizer
                        )
                      : unknownColor
                    : number2RBG(measurementId)
                }
                fillOpacity={
                  recommendationVisible && recommendedFertilizerAmount
                    ? 1.0
                    : 0.6
                }
                stroke={false}
              >
                <Tooltip sticky>
                  <b>Measurement {measurementId}</b> <br />
                  Area (km²): <b>{(area * 1000000).toFixed(3)}</b> <br />
                  NDVI: <b>{ndvi.toFixed(3)}</b> <br />
                  {recommendationVisible && (
                    <>
                      Rec. Fert. Amount (mg/L):{" "}
                      <b>
                        {recommendedFertilizerAmount
                          ? recommendedFertilizerAmount.toFixed(3)
                          : "-"}
                      </b>
                    </>
                  )}
                </Tooltip>
              </Polygon>
            )
          )}
          <Marker position={positions?.[measurementId].position!!}>
            <Tooltip>
              <b>Measurement {measurementId}</b>
            </Tooltip>
          </Marker>
        </Fragment>
      ))}
      <Menu
        open={!!menuContext}
        onClose={() => setMenuContext(undefined)}
        anchorReference="anchorPosition"
        anchorPosition={menuContext?.anchor}
      >
        <MenuItem
          onClick={() => {
            if (menuContext) {
              updateMeasurementPosition({
                id: menuContext.measurementId,
                position: menuContext.position,
              });
              setMenuContext(undefined);
            }
          }}
        >
          Update the measuring position of measurement{" "}
          {menuContext?.measurementId}
        </MenuItem>
      </Menu>
    </FeatureGroup>
  );
}
