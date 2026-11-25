# Validation de la branche ai-assistant

Tests réalisés sur les données fictives locales, le 25 novembre 2026. Aucun message WhatsApp/SMS envoyé.

## Réattribution des visites

- Réservation non qualifiée par le gérant : créée dans son propre planning.
- Phrase visible « Change la visite donne la à Amine » : réattribution réussie, même visite, même client/bien/date/heure. Vérification Mongo : visite 6b06fc87909588daccfce710 et événement calendrier unique attribués à Amine.
- Visite de Lina du 27 novembre à 14 h vers Amine déjà occupé : refus explicite.
- Protection serveur : réattribution réservée aux profils de gestion de l’agence ; verrouillage des deux agents, contrôle du créneau de 30 minutes et mise à jour conditionnelle.
- Limite explicite : migration d’un événement déjà synchronisé dans un autre compte Google Calendar non implémentée. Transfert refusé sans modifier cette visite.

## Pipeline principale par rôle

| Parcours | Résultat observé |
| --- | --- |
| Gérant : création client et critères | BUY-00004 créé après demande du téléphone et de la source ; nom facultatif, Oran, budget et minimum de surface conservés |
| Gérant : matching, proposition, visite | Bien V-0000002 trouvé, message préparé, réservation personnelle par défaut, déplacement et annulation vérifiés |
| Gérant : retour et relance | Lina : intérêt/négociation du loyer, dossier mis à jour, relance à 24 h persistée |
| Gérant : négociation jusqu’à clôture depuis le chat | Lina/L-0000002 : ouverture, approbation, début de clôture, dépôt fictif de 10 000 DA du 24 novembre, clôture à 78 000 DA avec commission de simulation explicitement demandée à 100 % ; statut DEAL_DONE vérifié |
| Agent : vente | Nadia/V-0000001 clôturée lors de la campagne précédente : 18 500 000 DA, 1 % acheteur + 1 % vendeur, 370 000 DA au total ; historique vérifié |
| Agent : réservation/déplacement/annulation | Meriem/L-0000001 : nouveaux créneaux du 30 novembre, déplacement à 15 h ; annulation contextuelle du créneau du 27 novembre avec message client |
| Agent : retour contextuel et relance | « elle hésite à cause du quartier » : Meriem retrouvée, résultat indécis, relance à 48 h, sans nouveau rendez-vous |
| Assistante : matching/proposition | Rania retrouvée par téléphone ; catalogue partagé, L-0000001 compatible ; « ce bien » conservé, brouillons WhatsApp/SMS ; deux images locales illustratives visibles |
| Assistante : visite pour agent | Sarah le 30 novembre 10 h, même client/bien depuis la proposition, notification interne créée ; test antérieur Amine/30 minutes et conflit vérifiés |

Ces résultats couvrent les parcours principaux de l’étape 1, selon les fonctions autorisées de chaque rôle. Ils ne constituent pas un test exhaustif de toutes les formulations ou de tous les droits.

## Étape 2 : compréhension et mémoire — en cours

- Corrigé : sortie structurée stricte pour les suites de visite et l’extraction du nouvel horaire. La formulation de déplacement qui échouait a ensuite réussi sans clarification.
- Corrigé : une annulation contextuelle ne doit pas remplacer l’identifiant mémorisé par des champs inventés à partir de l’historique.
- Corrigé et testé : un retour client et une relance après une visite sont routés vers le suivi, et non vers une nouvelle réservation.
- Test anglais : « her » retrouve Meriem et le matching d’agence. Échec initial : fiche de critères rédigée en français malgré une question anglaise. Classificateur structuré renforcé ; retest en attente après le quota fournisseur (256 secondes observées).
- Une nouvelle phrase Darija et sa suite ont été demandées à l’utilisateur ; en attente de sa formulation.
- Limites temporaires Groq observées : saisie conservée, aucune opération exécutée lors du rejet ; reprise d’une réservation assistante réussie après expiration du délai.

## Suite de la campagne

La campagne complète reste en cours. À vérifier notamment : variantes et mémoire multilingue, refus côté serveur, demandes de validation, téléphone et configuration IA. Le rôle photographe reste à vérifier dans le modèle des rôles. Ne pas considérer les tests ci-dessus comme une validation complète du produit.

## Vérifications techniques

- ESLint ciblé : passé sur les fichiers modifiés.
- TypeScript des sources (hors `.next`) : passé. Le contrôle standard rencontre un problème préexistant de `PageProps/searchParams` dans les types générés de la page d’accueil.
- `node --test scripts/test-assistant-model.mjs` : 3 tests passés, sans réseau ni clé réelle. Contrôle du contrat strict, des réponses texte et du délai de quota sans renvoi prématuré.
- Les dates de dépôt correspondent à des dates de réception enregistrées ; aucun paiement n’est effectué par le chat.

## Changement de consigne : conversation unique par utilisateur/profil

Le 25 novembre, l’utilisateur a remplacé l’historique de cinq conversations par une conversation continue. La page et la fenêtre flottante partagent le même identifiant, sans liste d’historique ni bouton Nouveau. La dernière conversation existante devient la conversation continue ; les anciennes ne sont pas supprimées.

- Rechargement de la page : messages et dossier de Meriem conservés.
- Ouverture du chat flottant : mêmes messages visibles.
- « Valide-la » après ouverture de la négociation : dossier reconnu, refus de validation pour l’agent ; aucune approbation créée.
- Test d’intégration Mongo : un seul identifiant malgré six ouvertures concurrentes, nouveaux identifiants clients ignorés, contexte repris, profils isolés, contexte de visite invalidé lors d’un changement de client. Test passé sur des propriétaires temporaires, nettoyés ensuite.
- Chaque nouvel échange est aussi conservé dans `assistant_message_archive`. Le cache de travail reste limité aux 100 derniers échanges et les questions fournies à l’IA aux quatre dernières, avec identifiants structurés du dossier courant. Cela ne constitue pas un réentraînement du modèle ni une récupération sémantique de tous les anciens échanges.

### Étape 2 : résultats supplémentaires

- Phrase exacte fournie par l’utilisateur : « 3tini proposition pour +1 202 555 0112 » → Meriem, L-0000001.
- « Prépare-lui un message pour ce bien » → bon client/bien, photos, brouillon WhatsApp/SMS.
- Fiche anglaise retestée après format strict : labels anglais corrects.
- Passage explicite de Meriem à Nadia puis « pour elle » : budget de Nadia et matching de Nadia, sans mélange des dossiers.
- Avant la nouvelle consigne de conversation unique, une conversation neuve demandait correctement l’identité du client pour « elle », sans reprendre le dossier d’une autre conversation.
- Les lectures, propositions et actions de visite courantes utilisent désormais un classificateur structuré partagé, évitant les décisions concurrentes et un second gros appel IA.
