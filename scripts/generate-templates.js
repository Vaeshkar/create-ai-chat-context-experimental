#!/usr/bin/env node

const fs = require('fs').promises;
const path = require('path');
const { TEMPLATES } = require('../src/templates');

/**
 * Template file contents generators
 */
const generators = {
  // Generate project-overview.md for each template
  projectOverview: (templateKey, template) => {
    const examples = getLanguageExamples(templateKey);
    return `# ${template.name} Project Overview

## Project Context

**Technology Stack:** ${template.description}

${examples.stack}

## Architecture & Patterns

${examples.architecture}

## Development Workflow

${examples.workflow}

## Key Dependencies & Tools

${examples.dependencies}

## Performance Considerations

${examples.performance}

## Security & Best Practices

${examples.security}

## Deployment Strategy

${examples.deployment}

---

**For AI Assistants:** This project uses ${template.name} patterns and conventions. Consider the technology stack and architecture when making suggestions.
`;
  },

  // Generate technical-decisions.md template
  technicalDecisions: (templateKey, template) => {
    const examples = getTechnicalDecisionExamples(templateKey);
    return `# Technical Decisions

Document WHY you made specific technical choices for this ${template.name} project.

---

${examples.sampleDecisions}

---

## Decision Template

When documenting decisions, include:

1. **Context:** What situation led to this decision?
2. **Options:** What alternatives were considered?
3. **Decision:** What was chosen and why?
4. **Consequences:** What are the trade-offs?

---

**Last Updated:** [Date]
`;
  },

  // Generate code-style.md template
  codeStyle: (templateKey, template) => {
    const examples = getCodeStyleExamples(templateKey);
    return `# ${template.name} Code Style Guide

## Formatting & Structure

${examples.formatting}

## Naming Conventions

${examples.naming}

## File Organization

${examples.fileOrganization}

## Language-Specific Guidelines

${examples.languageSpecific}

## Code Quality Rules

${examples.quality}

## Testing Patterns

${examples.testing}

---

**For AI Assistants:** Follow these ${template.name} conventions when writing or reviewing code.
`;
  },

  // Generate design-system.md template
  designSystem: (templateKey, template) => {
    const examples = getDesignSystemExamples(templateKey);
    return `# ${template.name} Design System

## Design Principles

${examples.principles}

## Component Architecture

${examples.components}

## Styling Approach

${examples.styling}

## UI/UX Patterns

${examples.patterns}

## Responsive Design

${examples.responsive}

## Accessibility

${examples.accessibility}

---

**For AI Assistants:** Follow these design patterns and component structures when creating UI elements.
`;
  }
};

/**
 * Get language-specific examples for project overview
 */
