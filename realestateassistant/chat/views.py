import logging
import os
import base64
import openai
from asgiref.sync import async_to_sync
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions
from rest_framework.parsers import MultiPartParser, FormParser
from agents import Agent, Runner, function_tool, WebSearchTool
from pydantic import BaseModel
from typing import Optional

# --- Logger Setup ---
logging.basicConfig(
    level=logging.DEBUG,
    format="%(asctime)s %(levelname)s [%(name)s] %(message)s"
)
logger = logging.getLogger(__name__)

# --- DEMO GLOBALS for image per request ---
_POST_IMAGE_B64 = None
_POST_IMAGE_TYPE = None

# --- OpenAI Client ---
openai_api_key = os.environ.get("OPENAI_API_KEY")
if not openai_api_key:
    logger.error("OpenAI API key (OPENAI_API_KEY) not found in environment variables.")
    raise RuntimeError("OpenAI API key not found.")
client = openai.OpenAI(api_key=openai_api_key)

# --- Context Model (for routing) ---
class ChatContext(BaseModel):
    user_id: Optional[str] = None

# --- Tool: always use globals ---
@function_tool
def analyze_property_image_tool(user_description: str) -> str:
    global _POST_IMAGE_B64, _POST_IMAGE_TYPE
    b64_image = _POST_IMAGE_B64
    content_type = _POST_IMAGE_TYPE
    logger.debug(f"[TOOL] b64_image: {'<present>' if b64_image else None}")
    logger.debug(f"[TOOL] content_type: {content_type}")
    if not b64_image or not content_type:
        logger.warning("[TOOL] No image data provided!")
        return "Error: No image data provided."
    try:
        base64.b64decode(b64_image)
    except Exception:
        logger.error("analyze_property_image_tool: Invalid image data received.")
        return "Error: Invalid image data."
    logger.info("analyze_property_image_tool: Image data is present and valid.")
    data_url = f"data:{content_type};base64,{b64_image}"
    messages = [
        {
            "role": "user",
            "content": [
                {
                    "type": "text",
                    "text": (
                        "You are an expert in identifying potential issues in residential properties. "
                        "Analyze the user's description and the provided image. "
                        "Identify the likely issue (e.g., water leak, mold, broken window, pest infestation). "
                        "Provide a brief assessment and suggest potential next steps."
                        "return markdown formatted output for chat, don't add extra line breaks"

                        f"\n\nUser description: '{user_description}'"
                    )
                },
                {
                    "type": "image_url",
                    "image_url": {"url": data_url},
                },
            ],
        }
    ]
    try:
        completion = client.chat.completions.create(
            model="gpt-4.1",
            messages=messages,
            max_tokens=500,
        )
        return completion.choices[0].message.content
    except openai.APIError as e:
        logger.error(f"OpenAI API error: {e}", exc_info=True)
        return f"Error: AI service failed ({e.status_code})."
    except Exception as e:
        logger.error(f"Unexpected error: {e}", exc_info=True)
        return "Error: An unexpected error occurred while analyzing the image."

# --- Agents ---
issue_detector_agent = Agent[ChatContext](
    name="Property Issue Detector",
    instructions=(
        "You are an expert in identifying issues in residential buildings. "
        "If an image is attached (for this system, an image is attached if you are explicitly told so or the user says 'see the attached image'), "
        "then call the 'analyze_property_image_tool' function, providing only the user's problem description as the 'user_description' argument. "
        "Do NOT provide any other arguments; the system will automatically use the attached image. "
        "If there is no image, analyze the issue using only the text."
        "In either case, provide a brief assessment and suggest next steps."
        "return markdown formatted output for chat, don't add extra line breaks"
    ),
    model="gpt-4o",
    tools=[analyze_property_image_tool]
)

faq_agent = Agent[ChatContext](
    name="Tenancy Agreement Expert",
    instructions=(
         "You are an expert on standard tenancy agreements and common landlord-tenant questions. "
        "You may use web search to look up current laws, local rules, or current events if asked, or whenever you do not know the answer from your own knowledge. "
        "Answer the user's query based on general knowledge of typical rental agreements and tenant rights/responsibilities. "
        "Do not provide legal advice, but explain common clauses and procedures clearly. "
        "If the question is about a specific property issue (like damage), state that another specialist should handle it."
        "Consider the location of the user when giving advice."
        "return markdown formatted output for chat, don't add excessive line breaks"
        
    ),
    model="gpt-4o-mini",
    tools=[WebSearchTool(search_context_size="medium")],
)

