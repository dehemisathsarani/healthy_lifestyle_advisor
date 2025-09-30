"""
ETL Scheduler and Monitoring System
"""

import asyncio
import logging
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Callable, Any
from dataclasses import dataclass, asdict
import json
from pathlib import Path
import schedule
import time
from concurrent.futures import ThreadPoolExecutor
import threading

from .azure_efs_etl_pipeline import DietAgentETLPipeline
from .config import AzureETLConfig, ETLEnvironment

logger = logging.getLogger(__name__)

@dataclass
class ETLJobResult:
    """Result of an ETL job execution"""
    job_id: str
    job_type: str
    start_time: datetime
    end_time: datetime
    status: str  # 'success', 'failed', 'partial'
    records_processed: int
    data_types: List[str]
    errors: List[str]
    execution_time_seconds: float
    
    def to_dict(self) -> Dict:
        """Convert to dictionary for storage"""
        result = asdict(self)
        result['start_time'] = self.start_time.isoformat()
        result['end_time'] = self.end_time.isoformat()
        return result

@dataclass
class ETLScheduleConfig:
    """Configuration for ETL job scheduling"""
    job_name: str
    schedule_type: str  # 'daily', 'hourly', 'weekly', 'manual'
    schedule_time: str  # e.g., "02:00" for daily, "15" for hourly
    data_types: List[str]
    lookback_days: int = 1
    enabled: bool = True
    retry_on_failure: bool = True
    max_retries: int = 3
    timeout_minutes: int = 60

class ETLJobMonitor:
    """Monitor and track ETL job executions"""
    
    def __init__(self, config: AzureETLConfig):
        self.config = config
        self.job_history: List[ETLJobResult] = []
        self.active_jobs: Dict[str, datetime] = {}
        self.metrics = {
            'total_jobs_run': 0,
            'successful_jobs': 0,
            'failed_jobs': 0,
            'average_execution_time': 0.0,
            'last_successful_run': None,
            'last_failed_run': None
        }
    
    def start_job(self, job_id: str, job_type: str) -> datetime:
        """Record job start"""
        start_time = datetime.now()
        self.active_jobs[job_id] = start_time
        logger.info(f"Started ETL job {job_id} of type {job_type}")
        return start_time
    
    def complete_job(self, 
                    job_id: str, 
                    job_type: str,
                    start_time: datetime,
                    status: str,
                    records_processed: int = 0,
                    data_types: List[str] = None,
                    errors: List[str] = None) -> ETLJobResult:
        """Record job completion"""
        end_time = datetime.now()
        execution_time = (end_time - start_time).total_seconds()
        
        result = ETLJobResult(
            job_id=job_id,
            job_type=job_type,
            start_time=start_time,
            end_time=end_time,
            status=status,
            records_processed=records_processed,
            data_types=data_types or [],
            errors=errors or [],
            execution_time_seconds=execution_time
        )
        
        # Update metrics
        self.job_history.append(result)
        self.active_jobs.pop(job_id, None)
        
        self.metrics['total_jobs_run'] += 1
        if status == 'success':
            self.metrics['successful_jobs'] += 1
            self.metrics['last_successful_run'] = end_time.isoformat()
        else:
            self.metrics['failed_jobs'] += 1
            self.metrics['last_failed_run'] = end_time.isoformat()
        
        # Update average execution time
        total_time = sum(job.execution_time_seconds for job in self.job_history)
        self.metrics['average_execution_time'] = total_time / len(self.job_history)
        
        # Keep only last 100 job results
        if len(self.job_history) > 100:
            self.job_history = self.job_history[-100:]
        
        logger.info(f"Completed ETL job {job_id}: {status} in {execution_time:.2f}s")
        return result
    
    def get_job_status(self, job_id: str) -> Optional[str]:
        """Get status of a specific job"""
        if job_id in self.active_jobs:
            return 'running'
        
        for job in reversed(self.job_history):
            if job.job_id == job_id:
                return job.status
        
        return None
    
    def get_metrics(self) -> Dict:
        """Get ETL metrics"""
        return {
            **self.metrics,
            'active_jobs': len(self.active_jobs),
            'job_history_count': len(self.job_history),
            'success_rate': (
                self.metrics['successful_jobs'] / self.metrics['total_jobs_run'] 
                if self.metrics['total_jobs_run'] > 0 else 0
            ) * 100
        }
    
    def get_recent_failures(self, hours: int = 24) -> List[ETLJobResult]:
        """Get recent failed jobs"""
        cutoff_time = datetime.now() - timedelta(hours=hours)
        return [
            job for job in self.job_history
            if job.status == 'failed' and job.end_time > cutoff_time
        ]

