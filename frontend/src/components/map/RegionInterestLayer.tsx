import { useEffect, useRef } from "react";
import { FeatureGroup, Polygon } from "react-leaflet";
import { EditControl } from "react-leaflet-draw";
import { useLeafletContext } from "@react-leaflet/core";
import L from "leaflet";
import { useMap } from "react-leaflet";
import { useRegionInterestContext } from "../../contexts/RegionInterestContext";

const icon = {
  icon: new L.DivIcon({
    iconSize: new L.Point(16, 16),
    className: "leaflet-div-icon leaflet-editing-icon",
  }),
};

//@ts-ignore
L.Edit.Poly = L.Edit.Poly.extend({
  options: icon,
});

export default function DrawController() {
  const { roi, setRoi } = useRegionInterestContext();
  const fgRef = useRef<L.FeatureGroup>(null);
  const map = useMap();

  useEffect(() => {
    const layers = fgRef.current?.getLayers();
    if (layers && layers.length > 0) {
      layers.forEach((layer, i) => {
        if (i === layers.length - 1) return;
        fgRef.current?.removeLayer(layer);
      });
      map.fitBounds(fgRef.current?.getBounds()!);
    }
  }, [roi, map]);

  const onReset = () => setRoi(undefined);

  const onCreate = (e: any) => {
    const { layerType, layer } = e;
    if (layerType === "polygon") {
      setRoi(layer.getLatLngs());
    }
  };

  const onEdit = (e: any) => {
    const layer = e.layers.getLayers()[0];
    setRoi(layer.getLatLngs());
  };

  return (
    <FeatureGroup ref={fgRef}>
      <EditControl
        position="topleft"
        onDrawStart={onReset}
        onEdited={onEdit}
        onCreated={onCreate}
        onDeleted={onReset}
        draw={{
          polygon: icon,
          polyline: false,
          rectangle: false,
          circle: false,
          marker: false,
          circlemarker: false,
        }}
        edit={{ polygon: icon }}
      />
      {roi && <Polygon positions={roi} />}
    </FeatureGroup>
  );
}
