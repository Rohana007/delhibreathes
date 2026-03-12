import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import { ThemeProvider } from './context/ThemeContext';
import Header from './components/common/Header';
import ReportPollutionModal from './components/ReportPollutionModal';
import Dashboard from './components/dashboard/Dashboard';
import MyReports from './pages/MyReports';
import AchievementsPage from './pages/AchievementsPage';
import GreenPointsPage from './pages/GreenPointsPage';
import AirShieldNavigator from './pages/airshield/AirShieldNavigator';
import SafeRouteMap from './pages/SafeRouteMap';
import SourceAnalysisPage from './pages/SourceAnalysisPage';
import CPCBValidationPage from './pages/CPCBValidationPage';
import ValidationPage from './pages/Validation';
import StartPage from './pages/StartPage';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Profile from './pages/Profile';
import ProfileEdit from './pages/ProfileEdit';
import Footer from './components/common/Footer';
import { useEffect } from 'react';
import { addDailyLoginPoints } from './utils/pointsEngine';
import { checkAchievements } from './utils/achievementsEngine';
// Language translator disabled for Round 2
// import { initTranslation } from './utils/translator/localTranslator';
import { useFeatureFlags } from './hooks/useFeatureFlags';
import { useAuth } from './hooks/useAuth';

// Policy Pages
import PolicyLoginNew from './policy/pages/PolicyLoginNew';
import PolicyLayout from './policy/components/PolicyLayout';
import PolicyDashboard from './policy/pages/PolicyDashboard';
import PolicySimulatorPage from './policy/pages/PolicySimulatorPage';
import PolicyReports from './policy/pages/PolicyReports';
import PolicyAnalytics from './policy/pages/PolicyAnalytics';
import PolicyHotspots from './policy/pages/PolicyHotspots';
import PolicySourceContribution from './policy/pages/PolicySourceContribution';
import PolicyProfile from './policy/pages/PolicyProfile';
import PolicyProfileEdit from './policy/pages/PolicyProfileEdit';
import PolicyProtectedRouteNew from './policy/components/PolicyProtectedRouteNew';

function App() {
  const flags = useFeatureFlags();
  const { user, token } = useAuth();
  
  // Daily login hook
  useEffect(() => {
    addDailyLoginPoints();
    checkAchievements('daily_login');
  }, []);

  // Language translator disabled for Round 2
  // useEffect(() => {
  //   initTranslation();
  // }, []);

  return (
    <ThemeProvider>
      <AppProvider>
        <Router>
          <div className={!flags.showReportPollution ? 'hidden-feature' : ''}>
            <ReportPollutionModal />
          </div>
          <Routes>
            {/* Default route - redirect to start page */}
            <Route path="/" element={<Navigate to="/start" replace />} />
            
            {/* Public Routes */}
            <Route path="/dashboard" element={
              <div className="min-h-screen flex flex-col">
                <Header />
                <main className="flex-1">
                  <Dashboard />
                </main>
                <Footer />
              </div>
            } />
            <Route path="/dashboard" element={
              <div className="min-h-screen flex flex-col">
                <Header />
                <main className="flex-1">
                  <Dashboard />
                </main>
                <Footer />
              </div>
            } />
            <Route path="/my-reports" element={
              <div className={`min-h-screen flex flex-col ${!flags.showMyReports ? 'hidden-feature' : ''}`} style={{ background: '#ffffff' }}>
                <Header />
                <main className="flex-1">
                  <MyReports />
                </main>
                <Footer />
              </div>
            } />
            <Route path="/achievements" element={
              <div className={`min-h-screen flex flex-col ${!flags.showGamification ? 'hidden-feature' : ''}`} style={{ background: '#ffffff' }}>
                <Header />
                <main className="flex-1">
                  <AchievementsPage />
                </main>
                <Footer />
              </div>
            } />
            <Route path="/green-points" element={
              <div className={`min-h-screen flex flex-col ${!flags.showGamification ? 'hidden-feature' : ''}`} style={{ background: '#ffffff' }}>
                <Header />
                <main className="flex-1">
                  <GreenPointsPage />
                </main>
                <Footer />
              </div>
            } />
            <Route path="/airshield-navigator" element={<AirShieldNavigator />} />
            <Route path="/safe-route-map" element={<SafeRouteMap />} />
            <Route path="/source-analysis" element={
              <div className="min-h-screen flex flex-col">
                <Header />
                <main className="flex-1">
                  <SourceAnalysisPage />
                </main>
                <Footer />
              </div>
            } />
            <Route path="/cpcb-validation" element={
              <div className="min-h-screen flex flex-col">
                <Header />
                <main className="flex-1">
                  <CPCBValidationPage />
                </main>
                <Footer />
              </div>
            } />
            <Route path="/validation" element={
              <div className="min-h-screen flex flex-col">
                <Header />
                <main className="flex-1">
                  <ValidationPage />
                </main>
                <Footer />
              </div>
            } />

            {/* Start Page */}
            <Route path="/start" element={<StartPage />} />

            {/* Auth Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />

            {/* Profile Routes */}
            <Route path="/profile" element={<Profile />} />
            <Route path="/profile/edit" element={<ProfileEdit />} />

            {/* Policy Routes */}
            <Route path="/policy-login" element={<PolicyLoginNew />} />
            <Route path="/policy-dashboard" element={
              <PolicyProtectedRouteNew>
                <PolicyLayout />
              </PolicyProtectedRouteNew>
            }>
              <Route index element={<PolicyDashboard />} />
              <Route path="simulator" element={
                <div className={!flags.showPolicySimulator ? 'hidden-feature' : ''}>
                  <PolicySimulatorPage />
                </div>
              } />
              {/* Reports page is public - accessible without authentication */}
              <Route path="reports" element={
                <div className={!flags.showCitizenReports ? 'hidden-feature' : ''}>
                  <PolicyReports />
                </div>
              } />
              <Route path="analytics" element={
                <div className={!flags.showReportsAnalytics ? 'hidden-feature' : ''}>
                  <PolicyAnalytics />
                </div>
              } />
              <Route path="hotspots" element={<PolicyHotspots />} />
              <Route path="source-contribution" element={<PolicySourceContribution />} />
              <Route path="profile" element={<PolicyProfile />} />
              <Route path="profile/edit" element={<PolicyProfileEdit />} />
            </Route>
          </Routes>
        </Router>
      </AppProvider>
    </ThemeProvider>
  );
}

export default App;
