
import "./HomePageGrid.css";
import React from "react";
import { Link } from "react-router-dom";
import Footer from "./Footer";

const Staff = function () {
    return (
        <div>
            <div className="container main-cent" style={{ marginTop: "80px",marginBottom:'30px'}}>
                <div className="cent">
                    


                <div className="sales">
                    <h2 className="under">Staff Purchase</h2>
                    <hr style={{ margin: "0",borderTop:"5px solid #ddd" }}></hr>
                    <div className="row no-gutters mt-5 home_row"style={{ paddingLeft: "120px" }}>
                        {/* 2nd row */}
                        <div className="col-xl-3 col-md-4 col-sm-6 mt-3 anime-2 center-card">
                            <div className="card home_card">
                                <div className="card-body" style={{ textAlign: "center" }}>
                                    <a href="https://docs.google.com/forms/d/e/1FAIpQLSed9tfy7VhOURiff9mGDKvZ0v8ipJzspCwr0EHiiCW7FknLBA/viewform" target="_blank" rel="noreferrer">
                                        <img height="100px" width="100px" src="./images/spa.png" alt="Unleashed" />
                                    </a>
                                    <h4 className="card-title">Staff Purchase Australia</h4>
                                </div>
                            </div>
                        </div>
                        <div className="col-xl-3 col-md-4 col-sm-6 mt-3 anime-2 center-card">
                            <div className="card home_card">
                                <div className="card-body" style={{ textAlign: "center" }}>
                                    <a href="https://docs.google.com/forms/d/e/1FAIpQLSfvpVFnPrHz2rOjRQuwbZm00MHFngt9lEXLZ4wPi7RnSHq6jg/viewform" target="_blank" rel="noreferrer">
                                        <img height="100px" width="100px" src="./images/spn.png" alt="B2B Portal" />
                                    </a>
                                    <h4 className="card-title">Staff Purchase New Zealand </h4>
                                </div>
                            </div>
                        </div>
                        <div className="col-xl-3 col-md-4 col-sm-6 mt-3 anime-2 center-card">
                            <div className="card home_card">
                                <div className="card-body" style={{ textAlign: "center" }}>
                                    <a href="https://docs.google.com/spreadsheets/d/17OBUDclKYltxZNVCBPjllUIzBcKzRWpbFRSFWuDJiis/edit?resourcekey=&gid=1735386543#gid=1735386543" target="_blank" rel="noreferrer">
                                        <img height="100px" width="100px" src="./images/spsa.jpg" alt="Huntsman Webpage" />
                                    </a>
                                    <h4 className="card-title">Staff Purchase Sheet Australia </h4>
                                </div>
                            </div>
                        </div>
                        <div className="col-xl-3 col-md-4 col-sm-6 mt-3 anime-2 center-card">
                            <div className="card home_card">
                                <div className="card-body" style={{ textAlign: "center" }}>
                                    <a href="https://docs.google.com/spreadsheets/d/1p06r5JjXN_aR3dviDj2hNu8XOGZ6vvbajvYkM4b5XEs/edit?resourcekey=&gid=1207818033#gid=1207818033" target="_blank" rel="noreferrer">
                                        <img height="100px" width="100px" src="./images/spsn.webp" alt="B2B Portal" />
                                    </a>
                                    <h4 className="card-title">Staff Purchase Sheet New Zealand</h4>
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

export default Staff;
