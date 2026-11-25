# Point de reprise — Assistant IA

Tests arrêtés à la demande de l’utilisateur le 25 novembre 2026. Reprendre sur `ai-assistant`, dans `/Users/HP/Desktop/pyramide-ai-assistant`. Le dossier `/Users/HP/Desktop/pyramide immobilier` contient l’autre branche `feature/social-publishing` : ne pas la modifier.

## Consigne actuelle

Une seule conversation persistante par utilisateur/profil, commune à la page Assistant IA et au chat flottant. Pas de liste d’historique, pas de bouton Nouveau, pas de remise à zéro à l’ouverture. Cette consigne remplace les anciennes demandes de cinq conversations et de nouvelles conversations automatiques. Les anciennes conversations ne sont pas supprimées. La mémoire est du contexte sauvegardé, pas un réentraînement du modèle.

L’utilisateur veut les tests visibles dans le navigateur, dans l’ordre de la campagne. Il a demandé d’arrêter pour aujourd’hui et de sauvegarder sur GitHub, sans PR ni message à Lotfi.

## Résultats acquis

Voir `assistant-validation.md` pour les cas détaillés.

- Parcours principaux gérant/agent/assistante testés sur données fictives : création, critères, matching d’agence, propositions et photos, visites, déplacement/annulation, retours et relances.
- Réattribution de visite à Amine : même visite, créneau vérifié, calendrier interne et notification. Google Calendar hors besoin actuel.
- Négociation de Lina/L-0000002 : ouverture → validation → démarrage clôture → dépôt fictif → clôture, directement depuis le chat, données persistées.
- Vente de Nadia/V-0000001 : 18 500 000 DA ; 1 % acheteur et 1 % vendeur, soit 370 000 DA au total. Historique des ventes et attribution Amine vérifiés précédemment.
- Phrase exacte de l’utilisateur « 3tini proposition pour +1 202 555 0112 » : Meriem et L-0000001 retrouvés. Suite « Prépare-lui un message pour ce bien » : bon dossier, photos et brouillon.
- Anglais : fiche et pronoms retestés. Changement Meriem → Nadia puis « elle » : pas de mélange de dossiers.
- Conversation unique : reprise après rechargement ; même contenu dans le chat flottant ; identifiant stable et isolation entre propriétaires vérifiés par test d’intégration Mongo.
- Amine : « Valide-la » reconnaît la négociation de Meriem et refuse l’approbation réservée au gérant.

## Étape 3 — droits : contrôles effectués et travail restant

Tests directs des routes de critères : gérant Nadia/Karim/Rania = 200 ; Amine Nadia = 200, Karim/Rania = 404 ; assistante Rania = 200, Nadia/Karim = 404. Sans connexion = 401. Création d’une relance par Amine sur Rania hors périmètre = 403.

Contrôles ajoutés à l’action native `openNegotiation` : rôle agent/gérant requis et client accessible. Tests natifs passés : Amine sur Karim = 403 ; assistante = 403 ; Amine sur bien déjà vendu = 409. Aucun dossier créé par ces tests de refus.

Contrôles ajoutés à `requestArchive` : rôles autorisés et propriétaire du client/bien. Tests natifs passés : client étranger pour Amine/assistante et bien étranger pour Amine = 404 ; aucune demande créée.

**À traiter avant de considérer l’étape 3 complète** :

- Rôle PHOTOGRAPHER absent des constantes/modèles de cette version. Aucun compte photographe testé ; ne pas annoncer ce rôle comme opérationnel.
- Les actions natives `toggleListingValidation`, `approveListingWithoutReference`, `setListingNeutre`, `unarchiveListing` ont été inspectées : elles vérifient l’authentification mais n’ont pas encore reçu le contrôle de rôle de gestion identifié pendant l’audit. La correction a été annoncée comme prochaine action mais n’a PAS été implémentée avant l’arrêt demandé.
- Continuer l’audit des mutations sensibles, sans supposer que le filtrage du chat protège les actions natives.

## Étape 4 — archivage et validation des nouveaux biens

Le chat a confondu « demander l’archivage » avec l’examen des demandes, puis BUY-00001 avec un bien. Corrections sauvegardées : intentions distinctes, action d’archivage des biens, résolution du type d’une référence via les données autorisées, et contrôle que la référence provient du message actuel.

**Retest du chat à reprendre** : « Demande l’archivage de BUY-00001, motif : dossier de simulation terminé. » La dernière tentative a été rejetée par Groq avant toute exécution (Retry-After 1158 secondes). Ne pas compter ce cas comme réussi. Vérifier ensuite dans Mongo qu’une seule demande PENDING est créée et que le client reste actif, puis tester refus et acceptation par le gérant. Pour les biens, vérifier séparément demande d’archivage et validation d’un nouveau bien. Les intentions de validation d’un nouveau bien ne sont pas encore reliées au chat.

## Suite de la campagne

5. Saisies : téléphone/prix, estimation, minimum de surface, étage, budget, source, titre automatique, Oran et notes.
6. Chiffres et périodes du gérant ; distinguer montants de transactions et commissions, vérifier les historiques.
7. Configuration IA : clés divulguées à remplacer, quota adapté, indisponibilités. Ne pas publier de clés.
8. Téléphone : clavier, défilement, conversation flottante, WhatsApp/SMS.
9. Livraison : données fictives à retirer seulement avant production, documentation, différences avec origin/main. Aucun PR demandé.

## Quotas et modèle

Modèle configuré par défaut : `openai/gpt-oss-120b` via Groq. Un contrôle des en-têtes du compte a confirmé 8 000 tokens/minute et 1 000 requêtes/jour. Limites gratuites publiées : 30 requêtes/minute et 200 000 tokens/jour. Respecter Retry-After ; ne pas contourner les limites par multiplication de clés. Les sorties structurées strictes sont utilisées pour les demandes courantes et l’extraction du créneau. Les créations complexes et certains rapports passent encore par un planificateur plus long.

## Environnement et données

- Lancer : `npm run dev:assistant` ; URL locale `http://localhost:3017/dashboard/assistant`.
- Mongo : port 27029, base `Pyramide-Immobilier`, données dans `.local-data/mongodb`.
- Sauvegarde manuelle : `npm run backup:assistant`.
- `.env.local` et `.local-data` restent privés et ignorés par Git.
- Les comptes de simulation sont `manager.local@pyramide.test`, `amine.benali@pyramide.test`, `sarah.mansouri@pyramide.test`, `assistant.local@pyramide.test`.
- Clients synthétiques réservés +1 202 555 01xx. Ne pas envoyer de messages réels. Photos de L-0000001 illustratives locales.
- Tests persistés : `node --test scripts/test-assistant-model.mjs` ; test Mongo avec `ASSISTANT_TEST_MONGODB_URI=mongodb://127.0.0.1:27029 node --test scripts/test-assistant-history.mjs`.
- ESLint ciblé passé. TypeScript des sources hors `.next` passé après les dernières modifications. Le contrôle standard rencontre un problème préexistant PageProps/searchParams dans les types Next générés de la page d’accueil.
