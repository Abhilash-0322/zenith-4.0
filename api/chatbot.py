# chatbot.py
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import os
from langchain.prompts import ChatPromptTemplate
from langchain.chains import LLMChain
from langchain.memory import ConversationBufferMemory
from langchain.agents import Tool, initialize_agent, AgentType
from langchain_groq import ChatGroq
from dotenv import load_dotenv

load_dotenv()

# Define request and response models
class ChatRequest(BaseModel):
    message: str
    user_id: str
    session_id: Optional[str] = None

class ChatResponse(BaseModel):
    response: str
    resources: Optional[List[Dict[str, str]]] = None
    emergency_contact: bool = False
    session_id: str

# Create router
router = APIRouter(
    prefix="/mental-health",
    tags=["Mental Health Chatbot"],
    responses={404: {"description": "Not found"}},
)

# In-memory session storage (would use a proper database in production)
conversation_memories = {}

# Define tools for the agent
def get_general_mental_health_advice(query: str) -> str:
    """Provides general mental health advice and coping strategies."""
    return f"Here are some general strategies that might help with {query}: " \
           "Practice mindfulness, maintain regular physical activity, ensure proper sleep, " \
           "connect with supportive people, and consider journaling your thoughts."

def get_resource_recommendations(query: str) -> str:
    """Recommends appropriate mental health resources and content."""
    resources = {
        "anxiety": [
            {"name": "Anxiety Coping Tools", "type": "article", "url": "https://www.calmverse.com/resources/anxiety-tools"},
            {"name": "Breathing Exercises", "type": "guided_meditation", "url": "https://www.calmverse.com/meditations/breathing"}
        ],
        "depression": [
            {"name": "Understanding Depression", "type": "article", "url": "https://www.calmverse.com/resources/depression-guide"},
            {"name": "Uplifting Meditation", "type": "guided_meditation", "url": "https://www.calmverse.com/meditations/uplift"}
        ],
        "stress": [
            {"name": "Stress Management", "type": "article", "url": "https://www.calmverse.com/resources/stress-management"},
            {"name": "Progressive Relaxation", "type": "guided_meditation", "url": "https://www.calmverse.com/meditations/relax"}
        ],
        "sleep": [
            {"name": "Sleep Hygiene Tips", "type": "article", "url": "https://www.calmverse.com/resources/sleep-better"},
            {"name": "Bedtime Meditation", "type": "guided_meditation", "url": "https://www.calmverse.com/meditations/sleep"}
        ]
    }
    
    response = "Based on your question, you might find these resources helpful:\n\n"
    for topic, topic_resources in resources.items():
        if topic in query.lower():
            for resource in topic_resources:
                response += f"- {resource['name']} ({resource['type']})\n"
    
    if response == "Based on your question, you might find these resources helpful:\n\n":
        response += "- General Wellness Guide\n- Daily Reflection Practice\n"
    
    return response

def check_crisis_indicators(query: str) -> str:
    """Checks if user message contains indicators of crisis or emergency."""
    crisis_indicators = ["suicide", "kill myself", "end my life", "want to die", 
                        "harm myself", "hurt myself", "emergency", "crisis", 
                        "urgent help", "immediate danger"]
    
    for indicator in crisis_indicators:
        if indicator in query.lower():
            return "I've detected some concerning language in your message. " \
                   "If you're in immediate danger or having thoughts of harming yourself, " \
                   "please contact emergency services (911/988 in the US) or a crisis helpline:\n\n" \
                   "- National Suicide Prevention Lifeline: 988 or 1-800-273-8255\n" \
                   "- Crisis Text Line: Text HOME to 741741\n\n" \
                   "Would you like me to provide information about mental health resources available through CalmVerse?"
    
    return ""

