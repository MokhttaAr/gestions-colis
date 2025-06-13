import { useState, useEffect } from 'react';
import { collection, query, getDocs, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import { Modal, Button } from 'react-bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';

function PackageHistory() {
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);

  const handleShowImage = (imageUrl) => {
    setSelectedImage(imageUrl);
    setShowModal(true);
  };

  useEffect(() => {
    const fetchPackages = async () => {
      setLoading(true);
      try {
        const q = query(
          collection(db, 'packages'),
          orderBy('createdAt', 'desc')
        );

        const querySnapshot = await getDocs(q);
        const packagesData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        setPackages(packagesData);
      } catch (error) {
        console.error('Erreur lors de la récupération des colis:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPackages();
  }, []);

  if (loading) {
    return (
      <div className="text-center py-4">
        <p className="text-secondary">Chargement de l'historique...</p>
      </div>
    );
  }

  return (
    <div>
      <h2 className="h4 fw-bold mb-4 text-center">Historique des colis</h2>

      {packages.length === 0 ? (
        <p className="text-center text-secondary">Aucun colis enregistré</p>
      ) : (
        <>
          {/* Vue pour grand écran - tableau classique */}
          <div className="d-none d-lg-block">
            <div className="table-responsive">
              <table className="table table-bordered table-hover">
                <thead>
                  <tr>
                    <th>Résident</th>
                    <th>Unité</th>
                    <th>Date d'arrivée</th>
                    <th>Date de réception</th>
                    <th>Photo</th>
                    <th>Preuve</th>
                    <th>Statut</th>
                  </tr>
                </thead>
                <tbody>
                  {/* Le tableau existant sans changement */}
                  {packages.map((pkg) => (
                    <tr key={pkg.id}>
                      <td>{pkg.name}</td>
                      <td>{pkg.unit}</td>
                      <td>{pkg.date}</td>
                      <td>
                        {pkg.received ? (
                          <span>
                            {pkg.deliveryDate} <small className="text-muted">{pkg.deliveryTime}</small>
                          </span>
                        ) : (
                          "Non récupéré"
                        )}
                      </td>
                      <td>
                        {pkg.photoURL ? (
                          <button
                            onClick={() => handleShowImage(pkg.photoURL)}
                            className="btn btn-sm btn-outline-primary"
                          >
                            Voir
                          </button>
                        ) : (
                          "Aucune"
                        )}
                      </td>
                      <td>
                        {pkg.deliveryPhotoURL ? (
                          <button
                            onClick={() => handleShowImage(pkg.deliveryPhotoURL)}
                            className="btn btn-sm btn-outline-success"
                          >
                            Voir
                          </button>
                        ) : (
                          "Aucune"
                        )}
                      </td>
                      <td>
                        <span className={`badge ${pkg.received ? 'bg-success' : 'bg-warning'}`}>
                          {pkg.received ? 'Recupere' : 'En attente'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Vue pour mobile - cartes */}
          <div className="d-block d-lg-none">
            {packages.map((pkg) => (
              <div key={pkg.id} className="card mb-3">
                <div className="card-header d-flex justify-content-between align-items-center">
                  <h5 className="mb-0">{pkg.name}</h5>
                  <span className={`badge ${pkg.received ? 'bg-success' : 'bg-warning'}`}>
                    {pkg.received ? 'Récupéré' : 'En attente'}
                  </span>
                </div>

                <div className="card-body">
                  <div className="row mb-2">
                    <div className="col-5 text-secondary">Unité:</div>
                    <div className="col-7 fw-bold">{pkg.unit}</div>
                  </div>

                  <div className="row mb-2">
                    <div className="col-5 text-secondary">Date d'arrivée:</div>
                    <div className="col-7">{pkg.date}</div>
                  </div>

                  <div className="row mb-2">
                    <div className="col-5 text-secondary">Date de réception:</div>
                    <div className="col-7">
                      {pkg.received ? (
                        <span>
                          {pkg.deliveryDate} <small className="text-muted">{pkg.deliveryTime}</small>
                        </span>
                      ) : (
                        "Non récupéré"
                      )}
                    </div>
                  </div>

                  <div className="mt-3 d-flex gap-2">
                    {pkg.photoURL && (
                      <button
                        onClick={() => handleShowImage(pkg.photoURL)}
                        className="btn btn-sm btn-outline-primary"
                      >
                        Voir la photo
                      </button>
                    )}

                    {pkg.deliveryPhotoURL && (
                      <button
                        onClick={() => handleShowImage(pkg.deliveryPhotoURL)}
                        className="btn btn-sm btn-outline-success"
                      >
                        Voir la preuve
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Modal pour afficher l'image */}
      <Modal show={showModal} onHide={() => setShowModal(false)} centered size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Photo du colis</Modal.Title>
        </Modal.Header>
        <Modal.Body className="text-center">
          {selectedImage && (
            <img
              src={selectedImage}
              alt="Photo du colis"
              className="img-fluid"
              style={{ maxHeight: '70vh' }}
            />
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)}>
            Fermer
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}

export default PackageHistory;