function getLanguageExamples(templateKey) {
  const examples = {
    // JavaScript/TypeScript
    nextjs: {
      stack: "- **Frontend:** Next.js 14+, React 18+, TypeScript\n- **Styling:** Tailwind CSS, CSS Modules\n- **State:** Zustand, React Query\n- **Database:** Prisma, PostgreSQL\n- **Deployment:** Vercel, Railway",
      architecture: "- **App Router:** Using Next.js 13+ app directory\n- **API Routes:** Server-side API endpoints\n- **Components:** Functional components with hooks\n- **State Management:** Client/server state separation",
      workflow: "- **Development:** next dev with hot reload\n- **Build:** Static generation + SSR hybrid\n- **Testing:** Jest, React Testing Library\n- **Linting:** ESLint, Prettier",
      dependencies: "- Core: next, react, react-dom, typescript\n- UI: @headlessui/react, lucide-react\n- Data: @tanstack/react-query, axios\n- Dev: eslint-config-next, @types/react",
      performance: "- **Image Optimization:** next/image component\n- **Code Splitting:** Automatic route-based splitting\n- **Caching:** SWR patterns, static generation\n- **Bundle Analysis:** @next/bundle-analyzer",
      security: "- **CSP Headers:** Content Security Policy\n- **Environment Variables:** .env.local pattern\n- **API Security:** Rate limiting, validation\n- **Authentication:** NextAuth.js patterns",
      deployment: "- **Platform:** Vercel (recommended)\n- **Database:** PostgreSQL on Railway/Supabase\n- **CDN:** Vercel Edge Network\n- **Monitoring:** Vercel Analytics"
    },

    react: {
      stack: "- **Frontend:** React 18+, TypeScript/JavaScript\n- **Build Tool:** Vite, Create React App, or Webpack\n- **Styling:** Styled Components, Emotion, or CSS Modules\n- **State:** Redux Toolkit, Zustand, or Context API",
      architecture: "- **Components:** Functional components with hooks\n- **State Management:** Centralized state + local state\n- **Routing:** React Router v6+\n- **Data Fetching:** React Query, SWR, or custom hooks",
      workflow: "- **Development:** Hot module replacement\n- **Build:** Production optimized bundles\n- **Testing:** Jest, React Testing Library\n- **Linting:** ESLint with React rules",
      dependencies: "- Core: react, react-dom, react-router-dom\n- State: @reduxjs/toolkit, @tanstack/react-query\n- UI: @headlessui/react, framer-motion\n- Build: vite, @vitejs/plugin-react",
      performance: "- **Bundle Splitting:** React.lazy, dynamic imports\n- **Memoization:** React.memo, useMemo, useCallback\n- **Virtualization:** For large lists\n- **Performance Profiling:** React DevTools",
      security: "- **XSS Prevention:** Sanitize user inputs\n- **HTTPS:** Enforce secure connections\n- **Dependencies:** Regular security audits\n- **Environment:** Secure API endpoints",
      deployment: "- **Static Hosting:** Netlify, Vercel, GitHub Pages\n- **CDN:** CloudFront, Cloudflare\n- **CI/CD:** GitHub Actions, GitLab CI\n- **Monitoring:** Error boundaries, Sentry"
    },

    python: {
      stack: "- **Language:** Python 3.11+\n- **Package Manager:** Poetry, pip-tools, or pip\n- **Web Framework:** FastAPI, Django, or Flask\n- **Database:** PostgreSQL, SQLite\n- **Testing:** pytest, unittest",
      architecture: "- **Project Structure:** src/ layout or flat structure\n- **Dependencies:** requirements.txt or pyproject.toml\n- **Virtual Environment:** venv, conda, or poetry\n- **Code Organization:** Modules and packages",
      workflow: "- **Development:** Virtual environment activation\n- **Testing:** pytest with coverage reporting\n- **Linting:** black, flake8, mypy\n- **Documentation:** Sphinx or mkdocs",
      dependencies: "- Web: fastapi, django, flask\n- Data: pandas, numpy, sqlalchemy\n- Testing: pytest, pytest-cov, factory-boy\n- Dev: black, flake8, mypy, pre-commit",
      performance: "- **Profiling:** cProfile, py-spy\n- **Async:** asyncio for I/O bound tasks\n- **Caching:** Redis, memcached\n- **Database:** Query optimization, indexing",
      security: "- **Dependencies:** pip-audit, safety\n- **Secrets:** Environment variables, keyring\n- **Web Security:** HTTPS, CSRF protection\n- **Input Validation:** Pydantic, marshmallow",
      deployment: "- **Containerization:** Docker\n- **Cloud:** AWS Lambda, Google Cloud Run\n- **Traditional:** systemd, supervisor\n- **Monitoring:** New Relic, DataDog"
    },

    rust: {
      stack: "- **Language:** Rust 1.70+ (stable)\n- **Package Manager:** Cargo\n- **Build System:** Cargo with custom build scripts\n- **Testing:** Built-in test framework\n- **Documentation:** rustdoc",
      architecture: "- **Crates:** Library and binary crates\n- **Modules:** Hierarchical module system\n- **Ownership:** Memory safety without GC\n- **Concurrency:** Safe parallelism with Send/Sync",
      workflow: "- **Development:** cargo run, cargo check\n- **Testing:** cargo test with doc tests\n- **Benchmarking:** cargo bench, criterion\n- **Formatting:** rustfmt, clippy linting",
      dependencies: "- Core: std library (no_std for embedded)\n- Web: axum, warp, actix-web\n- Async: tokio, async-std\n- Serialization: serde, serde_json",
      performance: "- **Zero-cost Abstractions:** Compile-time optimizations\n- **Profiling:** perf, valgrind, flamegraph\n- **Memory:** No garbage collection overhead\n- **Concurrency:** Lock-free data structures",
      security: "- **Memory Safety:** Ownership system prevents common bugs\n- **Dependencies:** cargo audit for vulnerabilities\n- **Unsafe Code:** Minimize and audit carefully\n- **Cryptography:** Use well-vetted crates",
      deployment: "- **Binary:** Single executable deployment\n- **Containerization:** Multi-stage Docker builds\n- **Cross-compilation:** Target multiple platforms\n- **Distribution:** cargo install, package managers"
    },

    go: {
      stack: "- **Language:** Go 1.21+\n- **Package Manager:** Go modules\n- **Web Framework:** Gin, Echo, or standard net/http\n- **Database:** GORM, sqlx, or database/sql\n- **Testing:** Built-in testing package",
      architecture: "- **Packages:** Organized by functionality\n- **Interfaces:** Small, focused interfaces\n- **Goroutines:** Concurrent programming\n- **Channels:** Communication between goroutines",
      workflow: "- **Development:** go run, go build\n- **Testing:** go test with benchmarks\n- **Formatting:** gofmt, goimports\n- **Linting:** golangci-lint, staticcheck",
      dependencies: "- Web: gin-gonic/gin, labstack/echo\n- Database: gorm.io/gorm, jmoiron/sqlx\n- Testing: stretchr/testify, golang/mock\n- Utilities: spf13/cobra, spf13/viper",
      performance: "- **Profiling:** go tool pprof\n- **Benchmarking:** go test -bench\n- **Memory:** Garbage collector tuning\n- **Concurrency:** Worker pools, rate limiting",
      security: "- **Dependencies:** go mod audit\n- **Static Analysis:** gosec security scanner\n- **Input Validation:** Structured validation\n- **TLS:** Proper certificate handling",
      deployment: "- **Binary:** Single executable\n- **Containerization:** Minimal Docker images\n- **Cloud:** Google Cloud Run, AWS Lambda\n- **Orchestration:** Kubernetes native"
    },

    java: {
      stack: "- **Language:** Java 17+ (LTS)\n- **Build Tool:** Maven or Gradle\n- **Framework:** Spring Boot, Quarkus\n- **Database:** JPA/Hibernate, MyBatis\n- **Testing:** JUnit 5, Mockito",
      architecture: "- **Layered Architecture:** Controller/Service/Repository\n- **Dependency Injection:** Spring IoC container\n- **Data Access:** JPA entities and repositories\n- **Configuration:** Application properties, profiles",
      workflow: "- **Development:** IDE with hot reload\n- **Build:** mvn compile, gradle build\n- **Testing:** Unit tests, integration tests\n- **Packaging:** JAR/WAR deployment artifacts",
      dependencies: "- Framework: spring-boot-starter-web\n- Database: spring-boot-starter-data-jpa\n- Testing: spring-boot-starter-test\n- Utilities: apache-commons, guava",
      performance: "- **JVM Tuning:** Heap size, GC algorithms\n- **Profiling:** JProfiler, VisualVM\n- **Caching:** Spring Cache, Redis\n- **Connection Pooling:** HikariCP",
      security: "- **Spring Security:** Authentication, authorization\n- **OWASP:** Security vulnerability scanning\n- **Dependencies:** SNYK, OWASP dependency check\n- **Secrets:** Vault, encrypted properties",
      deployment: "- **Application Server:** Embedded Tomcat\n- **Containerization:** Docker with JDK base image\n- **Cloud:** AWS Elastic Beanstalk, Azure\n- **Monitoring:** Micrometer, Prometheus"
    },

    // Add more templates as needed...
    default: {
      stack: "- **Technology:** [Specify your main technology stack]\n- **Framework:** [Web framework or main libraries]\n- **Database:** [Database technology]\n- **Testing:** [Testing framework and tools]",
      architecture: "- **Structure:** [Describe your project structure]\n- **Patterns:** [Design patterns used]\n- **Components:** [Main components and their relationships]\n- **Data Flow:** [How data flows through the system]",
      workflow: "- **Development:** [Development server and workflow]\n- **Build:** [Build process and tools]\n- **Testing:** [Testing strategy and tools]\n- **Quality:** [Code quality tools and processes]",
      dependencies: "- **Core:** [Main runtime dependencies]\n- **Development:** [Development-only dependencies]\n- **Testing:** [Testing dependencies]\n- **Build:** [Build tool dependencies]",
      performance: "- **Profiling:** [Performance profiling tools]\n- **Optimization:** [Performance optimization strategies]\n- **Monitoring:** [Performance monitoring setup]\n- **Caching:** [Caching strategies]",
      security: "- **Dependencies:** [Dependency vulnerability scanning]\n- **Code Analysis:** [Static security analysis]\n- **Runtime:** [Runtime security measures]\n- **Deployment:** [Deployment security practices]",
      deployment: "- **Environment:** [Deployment environment]\n- **Process:** [Deployment process]\n- **Monitoring:** [Production monitoring]\n- **Scaling:** [Scaling strategy]"
    }
  };

  return examples[templateKey] || examples.default;
}

