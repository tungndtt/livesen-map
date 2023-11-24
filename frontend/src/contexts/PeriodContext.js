import { createContext, useContext, useState, useEffect } from "react";
import { useAuthenticationContext } from "./AuthenticationContext";
import { useNotiContext } from "./NotiContext";

const PeriodContext = createContext({
  periods: undefined,
  selectedPeriod: undefined,
  setSelectedPeriod: (_selectedPeriod) => {},
});

export default function RegionInterestProvider({ children }) {
  const { authenticationToken } = useAuthenticationContext();
  const notify = useNotiContext();
  const [periods, setPeriods] = useState(undefined);
  const [selectedPeriod, setSelectedPeriod] = useState(undefined);
  const serverUrl = process.env.REACT_APP_SERVER_URL;

  useEffect(() => {
    if (authToken) {
      fetch(`${serverUrl}/roi/process_periods`, {
        headers: { "Auth-Token": authenticationToken },
        method: "GET",
      })
        .then(async (response) => {
          const data = await response.json();
          setPeriods(
            data.map((e) => {
              const year = e.substring(0, 4);
              const month = e.substring(4, 6);
              const day = e.substring(6);
              return { id: e, data: `${day}-${month}-${year}` };
            })
          );
        })
        .catch((periodError) => {
          notify({ message: periodError, isError: true });
        });
    } else {
      setPeriods(undefined);
      setSelectedPeriod(undefined);
    }
  }, [authToken]);

  return (
    <PeriodContext.Provider
      value={{ periods, selectedPeriod, setSelectedPeriod }}
    >
      {children}
    </PeriodContext.Provider>
  );
}

export function usePeriodContext() {
  return useContext(PeriodContext);
}
