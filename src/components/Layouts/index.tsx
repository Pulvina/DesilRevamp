import React from 'react';
import { Outlet } from 'react-router-dom';
import RequireAuth from "./RequireAuth";

const Layouts: React.FC = () => {
  return (
    <>
      <RequireAuth>
        <main>
          <Outlet />
        </main>
      </RequireAuth>
    </>
  );
};

export default Layouts;