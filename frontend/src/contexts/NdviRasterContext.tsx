import {
  createContext,
  useContext,
  useState,
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
  ndviRasterVisible: boolean | undefined;
  toggleNdviRasterVisible: () => void;
  fetchNdviMap: () => Promise<ArrayBuffer>;
};

const NdviRasterContext = createContext<NdviRasterContextType>({
  ndviRasterVisible: false,
  toggleNdviRasterVisible: () => {},
  fetchNdviMap: async () => new ArrayBuffer(0),
});

export default function NdviRasterProvider(props: { children: ReactNode }) {
  const notify = useNotificationContext();
  const { doRequest } = useAuthenticationContext();
  const { selectedFieldId, selectedSeasonId } = useSelectionContext();
  const [ndviRasterVisible, setNdviRasterVisible] = useState<
    boolean | undefined
  >(false);

  useEffect(
    () => setNdviRasterVisible(false),
    [selectedFieldId, selectedSeasonId]
  );

  const toggleNdviRasterVisible = () =>
    setNdviRasterVisible(!ndviRasterVisible);

  const fetchNdviMap = () => {
    return new Promise<ArrayBuffer>((resolve, reject) => {
      doRequest(`/season/ndvi/${selectedFieldId}/${selectedSeasonId}`, "GET")
        .then(async (response) => {
          if (response.ok) {
            const ndviDate = response.headers.get("ndvi_date");
            notify({
              message: `Fetch NDVI map generated on ${ndviDate}`,
              isError: false,
            });
            resolve(await response.arrayBuffer());
          } else {
            reject((await response.json())["data"]);
          }
        })
        .catch((error) => reject(error));
    });
  };

  return (
    <NdviRasterContext.Provider
      value={{
        ndviRasterVisible,
        toggleNdviRasterVisible,
        fetchNdviMap,
      }}
    >
      {props.children}
    </NdviRasterContext.Provider>
  );
}

export function useNdviRasterContext() {
  return useContext(NdviRasterContext);
}
