# QA finale — gérant — 27 novembre 2026

## Méthode

Environnement local `ai-assistant`, application 3017 et MongoDB 27029. Session HTTP gérant dédiée ; aucune prise de contrôle du navigateur partagé. Le compte MANAGER utilise le profil ADMIN et peut également être agent sur ses propres dossiers. Les actions natives et les lectures MongoDB ont été exécutées réellement. Les quatre demandes marquées « chat IA » passent par `/api/assistant`, une nouvelle conversation par demande, avec le fournisseur IA réellement configuré. Elles retournent toutes 200 dès le premier essai, `interpretation=ai` et `historySaved=true`.

Aucun message client ni email n’a été envoyé. Les demandes d’archivage techniques utilisent un demandeur ObjectId sans compte User ; les notifications internes sont donc vérifiables sans destinataire email. Aucun commit, push ou PR réalisé par cet agent.

## 1. Gérant qui agit aussi comme agent

Lectures exécutées sur la fonction réelle de rapport, avec plans structurés explicites, puis comparaison avec les documents MongoDB autorisés :

| Cas | Résultat au moment du contrôle |
| --- | --- |
| Mes clients | 6 dossiers attribués au gérant, aucun client d’un autre agent |
| Clients d’Amine | 6 dossiers attribués à Amine |
| Tous les clients de l’agence | 23 dossiers actifs, y compris les dossiers non attribués |
| Mes relances | 1 |
| Relances d’Amine | 4 |
| Relances de l’agence | 5 |
| Mes clients sans suivi depuis un mois | 1 |
| Clients d’Amine sans suivi depuis un mois | 1 |
| Clients de l’agence sans suivi depuis un mois | 2 |

Les ensembles des clients sont comparés par identifiants. Le calcul indépendant de l’inactivité combine le dernier contact enregistré, les suivis DONE hors contexte LISTING et les visites COMPLETED, avec exclusion des contacts futurs. Les deux dossiers positifs ont une création à 90 jours et leur dernier contact à 60 jours. Ces dates anciennes sont des dates de simulation explicitement posées en base, pas de vrais contacts historiques.

La fixture BUY-00010 a été créée par la véritable action `createClient`, puis explicitement attribuée au gérant par `updateClientAssignedAgent`. Une lecture personnelle par référence restitue le bon clientContextId. La création en profil administratif sans choix d’agent garde normalement le dossier non attribué ; l’attribution au gérant a été explicite dans ce test.

**Test chat IA réel :** « Donne-moi les clients de Amine Benali non suivis depuis un mois. » → BUY-00011, Amine Benali, dernier suivi du 28/09/2026, fenêtre du 27/10 au 27/11/2026. Le résultat porte uniquement sur le dossier attendu.

Les compteurs ci-dessus sont une photographie de la base avant l’archivage de BUY-00010 ; les créations et clôtures des autres agents de test ont fait évoluer les compteurs pendant la campagne.

## 2. Accepter/refuser les demandes client et bien

| Entité | Décision | Canal | Preuve |
| --- | --- | --- | --- |
| Client BUY-00010 | Refus de l’archivage | Chat IA réel | « Demande refusée : BUY-00010 reste actif. » ; demande REJECTED |
| Bien V-0000005 | Acceptation de l’archivage | Chat IA réel | « Demande acceptée : V-0000005 a été archivé. » ; demande APPROVED ; bien archived=true, isValidated=false et isPublished=false |
| Client BUY-00010 | Acceptation d’une nouvelle demande miroir | Action serveur native | 200 ; demande APPROVED ; archived=true, qualificationStatus=ARCHIVED |
| Second bien QAM27 | Refus de l’archivage | Action serveur native | 200 ; demande REJECTED ; bien archived=false |

Les quatre décisions sont persistées avec le gérant comme examinateur. Chacune génère exactement une notification interne, vérifiée en base. Répéter les deux décisions natives déjà traitées retourne 409 et ne crée pas une deuxième notification. Le client BUY-00010 est finalement archivé par la branche miroir exécutée après son refus initial ; ce n’est pas une contradiction entre les résultats intermédiaires.

Les demandes techniques ont été insérées comme fixtures PENDING directement dans MongoDB. Cette campagne teste leur examen et ses effets, pas la création de ces demandes par un agent, déjà couverte dans les campagnes précédentes.

