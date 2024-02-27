import {
  ReactNode,
  createContext,
  useContext,
  useState,
  useEffect,
} from "react";
import { useNotificationContext } from "./NotificationContext";
import { useAuthenticationContext } from "./AuthenticationContext";
import { useSelectionContext } from "./SelectionContext";
import { Season, parseSeason, deparseSeason } from "../types/season";

type SeasonContextType = {
  season: Season | undefined;
  updateSeason: (data: any) => void;
  deleteSeason: () => void;
  recommendSeasonFertilizer: (fertilizer: string) => Promise<number>;
  onEvent: (action: string, payload: any) => void;
};

const SeasonContext = createContext<SeasonContextType>({
  season: undefined,
  updateSeason: () => {},
  deleteSeason: () => {},
  recommendSeasonFertilizer: async () => 0,
  onEvent: () => {},
});

export default function SeasonProvider(props: { children: ReactNode }) {
  const notify = useNotificationContext();
  const { doRequest } = useAuthenticationContext();
  const { selectedFieldId, selectedSeasonId } = useSelectionContext();
  const [season, setSeason] = useState<Season | undefined>(undefined);

  useEffect(() => {
    if (selectedFieldId && selectedSeasonId) {
      doRequest(`season/${selectedFieldId}/${selectedSeasonId}`, "GET")
        .then(async (response) => {
          const responseBody = await response.json();
          const parsedSeason = parseSeason(responseBody);
          setSeason(parsedSeason);
        })
        .catch(() => setSeason(undefined));
    } else {
      setSeason(undefined);
    }
  }, [selectedFieldId, selectedSeasonId]);

  const updateSeason = (data: any) => {
    if (selectedFieldId && selectedSeasonId) {
      doRequest(
        `season/upgister/${selectedFieldId}/${selectedSeasonId}`,
        "POST",
        deparseSeason(data)
      )
        .then(async (response) => {
          const message = (await response.json())["data"];
          notify({ message: message, isError: false });
        })
        .catch((error) => notify({ message: error, isError: true }));
    }
  };

  const deleteSeason = () => {
    if (selectedFieldId && selectedSeasonId) {
      doRequest(
        `season/unregister/${selectedFieldId}/${selectedSeasonId}`,
        "DELETE"
      )
        .then(() => {
          notify({
            message: "Successfully unregister the season",
            isError: false,
          });
        })
        .catch((error) => notify({ message: error, isError: true }));
    }
  };

  const recommendSeasonFertilizer = (fertilizer: string) => {
    return new Promise<number>((resolve) => {
      if (selectedFieldId && selectedSeasonId) {
        doRequest(
          `season/recommend_fertilizer/${selectedFieldId}/${selectedSeasonId}`,
          "POST",
          { fertilizer }
        )
          .then(async (response) => {
            const data = (await response.json())["data"];
            if (response.ok) resolve(data);
            else notify({ message: data, isError: true });
          })
          .catch((error) => notify({ message: error, isError: true }));
      }
    });
  };

  const onEvent = (action: string, payload: any) => {
    const { field_id: fieldId, season_id: seasonId } = payload;
    if (selectedFieldId !== fieldId || selectedSeasonId !== seasonId) return;
    switch (action) {
      case "update": {
        setSeason(parseSeason(payload));
        break;
      }
      case "delete": {
        setSeason(undefined);
        break;
      }
    }
  };

  return (
    <SeasonContext.Provider
      value={{
        season,
        updateSeason,
        deleteSeason,
        recommendSeasonFertilizer,
        onEvent,
      }}
    >
      {props.children}
    </SeasonContext.Provider>
  );
}

export function useSeasonContext() {
  return useContext(SeasonContext);
}
