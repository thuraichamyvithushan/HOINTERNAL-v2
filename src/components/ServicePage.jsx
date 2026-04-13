import React, { useState, useEffect, useContext } from "react";
import "./ServicePage.css";
import Footer from "./Footer";
import ServicePageNavimg from "./ServicePageNavimg";
import { firestore } from "../firebase";
import { AuthContext } from "../context/AuthContext";
import emailjs from "@emailjs/browser";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faShareNodes,
    faPrint,
    faBook,
    faGlobe,
    faVideo,
    faFileSignature,
    faPhone,
    faEnvelope
} from "@fortawesome/free-solid-svg-icons";

import { API_URL } from "../config";

const ServicePage = () => {
    const { user } = useContext(AuthContext);

    const [isFormOpen, setIsFormOpen] = useState(false);
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        phone: "",
        service: "",
        details: ""
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitSuccess, setSubmitSuccess] = useState(false);

    // Automatically fill user details if logged in
    useEffect(() => {
        if (user && isFormOpen) {
            setFormData(prev => ({
                ...prev,
                name: user.full_name || user.name || prev.name,
                email: user.email || prev.email,
                phone: user.phone_number || user.phone || prev.phone
            }));
        }
    }, [user, isFormOpen]);

    const services = [
        {
            title: "SOCIAL MEDIA MARKETING",
            icon: faShareNodes,
            image: "/assets/services/social_media.png",
            description: "Management of Huntsman Optics' social media presence across Facebook and Instagram. Delivering a consistent stream of branded content designed to maintain market visibility and engage the outdoor and tactical communities.",
            details: [
                "Campaign Management: End-to-end execution for product launches and seasonal sales.",
                "Scheduled Posts: Technical product breakdowns and localized captions for AU/NZ.",
                "Reels & Short-form Video: Mobile-optimized demonstrations and field footage."
            ]
        },
        {
            title: "PRINTABLE ASSETS",
            icon: faPrint,
            image: "/assets/services/printable_assets.png",
            description: "Full suite of physical marketing materials ready for professional production, ensuring a strong presence at trade shows and retail environments.",
            details: [
                "Large-Format Banners: Pull-up banners and event backdrops built to scale.",
                "Magazine Advertisements: Industry-standard CMYK layouts for hunting/outdoor media.",
                "Product Packaging: Technical dielines and structural layouts for HikMicro ranges.",
                "Promo Assets: Brochures, flyers, and discount vouchers for trade shows."
            ]
        },
        {
            title: "CATALOGUE MANAGEMENT",
            icon: faBook,
            image: "/assets/services/catalogue.png",
            description: "Complete oversight of the Huntsman Optics product library across both physical and digital formats, ensuring synchronized data and professional presentation.",
            details: [
                "Printable Catalogues: Full-book layouts for AU and NZ regional markets.",
                "Digital Catalogues: Fast-loading, mobile-responsive interactive versions.",
                "Rapid Updates: Ongoing maintenance for new models and price adjustments."
            ]
        },
        {
            title: "WEBSITE & IT SUPPORT",
            icon: faGlobe,
            image: "/assets/services/website_it.png",
            description: "Full-service administration of the Huntsman Optics web platform and technical infrastructure for regional sales and information.",
            details: [
                "Infrastructure & Security: Backend administration and security monitoring.",
                "Content Updates: Product listings, banner refreshes, and technical news.",
                "Custom Web Apps: Development of interactive product finders and customized forms.",
                "Staff Support: IT assistance for staff and regional representatives."
            ]
        },
        {
            title: "VIDEO & EMAIL MARKETING",
            icon: faVideo,
            image: "/assets/services/video_email.png",
            description: "Technical setup and creative execution of communication strategies to maintain direct contact with the customer base.",
            details: [
                "Email Strategy: Newsletter campaigns, abandoned cart reminders, and subscriber management.",
                "Professional Post-Production: Colour correction for thermal imaging and sound mixing.",
                "Multi-Platform Delivery: Video optimization for YouTube, social media, and in-store displays."
            ]
        },
        {
            title: "DOCUMENTATION & ZOHO SIGN",
            icon: faFileSignature,
            image: "/assets/services/documentation.png",
            description: "Professional administrative support for corporate and technical documents, ensuring alignment with brand identity.",
            details: [
                "Zoho Sign Management: Formatting and deployment of HDPP agreements for AU/NZ.",
                "Technical Manuals: Structural refinement and standardization of service agreements.",
                "Corporate Presentations: High-quality sales decks and dealer conference reviews."
            ]
        }
    ];

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            // Updated to fetch using the dynamic Vercel-ready environment variable config
            const response = await fetch(`${API_URL}/api/service-request`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    fullName: formData.name,
                    email: formData.email,
                    phone: formData.phone,
                    serviceType: formData.service,
                    message: formData.message,
                    country: "Australia/NZ" // Optional detail
                })
            });

            if (!response.ok) {
                throw new Error('Backend failed to send email');
            }

            setSubmitSuccess(true);
            setIsSubmitting(false);
            setTimeout(() => {
                setIsFormOpen(false);
                setSubmitSuccess(false);
                setFormData({ name: "", email: "", phone: "", service: "", details: "" });
            }, 3000);
        } catch (error) {
            console.error("Error submitting service request:", error);
            setIsSubmitting(false);
            alert("Failed to send service request. Please try again later or call us directly.");
            setIsFormOpen(false);
        }
    };

    return (
        <div className="service-page">
            <ServicePageNavimg />

            <div className="container">
                <div className="services-grid">
                    {services.map((service, index) => (
                        <div key={index} className="service-card-modern animate-up">
                            <div className="service-card-image-wrap">
                                <img src={service.image} alt={service.title} className="service-card-img" />
                                <div className="service-card-icon-overlay">
                                    <FontAwesomeIcon icon={service.icon} />
                                </div>
                            </div>
                            <div className="service-card-content">
                                <div className="service-header-modern">
                                    <h3>{service.title}</h3>
                                </div>
                                <p className="service-desc-modern">{service.description}</p>
                                <ul className="service-details-modern">
                                    {service.details.map((detail, idx) => (
                                        <li key={idx}>{detail}</li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="service-cta">
                <div className="cta-content">
                    <h2>Interested in Our Services?</h2>
                    <p>Connect with our team to elevate your technical and marketing capabilities.</p>
                    <div className="cta-buttons-modern">
                        <a href="tel:+61394595211" className="cta-button-modern call-btn-modern">
                            <FontAwesomeIcon icon={faPhone} className="btn-icon" />
                            <span>Call Us</span>
                        </a>
                        <button onClick={() => setIsFormOpen(true)} className="cta-button-modern request-btn-modern">
                            <FontAwesomeIcon icon={faEnvelope} className="btn-icon" />
                            <span>Request a Service</span>
                        </button>
                    </div>
                </div>
            </div>

            {isFormOpen && (
                <div className="form-modal-overlay">
                    <div className="form-modal-content">
                        <button className="close-modal" onClick={() => setIsFormOpen(false)}>&times;</button>
                        {!submitSuccess ? (
                            <>
                                <h2>Request a Service</h2>
                                <p>Fill in the details below and we'll get back to you shortly.</p>
                                <form onSubmit={handleSubmit}>
                                    <div className="form-group">
                                        <label>Select Service</label>
                                        <select
                                            name="service"
                                            value={formData.service}
                                            onChange={handleInputChange}
                                            required
                                        >
                                            <option value="">-- Choose a Service --</option>
                                            {services.map((s, i) => (
                                                <option key={i} value={s.title}>{s.title}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label>Your Name</label>
                                        <input
                                            type="text"
                                            name="name"
                                            value={formData.name}
                                            onChange={handleInputChange}
                                            placeholder="Full Name"
                                            required
                                        />
                                    </div>
                                    <div className="form-row">
                                        <div className="form-group">
                                            <label>Email Address</label>
                                            <input
                                                type="email"
                                                name="email"
                                                value={formData.email}
                                                onChange={handleInputChange}
                                                placeholder="Email"
                                                required
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label>Phone Number</label>
                                            <input
                                                type="tel"
                                                name="phone"
                                                value={formData.phone}
                                                onChange={handleInputChange}
                                                placeholder="Phone"
                                                required
                                            />
                                        </div>
                                    </div>
                                    <div className="form-group">
                                        <label>How can we help?</label>
                                        <textarea
                                            name="message"
                                            value={formData.message}
                                            onChange={handleInputChange}
                                            placeholder="Tell us about your requirements..."
                                            rows="4"
                                            required
                                        ></textarea>
                                    </div>
                                    <button type="submit" className="submit-form-btn">Submit Request</button>
                                </form>
                            </>
                        ) : (
                            <div className="form-success">
                                <div className="success-icon">✓</div>
                                <h2>Thank You!</h2>
                                <p>Your request for <strong>{formData.service}</strong> has been received. Our team will contact you shortly.</p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            <Footer />
        </div>
    );
};

export default ServicePage;
