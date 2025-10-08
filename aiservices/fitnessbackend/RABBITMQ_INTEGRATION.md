Fitness Backend RabbitMQ Integration

Overview

This file explains how the Fitness backend integrates with the Diet Agent via RabbitMQ. The Diet Agent publishes messages to the `diet_agent_exchange` exchange using routing keys such as `nutrition.update`, `notifications.achievement`, etc. The Fitness backend consumes messages from queues bound to this exchange and triggers fitness actions.

Configuration

- Ensure RabbitMQ is running and accessible (see `aiservices/.env` and top-level `docker-compose.yml`).
- Environment variable used: `RABBITMQ_URL` (for example `amqp://guest:guest@rabbitmq:5672/`).
- The Fitness backend expects the following queue names (declared and bound at startup):
  - `nutrition_updates` (value taken from `settings.NUTRITION_QUEUE`)
  - `notifications`

How it works

- Diet Agent publishes to `diet_agent_exchange` with topic routing keys like `nutrition.update`, `nutrition.hydration`, `notifications.achievement`, etc.
- The Fitness backend declares queues and binds them to the exchange with `nutrition.*` and `notifications.*` routing keys.
- A `rabbitmq_client` in `aiservices/fitnessbackend/mq.py` consumes messages and dispatches them to registered handlers.
- Handlers are registered in `aiservices/fitnessbackend/main.py` during FastAPI startup. Example handlers:
  - `nutrition_handler` — stores a `nutrition_logs` entry and updates `user_profiles` with last meal calories.
  - `notifications_handler` — awards XP to users for achievements and stores notification info.

Testing locally (Python example)

Use this small publisher script to send a test nutrition update:

```python
# publish_test.py
import asyncio
import aio_pika
import json

RABBITMQ_URL = "amqp://guest:guest@localhost:5672/"

async def publish():
    connection = await aio_pika.connect_robust(RABBITMQ_URL)
    channel = await connection.channel()
    exchange = await channel.declare_exchange("diet_agent_exchange", aio_pika.ExchangeType.TOPIC, durable=True)

    message = {
        "user_id": "test_user_123",
        "nutrition_data": {"calories": 550, "protein_g": 30, "fat_g": 20},
        "request_id": "test_1"
    }

    await exchange.publish(
        aio_pika.Message(json.dumps(message).encode(), delivery_mode=aio_pika.DeliveryMode.PERSISTENT),
        routing_key="nutrition.update"
    )

    await connection.close()

if __name__ == '__main__':
    asyncio.run(publish())
```

Use `docker-compose` RabbitMQ management UI at `http://localhost:15672` (guest/guest) to inspect exchanges/queues.

Notes & Next Steps

- Handlers are simple examples; extend them to call actual fitness logic (workout adjustments, recovery scheduling, push notifications).
- Consider adding authentication/authorization for messages or an internal API for more structured interactions.
- For high-throughput scenarios, consider dedicated worker processes for consuming and processing messages.

Run the Fitness backend locally (for frontend integration)

- Start the fitness backend on port 8002 so the main web app can target it from the browser. From the `aiservices/fitnessbackend` folder:

```powershell
cd aiservices/fitnessbackend
python -m uvicorn main:app --reload --host 0.0.0.0 --port 8002
```

- Ensure the frontend `VITE_FITNESS_API_URL` points to `http://localhost:8002`. The project `frontend/.env` includes this value by default.

- In the browser, open the main web app (usually http://localhost:5174) and navigate to the Fitness Planner page. The frontend will use the configured fitness API base for real API calls when available.
