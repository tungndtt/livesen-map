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
  const { authenticationToken } = useAuthenticationContext();
  const { selectedFieldId, selectedSeasonId } = useSelectionContext();
  const [ndviRasters, setNdviRasters] = useState<NdviRasterMap>({});
  const [ndviRasterVisible, setNdviRasterVisible] = useState<
    boolean | undefined
  >(false);
  const seasonId = useRef<string | undefined>(undefined);
  const serverUrl = process.env.REACT_APP_SERVER_URL + "/ndvi_raster";

  useEffect(() => {
    if (authenticationToken && selectedFieldId) {
      fetch(`${serverUrl}/${selectedFieldId}`, {
        headers: { "Auth-Token": authenticationToken },
        method: "GET",
      }).then(async (response) => {
        if (response.ok) setNdviRasters(await response.json());
      });
    }
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
    if (authenticationToken && selectedFieldId && selectedSeasonId) {
      setNdviRasterVisible(undefined);
      fetch(`${serverUrl}/${selectedFieldId}/${selectedSeasonId}`, {
        headers: { "Auth-Token": authenticationToken },
        method: "GET",
      })
        .then(async (response) => {
          const responseBody = await response.json();
          const data = responseBody["data"];
          if (response.ok) {
            setNdviRasters((prevNdviMap) => ({
              ...prevNdviMap,
              [selectedSeasonId]: data,
            }));
            setNdviRasterVisible(true);
          } else {
            setNdviRasterVisible(false);
            notify({ message: data, isError: true });
          }
        })
        .catch((error) => {
          setNdviRasterVisible(false);
          notify({ message: error.message, isError: true });
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
