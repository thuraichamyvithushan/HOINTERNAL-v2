import React from "react";
import N from "./Footer";

const Image1= () => {
  return (
    <div style={{ display: "flex", justifyContent: "center", padding: "1rem" }}>
      <div
        style={{
          maxWidth: "1000px",
          width: "100%",
          position: "relative",
        }}
      >
        <img
          src="/images/img1.png"
          alt="Dealer Banner"
          style={{
            width: "100%",
            height: "auto",
            display: "block",
            margin: "0 auto",
            borderRadius: "10px",
          }}
        />
      </div>
    </div>
  );
};

export default Image1;