/**
 * Get technical decision examples for each template
 */
function getTechnicalDecisionExamples(templateKey) {
  const decisions = {
    nextjs: `## Database Choice: PostgreSQL + Prisma

**Date:** 2024-01-15
**Status:** ✅ Decided

### Context
Need to choose database and ORM for Next.js application with complex relational data.

### Options Considered
- **PostgreSQL + Prisma:** Type-safe, great Next.js integration
- **MongoDB + Mongoose:** NoSQL flexibility
- **Supabase:** PostgreSQL with built-in auth

### Decision
Chose PostgreSQL with Prisma ORM.

### Reasoning
- **Type Safety:** Prisma generates TypeScript types automatically
- **Developer Experience:** Excellent tooling and IntelliSense
- **Scalability:** PostgreSQL handles complex queries and scaling
- **Ecosystem:** Great integration with Vercel and Next.js

### Consequences
- **Pros:** Type safety, great tooling, mature ecosystem
- **Cons:** Learning curve for team, migration complexity`,

    python: `## Web Framework: FastAPI vs Django

**Date:** 2024-01-15
**Status:** ✅ Decided

### Context
Building a REST API with authentication, database integration, and good performance.

### Options Considered
- **FastAPI:** Modern, async, automatic OpenAPI docs
- **Django REST Framework:** Mature, full-featured, admin interface
- **Flask:** Lightweight, flexible, minimal

### Decision
Chose FastAPI for the main API service.

### Reasoning
- **Performance:** Async support and excellent benchmark results
- **Developer Experience:** Automatic API documentation with OpenAPI
- **Type Hints:** Native Python type hints integration
- **Modern:** Built for Python 3.7+ with contemporary patterns

### Consequences
- **Pros:** Fast development, excellent docs, high performance
- **Cons:** Smaller ecosystem than Django, newer framework`,

    default: `## Example Decision: Technology Stack Choice

**Date:** [Date]
**Status:** ✅ Decided / 🤔 Considering / ❌ Rejected

### Context
[Describe the situation that required a decision]

### Options Considered
- **Option A:** [Description and key characteristics]
- **Option B:** [Description and key characteristics] 
- **Option C:** [Description and key characteristics]

### Decision
[What was chosen]

### Reasoning
- **Performance:** [Performance considerations]
- **Developer Experience:** [How it affects development]
- **Scalability:** [Scaling implications]
- **Team Expertise:** [Team knowledge and learning curve]
- **Ecosystem:** [Community and library support]

### Consequences
- **Pros:** [Benefits of this choice]
- **Cons:** [Drawbacks and limitations]
- **Risks:** [Potential risks and mitigation strategies]`
  };

  return { sampleDecisions: decisions[templateKey] || decisions.default };
}

