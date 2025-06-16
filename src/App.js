import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { useState } from 'react';
import AddPackage from './components/AddPackage';
import PendingPackages from './components/PendingPackages';
import PackageHistory from './components/PackageHistory';
import VideoHistory from './components/VideoHistory';
import ScreenRecorder from './components/ScreenRecorder';
import './App.css';
import 'bootstrap/dist/css/bootstrap.min.css';

function App() {
  const [expanded, setExpanded] = useState(false);

  return (
    <Router>
      <div className="min-vh-100 bg-light">
        <nav className="navbar navbar-expand-md navbar-dark bg-primary">
          <div className="container">
            <h1 className="navbar-brand fw-bold mb-0">Gestion des Colis</h1>

            <button
              className="navbar-toggler"
              type="button"
              onClick={() => setExpanded(!expanded)}
              aria-controls="navbarNav"
              aria-expanded={expanded}
              aria-label="Toggle navigation"
            >
              <span className="navbar-toggler-icon"></span>
            </button>

            <div className={`collapse navbar-collapse ${expanded ? 'show' : ''}`} id="navbarNav">
              <div className="navbar-nav ms-auto">
                <Link
                  to="/"
                  className="nav-link px-3"
                  onClick={() => setExpanded(false)}
                >
                  Ajouter un colis
                </Link>
                <Link
                  to="/pending"
                  className="nav-link px-3"
                  onClick={() => setExpanded(false)}
                >
                  Colis en attente
                </Link>
                <Link
                  to="/history"
                  className="nav-link px-3"
                  onClick={() => setExpanded(false)}
                >
                  Historique
                </Link>
                <Link
                  to="/videos"
                  className="nav-link px-3"
                  onClick={() => setExpanded(false)}
                >
                  Vidéos 🎥
                </Link>
              </div>
            </div>
          </div>
        </nav>

        <div className="container py-4">
          <Routes>
            <Route path="/" element={<AddPackage />} />
            <Route path="/pending" element={<PendingPackages />} />
            <Route path="/history" element={<PackageHistory />} />
            <Route path="/videos" element={<VideoHistory />} />
          </Routes>
        </div>

        <ScreenRecorder />
      </div>
    </Router>
  );
}

export default App;