"""
Advanced Prompts for Dual-AI Full-Stack Generation
Makes NexusAI more powerful than Cursor & Lovable
"""

def get_architecture_prompt(request) -> str:
    """Phase 1: Claude generates architecture and planning"""
    features_text = ", ".join(request.features) if request.features else "basic CRUD operations"
    
    return f"""You are an elite software architect. Analyze this project and create a comprehensive technical architecture.

**Project:** {request.description}
**Stack:** {request.framework.value} + {request.styling.value}
**Features:** {features_text}
**Backend:** {"Yes - RESTful API" if request.include_api else "No"}
**Database:** {"PostgreSQL" if request.include_database else "None"}
**Auth:** {"JWT-based authentication" if request.include_auth else "None"}

**Your Task: Create Technical Architecture**

Return a JSON object with this structure:
{{
    "architecture": {{
        "frontend": {{
            "framework": "{request.framework.value}",
            "components": ["ComponentName with description", ...],
            "state_management": "approach (context/redux/zustand)",
            "routing": "routing strategy",
            "api_layer": "how frontend calls backend"
        }},
        "backend": {{
            "framework": "Express/FastAPI/Flask",
            "language": "TypeScript/Python",
            "endpoints": [
                {{"method": "GET", "path": "/api/resource", "purpose": "...", "auth_required": true}},
                ...
            ],
            "middleware": ["auth", "cors", "error-handling"],
            "validation": "approach for input validation"
        }},
        "database": {{
            "type": "PostgreSQL",
            "schema": {{
                "tables": [
                    {{
                        "name": "users",
                        "columns": [
                            {{"name": "id", "type": "UUID", "constraints": ["PRIMARY KEY"]}},
                            {{"name": "email", "type": "VARCHAR(255)", "constraints": ["UNIQUE", "NOT NULL"]}},
                            ...
                        ],
                        "indexes": ["email_idx ON (email)"],
                        "relations": ["foreign key to other_table"]
                    }},
                    ...
                ]
            }},
            "migrations": "migration strategy"
        }},
        "api_design": {{
            "base_url": "/api/v1",
            "response_format": "standard JSON structure",
            "error_handling": "error response format",
            "pagination": "pagination strategy",
            "filtering": "query parameter approach"
        }},
        "security": {{
            "authentication": "JWT strategy",
            "authorization": "role-based access control",
            "input_validation": "validation approach",
            "rate_limiting": "rate limit strategy",
            "cors": "CORS configuration"
        }},
        "testing": {{
            "frontend_tests": ["unit tests for components", "integration tests"],
            "backend_tests": ["API endpoint tests", "database tests"],
            "e2e_tests": "end-to-end testing approach"
        }},
        "deployment": {{
            "containerization": "Docker strategy",
            "environment_configs": ["development", "staging", "production"],
            "ci_cd": "GitHub Actions/GitLab CI approach"
        }}
    }},
    "file_structure": {{
        "frontend": ["path/to/file.tsx - purpose", ...],
        "backend": ["path/to/file.py - purpose", ...],
        "configs": ["docker-compose.yml - orchestration", ...]
    }},
    "tech_decisions": ["Why choice X over Y", ...],
    "implementation_notes": ["Important considerations for next phase", ...]
}}

**Critical:** Return ONLY valid JSON, no markdown, no explanations.
"""

