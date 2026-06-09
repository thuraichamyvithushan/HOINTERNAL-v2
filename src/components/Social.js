import Footer from './Footer'
import './Social.css';
import { Link } from 'react-router-dom';

const Social = function () {
    return (
      <div>
        <div style={{position:"relative",height:"250px"}}>
    <img src="/images/bglightcolor.jpg" alt="logo" style={{ width: "100%", height: "100%",objectFit: "cover" }} /></div>
     <div className='container' style={{width:"80%"}}>
<div className='conts'>
    <h3 style={{marginTop:'20px',textAlign:"center",marginBottom:"10px"}}> Social Huntsman Optics</h3>
    
      <div className='row'style={{justifyContent:"center"}}>
            <div className="col-xl-2 col-md-6 col-sm-12 mt-3 anime"> 
              <div className="card">
                <div className="card-body" style={{textAlign:"center"}}>
                  <div >
                  <Link target='_blank' rel="noopener noreferrer" to="https://www.facebook.com/huntsmanoptics/" >
                     <img  height="100px" width="100px" src="./images/roundfb.png" alt=''/>
                      </Link>
                  </div>
                  <h5 className="card-title">Facebook</h5> 
              </div>
            </div>
            </div>
    
            <div className="col-xl-2 col-md-6 col-sm-12 mt-3 anime"> 
                <div className="card">
                  <div className="card-body" style={{textAlign:"center"}}>
                    <div >
                    <Link to="https://www.instagram.com/huntsmanoptics/" target='_blank' rel="noopener noreferrer">
                       <img  height="100px" width="100px" src="./images/instabox.png" alt=''/>
                    </Link>
                    </div>
                    <h5 className="card-title">Instagram</h5> 
                </div>
              </div>
            </div>
        
            <div className="col-xl-2 col-md-6 col-sm-12 mt-3 anime"> 
                <div className="card">
                  <div className="card-body" style={{textAlign:"center"}}>
                    <div >
                    <Link to="https://www.linkedin.com/company/huntsman-optics-ltd/" target='_blank' rel="noopener noreferrer">
                       <img  height="100px" width="100px" src="./images/linkdnlight.jpeg" alt='linkdin'/>
                    </Link>
                    </div>
                    <h5 className="card-title">Linkedin</h5> 
                </div>
              </div>
            </div>
        
            <div className="col-xl-2 col-md-6 col-sm-12 mt-3 anime"> 
                <div className="card">
                  <div className="card-body" style={{textAlign:"center"}}>
                    <div >
                    <Link to="https://www.youtube.com/@huntsmanoptics8102" target='_blank' rel="noopener noreferrer">
                       <img  height="100px" width="100px" src="./images/youtuberedbox.jpeg" alt='yt'/>
                    </Link>
                    </div>
                    <h5 className="card-title">Youtube</h5> 
                </div>
              </div>
            </div>
        
            <div className="col-xl-2 col-md-6 col-sm-12 mt-3 anime"> 
                <div className="card">
                  <div className="card-body" style={{textAlign:"center"}}>
                    <div >
                    <Link to="https://www.tiktok.com/@huntsman.optics?_t=8m8XFKjbfT0&&_r=1" target='_blank' rel="noopener noreferrer">
                       <img  height="100px" width="100px" src="./images/tiktokbox.jpeg" alt='tt'/> 
                    </Link>
                    </div>
                    <h5 className="card-title">TikTok</h5> 
                </div>
              </div>
            </div>
        
            {/* <div className="col-xl-2 col-md-6 col-sm-12 mt-3 anime"> 
                <div className="card">
                  <div className="card-body" style={{textAlign:"center"}}>
                    <div >
                    <Link to="" target='_blank' rel="noopener noreferrer">
                       <img  height="100px" width="100px" src="./images/credantial.png" alt='log'/>
                    </Link>                     
                    </div>
                    <h5 className="card-title">Creds & pwd</h5> 
                </div>
              </div>
            </div> */}
      </div>
    {/* pos system section is below i want to make this section as center of the alignment justyfy content center */}
    <h3 style={{textAlign:"center",marginTop:"40px"}}>POS System</h3>  
    <div className='row justify-content-center'>
    <div className="col-xl-2 col-md-6 col-sm-12 mt-3 anime"> 
      <div className="card">
        <div className="card-body" style={{textAlign:"center"}}>
          <div >
          <Link to="https://au.unleashedsoftware.com/v2/Account/LogOn?ReturnUrl=%2fv2%2f" target='_blank' rel="noopener noreferrer">
             <img  height="120px" width="150px" src="./images/unleashedc.png" alt='unleashd'/> 
          </Link>
          </div>
          <h5 className="card-title">Unleashed</h5> 
      </div>
      </div>
    </div>
    
    <div className="col-xl-2 col-md-6 col-sm-12 mt-3 anime"> 
      <div className="card">
        <div className="card-body" style={{textAlign:"center"}}>
          <div >
          <Link to="https://huntsmanopticsau.store.unleashedsoftware.com/home" target='_blank' rel="noopener noreferrer">
             <img  height="120px" width="150px" src="./images/b2blightblue.png" alt='b2b'/>
          </Link>
          </div>
          <h5 className="card-title">B2B Portal</h5> 
      </div>
      </div>
    </div>
        
    </div>
    </div>
        
        </div>
        <Footer/>
        </div>
)}


export default Social