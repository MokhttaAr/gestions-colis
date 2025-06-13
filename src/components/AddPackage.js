import { useState } from 'react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db, } from '../firebase';
import imageCompression from 'browser-image-compression';

function AddPackage() {
  const [name, setName] = useState('');
  const [unit, setUnit] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [photo, setPhoto] = useState(null);
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState(null);

  const handlePhotoChange = (e) => {
    if (e.target.files[0]) {
      const selectedFile = e.target.files[0];

      // Vérifier la taille maximale (4MB avant compression)
      if (selectedFile.size > 4 * 1024 * 1024) {
        alert('Image trop volumineuse. Maximum 4MB avant compression.');
        return;
      }

      // Vérifier le format de l'image
      const validFormats = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
      if (!validFormats.includes(selectedFile.type)) {
        // Format HEIC ou autre format non supporté
        alert('Format d\'image non supporté. Veuillez utiliser JPG, PNG, GIF ou WEBP.');
        return;
      }

      setPhoto(selectedFile);
      setPreview(URL.createObjectURL(selectedFile));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!name || !unit || !photo) {
      alert('Veuillez remplir tous les champs obligatoires');
      return;
    }

    setLoading(true);

    try {
      let photoURL = '';

      if (photo) {
        try {
          console.log("Début compression image:", photo.name, photo.size);

          // Options de compression plus agressives pour images volumineuses
          const options = {
            maxSizeMB: photo.size > 1024 * 1024 ? 0.6 : 0.8,  // Compression plus forte si > 1MB
            maxWidthOrHeight: 1000,
            useWebWorker: true,
            onProgress: (percent) => console.log(`Compression: ${percent}%`)
          };

          // Compression de l'image
          const compressedFile = await imageCompression(photo, options);
          console.log("Image compressée:", compressedFile.size, "octets");

          // Si l'image est encore trop volumineuse après compression
          if (compressedFile.size > 900 * 1024) {
            throw new Error("Image trop volumineuse même après compression");
          }

          // Conversion en Base64
          const reader = new FileReader();
          const photoBase64Promise = new Promise((resolve, reject) => {
            reader.onload = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(compressedFile);
          });

          photoURL = await photoBase64Promise;
          console.log("Conversion Base64 réussie, longueur:", photoURL.length);
        } catch (error) {
          console.error("Erreur traitement image:", error);
          alert(`Erreur lors du traitement de l'image: ${error.message}`);
          setLoading(false);
          return;
        }
      }

      // Ajouter le document avec l'image en Base64 si elle existe
      await addDoc(collection(db, 'packages'), {
        name,
        unit,
        date,
        photoURL,
        received: false,
        createdAt: serverTimestamp()
      });

      setName('');
      setUnit('');
      setDate(new Date().toISOString().split('T')[0]);
      setPhoto(null);
      setPreview(null);

      alert('Colis enregistré avec succès!');
    } catch (error) {
      console.error('Erreur lors de l\'enregistrement:', error);
      alert(`Erreur: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded shadow p-3 p-md-4">
      <h2 className="h4 fw-bold mb-4 text-center">Ajouter un nouveau colis</h2>

      <form onSubmit={handleSubmit} className="mx-auto" style={{ maxWidth: "600px" }}>
        {/* ...reste du formulaire inchangé... */}

        <div className="mb-3">
          <label className="form-label fw-bold" htmlFor="name">
            Nom du destinataire
          </label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="form-control"
            required
          />
        </div>

        <div className="mb-3">
          <label className="form-label fw-bold" htmlFor="unit">
            Numéro d'unité
          </label>
          <input
            id="unit"
            type="text"
            value={unit}
            onChange={(e) => setUnit(e.target.value)}
            className="form-control"
            required
          />
        </div>

        <div className="mb-3">
          <label className="form-label fw-bold" htmlFor="date">
            Date de réception
          </label>
          <input
            id="date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="form-control"
          />
        </div>

        <div className="mb-3">
          <label className="form-label fw-bold" htmlFor="photo">
            Photo du colis
          </label>
          <input
            id="photo"
            type="file"
            accept="image/*"
            onChange={handlePhotoChange}
            className="form-control"
            capture="environment"
          />
          {preview && (
            <div className="mt-2 text-center">
              <img src={preview} alt="Aperçu" className="img-fluid rounded" style={{ maxHeight: '200px' }} />
            </div>
          )}
        </div>

        <button
          type="submit"
          disabled={loading}
          className="btn btn-primary w-100"
        >
          {loading ? 'Enregistrement...' : 'Enregistrer le colis'}
        </button>
      </form>
    </div>
  );
}

export default AddPackage;