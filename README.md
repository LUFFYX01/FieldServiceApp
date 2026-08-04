# Field Service Management System

A production-style backend application for managing field service operations, built with **Spring Boot** and **Spring Security**. The project follows a clean layered architecture and implements stateless authentication using **JWT (JSON Web Tokens)**.

## Overview

Field Service Management System is designed to help organizations manage customers, users, work orders, and field technicians efficiently.

The project is being developed incrementally following industry best practices, with each feature implemented in its own Git branch before being merged into the main branch.

---

# Tech Stack

- Java 23
- Spring Boot 4.1.0
- Spring Security 7
- Spring Data JPA
- PostgreSQL
- Maven
- JWT (JJWT 0.13)
- Hibernate
- Lombok
- Jakarta Validation

---

# Project Architecture

```
Controller
    │
    ▼
Service
    │
    ▼
Repository
    │
    ▼
PostgreSQL
```

The project follows a layered architecture where each layer has a single responsibility.

- **Controller** → Handles HTTP requests and responses
- **Service** → Contains business logic
- **Repository** → Handles database operations
- **Entity** → Represents database tables
- **DTO** → Transfers data between client and server
- **Security** → Handles authentication and authorization

---

# Features Implemented

## Customer Management

- Create Customer
- Get All Customers
- Get Customer by ID
- Update Customer
- Delete Customer

---

## User Management

- Register User
- Get All Users
- Get User by ID
- Update User
- Delete User

---

## Authentication & Security

- BCrypt Password Encryption
- UserDetails Implementation
- CustomUserDetailsService
- AuthenticationManager
- DaoAuthenticationProvider
- JWT Generation
- JWT Validation
- Stateless Authentication
- JWT Authentication Filter
- SecurityContext Integration

---

# Authentication Flow

```
Client
   │
   ▼
POST /api/auth/login
   │
   ▼
AuthenticationManager
   │
   ▼
DaoAuthenticationProvider
   │
   ▼
CustomUserDetailsService
   │
   ▼
UserRepository
   │
   ▼
BCrypt Password Verification
   │
   ▼
JWT Generation
   │
   ▼
Token Returned
```

For every protected request:

```
Client
   │
Authorization: Bearer <JWT>
   │
   ▼
JwtAuthenticationFilter
   │
   ▼
Extract Username
   │
   ▼
Load User
   │
   ▼
Validate Token
   │
   ▼
SecurityContextHolder
   │
   ▼
Protected Controller
```

---

# Project Structure

```
src
└── main
    └── java
        └── com.KeyStone.Field
            ├── Configuration
            ├── Controller
            ├── DTO
            ├── Entity
            ├── ENUM
            ├── Exception
            ├── Repository
            ├── Security
            └── Service
```

---

# REST API

## Authentication

| Method | Endpoint | Description |
|---------|----------|-------------|
| POST | `/api/auth/register` | Register a new user |
| POST | `/api/auth/login` | Authenticate user and generate JWT |

## Users

| Method | Endpoint |
|---------|----------|
| GET | `/api/users` |
| GET | `/api/users/{id}` |
| PUT | `/api/users/{id}` |
| DELETE | `/api/users/{id}` |

## Customers

| Method | Endpoint |
|---------|----------|
| POST | `/api/customers` |
| GET | `/api/customers` |
| GET | `/api/customers/{id}` |
| PUT | `/api/customers/{id}` |
| DELETE | `/api/customers/{id}` |

---

# Getting Started

### Clone Repository

```bash
git clone https://github.com/LUFFYX01/FieldService.git
```

### Navigate to Project

```bash
cd FieldServiceApp
```

### Configure PostgreSQL

Update `application.properties`

```properties
spring.datasource.url=jdbc:postgresql://localhost:5432/fieldservice
spring.datasource.username=your_username
spring.datasource.password=your_password

jwt.secret=your_32_character_secret_key
jwt.expiration=900000
```

### Run Application

```bash
mvn spring-boot:run
```

Application runs on:

```
http://localhost:8080
```

---

# Testing Authentication

1. Register a new user
2. Login using email and password
3. Copy the returned JWT
4. Add the following header:

```
Authorization: Bearer <your_jwt_token>
```

5. Access protected APIs

---

# Future Enhancements

- Role-Based Authorization (RBAC)
- Work Order Management
- Site Management
- Technician Assignment
- Parts & Inventory Module
- Refresh Tokens
- Swagger/OpenAPI Documentation
- Docker Support
- Unit & Integration Testing
- CI/CD Pipeline

---

# Author

**Prateek Gupta**

Backend Developer | Java | Spring Boot | PostgreSQL

---

# License

This project is intended for learning and portfolio purposes.
