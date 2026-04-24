import React, { useState, useEffect, useContext } from "react";
import AuthContext from "../context/AuthContext";

const Hero = () => {
  const { user } = useContext(AuthContext);
  const [windowWidth, setWindowWidth] = useState(
    typeof window !== 'undefined' ? window.innerWidth : 1200
  );

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const isNZ = user?.country?.toLowerCase() === "new zealand" || user?.country?.toLowerCase() === "nz";
  const heroImage = "/admin_hero_optics.png";

  const getMainFontSize = () => {
    if (windowWidth < 480) return "32px";
    if (windowWidth < 768) return "48px";
    if (windowWidth < 1024) return "60px";
    return "72px";
  };

  const getGreetingFontSize = () => {
    if (windowWidth < 480) return "14px";
    if (windowWidth < 768) return "18px";
    return "22px";
  };

  const getContainerHeight = () => {
    if (windowWidth < 480) return "60vh";
    if (windowWidth < 768) return "70vh";
    return "80vh";
  };

  const containerStyle = {
    position: "relative",
    width: "100%",
    height: getContainerHeight(),
    minHeight: "450px",
    maxHeight: "950px",
    overflow: "hidden",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#050505",
    fontFamily: "'Outfit', sans-serif",
  };

  const backgroundStyle = {
    position: "absolute",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    zIndex: 1,
  };

  const imageStyle = {
    width: "100%",
    height: "100%",
    objectFit: "cover",
    filter: "brightness(0.45) contrast(1.1) saturate(1.1)",
    transform: "scale(1.05)",
    animation: "slowZoom 20s infinite alternate ease-in-out",
  };

  const overlayStyle = {
    position: "absolute",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    background: `linear-gradient(to bottom, 
      rgba(0,0,0,0.4) 0%, 
      rgba(0,0,0,0.2) 40%, 
      rgba(0,0,0,0.8) 100%
    ), radial-gradient(circle at center, transparent 0%, rgba(0,0,0,0.4) 100%)`,
    zIndex: 2,
  };

  const glowStyle = {
    position: "absolute",
    top: "50%",
    left: "50%",
    width: "60%",
    height: "60%",
    background: "radial-gradient(circle, rgba(185, 0, 0, 0.15) 0%, transparent 70%)",
    transform: "translate(-50%, -50%)",
    zIndex: 3,
    pointerEvents: "none",
  };

  const contentStyle = {
    position: "relative",
    zIndex: 10,
    textAlign: "center",
    padding: "0 30px",
    maxWidth: "1100px",
    width: "100%",
  };

  const greetingStyle = {
    fontSize: getGreetingFontSize(),
    fontWeight: 600,
    color: "#b90000",
    margin: "0 0 10px 0",
    letterSpacing: "4px",
    textTransform: "uppercase",
    opacity: 0,
    animation: "fadeInDown 0.8s ease-out forwards",
  };

  const titleStyle = {
    margin: 0,
    padding: 0,
    lineHeight: 1,
    perspective: "1000px",
  };

  const fancyStyle = {
    fontSize: getMainFontSize(),
    fontWeight: 800,
    color: "#ffffff",
    textTransform: "uppercase",
    letterSpacing: windowWidth < 768 ? "4px" : "8px",
    display: "block",
    opacity: 0,
    transform: "translateZ(50px)",
    animation: "revealText 1s cubic-bezier(0.23, 1, 0.32, 1) 0.3s forwards",
    textShadow: "0 10px 30px rgba(0,0,0,0.5)",
  };

  const accentLineStyle = {
    width: "0px",
    height: "4px",
    background: "linear-gradient(90deg, transparent, #b90000, transparent)",
    margin: "25px auto",
    borderRadius: "2px",
    animation: "expandLine 1.2s cubic-bezier(0.23, 1, 0.32, 1) 0.8s forwards",
    boxShadow: "0 0 20px rgba(185, 0, 0, 0.4)",
  };

  const regionStyle = {
    fontSize: getGreetingFontSize(),
    fontWeight: 400,
    color: "rgba(255, 255, 255, 0.8)",
    marginTop: "10px",
    letterSpacing: "3px",
    textTransform: "uppercase",
    opacity: 0,
    animation: "fadeInUp 0.8s ease-out 1s forwards",
  };

  return (
    <>
      <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;800&display=swap" rel="stylesheet" />
      <style>
        {`
          @keyframes fadeInDown {
            from { opacity: 0; transform: translateY(-20px); }
            to { opacity: 1; transform: translateY(0); }
          }
          @keyframes fadeInUp {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 0.8; transform: translateY(0); }
          }
          @keyframes revealText {
            from { opacity: 0; transform: translateY(30px) translateZ(50px); }
            to { opacity: 1; transform: translateY(0) translateZ(0); }
          }
          @keyframes expandLine {
            from { width: 0; }
            to { width: ${windowWidth < 768 ? "100px" : "180px"}; }
          }
          @keyframes slowZoom {
            from { transform: scale(1.05); }
            to { transform: scale(1.15); }
          }
        `}
      </style>

      <div style={containerStyle}>
        <div style={backgroundStyle}>
          <img
            src={heroImage}
            alt="Representative Dashboard Hero"
            style={imageStyle}
            loading="eager"
          />
          <div style={overlayStyle}></div>
          <div style={glowStyle}></div>
        </div>

        <div style={contentStyle}>
          <p style={greetingStyle}>Field Operations</p>
          <div style={titleStyle}>
            <span style={fancyStyle}>Representative Portal</span>
          </div>
          <div style={accentLineStyle}></div>
          <p style={regionStyle}>
            {user?.country || 'Australia'} Region
          </p>
        </div>
      </div>
    </>
  );
};

export default Hero;