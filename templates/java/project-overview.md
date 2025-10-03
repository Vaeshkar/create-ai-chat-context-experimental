# Java Project Overview

## Project Context

**Technology Stack:** Java projects, Spring Boot, Maven/Gradle

- **Language:** Java 17+ (LTS)
- **Build Tool:** Maven or Gradle
- **Framework:** Spring Boot, Quarkus
- **Database:** JPA/Hibernate, MyBatis
- **Testing:** JUnit 5, Mockito

## Architecture & Patterns

- **Layered Architecture:** Controller/Service/Repository
- **Dependency Injection:** Spring IoC container
- **Data Access:** JPA entities and repositories
- **Configuration:** Application properties, profiles

## Development Workflow

- **Development:** IDE with hot reload
- **Build:** mvn compile, gradle build
- **Testing:** Unit tests, integration tests
- **Packaging:** JAR/WAR deployment artifacts

## Key Dependencies & Tools

- Framework: spring-boot-starter-web
- Database: spring-boot-starter-data-jpa
- Testing: spring-boot-starter-test
- Utilities: apache-commons, guava

## Performance Considerations

- **JVM Tuning:** Heap size, GC algorithms
- **Profiling:** JProfiler, VisualVM
- **Caching:** Spring Cache, Redis
- **Connection Pooling:** HikariCP

## Security & Best Practices

- **Spring Security:** Authentication, authorization
- **OWASP:** Security vulnerability scanning
- **Dependencies:** SNYK, OWASP dependency check
- **Secrets:** Vault, encrypted properties

## Deployment Strategy

- **Application Server:** Embedded Tomcat
- **Containerization:** Docker with JDK base image
- **Cloud:** AWS Elastic Beanstalk, Azure
- **Monitoring:** Micrometer, Prometheus

---

**For AI Assistants:** This project uses Java patterns and conventions. Consider the technology stack and architecture when making suggestions.
