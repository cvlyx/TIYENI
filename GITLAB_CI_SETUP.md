# GitLab CI/CD Setup Guide for Tiyeni

## Overview
This guide explains how to set up GitLab CI/CD for the Tiyeni project, replacing the previous GitHub Actions workflow.

## Required GitLab CI/CD Variables

### 1. Go to GitLab Project Settings
- Navigate to your GitLab project
- Go to **Settings > CI/CD**
- Expand **Variables** section
- Add the following variables:

### 2. Required Variables

#### API Keys & Secrets
| Variable Name | Value | Protected | Masked |
|---------------|-------|-----------|--------|
| `RENDER_API_KEY` | Your Render API key | Yes | Yes |
| `RENDER_PRODUCTION_SERVICE_ID` | Render production service ID | Yes | Yes |
| `RENDER_STAGING_SERVICE_ID` | Render staging service ID | Yes | Yes |

#### Mobile App Configuration
| Variable Name | Value | Protected | Masked |
|---------------|-------|-----------|--------|
| `GOOGLE_SERVICES_JSON` | Contents of google-services.json | Yes | Yes |
| `KEYSTORE_BASE64` | Base64 encoded release keystore | Yes | Yes |
| `EXPO_APPLE_ID` | Apple ID for iOS builds | Yes | Yes |
| `EXPO_APPLE_ID_PASSWORD` | Apple ID password | Yes | Yes |

#### Environment Variables
| Variable Name | Value | Protected | Masked |
|---------------|-------|-----------|--------|
| `NODE_ENV` | production | No | No |
| `EXPO_PUBLIC_API_URL` | https://tiyeni-api.onrender.com/api | No | No |
| `EXPO_PUBLIC_ENVIRONMENT` | production | No | No |

## Setting Up Variables

### 1. Render API Key
1. Go to [Render Dashboard](https://dashboard.render.com/)
2. Go to **Account Settings > API Keys**
3. Create a new API key
4. Copy the key and add it to GitLab CI/CD variables

### 2. Google Services JSON
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Go to **Project Settings > Service accounts**
4. Generate a new private key
5. Convert the JSON file to base64:
   ```bash
   base64 -w 0 google-services.json
   ```
6. Add the base64 string to GitLab CI/CD variables

### 3. Android Keystore
1. Generate a release keystore:
   ```bash
   keytool -genkey -v -keystore release.keystore -alias tiyeni -keyalg RSA -keysize 2048 -validity 10000
   ```
2. Convert to base64:
   ```bash
   base64 -w 0 release.keystore
   ```
3. Add to GitLab CI/CD variables

### 4. Apple ID for iOS
1. Create an Apple Developer account
2. Add your Apple ID and app-specific password
3. Add to GitLab CI/CD variables

## Pipeline Stages

### 1. Validate
- Type checking
- Linting
- Security scanning
- Dependency checking

### 2. Test
- Unit tests
- Integration tests
- Performance tests

### 3. Build
- Android APK
- iOS IPA (tags only)
- Web build

### 4. Deploy
- Staging deployment (develop branch)
- Production deployment (main branch)

## Branch Strategy

- **main**: Production deployments
- **develop**: Staging deployments
- **feature/***: Feature branches (validate and test only)
- **tags**: Production releases with iOS builds

## Manual Triggers

Some jobs require manual triggering for safety:
- `build_android`: Android APK builds
- `build_ios`: iOS IPA builds
- `deploy_staging`: Staging deployment
- `deploy_production`: Production deployment

## Monitoring

### 1. Pipeline Status
- Check GitLab CI/CD > Pipelines
- Monitor job logs and artifacts

### 2. Artifacts
- APK files: Available for 1 week
- IPA files: Available for 1 week
- Test reports: Available for 1 week
- Documentation: Available for 1 week

## Troubleshooting

### Common Issues

#### 1. Cache Issues
```bash
# Clear GitLab Runner cache
gitlab-runner cache clear
```

#### 2. Build Failures
- Check environment variables
- Verify dependency versions
- Review build logs

#### 3. Deployment Issues
- Verify Render API key
- Check service IDs
- Review deployment logs

### Debug Commands

#### 1. Local Testing
```bash
# Test locally before pushing
npm run typecheck
npm run test
npm run build
```

#### 2. Pipeline Debugging
```bash
# Run specific job locally
gitlab-runner exec docker build_android
```

## Migration from GitHub Actions

### Changes Made
1. Replaced `.github/workflows/` with `.gitlab-ci.yml`
2. Updated environment variable names
3. Changed artifact handling
4. Modified deployment strategy

### Benefits
- Better integration with GitLab
- More flexible caching
- Improved artifact management
- Enhanced security features

## Security Considerations

### 1. Variable Protection
- Mark sensitive variables as **Protected**
- Enable **Masked** for secrets
- Use variable groups for organization-wide secrets

### 2. Access Control
- Limit who can trigger deployments
- Use protected branches
- Implement approval rules

### 3. Audit Trail
- Monitor pipeline executions
- Review variable access logs
- Track deployment history

## Performance Optimization

### 1. Caching Strategy
- Node modules caching
- Build artifact caching
- Dependency caching

### 2. Parallel Execution
- Run tests in parallel
- Build multiple platforms simultaneously
- Optimize job dependencies

### 3. Resource Management
- Use appropriate runner sizes
- Monitor resource usage
- Optimize Docker images

## Next Steps

1. **Set up GitLab project** if not already done
2. **Add CI/CD variables** as listed above
3. **Test pipeline** on a feature branch
4. **Merge to develop** for staging deployment
5. **Deploy to production** when ready

## Support

For issues with:
- **GitLab CI/CD**: Check GitLab documentation
- **Render deployment**: Review Render docs
- **Mobile builds**: Consult Expo documentation
- **General issues**: Check pipeline logs and artifacts
