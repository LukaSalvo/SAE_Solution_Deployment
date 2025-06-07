# SAE_Solution_Deployment

Projet de collecte vocale permettant d'enregistrer des phrases audio via une interface web et de les stocker sur un serveur backend Flask. Ce projet comprend un frontend statique (HTML, CSS, JavaScript) et un backend Python, déployable avec Docker.

## Table des matières
- [Description](#description)
- [Prérequis](#prérequis)
- [Structure du projet](#structure-du-projet)
- [Installation](#installation)
- [Exécution](#exécution)
- [Utilisation](#utilisation)
- [Contribuer](#contribuer)

## Description
Ce projet est une application web pour la collecte de données vocales. Les utilisateurs peuvent :
- Saisir leurs informations (âge, genre, consentement).
- Enregistrer un nombre défini de phrases prédéfinies.
- Envoyer les enregistrements audio au serveur backend pour stockage.
Le backend Flask gère les téléchargements et enregistre les métadonnées dans un fichier journal.

## Prérequis
- Docker et Docker Compose installés.
- Un environnement avec accès à Internet pour récupérer les images Docker.
- Un navigateur web moderne (Chrome, Firefox, etc.) pour tester l'interface.

## Structure du projet
```
SAE_Solution_Deployment/
├── backend/
│   ├── app.py         # Backend Flask pour gérer les téléchargements
│   └── Dockerfile     # Configuration Docker pour le backend
├── frontend/
│   ├── app.js         # Logique JavaScript pour l'enregistrement audio
│   ├── index.html     # Interface utilisateur
│   ├── style.css      # Styles CSS
│   └── Dockerfile     # Configuration Docker pour le frontend
├── docker-compose.yml # Orchestration des services Docker
├── recordings/        # Répertoire pour stocker les enregistrements
└── README.md          # Ce fichier
```

## Installation
1. Clonez le dépôt :
   ```bash
   git clone git@github.com:LukaSalvo/SAE_Solution_Deployment.git
   cd SAE_Solution_Deployment
   ```
2. Assurez-vous que Docker et Docker Compose sont installés :
   - Vérifiez avec `docker --version` et `docker compose --version`.

## Exécution
1. Lancez les services avec Docker Compose :
   ```bash
   docker compose up --build
   ```
   ou avec :
   ```bash
   docker compose up --build
   ```
   pour avoir la main

2. Accédez à l'application :
   - Frontend : http://localhost:8082
   - Backend (pour les API) : http://localhost:8080 (utilisé par le frontend)

3. Pour arrêter les services :
   ```bash
   docker compose down
   ```



## Utilisation
1. Ouvrez http://localhost:8082 dans votre navigateur.
2. Remplissez le formulaire avec votre âge, genre, nombre de phrases, et cochez le consentement.
3. Cliquez sur "Commencer" pour passer à l'enregistrement.
4. Utilisez les boutons "Démarrer", "Arrêter", "Réenregistrer" et "Envoyer" pour gérer les enregistrements.
5. Terminez la session avec "Terminer" ou continuez pour une nouvelle session.

## Contribuer
1. Forkez le dépôt.
2. Créez une branche pour vos modifications :
   ```bash
   git checkout -b nouvelle-fonctionnalite
   ```
3. Effectuez vos modifications et testez localement.
4. Soumettez une pull request avec une description claire.