/**
 * Get code style examples for each template
 */
function getCodeStyleExamples(templateKey) {
  const styles = {
    nextjs: {
      formatting: "- **Prettier:** 2 spaces, single quotes, trailing commas\n- **Line Length:** 80-100 characters max\n- **Semicolons:** Required in TypeScript\n- **Brackets:** Same line for JSX",
      naming: "- **Components:** PascalCase (UserProfile.tsx)\n- **Files:** kebab-case (user-profile.utils.ts)\n- **Functions:** camelCase (getUserProfile)\n- **Constants:** SCREAMING_SNAKE_CASE",
      fileOrganization: "- **Components:** /components/ui, /components/forms\n- **Pages:** /app or /pages directory\n- **Utils:** /lib, /utils\n- **Types:** /types or co-located",
      languageSpecific: "- **React:** Use functional components with hooks\n- **TypeScript:** Strict mode, explicit return types\n- **Next.js:** Use app router, server components where possible\n- **Imports:** Absolute imports with @/ alias",
      quality: "- **ESLint:** extends next/core-web-vitals\n- **TypeScript:** strict: true in tsconfig\n- **Unused imports:** Remove automatically\n- **Console logs:** Remove before production",
      testing: "- **Test Files:** Component.test.tsx pattern\n- **Utilities:** test-utils with custom render\n- **Mocking:** Mock API calls and external dependencies\n- **Coverage:** Aim for 80%+ on critical paths"
    },
    python: {
      formatting: "- **Black:** Default settings (88 char line length)\n- **Imports:** isort with black compatibility\n- **Docstrings:** Google or Sphinx style\n- **Type hints:** Use for function signatures",
      naming: "- **Functions:** snake_case (get_user_profile)\n- **Classes:** PascalCase (UserProfile)\n- **Constants:** SCREAMING_SNAKE_CASE\n- **Modules:** lowercase_with_underscores",
      fileOrganization: "- **Structure:** src/ layout preferred\n- **Modules:** Logical grouping by functionality\n- **Tests:** tests/ directory or test_*.py files\n- **Config:** pyproject.toml or setup.cfg",
      languageSpecific: "- **Python 3.11+:** Use modern syntax features\n- **Type Hints:** Use typing module annotations\n- **Async:** async/await for I/O bound operations\n- **Context Managers:** Use for resource management",
      quality: "- **Linting:** flake8 or ruff\n- **Type Checking:** mypy with strict mode\n- **Security:** bandit for security issues\n- **Complexity:** Keep functions under 15 lines when possible",
      testing: "- **Framework:** pytest with fixtures\n- **Structure:** tests/ mirror src/ structure\n- **Mocking:** unittest.mock or pytest-mock\n- **Coverage:** pytest-cov for coverage reporting"
    },
    default: {
      formatting: "- **Indentation:** [Specify spaces/tabs and size]\n- **Line Length:** [Maximum characters per line]\n- **Quotes:** [Single vs double quotes preference]\n- **Trailing Commas:** [Policy on trailing commas]",
      naming: "- **Variables:** [Naming convention for variables]\n- **Functions:** [Naming convention for functions]\n- **Classes:** [Naming convention for classes]\n- **Constants:** [Naming convention for constants]",
      fileOrganization: "- **Directory Structure:** [How files are organized]\n- **File Naming:** [File naming conventions]\n- **Module Organization:** [How modules are structured]\n- **Import Organization:** [How imports are organized]",
      languageSpecific: "- **Language Version:** [Specify version requirements]\n- **Key Features:** [Language-specific features to use]\n- **Patterns:** [Recommended language patterns]\n- **Conventions:** [Language community conventions]",
      quality: "- **Linting:** [Linting tools and configuration]\n- **Type Checking:** [Type checking approach]\n- **Code Analysis:** [Static analysis tools]\n- **Complexity:** [Complexity metrics and limits]",
      testing: "- **Framework:** [Testing framework choice]\n- **Organization:** [Test file organization]\n- **Patterns:** [Testing patterns and practices]\n- **Coverage:** [Coverage requirements and tools]"
    }
  };

  return styles[templateKey] || styles.default;
}

