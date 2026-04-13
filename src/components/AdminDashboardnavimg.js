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
    if (windowWidth < 768) return "20px";
    if (windowWidth < 1024) return "24px";
    return "28px";
  };

  const getContainerHeight = () => {
    if (windowWidth < 480) return "70vh";
    if (windowWidth < 768) return "75vh";
    return "80vh";
  };

  const containerStyle = {
    position: "relative",
    width: "100%",
    height: getContainerHeight(),
    minHeight: "400px",
    maxHeight: "700px",
    overflow: "hidden",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
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
    filter: "brightness(0.3) contrast(1.2)",
  };

  const overlayStyle = {
    position: "absolute",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    background: `
      radial-gradient(circle at 20% 30%, rgba(255, 0, 0, 0.3) 0%, transparent 50%),
      radial-gradient(circle at 80% 70%, rgba(139, 0, 0, 0.4) 0%, transparent 50%),
      linear-gradient(135deg, 
        rgba(0, 0, 0, 0.9) 0%, 
        rgba(139, 0, 0, 0.7) 30%, 
        rgba(0, 0, 0, 0.8) 70%, 
        rgba(0, 0, 0, 0.95) 100%
      )
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
    fontFamily: "'Inter', 'Work Sans', sans-serif",
    fontSize: getGreetingFontSize(),
    fontWeight: 300,
    color: "#ff0000",
    margin: "0 0 15px 0",
    letterSpacing: "2px",
    textTransform: "uppercase",
    opacity: 0.95,
    textShadow: "0 0 20px rgba(255, 0, 0, 0.5), 0 2px 4px rgba(0, 0, 0, 0.8)",
    animation: "fadeInDown 1s ease-out 0.3s both",
  };

  const titleStyle = {
    margin: 0,
    padding: 0,
    lineHeight: 1.1,
  };

  // Red and black gradient background for text
  const redBlackGradient = `
    linear-gradient(
      45deg,
      #fbfbfbff 0%,
      #000000ff 25%,
      #000000ff 45%,
      #ffffffff 55%,
      #990000 75%,
      #ffffffff 100%
    )
  `;

  const fancyStyle = {
    fontFamily: "'Inter', 'Work Sans', sans-serif",
    fontSize: getMainFontSize(),
    fontWeight: 900,
    background: redBlackGradient,
    backgroundSize: "300% 300%",
    WebkitBackgroundClip: "text",
    backgroundClip: "text",
    color: "transparent",
    textTransform: "uppercase",
    letterSpacing: windowWidth < 768 ? "2px" : "4px",
    animation: "gradientFlow 3s ease-in-out infinite, scaleUp 0.8s ease-out 0.6s both",
    filter: "drop-shadow(0 4px 12px rgba(255, 0, 0, 0.4))",
    textShadow: "0 0 30px rgba(255, 0, 0, 0.3)",
  };

  const accentLineStyle = {
    width: windowWidth < 768 ? "50px" : "80px",
    height: "3px",
    background: "linear-gradient(90deg, #ff0000, #000000)",
    margin: "20px auto 0",
    borderRadius: "2px",
    animation: "expandWidth 1s ease-out 0.9s both",
    boxShadow: "0 0 15px rgba(255, 0, 0, 0.6)",
  };

  return (
    <>
      <style>
        {`
          @keyframes fadeInDown {
            from {
              opacity: 0;
              transform: translateY(-30px);
            }
            to {
              opacity: 0.95;
              transform: translateY(0);
            }
          }

          @keyframes scaleUp {
            from {
              opacity: 0;
              transform: scale(0.8);
            }
            to {
              opacity: 1;
              transform: scale(1);
            }
          }

          @keyframes gradientFlow {
            0%, 100% {
              background-position: 0% 50%;
            }
            50% {
              background-position: 100% 50%;
            }
          }

          @keyframes expandWidth {
            from {
              width: 0;
              opacity: 0;
            }
            to {
              width: ${windowWidth < 768 ? "50px" : "80px"};
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
              background: #ff0000 !important;
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
            src="/images/paper.avif"
            alt="hero background"
            style={imageStyle}
            loading="eager"
          />
          <div style={overlayStyle}></div>
        </div>

        {/* Content Layer */}
        <div style={contentStyle}>
          <p style={greetingStyle}>Hello Admin</p>
          <div style={titleStyle}>
            <span style={fancyStyle} className="hero-fancy-text">
              Welcome To The Portal
            </span>
          </div>
          <div style={accentLineStyle}></div>
        </div>
      </div>
    </>
  );
};

export default Hero;