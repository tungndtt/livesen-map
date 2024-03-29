import { Fragment, useState, useEffect, useMemo } from "react";
import { Menu, MenuItem, PopoverPosition } from "@mui/material";
import L from "leaflet";
import { useMap, Marker, Polygon, FeatureGroup, Tooltip } from "react-leaflet";
import proj4 from "proj4";
import { useMetadataContext } from "../../contexts/MetadataContext";
import { useMeasurementContext } from "../../contexts/MeasurementContext";
import { useFieldContext } from "../../contexts/FieldContext";
import { Coordinate } from "../../types/coordinate";
import GradientBar from "../../utils/GradientBar";
import ndvi2RBGA from "../../utils/ndvi2RBGA";
import number2RBG from "../../utils/number2RBG";

window.proj4 = proj4;

const UNKNOWN_COLOR = "grey";

export default function MeasurementLayer() {
  const { maxRecommendedFertilizer } = useMetadataContext();
  const {
    positions,
    subfields,
    measurementVisible: visibility,
    recommendationVisible,
    updateMeasurementPosition,
  } = useMeasurementContext();
  const { field } = useFieldContext();
  const measurementIds = useMemo(
    () => Object.keys(visibility ?? {}).map(Number),
    [visibility]
  );
  const [subfieldRecommendFertilizerLow, subfieldRecommendFertilizerHigh] =
    useMemo(() => {
      let low = maxRecommendedFertilizer;
      let high = 0;
      Object.values(subfields ?? {}).forEach((subfield) =>
        subfield.forEach(({ recommendedFertilizerAmount }) => {
          if (typeof recommendedFertilizerAmount === "number") {
            low = Math.min(low, recommendedFertilizerAmount);
            high = Math.max(high, recommendedFertilizerAmount);
          }
        })
      );
      return [low / maxRecommendedFertilizer, high / maxRecommendedFertilizer];
    }, [subfields]);
  const [menuContext, setMenuContext] = useState<
    | {
        anchor: PopoverPosition;
        position: Coordinate;
        measurementId: number;
        measurementIdx: number;
      }
    | undefined
  >(undefined);
  const map = useMap();

  useEffect(() => {
    if (measurementIds.length > 0 && field) {
      map.fitBounds(new L.Polygon(field?.coordinates).getBounds());
    }
  }, [map, measurementIds]);

  return (
    <FeatureGroup>
      {recommendationVisible && measurementIds.length > 0 && (
        <GradientBar
          caption="Subfield Recommended Fertilizer Amount (mg/L)"
          low={1 - subfieldRecommendFertilizerLow}
          high={1 - subfieldRecommendFertilizerHigh}
          lowLabel={subfieldRecommendFertilizerLow * maxRecommendedFertilizer}
          highLabel={subfieldRecommendFertilizerHigh * maxRecommendedFertilizer}
          unknownColor={UNKNOWN_COLOR}
        />
      )}
      {measurementIds.map((measurementId) => (
        <Fragment key={`${measurementId}-${recommendationVisible}`}>
          {subfields?.[measurementId].map(
            ({
              id,
              measurementIdx,
              coordinates,
              ndvi,
              area,
              recommendedFertilizerAmount,
            }) => (
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
                      measurementIdx: measurementIdx!,
                    });
                  },
                }}
                color={
                  recommendationVisible
                    ? typeof recommendedFertilizerAmount === "number"
                      ? ndvi2RBGA(
                          1 -
                            recommendedFertilizerAmount /
                              maxRecommendedFertilizer
                        )
                      : UNKNOWN_COLOR
                    : number2RBG(measurementIdx!)
                }
                fillOpacity={
                  recommendationVisible && recommendedFertilizerAmount
                    ? 1.0
                    : 0.75
                }
                stroke={false}
              >
                <Tooltip sticky>
                  <b>Measurement {measurementIdx}</b> <br />
                  Area (ha): <b>{area.toFixed(3)}</b> <br />
                  NDVI: <b>{ndvi.toFixed(3)}</b> <br />
                  {recommendationVisible && (
                    <>
                      Rec. Fert. Amount (mg/L):{" "}
                      <b>
                        {typeof recommendedFertilizerAmount === "number"
                          ? recommendedFertilizerAmount.toFixed(3)
                          : "-"}
                      </b>
                    </>
                  )}
                </Tooltip>
              </Polygon>
            )
          )}
          <Marker position={positions?.[measurementId].position!}>
            <Tooltip>
              <b>Measurement {positions?.[measurementId].idx}</b> <br />
              Position:{" "}
              <b>
                {positions?.[measurementId].position!.lng.toFixed(3)},{" "}
                {positions?.[measurementId].position!.lat.toFixed(3)}
              </b>
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
          {menuContext?.measurementIdx}
        </MenuItem>
      </Menu>
    </FeatureGroup>
  );
}
