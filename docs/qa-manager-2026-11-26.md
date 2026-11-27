# Rapport QA — profil gérant — 26 novembre 2026

Rapport consolidé le 27 novembre à partir des résultats déjà obtenus. Aucun test n’a été relancé pour sa rédaction.

## Périmètre et méthode

- Branche : `ai-assistant` ; environnement local de simulation, port applicatif 3017, MongoDB local sur 27029.
- Session HTTP gérant isolée des autres profils et du navigateur contrôlé par le coordinateur.
- Comparaison des indicateurs du tableau de bord avec les affaires réellement enregistrées en base.
- Appels directs de la fonction réelle d’historique financier, sans appel au fournisseur IA.
- Vérification en lecture seule des décisions d’archivage effectuées visiblement par le coordinateur.
- Course concurrente sur une seule fixture technique jetable, séparée des dossiers de démonstration partagés.

Les identifiants ci-dessous concernent exclusivement des données fictives. Ce rapport ne contient aucune clé API ni aucun identifiant de connexion.

## 1. Indicateurs financiers : résultats conformes

| Contrôle | Résultat constaté |
| --- | --- |
| Affaires clôturées, toutes périodes | 2 : une vente et une location |
| Montant total des transactions enregistrées | 18 578 000 DA |
| Commissions enregistrées | 448 000 DA |
| Montant mensuel de novembre 2026 | 18 578 000 DA |
| Commissions de novembre 2026 | 448 000 DA |
| Vente attribuée à Amine | 18 500 000 DA |
| Commission de cette vente | 370 000 DA : 185 000 DA acheteur + 185 000 DA vendeur |
| Location attribuée au gérant | Montant final enregistré : 78 000 DA ; commission de simulation explicitement demandée : 78 000 DA |

Les totaux du tableau de bord correspondent aux sommes des négociations `DEAL_DONE`. Ils ne reprennent pas le prix affiché d’un bien comme preuve d’une vente. Les deux biens clôturés sont archivés et restent inclus dans les résultats financiers.

Références de preuve :

- Vente : négociation `6b06b727f3e3e1d1bf870413`, bien `V-0000001`, client `BUY-00001`, agent Amine.
- Location : négociation `6b06fd8d909588daccfce75f`, bien `L-0000002`, client `RENT-00002`, gérant.

Les compteurs d’inventaire et de clients ont évolué pendant les créations de fixtures des autres agents de test. Les vérifications financières ont conservé les mêmes résultats ; ces compteurs d’inventaire ne doivent pas être utilisés comme une photographie immuable de la base.

## 2. Historique et périodes : contrôles passés

| Demande testée directement sur la fonction d’historique | Résultat |
| --- | --- |
| Toutes les affaires, toutes périodes | 2 affaires, 18 578 000 DA, 448 000 DA de commissions |
| Amine, du 1er au 30 novembre 2026 inclus | 1 affaire, 18 500 000 DA, 370 000 DA de commissions |
| Du 1er au 31 octobre 2026 inclus | Aucune affaire ; montants à zéro |
| Qui a conclu le bien archivé `V-0000001` ? | Affaire retrouvée et attribuée à Amine |
| Affaires propres au gérant, réponse en anglais | Une location ; 78 000 DA et 78 000 DA de commission enregistrée |
| Période contenant le 31 février 2026 | Refus avec demande d’une période valide |

Ces tests vérifient la récupération des données et les filtres de période ; ils ne constituent pas un test de toutes les formulations possibles adressées au modèle IA.

## 3. Relances personnelles et périodes d’inactivité

Pour le 26 novembre, la fonction de préparation de journée a retourné :

- **1 relance personnelle** pour le gérant, conforme à la requête filtrée sur son identifiant d’agent ;
- **3 relances d’équipe** lorsque le périmètre équipe était explicitement demandé.

La conversion des périodes d’inactivité a également été vérifiée :

| Cas | Résultat |
| --- | --- |
| 31 mars 2026 moins un mois | 28 février 2026, heure conservée |
| 29 février 2024 moins un an | 28 février 2023, heure conservée |
| Date d’entrée 31 février | Erreur de date, sans calcul silencieux |

Il s’agit de contrôles des bornes calendaires et du périmètre des relances. Un jeu complet de clients anciens avec plusieurs contacts et visites reste utile pour une validation métier plus large du rapport d’inactivité.

## 4. Corrections de présentation vérifiées

Le seul fichier applicatif modifié par cet agent pendant cette mission était `app/api/dashboard/stats/route.ts`, sur attribution explicite du coordinateur :