# Define tools
tools = [
    Tool(
        name="General Mental Health Advice",
        func=get_general_mental_health_advice,
        description="Useful for providing general mental health advice and coping strategies"
    ),
    Tool(
        name="Resource Recommendations",
        func=get_resource_recommendations,
        description="Useful for recommending specific CalmVerse resources like articles, guided meditations, etc."
    ),
    Tool(
        name="Crisis Detection",
        func=check_crisis_indicators,
        description="Checks if the user message indicates a crisis situation requiring immediate attention"
    )
]

# Get LLM
def get_llm():
    """Initialize and return the Groq LLM."""
    return ChatGroq(
        temperature=0.3,
        model_name="llama3-70b-8192",  # You can change this to another Groq model as needed
        # Set your API key via environment variable
        groq_api_key=os.environ.get("GROQ_API_KEY"),
    )

# System template for the chatbot
system_template = """You are CalmVerse's mental health support assistant. You provide empathetic, supportive responses to users' mental health questions.

Guidelines:
1. Be warm, empathetic, and nonjudgmental
2. Provide evidence-based suggestions when appropriate
3. Recognize your limitations - you're not a replacement for professional mental health care
4. If a user appears to be in crisis, direct them to appropriate emergency resources
5. Maintain a supportive tone throughout the conversation
6. Focus on general wellbeing practices and coping strategies
7. Recommend CalmVerse resources when relevant (meditation sessions, articles, etc.)
8. Respect user privacy and maintain confidentiality

If the user mentions symptoms of serious mental health conditions, gently suggest they speak with a healthcare professional while still providing supportive information.

Respond thoughtfully to the user's message: {input}
"""

# Initialize agent
def get_agent(memory):
    """Initialize and return the LangChain agent with the provided memory."""
    llm = get_llm()
    agent = initialize_agent(
        tools=tools,
        llm=llm,
        agent=AgentType.CONVERSATIONAL_REACT_DESCRIPTION,
        verbose=True,
        memory=memory,
        handle_parsing_errors=True,
        max_iterations=3
    )
    return agent

@router.post("/chat", response_model=ChatResponse)
async def chat_endpoint(request: ChatRequest):
    """Endpoint to interact with the mental health chatbot"""
    user_message = request.message
    user_id = request.user_id
    session_id = request.session_id if request.session_id else user_id
    
    # Create or retrieve conversation memory
    if session_id not in conversation_memories:
        conversation_memories[session_id] = ConversationBufferMemory(
            memory_key="chat_history",
            return_messages=True
        )
    
    memory = conversation_memories[session_id]
    
    # Initialize agent with memory
    agent = get_agent(memory)
    
    # Check for crisis indicators first
    crisis_check = check_crisis_indicators(user_message)
    emergency_situation = bool(crisis_check)
    
    # Process the message
    try:
        if emergency_situation:
            response = crisis_check
            resources = [
                {"name": "Crisis Text Line", "type": "hotline", "contact": "Text HOME to 741741"},
                {"name": "National Suicide Prevention Lifeline", "type": "hotline", "contact": "988 or 1-800-273-8255"}
            ]
        else:
            # Use the agent to generate a response
            result = agent.run(user_message)
            response = result
            
            # Extract resource recommendations if present
            if "recommendations" in response.lower() or "resources" in response.lower():
                resources = [
                    {"name": "CalmVerse Meditation Library", "type": "app_feature", "url": "/meditations"},
                    {"name": "Mental Wellness Articles", "type": "app_feature", "url": "/articles"}
                ]
            else:
                resources = None
        
        return ChatResponse(
            response=response,
            resources=resources,
            emergency_contact=emergency_situation,
            session_id=session_id
        )
    
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"An error occurred while processing your request: {str(e)}"
        )

@router.delete("/chat/{session_id}")
async def end_chat_session(session_id: str):
    """End and clean up a chat session"""
    if session_id in conversation_memories:
        del conversation_memories[session_id]
        return {"message": f"Session {session_id} ended successfully"}
    else:
        raise HTTPException(
            status_code=404,
            detail=f"Session with ID {session_id} not found"
        )