import { useState, useEffect, useRef } from "react";
import { Modal, Typography } from "@mui/material";
import { useLeafletContext } from "@react-leaflet/core";
import { useMap } from "react-leaflet";
//@ts-ignore
import parseGeoraster from "georaster";
import GeoRasterLayer, { GeoRaster } from "georaster-layer-for-leaflet";
import proj4 from "proj4";
import { useNdviRasterContext } from "../../contexts/NdviRasterContext";
import { useNotificationContext } from "../../contexts/NotificationContext";
import ndvi2RBGA from "../../utils/ndvi2RBGA";
import GradientBar from "../../utils/GradientBar";

window.proj4 = proj4;

export default function NdviRasterLayer() {
  const { ndviRasterVisible, fetchNdviMap } = useNdviRasterContext();
  const notify = useNotificationContext();
  //@ts-ignore
  const ndviLayerRef = useRef<GeoRasterLayer | undefined>(undefined);
  const context = useLeafletContext();
  const map = useMap();
  const [isLoading, setIsLoading] = useState(false);
  const [ndviRange, setNdviRange] = useState<number[] | undefined>(undefined);

  useEffect(() => {
    const container = context.layerContainer || context.map;
    if (ndviRasterVisible) {
      setIsLoading(true);
      fetchNdviMap()
        .then((arrayBuffer) => {
          parseGeoraster(arrayBuffer).then((georaster: GeoRaster) => {
            if (ndviLayerRef.current) {
              container.removeLayer(ndviLayerRef.current);
            }
            let progress = { current: 0, previous: -1 };
            let ndviRange = [1, -1];
            const resolution = georaster.width * georaster.height;
            const progressTracker = setInterval(() => {
              if (progress.previous === progress.current) {
                clearInterval(progressTracker);
                setIsLoading(false);
              } else progress.previous = progress.current;
            }, 2000);
            ndviLayerRef.current = new GeoRasterLayer({
              georaster: georaster,
              opacity: 1,
              pixelValuesToColorFn: (values) => {
                const ndvi = values[0];
                if (ndvi >= 0) {
                  ndviRange[0] = Math.min(ndviRange[0], ndvi);
                  ndviRange[1] = Math.max(ndviRange[1], ndvi);
                }
                progress.current++;
                if (progress.current == resolution) {
                  setIsLoading(false);
                  ndviRange[0] = Math.max(ndviRange[0], 0);
                  ndviRange[1] = Math.min(ndviRange[1], 1);
                  setNdviRange([...ndviRange]);
                }
                return ndvi2RBGA(ndvi);
              },
              resolution: resolution,
            });
            container.addLayer(ndviLayerRef.current);
            map.fitBounds(ndviLayerRef.current.getBounds());
          });
        })
        .catch((error) => {
          setIsLoading(false);
          notify({ message: error, isError: true });
        });
    }
    return () => {
      if (ndviLayerRef.current) container.removeLayer(ndviLayerRef.current);
    };
  }, [context, map, ndviRasterVisible]);

  return (
    <>
      {ndviRange && ndviRasterVisible && (
        <GradientBar
          caption="NDVI"
          low={ndviRange[0]}
          high={ndviRange[1]}
          lowLabel={ndviRange[0]}
          highLabel={ndviRange[1]}
        />
      )}
      <Modal
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 3000,
        }}
        open={isLoading || ndviRasterVisible === undefined}
      >
        <Typography fontWeight={800} color="#ffa200">
          <b>Loading NDVI Map ...</b>
        </Typography>
      </Modal>
    </>
  );
}
