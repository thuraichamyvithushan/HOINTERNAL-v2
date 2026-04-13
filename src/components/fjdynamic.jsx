
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
                    <h2 className="under">FJ Dynamics New Zealand</h2>
                    <hr style={{ margin: "0",borderTop:"5px solid #ddd" }}></hr>
                    <div className="row no-gutters mt-5 home_row">
                        {/* 2nd row */}
                        <div className="col-xl-2 col-md-4 col-sm-6 mt-3 anime-2 center-card">
                            <div className="card home_card">
                                <div className="card-body" style={{ textAlign: "center" }}>
                                    <a href="https://www.fjdynamics.co.nz/" target="_blank" rel="noreferrer">
                                        <img height="100px" width="100px" src="./images/fj-logo.png" alt="Unleashed" />
                                    </a>
                                    <h4 className="card-title">Website</h4>
                                </div>
                            </div>
                        </div>
                        <div className="col-xl-2 col-md-4 col-sm-6 mt-3 anime-2 center-card">
                            <div className="card home_card">
                                <div className="card-body" style={{ textAlign: "center" }}>
                                    <a href="https://docs.google.com/forms/d/e/1FAIpQLSeA8Jg0kM83asi-bO_vOw4_Fqsg5B1ST1doFLCzR8fd2VjkCA/viewform?usp=send_form" target="_blank" rel="noreferrer">
                                        <img height="100px" width="100px" src="./images/rma.png" alt="B2B Portal" />
                                    </a>
                                    <h4 className="card-title">Purchase Enquiry Form </h4>
                                </div>
                            </div>
                        </div>
                        <div className="col-xl-2 col-md-4 col-sm-6 mt-3 anime-2 center-card">
                            <div className="card home_card">
                                <div className="card-body" style={{ textAlign: "center" }}>
                                    <a href="https://docs.google.com/spreadsheets/d/14-LYalx1T6fdC6NSDRHKfXPrgXVKzgJ4T_xODicm9A0/edit?usp=sharing" target="_blank" rel="noreferrer">
                                        <img height="100px" width="100px" src="./images/excel.png" alt="Huntsman Webpage" />
                                    </a>
                                    <h4 className="card-title">Purchase Enquiry Sheet </h4>
                                </div>
                            </div>
                        </div>
                        <div className="col-xl-2 col-md-4 col-sm-6 mt-3 anime-2 center-card">
                            <div className="card home_card">
                                <div className="card-body" style={{ textAlign: "center" }}>
                                    <a href=" https://docs.google.com/forms/d/e/1FAIpQLSfNNHzl8jYt7RqNVpPExb-EehMfsf4CdFiOGAK1azoRzjiy4Q/viewform" target="_blank" rel="noreferrer">
                                        <img height="100px" width="100px" src="./images/SRR.png" alt="B2B Portal" />
                                    </a>
                                    <h4 className="card-title">Dealer Enquiry Form</h4>
                                </div>
                            </div>
                        </div>
                     
                        <div className="col-xl-2 col-md-4 col-sm-6 mt-3 anime-2 center-card">
                            
                            <div className="card home_card">
                                <div className="card-body" style={{ textAlign: "center" }}>
                                    <a href="https://docs.google.com/spreadsheets/d/1NmIcFvsnA_aT2WrNZxEbpGMT9sIaHbAhW1vGmYahK4o/edit?resourcekey=&gid=207824478#gid=207824478" target="_blank" rel="noreferrer">
                                 
                                        <img height="100px" width="100px" src="./images/des.WEBP" alt="B2B Portal" />
                                  

                                    </a>
                                    <h4 className="card-title">Dealer Enquiry Sheet</h4>
                                </div>
                            </div>
                        </div>
                    
                        <div className="col-xl-2 col-md-4 col-sm-6 mt-3 anime-2 center-card">
                            <div className="card home_card">
                                <div className="card-body" style={{ textAlign: "center" }}>
                                    <a href="https://forms.gle/AZRZnLvboDWo5dBZA" target="_blank" rel="noreferrer">
                                        <img height="100px" width="100px" src="./images/int.jpg" alt="B2B Portal" />
                                    </a>
                                    <h4 className="card-title">Expression of Interest form </h4>
                                </div>
                            </div>
                        </div>

                         <div className="col-xl-2 col-md-4 col-sm-6 mt-3 anime-2 center-card">
                            <div className="card home_card">
                                <div className="card-body" style={{ textAlign: "center" }}>
                       <a href="https://docs.google.com/spreadsheets/d/1R3L0K0d3NjaMqkcD7QfpNw5Vx57eNTA8bHuLoXkJ_-s/edit?usp=sharing" target="_blank" rel="noreferrer">
                                        <img height="100px" width="100px" src="./images/ints.jpg" alt="B2B Portal" />
                                </a> 
                                    <h4 className="card-title">Expression of Interest Sheet </h4>
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
