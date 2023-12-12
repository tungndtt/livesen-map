import { Fragment, useEffect, useMemo } from "react";
import { useMap, Polygon, Marker, FeatureGroup } from "react-leaflet";
import proj4 from "proj4";
import { useMeasurementContext } from "../../contexts/MeasurementContext";
import { useFieldContext } from "../../contexts/FieldContext";
import ndvi2RBGA from "../../utils/ndvi2RBGA";

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
    if (Object.keys(selectedMeasurements ?? {}).length > 0 && field) {
      map.fitBounds(field.getBounds());
    }
  }, [map, selectedMeasurements]);

  return (
    <FeatureGroup>
      {Object.entries(selectedMeasurements ?? {}).map(
        ([measurementId, { position, subfield, ndvi_value }]) => (
          <Fragment key={measurementId}>
            <Polygon
              positions={subfield.coordinates}
              color={ndvi2RBGA(ndvi_value)}
              fillOpacity={0.7}
              stroke={false}
            />
            <Marker key={measurementId} position={position} />
          </Fragment>
        )
      )}
    </FeatureGroup>
  );
}
