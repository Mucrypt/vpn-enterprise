"""
App Deployment Service
Handles deployment of AI-generated apps to the VPN Enterprise platform
"""

import asyncio
import httpx
import os
from typing import Dict, List, Any
from datetime import datetime
import json

class AppDeploymentService:
    """Deploy AI-generated apps to the platform with database and hosting"""
    
    def __init__(self):
        self.platform_api = os.getenv("PLATFORM_API_URL", "http://vpn-api:5000")
        self.hosting_api = os.getenv("HOSTING_API_URL", "http://vpn-api:5000/api/v1/hosting")
        
    async def deploy_app(
        self, 
        user_id: str,
        app_name: str,
        files: List[Dict[str, Any]],
        dependencies: Dict[str, str],
        framework: str = "react",
        requires_database: bool = True
    ) -> Dict[str, Any]:
        """
        Deploy an AI-generated app to the platform
        
        Steps:
        1. Create tenant database (if needed)
        2. Create hosting service
        3. Deploy app files
        4. Install dependencies
        5. Configure environment
        6. Start the app
        """
        
        deployment_id = f"deploy_{datetime.utcnow().timestamp()}"
        
        try:
            result = {
                "deployment_id": deployment_id,
                "app_name": app_name,
                "status": "deploying",
                "steps": []
            }
            
            # Step 1: Create database if needed
            if requires_database:
                database_info = await self._provision_database(user_id, app_name)
                result["database"] = database_info
                result["steps"].append({"step": "database", "status": "completed"})
            
            # Step 2: Create hosting service
            hosting_info = await self._provision_hosting(user_id, app_name, framework)
            result["hosting"] = hosting_info
            result["steps"].append({"step": "hosting", "status": "completed"})
            
            # Step 3: Deploy files
            deploy_info = await self._deploy_files(
                hosting_info["service_id"],
                files,
                dependencies
            )
            result["deployment"] = deploy_info
            result["steps"].append({"step": "files", "status": "completed"})
            
            # Step 4: Generate environment config
            env_config = self._generate_env_config(
                database_info if requires_database else None,
                hosting_info
            )
            result["environment"] = env_config
            result["steps"].append({"step": "environment", "status": "completed"})
            
            # Step 5: Start the app
            start_info = await self._start_app(hosting_info["service_id"])
            result["app_url"] = start_info["url"]
            result["status"] = "deployed"
            result["steps"].append({"step": "start", "status": "completed"})
            
            return result
            
        except Exception as e:
            return {
                "deployment_id": deployment_id,
                "status": "failed",
                "error": str(e)
            }
    
    async def _provision_database(self, user_id: str, app_name: str) -> Dict[str, Any]:
        """Create a new tenant database for the app"""
        
        async with httpx.AsyncClient() as client:
            # Create tenant database
            response = await client.post(
                f"{self.platform_api}/api/v1/tenants/provision",
                json={
                    "name": f"{app_name}_db",
                    "description": f"Database for {app_name}",
                    "owner_id": user_id,
                    "plan": "starter",  # Can be upgraded later
                    "region": "us-east-1"
                },
                timeout=30.0
            )
            
            if response.status_code != 201:
                raise Exception(f"Failed to provision database: {response.text}")
            
            data = response.json()
            
            return {
                "tenant_id": data["tenant_id"],
                "database_name": data["database_name"],
                "connection_string": data["connection_string"],
                "host": data["host"],
                "port": data["port"],
                "username": data["username"],
                "password": data["password"]
            }
    
    async def _provision_hosting(
        self, 
        user_id: str, 
        app_name: str,
        framework: str
    ) -> Dict[str, Any]:
        """Create hosting service for the app"""
        
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{self.hosting_api}/services",
                json={
                    "name": app_name,
                    "type": self._get_service_type(framework),
                    "plan": "starter",
                    "owner_id": user_id,
                    "config": {
                        "framework": framework,
                        "node_version": "20",
                        "auto_deploy": True,
                        "build_command": self._get_build_command(framework),
                        "start_command": self._get_start_command(framework)
                    }
                },
                timeout=30.0
            )
            
            if response.status_code != 201:
                raise Exception(f"Failed to provision hosting: {response.text}")
            
            data = response.json()
            
            return {
                "service_id": data["service_id"],
                "domain": data["domain"],
                "status": data["status"],
                "resource_limits": data["resource_limits"]
            }
    
    async def _deploy_files(
        self,
        service_id: str,
        files: List[Dict[str, Any]],
        dependencies: Dict[str, str]
    ) -> Dict[str, Any]:
        """Deploy app files to hosting service"""
        
        async with httpx.AsyncClient() as client:
            # Create deployment
            response = await client.post(
                f"{self.hosting_api}/services/{service_id}/deployments",
                json={
                    "files": files,
                    "dependencies": dependencies,
                    "auto_install": True
                },
                timeout=120.0  # Longer timeout for file upload
            )
            
            if response.status_code != 201:
                raise Exception(f"Failed to deploy files: {response.text}")
            
            return response.json()
    
    async def _start_app(self, service_id: str) -> Dict[str, Any]:
        """Start the deployed app"""
        
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{self.hosting_api}/services/{service_id}/start",
                timeout=60.0
            )
            
            if response.status_code != 200:
                raise Exception(f"Failed to start app: {response.text}")
            
            return response.json()
    
    def _generate_env_config(
        self, 
        database_info: Dict[str, Any] | None,
        hosting_info: Dict[str, Any]
    ) -> Dict[str, str]:
        """Generate environment variables for the app"""
        
        env = {
            "NODE_ENV": "production",
            "PORT": "3000",
            "APP_URL": f"https://{hosting_info['domain']}"
        }
        
        if database_info:
            env.update({
                "DATABASE_URL": database_info["connection_string"],
                "DB_HOST": database_info["host"],
                "DB_PORT": str(database_info["port"]),
                "DB_USER": database_info["username"],
                "DB_PASSWORD": database_info["password"],
                "DB_NAME": database_info["database_name"]
            })
        
        return env
    
    def _get_service_type(self, framework: str) -> str:
        """Map framework to service type"""
        mapping = {
            "react": "static_site",
            "next": "nodejs",
            "vue": "static_site",
            "angular": "static_site",
            "express": "nodejs",
            "fastapi": "python"
        }
        return mapping.get(framework.lower(), "static_site")
    
    def _get_build_command(self, framework: str) -> str:
        """Get build command for framework"""
        commands = {
            "react": "npm run build",
            "next": "npm run build",
            "vue": "npm run build",
            "angular": "npm run build",
            "express": "npm run build",
            "fastapi": "pip install -r requirements.txt"
        }
        return commands.get(framework.lower(), "npm run build")
    
    def _get_start_command(self, framework: str) -> str:
        """Get start command for framework"""
        commands = {
            "react": "npx serve -s build -p 3000",
            "next": "npm start",
            "vue": "npx serve -s dist -p 3000",
            "angular": "npx serve -s dist -p 3000",
            "express": "npm start",
            "fastapi": "uvicorn main:app --host 0.0.0.0 --port 3000"
        }
        return commands.get(framework.lower(), "npm start")
