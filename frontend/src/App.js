import AuthenticationModal from "./components/authentication/AuthenticationModal";
import GeoMap from "./components/map/GeoMap";
import Information from "./components/information/Information";

export default function App() {
  return (
    <>
      <AuthenticationModal />
      <GeoMap />
      <Information />
    </>
  );
}
