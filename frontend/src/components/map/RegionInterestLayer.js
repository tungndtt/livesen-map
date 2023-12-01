import { useEffect, useRef } from "react";
import { FeatureGroup, Polygon } from "react-leaflet";
import { EditControl } from "react-leaflet-draw";
import L from "leaflet";
import { useRegionInterestContext } from "../../contexts/RegionInterestContext";

const icon = {
  icon: new L.DivIcon({
    iconSize: new L.Point(16, 16),
    className: "leaflet-div-icon leaflet-editing-icon",
  }),
};

L.Edit.Poly = L.Edit.Poly.extend({
  options: icon,
});

export default function DrawController() {
  const { roi, setRoi } = useRegionInterestContext();
  const fgRef = useRef(null);

  useEffect(() => {
    const layers = Object.values(fgRef.current._layers);
    if (layers.length > 0) {
      layers.forEach((layer, i) => {
        if (i === layers.length - 1) return;
        fgRef.current.removeLayer(layer);
      });
    }
  }, [roi]);

  const onReset = () => setRoi(undefined);

  const onCreate = (e) => {
    const { layerType, layer } = e;
    if (layerType === "polygon") {
      setRoi(layer.getLatLngs()[0]);
    }
  };

  const onEdit = (e) => {
    const layer = e.layers.getLayers()[0];
    setRoi(layer.getLatLngs()[0]);
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
