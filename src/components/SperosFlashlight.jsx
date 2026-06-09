import './BusinessSub.css'
import React from 'react';
import { Link } from "react-router-dom";
import Footer from './Footer';

const SperosFlashlight = () => {
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
            <div className='container mt-4 mb-5'>
                <h3 className='home_heading'>Speros Flashlights & Lightning</h3>

                <div className='row justify-content-center mt-3'>
                    {/* Facebook */}
                    <div className="col-xl-4 col-lg-4 col-md-6 col-12 mt-3">
                        <div className="card text-center hover-card">
                            <div className="card-body">
                                <Link
                                    to="https://www.facebook.com/profile.php?id=61553121941505"
                                    target='_blank'
                                    rel="noopener noreferrer"
                                >
                                    <img src="./images/roundfb.png" alt='Facebook' className="img-fluid mb-2"/>
                                </Link>
                                <h4 className="card-title">Facebook</h4> 
                            </div>
                        </div>
                    </div>

                    {/* Shopify */}
                    <div className="col-xl-4 col-lg-4 col-md-6 col-12 mt-3">
                        <div className="card text-center hover-card">
                            <div className="card-body">
                                <Link
                                    to="https://admin.shopify.com/store/b618a4-4"
                                    target='_blank'
                                    rel="noopener noreferrer"
                                >
                                    <img src="./images/shopifybox.png" alt='Shopify' className="img-fluid mb-2"/>
                                </Link>
                                <h4 className="card-title">Shopify</h4> 
                            </div>
                        </div>
                    </div>

                    {/* Website */}
                    <div className="col-xl-4 col-lg-4 col-md-6 col-12 mt-3">
                        <div className="card text-center hover-card">
                            <div className="card-body">
                                <Link
                                    to="https://sperasoceania.com/"
                                    target='_blank'
                                    rel="noopener noreferrer"
                                >
                                    <img src="./images/websiteicon.jpeg" alt='Website' className="img-fluid mb-2"/>
                                </Link>
                                <h4 className="card-title">Website</h4> 
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <Footer/>
        </div>
    )
}

export default SperosFlashlight;
