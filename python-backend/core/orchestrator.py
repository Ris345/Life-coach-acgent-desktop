import asyncio
from typing import Dict, Any
from agents.data_collector import DataCollectorAgent
from agents.researcher import ResearchAgent
from agents.probability import ProbabilityAgent
from agents.strategy import SuccessStrategyAgent
from agents.smart_nudge import SmartNudgeAgent

class Orchestrator:
    """
    Central brain of the Agentic Desktop System.
    Coordinates 5 specialized agents and manages data flow.
    """
    
    def __init__(self):
        self.data_collector = DataCollectorAgent()
        self.researcher = ResearchAgent()
        self.probability_agent = ProbabilityAgent()
        self.strategy_agent = SuccessStrategyAgent()
        self.smart_nudge_agent = SmartNudgeAgent()
        
        self.agents = [
            self.data_collector,
            self.researcher,
            self.probability_agent,
            self.strategy_agent,
            self.smart_nudge_agent
        ]
        
        self.system_state = {
            "current_goal": None,
            "is_active": False
        }

    async def start(self):
        """Start all agents."""
        print("🚀 Starting Orchestrator...")
        for agent in self.agents:
            await agent.start()
        self.system_state["is_active"] = True

    async def stop(self):
        """Stop all agents."""
        print("🛑 Stopping Orchestrator...")
        for agent in self.agents:
            await agent.stop()
        self.system_state["is_active"] = False

    async def set_goal(self, goal_text: str):
        """
        Handle new user goal.
        Flow: User -> Orchestrator -> ResearchAgent -> ProbabilityAgent -> StrategyAgent
        Returns complete analysis with goal breakdown, probability, and strategy.
        """
        print(f"🎯 New Goal Received: {goal_text}")
        self.system_state["current_goal"] = goal_text
        
        try:
            # Step 1: Research and analyze the goal
            print("📊 Step 1: Analyzing goal with ResearchAgent...")
            goal_analysis = await self.researcher.process(goal_text)
            print(f"✅ Goal Analysis Complete: {goal_analysis.get('goal', 'N/A')}")
            
            # Step 2: Get current user metrics
            print("📈 Step 2: Fetching user metrics...")
            user_metrics = await self.data_collector.process("get_metrics")
            print(f"✅ Retrieved metrics for {len(user_metrics)} applications")
            
            # Step 3: Calculate probability of success
            print("🎲 Step 3: Calculating success probability...")
            probability_input = {
                "goal_analysis": goal_analysis,
                "user_metrics": user_metrics
            }
            probability = await self.probability_agent.process(probability_input)
            print(f"✅ Probability calculated: {probability.get('score', 0):.0%}")
            
            # Step 4: Generate success strategy
            print("🗺️  Step 4: Generating success strategy...")
            strategy_input = {
                "goal_analysis": goal_analysis,
                "probability": probability,
                "user_metrics": user_metrics
            }
            strategy = await self.strategy_agent.process(strategy_input)
            print(f"✅ Strategy generated with {len(strategy.get('weekly_plan', []))} weeks planned")
            
            # Return complete analysis
            complete_analysis = {
                "goal_analysis": goal_analysis,
                "probability": probability,
                "strategy": strategy,
                "user_metrics": user_metrics
            }
            
            print("🎉 Complete goal analysis finished!")
            return complete_analysis
            
        except Exception as e:
            print(f"❌ Error in goal analysis workflow: {e}")
            # Return error response
            return {
                "error": str(e),
                "goal": goal_text,
                "message": "Failed to complete goal analysis. Please check logs."
            }


    async def get_metrics(self):
        """Get current metrics from DataCollector."""
        return await self.data_collector.process("get_metrics")

    async def get_chrome_tabs(self):
        """Get Chrome tabs from DataCollector."""
        return await self.data_collector.process("get_chrome_tabs")

    async def get_context_switches(self):
        """Get context switch count from DataCollector."""
        return await self.data_collector.process("get_context_switches")
