import { useEffect, useRef, useMemo } from "react";
import { useLeafletContext } from "@react-leaflet/core";
import { useMap } from "react-leaflet";
import proj4 from "proj4";
import { useMeasurementContext } from "../../contexts/MeasurementContext";
import { useFieldContext } from "../../contexts/FieldContext";

window.proj4 = proj4;

export default function MeasurementLayer() {
  const { selectedMeasurements } = useMeasurementContext();
  const { fields, selectedField } = useFieldContext();
  const field = useMemo(() => {
    const field = fields?.find(({ id }) => id === selectedField?.id);
    return L.polygon(field.coordinates);
  }, [fields, selectedField?.id]);
  const positionLayerRefs = useRef({});
  const subfieldLayerRefs = useRef({});
  const context = useLeafletContext();
  const map = useMap();
  const container = context.layerContainer || context.map;

  useEffect(() => {
    const measurementPositions = selectedMeasurements?.positions.keys();
    const positionLayers = positionLayerRefs.current.keys();
    positionLayers.forEach((positionLayer) => {
      if (!(positionLayer in measurementPositions)) {
        container.removeLayer(positionLayerRefs.current[positionLayer]);
      }
    });
    measurementPositions.forEach((measurementPosition) => {
      if (!(measurementPosition in positionLayers)) {
        const positionLayer = L.marker(
          selectedMeasurements?.positions[measurementPosition]
        );
        positionLayerRefs.current[measurementPosition] = positionLayer;
        container.addLayer(positionLayer);
      }
    });
    if (measurementPositions.length > 0) map.fitBounds(field.getBounds());
  }, [context, map, selectedMeasurements?.positions]);

  useEffect(() => {
    const measurementSubfields = selectedMeasurements?.subfields.keys();
    const subfieldLayers = subfieldLayerRefs.current.keys();
    subfieldLayers.forEach((subfieldLayer) => {
      if (!(subfieldLayer in measurementSubfields)) {
        container.removeLayer(subfieldLayerRefs.current[subfieldLayer]);
      }
    });
    measurementSubfields.forEach((measurementSubfield) => {
      if (!(measurementSubfield in subfieldLayers)) {
        const subfieldLayer = L.polygon(
          selectedMeasurements?.subfields[measurementSubfield]
        );
        subfieldLayerRefs.current[measurementSubfield] = subfieldLayer;
        container.addLayer(subfieldLayer);
      }
    });
    if (measurementSubfields.length > 0) map.fitBounds(field.getBounds());
  }, [context, map, selectedMeasurements?.subfields]);

  return null;
}
