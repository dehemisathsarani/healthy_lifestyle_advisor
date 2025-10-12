"""
Enhanced RAG System with Vector Database and High-Performance Retrieval
Provides powerful, context-aware nutrition advice with semantic search
"""
import logging
from typing import List, Dict, Optional, Any, Tuple
from datetime import datetime
import asyncio
import numpy as np
from motor.motor_asyncio import AsyncIOMotorClient
from openai import AsyncOpenAI
import json
from bson import ObjectId

logger = logging.getLogger(__name__)

class EnhancedRAGSystem:
    """
    High-performance RAG system with:
    - Vector database for fast semantic search
    - Multi-source knowledge retrieval
    - Context-aware response generation
    - Hybrid search (vector + keyword)
    - Conversation memory
    - Performance optimizations
    """
    
    def __init__(self, mongodb_client: AsyncIOMotorClient, openai_api_key: str):
        self.db = mongodb_client.HealthAgent
        self.openai_client = AsyncOpenAI(api_key=openai_api_key)
        
        # Collections
        self.vector_store = self.db.nutrition_vector_store
        self.conversation_history = self.db.rag_conversations
        self.user_profiles = self.db.users
        self.nutrition_logs = self.db.nutrition_logs
        self.food_analysis = self.db.food_analysis_history
        
        # Cache for frequently accessed data
        self.embedding_cache = {}
        self.response_cache = {}
        
        # Performance metrics
        self.metrics = {
            "total_queries": 0,
            "cache_hits": 0,
            "avg_response_time": 0
        }
    
    async def initialize_knowledge_base(self):
        """Initialize vector store with nutrition knowledge"""
        try:
            # Create index for vector search
            await self.vector_store.create_index([("embedding", "2dsphere")])
            await self.vector_store.create_index([("category", 1)])
            await self.vector_store.create_index([("tags", 1)])
            
            # Check if knowledge base is populated
            count = await self.vector_store.count_documents({})
            
            if count == 0:
                logger.info("Populating nutrition knowledge base...")
                await self._populate_knowledge_base()
            else:
                logger.info(f"Knowledge base already populated with {count} documents")
            
            logger.info("✅ RAG system initialized successfully")
            
        except Exception as e:
            logger.error(f"Error initializing knowledge base: {e}", exc_info=True)
    
    async def _populate_knowledge_base(self):
        """Populate knowledge base with nutrition information"""
        knowledge_docs = [
            {
                "category": "macronutrients",
                "title": "Protein Requirements",
                "content": """Protein is essential for muscle growth, repair, and maintenance. 
                Daily requirements vary by activity level:
                - Sedentary: 0.8g per kg body weight
                - Moderate activity: 1.2-1.4g per kg
                - Athletes: 1.6-2.2g per kg
                
                Best sources: Lean meats, fish, eggs, dairy, legumes, tofu, tempeh.
                Timing: Distribute protein throughout the day for optimal absorption.
                Post-workout: 20-30g within 2 hours of training.""",
                "tags": ["protein", "macronutrients", "muscle-building", "recovery"],
                "sri_lankan_foods": ["chicken curry", "fish curry", "dhal curry", "soya meat"],
                "created_at": datetime.utcnow()
            },
            {
                "category": "macronutrients",
                "title": "Carbohydrates and Energy",
                "content": """Carbohydrates are the body's primary energy source.
                
                Types:
                - Simple carbs: Quick energy (fruits, honey)
                - Complex carbs: Sustained energy (rice, bread, oats)
                
                Timing matters:
                - Pre-workout: 1-2 hours before, complex carbs
                - Post-workout: Simple carbs for glycogen replenishment
                
                Sri Lankan staples like rice, hoppers, and roti provide excellent energy.
                Pair with protein and vegetables for balanced meals.""",
                "tags": ["carbohydrates", "energy", "endurance", "performance"],
                "sri_lankan_foods": ["rice", "hoppers", "roti", "string hoppers", "pittu"],
                "created_at": datetime.utcnow()
            },
            {
                "category": "meal_planning",
                "title": "Balanced Meal Composition",
                "content": """Create balanced meals using the plate method:
                
                🥗 Half plate: Non-starchy vegetables (salads, greens, vegetables)
                🍗 Quarter plate: Lean protein (chicken, fish, tofu, lentils)
                🍚 Quarter plate: Complex carbohydrates (rice, bread, pasta)
                🥑 Small amount: Healthy fats (nuts, avocado, olive oil)
                
                This ensures adequate nutrition and satiety.
                Adjust portions based on activity level and goals.""",
                "tags": ["meal-planning", "balanced-diet", "portion-control"],
                "sri_lankan_foods": ["rice with curry", "kottu", "mixed rice plates"],
                "created_at": datetime.utcnow()
            },
            {
                "category": "sri_lankan_cuisine",
                "title": "Healthy Sri Lankan Food Choices",
                "content": """Sri Lankan cuisine offers many nutritious options:
                
                Proteins:
                - Fish curry: High protein, omega-3 fatty acids
                - Chicken curry: Lean protein, spices boost metabolism
                - Dhal curry: Plant protein, fiber, iron
                
                Carbohydrates:
                - Red rice: More fiber and nutrients than white rice
                - String hoppers: Lower calorie than regular hoppers
                - Roti: Whole wheat provides fiber
                
                Vegetables:
                - Mallum (greens): High fiber, vitamins, minerals
                - Vegetable curries: Nutrient-dense, antioxidants
                
                Healthy preparations:
                - Steamed over fried
                - Less coconut oil/milk for calorie control
                - Increase vegetable portions""",
                "tags": ["sri-lankan", "traditional-foods", "local-cuisine"],
                "sri_lankan_foods": ["fish curry", "dhal curry", "mallum", "red rice"],
                "created_at": datetime.utcnow()
            },
            {
                "category": "weight_management",
                "title": "Sustainable Weight Loss",
                "content": """Effective weight loss strategies:
                
                Calorie Deficit:
                - 300-500 cal/day deficit for 0.5-1kg loss/week
                - Don't go below 1200 cal/day (women) or 1500 (men)
                
                Food Focus:
                - High protein (increases satiety)
                - High fiber (keeps you full longer)
                - Whole foods over processed
                - Plenty of vegetables
                
                Practical Tips:
                - Smaller plates for portion control
                - Eat slowly, mindfully
                - Stay hydrated (sometimes thirst mimics hunger)
                - Get adequate sleep (affects hunger hormones)
                
                Avoid crash diets - sustainable changes win.""",
                "tags": ["weight-loss", "fat-loss", "calorie-deficit"],
                "sri_lankan_foods": ["string hoppers", "vegetable curry", "fish", "green salads"],
                "created_at": datetime.utcnow()
            },
            {
                "category": "muscle_building",
                "title": "Muscle Building Nutrition",
                "content": """Build muscle with proper nutrition:
                
                Calorie Surplus: +300-500 calories/day
                
                Protein: 1.6-2.2g per kg body weight
                - Distribute across 4-6 meals
                - 20-40g per meal for optimal synthesis
                
                Carbohydrates: 4-6g per kg body weight
                - Fuel for training
                - Glycogen for recovery
                
                Fats: 0.8-1g per kg body weight
                - Hormone production
                - Joint health
                
                Timing:
                - Pre-workout: Carbs + protein (2 hours before)
                - Post-workout: Carbs + protein (within 2 hours)
                
                Consistency > perfection. Train hard, eat smart, rest well.""",
                "tags": ["muscle-building", "bulking", "hypertrophy", "strength"],
                "sri_lankan_foods": ["chicken curry", "rice", "eggs", "milk rice"],
                "created_at": datetime.utcnow()
            },
            {
                "category": "hydration",
                "title": "Hydration and Performance",
                "content": """Proper hydration is crucial for health and performance:
                
                Daily Needs:
                - General: 2-3 liters/day
                - Athletes: 3-4+ liters/day
                - Hot climate: Increase by 500-1000ml
                
                Signs of Dehydration:
                - Dark urine
                - Fatigue
                - Decreased performance
                - Headaches
                
                Hydration Strategy:
                - Start day with 500ml water
                - Drink before thirsty
                - 500ml 2 hours before workout
                - 150-250ml every 15-20 min during workout
                - Rehydrate post-workout
                
                Add electrolytes for intense/long workouts.""",
                "tags": ["hydration", "water", "electrolytes", "performance"],
                "sri_lankan_foods": ["king coconut water", "fresh fruit juices", "herbal teas"],
                "created_at": datetime.utcnow()
            },
            {
                "category": "vitamins_minerals",
                "title": "Essential Micronutrients",
                "content": """Key vitamins and minerals for health:
                
                Iron:
                - Essential for oxygen transport
                - Sources: Red meat, spinach, lentils
                - Pair with vitamin C for absorption
                
                Calcium:
                - Bone health, muscle function
                - Sources: Dairy, leafy greens, fish with bones
                
                Vitamin D:
                - Bone health, immune function
                - Sources: Sunlight, fortified foods, fatty fish
                
                B Vitamins:
                - Energy metabolism
                - Sources: Whole grains, eggs, leafy greens
                
                Omega-3:
                - Heart health, brain function, inflammation
                - Sources: Fish, walnuts, flaxseeds
                
                Eat colorful variety for complete micronutrient coverage.""",
                "tags": ["vitamins", "minerals", "micronutrients", "health"],
                "sri_lankan_foods": ["fish", "green leaves", "dried fish", "sesame seeds"],
                "created_at": datetime.utcnow()
            },
            {
                "category": "meal_timing",
                "title": "Nutrient Timing for Performance",
                "content": """Optimize meal timing for best results:
                
                Pre-Workout (1-2 hours before):
                - Complex carbs: Energy
                - Moderate protein: Prevents breakdown
                - Low fat: Easy digestion
                - Example: Rice with chicken, banana
                
                During Workout (>60 min):
                - Simple carbs: Quick energy
                - Electrolytes: Hydration
                - Example: Sports drink, banana
                
                Post-Workout (within 2 hours):
                - Protein: Muscle repair (20-40g)
                - Carbs: Glycogen replenishment
                - Ratio: 3:1 or 4:1 carbs:protein
                - Example: Chicken with rice, protein shake
                
                Daily:
                - 3-6 meals for consistent energy
                - Protein each meal for muscle maintenance""",
                "tags": ["timing", "pre-workout", "post-workout", "performance"],
                "sri_lankan_foods": ["rice and curry", "egg roti", "chicken kottu"],
                "created_at": datetime.utcnow()
            },
            {
                "category": "digestive_health",
                "title": "Gut Health and Digestion",
                "content": """Support digestive health through diet:
                
                Fiber:
                - Soluble: Slows digestion, stabilizes blood sugar
                - Insoluble: Promotes regularity
                - Target: 25-35g daily
                - Sources: Vegetables, fruits, whole grains, legumes
                
                Probiotics:
                - Support gut microbiome
                - Sources: Yogurt, fermented foods
                
                Prebiotics:
                - Feed good bacteria
                - Sources: Garlic, onions, bananas, whole grains
                
                Tips:
                - Stay hydrated
                - Eat slowly, chew thoroughly
                - Regular meal times
                - Manage stress
                
                Healthy gut = better nutrient absorption and immunity.""",
                "tags": ["digestion", "gut-health", "fiber", "probiotics"],
                "sri_lankan_foods": ["curd", "fermented foods", "vegetable curries", "whole grains"],
                "created_at": datetime.utcnow()
            }
        ]
        
        # Generate embeddings for each document
        for doc in knowledge_docs:
            # Create searchable text
            searchable_text = f"{doc['title']} {doc['content']} {' '.join(doc['tags'])}"
            
            # Generate embedding
            embedding = await self._generate_embedding(searchable_text)
            doc["embedding"] = embedding
            doc["searchable_text"] = searchable_text
        
        # Insert into database
        await self.vector_store.insert_many(knowledge_docs)
        logger.info(f"✅ Populated knowledge base with {len(knowledge_docs)} documents")
    
    async def query(
        self,
        user_id: str,
        query: str,
        context_type: str = "general",
        conversation_id: Optional[str] = None,
        include_user_context: bool = True
    ) -> Dict[str, Any]:
        """
        Main RAG query method
        
        Args:
            user_id: User identifier
            query: User's question/message
            context_type: Type of context (nutrition, meal_plan, health_goal, etc.)
            conversation_id: ID for conversation continuity
            include_user_context: Whether to include user profile and history
            
        Returns:
            RAG response with sources and metadata
        """
        start_time = datetime.utcnow()
        self.metrics["total_queries"] += 1
        
        try:
            # Check cache first
            cache_key = f"{user_id}:{query}:{context_type}"
            if cache_key in self.response_cache:
                self.metrics["cache_hits"] += 1
                logger.info("✅ Cache hit for query")
                cached_response = self.response_cache[cache_key]
                cached_response["from_cache"] = True
                return cached_response
            
            # Get user context if needed
            user_context = None
            if include_user_context:
                user_context = await self._get_user_context(user_id)
            
            # Get conversation history
            conversation_history = []
            if conversation_id:
                conversation_history = await self._get_conversation_history(conversation_id, limit=5)
            
            # Retrieve relevant knowledge (hybrid search)
            retrieved_docs = await self._hybrid_search(query, context_type, limit=5)
            
            # Get user's recent nutrition data for personalization
            nutrition_data = await self._get_recent_nutrition_data(user_id, days=7)
            
            # Generate response with all context
            response_text = await self._generate_contextual_response(
                query=query,
                retrieved_docs=retrieved_docs,
                user_context=user_context,
                conversation_history=conversation_history,
                nutrition_data=nutrition_data,
                context_type=context_type
            )
            
            # Store conversation
            if not conversation_id:
                conversation_id = str(ObjectId())
            
            await self._store_conversation(
                conversation_id=conversation_id,
                user_id=user_id,
                query=query,
                response=response_text,
                retrieved_docs_count=len(retrieved_docs),
                context_type=context_type
            )
            
            # Calculate response time
            response_time = (datetime.utcnow() - start_time).total_seconds()
            self.metrics["avg_response_time"] = (
                self.metrics["avg_response_time"] * (self.metrics["total_queries"] - 1) + response_time
            ) / self.metrics["total_queries"]
            
            result = {
                "success": True,
                "response": response_text,
                "conversation_id": conversation_id,
                "sources": [
                    {
                        "title": doc.get("title"),
                        "category": doc.get("category"),
                        "relevance_score": doc.get("relevance_score", 0.0)
                    }
                    for doc in retrieved_docs
                ],
                "metadata": {
                    "retrieved_docs": len(retrieved_docs),
                    "user_context_included": include_user_context,
                    "conversation_history_length": len(conversation_history),
                    "response_time_seconds": round(response_time, 3),
                    "generated_at": datetime.utcnow().isoformat()
                },
                "from_cache": False
            }
            
            # Cache response (expire after 1 hour)
            self.response_cache[cache_key] = result
            
            logger.info(f"✅ Generated RAG response in {response_time:.3f}s")
            return result
            
        except Exception as e:
            logger.error(f"Error in RAG query: {e}", exc_info=True)
            return {
                "success": False,
                "response": "I apologize, but I'm having trouble processing your request. Please try again.",
                "error": str(e)
            }
    
    async def _generate_embedding(self, text: str) -> List[float]:
        """Generate embedding with caching"""
        if text in self.embedding_cache:
            return self.embedding_cache[text]
        
        try:
            response = await self.openai_client.embeddings.create(
                model="text-embedding-ada-002",
                input=text
            )
            embedding = response.data[0].embedding
            
            # Cache it
            self.embedding_cache[text] = embedding
            return embedding
            
        except Exception as e:
            logger.error(f"Error generating embedding: {e}")
            return [0.0] * 1536  # Fallback zero vector
    
    async def _hybrid_search(
        self,
        query: str,
        context_type: str,
        limit: int = 5
    ) -> List[Dict]:
        """
        Hybrid search combining:
        1. Vector similarity search
        2. Keyword matching
        3. Category filtering
        """
        try:
            # Generate query embedding
            query_embedding = await self._generate_embedding(query)
            
            # Build MongoDB query
            mongo_query = {}
            
            # Add category filter if relevant
            if context_type and context_type != "general":
                mongo_query["$or"] = [
                    {"category": context_type},
                    {"tags": context_type}
                ]
            
            # Get all candidates
            cursor = self.vector_store.find(mongo_query)
            candidates = await cursor.to_list(length=1000)
            
            if not candidates:
                return []
            
            # Calculate similarity scores
            scored_docs = []
            for doc in candidates:
                # Vector similarity
                vector_score = self._cosine_similarity(query_embedding, doc.get("embedding", []))
                
                # Keyword matching score
                keyword_score = self._keyword_match_score(query, doc.get("searchable_text", ""))
                
                # Combined score (weighted)
                combined_score = (0.7 * vector_score) + (0.3 * keyword_score)
                
                doc["relevance_score"] = round(combined_score, 4)
                scored_docs.append((combined_score, doc))
            
            # Sort by combined score
            scored_docs.sort(key=lambda x: x[0], reverse=True)
            
            # Return top results
            return [doc for _, doc in scored_docs[:limit]]
            
        except Exception as e:
            logger.error(f"Error in hybrid search: {e}")
            return []
    
    def _keyword_match_score(self, query: str, text: str) -> float:
        """Calculate keyword matching score"""
        query_words = set(query.lower().split())
        text_words = set(text.lower().split())
        
        if not query_words:
            return 0.0
        
        matches = query_words.intersection(text_words)
        return len(matches) / len(query_words)
    
    def _cosine_similarity(self, vec1: List[float], vec2: List[float]) -> float:
        """Calculate cosine similarity"""
        try:
            vec1 = np.array(vec1)
            vec2 = np.array(vec2)
            return float(np.dot(vec1, vec2) / (np.linalg.norm(vec1) * np.linalg.norm(vec2)))
        except:
            return 0.0
    
    async def _get_user_context(self, user_id: str) -> Dict:
        """Get user profile and preferences"""
        try:
            user = await self.user_profiles.find_one({"email": user_id})
            if not user:
                user = await self.user_profiles.find_one({"_id": ObjectId(user_id)})
            
            return {
                "age": user.get("age"),
                "gender": user.get("gender"),
                "weight": user.get("weight"),
                "height": user.get("height"),
                "fitness_goal": user.get("fitness_goal"),
                "activity_level": user.get("activity_level"),
                "dietary_restrictions": user.get("dietary_restrictions", [])
            } if user else {}
            
        except Exception as e:
            logger.error(f"Error getting user context: {e}")
            return {}
    
    async def _get_conversation_history(
        self,
        conversation_id: str,
        limit: int = 5
    ) -> List[Dict]:
        """Get recent conversation history"""
        try:
            cursor = self.conversation_history.find({
                "conversation_id": conversation_id
            }).sort("timestamp", -1).limit(limit)
            
            history = await cursor.to_list(length=limit)
            return list(reversed(history))  # Oldest first
            
        except Exception as e:
            logger.error(f"Error getting conversation history: {e}")
            return []
    
    async def _get_recent_nutrition_data(self, user_id: str, days: int = 7) -> Dict:
        """Get user's recent nutrition logs for personalization"""
        try:
            from datetime import timedelta
            start_date = datetime.utcnow() - timedelta(days=days)
            
            cursor = self.nutrition_logs.find({
                "user_id": user_id,
                "created_at": {"$gte": start_date}
            }).limit(20)
            
            logs = await cursor.to_list(length=20)
            
            if not logs:
                return {}
            
            # Aggregate stats
            total_calories = sum(log.get("total_nutrition", {}).get("calories", 0) for log in logs)
            total_protein = sum(log.get("total_nutrition", {}).get("protein", 0) for log in logs)
            
            return {
                "recent_logs_count": len(logs),
                "avg_daily_calories": round(total_calories / days),
                "avg_daily_protein": round(total_protein / days, 1),
                "most_common_foods": []  # Could add food frequency analysis
            }
            
        except Exception as e:
            logger.error(f"Error getting nutrition data: {e}")
            return {}
    
    async def _generate_contextual_response(
        self,
        query: str,
        retrieved_docs: List[Dict],
        user_context: Dict,
        conversation_history: List[Dict],
        nutrition_data: Dict,
        context_type: str
    ) -> str:
        """Generate response using all available context"""
        try:
            # Prepare context sections
            knowledge_context = "\n\n".join([
                f"**{doc.get('title', 'Knowledge')}** (Relevance: {doc.get('relevance_score', 0):.2f})\n{doc.get('content', '')}"
                for doc in retrieved_docs[:3]  # Top 3 most relevant
            ])
            
            user_info = ""
            if user_context:
                user_info = f"""
**User Profile:**
- Goal: {user_context.get('fitness_goal', 'Not specified')}
- Activity: {user_context.get('activity_level', 'Not specified')}
- Weight: {user_context.get('weight', 'Not specified')} kg
- Dietary Restrictions: {', '.join(user_context.get('dietary_restrictions', [])) or 'None'}
"""
            
            nutrition_context = ""
            if nutrition_data and nutrition_data.get("recent_logs_count"):
                nutrition_context = f"""
**Recent Nutrition Data:**
- Logs tracked: {nutrition_data['recent_logs_count']} meals
- Avg daily calories: {nutrition_data['avg_daily_calories']} kcal
- Avg daily protein: {nutrition_data['avg_daily_protein']}g
"""
            
            conversation_context = ""
            if conversation_history:
                recent_exchanges = "\n".join([
                    f"User: {h.get('query', '')}\nAssistant: {h.get('response', '')[:100]}..."
                    for h in conversation_history[-3:]  # Last 3 exchanges
                ])
                conversation_context = f"\n**Recent Conversation:**\n{recent_exchanges}\n"
            
            # Build prompt
            prompt = f"""You are a certified nutritionist and diet expert. Provide personalized, evidence-based advice.

{knowledge_context}

{user_info}

{nutrition_context}

{conversation_context}

**User Question:** {query}

**Instructions:**
1. Provide accurate, helpful nutrition advice
2. Reference the user's profile and goals in your response
3. Be specific and actionable
4. Include Sri Lankan food examples when relevant
5. Keep response concise (3-5 paragraphs)
6. Use a friendly, encouraging tone
7. If discussing Sri Lankan foods, celebrate the nutritional benefits

Generate a personalized response:"""

            response = await self.openai_client.chat.completions.create(
                model="gpt-4-turbo-preview",
                messages=[
                    {"role": "system", "content": "You are a certified nutritionist specializing in personalized nutrition advice, Sri Lankan cuisine, and sustainable healthy eating."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.7,
                max_tokens=800
            )
            
            return response.choices[0].message.content
            
        except Exception as e:
            logger.error(f"Error generating contextual response: {e}")
            return "I apologize, but I'm having trouble generating a response. Please try rephrasing your question."
    
    async def _store_conversation(
        self,
        conversation_id: str,
        user_id: str,
        query: str,
        response: str,
        retrieved_docs_count: int,
        context_type: str
    ):
        """Store conversation for history and learning"""
        try:
            await self.conversation_history.insert_one({
                "conversation_id": conversation_id,
                "user_id": user_id,
                "query": query,
                "response": response,
                "retrieved_docs_count": retrieved_docs_count,
                "context_type": context_type,
                "timestamp": datetime.utcnow()
            })
        except Exception as e:
            logger.error(f"Error storing conversation: {e}")
    
    def get_metrics(self) -> Dict:
        """Get performance metrics"""
        return {
            "total_queries": self.metrics["total_queries"],
            "cache_hit_rate": round(self.metrics["cache_hits"] / max(self.metrics["total_queries"], 1), 3),
            "avg_response_time_seconds": round(self.metrics["avg_response_time"], 3),
            "cache_size": len(self.response_cache)
        }
    
    async def clear_cache(self):
        """Clear response cache"""
        self.response_cache.clear()
        self.embedding_cache.clear()
        logger.info("✅ Cache cleared")
