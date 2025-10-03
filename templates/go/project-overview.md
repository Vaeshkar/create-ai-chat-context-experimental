# Go Project Overview

## Project Context

**Technology Stack:** Go backend and systems projects

- **Language:** Go 1.21+
- **Package Manager:** Go modules
- **Web Framework:** Gin, Echo, or standard net/http
- **Database:** GORM, sqlx, or database/sql
- **Testing:** Built-in testing package

## Architecture & Patterns

- **Packages:** Organized by functionality
- **Interfaces:** Small, focused interfaces
- **Goroutines:** Concurrent programming
- **Channels:** Communication between goroutines

## Development Workflow

- **Development:** go run, go build
- **Testing:** go test with benchmarks
- **Formatting:** gofmt, goimports
- **Linting:** golangci-lint, staticcheck

## Key Dependencies & Tools

- Web: gin-gonic/gin, labstack/echo
- Database: gorm.io/gorm, jmoiron/sqlx
- Testing: stretchr/testify, golang/mock
- Utilities: spf13/cobra, spf13/viper

## Performance Considerations

- **Profiling:** go tool pprof
- **Benchmarking:** go test -bench
- **Memory:** Garbage collector tuning
- **Concurrency:** Worker pools, rate limiting

## Security & Best Practices

- **Dependencies:** go mod audit
- **Static Analysis:** gosec security scanner
- **Input Validation:** Structured validation
- **TLS:** Proper certificate handling

## Deployment Strategy

- **Binary:** Single executable
- **Containerization:** Minimal Docker images
- **Cloud:** Google Cloud Run, AWS Lambda
- **Orchestration:** Kubernetes native

---

**For AI Assistants:** This project uses Go patterns and conventions. Consider the technology stack and architecture when making suggestions.
