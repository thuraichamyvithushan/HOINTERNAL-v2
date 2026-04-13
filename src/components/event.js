
import "./HomePageGrid.css";
import React from "react";
import { Link } from "react-router-dom";
import Footer from "./Footer";

const HomePageGrid = function () {
    return (
        <div>
            <div className="container main-cent" style={{ marginTop: "80px",marginBottom:'30px'}}>
                <div className="cent">
                     <div className="sales">
                    <h2 className="under">Events</h2>
                    <hr style={{ margin: "0",borderTop:"5px solid #ddd" }}></hr>
                    <div className="row no-gutters mt-5 home_row">
                        {/* 2nd row */}
                        <div className="col-xl-2 col-md-3 col-sm-6 mt-3 anime-2 center-card">
                            <div className="card home_card">
                                <div className="card-body" style={{ textAlign: "center" }}>
                                    <Link to="/roadshow">
                                    <img height="100px" width="100px" src="./images/roadshow.png" alt="Unleashed" />
                                    </Link>
                                    
                                    <h4 className="card-title">Roar Roadshow</h4>
                                </div>
                            </div>
                        </div>
                        <div className="col-xl-2 col-md-3 col-sm-6 mt-3 anime-2 center-card">
                            <div className="card home_card">
                                <div className="card-body" style={{ textAlign: "center" }}>
                                    <a href="#" target="_blank" rel="noreferrer">
                                        <img height="100px" width="100px" src="./images/e1.jpg" alt="Unleashed" />
                                    </a>
                                    <h4 className="card-title">Dealer Days</h4>
                                </div>
                            </div>
                        </div>
                        <div className="col-xl-2 col-md-3 col-sm-6 mt-3 anime-2 center-card">
                            <div className="card home_card">
                                <div className="card-body" style={{ textAlign: "center" }}>
                                    <a href="#" target="_blank" rel="noreferrer">
                                        <img height="100px" width="100px" src="./images/e2.jpg" alt="B2B Portal" />
                                    </a>
                                    <h4 className="card-title"> Night Events</h4>
                                </div>
                            </div>
                        </div>
                        <div className="col-xl-2 col-md-3 col-sm-6 mt-3 anime-2 center-card">
                            <div className="card home_card">
                                <div className="card-body" style={{ textAlign: "center" }}>
                                    <a href="#" target="_blank" rel="noreferrer">
                                        <img height="100px" width="100px" src="./images/e3.avif" alt="Huntsman Webpage" />
                                    </a>
                                    <h4 className="card-title">Expo</h4>
                                </div>
                            </div>
                        </div>

                         <div className="col-xl-2 col-md-3 col-sm-6 mt-3 anime-2 center-card">
                            <div className="card home_card">
                                <div className="card-body" style={{ textAlign: "center" }}>
                                    <a href="#" target="_blank" rel="noreferrer">
                                        <img height="100px" width="100px" src="./images/v1.webp" alt="Huntsman Webpage" />
                                    </a>
                                    <h4 className="card-title"> Large Show</h4>
                                </div>
                            </div>
                        </div>

                        <div className="col-xl-2 col-md-3 col-sm-6 mt-3 anime-2 center-card">
                            <div className="card home_card">
                                <div className="card-body" style={{ textAlign: "center" }}>
                                    <a href="https://forms.gle/XCLSKjVsZEv26WXv6" target="_blank" rel="noreferrer">
                                        <img height="100px" width="100px" src="./images/spsa.jpg" alt="Huntsman Webpage" />
                                    </a>
                                    <h4 className="card-title">Event / Promotion Request Form </h4>
                                </div>
                            </div>
                        </div>
                        
                       
                    </div>   
                </div>
                 </div>


 



             
            </div>
            <Footer/>
        </div>
    );
};

export default HomePageGrid;
