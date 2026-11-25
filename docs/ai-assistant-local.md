# Assistant CRM : environnement local

Branche : `ai-assistant`. Les commits sont locaux ; aucun push ni PR n'est nécessaire pour lancer les tests.

## Démarrage

Depuis le dossier de cette branche :

```sh
npm run dev:assistant
```

Cette commande lance la base MongoDB locale sur le port 27029 si elle n'est pas déjà démarrée, puis le CRM sur le port 3017. Elle utilise Webpack, compatible avec le lien local vers les dépendances du projet. Le serveur web est accessible sur le Wi-Fi local, comme autorisé pour le test sur téléphone.

La configuration privée reste dans `.env.local` (non versionnée), avec `MONGODB_URI=mongodb://127.0.0.1:27029`, les secrets d'authentification et la clé du fournisseur IA. Ne pas ajouter de clé API dans Git.

## Conservation des données

Les fichiers MongoDB sont dans `.local-data/mongodb`, hors de `/tmp` et ignorés par Git. Les transactions clôturées restent dans les négociations, avec leur date de clôture, prix final, commissions et liens vers le bien, le client et l'agent. Une copie des références et noms est conservée à la clôture pour garder le contexte historique. L'archivage d'un bien ne supprime pas ces transactions.

La limite de cinq conversations ne limite pas l'historique métier des ventes.

Pour créer une sauvegarde locale complète de la base :

```sh
npm run backup:assistant
```

Les sauvegardes EJSON conservent les types MongoDB et sont écrites dans `.local-data/backups`. Elles contiennent les données du CRM et ne doivent pas être publiées. Il s'agit de sauvegardes locales manuelles, pas d'un service de sauvegarde distant ou automatique.

## Exemples de questions

- Quelles ventes Amine a-t-il conclues en novembre 2026 ?
- Qui a vendu V-0000001 ?
- Quelles commissions Amine a-t-il générées en novembre 2026 ?

Le gérant peut consulter toutes les affaires ; un agent consulte ses propres affaires. L'assistante n'a pas accès aux résultats financiers.

Pour une vente, la règle de l'agence est de 1 % côté acheteur et 1 % côté vendeur : 2 % au total. La simulation à 18 500 000 DA donne 185 000 DA par côté, soit 370 000 DA pour l'agence. Aucune règle de commission locative nouvelle n'est déduite de cette règle de vente.
