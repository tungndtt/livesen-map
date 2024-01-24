import { useEffect } from "react";
import { MapContainer, TileLayer, useMap } from "react-leaflet";
import { useResizeContext } from "../../contexts/ResizeContext";
import FieldLayer from "./FieldLayer";
import NdviRasterLayer from "./NdviRasterLayer";
import MeasurementLayer from "./MeasurementLayer";
import RegionInterestLayer from "./RegionInterestLayer";

export default function GeoMap() {
  const { layout } = useResizeContext();

  const MapValidator = () => {
    const map = useMap();
    useEffect(() => {
      map.invalidateSize();
    }, [layout]);
    return null;
  };

  return (
    <MapContainer
      center={[51.1642292, 10.4541194]}
      zoom={6}
      scrollWheelZoom={true}
      style={{
        height: layout === "row" ? "100%" : "50%",
        width: "100%",
      }}
    >
      <TileLayer
        attribution='&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <MapValidator></MapValidator>
      <FieldLayer />
      <NdviRasterLayer />
      <MeasurementLayer />
      <RegionInterestLayer />
    </MapContainer>
  );
}
