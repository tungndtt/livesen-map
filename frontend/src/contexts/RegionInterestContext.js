import { createContext, useContext, useState, useEffect } from "react";
import { useAuthenticationContext } from "./AuthenticationContext";

const RegionInterestContext = createContext({
  roi: undefined,
  setRoi: (_roi) => {},
});

export default function RegionInterestProvider({ children }) {
  const { authenticationToken } = useAuthenticationContext();
  const [roi, setRoi] = useState(undefined);

  useEffect(() => {
    if (!authenticationToken) setRoi(undefined);
  }, [authenticationToken]);

  return (
    <RegionInterestContext.Provider value={{ roi, setRoi }}>
      {children}
    </RegionInterestContext.Provider>
  );
}

export function useRegionInterestContext() {
  return useContext(RegionInterestContext);
}
