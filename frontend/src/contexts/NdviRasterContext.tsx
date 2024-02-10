import {
  createContext,
  useContext,
  useState,
  useRef,
  ReactNode,
  useEffect,
} from "react";
import { useNotificationContext } from "./NotificationContext";
import { useAuthenticationContext } from "./AuthenticationContext";
import { useSelectionContext } from "./SelectionContext";

type NdviRasterMap = {
  [seasonId: string]: string;
};

type NdviRasterContextType = {
  ndviRasters: NdviRasterMap;
  ndviRasterVisible: boolean | undefined;
  toggleNdviRasterVisible: () => void;
};

const NdviRasterContext = createContext<NdviRasterContextType>({
  ndviRasters: {},
  ndviRasterVisible: false,
  toggleNdviRasterVisible: () => {},
});

export default function NdviRasterProvider(props: { children: ReactNode }) {
  const notify = useNotificationContext();
  const { doRequest } = useAuthenticationContext();
  const { selectedFieldId, selectedSeasonId } = useSelectionContext();
  const [ndviRasters, setNdviRasters] = useState<NdviRasterMap>({});
  const [ndviRasterVisible, setNdviRasterVisible] = useState<
    boolean | undefined
  >(false);
  const seasonId = useRef<string | undefined>(undefined);

  useEffect(() => {
    if (selectedFieldId) {
      doRequest(`ndvi_raster/${selectedFieldId}`, "GET")
        .then(async (response) => setNdviRasters(await response.json()))
        .catch(() => setNdviRasters({}));
    } else setNdviRasters({});
    setNdviRasterVisible(false);
  }, [selectedFieldId]);

  useEffect(() => {
    if (ndviRasterVisible && selectedSeasonId !== undefined) getNdviRaster();
    else {
      if (!selectedSeasonId && seasonId.current)
        setNdviRasters((prevNdviMap) => {
          delete prevNdviMap[seasonId.current!];
          return { ...prevNdviMap };
        });
      setNdviRasterVisible(false);
    }
    seasonId.current = selectedSeasonId;
  }, [selectedSeasonId]);

  const toggleNdviRasterVisible = () => {
    if (!ndviRasterVisible) getNdviRaster();
    else setNdviRasterVisible(false);
  };

  const getNdviRaster = () => {
    if (selectedFieldId && selectedSeasonId) {
      setNdviRasterVisible(undefined);
      doRequest(`ndvi_raster/${selectedFieldId}/${selectedSeasonId}`, "GET")
        .then(async (response) => {
          const responseBody = await response.json();
          const data = responseBody["data"];
          const [ndviRaster, sourceDate] = data;
          setNdviRasters((prevNdviMap) => ({
            ...prevNdviMap,
            [selectedSeasonId]: ndviRaster,
          }));
          const date = new Date(Date.parse(sourceDate));
          setNdviRasterVisible(true);
          notify({
            message: `Fetch NDVI map generated from downloadled data on ${date.getDate()}/${
              date.getMonth() + 1
            }/${date.getFullYear()}`,
            isError: false,
          });
        })
        .catch((error) => {
          setNdviRasterVisible(false);
          notify({ message: error, isError: true });
        });
    }
  };

  return (
    <NdviRasterContext.Provider
      value={{
        ndviRasters,
        ndviRasterVisible,
        toggleNdviRasterVisible,
      }}
    >
      {props.children}
    </NdviRasterContext.Provider>
  );
}

export function useNdviRasterContext() {
  return useContext(NdviRasterContext);
}
