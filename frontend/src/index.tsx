import ReactDOM from "react-dom";
import ResizeProvider from "./contexts/ResizeContext";
import NotificationProvider from "./contexts/NotificationContext";
import AuthenticationProvider from "./contexts/AuthenticationContext";
import ProfileProvider from "./contexts/ProfileContext";
import MetadataProvider from "./contexts/MetadataContext";
import RegionInterestProvider from "./contexts/RegionInterestContext";
import SelectionProvider from "./contexts/SelectionContext";
import FieldProvider from "./contexts/FieldContext";
import SeasonProvider from "./contexts/SeasonContext";
import NdviRasterProvider from "./contexts/NdviRasterContext";
import MeasurementProvider from "./contexts/MeasurementContext";
import EventProvider from "./contexts/EventContext";
import { LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import App from "./App";
import "./styles.css";

const rootElement = document.getElementById("root");
ReactDOM.render(
  <ResizeProvider>
    <NotificationProvider>
      <AuthenticationProvider>
        <ProfileProvider>
          <MetadataProvider>
            <RegionInterestProvider>
              <SelectionProvider>
                <FieldProvider>
                  <SeasonProvider>
                    <NdviRasterProvider>
                      <MeasurementProvider>
                        <EventProvider>
                          <LocalizationProvider dateAdapter={AdapterDayjs}>
                            <App />
                          </LocalizationProvider>
                        </EventProvider>
                      </MeasurementProvider>
                    </NdviRasterProvider>
                  </SeasonProvider>
                </FieldProvider>
              </SelectionProvider>
            </RegionInterestProvider>
          </MetadataProvider>
        </ProfileProvider>
      </AuthenticationProvider>
    </NotificationProvider>
  </ResizeProvider>,
  rootElement
);
