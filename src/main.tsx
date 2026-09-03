import React from "react";
import ReactDOM from "react-dom/client";
import { I18nProvider } from "./i18n/I18n";
import { App } from "./ui/App";
import { ViewportScaler } from "./ui/ViewportScaler";
import "./ui/styles.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <I18nProvider>
      <ViewportScaler>
        <App />
      </ViewportScaler>
    </I18nProvider>
  </React.StrictMode>,
);
