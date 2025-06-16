import { useState, useRef, useEffect } from 'react';
import { Button, Modal, Form } from 'react-bootstrap';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';

function ScreenRecorder() {
  const [recording, setRecording] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showPreRecordingModal, setShowPreRecordingModal] = useState(false);
  const [recordingType, setRecordingType] = useState('');
  const [recordedBlob, setRecordedBlob] = useState(null);
  const [residentName, setResidentName] = useState('');
  const [unitNumber, setUnitNumber] = useState('');
  const [recordingTime, setRecordingTime] = useState(0);
  const [recordingWarning, setRecordingWarning] = useState(false);
  
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const streamRef = useRef(null);
  const timerRef = useRef(null);
  
  // Fonction pour ouvrir le modal avant l'enregistrement
  const openPreRecordingModal = (type) => {
    setRecordingType(type);
    setShowPreRecordingModal(true);
  };
  
  // Fonction pour commencer l'enregistrement après avoir saisi les informations
  const startRecording = async () => {
    if (!residentName || !unitNumber) {
      alert('Veuillez remplir tous les champs obligatoires');
      return;
    }
    
    setShowPreRecordingModal(false);
    setRecordingTime(0);
    setRecordingWarning(false);
    
    try {
      // Demander l'accès à l'écran
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: { 
          cursor: "always",
          displaySurface: "window",
          frameRate: 15,
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: false
      });
      
      streamRef.current = stream;
      
      // Créer le MediaRecorder avec des options de compression
      const options = { 
        mimeType: 'video/webm;codecs=vp8',
        videoBitsPerSecond: 1000000
      };
      
      const mediaRecorder = new MediaRecorder(stream, options);
      mediaRecorderRef.current = mediaRecorder;
      
      // Vider les chunks précédents
      chunksRef.current = [];
      
      // Enregistrer les données
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };
      
      // Lorsque l'enregistrement est terminé
      mediaRecorder.onstop = () => {
        clearInterval(timerRef.current);
        const blob = new Blob(chunksRef.current, {
          type: 'video/webm'
        });
        
        // Vérifier la taille de la vidéo
        console.log(`Taille de la vidéo: ${(blob.size / (1024 * 1024)).toFixed(2)} MB`);
        
        setRecordedBlob(blob);
        setShowModal(true);
        setRecording(false);
      };
      
      // Lorsqu'une piste se termine (l'utilisateur annule le partage)
      stream.getVideoTracks()[0].onended = () => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
          mediaRecorderRef.current.stop();
        }
        clearInterval(timerRef.current);
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
        }
        setRecording(false);
      };
      
      // Commencer l'enregistrement
      mediaRecorder.start(1000); // Créer un chunk chaque seconde
      setRecording(true);
      
      // Démarrer le chronomètre
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => {
          const newTime = prev + 1;
          // Avertir après 1 minute d'enregistrement
          if (newTime === 60 && !recordingWarning) {
            setRecordingWarning(true);
            alert("Attention: l'enregistrement dure depuis 1 minute. Les vidéos longues peuvent être volumineuses.");
          }
          return newTime;
        });
      }, 1000);
      
    } catch (error) {
      console.error("Erreur lors de l'accès à l'écran:", error);
      alert("Impossible d'accéder à l'écran. Veuillez autoriser l'accès.");
    }
  };
  
  // Fonction pour arrêter l'enregistrement
  const stopRecording = () => {
    if (mediaRecorderRef.current && recording) {
      if (mediaRecorderRef.current.state !== "inactive") {
        mediaRecorderRef.current.stop();
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      clearInterval(timerRef.current);
      setRecording(false);
    }
  };
  
  // Fonction pour formater le temps d'enregistrement
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };
  
  // Fonction pour sauvegarder la vidéo localement et enregistrer ses métadonnées
  const saveVideo = async () => {
    if (!recordedBlob) return;
    
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    
    // Format du nom de fichier selon les exigences
    const fileName = `${recordingType}_${residentName.replace(/\s+/g, '_')}_${unitNumber}_${year}-${month}-${day}_${hours}h${minutes}.webm`;
    
    try {
      // Enregistrer les métadonnées dans Firestore sans l'URL de la vidéo
      await addDoc(collection(db, 'screenrecordings'), {
        nom: residentName,
        unite: unitNumber,
        dateHeure: serverTimestamp(),
        type: recordingType === 'ajout_colis' ? 'Ajout de colis' : 'Remise de colis',
        nomFichier: fileName,
        tailleMB: Math.round(recordedBlob.size / (1024 * 1024) * 100) / 100, // Taille en MB avec 2 décimales
        stockageLocal: true, // Indiquer que la vidéo est stockée localement
        dateCréation: `${day}/${month}/${year} ${hours}:${minutes}`
      });
      
      // Télécharger la vidéo localement
      const url = URL.createObjectURL(recordedBlob);
      const a = document.createElement('a');
      document.body.appendChild(a);
      a.style = 'display: none';
      a.href = url;
      a.download = fileName;
      a.click();
      window.URL.revokeObjectURL(url);
      
      alert("Vidéo sauvegardée localement avec succès! Les informations ont été enregistrées dans l'historique.");
      
      // Réinitialiser les états
      setShowModal(false);
      setRecordedBlob(null);
      setResidentName('');
      setUnitNumber('');
    } catch (error) {
      console.error("Erreur lors de la sauvegarde:", error);
      alert(`Erreur: ${error.message}\nEssayez de télécharger manuellement la vidéo.`);
      
      // Téléchargement de secours en cas d'erreur Firestore
      const url = URL.createObjectURL(recordedBlob);
      const a = document.createElement('a');
      document.body.appendChild(a);
      a.style = 'display: none';
      a.href = url;
      a.download = fileName;
      a.click();
      window.URL.revokeObjectURL(url);
    }
  };
  
  // Nettoyer en cas de déchargement du composant
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  return (
    <div className="position-fixed bottom-0 end-0 p-3" style={{zIndex: 1050}}>
      <div className="d-flex flex-column">
        {!recording ? (
          <>
            <Button 
              variant="primary" 
              className="mb-2" 
              onClick={() => openPreRecordingModal('ajout_colis')}
              size="sm"
            >
              🎥 Enregistrer ajout de colis
            </Button>
            <Button 
              variant="success" 
              onClick={() => openPreRecordingModal('remise_colis')}
              size="sm"
            >
              🎥 Enregistrer remise de colis
            </Button>
          </>
        ) : (
          <Button 
            variant="danger" 
            onClick={stopRecording}
            className="animate__animated animate__pulse animate__infinite"
          >
            ⏹️ Arrêter l'enregistrement ({formatTime(recordingTime)})
          </Button>
        )}
      </div>
      
      {/* Modal pour collecter les informations avant l'enregistrement */}
      <Modal show={showPreRecordingModal} onHide={() => setShowPreRecordingModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>
            {recordingType === 'ajout_colis' ? 'Enregistrer l\'ajout de colis' : 'Enregistrer la remise de colis'}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>Veuillez saisir les informations du résident avant de commencer l'enregistrement :</p>
          
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Nom du résident</Form.Label>
              <Form.Control 
                type="text" 
                value={residentName} 
                onChange={(e) => setResidentName(e.target.value)}
                required
              />
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Label>Numéro d'unité</Form.Label>
              <Form.Control 
                type="text" 
                value={unitNumber} 
                onChange={(e) => setUnitNumber(e.target.value)}
                required
              />
            </Form.Group>
          </Form>
          
          <div className="alert alert-info" role="alert">
            <small>
              <strong>Conseil:</strong> Pour optimiser la taille de la vidéo, essayez de :
              <ul className="mb-0 mt-1">
                <li>Sélectionner uniquement la fenêtre concernée, pas tout l'écran</li>
                <li>Garder l'enregistrement court (moins d'une minute si possible)</li>
                <li>Arrêter l'enregistrement dès que l'action est terminée</li>
              </ul>
            </small>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowPreRecordingModal(false)}>
            Annuler
          </Button>
          <Button variant="primary" onClick={startRecording} disabled={!residentName || !unitNumber}>
            Commencer l'enregistrement
          </Button>
        </Modal.Footer>
      </Modal>
      
      {/* Modal pour sauvegarder l'enregistrement */}
      <Modal show={showModal} onHide={() => setShowModal(false)} centered backdrop="static">
        <Modal.Header closeButton>
          <Modal.Title>Enregistrement terminé</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>Votre vidéo est prête à être sauvegardée.</p>
          
          {recordedBlob && (
            <p>Taille approximative: <strong>{(recordedBlob.size / (1024 * 1024)).toFixed(2)} MB</strong></p>
          )}
          
          <div className="alert alert-info" role="alert">
            <small>
              La vidéo sera sauvegardée sur votre appareil et ses informations seront enregistrées dans l'historique.
            </small>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)}>
            Annuler
          </Button>
          <Button variant="primary" onClick={saveVideo}>
            Sauvegarder la vidéo
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}

export default ScreenRecorder;