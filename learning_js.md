# Learning JavaScript/React Commands Guide

This document explains all the commands used during the OAuth implementation session. Each command is documented with what it does and why we use it.

## Table of Contents
1. [NPM Setup Commands](#npm-setup-commands)
2. [Development Commands](#development-commands)
3. [Testing Commands](#testing-commands)
4. [Building Commands](#building-commands)
5. [Git Commands](#git-commands)
6. [Key Concepts](#key-concepts)

---

## NPM Setup Commands

### `npm install`
**What it does:** Installs all dependencies listed in `package.json` into the `node_modules/` folder.

```bash
npm install
```

**When to use:** Run this when:
- You first clone the project
- You add a new dependency using `npm install <package-name>`
- The `node_modules/` folder is missing

**Example output:** 
```
added 542 packages, and audited 525 packages in 24s
```

---

### `npm install <package-name>`
**What it does:** Installs a single package AND adds it to `package.json` so others know it's needed.

**Types of dependencies:**

#### Runtime dependency (needed by the app when it runs)
```bash
npm install @react-oauth/google
```
- The app needs this library to work
- Added to `"dependencies"` in `package.json`
- Installed with your app in production

#### Development dependency (only needed while coding)
```bash
npm install --save-dev vite @vitejs/plugin-react
```
- Only developers need these (for building, testing)
- NOT included when your app runs in production
- Added to `"devDependencies"` in `package.json`
- The `--save-dev` flag (or `-D`) tells npm this is for development only

**In our session:**
- `npm install react react-dom` → Runtime (the app needs React)
- `npm install --save-dev jest @testing-library/react` → Development (only for testing)
- `npm install --save-dev vite @vitejs/plugin-react` → Development (only for building)
- `npm install @react-oauth/google` → Runtime (the app uses Google OAuth)

---

## Development Commands

### `npm run dev`
**What it does:** Starts a local development server. You can see your app in the browser and it automatically reloads when you change code.

```bash
npm run dev
```

**What happens:**
1. Vite starts a server (usually at `http://localhost:5173`)
2. Your React app loads in the browser
3. Every time you save a file, the browser updates automatically (hot reload)
4. Shows errors in the browser console if something breaks

**When to use:** Use this whenever you're actively developing. Run it and keep it running.

**To stop it:** Press `Ctrl+C` in the terminal

---

### `npm run build`
**What it does:** Creates a production-ready version of your app. Takes your React code and converts it into optimized JavaScript that browsers can download quickly.

```bash
npm run build
```

**What happens:**
1. All your code gets bundled into a few small files
2. Code is minified (unnecessary spaces/names removed to make it smaller)
3. Output goes to the `dist/` folder
4. The app is ready to deploy to a web server

**When to use:** 
- Before deploying to production
- To check if your app builds without errors
- Not needed during development

---

## Testing Commands

### `npm test`
**What it does:** Runs all test files to check if your code works correctly.

```bash
npm test
```

**What happens:**
1. Jest finds all files ending in `.test.jsx` or `.test.js`
2. Runs each test
3. Shows which tests passed ✓ and which failed ✗
4. Displays how many tests passed total

**Example output:**
```
Test Suites: 4 passed, 4 total
Tests:       21 passed, 21 total
```

This means all 4 test files passed with 21 total tests passing.

---

### `npm test -- --testPathPattern="ComponentName"`
**What it does:** Runs only tests matching a pattern instead of all tests.

```bash
# Run only AuthContext tests
npm test -- --testPathPattern="AuthContext"

# Run only FeedbackButton tests
npm test -- --testPathPattern="FeedbackButton"
```

**When to use:** When you're working on a specific component and want faster feedback.

---

### `npm test -- --no-coverage --forceExit`
**What it does:** Runs tests with special options:
- `--no-coverage` = Don't measure code coverage (faster)
- `--forceExit` = Force quit after tests finish (don't hang)

```bash
npm test -- --no-coverage --forceExit
```

**When to use:** For quick test runs during development.

---

### `npm run test:watch`
**What it does:** Runs tests in watch mode. Tests re-run automatically when you change code.

```bash
npm run test:watch
```

**When to use:** When you're writing or fixing tests. You see results immediately as you type.

**To stop it:** Press `q` to quit

---

## Building Commands

### `npm run build` (already covered above)
Builds your app for production.

---

## Git Commands

### `git init`
**What it does:** Creates a new git repository in the current folder. Initializes version control.

```bash
git init
```

**What happens:**
- Creates a hidden `.git/` folder that tracks all changes
- You can now use git commands to save snapshots of your code

**When to use:** Only once when starting a new project.

---

### `git status`
**What it does:** Shows which files have changed since the last commit.

```bash
git status
```

**Output shows:**
- **Untracked files** = New files git doesn't know about
- **Modified files** = Files you changed
- **Staged files** = Files ready to commit

---

### `git add <filename>`
**What it does:** Stages a file for commit (marks it as "I want to save this change").

```bash
# Stage a single file
git add src/App.jsx

# Stage all changes
git add -A

# Stage all in current directory
git add .
```

**When to use:** Before committing, stage the files you want to save.

**Common patterns:**
- `git add -A` = Stage everything that changed (most common)
- `git add .` = Same as above
- `git add src/` = Stage all changes in `src/` folder

---

### `git commit -m "message"`
**What it does:** Saves a snapshot of your code with a message describing what changed.

```bash
git commit -m "Add Google OAuth authentication"
```

**Good commit messages:**
- Start with a verb: "Add", "Fix", "Update", "Refactor"
- Explain WHAT you did and WHY
- Keep it concise but clear

**Example good messages:**
```bash
git commit -m "Add LoginButton component for Google OAuth"
git commit -m "Fix logout button not clearing user state"
git commit -m "Update tests to use waitFor for async updates"
```

---

### `git log`
**What it does:** Shows history of all commits (snapshots) you've made.

```bash
git log
```

**See a shorter version:**
```bash
git log --oneline
```

**Output shows:**
- Commit ID (like `8a572fa`)
- Commit message
- Author and date

---

### `git add -A && git commit -m "message"`
**What it does:** Stages all changes AND commits them in one command.

```bash
git add -A ; git commit -m "Add OAuth authentication"
```

**This is a shortcut for:**
1. `git add -A` (stage everything)
2. `git commit -m "..."` (save it)

---

## Key Concepts

### What is `package.json`?
A file that describes your project:
- **name**: Project name
- **version**: Current version number
- **dependencies**: Packages needed to run the app
- **devDependencies**: Packages needed for development
- **scripts**: Custom commands you can run

```json
{
  "name": "claude-test",
  "version": "0.1.0",
  "dependencies": {
    "react": "^18.2.0",
    "@react-oauth/google": "^0.13.5"
  },
  "devDependencies": {
    "vite": "^8.0.13",
    "jest": "^29.7.0"
  },
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "test": "jest"
  }
}
```

### What are the `^` and `~` symbols in versions?
They specify which versions of a package you accept:
- `"^18.2.0"` = Accept 18.2.0 and any newer minor/patch version (18.3.0, 18.4.1, etc.)
- `"~18.2.0"` = Accept only patches (18.2.1, 18.2.5, but NOT 18.3.0)

### What is `node_modules/`?
A folder containing all your installed packages. 
- **Don't commit this to git** (it's huge and others can regenerate it with `npm install`)
- **Don't edit files here** (they get overwritten when you run `npm install`)
- Add to `.gitignore` so git ignores it

### What is `.env` file?
A file with secret configuration (API keys, IDs) that:
- You create locally on your machine
- You NEVER commit to git (add to `.gitignore`)
- Each developer creates their own
- Contains sensitive data like:
  ```
  VITE_GOOGLE_CLIENT_ID=abc123xyz...
  ```

---

## Workflow During Development

Here's a typical workflow when building a feature:

```bash
# 1. Start the development server (run once, keep it running)
npm run dev

# 2. In a new terminal, run tests in watch mode
npm run test:watch

# 3. Now code: create components, write tests
# (Tests auto-run as you save, dev server auto-reloads in browser)

# 4. When done, check all tests pass
npm test

# 5. Check for errors
npm run build

# 6. Save your work with git
git add -A
git commit -m "Add new feature"

# 7. See your history
git log --oneline
```

---

## Common Patterns in This Project

### Running Tests on Specific Components
```bash
# Test authentication
npm test -- --testPathPattern="Auth"

# Test components
npm test -- --testPathPattern="LoginButton|UserProfile"

# Test everything
npm test
```

### Quick Commands Chain
```bash
# Stage + commit in one line (save work)
git add -A ; git commit -m "Your message"

# Install dependency + save it
npm install package-name

# Install dev dependency + save it
npm install --save-dev package-name
```

### What to Do If Tests Fail
1. Read the error message carefully
2. It shows which test failed and why
3. Fix the code
4. Tests auto-run (if in `test:watch` mode)
5. Keep fixing until all tests pass

---

## Quick Reference Table

| Command | What It Does | When to Use |
|---------|-------------|-----------|
| `npm install` | Install all dependencies | First time, or when `package.json` changes |
| `npm run dev` | Start development server | During development (keep running) |
| `npm test` | Run all tests once | Check if everything works |
| `npm run test:watch` | Run tests, re-run on changes | While writing tests |
| `npm run build` | Create production build | Before deploying |
| `git status` | See what changed | Before committing |
| `git add -A` | Stage all changes | Before committing |
| `git commit -m "msg"` | Save changes with message | Regularly during development |
| `git log --oneline` | See commit history | Review what you've done |

---

## Summary

You now understand:
- ✅ How `npm` manages dependencies
- ✅ How to run development server and see changes live
- ✅ How to run tests to verify your code works
- ✅ How to build for production
- ✅ How to save work with git

The key to getting good at this: **practice**. Run these commands daily, and they'll become second nature!