- Un client sans nom/prénom est présenté par sa référence CRM ; `BUY-00004` n’apparaît plus comme « undefined undefined » dans l’activité.
- Une location clôturée est présentée comme **« Location conclue »**, au lieu de **« Vente réalisée »**.
- Les noms de clients dans les suivis et événements utilisent le même repli sur leur référence.
- Les montants financiers sont restés inchangés après la correction.

ESLint ciblé et contrôle du diff : passés au moment de la modification. Aucun nouveau contrôle technique n’a été exécuté pour rédiger ce rapport.

## 5. Demande d’archivage de BUY-00001 : vérifications des actions visibles

Demande : `6b08a9b436f9dd7612026d9c`.

Après la demande effectuée par l’agent dans le navigateur :

- exactement **une** demande `PENDING` était présente ;
- `BUY-00001` avait toujours `archived=false` ;
- motif enregistré : « dossier de simulation terminé. ».

Après le refus effectué par le gérant dans le navigateur :

- demande passée à `REJECTED` ;
- note : « je garde ce dossier » ;
- client toujours non archivé ;
- examen enregistré le 26 novembre 2026 à 21:52:01 UTC.

Ces constatations décrivent l’état au moment du test. Cet agent n’a pas traité la demande partagée et n’a pas modifié BUY-00001.

## 6. Course d’approbation/refus : contrôle atomique validé

Le coordinateur a ajouté un contrôle atomique `status=PENDING` dans les actions d’examen. Le test a ensuite utilisé les **vraies actions serveur HTTP**, avec deux sessions gérant distinctes et une barrière de départ simultané.

Fixture technique unique :

| Élément | Identifiant |
| --- | --- |
| Marqueur de fixture | `QAM26-CAS-12c952` |
| Client jetable | `6b08aad71e6332f5c312c952` |
| Demande d’archivage | `6b08aad71e6332f5c312c953` |
| Demandeur technique sans compte utilisateur | `6b08aad71e6332f5c312c954` |

Résultats de cette course :

| Action | Résultat métier | Durée constatée |
| --- | --- | --- |
| Approuver | Échec, statut 409 : demande déjà traitée | 0,087 s |
| Refuser | Succès, statut 200 | 0,140 s |

État final vérifié en base :

- demande `REJECTED` ;
- client `archived=false` ;
- examinateur : gérant, identifiant `6b06af177659cc0a0b681d46` ;
- une seule notification interne ;
- aucun compte utilisateur correspondant au demandeur technique, donc aucun destinataire email.

Le test établit **un seul gagnant et un seul conflit**, avec cohérence entre la décision et l’entité. Il couvre une course où le refus gagne. Il ne remplace pas un test de toutes les défaillances possibles, notamment la panne de base entre les étapes et la branche de restauration après échec d’archivage.

La fixture a été laissée disponible pour inspection après le test ; son existence actuelle n’a pas été revérifiée pour ce rapport. Aucune donnée métier partagée n’a été changée par ce test.

## 7. Limites et suite

- Les compteurs nommés `soldListings` et `salesCount` comptent actuellement les affaires clôturées, **locations comprises**. Leur sémantique n’a pas été changée par cet agent ; éviter de présenter leur total comme un nombre de ventes seules.
- Le détail de vente ancien `V-0000001` repose encore sur les documents liés lorsqu’un instantané historique n’est pas présent. L’archivage est bien géré ; ce test ne couvre pas une suppression définitive de ces documents.
- La validation d’un nouveau bien doit rester séparée de l’acceptation/refus d’une demande d’archivage. Les parcours de validation de biens sont poursuivis par le coordinateur ; ce rapport ne les annonce pas comme terminés.
- Les tests sur téléphone, le clavier, le défilement et les ouvertures WhatsApp/SMS restent à poursuivre.
- Le rôle photographe n’a pas été testé dans cette mission.
- Aucun message client réel, aucun appel IA, aucune PR, aucun commit et aucun push n’ont été effectués par cet agent pour ces contrôles.

## Traces techniques temporaires

Traces produites pendant la séance, utiles tant qu’elles existent sur le poste :

- `/private/tmp/qa-manager-26.py`
- `/private/tmp/qa-manager-26-stats.json`
- `/private/tmp/qa-manager-26-stats-after.json`
- `/private/tmp/qa-manager-history-26.cjs`
- `/private/tmp/qa-manager-cas-26.py`
- `/private/tmp/qa-manager-cas-26-fixture.json`
- `/private/tmp/qa-manager-cas-26-results.json`
- `/private/tmp/qa-manager-cas-26-proof.json`

Ce rapport conserve les résultats utiles indépendamment du nettoyage éventuel de ces fichiers temporaires.
