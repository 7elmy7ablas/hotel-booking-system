# ✅ Hotel Booking System - Production Checklist

## Pre-Deployment Checklist

### 1. Code Quality
- [ ] All tests passing (backend: `dotnet test`, frontend: `npm test`)
- [ ] No compiler warnings
- [ ] Code review completed
- [ ] No TODO/FIXME comments in production code
- [ ] Console.log statements removed from production
- [ ] Dead code removed

### 2. Security
- [ ] JWT secret is strong (256+ bits) and stored securely
- [ ] All secrets in environment variables or Key Vault
- [ ] HTTPS enforced
- [ ] CORS configured for production domains only
- [ ] Rate limiting enabled
- [ ] SQL injection prevention verified
- [ ] XSS protection enabled
- [ ] Security headers configured
- [ ] Dependency vulnerabilities scanned and resolved
- [ ] Authentication/authorization tested on all endpoints

### 3. Configuration
- [ ] Production appsettings configured
- [ ] Database connection string secured
- [ ] Logging level set to Warning or higher
- [ ] Application Insights configured
- [ ] Error pages configured (don't expose stack traces)
- [ ] GDPR/privacy compliance settings enabled

### 4. Database
- [ ] Migrations up to date
- [ ] Indexes created for common queries
- [ ] Backup strategy configured
- [ ] Connection pooling configured
- [ ] Soft delete implemented
- [ ] Sample/test data removed

### 5. Performance
- [ ] Caching configured
- [ ] Response compression enabled
- [ ] Static files cached
- [ ] Lazy loading implemented
- [ ] Database queries optimized
- [ ] Memory leaks checked

### 6. Frontend
- [ ] Production build successful (`ng build --configuration=production`)
- [ ] Environment variables set correctly
- [ ] Bundle size optimized (< 500KB initial)
- [ ] Images optimized
- [ ] Favicon and meta tags set
- [ ] Error handling for API failures
- [ ] Loading states implemented

---

## Deployment Checklist

### 7. Infrastructure
- [ ] Azure/AWS resources provisioned
- [ ] DNS configured
- [ ] SSL certificate installed
- [ ] CDN configured for static assets
- [ ] Load balancer configured (if applicable)
- [ ] Auto-scaling rules defined
- [ ] Resource limits set

### 8. Database Deployment
- [ ] Production database created
- [ ] Migrations applied
- [ ] Admin user created
- [ ] Backup verified
- [ ] Connection from API verified

### 9. Application Deployment
- [ ] Docker images built and pushed
- [ ] Environment variables configured
- [ ] Health check endpoints responding
- [ ] Swagger disabled or secured in production
- [ ] Deployment slots configured (blue-green)

### 10. Monitoring
- [ ] Application Insights connected
- [ ] Alerts configured (errors, performance)
- [ ] Log retention configured
- [ ] Dashboard created
- [ ] On-call schedule defined

---

## Post-Deployment Checklist

### 11. Verification
- [ ] Home page loads
- [ ] Login works
- [ ] Hotel search works
- [ ] Booking creation works
- [ ] My Bookings displays correctly
- [ ] Admin functions work
- [ ] Mobile responsive
- [ ] Performance acceptable (< 3s load time)

### 12. Smoke Tests
```bash
# API Health Check
curl https://api.yourdomain.com/health

# Expected: {"status":"Healthy"}

# Login Test
curl -X POST https://api.yourdomain.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@hotel.com","password":"Admin@123"}'

# Expected: {"token":"...","user":{...}}

# Hotels List
curl https://api.yourdomain.com/api/hotels

# Expected: {"items":[...],"totalCount":...}
```

### 13. Documentation
- [ ] PRODUCTION_README.md distributed
- [ ] API documentation URL shared
- [ ] Support contact information provided
- [ ] Runbook created for common issues
- [ ] Deployment process documented

### 14. Communication
- [ ] Stakeholders notified of go-live
- [ ] Support team briefed
- [ ] Monitoring team aware
- [ ] Rollback plan communicated

---

## Emergency Procedures

### Rollback Steps
1. Identify the issue in monitoring
2. Notify team via Slack/Teams
3. Execute rollback:
   ```bash
   # Azure App Service
   az webapp deployment slot swap \
     --resource-group hotel-booking-rg \
     --name hotelbooking-api \
     --slot staging
   
   # Or redeploy previous image
   az webapp config container set \
     --name hotelbooking-api \
     --resource-group hotel-booking-rg \
     --docker-custom-image-name ghcr.io/org/api:previous-tag
   ```
4. Verify rollback successful
5. Document incident

### Contact List
| Role | Name | Phone | Email |
|------|------|-------|-------|
| DevOps Lead | [Name] | [Phone] | [Email] |
| Backend Lead | [Name] | [Phone] | [Email] |
| Frontend Lead | [Name] | [Phone] | [Email] |
| DBA | [Name] | [Phone] | [Email] |
| Project Manager | [Name] | [Phone] | [Email] |

---

## Sign-Off

### Development Team
- [ ] Lead Developer: _________________ Date: _______
- [ ] QA Lead: _________________ Date: _______

### Operations
- [ ] DevOps Lead: _________________ Date: _______
- [ ] Security Lead: _________________ Date: _______

### Management
- [ ] Project Manager: _________________ Date: _______
- [ ] Product Owner: _________________ Date: _______

---

**Production Deployment Approved By:**

Name: _________________________

Signature: _________________________

Date: _________________________
