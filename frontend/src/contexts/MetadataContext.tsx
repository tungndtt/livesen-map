import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { useAuthenticationContext } from "./AuthenticationContext";
import { useNotificationContext } from "./NotificationContext";

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
  const { authenticationToken } = useAuthenticationContext();
  const notify = useNotificationContext();
  const [maxRecommendedFertilizer, setMaxRecommendedFertilizer] = useState(0);
  const [categories, setCategories] = useState<CategoryMap>({});
  const serverUrl = process.env.REACT_APP_SERVER_URL + "/metadata";

  useEffect(() => {
    if (authenticationToken) {
      fetch(serverUrl, {
        headers: { "Auth-Token": authenticationToken },
        method: "GET",
      })
        .then(async (response) => {
          if (response.ok) {
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
          } else
            notify({
              message: "Failed to retrieve max recommended fertilizer",
              isError: true,
            });
        })
        .catch((error) => notify({ message: error.message, isError: true }));
    }
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
