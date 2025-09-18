# Application de Gestion de Colis avec Traçabilité Vidéo

Une application web moderne développée en React.js pour la gestion efficace des colis en résidence avec un système innovant d'enregistrement vidéo automatique.

## Aperçu du Projet

Cette application résout les problèmes de traçabilité rencontrés par les équipes de sécurité travaillant en rotation lors de la gestion des colis. Elle permet d'enregistrer, suivre et documenter chaque action avec une preuve vidéo automatique.

**Demo en ligne :** [https://securite-67440.web.app](https://securite-67440.web.app)

## Fonctionnalités Principales

### Gestion des Colis
- Enregistrement de nouveaux colis avec photo obligatoire
- Suivi en temps réel des colis en attente de remise
- Confirmation de remise avec preuve photographique
- Historique complet de tous les colis traités

### Innovation : Enregistrement Vidéo Automatique
- Capture d'écran automatique lors des actions importantes
- Nommage intelligent des fichiers avec métadonnées
- Sauvegarde locale avec historique cloud des informations
- Traçabilité complète des actions de chaque agent

### Interface Responsive
- Design mobile-first optimisé pour tablettes et smartphones
- Interface intuitive avec navigation simplifiée
- Feedback visuel en temps réel
- Gestion d'erreurs complète avec messages explicites

## Technologies Utilisées

### Frontend
- React.js avec hooks modernes (useState, useEffect, useRef)
- React Router pour la navigation SPA
- Bootstrap 5 + React Bootstrap pour l'interface
- MediaRecorder API pour l'enregistrement vidéo
- Browser Image Compression pour l'optimisation des images

### Backend & Déploiement
- Firebase Firestore pour la base de données NoSQL
- Firebase Hosting pour le déploiement
- Architecture serverless optimisée pour le plan gratuit

## Installation et Configuration

### Prérequis
- Node.js (version 14 ou supérieure)
- npm ou yarn
- Compte Firebase

### Installation

1. **Cloner le repository**
```bash
git clone https://github.com/MokhttaAr/gestions-colis.git
cd securite
```

2. **Installer les dépendances**
```bash
npm install
```

4. **Démarrer l'application en mode développement**
```bash
npm start
```

5. **Construire pour la production**
```bash
npm run build
```

6. **Déployer sur Firebase Hosting**
```bash
npm install -g firebase-tools
firebase login
firebase init hosting
firebase deploy
```

## Structure du Projet

```
securite/
├── public/
│   ├── index.html
│   ├── manifest.json
│   └── favicon.ico
├── src/
│   ├── components/
│   │   ├── AddPackage.js          # Ajout de nouveaux colis
│   │   ├── PendingPackages.js     # Gestion des colis en attente
│   │   ├── PackageHistory.js      # Historique des colis
│   │   ├── VideoHistory.js        # Historique des enregistrements
│   │   └── ScreenRecorder.js      # Système d'enregistrement vidéo
│   ├── App.js                     # Composant principal
│   ├── App.css                    # Styles globaux
│   ├── firebase.js                # Configuration Firebase
│   └── index.js                   # Point d'entrée
├── package.json
├── firebase.json
└── README.md
```

## Guide d'Utilisation

### Ajouter un Colis
1. Accédez à la page principale
2. Saisissez le nom du résident et le numéro d'unité
3. Prenez une photo du colis (obligatoire)
4. Cliquez sur "Enregistrer le colis"
5. Optionnel : Enregistrez une vidéo de l'action

### Remettre un Colis
1. Allez dans "Colis en attente"
2. Sélectionnez le colis à remettre
3. Prenez une photo de preuve de remise (obligatoire)
4. Confirmez la remise
5. Optionnel : Enregistrez une vidéo de la remise

### Consulter l'Historique
- **Historique des colis** : Tous les colis traités avec leurs statuts
- **Historique vidéo** : Métadonnées des enregistrements réalisés

## Fonctionnalités Avancées

### Système d'Enregistrement Vidéo
- Enregistrement automatique des actions critiques
- Nommage automatique avec date, heure et type d'action
- Sauvegarde locale des vidéos
- Stockage des métadonnées dans Firebase
- Interface simplifiée pour démarrer/arrêter

### Optimisations
- Compression automatique des images
- Interface responsive pour tous les appareils
- Gestion intelligente des erreurs
- Performance optimisée pour les connexions lentes

## Configuration Firebase

### Collections Firestore
1. **packages** : Stockage des informations des colis
2. **screenrecordings** : Métadonnées des enregistrements vidéo

### Règles de Sécurité Recommandées
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true;
    }
  }
}
```

### Structure des Documents

#### Collection "packages"
```javascript
{
  name: "string",           // Nom du résident
  unit: "string",           // Numéro d'unité
  date: "string",           // Date d'arrivée
  time: "string",           // Heure d'arrivée
  photoURL: "string",       // URL de la photo du colis
  received: "boolean",      // Statut de remise
  deliveryDate: "string",   // Date de remise
  deliveryTime: "string",   // Heure de remise
  deliveryPhotoURL: "string" // URL de la preuve de remise
}
```

#### Collection "screenrecordings"
```javascript
{
  nom: "string",           // Nom du résident
  unite: "string",         // Numéro d'unité
  type: "string",          // Type d'enregistrement
  dateHeure: "timestamp",  // Date et heure
  nomFichier: "string",    // Nom du fichier vidéo
  tailleMB: "string"       // Taille du fichier
}
```

## Déploiement

### Prérequis pour le Déploiement
- Compte Firebase avec projet configuré
- Firebase CLI installé
- Configuration des domaines personnalisés (optionnel)

### Étapes de Déploiement
1. Construction de l'application : `npm run build`
2. Configuration Firebase Hosting : `firebase init hosting`
3. Déploiement : `firebase deploy`
4. Vérification de l'URL de production

## Maintenance et Support

### Monitoring
- Surveillance des performances via Firebase Console
- Analyse des erreurs client
- Suivi de l'utilisation des quotas

### Mises à Jour
- Mises à jour de sécurité React
- Évolutions des dépendances
- Améliorations de l'interface utilisateur

### Support Technique
- Documentation complète dans le code
- Logs détaillés pour le débogage
- Interface d'administration intégrée

## Sécurité et Conformité

### Données Personnelles
- Stockage minimal des informations personnelles
- Photos stockées temporairement
- Respect des réglementations locales sur la vie privée

### Accès et Authentification
- Application accessible sans authentification pour faciliter l'utilisation
- Possibilité d'ajouter une authentification selon les besoins
- Contrôle d'accès basé sur les règles Firestore

## Performance et Optimisation

### Optimisations Implémentées
- Lazy loading des composants
- Compression automatique des images
- Pagination des données
- Cache intelligent des requêtes

### Métriques de Performance
- Temps de chargement initial < 3 secondes
- Interface réactive sur tous les appareils
- Fonctionnement optimal même avec connexion lente

## Contribution

### Standards de Code
- ESLint pour la cohérence du code
- Prettier pour le formatage
- Convention de nommage claire
- Documentation inline des fonctions complexes

### Process de Contribution
1. Fork du repository
2. Création d'une branche feature
3. Tests des modifications
4. Pull request avec description détaillée

## Licence

Ce projet est sous licence MIT - voir le fichier [LICENSE](LICENSE) pour plus de détails.

## Contact

Pour toute question ou suggestion concernant ce projet :
- **Email** : support@gestion-colis.com
- **Issues GitHub** : [Créer une issue](https://github.com/MokhttaAr/gestions-colis/issues)
- **Documentation** : Consultez le wiki du projet

---

**Version** : 1.0.0  
**Dernière mise à jour** : Septembre 2024  
**Développé avec** : React.js et Firebase