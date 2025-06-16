import { useState, useEffect } from 'react';
import { collection, query, where, getDocs, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { Modal, Button } from 'react-bootstrap';
import imageCompression from 'browser-image-compression';

function PendingPackages() {
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);

  // États pour la modal de confirmation et la photo
  const [showModal, setShowModal] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [deliveryPhoto, setDeliveryPhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Définition de la fonction fetchPendingPackages
  const fetchPendingPackages = async () => {
    setLoading(true);
    try {
      // Utiliser uniquement le filtre 'where' sans 'orderBy' pour éviter les problèmes d'index
      const q = query(
        collection(db, 'packages'),
        where('received', '==', false)
      );

      const querySnapshot = await getDocs(q);
      const packagesData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      console.log("Colis en attente trouvés:", packagesData.length);
      setPackages(packagesData);
    } catch (error) {
      console.error('Erreur lors de la récupération des colis:', error);
      // Afficher l'erreur complète pour le débogage
      alert(`Erreur: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingPackages();
  }, []);

  // Ouvrir la modal pour confirmer la réception
  const openConfirmationModal = (pkg) => {
    setSelectedPackage(pkg);
    setDeliveryPhoto(null);
    setPhotoPreview(null);
    setShowModal(true);
  };

  // Gérer le changement de photo
  const handlePhotoChange = (e) => {
    if (e.target.files[0]) {
      const file = e.target.files[0];

      // Vérifications similaires à celles de AddPackage.js
      if (file.size > 4 * 1024 * 1024) {
        alert('Image trop volumineuse. Maximum 4MB.');
        return;
      }

      const validFormats = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
      if (!validFormats.includes(file.type)) {
        alert('Format d\'image non supporté. Utilisez JPG, PNG, GIF ou WEBP.');
        return;
      }

      setDeliveryPhoto(file);
      setPhotoPreview(URL.createObjectURL(file));
    }
  };

  const confirmDelivery = async () => {
    if (!selectedPackage) return;

    // Vérifier si une photo a été sélectionnée
    if (!deliveryPhoto) {
      alert('Veuillez ajouter une photo comme preuve de livraison');
      return;
    }

    setIsSubmitting(true);

    try {
      let deliveryPhotoURL = '';

      try {
        console.log("Taille originale de la preuve:", deliveryPhoto.size);

        // Options de compression TRÈS agressives pour les preuves de livraison
        const options = {
          maxSizeMB: 0.3,           // Seulement 300KB max
          maxWidthOrHeight: 800,    // Résolution réduite
          initialQuality: 0.6,      // Qualité JPG réduite à 60%
          useWebWorker: true
        };

        const compressedFile = await imageCompression(deliveryPhoto, options);
        console.log("Taille après compression:", compressedFile.size);

        // Vérifier si l'image est toujours trop volumineuse
        if (compressedFile.size > 500 * 1024) { // 500KB max
          // Si encore trop grande, compresser davantage
          const optionsAgressives = {
            maxSizeMB: 0.2,
            maxWidthOrHeight: 600,
            initialQuality: 0.5,
            useWebWorker: true
          };

          const recompressedFile = await imageCompression(compressedFile, optionsAgressives);
          console.log("Taille après compression agressive:", recompressedFile.size);

          if (recompressedFile.size > 400 * 1024) {
            throw new Error("L'image reste trop volumineuse même après compression");
          }

          // Convertir en Base64
          const reader = new FileReader();
          const photoBase64Promise = new Promise((resolve, reject) => {
            reader.onload = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(recompressedFile);
          });

          deliveryPhotoURL = await photoBase64Promise;
        } else {
          // Taille OK, convertir en Base64
          const reader = new FileReader();
          const photoBase64Promise = new Promise((resolve, reject) => {
            reader.onload = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(compressedFile);
          });

          deliveryPhotoURL = await photoBase64Promise;
        }

      } catch (error) {
        console.error("Erreur traitement image:", error);
        alert(`Erreur lors du traitement de l'image: ${error.message}`);
        setIsSubmitting(false);
        return;
      }

      const now = new Date();
      const deliveryDate = now.toISOString().split('T')[0]; // Format YYYY-MM-DD
      const deliveryTime = now.toLocaleTimeString(); // Heure locale

      await updateDoc(doc(db, 'packages', selectedPackage.id), {
        received: true,
        receivedAt: serverTimestamp(), // Timestamp pour les requêtes et tri
        deliveryPhotoURL: deliveryPhotoURL,
        deliveryDate: deliveryDate, // Date lisible pour l'affichage
        deliveryTime: deliveryTime  // Heure de livraison
      });

      // Rafraîchir la liste
      fetchPendingPackages();
      setShowModal(false);
      alert('Colis remis avec succès!');
    } catch (error) {
      console.error('Erreur lors de la mise à jour:', error);
      alert(`Erreur: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-4">
        <p className="text-secondary">Chargement des colis en attente...</p>
      </div>
    );
  }

  return (
    <div>
      <h2 className="h4 fw-bold mb-4 text-center">Colis en attente</h2>

      {packages.length === 0 ? (
        <p className="text-center text-secondary">Aucun colis en attente</p>
      ) : (
        <div className="row row-cols-1 g-3">
          {packages.map((pkg) => (
            <div key={pkg.id} className="col">
              <div className="card h-100">
                <div className="row g-0">
                  {pkg.photoURL && (
                    <div className="col-4 col-md-3" style={{ minHeight: "140px" }}>
                      <img
                        src={pkg.photoURL}
                        alt="Colis"
                        className="w-100 h-100"
                        style={{ objectFit: "cover" }}
                      />
                    </div>
                  )}

                  <div className={pkg.photoURL ? "col-8 col-md-9" : "col-12"}>
                    <div className="card-body">
                      <h3 className="fw-bold h5">{pkg.name}</h3>
                      <p className="text-secondary mb-1">Unité: {pkg.unit}</p>
                      <p className="text-secondary mb-2">Date: {pkg.date}</p>

                      {/* Modifier le bouton de confirmation */}
                      <button
                        onClick={() => openConfirmationModal(pkg)}
                        className="btn btn-success w-100 mt-1"
                      >
                        Remettre le colis
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal pour confirmation avec photo */}
      <Modal show={showModal} onHide={() => setShowModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Confirmer la remise du colis</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedPackage && (
            <>
              <p><strong>Destinataire:</strong> {selectedPackage.name}</p>
              <p><strong>Unité:</strong> {selectedPackage.unit}</p>

              <div className="mb-3">
                <label className="form-label fw-bold">
                  Ajouter une preuve de livraison (photo) <span className="text-danger">*</span>
                </label>
                <div className="mb-1">
                  <small className="text-danger">Ce champ est obligatoire</small>
                </div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoChange}
                  className="form-control mb-2"
                  required
                />

                {!deliveryPhoto && (
                  /* Modifier le message d'alerte */
                  <div className="alert alert-warning" role="alert">
                    Veuillez ajouter une photo du colis remis au destinataire
                  </div>
                )}

                {photoPreview && (
                  <div className="text-center mt-2">
                    <img
                      src={photoPreview}
                      alt="Preuve de livraison"
                      className="img-fluid"
                      style={{ maxHeight: "200px" }}
                    />
                  </div>
                )}
              </div>
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)}>
            Annuler
          </Button>
          <Button
            variant="success"
            onClick={confirmDelivery}
            disabled={isSubmitting || !deliveryPhoto}
          >
            {/* Modifier le texte du bouton dans la modal */}
            {isSubmitting ? 'Traitement...' : 'Confirmer la remise'}
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}

export default PendingPackages;