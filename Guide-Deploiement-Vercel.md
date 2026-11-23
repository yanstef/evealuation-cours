# Guide de déploiement — Application d'évaluation de cours

## Fonctionnement

- **Étudiants** : connexion par nom + prénom, une seule tentative, correction immédiate (QCM par code, questions ouvertes par Claude), note et feedback affichés.
- **Enseignant** (`/admin`) : mot de passe, import Excel/CSV, activation d'une évaluation, résultats, export CSV.
- **Stack** : Next.js, Neon Postgres, API Claude. Les tables se créent automatiquement au premier appel.

## Format du fichier de questions

Modèle fourni : `templates/Modele-Questions.xlsx`.

| Colonne | Contenu |
|---|---|
| `type` | `qcm` ou `ouverte` |
| `question` | Énoncé |
| `option_a` … `option_f` | Choix (QCM) |
| `reponse_correcte` | Lettre(s) : `B` ou `A,C` (plusieurs bonnes réponses = cases à cocher, tout ou rien) |
| `reponse_attendue` | Corrigé / barème pour le LLM (questions ouvertes) |
| `points` | Points de la question |

## Déploiement (≈ 10 min)

1. **GitHub** : créer un dépôt privé et y pousser le dossier du projet.
2. **Vercel** : *Add New → Project* → importer le dépôt (framework Next.js détecté).
3. **Base de données** : dans le projet Vercel, onglet *Storage* → *Neon* (Marketplace) → connecter. `DATABASE_URL` est injectée automatiquement.
4. **Variables d'environnement** (*Settings → Environment Variables*) :
   - `ANTHROPIC_API_KEY` : clé créée sur console.anthropic.com
   - `ADMIN_PASSWORD` : mot de passe enseignant
   - `SESSION_SECRET` : chaîne aléatoire 32+ caractères (`openssl rand -base64 32`)
   - `ANTHROPIC_MODEL` (optionnel, défaut `claude-sonnet-5-5`)
5. **Deploy**, puis ouvrir `https://votre-projet.vercel.app/admin`.

Ou en ligne de commande : `npm i -g vercel && vercel` puis `vercel --prod`.

## Utilisation

1. `/admin` → saisir le mot de passe → charger le fichier + titre → **Importer**.
2. Cliquer **Activer** (une seule évaluation active à la fois).
3. Donner l'URL racine aux étudiants.
4. Suivre les résultats dans `/admin` → **Résultats** → **Exporter en CSV** (colonne « Note /20 » incluse).

## Points d'attention

- **Identité sans mot de passe** : n'importe qui peut saisir le nom d'un camarade. Pour un examen noté, surveillez la session ou ajoutez un code d'accès.
- **Anti-triche** : les bonnes réponses ne quittent jamais le serveur ; les QCM ne montrent pas la solution après correction (évite le partage entre étudiants).
- **Injection de prompt** : les réponses étudiantes sont traitées comme des données et les notes sont plafonnées au barème.
- **Panne du LLM** : la soumission est enregistrée, la réponse ouverte reste à 0 et signalée « À corriger » dans `/admin`.
- **Coût** : un appel Claude par soumission (toutes les questions ouvertes dans un seul appel).
- **Doublons** : « Dupont Jean » et « DUPONT jean » (accents/casse ignorés) comptent pour le même étudiant.
