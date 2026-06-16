# Flowbo

Un tableau Kanban simple et élégant construit avec **React**, **Vite** et **@dnd-kit**.

L'application est entièrement fonctionnelle avec des tests unitaires et des tests d'intégration.

## Démarrage

### Prérequis

- [Node.js](https://nodejs.org/) (v18 ou supérieur)
- npm (inclus avec Node.js)

### Installation

```bash
npm install
```

### Développement

```bash
npm run dev
```

Ouvre l'application sur [http://localhost:5173](http://localhost:5173) (ou le port indiqué par Vite).

### Build de production

```bash
npm run build
```

Les fichiers prêts pour la production seront dans le dossier `dist/`.

Vous pouvez ensuite prévisualiser le build avec :

```bash
npm run preview
```

## Linting

Pour vérifier la qualité du code via ESLint :

```bash
npm run lint
```

## Lancer les tests

Ce projet utilise **Vitest** et contient deux types de tests :

### Tests unitaires uniquement

```bash
npm run test:unit
```

### Tests d'intégration uniquement

```bash
npm run test:integration
```

### Couverture de code

Pour générer un rapport de couverture de code :

```bash
npm run test:coverage
```

## CI/CD

Le pipeline est défini dans `.github/workflows/node.js.yml` et se déclenche sur chaque **push** et **pull request** vers `main`.

### Intégration Continue (CI)

Les jobs s'exécutent dans l'ordre suivant :

1. **`secret-scan`** — Analyse l'historique Git avec [Gitleaks](https://github.com/gitleaks/gitleaks) pour détecter d'éventuelles fuites de secrets (clés API, tokens…). C'est le point d'entrée du pipeline : tous les autres jobs en dépendent.

2. **`sast`** _(dépend de `secret-scan`)_ — Analyse statique du code avec [Semgrep](https://semgrep.dev/) sur les règles `javascript`, `react` et `owasp-top-ten`.

3. **`sca`** _(dépend de `secret-scan`)_ — Audit des dépendances avec `npm audit --audit-level=high`. Bloque si une vulnérabilité de sévérité haute ou critique est détectée.

4. **`build`** _(dépend de `secret-scan`, `sast`, `sca`)_ — Exécuté en matrice sur **Node.js 20.x et 22.x** :
   - `npm run build` — compilation TypeScript + bundle Vite
   - `npm run lint` — vérification ESLint (zéro warning toléré)
   - `npm run test:unit` — tests unitaires
   - `npm run test:integration` — tests d'intégration
   - `npm run test:coverage` — couverture de code (seuil minimum : 85 % par fichier)
   - Upload du rapport de couverture en artifact GitHub (rétention : 7 jours)

### Déploiement Continu (CD)

5. **`deploy`** _(dépend de tous les jobs CI, push sur `main` uniquement)_ — Déploie l'application sur **Netlify** :
   ```bash
   npm run build
   npx netlify deploy --prod --dir=dist
   ```
   Les credentials sont stockés dans les **GitHub Secrets** du dépôt :
   - `NETLIFY_AUTH_TOKEN` — jeton d'authentification Netlify
   - `NETLIFY_SITE_ID` — identifiant du site cible

   > Le déploiement n'est **pas** déclenché sur les pull requests, uniquement sur les pushs directs vers `main`.

## Évolutivité

### Décisions d'architecture

**Composants React isolés et typés**
Chaque composant (`KanbanBoard`, `Column`, `Card`, `AddCard`) ne communique que via ses props, définies par une interface TypeScript explicite. L'état global (colonnes, tâches) est centralisé dans `KanbanBoard` et transmis vers le bas — ce qui facilite l'extraction future vers un store (Zustand, Redux) sans modifier les composants enfants.

**Types partagés dans `src/types.ts`**
Les types `Id`, `Column` et `Task` sont définis une seule fois. Ajouter un champ à une tâche (ex. : priorité, date d'échéance) ne demande de modifier que ce fichier ; TypeScript remonte ensuite tous les endroits à mettre à jour.

**Glisser-déposer via `@dnd-kit`**
`@dnd-kit` a été choisi pour gérer le drag and drop des cards. La logique DnD est entièrement contenue dans `KanbanBoard` ; les composants `Column` et `Card` n'exposent que les refs et handlers fournis par les hooks `useDroppable` / `useSortable`.

**Pipeline CI séquentiel avec barrières de sécurité**
Les jobs de sécurité (`secret-scan`, `sast`, `sca`) bloquent le job `build` via `needs`. Cette dépendance explicite garantit qu'aucun artefact n'est produit ni déployé si une vulnérabilité est détectée, même en cas d'exécution partielle du workflow.

**Couverture par fichier (`perFile: true`)**
Le seuil de 85 % s'applique à chaque fichier individuellement, pas à la moyenne globale. Cela évite qu'un fichier très couvert masque un fichier non testé.

---

### Ajouter une étape au pipeline

1. **Ouvrir** `.github/workflows/node.js.yml`.

2. **Déclarer le nouveau job** en suivant ce modèle :
   ```yaml
   mon-nouveau-job:
     name: Description courte
     runs-on: ubuntu-latest
     needs: [secret-scan]   # jobs dont celui-ci dépend
     steps:
       - uses: actions/checkout@v4
       - name: Mon étape
         run: echo "commande ici"
   ```

3. **Brancher le job `build`** sur le nouveau job si nécessaire :
   ```yaml
   build:
     needs: [secret-scan, sast, sca, mon-nouveau-job]
   ```

4. **Règles à respecter :**
   - Tout job touchant à la sécurité doit être listé dans `needs` du job `build`.
   - Le job `deploy` ne doit dépendre que de `build` (et transitivement des jobs de sécurité).
   - Ne jamais stocker de secrets en clair dans le YAML ; utiliser `${{ secrets.NOM_DU_SECRET }}`.
   - Tester le workflow sur une branche de feature avant de merger sur `main`.

---

### Guide de contribution

#### 1. Préparer son environnement
```bash
git clone <url-du-dépôt>
cd Evaluation_Bloc3
npm install
```

#### 2. Créer une branche
Nommer la branche selon la convention :
```
feat/<description>      # nouvelle fonctionnalité
fix/<description>       # correction de bug
ci/<description>        # modification du pipeline
chore/<description>     # maintenance (dépendances, config)
```

#### 3. Développer et tester localement
Avant tout commit, vérifier que les quatre commandes suivantes passent sans erreur :
```bash
npm run lint
npm run test:unit
npm run test:integration
npm run test:coverage
```

#### 4. Commiter avec le format Conventional Commits
```
type(scope): description courte

# Exemples :
feat(card): ajouter la suppression d'une carte
fix(kanban): corriger le déplacement entre colonnes vides
ci: ajouter un job de lint dédié
```

#### 5. Ouvrir une Pull Request vers `main`
La PR doit préciser :
- **Ce qui a été fait** et pourquoi
- **Comment tester** la fonctionnalité ou le correctif
- **Impact éventuel** sur les tests ou le pipeline

La CI s'exécute automatiquement. La PR ne peut pas être mergée tant que tous les jobs sont verts.

#### 6. Ajouter un nouveau composant
- Créer le fichier dans `src/components/NomComposant.tsx`
- Déclarer une `interface Props` explicite
- Créer le fichier de test correspondant dans `tests/NomComposant.unit.test.tsx`
- S'assurer que la couverture du nouveau fichier atteint 85 % (lignes, fonctions, branches, instructions)
