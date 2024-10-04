import React from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";

import Layouts from "components/Layouts";
import Home from "components/Home";
import SignIn from "components/authPages/SignIn";

import './App.css';
import BottleShapeGenerator from "components/Furniture";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="" element={<Layouts />}>
          <Route path="/signin" element={<SignIn />} />
          <Route path="/" element={<Home />} />
          <Route path="*" element={<Home />} />
          <Route path="/furniture" element={<BottleShapeGenerator />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;