import React from "react";
import ReactDOM from "react-dom";

import Geocoder from "../src/main.js";

import "../style.css";

function App() {
  return (
    <>
      <h1>Geocoder</h1>
      <Geocoder
        accessToken={process.env.MAPBOX_TOKEN}
        onSelect={console.log.bind(this, "onSelect")}
      />
    </>
  );
}

ReactDOM.render(<App />, document.getElementById("root"));
