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

type SeasonContextType = {
  recommendedFertilizer: number | undefined;
  setRecommendedFertilizer: Dispatch<SetStateAction<number | undefined>>;
};

const SeasonContext = createContext<SeasonContextType>({
  recommendedFertilizer: undefined,
  setRecommendedFertilizer: () => {},
});

export default function SeasonProvider(props: { children: ReactNode }) {
  const [recommendedFertilizer, setRecommendedFertilizer] = useState<
    number | undefined
  >(undefined);

  return (
    <SeasonContext.Provider
      value={{ recommendedFertilizer, setRecommendedFertilizer }}
    >
      {props.children}
    </SeasonContext.Provider>
  );
}

export function useSeasonContext() {
  return useContext(SeasonContext);
}