triage_agent = Agent[ChatContext](
    name="Real Estate Query Triage Agent",
    instructions=(
        "You are a triage agent. Your task is to determine the nature of the user's TEXT query about a real estate matter (images are handled separately). "
        "If it describes a potential PHYSICAL issue or damage inside a property (e.g., 'leak', 'broken', 'mold', 'pests', 'noise problem'), "
        "hand off to the 'Property Issue Detector'. "
        "If it's about tenancy agreements/rules/processes, hand off to the 'Tenancy Agreement Expert'. "
        "Be decisive based ONLY on the text."

    ),
    handoffs=[issue_detector_agent, faq_agent],
    model="gpt-4o-mini"
)

# --- Agent runner ---
def run_agent_sync(starting_agent, input_text, context_obj=None):
    logger.info(f"run_agent_sync: agent={getattr(starting_agent, 'name', starting_agent)}, input={input_text[:50]!r}, context={context_obj}")
    async def _run():
        return await Runner.run(
            starting_agent=starting_agent,
            input=input_text,
            context=context_obj
        )
    return async_to_sync(_run)()

# --- API View ---
class MultiAgentChatView(APIView):
    parser_classes = (MultiPartParser, FormParser)
    permission_classes = [permissions.AllowAny]
    def post(self, request, *args, **kwargs):
        user_id_str = str(request.user.id) if request.user.is_authenticated else "Anonymous"
        user_text = request.data.get('text', '').strip()
        user_image_file = request.FILES.get('image')
        logger.debug(f"API POST: user_id={user_id_str}, user_text={user_text[:50]!r}, image_present={'YES' if user_image_file else 'NO'}")
        if not client:
            return Response({"error": "AI service configuration error."},
                            status=status.HTTP_503_SERVICE_UNAVAILABLE)
        try:
            # --- Always reset global for demo ---
            global _POST_IMAGE_B64, _POST_IMAGE_TYPE
            _POST_IMAGE_B64 = None
            _POST_IMAGE_TYPE = None
            if user_image_file:
                logger.info("About to call agent: issue_detector_agent with image")
                raw_bytes = user_image_file.read()
                image_content_type = user_image_file.content_type
                b64 = base64.b64encode(raw_bytes).decode("utf-8")
                _POST_IMAGE_B64 = b64
                _POST_IMAGE_TYPE = image_content_type
                if not user_text:
                    user_text = "See the attached image."
                # Tell the agent text implies an image is present
                input_for_agent = user_text + " (See the attached image.)"
                agent_result = run_agent_sync(
                    starting_agent=issue_detector_agent,
                    input_text=input_for_agent,
                    context_obj=ChatContext(user_id=user_id_str)
                )
            elif user_text:
                agent_result = run_agent_sync(
                    starting_agent=triage_agent,
                    input_text=user_text,
                    context_obj=ChatContext(user_id=user_id_str)
                )
            else:
                return Response({"error": "Please provide text or an image."},
                                status=status.HTTP_400_BAD_REQUEST)
            if agent_result and hasattr(agent_result, "final_output") and agent_result.final_output:
                final_response_text = agent_result.final_output
                logger.info(f"User {user_id_str}: Agent processing successful. Final Output received.")
                return Response({"response": final_response_text}, status=status.HTTP_200_OK)
            else:
                logger.error(f"User {user_id_str}: Agent run completed but produced no final output or agent_result was None. Result: {agent_result}")
                error_detail = "Agent failed to produce a result."
                if agent_result and hasattr(agent_result, 'error') and agent_result.error:
                    error_detail = f"Agent run failed with error: {agent_result.error}"
                elif agent_result is None:
                     error_detail = "Agent failed to initialize or run."
                final_response_text = f"Sorry, I couldn't process that request. {error_detail}"
                return Response({"response": final_response_text}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        except openai.APIError as e:
            logger.error(f"User {user_id_str}: OpenAI API error during agent execution: {e}", exc_info=True)
            error_message = f"AI service error ({e.status_code}): {getattr(e, 'message', str(e))}"
            return Response({"error": error_message}, status=status.HTTP_503_SERVICE_UNAVAILABLE)
        except Exception as e:
            logger.exception(f"User {user_id_str}: An unexpected error occurred during agent processing.")
            return Response({"error": f"An internal server error occurred: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

from django.http import StreamingHttpResponse
from rest_framework.permissions import AllowAny
from openai.types.responses import ResponseTextDeltaEvent
import re
import asyncio, json

class MultiAgentChatStreamView(APIView):
    permission_classes = [AllowAny]

    def post(self, request, *args, **kwargs):
        """
        Stream agent output using Server-Sent Events (SSE).
        """
        user_id_str = str(request.user.id) if request.user.is_authenticated else "Anonymous"
        user_text = request.data.get('text', '').strip()
        user_image_file = request.FILES.get('image')
        agent = None
        context_obj = ChatContext(user_id=user_id_str)
        input_for_agent = user_text
        global _POST_IMAGE_B64, _POST_IMAGE_TYPE
        _POST_IMAGE_B64 = None
        _POST_IMAGE_TYPE = None
        
        if user_image_file:
            raw_bytes = user_image_file.read()
            image_content_type = user_image_file.content_type
            b64 = base64.b64encode(raw_bytes).decode("utf-8")
            _POST_IMAGE_B64 = b64
            _POST_IMAGE_TYPE = image_content_type
            
            if not user_text:
                user_text = "See the attached image."
            input_for_agent = user_text + " (See the attached image.)"
            agent = issue_detector_agent
        elif user_text:
            # Use the triage agent to determine the appropriate agent
            triage_agent_result = run_agent_sync(
                starting_agent=triage_agent,
                input_text=user_text,
                context_obj=context_obj
            )   

            # Log the triage agent's result
            if hasattr(triage_agent_result, 'final_output'):
                final_output = triage_agent_result.final_output.lower()
                logger.debug(f"Triage agent output: {final_output}")  # Log the triage output
                
                # Define the conditions based on the final output
                if "property issue" in final_output:  # Condition to check for a specific phrase
                    agent = issue_detector_agent
                else:
                    agent = faq_agent
            else:
                return Response({"error": "Triage agent did not provide an output."},
                                status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        else:
            return Response({"error": "Please provide text or an image."},
                            status=status.HTTP_400_BAD_REQUEST)

        # Get the agent name string
        agent_name = getattr(agent, "name", str(agent))

        async def event_stream():
                result = Runner.run_streamed(agent, input=input_for_agent, context=context_obj)
                filtering_needed = (agent is issue_detector_agent or getattr(agent, "name", None) == "Property Issue Detector")
                in_tool_arg = filtering_needed
                tool_arg_buffer = ""
                bracket_level = 0
                async for event in result.stream_events():
                    if event.type == "raw_response_event" and hasattr(event.data, "delta"):
                        delta = event.data.delta
                        # --- Begin: agent switch logic ---
                        event_agent = None
                        if hasattr(event.data, "agent"):
                            event_agent = getattr(event.data, "agent", None)
                        elif hasattr(event, "agent"):
                            event_agent = getattr(event, "agent", None)
                        if event_agent and hasattr(event_agent, "name"):
                            event_agent_name = event_agent.name
                        elif event_agent:
                            event_agent_name = str(event_agent)
                        else:
                            event_agent_name = agent_name
                        # --- End: agent switch logic ---
                        if in_tool_arg:
                            tool_arg_buffer += delta
                            for ch in delta:
                                if ch == '{':
                                    bracket_level += 1
                                elif ch == '}':
                                    bracket_level -= 1
                            if bracket_level <= 0 and 'user_description' in tool_arg_buffer:
                                in_tool_arg = False
                                tool_arg_buffer = ""
                            continue
                        yield f"data: {json.dumps({'delta': delta, 'agent': event_agent_name})}\n\n"
                    if getattr(event, "is_last", False):
                        yield "event: end\ndata: {}\n\n"

        return StreamingHttpResponse(
            event_stream(), content_type='text/event-stream'
        )