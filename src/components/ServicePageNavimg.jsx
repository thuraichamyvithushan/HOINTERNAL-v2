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
    if (windowWidth < 480) return "24px";
    if (windowWidth < 768) return "32px"; // Adjusted based on user feedback (not too large)
    if (windowWidth < 1024) return "55px";
    return "65px";
  };

  const getGreetingFontSize = () => {
    if (windowWidth < 480) return "14px";
    if (windowWidth < 768) return "16px";
    if (windowWidth < 1024) return "24px";
    return "28px";
  };

  const getContainerHeight = () => {
    if (windowWidth < 480) return "50vh"; // Slightly smaller for mobile
    if (windowWidth < 768) return "60vh";
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
      radial-gradient(circle at 20% 30%, rgba(239, 68, 68, 0.15) 0%, transparent 60%),
      radial-gradient(circle at 80% 70%, rgba(3, 7, 18, 0.9) 0%, transparent 50%),
      linear-gradient(135deg, 
        rgba(3, 7, 18, 0.95) 0%, 
        rgba(17, 24, 39, 0.85) 50%, 
        rgba(3, 7, 18, 0.95) 100% 
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
    fontWeight: 600,
    color: "#ef4444",
    margin: "0 0 15px 0",
    letterSpacing: "3px",
    textTransform: "uppercase",
    opacity: 0.95,
    textShadow: "0 0 20px rgba(239, 68, 68, 0.3), 0 2px 4px rgba(0, 0, 0, 0.5)",
    animation: "fadeInDown 1s ease-out 0.3s both",
  };

  const titleStyle = {
    margin: 0,
    padding: 0,
    lineHeight: 1.1,
  };

  // Sleek white-to-red metallic gradient
  const redBlackGradient = `
    linear-gradient(
      to right,
      #ffffff 0%,
      #f3f4f6 40%,
      #ef4444 100%
    )
  `;

  const fancyStyle = {
    fontFamily: "'Inter', 'Work Sans', sans-serif",
    fontSize: getMainFontSize(),
    fontWeight: 900,
    background: redBlackGradient,
    backgroundSize: "200% auto",
    WebkitBackgroundClip: "text",
    backgroundClip: "text",
    color: "transparent",
    textTransform: "uppercase",
    letterSpacing: windowWidth < 768 ? "1px" : "3px",
    animation: "gradientFlow 4s linear infinite, scaleUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.6s both",
    filter: "drop-shadow(0 10px 20px rgba(0, 0, 0, 0.5))",
  };

  const accentLineStyle = {
    width: windowWidth < 768 ? "60px" : "100px",
    height: "4px",
    background: "linear-gradient(90deg, transparent, #ef4444, transparent)",
    margin: "30px auto 0",
    borderRadius: "2px",
    animation: "expandWidth 1s cubic-bezier(0.16, 1, 0.3, 1) 0.9s both",
    boxShadow: "0 0 15px rgba(239, 68, 68, 0.4)",
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
          <p style={greetingStyle}>Huntsman Optics</p>
          <div style={titleStyle}>
            <span style={fancyStyle} className="hero-fancy-text">
              Our Services
            </span>
          </div>
          <p style={{
            fontFamily: "'Inter', 'Work Sans', sans-serif",
            fontSize: getGreetingFontSize(),
            fontWeight: 400,
            color: "#ffffff",
            marginTop: "15px",
            marginBottom: 0,
            letterSpacing: "2px",
            textTransform: "uppercase",
            textShadow: "0 2px 4px rgba(0, 0, 0, 0.8)",
            animation: "fadeInDown 1s ease-out 0.5s both"
          }}>
            Marketing & Technical Support
          </p>
          <div style={accentLineStyle}></div>
        </div>
      </div>
    </>
  );
};

export default Hero;
