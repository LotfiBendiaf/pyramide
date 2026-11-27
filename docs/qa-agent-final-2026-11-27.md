# Vérification finale du parcours agent — 27 novembre 2026

Périmètre : compte fictif Amine Benali, branche `ai-assistant`. Aucun SMS ni WhatsApp envoyé. Les étapes financières sont des écritures de simulation, sans paiement réel.

## Dossiers réservés

- Nora QAfinal : `BUY-00009`, téléphone synthétique `+1 202 555 0182`, ID `6b0a0414ef09c20a12c30b09`.
- Appartement F3 QA Agent final Maraval : `V-0000004`, 90 m², 2e étage, ID `946498e3bb687b660ca0f0e9`. Bien dédié pour ne pas clôturer un catalogue partagé par les autres tests.
- Conversation : `abd24feb-0cd0-4dc9-98e5-4ca38e0bccff`.

## Contrôles natifs, préconditions

Création du client par l’action CRM : 201, affecté à Amine, budget maximum 21 millions DZD, surface minimum 80 m², F3, étage maximum 4, source DIRECT_CALL. Création du bien puis validation gérant : référence V-0000004, validationStatus VALIDATED.

Deux visites : future le 28 novembre à 12 h 30 et passée fictive le 27 novembre à 10 h, chacune avec son événement de planning. Retour intéressé de la visite passée enregistré. Négociation créée en PENDING_VERIFICATION. Tentative de validation par Amine : 403 ; validation par le gérant : 200. Démarrage de clôture et enregistrement d’un dépôt fictif de 1 million DZD : 200, état CLOSING_FINALISATION.

Ces préconditions sont natives ; elles ne sont pas présentées comme une chaîne intégralement exécutée par le modèle.

## Parcours réel dans la même conversation IA

| Demande | Résultat vérifié |
|---|---|
| « Décale la visite du client +1 202 555 0182 avec V-0000004 du 28 novembre à 12h30 au même jour à 13h00. » | Même visite `6b0a0453ef09c20a12c30b90`, horaire 28/11 13 h Alger, événement déplacé à 12 h UTC. Brouillon client avec Nora, bien et nouvel horaire. |
| « Annule cette visite et prépare le message pour elle. » | Même visite CANCELLED ; événement de planning DELETED. Brouillon à son téléphone, bon bien, 28/11 à 13 h. Aucun envoi. |
| « Elle a apprécié la visite du 27 novembre pour V-0000004 et souhaite négocier le prix. Enregistre son retour intéressé et programme une relance le 30 novembre 2026 à 10h00. » | Résolution du même client et de sa visite passée, distincte de la visite annulée. Visite `6b0a0453ef09c20a12c30bbd` COMPLETED, outcome INTERESTED et note fidèle. Relance PENDING `ae3aa52b87cece4f230ccb12` au 30/11 09 h UTC = 10 h Alger, événement FOLLOWUP correspondant. |
| « Clôture son affaire pour V-0000004 au prix final de 19 500 000 DA. » | Après un premier échec d’extraction décrit ci-dessous, nouvelle tentative réussie. Négociation `6b0a045aef09c20a12c30c08` DEAL_DONE, finalPrice 19 500 000 ; acheteur 1 % = 195 000 ; vendeur 1 % = 195 000 ; total 390 000 DZD. V4 Vendu/SOLD et BUY9 CLOSED, vérifiés directement en base. |

## Défaut découvert et correction

Le second appel d’extraction IA de la clôture a fourni un negotiationId qui ne respectait pas le format ObjectId. La validation Zod provoquait un 503 générique. Aucun changement de données n’a eu lieu lors de cet échec ; le second essai a réussi.

Correction générale : les identifiants de négociation issus du modèle sont ignorés lorsqu’ils ne sont pas des ObjectId valides ou ne figurent pas explicitement comme un identifiant complet dans le dernier message utilisateur. Le serveur résout alors l’affaire à partir du client, du bien et du contexte autorisés. Les valeurs financières et dates restent strictement validées. Un JSON d’extraction malformé produit une demande de précision sans exécuter l’action.

Trois tests de non-régression passent : identifiants malformés ou inventés, identifiant explicitement fourni, conservation de la validation stricte des nombres et dates. ESLint ciblé passe. Le parcours complet de clôture n’a pas été rejoué sur une seconde affaire après ce correctif ; la correction est vérifiée par ces tests ciblés.

## Preuves locales et limites

Scripts reproductibles et sorties détaillées dans `/private/tmp/qa-agent-final*.py` et `/private/tmp/qa-agent-final*.json`. Ces scripts utilisent uniquement les comptes et dossiers de simulation ; les étapes natives effectuent des écritures, ne pas les relancer sans tenir compte des fixtures existantes.

Un 503 temporaire quota de 6 secondes a été rencontré avant le déplacement, puis la relance a réussi. Les appels IA ont été séquencés entre profils ; les tests natifs ont tourné en parallèle. Aucune promesse d’absence de quota ni de couverture de toutes les formulations possibles.
