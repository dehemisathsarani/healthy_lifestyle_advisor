# Healthy Lifestyle Advisor 🥗🏋️🧠

A web-based AI-powered healthy lifestyle advisor. This system integrates **Diet, Fitness, Mental Health, and Data Security Agents** to provide personalized recommendations for diet, exercise, and mental wellness.

---

## 🎯 Key Features

- **Diet Agent:** Food recognition, BMI/TDEE calculation, calorie tracking, macro breakdown, hydration reminders.
- **Fitness Agent:** Smart workout planner, activity tracking, fitness trend predictions, gamification.
- **Mental Health Agent:** Mood analysis, stress/fatigue prediction, meditation/breathing suggestions, journaling, AI companion chat.
- **Data & Security Agent:** AES/RSA encryption, JWT/OAuth2 authentication, GDPR-compliant data management, secure backups.

---

## 🖥️ Frontend

- **Stack:** React + Vite + Tailwind CSS  
- **Progressive Web App:** Mobile-first, cross-platform  
- **Real-time updates:** WebSocket integration for alerts and notifications

---

## 🏗️ Backend

- **Architecture:** Microservices (each AI agent as a separate service)  
- **APIs:** REST API for communication, optionally gRPC for performance  
- **Message Broker:** RabbitMQ or Kafka for asynchronous agent communication  
- **Load Balancer & API Gateway:** Centralized routing, authentication, and rate-limiting  

---

## 🔐 Security & Privacy

- Multi-layered security:
  - AES/RSA encryption for sensitive data  
  - OAuth2/JWT authentication  
  - Role-based access control (RBAC)  
- GDPR-like features: Right to forget, data privacy preferences  
- Secure backups: Cloud + Local storage

---

## 🌐 Integrations

- **AI Services:** Google Vision API, nutrition datasets  
- **Wearables:** Fitbit, Apple Health, Google Fit  
- **External APIs:** Weather, nutrition info  
- **Real-time:** WebSocket for instant alerts  
- **Caching:** Redis

---

## 🗄️ Databases

- **PostgreSQL:** Transactional data  
- **MongoDB:** Analytics & user logs  
- **InfluxDB:** Time-series health metrics  
- **Object storage:** Media files, ML model outputs  

---

## 🤖 ML / AI Components

- **Diet Agent:** CNN-based food recognition, calorie & nutrient calculations  
- **Fitness Agent:** Predictive models for workouts & fitness trends  
- **Mental Health Agent:** Mood analysis, NLP for AI companion, stress prediction  
- **Pipeline:** TensorFlow / PyTorch for training, online inference via APIs

---

## 📨 Communication Between Agents

- **Middleware:** RabbitMQ / Kafka  
- **Protocols:** REST APIs / gRPC / WebSockets  
- **Data Format:** JSON (or Protocol Buffers for gRPC)  

---

## 🏗️ System Architecture Diagram

```mermaid
graph TD
    %% Frontend Layer
    FE1["React + Vite + Tailwind CSS"]
    FE2["PWA Mobile App"]
    FE3["React Native Mobile App"]

    %% Backend Layer
    BE1["API Gateway"]
    BE2["Load Balancer"]
    Diet["Diet Agent"]
    Fitness["Fitness Agent"]
    Mental["Mental Health Agent"]
    Security["Data & Security Agent"]
    MB["Message Broker (RabbitMQ/Kafka)"]

    %% ML / AI Pipeline
    CNN["Food Recognition CNN"]
    BMR["BMI & Calorie Calculator"]
    MacroCalc["Macro Nutrient Tracker"]
    FitnessModel["Fitness Prediction Model"]
    NLP["Mental Health NLP Model"]

    %% Integrations & External Services
    GoogleVision["Google Vision API"]
    NutritionDB["Nutrition Database"]
    Wearables["Fitbit / Apple Health / Google Fit"]
    WeatherAPI["Weather API"]

    %% Gamification / UX Features
    Achievements["Achievement Badges"]
    Notifications["Real-time Alerts"]
    MotivationalQuotes["Daily Motivational Quotes"]
    Journaling["Mood / Journal Tracking"]

    %% Databases
    PG["PostgreSQL"]
    MG["MongoDB"]
    IF["InfluxDB"]
    FS["Object Storage"]
    Redis["Redis - caching"]

    %% DevOps / Docker Setup
    Docker["Docker Containers"]
    Kubernetes["Kubernetes Orchestration"]
    CI_CD["CI/CD Pipelines"]
    Monitoring["Prometheus + Grafana"]

    %% Frontend -> Backend
    FE1 --> BE1
    FE2 --> BE1
    FE3 --> BE1

    %% Backend routing to agents
    BE1 --> BE2
    BE2 --> Diet
    BE2 --> Fitness
    BE2 --> Mental
    BE2 --> Security

    %% Agents -> Message Broker (async)
    Diet --> MB
    Fitness --> MB
    Mental --> MB
    Security --> MB
    MB --> Diet
    MB --> Fitness
    MB --> Mental
    MB --> Security

    %% Agents -> ML / AI
    Diet --> CNN
    Diet --> BMR
    Diet --> MacroCalc
    Fitness --> FitnessModel
    Mental --> NLP

    %% Agents -> Integrations
    Diet --> GoogleVision
    Diet --> NutritionDB
    Diet --> Wearables
    Fitness --> Wearables
    Fitness --> WeatherAPI

    %% Mental Health -> Gamification
    Mental --> Achievements
    Mental --> Notifications
    Mental --> MotivationalQuotes
    Mental --> Journaling

    %% Security Agent -> Databases
    Security --> PG
    Security --> MG
    Security --> IF
    Security --> FS
    Security --> Redis

    %% DevOps / Docker -> Backend & Databases
    Docker --> BE2
    Kubernetes --> Docker
    CI_CD --> BE2
    Monitoring --> BE2
    Monitoring --> PG
    Monitoring --> MG
    Monitoring --> IF
    Monitoring --> FS
