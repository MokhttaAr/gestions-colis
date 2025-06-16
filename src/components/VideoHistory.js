import { useState, useEffect } from 'react';
import { collection, query, orderBy, getDocs, limit } from 'firebase/firestore';
import { db } from '../firebase';
import { Button, Modal, Form } from 'react-bootstrap';

function VideoHistory() {
  const [recordings, setRecordings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadLimit, setLoadLimit] = useState(10);

  useEffect(() => {
    const fetchRecordings = async () => {
      setLoading(true);
      try {
        const q = query(
          collection(db, 'screenrecordings'),
          orderBy('dateHeure', 'desc'),
          limit(loadLimit)
        );
        
        const querySnapshot = await getDocs(q);
        const recordingsData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          // Convertir timestamp Firestore en date JavaScript si nécessaire
          dateHeure: doc.data().dateHeure?.toDate()
        }));
        
        setRecordings(recordingsData);
      } catch (error) {
        console.error('Erreur lors de la récupération des enregistrements:', error);
        alert(`Erreur: ${error.message}`);
      } finally {
        setLoading(false);
      }
    };
    
    fetchRecordings();
  }, [loadLimit]);

  // Fonction pour formatter la date
  const formatDate = (date) => {
    if (!date) return 'Date inconnue';
    return date.toLocaleString('fr-FR', { 
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Charger plus d'enregistrements
  const loadMoreRecordings = () => {
    setLoadLimit(prev => prev + 10);
  };

  if (loading && recordings.length === 0) {
    return (
      <div className="text-center py-4">
        <p className="text-secondary">Chargement des enregistrements vidéo...</p>
      </div>
    );
  }

  return (
    <div>
      <h2 className="h4 fw-bold mb-4 text-center">Historique des enregistrements vidéo</h2>
      
      <div className="alert alert-info mb-3">
        <small>
          <strong>Note:</strong> Cette page affiche uniquement les informations sur les vidéos enregistrées.
          Les vidéos elles-mêmes sont sauvegardées localement sur votre appareil.
        </small>
      </div>

      {recordings.length === 0 ? (
        <p className="text-center text-secondary">Aucun enregistrement vidéo trouvé</p>
      ) : (
        <>
          {/* Vue pour grand écran - tableau */}
          <div className="d-none d-lg-block">
            <div className="table-responsive">
              <table className="table table-bordered table-hover">
                <thead>
                  <tr>
                    <th>Type</th>
                    <th>Résident</th>
                    <th>Unité</th>
                    <th>Date et heure</th>
                    <th>Taille</th>
                    <th>Nom du fichier</th>
                  </tr>
                </thead>
                <tbody>
                  {recordings.map((recording) => (
                    <tr key={recording.id}>
                      <td>
                        <span className={`badge ${recording.type === 'Ajout de colis' ? 'bg-primary' : 'bg-success'}`}>
                          {recording.type}
                        </span>
                      </td>
                      <td>{recording.nom}</td>
                      <td>{recording.unite}</td>
                      <td>{formatDate(recording.dateHeure)}</td>
                      <td>{recording.tailleMB ? `${recording.tailleMB} MB` : 'N/A'}</td>
                      <td><small className="text-muted">{recording.nomFichier}</small></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          
          {/* Vue pour mobile - cartes */}
          <div className="d-block d-lg-none">
            {recordings.map((recording) => (
              <div key={recording.id} className="card mb-3">
                <div className="card-header d-flex justify-content-between align-items-center">
                  <span className={`badge ${recording.type === 'Ajout de colis' ? 'bg-primary' : 'bg-success'}`}>
                    {recording.type}
                  </span>
                  <small>{formatDate(recording.dateHeure)}</small>
                </div>
                <div className="card-body">
                  <h5 className="card-title">{recording.nom}</h5>
                  <p className="card-text mb-1">Unité: {recording.unite}</p>
                  <p className="card-text mb-1">
                    <small className="text-muted">
                      Taille: {recording.tailleMB ? `${recording.tailleMB} MB` : 'N/A'}
                    </small>
                  </p>
                  <p className="card-text">
                    <small className="text-muted">
                      Fichier: {recording.nomFichier}
                    </small>
                  </p>
                </div>
              </div>
            ))}
          </div>
          
          {/* Bouton pour charger plus d'enregistrements */}
          <div className="text-center mt-3 mb-2">
            <Button 
              variant="outline-secondary" 
              onClick={loadMoreRecordings}
              disabled={loading}
            >
              {loading ? 'Chargement...' : 'Voir plus d\'enregistrements'}
            </Button>
          </div>
        </>
      )}
    </div>
  );
}

export default VideoHistory;