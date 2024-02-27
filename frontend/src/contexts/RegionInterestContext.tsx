import {
  createContext,
  useContext,
  useState,
  ReactNode,
  Dispatch,
  SetStateAction,
} from "react";
import { useNotificationContext } from "./NotificationContext";
import { useAuthenticationContext } from "./AuthenticationContext";
import { Coordinate } from "../types/coordinate";

type RegionInterestContextType = {
  roi: Coordinate[][] | undefined;
  setRoi: Dispatch<SetStateAction<Coordinate[][] | undefined>>;
  roiName: string;
  setRoiName: Dispatch<SetStateAction<string>>;
  registerField: () => void;
};

const RegionInterestContext = createContext<RegionInterestContextType>({
  roi: undefined,
  setRoi: () => {},
  roiName: "",
  setRoiName: () => {},
  registerField: () => {},
});

export default function RegionInterestProvider(props: { children: ReactNode }) {
  const notify = useNotificationContext();
  const { doRequest } = useAuthenticationContext();
  const [roi, setRoi] = useState<Coordinate[][] | undefined>(undefined);
  const [roiName, setRoiName] = useState("");

  const registerField = () => {
    if (roi && roiName) {
      doRequest("field/register", "POST", {
        name: roiName,
        coordinates: roi.map((r) => r.map(({ lat, lng }) => [lng, lat])),
      })
        .then(() => {
          setRoi(undefined);
          setRoiName("");
          notify({
            message: "Successfully register region of interest",
            isError: false,
          });
        })
        .catch((error) => notify({ message: error, isError: true }));
    }
  };

  return (
    <RegionInterestContext.Provider
      value={{ roi, setRoi, roiName, setRoiName, registerField }}
    >
      {props.children}
    </RegionInterestContext.Provider>
  );
}

export function useRegionInterestContext() {
  return useContext(RegionInterestContext);
}
