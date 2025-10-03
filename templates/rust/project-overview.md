# Rust Project Overview

## Project Context

**Technology Stack:** Rust systems programming projects

- **Language:** Rust 1.70+ (stable)
- **Package Manager:** Cargo
- **Build System:** Cargo with custom build scripts
- **Testing:** Built-in test framework
- **Documentation:** rustdoc

## Architecture & Patterns

- **Crates:** Library and binary crates
- **Modules:** Hierarchical module system
- **Ownership:** Memory safety without GC
- **Concurrency:** Safe parallelism with Send/Sync

## Development Workflow

- **Development:** cargo run, cargo check
- **Testing:** cargo test with doc tests
- **Benchmarking:** cargo bench, criterion
- **Formatting:** rustfmt, clippy linting

## Key Dependencies & Tools

- Core: std library (no_std for embedded)
- Web: axum, warp, actix-web
- Async: tokio, async-std
- Serialization: serde, serde_json

## Performance Considerations

- **Zero-cost Abstractions:** Compile-time optimizations
- **Profiling:** perf, valgrind, flamegraph
- **Memory:** No garbage collection overhead
- **Concurrency:** Lock-free data structures

## Security & Best Practices

- **Memory Safety:** Ownership system prevents common bugs
- **Dependencies:** cargo audit for vulnerabilities
- **Unsafe Code:** Minimize and audit carefully
- **Cryptography:** Use well-vetted crates

## Deployment Strategy

- **Binary:** Single executable deployment
- **Containerization:** Multi-stage Docker builds
- **Cross-compilation:** Target multiple platforms
- **Distribution:** cargo install, package managers

---

**For AI Assistants:** This project uses Rust patterns and conventions. Consider the technology stack and architecture when making suggestions.