/**
 * Get design system examples for each template
 */
function getDesignSystemExamples(templateKey) {
  const designs = {
    nextjs: {
      principles: "- **Component-First:** Reusable UI components\n- **Atomic Design:** Atoms, molecules, organisms\n- **Accessibility:** WCAG 2.1 AA compliance\n- **Performance:** Optimized images and fonts",
      components: "- **Base Components:** Button, Input, Card, Modal\n- **Composite Components:** DataTable, Form, Navigation\n- **Layout Components:** Container, Grid, Stack\n- **Feedback Components:** Toast, Alert, Spinner",
      styling: "- **CSS Framework:** Tailwind CSS with custom config\n- **Theme:** CSS custom properties for colors/spacing\n- **Components:** CSS Modules or styled-components\n- **Icons:** Lucide React or Heroicons",
      patterns: "- **Forms:** Controlled components with validation\n- **Data Display:** Loading states, empty states, errors\n- **Navigation:** Consistent navigation patterns\n- **Responsive:** Mobile-first responsive design",
      responsive: "- **Breakpoints:** sm: 640px, md: 768px, lg: 1024px, xl: 1280px\n- **Approach:** Mobile-first responsive design\n- **Images:** Responsive images with next/image\n- **Typography:** Fluid typography scaling",
      accessibility: "- **Semantic HTML:** Proper heading hierarchy\n- **ARIA Labels:** Screen reader support\n- **Keyboard Navigation:** Tab order and focus management\n- **Color Contrast:** WCAG AA compliant colors"
    },
    default: {
      principles: "- **Consistency:** Uniform patterns and components\n- **Usability:** User-centered design approach\n- **Accessibility:** Inclusive design practices\n- **Performance:** Optimized user experience",
      components: "- **Core Components:** [List main UI components]\n- **Layout Components:** [Layout and structure components]\n- **Form Components:** [Form and input components]\n- **Feedback Components:** [User feedback components]",
      styling: "- **Approach:** [CSS methodology or framework]\n- **Theme System:** [Theming approach]\n- **Variables:** [CSS custom properties or variables]\n- **Icons:** [Icon system choice]",
      patterns: "- **User Interface:** [Common UI patterns]\n- **Interaction:** [User interaction patterns]\n- **Data Display:** [Data presentation patterns]\n- **Navigation:** [Navigation patterns]",
      responsive: "- **Strategy:** [Responsive design strategy]\n- **Breakpoints:** [Screen size breakpoints]\n- **Approach:** [Mobile-first or desktop-first]\n- **Testing:** [Responsive testing approach]",
      accessibility: "- **Standards:** [Accessibility standards followed]\n- **Testing:** [Accessibility testing tools]\n- **Implementation:** [Implementation practices]\n- **Compliance:** [Compliance requirements]"
    }
  };

  return designs[templateKey] || designs.default;
}

