import "./news.css";
import Footer from "./Footer.jsx";
import React from "react";

const News = function () {
  return (
    <div>
       <div style={{position:"relative",height:"250px"}}>
            <img src="/images/bglightcolor.jpg" alt="logo" style={{ width: "100%", height: "100%",objectFit: "cover" }} />
          </div>
      <div className="container">
            <h3
                 className="news_heading"
                 style={{ paddingTop: "20px", textAlign: "center" }}
            >
                 News & Updates
            </h3>
        <div className="row justify-content-center mt-3">
          <div className="col-lg-5 col-md-6 col-sm-12 news_grid">
            <div className="card news_card card-hover">
              <div className="Ncard-body" style={{ textAlign: "center" }}>
                <a
                  href="https://sites.google.com/huntsmanoptics.com/huntsmanoptics/home/news-and-updates?authuser=0"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <img
                    height="350px"
                    width="100%"
                    src="./images/N&U.jpeg"
                    alt="News & Updates"
                    style={{ objectFit: "cover", borderRadius: "5px 5px 0 0" }}
                  />
                </a>
                <h4 className="card-h4" style={{ padding: "10px",textAlign: "center" }}>
                  Huntsman news & Updates
                </h4>
              </div>
            </div>
          </div>
          <div className="col-lg-5 col-md-6 col-sm-12 news_grid">
            <div className="card news_card card-hover">
              <div
                className="Ncard-body"
                style={{ textAlign: "center", width: "400px",height:"100%" }}
              >
                <iframe
                  src="https://calendar.google.com/calendar/embed?src=en.au%23holiday%40group.v.calendar.google.com&ctz=Australia%2FSydney"
                  title="Holidays in Australia"
                  style={{ border: 0, padding: "10px" }}
                  width="500"
                  height="350"
                  frameBorder="0"
                  scrolling="no"
                ></iframe>
                <h4
                  className="card-h4"
                  style={{ paddingBottom: "10px", paddingTop: "0" }}
                >
                  Holidays in Australia
                </h4>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default News;
