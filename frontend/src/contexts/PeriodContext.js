import { createContext, useContext, useState, useEffect } from "react";
import { useAuthenticationContext } from "./AuthenticationContext";
import { useNotificationContext } from "./NotificationContext";

const PeriodContext = createContext({
  periods: undefined,
  selectedPeriod: undefined,
  setSelectedPeriod: (_selectedPeriod) => {},
});

export default function RegionInterestProvider({ children }) {
  const { authenticationToken } = useAuthenticationContext();
  const notify = useNotificationContext();
  const [periods, setPeriods] = useState(undefined);
  const [selectedPeriod, setSelectedPeriod] = useState(undefined);
  const serverUrl = process.env.REACT_APP_SERVER_URL + "/period";

  useEffect(() => {
    if (authenticationToken) {
      fetch(serverUrl, {
        headers: { "Auth-Token": authenticationToken },
        method: "GET",
      })
        .then(async (response) => {
          const responseBody = await response.json();
          if (response.ok) {
            setPeriods(
              responseBody.map((e) => {
                const year = e.substring(0, 4);
                const month = e.substring(4, 6);
                const day = e.substring(6);
                return { id: e, data: `${day}-${month}-${year}` };
              })
            );
          } else {
            notify({ message: responseBody["data"], isError: true });
          }
        })
        .catch((error) => {
          notify({ message: error.message, isError: true });
        });
    } else {
      setPeriods(undefined);
      setSelectedPeriod(undefined);
    }
  }, [authenticationToken]);

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