class ETLScheduler:
    """Schedule and execute ETL jobs"""
    
    def __init__(self, config: AzureETLConfig):
        self.config = config
        self.pipeline = DietAgentETLPipeline(config)
        self.monitor = ETLJobMonitor(config)
        self.schedules: List[ETLScheduleConfig] = []
        self.running = False
        self.executor = ThreadPoolExecutor(max_workers=config.max_workers)
        self._schedule_thread = None
    
    def add_schedule(self, schedule_config: ETLScheduleConfig):
        """Add a scheduled ETL job"""
        self.schedules.append(schedule_config)
        logger.info(f"Added ETL schedule: {schedule_config.job_name}")
    
    def remove_schedule(self, job_name: str):
        """Remove a scheduled ETL job"""
        self.schedules = [s for s in self.schedules if s.job_name != job_name]
        logger.info(f"Removed ETL schedule: {job_name}")
    
    def start_scheduler(self):
        """Start the ETL scheduler"""
        if self.running:
            logger.warning("ETL scheduler is already running")
            return
        
        self.running = True
        logger.info("Starting ETL scheduler")
        
        # Configure scheduled jobs
        for schedule_config in self.schedules:
            if not schedule_config.enabled:
                continue
            
            job_func = lambda sc=schedule_config: self._execute_scheduled_job(sc)
            
            if schedule_config.schedule_type == 'daily':
                schedule.every().day.at(schedule_config.schedule_time).do(job_func)
            elif schedule_config.schedule_type == 'hourly':
                minute = int(schedule_config.schedule_time)
                schedule.every().hour.at(f":{minute:02d}").do(job_func)
            elif schedule_config.schedule_type == 'weekly':
                day, time_str = schedule_config.schedule_time.split(' ')
                getattr(schedule.every(), day.lower()).at(time_str).do(job_func)
            
            logger.info(f"Scheduled job {schedule_config.job_name}: {schedule_config.schedule_type} at {schedule_config.schedule_time}")
        
        # Start scheduler thread
        self._schedule_thread = threading.Thread(target=self._run_scheduler, daemon=True)
        self._schedule_thread.start()
    
    def stop_scheduler(self):
        """Stop the ETL scheduler"""
        self.running = False
        schedule.clear()
        logger.info("Stopped ETL scheduler")
    
    def _run_scheduler(self):
        """Run the scheduler loop"""
        while self.running:
            schedule.run_pending()
            time.sleep(60)  # Check every minute
    
    def _execute_scheduled_job(self, schedule_config: ETLScheduleConfig):
        """Execute a scheduled ETL job"""
        job_id = f"{schedule_config.job_name}_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
        
        # Submit job to thread pool
        future = self.executor.submit(
            self._run_etl_job,
            job_id,
            schedule_config
        )
        
        # Don't wait for completion in scheduler thread
        logger.info(f"Submitted scheduled ETL job: {job_id}")
    
    def _run_etl_job(self, job_id: str, schedule_config: ETLScheduleConfig):
        """Run ETL job with monitoring"""
        start_time = self.monitor.start_job(job_id, 'scheduled')
        
        try:
            # Calculate date range
            end_date = datetime.now()
            start_date = end_date - timedelta(days=schedule_config.lookback_days)
            
            # Run ETL pipeline
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)
            
            try:
                results = loop.run_until_complete(
                    self.pipeline.run_full_etl(
                        start_date=start_date,
                        end_date=end_date,
                        data_types=schedule_config.data_types
                    )
                )
                
                # Determine status
                status = 'success' if results.get('success', False) else 'failed'
                if results.get('errors') and results.get('data_types_processed'):
                    status = 'partial'
                
                self.monitor.complete_job(
                    job_id=job_id,
                    job_type='scheduled',
                    start_time=start_time,
                    status=status,
                    records_processed=results.get('total_records_processed', 0),
                    data_types=schedule_config.data_types,
                    errors=results.get('errors', [])
                )
                
            finally:
                loop.close()
                
        except Exception as e:
            logger.error(f"ETL job {job_id} failed: {e}")
            self.monitor.complete_job(
                job_id=job_id,
                job_type='scheduled',
                start_time=start_time,
                status='failed',
                errors=[str(e)]
            )
    
    async def run_manual_job(self, 
                           data_types: List[str],
                           start_date: datetime = None,
                           end_date: datetime = None) -> ETLJobResult:
        """Run manual ETL job"""
        job_id = f"manual_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
        start_time = self.monitor.start_job(job_id, 'manual')
        
        try:
            if not end_date:
                end_date = datetime.now()
            if not start_date:
                start_date = end_date - timedelta(days=1)
            
            results = await self.pipeline.run_full_etl(
                start_date=start_date,
                end_date=end_date,
                data_types=data_types
            )
            
            status = 'success' if results.get('success', False) else 'failed'
            if results.get('errors') and results.get('data_types_processed'):
                status = 'partial'
            
            return self.monitor.complete_job(
                job_id=job_id,
                job_type='manual',
                start_time=start_time,
                status=status,
                records_processed=results.get('total_records_processed', 0),
                data_types=data_types,
                errors=results.get('errors', [])
            )
            
        except Exception as e:
            logger.error(f"Manual ETL job {job_id} failed: {e}")
            return self.monitor.complete_job(
                job_id=job_id,
                job_type='manual',
                start_time=start_time,
                status='failed',
                errors=[str(e)]
            )

