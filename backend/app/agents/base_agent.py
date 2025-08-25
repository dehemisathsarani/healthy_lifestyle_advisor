"""
Base Agent class for all agents in the healthy lifestyle advisor system
"""

from abc import ABC, abstractmethod
from typing import Dict, Any, List, Optional
import asyncio
import json
from datetime import datetime
import logging

class BaseAgent(ABC):
    """Base class for all agents in the healthy lifestyle advisor system"""
    
    def __init__(self, agent_id: str, name: str):
        self.agent_id = agent_id
        self.name = name
        self.status = "idle"
        self.message_queue = asyncio.Queue()
        self.supervisor = None
        self.logger = logging.getLogger(f"agent.{agent_id}")
        self.created_at = datetime.now()
        self.last_activity = datetime.now()
        
    @abstractmethod
    async def process_request(self, request: Dict[str, Any]) -> Dict[str, Any]:
        """Process incoming requests - must be implemented by each agent"""
        pass
    
    @abstractmethod
    async def initialize(self) -> bool:
        """Initialize agent resources - must be implemented by each agent"""
        pass
    
    async def send_message_to_supervisor(self, message: Dict[str, Any]):
        """Send message to supervisor"""
        if self.supervisor:
            message["from_agent"] = self.agent_id
            message["timestamp"] = datetime.now().isoformat()
            await self.supervisor.receive_message(self.agent_id, message)
    
    async def receive_message(self, message: Dict[str, Any]):
        """Receive message from supervisor or other agents"""
        self.last_activity = datetime.now()
        await self.message_queue.put(message)
    
    def get_status(self) -> Dict[str, Any]:
        """Get current agent status"""
        return {
            "agent_id": self.agent_id,
            "name": self.name,
            "status": self.status,
            "created_at": self.created_at.isoformat(),
            "last_activity": self.last_activity.isoformat(),
            "queue_size": self.message_queue.qsize()
        }
    
    async def health_check(self) -> Dict[str, Any]:
        """Perform health check on the agent"""
        try:
            # Basic health check - can be overridden by specific agents
            return {
                "agent_id": self.agent_id,
                "healthy": True,
                "status": self.status,
                "uptime": str(datetime.now() - self.created_at)
            }
        except Exception as e:
            self.logger.error(f"Health check failed: {str(e)}")
            return {
                "agent_id": self.agent_id,
                "healthy": False,
                "error": str(e)
            }
    
    def set_status(self, status: str):
        """Update agent status"""
        self.status = status
        self.last_activity = datetime.now()
        self.logger.info(f"Agent {self.agent_id} status changed to: {status}")
