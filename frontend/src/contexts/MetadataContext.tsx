import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { useAuthenticationContext } from "./AuthenticationContext";

type CategoryMap = {
  [category: string]: string[];
};

type MetadataContextType = {
  maxRecommendedFertilizer: number;
  categories: CategoryMap;
};

const MetadataContext = createContext<MetadataContextType>({
  maxRecommendedFertilizer: 0,
  categories: {},
});

export default function MetadataProvider(props: { children: ReactNode }) {
  const { authenticationToken, doRequest } = useAuthenticationContext();
  const [maxRecommendedFertilizer, setMaxRecommendedFertilizer] = useState(0);
  const [categories, setCategories] = useState<CategoryMap>({});

  useEffect(() => {
    doRequest("metadata", "GET")
      .then(async (response) => {
        const responseBody = await response.json();
        const data = responseBody["data"];
        setMaxRecommendedFertilizer(data["max_recommended_fertilizer"]);
        setCategories({
          crop: data["crops"],
          soil: data["soils"],
          variety: data["varieties"],
          fertilizer: data["fertilizers"],
          fertilizerType: data["fertilizer_types"],
          cropProtection: data["crop_protections"],
          soilTillage: data["soil_tillages"],
        });
      })
      .catch(() => setCategories({}));
  }, [authenticationToken]);

  return (
    <MetadataContext.Provider
      value={{
        maxRecommendedFertilizer,
        categories,
      }}
    >
      {props.children}
    </MetadataContext.Provider>
  );
}

export function useMetadataContext() {
  return useContext(MetadataContext);
}
