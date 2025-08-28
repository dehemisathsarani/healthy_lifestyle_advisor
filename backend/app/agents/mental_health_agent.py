"""
Mental Health Agent for mood analysis, stress prediction, meditation suggestions, and AI companion chat
"""

from .base_agent import BaseAgent
from typing import Dict, Any, List, Optional
import asyncio
import json
from datetime import datetime, timedelta
import random
from ..core.uplift_apis import get_random_joke, get_random_activity
from ..core.wellness_support import get_box_breathing, get_grounding_technique as fetch_grounding_technique, get_gratitude_prompt as fetch_gratitude_prompt, get_wellness_routine as fetch_wellness_routine
from ..core.health_education import get_medication_info as fetch_medication_info, get_health_topic_info

class MentalHealthAgent(BaseAgent):
    """Agent responsible for mental health, mood tracking, and wellness recommendations"""
    
    def __init__(self):
        super().__init__("mental_health_agent", "Mental Health Agent")
        self.mood_history = {}
        self.stress_patterns = {}
        self.meditation_programs = []
        self.breathing_exercises = []
        self.journal_entries = {}
        self.companion_personality = "supportive"
        
    async def initialize(self) -> bool:
        """Initialize mental health agent resources"""
        try:
            self.set_status("initializing")
            
            # Load meditation programs
            await self._load_meditation_programs()
            
            # Load breathing exercises
            await self._load_breathing_exercises()
            
            # Initialize AI companion personality
            await self._initialize_companion()
            
            self.set_status("ready")
            self.logger.info("Mental Health Agent initialized successfully")
            return True
            
        except Exception as e:
            self.set_status("error")
            self.logger.error(f"Mental Health Agent initialization failed: {str(e)}")
            return False
    
    async def process_request(self, request: Dict[str, Any]) -> Dict[str, Any]:
        """Process mental health related requests"""
        try:
            self.set_status("processing")
            request_type = request.get("type", "").lower()
            user_id = request.get("user_id")
            
            self.logger.info(f"Processing mental health request: {request_type} for user: {user_id}")
            
            if request_type == "mood_analysis":
                return await self.analyze_mood(request.get("mood_data"), user_id)
            elif request_type == "stress_prediction":
                return await self.predict_stress(request.get("indicators"), user_id)
            elif request_type == "meditation_suggestion":
                return await self.suggest_meditation(request.get("preferences"), user_id)
            elif request_type == "breathing_exercise":
                return await self.get_breathing_exercise(request.get("difficulty", "beginner"))
            elif request_type == "journal_entry":
                return await self.process_journal_entry(request.get("entry"), user_id)
            elif request_type == "companion_chat":
                return await self.companion_chat(request.get("message"), user_id)
            elif request_type == "wellness_report":
                return await self.generate_wellness_report(user_id)
            elif request_type == "mood_tracking":
                return await self.track_mood(request.get("mood_score"), request.get("notes"), user_id)
            elif request_type == "mood_history":
                return await self.get_mood_history(user_id, request.get("days", 7))
            elif request_type == "grounding_technique":
                self.logger.info("Handling grounding_technique request")
                return await self.get_grounding_technique()
            elif request_type == "gratitude_prompt":
                self.logger.info("Handling gratitude_prompt request")
                return await self.get_gratitude_prompt()
            elif request_type == "wellness_routine":
                return await self.get_wellness_routine(request.get("area", "general"))
            elif request_type == "medication_info":
                return await self.get_medication_info(request.get("medication_name", ""))
            elif request_type == "health_topic":
                return await self.get_health_topic(request.get("topic", ""))
            else:
                self.logger.warning(f"Unknown request type: {request_type}")
                return {"error": f"Unknown request type for Mental Health Agent: {request_type}"}
                
        except Exception as e:
            self.logger.error(f"Error processing request: {str(e)}", exc_info=True)
            return {"error": f"Mental Health Agent failed to process request: {str(e)}"}
        finally:
            self.set_status("ready")
    
    async def analyze_mood(self, mood_data: Dict[str, Any], user_id: str) -> Dict[str, Any]:
        """Analyze user's mood based on various indicators"""
        try:
            # Extract mood indicators
            mood_score = mood_data.get("mood_score", 5)  # 1-10 scale
            emotions = mood_data.get("emotions", [])
            activities = mood_data.get("recent_activities", [])
            sleep_quality = mood_data.get("sleep_quality", 5)
            
            # Store mood data
            if user_id not in self.mood_history:
                self.mood_history[user_id] = []
            
            mood_entry = {
                "timestamp": datetime.now().isoformat(),
                "mood_score": mood_score,
                "emotions": emotions,
                "activities": activities,
                "sleep_quality": sleep_quality
            }
            self.mood_history[user_id].append(mood_entry)
            
            # Analyze mood trend
            mood_trend = await self._analyze_mood_trend(user_id)
            
            # Generate recommendations
            recommendations = await self._generate_mood_recommendations(mood_score, emotions)
            
            return {
                "current_mood": {
                    "score": mood_score,
                    "category": self._categorize_mood(mood_score),
                    "primary_emotions": emotions[:3] if emotions else ["neutral"]
                },
                "trend": mood_trend,
                "recommendations": recommendations,
                "timestamp": datetime.now().isoformat()
            }
            
        except Exception as e:
            self.logger.error(f"Mood analysis failed: {str(e)}")
            return {"error": "Failed to analyze mood"}
    
    async def predict_stress(self, indicators: Dict[str, Any], user_id: str) -> Dict[str, Any]:
        """Predict stress levels based on various indicators"""
        try:
            # Extract stress indicators
            heart_rate = indicators.get("heart_rate", 70)
            sleep_hours = indicators.get("sleep_hours", 8)
            workload = indicators.get("workload_level", 5)  # 1-10 scale
            social_interactions = indicators.get("social_interactions", 5)
            physical_symptoms = indicators.get("physical_symptoms", [])
            
            # Calculate stress score (simplified algorithm)
            stress_score = 0
            
            # Heart rate factor
            if heart_rate > 90:
                stress_score += 3
            elif heart_rate > 80:
                stress_score += 2
            elif heart_rate > 70:
                stress_score += 1
            
            # Sleep factor
            if sleep_hours < 6:
                stress_score += 3
            elif sleep_hours < 7:
                stress_score += 2
            elif sleep_hours < 8:
                stress_score += 1
            
            # Workload factor
            if workload > 8:
                stress_score += 3
            elif workload > 6:
                stress_score += 2
            elif workload > 4:
                stress_score += 1
            
            # Social interactions factor (isolation increases stress)
            if social_interactions < 3:
                stress_score += 2
            elif social_interactions < 5:
                stress_score += 1
            
            # Physical symptoms
            stress_score += len(physical_symptoms)
            
            # Normalize to 1-10 scale
            stress_level = min(10, max(1, stress_score))
            
            # Store stress data
            if user_id not in self.stress_patterns:
                self.stress_patterns[user_id] = []
            
            stress_entry = {
                "timestamp": datetime.now().isoformat(),
                "stress_level": stress_level,
                "indicators": indicators
            }
            self.stress_patterns[user_id].append(stress_entry)
            
            # Generate stress management recommendations
            stress_recommendations = await self._generate_stress_recommendations(stress_level)
            
            return {
                "stress_level": stress_level,
                "category": self._categorize_stress(stress_level),
                "risk_factors": await self._identify_risk_factors(indicators),
                "recommendations": stress_recommendations,
                "next_check_in": (datetime.now() + timedelta(hours=6)).isoformat()
            }
            
        except Exception as e:
            self.logger.error(f"Stress prediction failed: {str(e)}")
            return {"error": "Failed to predict stress"}
    
    async def suggest_meditation(self, preferences: Dict[str, Any], user_id: str) -> Dict[str, Any]:
        """Suggest meditation based on user preferences and current state"""
        try:
            duration = preferences.get("duration", 10)  # minutes
            focus_area = preferences.get("focus", "general")  # stress, anxiety, sleep, focus
            experience_level = preferences.get("experience", "beginner")
            
            # Filter meditation programs based on preferences
            suitable_meditations = []
            for meditation in self.meditation_programs:
                if (meditation["duration"] <= duration + 5 and 
                    meditation["duration"] >= duration - 5 and
                    meditation["experience_level"] == experience_level and
                    (focus_area == "general" or meditation["focus_area"] == focus_area)):
                    suitable_meditations.append(meditation)
            
            # If no exact match, get closest match
            if not suitable_meditations:
                suitable_meditations = [m for m in self.meditation_programs 
                                     if m["experience_level"] == experience_level]
            
            # Select a meditation program
            if suitable_meditations:
                selected = random.choice(suitable_meditations)
                
                return {
                    "meditation": {
                        "title": selected["title"],
                        "duration": selected["duration"],
                        "description": selected["description"],
                        "focus_area": selected["focus_area"],
                        "instructions": selected["instructions"]
                    },
                    "benefits": selected["benefits"],
                    "preparation_tips": [
                        "Find a quiet, comfortable space",
                        "Sit or lie down in a relaxed position",
                        "Turn off distractions (phone, TV)",
                        "Take a few deep breaths before starting"
                    ]
                }
            else:
                return {"error": "No suitable meditation found"}
                
        except Exception as e:
            self.logger.error(f"Meditation suggestion failed: {str(e)}")
            return {"error": "Failed to suggest meditation"}
    
    async def get_breathing_exercise(self, difficulty: str = "beginner") -> Dict[str, Any]:
        """Get breathing exercise based on difficulty level"""
        try:
            suitable_exercises = [ex for ex in self.breathing_exercises 
                                if ex["difficulty"] == difficulty]
            
            if suitable_exercises:
                exercise = random.choice(suitable_exercises)
                return {
                    "exercise": exercise,
                    "instructions": [
                        "Sit comfortably with your back straight",
                        "Place one hand on your chest, one on your belly",
                        "Follow the breathing pattern described",
                        "Focus on the rhythm and your breath"
                    ]
                }
            else:
                # Default 4-7-8 breathing exercise
                return {
                    "exercise": {
                        "name": "4-7-8 Breathing",
                        "pattern": "Inhale for 4, hold for 7, exhale for 8",
                        "duration": "5 minutes",
                        "repetitions": 4
                    },
                    "instructions": [
                        "Sit comfortably with your back straight",
                        "Inhale through nose for 4 counts",
                        "Hold your breath for 7 counts",
                        "Exhale through mouth for 8 counts",
                        "Repeat 4 times"
                    ]
                }
                
        except Exception as e:
            self.logger.error(f"Breathing exercise failed: {str(e)}")
            return {"error": "Failed to get breathing exercise"}
    
    async def process_journal_entry(self, entry: str, user_id: str) -> Dict[str, Any]:
        """Process and analyze journal entry"""
        try:
            if user_id not in self.journal_entries:
                self.journal_entries[user_id] = []
            
            # Store journal entry
            journal_entry = {
                "timestamp": datetime.now().isoformat(),
                "entry": entry,
                "word_count": len(entry.split()),
                "sentiment": await self._analyze_sentiment(entry)
            }
            self.journal_entries[user_id].append(journal_entry)
            
            # Generate insights
            insights = await self._generate_journal_insights(entry)
            
            return {
                "processed": True,
                "entry_id": len(self.journal_entries[user_id]),
                "insights": insights,
                "encouraging_message": "Thank you for sharing your thoughts. Journaling is a powerful tool for self-reflection and emotional growth.",
                "suggestions": [
                    "Try to write regularly, even if it's just a few sentences",
                    "Focus on your feelings and emotions, not just events",
                    "Use your journal to track patterns in your mood and behavior"
                ]
            }
            
        except Exception as e:
            self.logger.error(f"Journal processing failed: {str(e)}")
            return {"error": "Failed to process journal entry"}
    
    async def companion_chat(self, message: str, user_id: str) -> Dict[str, Any]:
        """AI companion chat for emotional support"""
        try:
            # Simple rule-based response system (can be enhanced with NLP)
            message_lower = message.lower()
            
            # Detect emotional keywords
            if any(word in message_lower for word in ["sad", "depressed", "down", "upset"]):
                response = "I can sense you're going through a difficult time. It's okay to feel sad sometimes. Would you like to try a breathing exercise or talk about what's bothering you?"
                
            elif any(word in message_lower for word in ["anxious", "worried", "nervous", "stress"]):
                response = "Anxiety can be overwhelming. Remember that you're stronger than you think. Let's try some grounding techniques - can you name 5 things you can see around you?"
                
            elif any(word in message_lower for word in ["happy", "great", "good", "wonderful"]):
                response = "I'm so glad to hear you're feeling positive! It's wonderful when we can appreciate the good moments. What's contributing to your happiness today?"
                
            elif any(word in message_lower for word in ["tired", "exhausted", "sleepy"]):
                response = "Being tired can affect our mental state. Have you been getting enough rest? I can suggest some relaxation techniques to help you unwind."
                
            elif "help" in message_lower:
                response = "I'm here to support you. I can help with mood tracking, meditation suggestions, breathing exercises, or just be here to listen. What would be most helpful right now?"
                
            else:
                # General supportive response
                responses = [
                    "I'm here to listen. Tell me more about what's on your mind.",
                    "Thank you for sharing with me. How are you feeling about this situation?",
                    "That sounds important to you. What emotions are you experiencing?",
                    "I appreciate you opening up. What would help you feel better right now?"
                ]
                response = random.choice(responses)
            
            return {
                "response": response,
                "companion_mood": "supportive",
                "suggested_actions": [
                    "Take a few deep breaths",
                    "Practice mindfulness",
                    "Consider journaling about this",
                    "Remember that this feeling will pass"
                ],
                "timestamp": datetime.now().isoformat()
            }
            
        except Exception as e:
            self.logger.error(f"Companion chat failed: {str(e)}")
            return {"error": "Failed to process companion chat"}
    
    async def track_mood(self, mood_score: int, notes: str, user_id: str) -> Dict[str, Any]:
        """Track daily mood score and notes"""
        try:
            if user_id not in self.mood_history:
                self.mood_history[user_id] = []
            
            mood_entry = {
                "timestamp": datetime.now().isoformat(),
                "mood_score": mood_score,
                "notes": notes,
                "date": datetime.now().strftime("%Y-%m-%d")
            }
            
            self.mood_history[user_id].append(mood_entry)
            
            # Calculate weekly average
            weekly_average = await self._calculate_weekly_mood_average(user_id)
            mood_trend = await self._get_mood_trend(user_id)
            
            response = {
                "tracked": True,
                "current_mood": mood_score,
                "weekly_average": weekly_average,
                "trend": mood_trend,
                "encouragement": self._get_mood_encouragement(mood_score)
            }
            
            # If mood is low (below 4 on a 1-10 scale), include uplift content
            if mood_score < 4:
                # Get jokes and activities to improve mood
                joke = await get_random_joke()
                activity = await get_random_activity()
                
                response["uplift"] = {
                    "needed": True,
                    "joke": joke,
                    "activity": activity,
                    "message": "I noticed you're feeling down. Here's something to brighten your day!"
                }
            
            return response
            
        except Exception as e:
            self.logger.error(f"Mood tracking failed: {str(e)}")
            return {"error": "Failed to track mood"}
    
    async def get_mood_history(self, user_id: str, days: int = 7) -> Dict[str, Any]:
        """Get mood history for the specified number of days"""
        try:
            if user_id not in self.mood_history:
                return {"history": []}
                
            # Get current date
            now = datetime.now()
            
            # Calculate the date 'days' days ago
            start_date = now - timedelta(days=days)
            
            # Filter mood entries within the date range
            filtered_history = []
            for entry in self.mood_history[user_id]:
                try:
                    entry_date = datetime.fromisoformat(entry.get("timestamp", ""))
                    if entry_date >= start_date:
                        filtered_history.append({
                            "date": entry.get("date", entry_date.strftime("%Y-%m-%d")),
                            "mood_score": entry.get("mood_score", 5),
                            "notes": entry.get("notes", "")
                        })
                except (ValueError, TypeError):
                    # Skip entries with invalid dates
                    continue
                    
            # Sort by date
            filtered_history.sort(key=lambda x: x["date"])
            
            return {
                "history": filtered_history,
                "range": f"{days}-day",
                "count": len(filtered_history)
            }
            
        except Exception as e:
            self.logger.error(f"Getting mood history failed: {str(e)}")
            return {"error": "Failed to retrieve mood history"}
            
    async def get_breathing_exercise(self, technique: str = "box", difficulty: str = "beginner") -> Dict[str, Any]:
        """
        Get breathing exercise instructions based on the requested technique
        
        Currently supports: box breathing (4-4-4-4)
        """
        try:
            if technique.lower() == "box":
                breathing_exercise = get_box_breathing()
                return {
                    "exercise": breathing_exercise,
                    "type": "box_breathing",
                    "timestamp": datetime.now().isoformat()
                }
            else:
                # Default to box breathing if the requested technique is not found
                breathing_exercise = get_box_breathing()
                return {
                    "exercise": breathing_exercise,
                    "type": "box_breathing",
                    "message": f"Technique '{technique}' not found. Providing box breathing instead.",
                    "timestamp": datetime.now().isoformat()
                }
                
        except Exception as e:
            self.logger.error(f"Error getting breathing exercise: {str(e)}")
            return {"error": "Failed to get breathing exercise"}
            
    async def get_grounding_technique(self) -> Dict[str, Any]:
        """
        Get 5-4-3-2-1 grounding technique for anxiety and stress
        """
        try:
            # Use the imported function with an alias to avoid recursive calls
            grounding_data = fetch_grounding_technique()
            
            # Return the data with a timestamp
            return {
                "technique": grounding_data,
                "type": "5-4-3-2-1_grounding",
                "timestamp": datetime.now().isoformat()
            }
                
        except Exception as e:
            self.logger.error(f"Error getting grounding technique: {str(e)}")
            return {"error": "Failed to get grounding technique"}
            
    async def get_gratitude_prompt(self) -> Dict[str, Any]:
        """
        Get a random gratitude prompt for reflection
        """
        try:
            # Use the imported function with an alias to avoid recursive calls
            gratitude_data = fetch_gratitude_prompt()
            
            # Return the data with a timestamp
            return {
                "prompt": gratitude_data,
                "type": "gratitude",
                "timestamp": datetime.now().isoformat()
            }
                
        except Exception as e:
            self.logger.error(f"Error getting gratitude prompt: {str(e)}")
            return {"error": "Failed to get gratitude prompt"}
            
    async def get_wellness_routine(self, area: str = "general") -> Dict[str, Any]:
        """
        Get wellness routine suggestions for different areas (sleep, nutrition, movement, social)
        """
        try:
            if area.lower() == "general":
                # Return all areas for a general request
                return {
                    "routines": {
                        "sleep": fetch_wellness_routine("sleep"),
                        "nutrition": fetch_wellness_routine("nutrition"),
                        "movement": fetch_wellness_routine("movement"),
                        "social": fetch_wellness_routine("social")
                    },
                    "type": "wellness_routines",
                    "timestamp": datetime.now().isoformat()
                }
            else:
                # Return specific area
                routine = fetch_wellness_routine(area)
                return {
                    "routine": routine,
                    "area": area,
                    "type": "wellness_routine",
                    "timestamp": datetime.now().isoformat()
                }
                
        except Exception as e:
            self.logger.error(f"Error getting wellness routine: {str(e)}")
            return {"error": "Failed to get wellness routine"}
            
    async def get_medication_info(self, medication_name: str) -> Dict[str, Any]:
        """
        Get evidence-based medication information from trusted sources
        
        Note: This is educational only, not medical advice
        """
        try:
            if not medication_name:
                return {"error": "Medication name is required"}
                
            # Get medication information from trusted sources
            medication_info = await fetch_medication_info(medication_name)
            
            # Add disclaimer
            medication_info["disclaimer"] = (
                "This information is for educational purposes only and not a substitute for professional medical advice. "
                "Always consult a healthcare provider about medications, side effects, and treatment options."
            )
            
            medication_info["timestamp"] = datetime.now().isoformat()
            medication_info["type"] = "medication_info"
            
            return medication_info
                
        except Exception as e:
            self.logger.error(f"Error getting medication information: {str(e)}")
            return {"error": "Failed to get medication information"}
            
    async def get_health_topic(self, topic: str) -> Dict[str, Any]:
        """
        Get evidence-based health topic information from trusted sources
        
        Note: This is educational only, not medical advice
        """
        try:
            if not topic:
                return {"error": "Health topic is required"}
                
            # Get health topic information from trusted sources
            topic_info = await get_health_topic_info(topic)
            
            # Add disclaimer
            topic_info["disclaimer"] = (
                "This information is for educational purposes only and not a substitute for professional medical advice. "
                "Always consult a healthcare provider about your health concerns and treatment options."
            )
            
            topic_info["timestamp"] = datetime.now().isoformat()
            topic_info["type"] = "health_topic"
            topic_info["query"] = topic
            
            return topic_info
                
        except Exception as e:
            self.logger.error(f"Error getting health topic information: {str(e)}")
            return {"error": "Failed to get health topic information"}
    
    async def generate_wellness_report(self, user_id: str) -> Dict[str, Any]:
        """Generate comprehensive wellness report for user"""
        try:
            # Collect data from the last 30 days
            end_date = datetime.now()
            start_date = end_date - timedelta(days=30)
            
            # Mood analysis
            mood_data = await self._get_mood_summary(user_id, start_date, end_date)
            
            # Stress analysis
            stress_data = await self._get_stress_summary(user_id, start_date, end_date)
            
            # Journal insights
            journal_insights = await self._get_journal_summary(user_id, start_date, end_date)
            
            return {
                "report_period": {
                    "start_date": start_date.strftime("%Y-%m-%d"),
                    "end_date": end_date.strftime("%Y-%m-%d")
                },
                "mood_summary": mood_data,
                "stress_summary": stress_data,
                "journal_insights": journal_insights,
                "recommendations": await self._generate_wellness_recommendations(user_id),
                "achievements": await self._get_wellness_achievements(user_id),
                "generated_at": datetime.now().isoformat()
            }
            
        except Exception as e:
            self.logger.error(f"Wellness report generation failed: {str(e)}")
            return {"error": "Failed to generate wellness report"}
    
    # Helper methods
    async def _load_meditation_programs(self):
        """Load available meditation programs"""
        self.meditation_programs = [
            {
                "title": "Mindfulness for Beginners",
                "duration": 10,
                "experience_level": "beginner",
                "focus_area": "general",
                "description": "A gentle introduction to mindfulness meditation",
                "instructions": "Focus on your breath and observe your thoughts without judgment",
                "benefits": ["Reduced stress", "Better focus", "Emotional balance"]
            },
            {
                "title": "Stress Relief Meditation",
                "duration": 15,
                "experience_level": "intermediate",
                "focus_area": "stress",
                "description": "Targeted meditation for stress reduction",
                "instructions": "Progressive muscle relaxation combined with breathing exercises",
                "benefits": ["Lower stress levels", "Muscle tension relief", "Mental clarity"]
            },
            {
                "title": "Sleep Preparation",
                "duration": 20,
                "experience_level": "beginner",
                "focus_area": "sleep",
                "description": "Calming meditation to prepare for restful sleep",
                "instructions": "Body scan technique with soothing visualization",
                "benefits": ["Better sleep quality", "Faster sleep onset", "Reduced anxiety"]
            }
        ]
    
    async def _load_breathing_exercises(self):
        """Load available breathing exercises"""
        self.breathing_exercises = [
            {
                "name": "Box Breathing",
                "pattern": "4-4-4-4",
                "difficulty": "beginner",
                "duration": "5 minutes",
                "description": "Equal count breathing for balance and calm"
            },
            {
                "name": "4-7-8 Breathing",
                "pattern": "4-7-8",
                "difficulty": "intermediate",
                "duration": "10 minutes", 
                "description": "Relaxation technique for anxiety and sleep"
            },
            {
                "name": "Coherent Breathing",
                "pattern": "5-5",
                "difficulty": "advanced",
                "duration": "15 minutes",
                "description": "Heart rate variability optimization"
            }
        ]
    
    async def _initialize_companion(self):
        """Initialize AI companion personality"""
        self.companion_personality = {
            "tone": "supportive",
            "empathy_level": "high",
            "response_style": "encouraging",
            "expertise": ["mindfulness", "stress_management", "emotional_support"]
        }
    
    def _categorize_mood(self, mood_score: int) -> str:
        """Categorize mood based on score"""
        if mood_score >= 8:
            return "excellent"
        elif mood_score >= 6:
            return "good"
        elif mood_score >= 4:
            return "neutral"
        elif mood_score >= 2:
            return "low"
        else:
            return "very_low"
    
    def _categorize_stress(self, stress_level: int) -> str:
        """Categorize stress level"""
        if stress_level >= 8:
            return "high"
        elif stress_level >= 6:
            return "moderate"
        elif stress_level >= 4:
            return "mild"
        else:
            return "low"
    
    async def _analyze_mood_trend(self, user_id: str) -> Dict[str, Any]:
        """Analyze mood trend over time"""
        if user_id not in self.mood_history or len(self.mood_history[user_id]) < 2:
            return {"trend": "insufficient_data"}
        
        recent_moods = self.mood_history[user_id][-7:]  # Last 7 entries
        scores = [entry["mood_score"] for entry in recent_moods]
        
        if len(scores) >= 2:
            if scores[-1] > scores[0]:
                return {"trend": "improving", "change": scores[-1] - scores[0]}
            elif scores[-1] < scores[0]:
                return {"trend": "declining", "change": scores[0] - scores[-1]}
            else:
                return {"trend": "stable", "change": 0}
        
        return {"trend": "unknown"}
    
    async def _generate_mood_recommendations(self, mood_score: int, emotions: List[str]) -> List[str]:
        """Generate mood-based recommendations"""
        recommendations = []
        
        if mood_score < 4:
            recommendations.extend([
                "Consider talking to a friend or counselor",
                "Try a gentle breathing exercise",
                "Take a walk in nature",
                "Practice self-compassion"
            ])
        elif mood_score < 6:
            recommendations.extend([
                "Try a short meditation session",
                "Engage in a hobby you enjoy",
                "Connect with loved ones",
                "Get some sunlight"
            ])
        else:
            recommendations.extend([
                "Keep up the positive momentum",
                "Share your joy with others",
                "Practice gratitude",
                "Maintain healthy habits"
            ])
        
        return recommendations[:3]  # Return top 3 recommendations
    
    async def _generate_stress_recommendations(self, stress_level: int) -> List[str]:
        """Generate stress management recommendations"""
        if stress_level >= 8:
            return [
                "Take immediate break from stressful activities",
                "Practice deep breathing exercises",
                "Consider professional support",
                "Prioritize sleep and rest"
            ]
        elif stress_level >= 6:
            return [
                "Try a 10-minute meditation",
                "Take a short walk",
                "Practice progressive muscle relaxation",
                "Limit caffeine intake"
            ]
        else:
            return [
                "Maintain current stress management practices",
                "Continue regular exercise",
                "Keep up healthy sleep habits",
                "Practice mindfulness daily"
            ]
    
    async def _identify_risk_factors(self, indicators: Dict[str, Any]) -> List[str]:
        """Identify stress risk factors"""
        risk_factors = []
        
        if indicators.get("sleep_hours", 8) < 6:
            risk_factors.append("Insufficient sleep")
        if indicators.get("workload_level", 5) > 8:
            risk_factors.append("High workload")
        if indicators.get("social_interactions", 5) < 3:
            risk_factors.append("Social isolation")
        if indicators.get("heart_rate", 70) > 90:
            risk_factors.append("Elevated heart rate")
        
        return risk_factors
    
    async def _analyze_sentiment(self, text: str) -> str:
        """Simple sentiment analysis of text"""
        # Simplified sentiment analysis - can be enhanced with NLP libraries
        positive_words = ["happy", "good", "great", "wonderful", "amazing", "positive", "love"]
        negative_words = ["sad", "bad", "terrible", "awful", "hate", "angry", "upset"]
        
        text_lower = text.lower()
        positive_count = sum(1 for word in positive_words if word in text_lower)
        negative_count = sum(1 for word in negative_words if word in text_lower)
        
        if positive_count > negative_count:
            return "positive"
        elif negative_count > positive_count:
            return "negative"
        else:
            return "neutral"
    
    async def _generate_journal_insights(self, entry: str) -> List[str]:
        """Generate insights from journal entry"""
        insights = []
        
        word_count = len(entry.split())
        if word_count > 100:
            insights.append("You wrote a detailed entry - great job expressing your thoughts!")
        
        sentiment = await self._analyze_sentiment(entry)
        if sentiment == "positive":
            insights.append("Your entry reflects positive emotions - that's wonderful!")
        elif sentiment == "negative":
            insights.append("It seems you're working through some challenges - remember that expressing these feelings is healthy.")
        
        return insights
    
    def _get_mood_encouragement(self, mood_score: int) -> str:
        """Get encouraging message based on mood score"""
        if mood_score >= 8:
            return "You're doing amazing! Keep up the positive energy! 🌟"
        elif mood_score >= 6:
            return "You're on a good track! Remember to take care of yourself. 😊"
        elif mood_score >= 4:
            return "Every day is different. Tomorrow is a new opportunity! 💪"
        else:
            return "It's okay to have tough days. You're stronger than you know. Be gentle with yourself. 💙"
    
    async def _calculate_weekly_mood_average(self, user_id: str) -> float:
        """Calculate weekly mood average"""
        if user_id not in self.mood_history:
            return 0.0
        
        week_ago = datetime.now() - timedelta(days=7)
        recent_moods = [
            entry for entry in self.mood_history[user_id]
            if datetime.fromisoformat(entry["timestamp"]) > week_ago
        ]
        
        if recent_moods:
            return sum(entry["mood_score"] for entry in recent_moods) / len(recent_moods)
        return 0.0
    
    async def _get_mood_trend(self, user_id: str) -> str:
        """Get simple mood trend"""
        if user_id not in self.mood_history or len(self.mood_history[user_id]) < 2:
            return "No trend data"
        
        recent = self.mood_history[user_id][-3:]  # Last 3 entries
        if len(recent) >= 2:
            if recent[-1]["mood_score"] > recent[0]["mood_score"]:
                return "Improving ↗️"
            elif recent[-1]["mood_score"] < recent[0]["mood_score"]:
                return "Declining ↘️"
            else:
                return "Stable ➡️"
        return "Unknown"
    
    async def _get_mood_summary(self, user_id: str, start_date: datetime, end_date: datetime) -> Dict[str, Any]:
        """Get mood summary for date range"""
        if user_id not in self.mood_history:
            return {"average": 0, "entries": 0}
        
        period_moods = [
            entry for entry in self.mood_history[user_id]
            if start_date <= datetime.fromisoformat(entry["timestamp"]) <= end_date
        ]
        
        if period_moods:
            average = sum(entry["mood_score"] for entry in period_moods) / len(period_moods)
            return {
                "average": round(average, 1),
                "entries": len(period_moods),
                "highest": max(entry["mood_score"] for entry in period_moods),
                "lowest": min(entry["mood_score"] for entry in period_moods)
            }
        
        return {"average": 0, "entries": 0}
    
    async def _get_stress_summary(self, user_id: str, start_date: datetime, end_date: datetime) -> Dict[str, Any]:
        """Get stress summary for date range"""
        if user_id not in self.stress_patterns:
            return {"average": 0, "entries": 0}
        
        period_stress = [
            entry for entry in self.stress_patterns[user_id]
            if start_date <= datetime.fromisoformat(entry["timestamp"]) <= end_date
        ]
        
        if period_stress:
            average = sum(entry["stress_level"] for entry in period_stress) / len(period_stress)
            return {
                "average": round(average, 1),
                "entries": len(period_stress),
                "peak": max(entry["stress_level"] for entry in period_stress)
            }
        
        return {"average": 0, "entries": 0}
    
    async def _get_journal_summary(self, user_id: str, start_date: datetime, end_date: datetime) -> Dict[str, Any]:
        """Get journal summary for date range"""
        if user_id not in self.journal_entries:
            return {"entries": 0, "total_words": 0}
        
        period_entries = [
            entry for entry in self.journal_entries[user_id]
            if start_date <= datetime.fromisoformat(entry["timestamp"]) <= end_date
        ]
        
        if period_entries:
            total_words = sum(entry["word_count"] for entry in period_entries)
            return {
                "entries": len(period_entries),
                "total_words": total_words,
                "average_words": round(total_words / len(period_entries), 1)
            }
        
        return {"entries": 0, "total_words": 0}
    
    async def _generate_wellness_recommendations(self, user_id: str) -> List[str]:
        """Generate personalized wellness recommendations"""
        recommendations = []
        
        # Basic recommendations
        recommendations.extend([
            "Continue tracking your mood daily",
            "Practice mindfulness for 10 minutes daily",
            "Maintain regular sleep schedule",
            "Stay connected with supportive people"
        ])
        
        return recommendations[:5]  # Return top 5
    
    async def _get_wellness_achievements(self, user_id: str) -> List[str]:
        """Get user's wellness achievements"""
        achievements = []
        
        if user_id in self.mood_history and len(self.mood_history[user_id]) >= 7:
            achievements.append("🏆 Tracked mood for a week!")
        
        if user_id in self.journal_entries and len(self.journal_entries[user_id]) >= 5:
            achievements.append("✍️ Regular journaler!")
        
        return achievements
