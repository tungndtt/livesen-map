import { MapContainer, TileLayer } from "react-leaflet";
import FieldLayer from "./FieldLayer";
import NdviRasterLayer from "./NdviRasterLayer";
import MeasurementLayer from "./MeasurementLayer";
import RegionInterestLayer from "./RegionInterestLayer";

export default function GeoMap() {
  return (
    <MapContainer
      center={[51.1642292, 10.4541194]}
      zoom={6}
      scrollWheelZoom={true}
      style={{
        position: "absolute",
        left: 0,
        height: "100%",
        width: "55%",
      }}
    >
      <TileLayer
        attribution='&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <FieldLayer />
      <NdviRasterLayer />
      <MeasurementLayer />
      <RegionInterestLayer />
    </MapContainer>
  );
}
