# NPM Publishing Checklist

**Last Updated:** 2025-10-24
**Purpose:** Prevent publishing broken packages to npm

---

## 🎯 Critical Items (Will Break Package)

- [ ] **`src/index.ts` exists** - Main entry point for package
  - Must export all public API
  - Example: `export * from './types/index.js'`
  - Verify: `ls -la src/index.ts`

- [ ] **package.json exports match build output**
  ```json
  "main": "./dist/cjs/index.cjs",
  "module": "./dist/esm/index.js",
  "types": "./dist/esm/index.d.ts"
  ```
  - Verify: `ls -la dist/esm/index.js dist/cjs/index.cjs dist/esm/index.d.ts`

- [ ] **Version number is correct**
  - Stable release: `3.0.0`
  - Beta: `3.0.0-beta.1`
  - Alpha: `3.0.0-alpha.18`
  - Check: `grep '"version"' package.json`

- [ ] **package.json `files` field includes dist/**
  ```json
  "files": ["dist/", "README.md", "LICENSE"]
  ```

---

## 🏗️ Build & Quality

- [ ] **Clean build passes (no errors)**
  ```bash
  pnpm run clean && pnpm run build  # or: npm run clean && npm run build
  ```
  - Should output to `dist/esm/` and `dist/cjs/`
  - Check: `ls -la dist/`

- [ ] **All tests passing**
  ```bash
  pnpm test  # or: npm test
  ```
  - Note: Update docs if test count changed

- [ ] **No TypeScript errors**
  ```bash
  pnpm run typecheck  # or: npm run typecheck
  ```
  - Strict mode enabled
  - No `any` types

- [ ] **No linting errors**
  ```bash
  pnpm run lint  # or: npm run lint
  ```
  - Zero errors required
  - Warnings should be fixed

---

## 📚 Documentation

- [ ] **README.md updated**
  - Installation command correct
  - Usage examples work
  - No broken links
  - Version numbers match

- [ ] **CHANGELOG.md or RELEASE-NOTES.md updated**
  - New features documented
  - Breaking changes highlighted
  - Version number at top

- [ ] **package.json metadata correct**
  - `description` accurate
  - `keywords` relevant
  - `repository` URL correct
  - `bugs` URL correct
  - `homepage` URL correct

---

## 🧪 Local Testing (Critical)

- [ ] **Pack package locally**
  ```bash
  pnpm pack  # or: npm pack
  # Creates: create-ai-chat-context-experimental-X.Y.Z.tgz
  ```

- [ ] **Test installation in separate project**
  ```bash
  cd /tmp/test-project
  pnpm add /path/to/package.tgz  # or: npm install
  ```

- [ ] **Verify imports work**
  ```typescript
  // Test file
  import { YourExport } from 'your-package-name';
  console.log(YourExport); // Should not error
  ```

- [ ] **Test CLI commands (if package has bin)**
  ```bash
  npx your-command --version
  npx your-command --help
  ```

---

## 🔐 Security & Privacy

- [ ] **No secrets in code**
  - No API keys
  - No passwords
  - No tokens
  - Check: `git log -p | grep -i 'api_key\|password\|secret'`

- [ ] **.gitignore includes**
  - `node_modules/`
  - `.env`
  - `*.log`
  - Local config files

- [ ] **Dependencies audited**
  ```bash
  pnpm audit  # or: npm audit
  ```

---

## 📦 Package Size

- [ ] **Check bundle size**
  ```bash
  du -sh dist/
  # Should be reasonable (<5MB for most packages)
  ```

- [ ] **Large files excluded**
  - No test fixtures in dist/
  - No example projects in dist/
  - Only necessary files

---

## 🔖 Version Management

- [ ] **Git tag matches package version**
  ```bash
  git tag v3.0.0
  git push origin v3.0.0
  ```

- [ ] **All changes committed**
  ```bash
  git status
  # Should be clean
  ```

- [ ] **On correct branch**
  - Usually `main` or `master`
  - Check: `git branch`

---

## 🚀 Publishing

- [ ] **Logged into npm**
  ```bash
  npm whoami
  # Should show your username
  ```

- [ ] **Dry run first**
  ```bash
  pnpm publish --dry-run  # or: npm publish --dry-run
  ```
  - Review what will be published
  - Check file list

- [ ] **Publish**
  ```bash
  pnpm publish  # or: npm publish
  
  # For alpha/beta:
  pnpm publish --tag alpha   # or: npm publish --tag alpha
  pnpm publish --tag beta    # or: npm publish --tag beta
  ```

---

## ✅ Post-Publishing

- [ ] **Verify on npm**
  - Visit: `https://www.npmjs.com/package/your-package-name`
  - Check version number
  - Check README renders correctly

- [ ] **Test install from npm**
  ```bash
  cd /tmp/fresh-test
  pnpm add your-package-name@latest  # or: npm install
  ```

- [ ] **Update project README**
  - Badge with latest version
  - Installation instructions

- [ ] **Announce release**
  - GitHub release notes
  - Discord/Slack/Twitter (if applicable)

---

## 🐛 If Something Goes Wrong

### Published wrong version?
```bash
# Deprecate the bad version
npm deprecate your-package@1.2.3 "Broken build, use 1.2.4"

# Publish fixed version
# (Bump version number first!)
pnpm publish
```

### Need to unpublish?
```bash
# Only works within 72 hours
npm unpublish your-package@1.2.3

# After 72 hours, can only deprecate
npm deprecate your-package@1.2.3 "Do not use"
```

---

## 📋 Quick Pre-Publish Script

Run this before every publish:

```bash
#!/bin/bash
echo "🔍 Pre-publish checks..."

# Clean & build
pnpm run clean && pnpm run build || exit 1

# Tests
pnpm test || exit 1

# Lint
pnpm run lint || exit 1

# Critical files exist
test -f dist/esm/index.js || { echo "❌ Missing dist/esm/index.js"; exit 1; }
test -f dist/cjs/index.cjs || { echo "❌ Missing dist/cjs/index.cjs"; exit 1; }
test -f src/index.ts || { echo "❌ Missing src/index.ts"; exit 1; }

# Pack test
pnpm pack

echo "✅ All checks passed! Ready to publish."
echo "Run: pnpm publish"
```

Save as `scripts/pre-publish.sh` and run before publishing.

---

## 🎯 Remember

1. **Always test locally first** (`pnpm pack` + install)
2. **Can't unpublish after 72 hours** - triple-check before publishing
3. **Version bumps are permanent** - choose wisely
4. **Breaking changes = major version** - follow semver

---

**Last successful publish:** _Update this date after each successful publish_

**Next version planned:** _Track your version plan here_