class ETLHealthChecker:
    """Health check system for ETL pipeline"""
    
    def __init__(self, scheduler: ETLScheduler):
        self.scheduler = scheduler
        self.pipeline = scheduler.pipeline
        self.monitor = scheduler.monitor
    
    async def run_health_check(self) -> Dict[str, Any]:
        """Run comprehensive health check"""
        health_status = {
            'timestamp': datetime.now().isoformat(),
            'overall_status': 'healthy',
            'components': {},
            'metrics': self.monitor.get_metrics(),
            'recommendations': []
        }
        
        # Check Azure EFS connectivity
        try:
            files = await self.pipeline.azure_client.list_files()
            health_status['components']['azure_efs'] = {
                'status': 'healthy',
                'files_accessible': len(files)
            }
        except Exception as e:
            health_status['components']['azure_efs'] = {
                'status': 'unhealthy',
                'error': str(e)
            }
            health_status['overall_status'] = 'degraded'
        
        # Check MongoDB connectivity
        try:
            await self.pipeline.extractor.connect()
            test_data = await self.pipeline.extractor.extract_nutrition_logs()
            await self.pipeline.extractor.disconnect()
            
            health_status['components']['mongodb'] = {
                'status': 'healthy',
                'accessible': True,
                'sample_data_available': len(test_data) > 0
            }
        except Exception as e:
            health_status['components']['mongodb'] = {
                'status': 'unhealthy',
                'error': str(e)
            }
            health_status['overall_status'] = 'unhealthy'
        
        # Check recent job performance
        recent_failures = self.monitor.get_recent_failures(hours=24)
        if len(recent_failures) > 0:
            health_status['components']['job_performance'] = {
                'status': 'warning',
                'recent_failures': len(recent_failures),
                'last_failure': recent_failures[0].to_dict() if recent_failures else None
            }
            health_status['recommendations'].append(
                "Recent job failures detected. Check logs and retry failed jobs."
            )
        else:
            health_status['components']['job_performance'] = {
                'status': 'healthy',
                'recent_failures': 0
            }
        
        # Check disk space and resources
        try:
            temp_dir = Path("./temp_etl")
            if temp_dir.exists():
                temp_size_mb = sum(f.stat().st_size for f in temp_dir.rglob('*') if f.is_file()) / (1024 * 1024)
                
                health_status['components']['resources'] = {
                    'status': 'healthy' if temp_size_mb < 1000 else 'warning',
                    'temp_directory_size_mb': temp_size_mb
                }
                
                if temp_size_mb > 1000:
                    health_status['recommendations'].append(
                        "Temporary directory is large. Consider cleanup."
                    )
        except Exception as e:
            health_status['components']['resources'] = {
                'status': 'unknown',
                'error': str(e)
            }
        
        return health_status

# Pre-configured schedules
def create_default_schedules() -> List[ETLScheduleConfig]:
    """Create default ETL schedules"""
    return [
        # Daily full ETL at 2 AM
        ETLScheduleConfig(
            job_name="daily_full_etl",
            schedule_type="daily",
            schedule_time="02:00",
            data_types=['nutrition_logs', 'food_analyses', 'meal_entries'],
            lookback_days=1,
            enabled=True
        ),
        
        # Weekly user profile sync on Sunday at 3 AM
        ETLScheduleConfig(
            job_name="weekly_user_profiles",
            schedule_type="weekly",
            schedule_time="sunday 03:00",
            data_types=['user_profiles'],
            lookback_days=7,
            enabled=True
        ),
        
        # Hourly incremental sync for high-priority data
        ETLScheduleConfig(
            job_name="hourly_incremental",
            schedule_type="hourly",
            schedule_time="00",  # At the top of each hour
            data_types=['nutrition_logs'],
            lookback_days=0.5,  # Last 12 hours
            enabled=False  # Disabled by default
        )
    ]

# Example usage
async def setup_etl_system():
    """Setup complete ETL system with scheduling"""
    
    # Load configuration
    config = ETLEnvironment.from_environment()
    
    # Create scheduler
    scheduler = ETLScheduler(config)
    
    # Add default schedules
    for schedule_config in create_default_schedules():
        scheduler.add_schedule(schedule_config)
    
    # Start scheduler
    scheduler.start_scheduler()
    
    # Setup health checker
    health_checker = ETLHealthChecker(scheduler)
    
    # Run initial health check
    health_status = await health_checker.run_health_check()
    print(f"ETL System Health: {json.dumps(health_status, indent=2)}")
    
    return scheduler, health_checker

if __name__ == "__main__":
    # Run ETL system setup
    asyncio.run(setup_etl_system())
