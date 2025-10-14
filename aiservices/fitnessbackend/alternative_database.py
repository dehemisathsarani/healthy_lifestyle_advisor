"""
Alternative Database Configuration for Testing
This provides a simple file-based storage for immediate testing
"""
import json
import os
from typing import Dict, List, Any
from datetime import datetime

class SimpleFileDatabase:
    """Simple file-based database for testing without MongoDB"""
    
    def __init__(self, data_dir: str = "data"):
        self.data_dir = data_dir
        os.makedirs(data_dir, exist_ok=True)
        
    def _get_file_path(self, collection: str) -> str:
        return os.path.join(self.data_dir, f"{collection}.json")
    
    def _load_collection(self, collection: str) -> List[Dict]:
        file_path = self._get_file_path(collection)
        if os.path.exists(file_path):
            with open(file_path, 'r') as f:
                return json.load(f)
        return []
    
    def _save_collection(self, collection: str, data: List[Dict]):
        file_path = self._get_file_path(collection)
        with open(file_path, 'w') as f:
            json.dump(data, f, indent=2, default=str)
    
    async def insert_one(self, collection: str, document: Dict):
        """Insert a document into a collection"""
        data = self._load_collection(collection)
        
        # Add timestamp if not present
        if 'created_at' not in document:
            document['created_at'] = datetime.utcnow().isoformat()
        
        data.append(document)
        self._save_collection(collection, data)
        
        # Return object with inserted_id attribute (like pymongo)
        class InsertResult:
            def __init__(self, inserted_id):
                self.inserted_id = inserted_id
        
        return InsertResult(document.get('id', len(data)))
    
    async def find_one(self, collection: str, query: Dict) -> Dict:
        """Find one document matching the query"""
        data = self._load_collection(collection)
        
        for item in data:
            match = True
            for key, value in query.items():
                if key not in item or item[key] != value:
                    match = False
                    break
            if match:
                return item
        return None
    
    async def find(self, collection: str, query: Dict = None) -> List[Dict]:
        """Find all documents matching the query"""
        data = self._load_collection(collection)
        
        if not query:
            return data
        
        results = []
        for item in data:
            match = True
            for key, value in query.items():
                if key not in item or item[key] != value:
                    match = False
                    break
            if match:
                results.append(item)
        
        return results

# Alternative database setup for testing
simple_db = SimpleFileDatabase()

class MockCollection:
    def __init__(self, collection_name: str):
        self.collection_name = collection_name
    
    async def insert_one(self, document: Dict):
        return await simple_db.insert_one(self.collection_name, document)
    
    async def find_one(self, query: Dict = None):
        return await simple_db.find_one(self.collection_name, query or {})
    
    def find(self, query: Dict = None):
        class AsyncCursor:
            def __init__(self, collection_name, query):
                self.collection_name = collection_name
                self.query = query
            
            def __aiter__(self):
                return self
            
            async def __anext__(self):
                # This is a simple implementation - in real use you'd want proper cursor behavior
                data = await simple_db.find(self.collection_name, self.query)
                for item in data:
                    return item
                raise StopAsyncIteration
            
            def sort(self, *args):
                return self
            
            def limit(self, limit):
                return self
        
        return AsyncCursor(self.collection_name, query or {})

class MockDatabase:
    def __getitem__(self, collection_name: str):
        return MockCollection(collection_name)

async def get_test_database():
    """Alternative database for testing without MongoDB"""
    return MockDatabase()