import React, { useState, useEffect } from "react";

const Hero = () => {
  const [windowWidth, setWindowWidth] = useState(
    typeof window !== 'undefined' ? window.innerWidth : 1200
  );

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Responsive calculations
  const getMainFontSize = () => {
    if (windowWidth < 480) return "32px";
    if (windowWidth < 768) return "45px";
    if (windowWidth < 1024) return "55px";
    return "65px";
  };

  const getGreetingFontSize = () => {
    if (windowWidth < 480) return "16px";
    if (windowWidth < 768) return "18px";
    if (windowWidth < 1024) return "20px";
    return "24px";
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
    minHeight: "400px",
    maxHeight: "950px",
    overflow: "hidden",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#050505",
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
    filter: "brightness(0.7) contrast(1.1)",
  };

  const overlayStyle = {
    position: "absolute",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    background: `
      linear-gradient(to bottom, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.3) 40%, rgba(0,0,0,0.9) 100%),
      radial-gradient(circle at center, rgba(185,0,0,0.2) 0%, transparent 60%)
    `,
    zIndex: 2,
  };

  const contentStyle = {
    position: "relative",
    zIndex: 10,
    textAlign: "center",
    padding: "0 20px",
    maxWidth: "1000px",
    width: "100%",
  };

  const greetingStyle = {
    fontFamily: "'Outfit', 'Montserrat', sans-serif",
    fontSize: getGreetingFontSize(),
    fontWeight: 600,
    color: "#b90000",
    margin: "0 0 10px 0",
    letterSpacing: "6px",
    textTransform: "uppercase",
    textShadow: "0 4px 10px rgba(0,0,0,0.8)",
    animation: "fadeInDown 1s ease-out 0.3s both",
  };

  const titleStyle = {
    margin: 0,
    padding: 0,
    lineHeight: 1.1,
  };

  const fancyStyle = {
    fontFamily: "'Outfit', 'Montserrat', sans-serif",
    fontSize: getMainFontSize(),
    fontWeight: 800,
    background: "linear-gradient(to bottom right, #ffffff 0%, #999999 100%)",
    WebkitBackgroundClip: "text",
    backgroundClip: "text",
    color: "transparent",
    textTransform: "uppercase",
    letterSpacing: windowWidth < 768 ? "3px" : "8px",
    animation: "scaleUp 1s cubic-bezier(0.16, 1, 0.3, 1) 0.5s both",
    filter: "drop-shadow(0 15px 25px rgba(0, 0, 0, 0.8))",
  };

  const accentLineStyle = {
    width: windowWidth < 768 ? "60px" : "100px",
    height: "4px",
    background: "#b90000",
    margin: "30px auto 0",
    borderRadius: "2px",
    animation: "expandWidth 1s cubic-bezier(0.16, 1, 0.3, 1) 0.8s both",
    boxShadow: "0 0 15px rgba(185, 0, 0, 0.8)",
  };

  return (
    <>
      <style>
        {`
          @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;800&display=swap');

          @keyframes fadeInDown {
            from {
              opacity: 0;
              transform: translateY(-20px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }

          @keyframes scaleUp {
            from {
              opacity: 0;
              transform: scale(0.95) translateY(10px);
            }
            to {
              opacity: 1;
              transform: scale(1) translateY(0);
            }
          }

          @keyframes expandWidth {
            from {
              width: 0;
              opacity: 0;
            }
            to {
              width: ${windowWidth < 768 ? "60px" : "100px"};
              opacity: 1;
            }
          }

          /* Disable animations for users who prefer reduced motion */
          @media (prefers-reduced-motion: reduce) {
            * {
              animation: none !important;
              transition: none !important;
            }
          }

          /* High contrast mode support */
          @media (prefers-contrast: high) {
            .hero-fancy-text {
              background: #ffffff !important;
              -webkit-background-clip: text !important;
              background-clip: text !important;
            }
          }
        `}
      </style>

      <div style={containerStyle}>
        {/* Background Layer */}
        <div style={backgroundStyle}>
          <img
            src="/admin_hero_optics.png"
            alt="Huntsman Optics Admin Hero"
            style={imageStyle}
            loading="eager"
          />
          <div style={overlayStyle}></div>
        </div>

        {/* Content Layer */}
        <div style={contentStyle}>
          <p style={greetingStyle}>System Administration</p>
          <div style={titleStyle}>
            <span style={fancyStyle} className="hero-fancy-text">
              Command Center
            </span>
          </div>
          <div style={accentLineStyle}></div>
        </div>
      </div>
    </>
  );
};

export default Hero;