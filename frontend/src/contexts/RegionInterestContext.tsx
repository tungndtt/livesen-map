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
  roi: Coordinate[] | undefined;
  setRoi: Dispatch<SetStateAction<Coordinate[] | undefined>>;
};

const RegionInterestContext = createContext<RegionInterestContextType>({
  roi: undefined,
  setRoi: () => {},
});

export default function RegionInterestProvider(props: { children: ReactNode }) {
  const [roi, setRoi] = useState<Coordinate[] | undefined>(undefined);

  return (
    <RegionInterestContext.Provider value={{ roi, setRoi }}>
      {props.children}
    </RegionInterestContext.Provider>
  );
}

export function useRegionInterestContext() {
  return useContext(RegionInterestContext);
}
