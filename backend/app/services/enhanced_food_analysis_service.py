"""
Enhanced Food Analysis Service with MongoDB Storage, Advanced AI Insights, and RAG Integration
"""
import logging
from datetime import datetime
from typing import Dict, List, Optional, Any
from motor.motor_asyncio import AsyncIOMotorClient
from openai import AsyncOpenAI
import json
import numpy as np
from bson import ObjectId

logger = logging.getLogger(__name__)

class EnhancedFoodAnalysisService:
    """
    Advanced food analysis service with:
    - MongoDB storage for all analysis data
    - Enhanced AI insights using GPT-4
    - RAG integration for contextual recommendations
    - Nutrition log integration
    - Vector embeddings for semantic search
    """
    
    def __init__(self, mongodb_client: AsyncIOMotorClient, openai_api_key: str):
        self.db = mongodb_client.HealthAgent
        self.openai_client = AsyncOpenAI(api_key=openai_api_key)
        
        # Collections
        self.food_analysis_collection = self.db.food_analysis_history
        self.nutrition_logs_collection = self.db.nutrition_logs
        self.food_knowledge_base = self.db.food_knowledge_base
        self.user_food_preferences = self.db.user_food_preferences
        
    async def analyze_food_with_storage(
        self,
        user_id: str,
        food_text: str,
        meal_type: Optional[str] = None,
        image_url: Optional[str] = None,
        user_context: Optional[Dict] = None
    ) -> Dict[str, Any]:
        """
        Analyze food and store results in MongoDB with enhanced AI insights
        
        Args:
            user_id: User identifier
            food_text: Text description of food
            meal_type: breakfast, lunch, dinner, snack
            image_url: Optional image URL for visual analysis
            user_context: User profile data for personalization
            
        Returns:
            Complete analysis with storage confirmation
        """
        try:
            # Step 1: Get food nutrition data
            food_items = await self._extract_food_items(food_text)
            
            # Step 2: Enrich with database knowledge
            enriched_items = await self._enrich_with_knowledge_base(food_items)
            
            # Step 3: Calculate nutrition totals
            total_nutrition = self._calculate_totals(enriched_items)
            
            # Step 4: Generate advanced AI insights using GPT-4
            ai_insights = await self._generate_advanced_ai_insights(
                enriched_items,
                total_nutrition,
                meal_type,
                user_context
            )
            
            # Step 5: Get RAG-powered recommendations
            rag_recommendations = await self._get_rag_recommendations(
                enriched_items,
                total_nutrition,
                user_context
            )
            
            # Step 6: Generate embeddings for semantic search
            embedding = await self._generate_food_embedding(food_text, enriched_items)
            
            # Step 7: Store complete analysis in MongoDB
            analysis_document = {
                "user_id": user_id,
                "timestamp": datetime.utcnow(),
                "food_text": food_text,
                "meal_type": meal_type,
                "food_items": [item.dict() if hasattr(item, 'dict') else item for item in enriched_items],
                "total_nutrition": total_nutrition,
                "ai_insights": ai_insights,
                "rag_recommendations": rag_recommendations,
                "embedding": embedding,
                "image_url": image_url,
                "user_context": user_context,
                "analysis_version": "v2.0_enhanced"
            }
            
            result = await self.food_analysis_collection.insert_one(analysis_document)
            analysis_id = str(result.inserted_id)
            
            logger.info(f"✅ Stored food analysis {analysis_id} for user {user_id}")
            
            # Step 8: Update user food preferences
            await self._update_user_preferences(user_id, enriched_items, meal_type)
            
            return {
                "success": True,
                "analysis_id": analysis_id,
                "food_items": enriched_items,
                "total_nutrition": total_nutrition,
                "ai_insights": ai_insights,
                "rag_recommendations": rag_recommendations,
                "stored_in_mongodb": True,
                "can_add_to_nutrition_log": True
            }
            
        except Exception as e:
            logger.error(f"Error in enhanced food analysis: {e}", exc_info=True)
            raise
    
    async def _extract_food_items(self, food_text: str) -> List[Dict]:
        """Extract and parse food items using GPT-4"""
        try:
            prompt = f"""Extract food items from the following text and provide structured nutrition data.

Text: "{food_text}"

For each food item, provide:
1. Food name
2. Estimated quantity
3. Calories
4. Protein (g)
5. Carbohydrates (g)
6. Fat (g)
7. Fiber (g)
8. Key vitamins and minerals
9. Food category (protein, carb, vegetable, fruit, dairy, etc.)
10. Is it a Sri Lankan traditional food?

Return as JSON array:
[{{"name": "...", "quantity": "...", "calories": ..., "protein": ..., "carbs": ..., "fat": ..., "fiber": ..., "vitamins": {{}}, "minerals": {{}}, "category": "...", "sri_lankan": true/false}}]

Be accurate and specific."""

            response = await self.openai_client.chat.completions.create(
                model="gpt-4-turbo-preview",
                messages=[
                    {"role": "system", "content": "You are a professional nutritionist and food analyst. Provide accurate, detailed nutrition data."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.3,
                max_tokens=1500
            )
            
            content = response.choices[0].message.content
            
            # Parse JSON from response
            if "```json" in content:
                content = content.split("```json")[1].split("```")[0].strip()
            elif "```" in content:
                content = content.split("```")[1].split("```")[0].strip()
            
            food_items = json.loads(content)
            logger.info(f"Extracted {len(food_items)} food items using GPT-4")
            return food_items
            
        except Exception as e:
            logger.error(f"Error extracting food items: {e}")
            # Fallback to basic parsing
            return self._basic_food_extraction(food_text)
    
    def _basic_food_extraction(self, food_text: str) -> List[Dict]:
        """Fallback basic food extraction"""
        foods = [f.strip() for f in food_text.split(',')]
        return [{
            "name": food,
            "quantity": "1 serving",
            "calories": 150,
            "protein": 10,
            "carbs": 20,
            "fat": 5,
            "fiber": 3,
            "vitamins": {},
            "minerals": {},
            "category": "unknown",
            "sri_lankan": False
        } for food in foods]
    
    async def _enrich_with_knowledge_base(self, food_items: List[Dict]) -> List[Dict]:
        """Enrich food items with data from knowledge base"""
        enriched = []
        
        for item in food_items:
            # Query knowledge base for this food
            kb_data = await self.food_knowledge_base.find_one({
                "$or": [
                    {"name": {"$regex": item["name"], "$options": "i"}},
                    {"aliases": {"$regex": item["name"], "$options": "i"}}
                ]
            })
            
            if kb_data:
                # Merge knowledge base data with extracted data
                item.update({
                    "confidence": 0.95,
                    "verified": True,
                    "kb_match": True,
                    "health_benefits": kb_data.get("health_benefits", []),
                    "allergens": kb_data.get("allergens", []),
                    "sri_lankan_context": kb_data.get("sri_lankan_context", "")
                })
                logger.info(f"Enriched '{item['name']}' with knowledge base data")
            else:
                item.update({
                    "confidence": 0.75,
                    "verified": False,
                    "kb_match": False
                })
            
            enriched.append(item)
        
        return enriched
    
    def _calculate_totals(self, food_items: List[Dict]) -> Dict[str, float]:
        """Calculate total nutrition from all food items"""
        totals = {
            "calories": 0,
            "protein": 0,
            "carbs": 0,
            "fat": 0,
            "fiber": 0,
            "vitamins": {},
            "minerals": {}
        }
        
        for item in food_items:
            totals["calories"] += item.get("calories", 0)
            totals["protein"] += item.get("protein", 0)
            totals["carbs"] += item.get("carbs", 0)
            totals["fat"] += item.get("fat", 0)
            totals["fiber"] += item.get("fiber", 0)
            
            # Aggregate vitamins
            for vitamin, value in item.get("vitamins", {}).items():
                totals["vitamins"][vitamin] = totals["vitamins"].get(vitamin, 0) + value
            
            # Aggregate minerals
            for mineral, value in item.get("minerals", {}).items():
                totals["minerals"][mineral] = totals["minerals"].get(mineral, 0) + value
        
        return totals
    
    async def _generate_advanced_ai_insights(
        self,
        food_items: List[Dict],
        total_nutrition: Dict,
        meal_type: Optional[str],
        user_context: Optional[Dict]
    ) -> Dict[str, Any]:
        """
        Generate comprehensive AI insights using GPT-4
        - Nutritional analysis
        - Health recommendations
        - Meal balance assessment
        - Personalized suggestions
        - Cultural context (Sri Lankan foods)
        """
        try:
            # Prepare context for GPT-4
            user_info = ""
            if user_context:
                user_info = f"""
User Profile:
- Age: {user_context.get('age', 'unknown')}
- Gender: {user_context.get('gender', 'unknown')}
- Weight: {user_context.get('weight', 'unknown')} kg
- Height: {user_context.get('height', 'unknown')} cm
- Fitness Goal: {user_context.get('fitness_goal', 'general health')}
- Activity Level: {user_context.get('activity_level', 'moderate')}
- Dietary Restrictions: {', '.join(user_context.get('dietary_restrictions', [])) or 'None'}
"""
            
            food_list = "\n".join([
                f"- {item['name']} ({item['quantity']}): {item['calories']} cal, {item['protein']}g protein, {item['carbs']}g carbs, {item['fat']}g fat"
                for item in food_items
            ])
            
            prompt = f"""Analyze this meal and provide comprehensive nutritional insights.

{user_info}

Meal Type: {meal_type or 'Not specified'}

Foods Consumed:
{food_list}

Total Nutrition:
- Calories: {total_nutrition['calories']} kcal
- Protein: {total_nutrition['protein']}g
- Carbohydrates: {total_nutrition['carbs']}g
- Fat: {total_nutrition['fat']}g
- Fiber: {total_nutrition['fiber']}g

Provide detailed analysis in JSON format:
{{
    "overall_rating": "excellent/good/fair/needs_improvement",
    "rating_score": 1-10,
    "nutritional_balance": {{
        "protein": "adequate/low/high",
        "carbs": "adequate/low/high",
        "fat": "adequate/low/high",
        "fiber": "adequate/low/high",
        "explanation": "..."
    }},
    "health_benefits": ["benefit 1", "benefit 2", ...],
    "concerns": ["concern 1", "concern 2", ...],
    "personalized_recommendations": ["recommendation 1", "recommendation 2", ...],
    "meal_timing_advice": "...",
    "portion_feedback": "...",
    "sri_lankan_context": "...",  // if applicable
    "complementary_foods": ["food 1", "food 2", ...],  // what to add
    "foods_to_reduce": ["food 1", "food 2", ...],  // what to reduce
    "hydration_reminder": "...",
    "macro_ratio": {{"protein": %, "carbs": %, "fat": %}},
    "calorie_assessment": {{
        "for_meal_type": "appropriate/too_high/too_low",
        "reasoning": "..."
    }},
    "long_term_impact": "...",
    "cultural_appreciation": "..."  // acknowledge Sri Lankan foods positively
}}

Be encouraging, specific, and actionable. Focus on sustainable healthy eating."""

            response = await self.openai_client.chat.completions.create(
                model="gpt-4-turbo-preview",
                messages=[
                    {"role": "system", "content": "You are a certified nutritionist specializing in personalized diet analysis, Sri Lankan cuisine, and sustainable healthy eating habits."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.7,
                max_tokens=2000
            )
            
            content = response.choices[0].message.content
            
            # Parse JSON
            if "```json" in content:
                content = content.split("```json")[1].split("```")[0].strip()
            elif "```" in content:
                content = content.split("```")[1].split("```")[0].strip()
            
            insights = json.loads(content)
            
            # Add timestamp and version
            insights["generated_at"] = datetime.utcnow().isoformat()
            insights["ai_model"] = "gpt-4-turbo-preview"
            insights["analysis_type"] = "advanced"
            
            logger.info(f"Generated advanced AI insights with rating: {insights.get('rating_score', 'N/A')}/10")
            return insights
            
        except Exception as e:
            logger.error(f"Error generating AI insights: {e}", exc_info=True)
            return self._fallback_insights(total_nutrition)
    
    def _fallback_insights(self, total_nutrition: Dict) -> Dict:
        """Fallback insights if AI generation fails"""
        return {
            "overall_rating": "good",
            "rating_score": 7,
            "nutritional_balance": {
                "protein": "adequate",
                "carbs": "adequate",
                "fat": "adequate",
                "fiber": "adequate",
                "explanation": "Balanced meal with good macronutrient distribution."
            },
            "health_benefits": [
                "Provides energy for daily activities",
                "Supports muscle maintenance",
                "Contains essential nutrients"
            ],
            "concerns": [],
            "personalized_recommendations": [
                "Maintain consistent meal timing",
                "Stay hydrated throughout the day",
                "Include variety in your diet"
            ],
            "generated_at": datetime.utcnow().isoformat(),
            "ai_model": "fallback",
            "analysis_type": "basic"
        }
    
    async def _get_rag_recommendations(
        self,
        food_items: List[Dict],
        total_nutrition: Dict,
        user_context: Optional[Dict]
    ) -> Dict[str, Any]:
        """
        Get RAG-powered recommendations using vector similarity search
        and retrieved knowledge
        """
        try:
            # Create query for RAG system
            query = f"Nutrition recommendations for meal with {total_nutrition['calories']} calories, "
            query += f"{total_nutrition['protein']}g protein, {total_nutrition['carbs']}g carbs, {total_nutrition['fat']}g fat"
            
            if user_context:
                query += f" for {user_context.get('fitness_goal', 'general health')} goal"
            
            # Generate query embedding
            query_embedding = await self._generate_text_embedding(query)
            
            # Search knowledge base using vector similarity
            similar_docs = await self._vector_similarity_search(query_embedding, limit=5)
            
            # Generate recommendations using retrieved context
            rag_response = await self._generate_rag_response(query, similar_docs, user_context)
            
            return {
                "recommendations": rag_response,
                "retrieved_docs": len(similar_docs),
                "rag_enabled": True,
                "generated_at": datetime.utcnow().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Error generating RAG recommendations: {e}")
            return {
                "recommendations": "Maintain a balanced diet with adequate protein, healthy fats, and complex carbohydrates.",
                "retrieved_docs": 0,
                "rag_enabled": False
            }
    
    async def _generate_text_embedding(self, text: str) -> List[float]:
        """Generate embedding for text using OpenAI"""
        try:
            response = await self.openai_client.embeddings.create(
                model="text-embedding-ada-002",
                input=text
            )
            return response.data[0].embedding
        except Exception as e:
            logger.error(f"Error generating embedding: {e}")
            # Return zero vector as fallback
            return [0.0] * 1536
    
    async def _generate_food_embedding(self, food_text: str, food_items: List[Dict]) -> List[float]:
        """Generate semantic embedding for food analysis"""
        combined_text = food_text + " " + " ".join([
            f"{item['name']} {item.get('category', '')}" for item in food_items
        ])
        return await self._generate_text_embedding(combined_text)
    
    async def _vector_similarity_search(self, query_embedding: List[float], limit: int = 5) -> List[Dict]:
        """Search knowledge base using cosine similarity"""
        try:
            # Get all documents with embeddings
            cursor = self.food_knowledge_base.find({"embedding": {"$exists": True}})
            docs = await cursor.to_list(length=1000)
            
            if not docs:
                return []
            
            # Calculate cosine similarity
            similarities = []
            for doc in docs:
                doc_embedding = doc.get("embedding", [])
                if doc_embedding:
                    similarity = self._cosine_similarity(query_embedding, doc_embedding)
                    similarities.append((similarity, doc))
            
            # Sort by similarity and return top results
            similarities.sort(key=lambda x: x[0], reverse=True)
            return [doc for _, doc in similarities[:limit]]
            
        except Exception as e:
            logger.error(f"Error in vector search: {e}")
            return []
    
    def _cosine_similarity(self, vec1: List[float], vec2: List[float]) -> float:
        """Calculate cosine similarity between two vectors"""
        try:
            vec1 = np.array(vec1)
            vec2 = np.array(vec2)
            return float(np.dot(vec1, vec2) / (np.linalg.norm(vec1) * np.linalg.norm(vec2)))
        except:
            return 0.0
    
    async def _generate_rag_response(
        self,
        query: str,
        retrieved_docs: List[Dict],
        user_context: Optional[Dict]
    ) -> str:
        """Generate response using retrieved context"""
        try:
            # Prepare context from retrieved documents
            context = "\n\n".join([
                f"**{doc.get('title', 'Knowledge')}:**\n{doc.get('content', '')}"
                for doc in retrieved_docs
            ])
            
            prompt = f"""Based on the following nutrition knowledge, provide personalized recommendations.

Retrieved Knowledge:
{context}

User Query: {query}

User Context: {json.dumps(user_context) if user_context else 'Not provided'}

Provide 3-5 specific, actionable recommendations."""

            response = await self.openai_client.chat.completions.create(
                model="gpt-4-turbo-preview",
                messages=[
                    {"role": "system", "content": "You are a nutrition expert providing evidence-based recommendations."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.7,
                max_tokens=500
            )
            
            return response.choices[0].message.content
            
        except Exception as e:
            logger.error(f"Error generating RAG response: {e}")
            return "Stay hydrated, eat balanced meals, and maintain regular eating schedule."
    
    async def _update_user_preferences(self, user_id: str, food_items: List[Dict], meal_type: Optional[str]):
        """Update user food preferences based on consumption patterns"""
        try:
            for item in food_items:
                await self.user_food_preferences.update_one(
                    {
                        "user_id": user_id,
                        "food_name": item["name"]
                    },
                    {
                        "$inc": {"consumption_count": 1},
                        "$set": {
                            "last_consumed": datetime.utcnow(),
                            "category": item.get("category"),
                            "meal_types": meal_type
                        },
                        "$setOnInsert": {
                            "created_at": datetime.utcnow()
                        }
                    },
                    upsert=True
                )
            logger.info(f"Updated food preferences for user {user_id}")
        except Exception as e:
            logger.error(f"Error updating preferences: {e}")
    
    async def add_to_nutrition_log(
        self,
        analysis_id: str,
        user_id: str,
        notes: Optional[str] = None,
        tags: Optional[List[str]] = None
    ) -> Dict[str, Any]:
        """
        Add analyzed food to nutrition log
        
        Args:
            analysis_id: ID of the food analysis
            user_id: User identifier
            notes: Optional user notes
            tags: Optional tags (e.g., 'pre-workout', 'cheat-meal')
            
        Returns:
            Nutrition log entry confirmation
        """
        try:
            # Get the analysis
            analysis = await self.food_analysis_collection.find_one({
                "_id": ObjectId(analysis_id),
                "user_id": user_id
            })
            
            if not analysis:
                raise ValueError(f"Analysis {analysis_id} not found for user {user_id}")
            
            # Create nutrition log entry
            log_entry = {
                "user_id": user_id,
                "analysis_id": analysis_id,
                "timestamp": analysis["timestamp"],
                "meal_type": analysis.get("meal_type"),
                "food_items": analysis["food_items"],
                "total_nutrition": analysis["total_nutrition"],
                "ai_insights_summary": {
                    "rating": analysis["ai_insights"].get("rating_score"),
                    "overall_rating": analysis["ai_insights"].get("overall_rating"),
                    "key_recommendations": analysis["ai_insights"].get("personalized_recommendations", [])[:3]
                },
                "notes": notes,
                "tags": tags or [],
                "created_at": datetime.utcnow()
            }
            
            result = await self.nutrition_logs_collection.insert_one(log_entry)
            log_id = str(result.inserted_id)
            
            logger.info(f"✅ Added analysis {analysis_id} to nutrition log {log_id}")
            
            return {
                "success": True,
                "log_id": log_id,
                "message": "Successfully added to nutrition log",
                "can_view_in_history": True
            }
            
        except Exception as e:
            logger.error(f"Error adding to nutrition log: {e}", exc_info=True)
            raise
    
    async def get_analysis_history(
        self,
        user_id: str,
        limit: int = 20,
        meal_type: Optional[str] = None,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None
    ) -> List[Dict]:
        """Get user's food analysis history with filtering"""
        try:
            query = {"user_id": user_id}
            
            if meal_type:
                query["meal_type"] = meal_type
            
            if start_date or end_date:
                query["timestamp"] = {}
                if start_date:
                    query["timestamp"]["$gte"] = start_date
                if end_date:
                    query["timestamp"]["$lte"] = end_date
            
            cursor = self.food_analysis_collection.find(query).sort("timestamp", -1).limit(limit)
            analyses = await cursor.to_list(length=limit)
            
            # Convert ObjectId to string
            for analysis in analyses:
                analysis["_id"] = str(analysis["_id"])
            
            return analyses
            
        except Exception as e:
            logger.error(f"Error getting analysis history: {e}")
            return []
    
    async def search_food_analyses(
        self,
        user_id: str,
        search_query: str,
        limit: int = 10
    ) -> List[Dict]:
        """Semantic search across user's food analyses"""
        try:
            # Generate query embedding
            query_embedding = await self._generate_text_embedding(search_query)
            
            # Get user's analyses with embeddings
            cursor = self.food_analysis_collection.find({
                "user_id": user_id,
                "embedding": {"$exists": True}
            })
            analyses = await cursor.to_list(length=1000)
            
            # Calculate similarities
            similarities = []
            for analysis in analyses:
                similarity = self._cosine_similarity(query_embedding, analysis["embedding"])
                similarities.append((similarity, analysis))
            
            # Sort and return top matches
            similarities.sort(key=lambda x: x[0], reverse=True)
            results = [analysis for _, analysis in similarities[:limit]]
            
            # Convert ObjectId
            for result in results:
                result["_id"] = str(result["_id"])
            
            return results
            
        except Exception as e:
            logger.error(f"Error in semantic search: {e}")
            return []
