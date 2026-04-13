
import "./HomePageGrid.css";
import React from "react";
import { Link } from "react-router-dom";
import Footer from "./Footer";

const RoadshowNZ = function () {
    return (
        <div>
            <div className="container main-cent" style={{ marginTop: "80px",marginBottom:'30px'}}>
                <div className="cent">
                     <div className="sales">
                    <h2 className="under">Road Show</h2>
                    <hr style={{ margin: "0",borderTop:"5px solid #ddd" }}></hr>
                    <div className="row no-gutters mt-5 home_row">
                        {/* 2nd row */}
                       
                        <div className="col-three col-md-4 col-sm-6 mt-3 anime-2 center-card">
                            <div className="card home_card">
                                <div className="card-body" style={{ textAlign: "center" }}>
                                    <a href="https://docs.google.com/spreadsheets/d/1kKfGkZI1bzxEhFJnYH43QVQvvDcL1LSC9Fp-S3kvTYM/edit?gid=1750338519#gid=1750338519" target="_blank" rel="noreferrer">
                                        <img height="100px" width="100px" src="./images/spf1.jpg" alt="Unleashed" />
                                    </a>
                                    <h4 className="card-title">Master schedule</h4>
                                </div>
                            </div>
                        </div>
                        <div className="col-three col-md-4 col-sm-6 mt-3 anime-2 center-card">
                            <div className="card home_card">
                                <div className="card-body" style={{ textAlign: "center" }}>
                                    <a href="https://forms.bluecatreports.com/7G8mtXtD/marketing-request-form-" target="_blank" rel="noreferrer">
                                        <img height="100px" width="100px" src="./images/rma.png" alt="B2B Portal" />
                                    </a>
                                    <h4 className="card-title">Additional Details form</h4>
                                </div>
                            </div>
                        </div>
                        <div className="col-three col-md-4 col-sm-6 mt-3 anime-2 center-card">
                            <div className="card home_card">
                                <div className="card-body" style={{ textAlign: "center" }}>
                                    <a href="https://www.canva.com/design/DAHC8bagP3A/yCKcv9RDLJ82DjxcpawRnQ/edit" target="_blank" rel="noreferrer">
                                        <img height="100px" width="100px" src="./images/review.png" alt="Huntsman Webpage" />
                                    </a>
                                    <h4 className="card-title">Tile review</h4>
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

export default RoadshowNZ;
