# Point de reprise — Assistant IA

Campagne reprise les 26 et 27 novembre 2026. Continuer sur `ai-assistant`, dans `/Users/HP/Desktop/pyramide-ai-assistant`. Le dossier `/Users/HP/Desktop/pyramide immobilier` contient l’autre branche `feature/social-publishing` : ne pas la modifier.

## Consigne actuelle

Plusieurs conversations avec historique (consigne finale du 27 novembre). Chaque ouverture du bouton flottant crée une nouvelle conversation avec l’accueil du rôle ; Agrandir ouvre cette même conversation. La page Assistant IA propose l’historique, Nouvelle conversation et la sélection d’un ancien échange. Chaque conversation garde son propre contexte. Titres courts par intention, une ligne ; appui long ou menu … pour renommer, épingler/désépingler et supprimer avec confirmation. Suppression logique, archives conservées, accès limité au propriétaire.

Notes privées demandées explicitement et rappels personnels ajoutés. Rappels : date/heure validée, notification CRM au polling de la cloche (60 secondes), pas de push lorsque le site est fermé. Ne jamais promettre une notification iPhone hors site sans intégration push. Mémoire = données enregistrées, pas réentraînement du modèle.

L’utilisateur veut les tests visibles dans le navigateur, dans l’ordre de la campagne. Les tests ont repris. Sauvegardes Git uniquement sur le dépôt personnel ikramtlh/pyramide-immobilier, sans PR ni message à Lotfi.

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
- Ces quatre actions natives sont maintenant réservées à la gestion ; quatre appels assistante retournent 403. Catalogue, détail par ID et relations vendeur filtrés côté serveur. Treize contrôles négatifs/positifs passent le 27 novembre.
- Continuer l’audit des mutations sensibles, sans supposer que le filtrage du chat protège les actions natives.

## Étape 4 — archivage et validation des nouveaux biens

Le chat a confondu « demander l’archivage » avec l’examen des demandes, puis BUY-00001 avec un bien. Corrections sauvegardées : intentions distinctes, action d’archivage des biens, résolution du type d’une référence via les données autorisées, et contrôle que la référence provient du message actuel.

Tests visibles passés : demande d’archivage BUY-00001 puis refus (client actif), acceptation BUY-00005 (archivé). Une course approbation/refus donne un seul gagnant et une seule notification. Voir qa-manager-2026-11-26.md.

Validation d’un nouveau bien testée le 27 dans le chat gérant : « Valide le bien QAS26 Estimation F5. » → V-0000003 ; puis « Refuse la validation de ce bien, il doit rester non validé. » → même bien NEUTRAL. Vérification Mongo : isValidated=false, surface250, étage11, priceLabel=À estimer, aucun prix inventé. Bien ID059b9d7ad1fe2ad154413f2e.

Tests visites natifs : propriétaire client contrôlé, lecture des visites étrangères filtrée, annulation étrangère403, doublon idempotent, chevauchement409, créneau adjacent30minutes accepté ; deux réservations concurrentes donnent201+409 avec une seule visite/calendrier.

Saisie : six contrôles portables passent, notamment noms facultatifs, source obligatoire et preuve, continuation préservant critères/notes, téléphone distinct du prix et ville explicite prioritaire.

Mobile simulé390×844 : page et flottant lisibles, même conversation récupérée, commandes fermer/agrandir accessibles ; vue normale restaurée. Clavier et ouverture WhatsApp/SMS sur téléphone physique restent à vérifier.

## Suite de la campagne

5. Saisies : contrôles portables et intake réel passés ; poursuivre les variantes multilingues. Alias de quartier Akid/Akid Lotfi limité à Oran, sans élargir budget, surface ni étage.
6. Chiffres et périodes du gérant vérifiés : voir qa-manager-2026-11-26.md. Limite à clarifier : certains compteurs intitulés ventes incluent les locations.
7. Configuration IA : clés divulguées à remplacer, quota adapté, indisponibilités. Ne pas publier de clés.
8. Téléphone : viewport et flottant vérifiés ; clavier et WhatsApp/SMS sur appareil physique restent à vérifier.
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

## Contrôles iPhone du 27 novembre

