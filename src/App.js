import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import AddPackage from './components/AddPackage';
import PendingPackages from './components/PendingPackages';
import PackageHistory from './components/PackageHistory';
import './App.css';
import 'bootstrap/dist/css/bootstrap.min.css';

function App() {
  return (
    <Router>
      <div className="min-vh-100 bg-light">
        <nav className="navbar navbar-expand navbar-dark bg-primary">
          <div className="container">
            <h1 className="navbar-brand fw-bold mb-0">Gestion des Colis</h1>
            <div>
              <Link to="/" className="text-white me-3 text-decoration-none">Ajouter un colis</Link>
              <Link to="/pending" className="text-white me-3 text-decoration-none">Colis en attente</Link>
              <Link to="/history" className="text-white text-decoration-none">Historique</Link>
            </div>
          </div>
        </nav>

        <div className="container py-4">
          <Routes>
            <Route path="/" element={<AddPackage />} />
            <Route path="/pending" element={<PendingPackages />} />
            <Route path="/history" element={<PackageHistory />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;