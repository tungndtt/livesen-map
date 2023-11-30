import { useEffect, useMemo } from "react";
import { useMap, Polygon, Marker, FeatureGroup } from "react-leaflet";
import proj4 from "proj4";
import { useMeasurementContext } from "../../contexts/MeasurementContext";
import { useFieldContext } from "../../contexts/FieldContext";

window.proj4 = proj4;

export default function MeasurementLayer() {
  const { selectedMeasurements } = useMeasurementContext();
  const { fields, selectedField } = useFieldContext();
  const field = useMemo(() => {
    const field = fields?.find(({ id }) => id === selectedField?.id);
    return field?.coordinates ? L.polygon(field.coordinates) : undefined;
  }, [fields, selectedField?.id]);
  const map = useMap();

  useEffect(() => {
    if (
      selectedMeasurements &&
      field &&
      (Object.keys(selectedMeasurements?.positions).length > 0 ||
        Object.keys(selectedMeasurements?.subfields).length > 0)
    ) {
      map.fitBounds(field.getBounds());
    }
  }, [map, selectedMeasurements?.positions, selectedMeasurements?.subfields]);

  return (
    <FeatureGroup>
      {Object.entries(selectedMeasurements?.subfields ?? {}).map(
        ([measurementId, coordinates]) => (
          <Polygon key={measurementId} positions={coordinates} />
        )
      )}
      {Object.entries(selectedMeasurements?.positions ?? {}).map(
        ([measurementId, coordinates]) => (
          <Marker key={measurementId} position={coordinates} />
        )
      )}
    </FeatureGroup>
  );
}
