# Parcours assistante — 27 novembre 2026

Test réel via API `/api/assistant` authentifiée avec le compte de simulation assistante. Une conversation indépendante conserve le client et le bien tout au long du parcours : `0177d02d-8e9f-4f34-94ff-7fe84840bad7`. Aucun message externe envoyé.

| Étape | Demande | Résultat observé |
|---|---|---|
| Créer | « Ajoute une cliente acheteuse Samira QAfinal, téléphone +1 202 555 0181, F3 à Maraval Oran, budget maximum 20 millions DA, superficie minimum 80 m², étage maximum 4, ascenseur souhaité. Elle vient de Facebook. » | HTTP200, BUY-00008 créé. MongoDB confirme FACEBOOK, 80m² minimum, étage maximum4, 3pièces, budget20MDA, notes `- ascenseur souhaité`. |
| Chercher | « Trouve les biens disponibles de toute l’agence pour elle, en respectant son budget, sa superficie minimum et son étage maximum. » | HTTP200, V-0000002 à Maraval, 19MDA,85m², étage4. Bien validé appartenant au gérant Manager Local, donc recherche partagée et non limitée aux biens de l’assistante. |
| Proposer | « Prépare-lui une proposition pour ce bien avec les photos et le message WhatsApp ou SMS à vérifier avant envoi. » | HTTP200, bon client, bon bien, numéro exact, caractéristiques et brouillon français. Aucune photo retournée car ce bien de simulation n’a aucune image enregistrée; absence vérifiée en base, aucune image inventée. |
| Organiser | « Elle confirme ce bien. Organise la visite demain 28 novembre 2026 à 10h30 avec Amine Benali et prépare sa confirmation. » | HTTP200, visite confirmée, planning Amine et notification interne; brouillon client avec Samira, bien, samedi28novembre2026,10h30 heure d’Alger. |

## Preuves persistées

- Client `6b0a040def09c20a12c30af9`, créé par l’assistante, non assigné initialement.
- Bien `aafa401b48d3e1586ad9b105`, V-0000002, `isValidated=true`, `validationStatus=VALIDATED`, agent Manager Local `6b06af177659cc0a0b681d46`.
- Visite `6b0a0473ef09c20a12c30c92`, client et bien ci-dessus, agent Amine `6b06af187659cc0a0b681d48`, `SCHEDULED`, `2026-11-28T09:30:00Z` =10h30 Alger.
- Événement calendrier `6b0a0473ef09c20a12c30c9a`, même agent/client/bien,10h30–11h00Alger, `sourceType=VISIT` et `sourceId` correct.
- Notification interne `fa7f7ea3e0a08565356c9ef3`, destinataire Amine, `VISIT_SCHEDULED`, lien planning, référence visite correcte.

## Correction trouvée pendant la vérification

L’accueil comptait uniquement les clients assignés à l’utilisateur, alors que l’assistante peut créer des clients non assignés. `readAssistantBriefing` utilise désormais pour ce rôle le même périmètre que la lecture des clients : assignés à elle **ou** créés par elle. Les agents restent limités à leurs clients assignés; les rôles de gestion gardent le périmètre agence. Test reproductible `node scripts/test-assistant-briefing.mjs` :3périmètres passent. GET réel après correction retourne2clients pour l’assistante, dont Samira nouvellement créée. ESLint ciblé passe.

## Limites

- API réellement testée, pas de manipulation du navigateur partagé par cet agent; le parent pilote les tests visibles.
- Les photos ne peuvent pas être démontrées avec V-0000002 car sa collection images est vide. Les données publiques illustratives d’autres biens peuvent être utilisées pour le contrôle visuel.
- WhatsApp/SMS restent des brouillons à contrôler et envoyer manuellement, aucune transmission réalisée ici.

## Contrôle complémentaire photos et attribution

Lecture MongoDB de `users/6b06af177659cc0a0b681d46` : firstname=Manager, lastname=Local, role=MANAGER. L’attribution initiale « Sarah » dans ce rapport a été corrigée; le bien est celui du gérant, donc la recherche reste bien partagée.

Le bien de simulation L-0000001 contient déjà `/immo1.jpg` et `/immo2.jpg`, tous deux publics. Test ciblé du vrai helper `prepareVisitProposals` avec des modèles de lecture simulés, au format des images existantes : les deux photos publiques locales et une URLHTTPS publique sont retournées; une photo privée, une URLjavascript et une URLrelative de protocole sont exclues. Le filtre de biens validés reste présent. `node --test scripts/test-assistant-proposal-photos.mjs` passe. Aucun appel IA et aucune modification de photos métier.
