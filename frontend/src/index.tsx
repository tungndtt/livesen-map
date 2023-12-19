import ReactDOM from "react-dom";
import NotificationProvider from "./contexts/NotificationContext";
import AuthenticationProvider from "./contexts/AuthenticationContext";
import RegionInterestProvider from "./contexts/RegionInterestContext";
import SelectionProvider from "./contexts/SelectionContext";
import FieldProvider from "./contexts/FieldContext";
import MeasurementProvider from "./contexts/MeasurementContext";
import { LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import App from "./App";
import "./styles.css";

const rootElement = document.getElementById("root");
ReactDOM.render(
  <NotificationProvider>
    <AuthenticationProvider>
      <SelectionProvider>
        <RegionInterestProvider>
          <FieldProvider>
            <FieldProvider>
              <MeasurementProvider>
                <LocalizationProvider dateAdapter={AdapterDayjs}>
                  <App />
                </LocalizationProvider>
              </MeasurementProvider>
            </FieldProvider>
          </FieldProvider>
        </RegionInterestProvider>
      </SelectionProvider>
    </AuthenticationProvider>
  </NotificationProvider>,
  rootElement
);
