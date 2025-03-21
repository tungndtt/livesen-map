import { ReactNode, useEffect, useRef } from "react";
import { useAuthenticationContext } from "./AuthenticationContext";
import { useProfileContext } from "./ProfileContext";
import { useSelectionContext } from "./SelectionContext";
import { useFieldContext } from "./FieldContext";
import { useSeasonContext } from "./SeasonContext";
import { useMeasurementContext } from "./MeasurementContext";

export default function EventProvider(props: { children: ReactNode }) {
  const { authenticationToken, signOut } = useAuthenticationContext();
  const {
    selectedFieldId,
    selectedSeasonId,
    onFieldEvent: onFieldSelectionEvent,
    onSeasonEvent: onSeasonSelectionEvent,
  } = useSelectionContext();
  const { onEvent: onProfileEvent } = useProfileContext();
  const { onEvent: onFieldEvent } = useFieldContext();
  const { onEvent: onSeasonEvent } = useSeasonContext();
  const { onEvent: onMeasurementEvent } = useMeasurementContext();
  const eventListener = useRef<EventSource | null>(null);
  const connected = useRef(true);

  const close = () => {
    if (eventListener.current) {
      eventListener.current.close();
      eventListener.current = null;
      connected.current = false;
    }
  };

  const connect = () => {
    if (!eventListener.current) {
      const serverUrl = process.env.REACT_APP_SERVER_URL;
      eventListener.current = new EventSource(
        `${serverUrl}/sse?auth_token=${authenticationToken}`
      );
      eventListener.current.onopen = function () {
        connected.current = true;
      };
    }
    eventListener.current.onmessage = function (event) {
      const { type, payload } = JSON.parse(event.data);
      const [name, action] = type.split(".");
      switch (name) {
        case "field": {
          onFieldSelectionEvent(action, payload);
          onFieldEvent(action, payload);
          break;
        }
        case "season": {
          onSeasonSelectionEvent(action, payload);
          onSeasonEvent(action, payload);
          break;
        }
        case "measurement": {
          onMeasurementEvent(action, payload);
          break;
        }
        case "user": {
          onProfileEvent(action, payload);
          break;
        }
      }
    };
    eventListener.current.onerror = function (_) {
      if (!connected.current) signOut();
      close();
      connect();
    };
  };

  useEffect(() => {
    if (authenticationToken) connect();
    else close();
  }, [authenticationToken, selectedFieldId, selectedSeasonId]);

  useEffect(() => close, []);

  return <>{props.children}</>;
}
