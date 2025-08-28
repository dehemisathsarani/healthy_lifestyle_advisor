"""
Agent Manager for coordinating all agents in the healthy lifestyle advisor system
"""

from .mental_health_agent import MentalHealthAgent
from typing import Dict, Any, Optional, List
import asyncio
import logging

class AgentManager:
    """Main manager for the multi-agent system"""
    
    def __init__(self):
        self.agents: Dict[str, Any] = {}
        self.initialized = False
        self.logger = logging.getLogger(__name__)
    
    async def initialize_system(self):
        """Initialize all agents"""
        if self.initialized:
            return
        
        try:
            # Create and initialize Mental Health Agent
            mental_health_agent = MentalHealthAgent()
            initialization_success = await mental_health_agent.initialize()
            
            if initialization_success:
                self.agents["mental_health"] = mental_health_agent
                self.logger.info("Mental Health Agent initialized successfully")
            else:
                self.logger.error("Failed to initialize Mental Health Agent")
                return False
            
            self.initialized = True
            self.logger.info("Agent system initialized successfully")
            return True
            
        except Exception as e:
            self.logger.error(f"Failed to initialize agent system: {str(e)}")
            return False
    
    async def process_request(self, request: Dict[str, Any]) -> Dict[str, Any]:
        """Process user request through the appropriate agent"""
        if not self.initialized:
            await self.initialize_system()
        
        try:
            self.logger.info(f"Processing request: {request}")
            request_type = request.get("type", "").lower()
            agent_type = request.get("agent", "").lower()
            
            # Route mental health requests
            mental_health_keywords = [
                "mood", "stress", "meditation", "breathing", "journal", 
                "companion", "mental", "anxiety", "wellness", "emotion",
                "grounding_technique", "gratitude_prompt"
            ]
            
            self.logger.info(f"Request type: {request_type}, agent type: {agent_type}")
            
            if (agent_type == "mental_health" or 
                any(keyword in request_type for keyword in mental_health_keywords)):
                
                self.logger.info(f"Routing to mental health agent: {request_type}")
                
                if "mental_health" in self.agents:
                    response = await self.agents["mental_health"].process_request(request)
                    self.logger.info(f"Response from mental health agent: {response}")
                    return response
                else:
                    self.logger.error("Mental Health Agent not available")
                    return {"error": "Mental Health Agent not available"}
            
            # Default response for unrecognized requests
            self.logger.warning(f"Unrecognized request type: {request_type}")
            return {
                "error": "Request type not recognized or agent not available",
                "available_agents": list(self.agents.keys()),
                "suggestion": "Try specifying 'mental_health' as the agent type"
            }
            
        except Exception as e:
            self.logger.error(f"Error processing request: {str(e)}", exc_info=True)
            return {"error": f"Failed to process request: {str(e)}"}
    
    async def get_system_status(self) -> Dict[str, Any]:
        """Get status of all agents"""
        status = {
            "initialized": self.initialized,
            "agents": {},
            "total_agents": len(self.agents)
        }
        
        for agent_name, agent in self.agents.items():
            try:
                status["agents"][agent_name] = agent.get_status()
            except Exception as e:
                status["agents"][agent_name] = {"error": str(e)}
        
        return status
    
    async def health_check(self) -> Dict[str, Any]:
        """Perform health check on all agents"""
        health_status = {
            "system_healthy": True,
            "agents": {}
        }
        
        for agent_name, agent in self.agents.items():
            try:
                agent_health = await agent.health_check()
                health_status["agents"][agent_name] = agent_health
                
                if not agent_health.get("healthy", False):
                    health_status["system_healthy"] = False
                    
            except Exception as e:
                health_status["agents"][agent_name] = {
                    "healthy": False,
                    "error": str(e)
                }
                health_status["system_healthy"] = False
        
        return health_status
    
    def get_available_agents(self) -> List[str]:
        """Get list of available agent types"""
        return list(self.agents.keys())

# Global agent manager instance
agent_manager = AgentManager()
