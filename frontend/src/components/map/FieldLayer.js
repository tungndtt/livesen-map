import { useState, useEffect, useRef } from "react";
import { Modal, CircularProgress } from "@mui/material";
import { useLeafletContext } from "@react-leaflet/core";
import { useMap } from "react-leaflet";
import parseGeoraster from "georaster";
import GeoRasterLayer from "georaster-layer-for-leaflet";
import proj4 from "proj4";
import { useAuthenticationContext } from "../../contexts/AuthenticationContext";
import { useFieldContext } from "../../contexts/FieldContext";
import { useNotificationContext } from "../../contexts/NotificationContext";

window.proj4 = proj4;

const valueToHex = [];
const componentToHex = (c) => {
  let hex = c.toString(16);
  return hex.length == 1 ? "0" + hex : hex;
};
for (let i = 1; i < 255; i++) {
  const redHex = componentToHex(i);
  const blueHex = componentToHex(i);
  const greenHex = componentToHex(i);
  valueToHex.push(`#${redHex}${blueHex}${greenHex}FF`);
}
valueToHex.push("#FFFFFF00");

export default function FieldLayer() {
  const { authenticationToken, signOut } = useAuthenticationContext();
  const { ndvi, selectedField } = useFieldContext();
  const notify = useNotificationContext();
  const ndviLayerRef = useRef();
  const fieldLayerRef = useRef();
  const context = useLeafletContext();
  const map = useMap();
  const container = context.layerContainer || context.map;
  const [loadingNdvi, setLoadingNdvi] = useState(false);

  useEffect(() => {
    if (ndviLayerRef.current) container.removeLayer(ndviLayerRef.current);
    if (ndvi) {
      setLoadingNdvi(true);
      const serverUrl = process.env.REACT_APP_SERVER_URL;
      fetch(serverUrl + "/field/ndvi/" + ndvi, {
        headers: { "Auth-Token": authenticationToken },
        method: "GET",
      })
        .then(async (response) => {
          if (response.ok) {
            const arrayBuffer = await response.arrayBuffer();
            parseGeoraster(arrayBuffer)
              .then((georaster) => {
                ndviLayerRef.current = new GeoRasterLayer({
                  georaster: georaster,
                  opacity: 1,
                  pixelValuesToColorFn: (values) => valueToHex[values[0] - 1],
                  resolution: georaster.width * georaster.height,
                });
                container.addLayer(ndviLayerRef.current);
                map.fitBounds(ndviLayerRef.current.getBounds());
              })
              .finally(() => setLoadingNdvi(false));
          } else {
            if (response.status === 401) {
              signOut();
              notify({ message: "Access token is outdated", isError: true });
            } else notify({ message: await response.text(), isError: true });
            setLoadingNdvi(false);
          }
        })
        .catch((error) => {
          signOut();
          notify({ message: error.message, isError: true });
          setLoadingNdvi(false);
        });
    }
    return () => {
      if (ndviLayerRef.current) container.removeLayer(ndviLayerRef.current);
    };
  }, [context, map, ndvi]);

  useEffect(() => {
    if (fieldLayerRef.current) container.removeLayer(fieldLayerRef.current);
    if (selectedField?.coordinates) {
      fieldLayerRef.current = L.polygon(selectedField.coordinates);
      container.addLayer(fieldLayerRef.current);
      map.fitBounds(fieldLayerRef.current.getBounds());
    }
    return () => {
      if (fieldLayerRef.current) container.removeLayer(fieldLayerRef.current);
    };
  }, [context, map, selectedField?.coordinates]);

  return (
    <Modal
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 3000,
      }}
      open={loadingNdvi}
    >
      <CircularProgress />
    </Modal>
  );
}
