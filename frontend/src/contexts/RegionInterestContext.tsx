import {
  createContext,
  useContext,
  useState,
  ReactNode,
  Dispatch,
  SetStateAction,
} from "react";
import { Coordinate } from "../types/coordinate";

type RegionInterestContextType = {
  roi: Coordinate[][] | undefined;
  setRoi: Dispatch<SetStateAction<Coordinate[][] | undefined>>;
  roiName: string;
  setRoiName: Dispatch<SetStateAction<string>>;
};

const RegionInterestContext = createContext<RegionInterestContextType>({
  roi: undefined,
  setRoi: () => {},
  roiName: "",
  setRoiName: () => {},
});

export default function RegionInterestProvider(props: { children: ReactNode }) {
  const [roi, setRoi] = useState<Coordinate[][] | undefined>(undefined);
  const [roiName, setRoiName] = useState("");

  return (
    <RegionInterestContext.Provider
      value={{ roi, setRoi, roiName, setRoiName }}
    >
      {props.children}
    </RegionInterestContext.Provider>
  );
}

export function useRegionInterestContext() {
  return useContext(RegionInterestContext);
}
