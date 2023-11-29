import ReactDOM from "react-dom";
import NotificationProvider from "./contexts/NotificationContext";
import AuthenticationProvider from "./contexts/AuthenticationContext";
import RegionInterestProvider from "./contexts/RegionInterestContext";
import PeriodProvider from "./contexts/PeriodContext";
import FieldProvider from "./contexts/FieldContext";
import MeasurementProvider from "./contexts/MeasurementContext";
import App from "./App";
import "./styles.css";

const rootElement = document.getElementById("root");
ReactDOM.render(
  <NotificationProvider>
    <AuthenticationProvider>
      <RegionInterestProvider>
        <PeriodProvider>
          <FieldProvider>
            <MeasurementProvider>
              <App />
            </MeasurementProvider>
          </FieldProvider>
        </PeriodProvider>
      </RegionInterestProvider>
    </AuthenticationProvider>
  </NotificationProvider>,
  rootElement
);
