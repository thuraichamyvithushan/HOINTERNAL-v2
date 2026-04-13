import './App.css';
import Navbar from './components/navbar';
import { HashRouter, Route, Routes, Navigate } from 'react-router-dom';
import BusinessSub from './components/BusinessSub';
import Social from './components/Social';
import MainPage from './components/mainPage';
import HuntsmanThermo from './components/HuntsmanThermo';
import CoastOutdoor from './components/CoastOutdoor';
import DemoDeals from './components/DemoDeals';
import SperosFlashlight from './components/SperosFlashlight';
import SignInSignUpForm from './components/SignInSignUpForm';
import MagneTech from './components/MageTech';
import News from './components/news';
import PrivateRoute from './PrivateRoute';
import { useContext } from 'react';
import AuthContext from './context/AuthContext';
import Loader from './components/Loader';
import DealerLocate from './components/DealerLocate';
import Clearance from './components/ccd';
import FJD from './components/fjdynamic';
import Event from './components/event';
import EVENTNZ from './components/eventNZ';

import DealerPage from './components/Dealerdashboard';
import RepresentativePage from './components/Representativedashboard';
import Drive from './components/drive';


import Image1 from './components/image1';
import Image2 from './components/image2';
import Image3 from './components/image3';
import Navbar2 from './components/navdrive';
import ServicePage from "./components/ServicePage";
import RoleProtectedRoute from './components/RoleProtectedRoute';
import AdminPage from './components/AdminMainPage'
import DealerPageNZ from './components/DealerdashboardNZ';
import RepresentativePageNZ from './components/RepresentativedashboardNZ';
import MainPageNZ from './components/mainPageNZ';
import Roadshow from './components/Roadshow';
import RoadshowNZ from './components/RoadshowNZ';
import InfluencerPage from './components/Influencerdashboard';
import InfluencerPageNZ from './components/InfluencerdashboardNZ';
import { getRoleHomePath } from './utils/authHelpers';


import ScrollToTop from './components/ScrollToTop';

function App() {
  const { user, loading } = useContext(AuthContext);

  // Wait for Firebase to restore the session before rendering anything.
  if (loading) {
    return <Loader />;
  }

  return (
    <div className="App">
      <HashRouter>
        <ScrollToTop />
        <Routes>
          {/* Login page — redirect authenticated users straight to their dashboard */}
          <Route
            path="/"
            element={
              user
                ? <Navigate to={getRoleHomePath(user)} replace />
                : <SignInSignUpForm />
            }
          />

          <Route
            path="/*"
            element={
              <PrivateRoute>
                <Navbar />
                <Routes>
                  <Route
                    path="/admin"
                    element={
                      <RoleProtectedRoute user={user} allowedRoles={['admin']}>
                        <AdminPage />
                      </RoleProtectedRoute>
                    }
                  />

                  <Route
                    path="/dealer-page"
                    element={
                      <RoleProtectedRoute user={user} allowedRoles={['dealer', 'admin']} allowedCountries={['Australia']}>
                        <DealerPage />
                      </RoleProtectedRoute>
                    }
                  />

                  <Route
                    path="/representative-page"
                    element={
                      <RoleProtectedRoute user={user} allowedRoles={['representative', 'admin']} allowedCountries={['Australia']}>
                        <RepresentativePage />
                      </RoleProtectedRoute>
                    }
                  />

                  <Route
                    path="/home"
                    element={
                      <RoleProtectedRoute user={user} allowedRoles={['staff', 'admin']} allowedCountries={['Australia']}>
                        <MainPage />
                      </RoleProtectedRoute>
                    }
                  />

                  <Route
                    path="/dealer-page-nz"
                    element={
                      <RoleProtectedRoute user={user} allowedRoles={['dealer', 'admin']} allowedCountries={['New Zealand', 'Newzealand', 'NZ']}>
                        <DealerPageNZ />
                      </RoleProtectedRoute>
                    }
                  />

                  <Route
                    path="/representative-page-nz"
                    element={
                      <RoleProtectedRoute user={user} allowedRoles={['representative', 'admin']} allowedCountries={['New Zealand', 'Newzealand', 'NZ']}>
                        <RepresentativePageNZ />
                      </RoleProtectedRoute>
                    }
                  />

                  <Route
                    path="/home-nz"
                    element={
                      <RoleProtectedRoute user={user} allowedRoles={['staff', 'admin']} allowedCountries={['New Zealand', 'Newzealand', 'NZ']}>
                        <MainPageNZ />
                      </RoleProtectedRoute>
                    }
                  />

                  <Route
                    path="/influencer-page"
                    element={
                      <RoleProtectedRoute user={user} allowedRoles={['influencer', 'admin']} allowedCountries={['Australia']}>
                        <InfluencerPage />
                      </RoleProtectedRoute>
                    }
                  />

                  <Route
                    path="/influencer-page-nz"
                    element={
                      <RoleProtectedRoute user={user} allowedRoles={['influencer', 'admin']} allowedCountries={['New Zealand', 'Newzealand', 'NZ']}>
                        <InfluencerPageNZ />
                      </RoleProtectedRoute>
                    }
                  />
                  <Route path="/service-capability" element={<ServicePage />} />

                  <Route path="/business" element={<BusinessSub />} />
                  <Route path="/social" element={<Social />} />
                  <Route path="/HuntsmanThermo" element={<HuntsmanThermo />} />
                  <Route path="/CoastOutdoor" element={<CoastOutdoor />} />
                  <Route path="/DemoDeals" element={<DemoDeals />} />
                  <Route path="/news&update" element={<News />} />
                  <Route path="/SperosFlashlight" element={<SperosFlashlight />} />
                  <Route path="/Magnetech" element={<MagneTech />} />
                  <Route path="/DealerLocate" element={<DealerLocate />} />
                  <Route path="/Clearance" element={<Clearance />} />
                  <Route path="/fjd" element={<FJD />} />
                  <Route path="/drive" element={<Drive />} />
                  <Route path="/nav" element={<Drive />} />
                  <Route path='/events' element={<Event />} />
                  <Route path='/roadshow' element={<Roadshow />} />
                  <Route path='/roadshow-nz' element={<RoadshowNZ />} />

                  <Route path='/events-NZ' element={<EVENTNZ />} />


                  <Route path="/img3" element={<><Navbar2 /><Image3 /></>} />
                  <Route path="/img2" element={<><Navbar2 /><Image2 /></>} />
                  <Route path="/img1" element={<><Navbar2 /><Image1 /></>} />
                </Routes>
              </PrivateRoute>
            }
          />
        </Routes>
      </HashRouter>
    </div>
  );
}

export default App;
