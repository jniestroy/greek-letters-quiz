// src/index.js (or src/main.jsx)

import React from "react";
import ReactDOM from "react-dom/client"; // Use createRoot
import App from "./App";
import ErrorBoundary from "./ErrorBoundary"; // <-- Import
import "./index.css"; // Your global styles (if any)
import "./greek-quiz.css"; // Your app-specific styles

const rootElement = document.getElementById("root");
const root = ReactDOM.createRoot(rootElement);

root.render(
  <React.StrictMode>
    <ErrorBoundary>
      {" "}
      {/* <-- Wrap App component */}
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);
