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

    %% Flow connections

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
