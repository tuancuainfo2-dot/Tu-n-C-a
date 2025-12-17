import React from "react";

type Props = {
  children: React.ReactNode;
};

const Layout: React.FC<Props> = ({ children }) => (
  <div style={{ padding: 20 }}>
    <h2>Layout</h2>
    {children}
  </div>
);

export default Layout;