/**
 * Create a single template directory with all files
 */
async function createTemplate(templateKey, template) {
  const templateDir = path.join(__dirname, '../templates', template.dir);
  
  console.log(`Creating template: ${templateKey} (${template.name})`);
  
  // Create directory
  await fs.mkdir(templateDir, { recursive: true });
  
  // Create all the template files
  const files = {
    'README.md': `# AI Knowledge Base - ${template.name}

This knowledge base is optimized for **${template.description}**.

## How to Use

1. **For AI Assistants**: Read all files in this directory for full project context
2. **For Developers**: Update these files as your project evolves

## Files

- **project-overview.md** - Technology stack and architecture
- **conversation-log.md** - Chat history and decisions  
- **technical-decisions.md** - Why we chose specific technologies
- **next-steps.md** - Current priorities and tasks
- **design-system.md** - UI/UX patterns and components
- **code-style.md** - Coding standards and conventions

## Integration

Start new AI chats with: "Read .ai-instructions first, then help me with [task]"

---

*Generated for ${template.name} projects*
`,
    
    'project-overview.md': generators.projectOverview(templateKey, template),
    'technical-decisions.md': generators.technicalDecisions(templateKey, template),
    'code-style.md': generators.codeStyle(templateKey, template),
    'design-system.md': generators.designSystem(templateKey, template),
    
    'conversation-log.md': `# Conversation Log - ${template.name}

Track your AI chat sessions and key decisions for this ${template.description} project.

---

## Chat #1 - Project Setup

**Date:** [Today's Date]  
**Participants:** Developer, AI Assistant  
**Duration:** [Duration]

### What We Accomplished
- Initialized ${template.name} project with create-ai-chat-context
- Set up project structure and initial configuration
- Established coding standards and conventions

### Key Decisions Made
- **Technology Stack:** ${template.description}
- **Project Structure:** Following ${template.name} best practices
- **AI Integration:** Using .ai/ knowledge base for context preservation

### Insights & Learnings
- AI context preservation eliminates need to re-explain project setup
- Template provides good starting structure for ${template.name} projects
- Knowledge base helps maintain consistency across chat sessions

### Next Steps
- [ ] Continue with project-specific development
- [ ] Update technical decisions as architecture evolves  
- [ ] Maintain conversation log for important sessions

---

*Add new chat entries above this line*
`,

    'next-steps.md': `# Next Steps - ${template.name}

Current priorities and tasks for this ${template.description} project.

---

## 🚀 High Priority

- [ ] [Add your high-priority tasks here]
- [ ] [Update project configuration as needed]
- [ ] [Implement core functionality]

## 📋 Medium Priority  

- [ ] [Add medium-priority tasks]
- [ ] [Set up testing infrastructure]
- [ ] [Configure deployment pipeline]

## 🔍 Low Priority

- [ ] [Add nice-to-have features]
- [ ] [Performance optimizations]
- [ ] [Documentation improvements]

## 🚫 Blocked

*No current blockers*

---

## 💡 Ideas & Future Considerations

- [Add future ideas and considerations]
- [Keep track of feature requests]
- [Note potential improvements]

---

**Last Updated:** [Date]  
**Review Frequency:** Weekly
`
  };
  
  // Write all files
  for (const [filename, content] of Object.entries(files)) {
    const filePath = path.join(templateDir, filename);
    await fs.writeFile(filePath, content);
  }
  
  console.log(`✅ Created ${templateKey} template with ${Object.keys(files).length} files`);
}

