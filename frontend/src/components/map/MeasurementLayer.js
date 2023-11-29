import { useEffect, useMemo } from "react";
import { useMap, Polygon, Marker } from "react-leaflet";
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
  const map = useMap();

  useEffect(() => {
    if (
      Object.keys(selectedMeasurements.positions).length > 0 ||
      Object.keys(selectedMeasurements.subfields).length > 0
    ) {
      map.fitBounds(field.getBounds());
    }
  }, [map, selectedMeasurements?.positions, selectedMeasurements?.subfields]);

  return (
    <FeatureGroup>
      {Object.entries(selectedMeasurements?.subfields).map(
        ([measurementId, coordinates]) => (
          <Polygon key={measurementId} positions={coordinates} />
        )
      )}
      {Object.entries(selectedMeasurements?.positions).map(
        ([measurementId, coordinates]) => (
          <Marker key={measurementId} positions={coordinates} />
        )
      )}
    </FeatureGroup>
  );
}
