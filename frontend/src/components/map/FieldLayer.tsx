import { useEffect, useRef } from "react";
import { useLeafletContext } from "@react-leaflet/core";
import { useMap } from "react-leaflet";
import L from "leaflet";
import proj4 from "proj4";
import { useFieldContext } from "../../contexts/FieldContext";

window.proj4 = proj4;

export default function FieldLayer() {
  const { fieldVisible, coordinates } = useFieldContext();
  const fieldLayerRef = useRef<L.Polygon | undefined>(undefined);
  const context = useLeafletContext();
  const map = useMap();

  useEffect(() => {
    const container = context.layerContainer || context.map;
    if (fieldLayerRef.current) container.removeLayer(fieldLayerRef.current);
    if (fieldVisible && coordinates) {
      fieldLayerRef.current = new L.Polygon(coordinates);
      container.addLayer(fieldLayerRef.current);
      map.fitBounds(fieldLayerRef.current.getBounds());
    }
    return () => {
      if (fieldLayerRef.current) container.removeLayer(fieldLayerRef.current);
    };
  }, [context, map, coordinates, fieldVisible]);

  return null;
}
