import React from "react";
import { Link } from "react-router-dom";
import Footer from "./Footer";
import './BusinessSub.css'

const HuntsmanThermo = () => {    
    return (
        <div>
            {/* Hero Image */}
            <div style={{ position: "relative", height: "250px" }}>
                <img
                    src="/images/bglightcolor.jpg"
                    alt="logo"
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
            </div>

            {/* Container */}
            <div className="container mt-4 mb-5">
                <h3 className="home_heading">Huntsman Thermography</h3>

                <div className='row justify-content-center mt-3'>
                    {/* Facebook */}
                    <div className="col-xl-4 col-lg-4 col-md-6 col-12 mt-3">
                        <div className="card text-center hover-card">
                            <div className="card-body">
                                <Link
                                    to="https://web.facebook.com/HuntsmanThermography?_rdc=1&_rdr"
                                    target='_blank'
                                    rel="noopener noreferrer"
                                >
                                    <img src="./images/roundfb.png" alt='Facebook' className="img-fluid mb-2"/>
                                </Link>
                                <h4 className="card-title">Facebook</h4> 
                            </div>
                        </div>
                    </div>

                    {/* LinkedIn */}
                    <div className="col-xl-4 col-lg-4 col-md-6 col-12 mt-3">
                        <div className="card text-center hover-card">
                            <div className="card-body">
                                <Link
                                    to="https://www.linkedin.com/company/huntsman-optics-ltd/"
                                    target='_blank'
                                    rel="noopener noreferrer"
                                >
                                    <img src="./images/linkdn2.png" alt='LinkedIn' className="img-fluid mb-2"/>
                                </Link>
                                <h4 className="card-title">LinkedIn</h4> 
                            </div>
                        </div>
                    </div>

                    {/* BigCommerce */}
                    <div className="col-xl-4 col-lg-4 col-md-6 col-12 mt-3">
                        <div className="card text-center hover-card">
                            <div className="card-body">
                                <Link
                                    to="https://login.bigcommerce.com/login"
                                    target='_blank'
                                    rel="noopener noreferrer"
                                >
                                    <img src="./images/BigCommerce-Quiz.jpg" alt='BigCommerce' className="img-fluid mb-2"/>
                                </Link>
                                <h4 className="card-title">BigCommerce</h4> 
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <Footer/>
        </div>
    )
}

export default HuntsmanThermo;
