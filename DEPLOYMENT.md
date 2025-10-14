# Thryvin Deployment Guide

## Environment Variables Required

### Backend (.env)
```
DATABASE_URL=your_postgresql_database_url
OPENAI_API_KEY=your_openai_api_key
AUTH_SECRET=your_auth_secret
COOKIE_SECRET=your_cookie_secret
NODE_ENV=production
AI_ENABLED=true
COACH_ENABLED=true
SOCIAL_ENABLED=true
AWARDS_ENABLED=true
STATS_ENABLED=true
NUTRITION_PRO=false
```

### Frontend (apps/native/.env)
```
EXPO_PUBLIC_API_URL=your_backend_deployment_url
EXPO_PUBLIC_ENV=production
```

## Deployment Steps

1. Configure environment variables in your deployment platform
2. Set `DATABASE_URL` to your production PostgreSQL database
3. Set `OPENAI_API_KEY` for AI workout generation
4. Set `EXPO_PUBLIC_API_URL` to your deployed backend URL
5. Deploy backend first, then frontend

## Local Development

Your local `.env` files are gitignored and contain your development credentials.
Use the `.env.example` files as templates for production deployment.

## Security Notes

- Never commit `.env` files to git
- Use environment variable injection in production
- Keep API keys secure and rotate regularly