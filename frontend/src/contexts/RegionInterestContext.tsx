import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  Dispatch,
  SetStateAction,
} from "react";
import { useAuthenticationContext } from "./AuthenticationContext";
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
  const { authenticationToken } = useAuthenticationContext();
  const [roi, setRoi] = useState<Coordinate[] | undefined>(undefined);

  useEffect(() => {
    if (!authenticationToken) setRoi(undefined);
  }, [authenticationToken]);

  return (
    <RegionInterestContext.Provider value={{ roi, setRoi }}>
      {props.children}
    </RegionInterestContext.Provider>
  );
}

export function useRegionInterestContext() {
  return useContext(RegionInterestContext);
}