/**
 * Main function to generate all templates
 */
async function generateAllTemplates() {
  console.log('🚀 Generating comprehensive template collection...\n');
  
  const templateEntries = Object.entries(TEMPLATES);
  console.log(`Will create ${templateEntries.length} templates:\n`);
  
  // List all templates that will be created
  templateEntries.forEach(([key, template]) => {
    console.log(`  - ${key}: ${template.name} (${template.description})`);
  });
  
  console.log('\nStarting template generation...\n');
  
  let created = 0;
  let skipped = 0;
  
  for (const [templateKey, template] of templateEntries) {
    try {
      const templateDir = path.join(__dirname, '../templates', template.dir);
      
      // Check if template already exists
      try {
        await fs.access(templateDir);
        console.log(`⏭️  Skipping ${templateKey} - already exists`);
        skipped++;
        continue;
      } catch {
        // Directory doesn't exist, create it
      }
      
      await createTemplate(templateKey, template);
      created++;
      
    } catch (error) {
      console.error(`❌ Error creating ${templateKey}:`, error.message);
    }
  }
  
  console.log('\n🎉 Template generation complete!');
  console.log(`✅ Created: ${created} templates`);
  console.log(`⏭️  Skipped: ${skipped} templates (already existed)`);
  console.log(`📁 Total templates available: ${templateEntries.length}`);
  
  // Show usage examples
  console.log('\n💡 Usage Examples:');
  console.log('  npx aic init --template react     # React projects');
  console.log('  npx aic init --template fastapi   # Python FastAPI');
  console.log('  npx aic init --template go        # Go projects');
  console.log('  npx aic init --template java      # Java/Spring Boot');
  console.log('  npx aic init --template devops    # DevOps/Infrastructure');
  console.log('  npx aic init --template ai_ml     # AI/ML projects');
}

// Run the generator
if (require.main === module) {
  generateAllTemplates().catch(console.error);
}

module.exports = { generateAllTemplates, createTemplate };