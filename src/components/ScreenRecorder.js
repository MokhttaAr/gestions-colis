import { useState, useRef, useEffect } from 'react';
import { Button, Modal, Form } from 'react-bootstrap';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db, storage } from '../firebase';

function ScreenRecorder() {
    const [recording, setRecording] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [showPreRecordingModal, setShowPreRecordingModal] = useState(false);
    const [recordingType, setRecordingType] = useState('');
    const [recordedBlob, setRecordedBlob] = useState(null);
    const [residentName, setResidentName] = useState('');
    const [unitNumber, setUnitNumber] = useState('');
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [saveOption, setSaveOption] = useState('local'); // 'local' ou 'both'
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
                console.log("MediaRecorder s'est arrêté");
                clearInterval(timerRef.current);

                // Vérifier qu'on a bien des données à traiter
                if (chunksRef.current.length > 0) {
                    const blob = new Blob(chunksRef.current, {
                        type: 'video/webm'
                    });

                    // Vérifier la taille de la vidéo
                    console.log(`Taille de la vidéo: ${(blob.size / (1024 * 1024)).toFixed(2)} MB`);

                    if (blob.size > 50 * 1024 * 1024) {
                        alert("La vidéo est très volumineuse. Elle sera sauvegardée localement uniquement pour éviter de dépasser les limites de Firebase.");
                        setSaveOption('local');
                    }

                    setRecordedBlob(blob);
                    setShowModal(true);
                } else {
                    console.log("Aucune donnée enregistrée");
                }

                // S'assurer que l'état d'enregistrement est réinitialisé
                setRecording(false);
            };

            // Lorsqu'une piste se termine (l'utilisateur annule le partage)
            stream.getVideoTracks()[0].onended = () => {
                console.log("L'utilisateur a arrêté le partage via le navigateur");
                // S'assurer que l'état recording est mis à jour immédiatement
                setRecording(false);

                // Arrêter proprement l'enregistreur si actif
                if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
                    mediaRecorderRef.current.stop();
                }

                clearInterval(timerRef.current);

                // Arrêter tous les tracks
                if (streamRef.current) {
                    streamRef.current.getTracks().forEach(track => track.stop());
                }
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
                        alert("Attention: l'enregistrement dure depuis 1 minute. Les vidéos trop longues peuvent ne pas être uploadées sur Firebase.");
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
        console.log("Arrêt manuel de l'enregistrement");
        if (mediaRecorderRef.current && recording) {
            // Vérifier que le MediaRecorder n'est pas déjà arrêté
            if (mediaRecorderRef.current.state !== "inactive") {
                mediaRecorderRef.current.stop();
            }

            // Arrêter tous les tracks
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

    // Fonction pour sauvegarder la vidéo
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

        // Toujours sauvegarder localement
        const url = URL.createObjectURL(recordedBlob);
        const a = document.createElement('a');
        document.body.appendChild(a);
        a.style = 'display: none';
        a.href = url;
        a.download = fileName;
        a.click();
        window.URL.revokeObjectURL(url);

        // Si l'utilisateur a choisi de sauvegarder également dans Firebase
        if (saveOption === 'both') {
            setUploading(true);

            try {
                // Vérifier la taille de la vidéo avant upload
                if (recordedBlob.size > 20 * 1024 * 1024) { // Si plus de 20 MB
                    if (!window.confirm("Cette vidéo est volumineuse et pourrait rapidement épuiser votre quota Firebase gratuit. Continuer quand même?")) {
                        setUploading(false);
                        setShowModal(false);
                        setRecordedBlob(null);
                        return;
                    }
                }

                // Chemin dans Firebase Storage avec dossier par date
                const storagePath = `videos/${year}-${month}-${day}/${fileName}`;
                const storageRef = ref(storage, storagePath);

                await uploadBytes(storageRef, recordedBlob);
                setUploadProgress(50);

                // Obtenir l'URL de téléchargement
                const downloadURL = await getDownloadURL(storageRef);
                setUploadProgress(75);

                // Enregistrer les métadonnées dans Firestore
                await addDoc(collection(db, 'screenrecordings'), {
                    nom: residentName,
                    unite: unitNumber,
                    dateHeure: serverTimestamp(),
                    urlVideo: downloadURL,
                    type: recordingType === 'ajout_colis' ? 'Ajout de colis' : 'Remise de colis',
                    nomFichier: fileName,
                    tailleMB: Math.round(recordedBlob.size / (1024 * 1024) * 100) / 100 // Taille en MB avec 2 décimales
                });

                setUploadProgress(100);

                alert("Vidéo sauvegardée avec succès dans le cloud et en local !");
            } catch (error) {
                console.error("Erreur lors de la sauvegarde dans le cloud:", error);
                alert(`Erreur lors de l'upload: ${error.message}\nLa vidéo a été sauvegardée localement uniquement.`);
            } finally {
                setUploading(false);
                setUploadProgress(0);
            }
        } else {
            alert("Vidéo sauvegardée localement avec succès !");
        }

        // Réinitialiser les états
        setShowModal(false);
        setRecordedBlob(null);
        setResidentName('');
        setUnitNumber('');
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
        <div className="position-fixed bottom-0 end-0 p-3" style={{ zIndex: 1050 }}>
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
                            <strong>Conseil:</strong> Pour optimiser l'espace de stockage, essayez de :
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
            <Modal show={showModal} onHide={() => !uploading && setShowModal(false)} centered backdrop="static">
                <Modal.Header closeButton={!uploading}>
                    <Modal.Title>Enregistrement terminé</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {!uploading ? (
                        <>
                            <p>Comment souhaitez-vous sauvegarder cette vidéo?</p>

                            <Form.Group className="mb-3">
                                <Form.Check
                                    type="radio"
                                    id="save-local"
                                    name="saveOption"
                                    label="Sauvegarder localement uniquement (recommandé pour la version gratuite)"
                                    checked={saveOption === 'local'}
                                    onChange={() => setSaveOption('local')}
                                />
                                <Form.Check
                                    type="radio"
                                    id="save-both"
                                    name="saveOption"
                                    label="Sauvegarder localement ET dans Firebase (attention aux limites du plan gratuit)"
                                    checked={saveOption === 'both'}
                                    onChange={() => setSaveOption('both')}
                                />
                            </Form.Group>

                            <div className="alert alert-warning" role="alert">
                                <small>
                                    <strong>Important:</strong> Le plan gratuit de Firebase a une limite de 5GB de stockage.
                                    Les vidéos peuvent rapidement épuiser cette limite. Utilisez l'option cloud uniquement pour
                                    les vidéos importantes.
                                </small>
                            </div>

                            <p>Taille approximative: <strong>{recordedBlob ? (recordedBlob.size / (1024 * 1024)).toFixed(2) : '0'} MB</strong></p>                        </>
                    ) : (
                        <div>
                            <p className="mb-2">Sauvegarde en cours...</p>
                            <div className="progress mb-3">
                                <div
                                    className="progress-bar progress-bar-striped progress-bar-animated"
                                    role="progressbar"
                                    style={{ width: `${uploadProgress}%` }}
                                    aria-valuenow={uploadProgress}
                                    aria-valuemin="0"
                                    aria-valuemax="100"
                                >
                                    {uploadProgress}%
                                </div>
                            </div>
                            <p className="small text-muted">
                                Ne fermez pas cette fenêtre jusqu'à la fin de l'opération.
                            </p>
                        </div>
                    )}
                </Modal.Body>
                <Modal.Footer>
                    {!uploading && (
                        <>
                            <Button variant="secondary" onClick={() => setShowModal(false)}>
                                Annuler
                            </Button>
                            <Button variant="primary" onClick={saveVideo}>
                                Sauvegarder la vidéo
                            </Button>
                        </>
                    )}
                </Modal.Footer>
            </Modal>
        </div>
    );
}

export default ScreenRecorder;