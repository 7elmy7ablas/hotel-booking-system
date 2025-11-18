# Sprint 6 Planning Document: Deployment, DevOps & Production Readiness

## Sprint Overview
- **Sprint Number:** 6
- **Duration:** 2 weeks (10 working days)
- **Start Date:** January 29, 2026
- **End Date:** February 11, 2026
- **Team Capacity:** 40 hours
- **Sprint Goal:** Deploy hotel booking system to production with complete CI/CD pipeline and monitoring

## Sprint Backlog

### User Story US-24: Docker Containerization
**Story Points:** 5  
**Priority:** High  
**Assignee:** DevOps Engineer

#### Description
As a DevOps engineer, I want to containerize the hotel booking application using Docker so that we can ensure consistent deployment across different environments and simplify the deployment process.

#### Acceptance Criteria
- [ ] Backend API is containerized with optimized Dockerfile
- [ ] Frontend Angular 19  application is containerized with multi-stage build
- [ ] Docker Compose file enables complete local development environment
- [ ] All containers start successfully and communicate properly
- [ ] Environment variables are properly configured for different stages
- [ ] Images are optimized for production (minimal size, security best practices)

#### Task Breakdown
1. **Create Backend Dockerfile** (2 hours)
   - Multi-stage build for .NET API
   - Optimize image size and security
   
2. **Create Frontend Dockerfile** (2 hours)
   - Multi-stage build with Node.js and Nginx
   - Static file serving optimization
   
3. **Docker Compose Configuration** (3 hours)
   - Local development environment
   - Database and Redis services
   - Network configuration
   
4. **Environment Configuration** (1 hour)
   - Docker environment variables
   - Configuration for different stages
   
5. **Testing and Documentation** (2 hours)
   - Test container builds and deployment
   - Update README with Docker instructions

#### AI Prompt for GitHub Copilot
Create production-ready Dockerfiles for .NET 10 and Angular 19.

Backend Dockerfile:
- Use mcr.microsoft.com/dotnet/sdk:10.0 for build stage
- Use mcr.microsoft.com/dotnet/aspnet:10.0 for runtime
- Multi-stage build for optimized image size
- Copy only necessary files
- Set ASPNETCORE_ENVIRONMENT=Production
- Expose port 8080

Frontend Dockerfile:
- Use node:20 for build stage
- Use nginx:alpine for serving
- Build with production configuration
- Optimize bundle size with ahead-of-time compilation
- Configure nginx.conf for Angular routing

Docker Compose:
- Include backend, frontend, SQL Server, Redis services
- Configure networks and volumes
- Set environment variables