## 3. Validation d’un nouveau bien distincte de l’archivage

Le bien « QAM27 Bien validation simulation » est créé par l’action native en estimation sans prix. Validation native par le gérant : 200, isValidated=true, référence générée **V-0000005**. Refus de validation natif : 200, isValidated=false et validationStatus=NEUTRAL, mais **archived=false**. Le prix reste absent et priceLabel=À estimer.

La demande d’archivage de ce bien n’est traitée qu’après ce contrôle de validation. Son acceptation dans le chat donne ensuite archived=true. La distinction entre les deux opérations est donc vérifiée en base.

## 4. Chiffres et périodes après les autres clôtures

Avant la nouvelle clôture du parcours agent : 2 affaires, 18 578 000 DA de transactions, 448 000 DA de commissions. Après sa clôture supplémentaire de 19 500 000 DA et 390 000 DA de commission :

| Indicateur | Chat IA de novembre 2026 | Tableau de bord et somme indépendante MongoDB |
| --- | --- | --- |
| Affaires clôturées | 3 | 3 |
| Transactions | 38 078 000 DA | 38 078 000 DA |
| Commissions enregistrées | 838 000 DA | 838 000 DA |
| Ventes | 2 ; 38 000 000 DA ; 760 000 DA de commissions | Concordant |
| Locations | 1 ; 78 000 DA ; 78 000 DA de commission | Concordant |

Demande réelle : « Compare les agents en novembre 2026 : ventes, locations, montants et commissions. »

Le chat distingue Amine (2 ventes, 38 M DA, 760 000 DA de commissions), le gérant (1 location, 78 000 DA et 78 000 DA de commission de simulation enregistrée) et Sarah (0 affaire). Les agrégats MongoDB utilisent uniquement les négociations DEAL_DONE et leurs montants de clôture ; les totaux mensuels vérifient les bornes du mois en heure d’Alger. Les montants du tableau de bord concordent avec ces agrégats, pas avec une constante fixée avant les clôtures.

Les tests natifs d’historique ont également été relancés avant la nouvelle clôture : octobre vide, période invalide refusée, vente d’un bien archivé retrouvée, gérant limité à sa propre location avec own=true et agent limité à ses propres affaires. La commission de la première vente d’Amine reste 1 % acheteur + 1 % vendeur. La commission locative de 78 000 DA est une valeur explicite déjà enregistrée dans la simulation ; elle ne définit pas une règle générale sur les locations.

## Fixtures et traces

- BUY-00010 : `6b0a0449ef09c20a12c30b69`, téléphone synthétique +12025550184, gérant ; finalement archivé.
- BUY-00011 : `6b0a04e9ef09c20a12c30d52`, téléphone synthétique +12025550186, Amine ; actif, dates de simulation anciennes.
- V-0000005 : `03c1cfaef22c0793d220abc3` ; finalement archivé.
- Second bien technique refus d’archivage : `9ecf0e7dabd9c4d7bf11daa9`, actif non validé.
- Vendeur synthétique téléphone +12025550185, créé via les actions CRM.
- Scripts temporaires : `/private/tmp/qa-gerant-final.py`, `qa-gerant-chat.py`, `qa-gerant-scope.cjs`, `qa-gerant-proof.cjs`.
- Réponses HTTP enregistrées : `/private/tmp/qa-gerant-chat-{reject,approve,inactive,finance}.json`.
- Fixture et résultats : `/private/tmp/qa-gerant-final-fixture.json`, `qa-gerant-final-decisions.json`, `qa-gerant-final-stats.json`.

Les scripts de mutation créent ou traitent des fixtures : ne pas les relancer sans vérifier leur état et l’unicité des téléphones. La lecture `qa-gerant-proof.cjs` dépend des fixtures de cette campagne. Ce rapport conserve les résultats utiles si les traces temporaires sont supprimées.

## Résultat et limites

Parcours gérant demandé validé sur cette matrice. Aucun défaut applicatif nouveau identifié, aucun fichier applicatif modifié par cet agent. Les variantes linguistiques infinies et toutes les pannes possibles ne sont pas garanties par ces tests. Les deux branches miroir sont testées nativement, pas chacune reformulée au modèle IA. La création des fixtures ne remplace pas les tests du parcours assistante/agent conduits en parallèle.