def get_fullstack_generation_prompt(architecture: dict, request, is_frontend: bool = True) -> str:
    """Phase 2: GPT-4 generates actual code based on architecture"""
    
    if is_frontend:
        return f"""You are an expert frontend developer. Generate COMPLETE production-ready frontend code.

**Architecture Plan:**
{architecture.get('architecture', {}).get('frontend', {})}

**Project:** {request.description}
**Framework:** {request.framework.value}
**Styling:** {request.styling.value}

**Files to Generate:**
{architecture.get('file_structure', {}).get('frontend', [])}

**Requirements:**
1. Generate ALL source files completely (NO placeholders like "// Add more code")
2. Follow the architecture plan exactly
3. Use TypeScript with proper types
4. Include comprehensive error handling
5. Add loading states and user feedback
6. Implement responsive design
7. Add proper form validation
8. Include comments for complex logic
9. Use modern best practices (hooks, functional components)
10. Make it production-ready

**File Structure to Create:**
- src/App.tsx - Main app component with routing
- src/components/* - Reusable UI components  
- src/pages/* - Page components
- src/services/* - API service layer
- src/hooks/* - Custom React hooks
- src/types/* - TypeScript interfaces
- src/utils/* - Utility functions
- src/context/* - Context providers (if needed)
- package.json - All dependencies (react, typescript, axios, react-router-dom, etc.)
- tsconfig.json - TypeScript configuration
- vite.config.ts or next.config.ts
- tailwind.config.ts - Tailwind configuration
- .env.example - Environment variables template
- Dockerfile - Production-ready Dockerfile
- nginx.conf - Nginx config for production
- README.md - Complete setup instructions
- .gitignore

**Output Format:**
Return a JSON object:
{{
    "files": [
        {{
            "path": "src/App.tsx",
            "content": "import React from 'react';\\n\\n// COMPLETE CODE HERE",
            "language": "typescript"
        }},
        ...
    ],
    "dependencies": {{
        "react": "^18.3.1",
        "react-dom": "^18.3.1",
        "typescript": "^5.5.0",
        "vite": "^5.4.0",
        ...
    }},
    "devDependencies": {{
        "@types/react": "^18.3.0",
        ...
    }},
    "scripts": {{
        "dev": "vite",
        "build": "tsc && vite build",
        "preview": "vite preview"
    }}
}}

**CRITICAL:** Every file must be COMPLETE with real implementation, not skeletons!
Return ONLY valid JSON.
"""
    
    else:  # Backend
        backend_arch = architecture.get('architecture', {}).get('backend', {})
        database_arch = architecture.get('architecture', {}).get('database', {})
        api_design = architecture.get('architecture', {}).get('api_design', {})
        
        return f"""You are an expert backend developer. Generate COMPLETE production-ready backend API.

**Architecture Plan:**
Backend: {backend_arch}
Database: {database_arch}
API Design: {api_design}

**Project:** {request.description}

**API Endpoints to Implement:**
{backend_arch.get('endpoints', [])}

**Requirements:**
1. Generate COMPLETE API with ALL endpoints implemented
2. Use {backend_arch.get('framework', 'Express')} with {backend_arch.get('language', 'TypeScript')}
3. Implement proper authentication/authorization
4. Add input validation and error handling
5. Include database models and migrations
6. Add comprehensive API documentation (OpenAPI/Swagger)
7. Include unit tests for all endpoints
8. Add rate limiting and security middleware
9. Create database connection pooling
10. Make it production-ready

**File Structure to Create:**

**If Node.js/Express:**
- server/src/index.ts - Server entry point
- server/src/app.ts - Express app configuration
- server/src/routes/* - API route handlers
- server/src/controllers/* - Business logic
- server/src/models/* - Database models
- server/src/middleware/* - Authentication, validation, error handling
- server/src/services/* - Business services
- server/src/utils/* - Utility functions
- server/src/types/* - TypeScript interfaces
- server/src/db/migrations/* - Database migrations
- server/src/db/seeds/* - Seed data
- server/tests/* - Test files
- server/package.json - Dependencies (express, pg, jsonwebtoken, bcrypt, joi, etc.)
- server/tsconfig.json
- server/.env.example
- server/Dockerfile
- server/README.md

**If Python/FastAPI:**
- api/main.py - FastAPI app
- api/routers/* - API routes
- api/models/* - Pydantic models
- api/database.py - Database connection
- api/crud.py - Database operations
- api/auth.py - JWT authentication
- api/dependencies.py - FastAPI dependencies
- api/tests/* - Pytest tests
- requirements.txt - All dependencies
- Dockerfile
- .env.example

**Additional Files:**
- docker-compose.yml - Full stack orchestration
- postman/collection.json - Postman collection for API testing
- docs/api-spec.yaml - OpenAPI specification
- database/schema.sql - Database schema
- database/migrations/* - SQL migrations
- .gitignore
- README.md - API documentation

**Output Format:**
Return JSON:
{{
    "files": [
        {{
            "path": "server/src/index.ts",
            "content": "import express from 'express';\\n\\n// COMPLETE CODE",
            "language": "typescript"
        }},
        {{
            "path": "postman/collection.json",
            "content": "{{\\n  \\"info\\": {{...}},\\n  \\"item\\": [...]\\n}}",
            "language": "json"
        }},
        ...
    ],
    "database_schema": "CREATE TABLE users (...); CREATE INDEX ...",
    "dependencies": {{
        "express": "^4.19.0",
        "pg": "^8.12.0",
        ...
    }},
    "requires_database": true,
    "postman_collection": {{
        "info": {{"name": "API Collection", "schema": "..."}},
        "item": [
            {{
                "name": "Get Users",
                "request": {{"method": "GET", "header": [], "url": "{{{{base_url}}}}/api/users"}}
            }},
            ...
        ]
    }},
    "deployment_config": {{
        "docker_compose": "docker-compose.yml content",
        "environment_variables": ["DATABASE_URL", "JWT_SECRET", ...],
        "health_check_endpoint": "/health"
    }}
}}

**CRITICAL:** 
- Implement EVERY endpoint completely
- Include Postman collection for testing
- Add OpenAPI/Swagger docs
- Make it immediately deployable
Return ONLY valid JSON.
"""

def get_integration_prompt(frontend_files: list, backend_files: list, architecture: dict) -> str:
    """Phase 3: Final integration and refinement"""
    return f"""You are a full-stack integration expert. Ensure frontend and backend work together perfectly.

**Frontend Files:** {len(frontend_files)} files
**Backend Files:** {len(backend_files)} files
**Architecture:** {architecture}

**Review and Fix:**
1. API endpoints match between frontend and backend
2. Environment variables are consistent
3. CORS is configured properly
4. Authentication flow works end-to-end
5. Error handling is consistent
6. Docker compose orchestrates everything

**Output:**
Return JSON with any necessary fixes:
{{
    "integration_fixes": [
        {{"file": "path/to/file", "change": "what to fix", "reason": "why"}},
        ...
    ],
    "docker_compose": "Complete docker-compose.yml content for full stack",
    "setup_instructions": "Step-by-step guide to get everything running",
    "test_endpoints": [
        {{"name": "Test user registration", "curl": "curl -X POST..."}},
        ...
    ]
}}
"""
