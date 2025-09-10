# Mental Health Agent Service

This microservice provides mental health wellness tools, mood tracking, and meditation guidance as part of the Healthy Lifestyle Advisor application.

## Architecture Overview

The Mental Health Agent consists of:

1. **Backend API Service** - A FastAPI-based service providing mental health endpoints
2. **Frontend UI** - A static HTML/JS interface for accessing mental health tools

## Features

- **Mood Tracking**: Track and analyze your moods over time
- **Wellness Tools**:
  - Grounding techniques for anxiety
  - Gratitude prompts for positive thinking
- **Meditation Guidance**: Get personalized meditation suggestions

## Running the Service

### Using Docker

The entire application stack can be started using Docker Compose:

```bash
# From the root directory
cd aiservices
docker-compose up -d mental_health_service mental_health_frontend
```

### Running Independently

You can also run the services independently:

#### Backend Service

```bash
# From the mentalhealthaiservices directory
pip install -r requirements.txt
uvicorn main:app --host 0.0.0.0 --port 8001
```

#### Frontend Service

```bash
# From the Mentalhealthfrontend directory
node server.js
```

## API Endpoints

The service provides several REST API endpoints:

- `GET /api/mental-health/wellness/grounding-technique` - Get grounding techniques for anxiety
- `GET /api/mental-health/wellness/gratitude-prompt` - Get gratitude prompts
- `POST /api/mental-health/meditation/suggest` - Get meditation suggestions
- `POST /api/mental-health/analyze-mood` - Track and analyze mood

## Accessing the UI

The mental health frontend is accessible at:

- **When running with Docker**: http://localhost:5175
- **When running locally**: http://localhost:5175

## Integration with Main Application

The mental health service is integrated with the main Healthy Lifestyle Advisor application through a link in the main navigation. Users can access the mental health tools by clicking the "Mental Health" link in the main application's navigation bar.

## Troubleshooting

If you encounter issues:

1. Check that all services are running: `docker-compose ps`
2. View logs: `docker-compose logs mental_health_service`
3. Ensure ports 8002 and 5175 are available on your system