Recopie de l’iPhone utilisée avec autorisation. Safari atteint le CRM via l’adresse locale du Mac. Connexion assistante, création de Leila QA27 BUY-00007 (+12025550171), recherche contextuelle « pour elle » → V-0000002 Maraval85m²/19M, critères de saisie vérifiés en base. Visite demandée en darija pour28/11/2026à15h30avecAmine : confirmation affichée. Retest du message automatique pour l’assistante en cours ; ancien code le masquait pour ce profil, condition retirée. Aucun message externe envoyé vers les téléphones fictifs.

Flou/assombrissement derrière le flottant sur mobile et fermeture en touchant l’arrière-plan vérifiés sur vrai iPhone. Historique mobile repliable et nouvelle conversation affichés. L’icône flottante masquait l’envoi dans la page complète : espace réservé à droite du formulaire mobile ajouté.

Limites de test restantes : premier test darija de lecture client par téléphone a échoué malgré fiche existante ; ancrage du téléphone saisi ajouté, retest nécessaire. Un rapport financier non pris en charge s’affichait à tort comme vérifié : schéma analytics et indicateur d’échec corrigés, retest IA nécessaire. Anciennes réponses déjà enregistrées ne sont pas réécrites.

## Reprise du 27 novembre au soir

28 tests automatisés passent : modèle, saisies, quartiers, messages, analyses, commissions, mémoire, historique et rappels MongoDB isolés. TypeScript des sources hors .next et git diff --check passent.

Tests visibles : rappel personnel demandé dans une minute, confirmation heure d’Alger puis notification dans la cloche et toast effectivement reçus ; note « mon mot clé de simulation est Soleil » mémorisée puis retrouvée dans une nouvelle conversation. Le rappel exige le CRM ouvert ou une ouverture ultérieure ; aucune notification push iPhone site fermé.

Retest darija du gérant « chakhash hed client +1 202 555 0171 ? wach rahi t9alleb w ch7al budget ta3ha ? » réussi : Leila QA27 BUY-00007, Appartement F3 Maraval, budget maximum 20 000 000 DZD, minimum 80 m².

Complément iPhone : confirmation de visite pour l’assistante avec brouillon client vérifiée ; ouverture du composeur SMS contenant Leila, le bien, le 28 novembre et 15 h 30. Annulation du composeur, aucun envoi. Message personnel reformulé visible dans un brouillon WhatsApp, aucun envoi. Renommage et épinglage de « Visite Leila » vérifiés par appui long.

Comparaison financière réelle du gérant retestée avec succès : novembre 2026, 2 affaires, 18 578 000 DA de transactions, 448 000 DA de commissions ; ventilation ventes/locations par Amine, Manager Local et Sarah, y compris résultats nuls. Les commissions locatives correspondent aux valeurs de simulation enregistrées.

## Trois parcours finaux en parallèle — 27 novembre 2026

Assistante : BUY-00008, recherche contextuelle dans le catalogue partagé V-0000002 appartenant au gérant, proposition et visite Amine le28/11à10h30 ; client/source/critères, planning et notification vérifiés en base. Rapport qa-assistante-final-2026-11-27.md. Correction du compteur accueil : clients assignés OU créés pour le rôle ASSISTANT.

Agent : BUY-00009 / V-0000004, déplacement puis annulation dans la même conversation, brouillons client, retour intéressé + relance30/11à10h et clôture19.5MDA. Commission195kacheteur+195kvendeur=390k. Préconditions négociation/validation/dépôt testées par actions natives, mutations suivantes par chat. Premier essai clôture503 dû à un identifiant modèle invalide, deuxième réussi. Correction générale d’ancrage des identifiants et clarification JSON invalide avec3tests ciblés ; pas de seconde clôture complète après correctif. Rapport qa-agent-final-2026-11-27.md.

Gérant : ses clients/relances et accès équipe vérifiés, inactivité1mois avec fixtures positives, décisions d’archivage client/bien, validation distincte du bien et refus. Finances après clôture :3affaires38 078 000DA et838 000DA de commissions, concordance chat/dashboard/agrégat Mongo indépendant. Rapport qa-gerant-final-2026-11-27.md.

Contrôles finaux :9tests ciblés (dont saisies et modèle), TypeScript sources hors.next, ESLint3fichiersmodifiés et gitdiffcheck passent. Aucun message externe envoyé. Étape4 préparation PR/configuration non commencée dans ce lot.
