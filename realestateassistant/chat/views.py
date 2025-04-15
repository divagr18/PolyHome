import logging
import os
import base64
import openai
from asgiref.sync import async_to_sync
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions
from rest_framework.parsers import MultiPartParser, FormParser
# Assume agents library components are correctly imported
from agents import Agent, Runner, function_tool, WebSearchTool
from pydantic import BaseModel
from typing import Optional, List, Dict, Any # Added List, Dict, Any for history typing

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
    # --- Existing Tool Code ---
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
            model="gpt-4.1", # Consider gpt-4o if available
            messages=messages,
            max_tokens=500,
        )
        # Ensure content is not None before returning
        return completion.choices[0].message.content or "AI analysis produced no text."
    except openai.APIError as e:
        logger.error(f"OpenAI API error: {e}", exc_info=True)
        return f"Error: AI service failed ({e.status_code})."
    except Exception as e:
        logger.error(f"Unexpected error: {e}", exc_info=True)
        return "Error: An unexpected error occurred while analyzing the image."
    # --- End of Existing Tool Code ---


# --- Agents ---
# --- Existing Agent Definitions ---
issue_detector_agent = Agent[ChatContext](
    name="Property Issue Detector",
    instructions=(
        "You are an expert in identifying issues in residential buildings based on user descriptions and conversation history. " # Added history mention
        "If the LATEST user message mentions an attached image (e.g., 'see the attached image', 'look at this picture') AND an image was actually provided for THIS turn, "
        "then call the 'analyze_property_image_tool' function, providing the user's latest text description relevant to the image as the 'user_description' argument. "
        "Use the conversation history for context but focus the tool call on the LATEST image description. "
        "Do NOT call the tool if no image was provided in the latest turn, even if mentioned earlier. "
        "If there is no new image, analyze the issue using the text description and conversation history. "
        "Provide a brief assessment and suggest next steps. Respond in Markdown."
    ),
    model="gpt-4o",
    tools=[analyze_property_image_tool]
)

faq_agent = Agent[ChatContext](
    name="Tenancy Agreement Expert",
    instructions=(
         "You are an expert on standard tenancy agreements and common landlord-tenant questions. "
         "Use the provided conversation history for context. " # Added history mention
        "You may use web search to look up current laws, local rules, or current events if asked, or whenever you do not know the answer from your own knowledge. "
        "Answer the user's LATEST query based on the history and general knowledge of typical rental agreements and tenant rights/responsibilities. "
        "Do not provide legal advice, but explain common clauses and procedures clearly. "
        "If the LATEST question is primarily about a specific property issue (like damage), state that this is outside your expertise and should be handled by the 'Property Issue Detector' or reported directly to the landlord/property manager according to the lease."
        "Consider the location of the user when giving advice, if mentioned in the history or query. "
        "Respond clearly in Markdown."

    ),
    model="gpt-4o-mini",
    tools=[WebSearchTool(search_context_size="medium")],
)

triage_agent = Agent[ChatContext](
    name="Real Estate Query Triage Agent",
    instructions=(
        "INTERNAL TASK: You are a routing agent. Analyze the LATEST user message within the conversation history. Your goal is to decide which specialist agent should handle the query. Ignore any images mentioned; image presence is handled by the system." # Added history mention
        "If the LATEST message primarily describes a potential PHYSICAL issue or damage within a property (e.g., 'leak', 'broken', 'mold', 'pests', 'noise problem', 'appliance not working'), "
        "hand off to the 'Property Issue Detector'. "
        "If the LATEST message is primarily about tenancy agreements, lease terms, tenant/landlord rights/responsibilities, rent, eviction, or standard rental procedures, hand off to the 'Tenancy Agreement Expert'."
        "If the query is ambiguous or covers both, prioritize the 'Property Issue Detector' if a physical issue is mentioned."
        "Use the conversation history ONLY for context to understand the LATEST message, not to change the routing decision based on past topics."
        "Output ONLY the name of the agent to hand off to (e.g., 'Property Issue Detector' or 'Tenancy Agreement Expert'). Do not add any other explanation or text."
    ),
    handoffs=[issue_detector_agent, faq_agent],
    model="gpt-4o-mini"
)
# --- End of Existing Agent Definitions ---


# --- Agent runner ---
# --- Existing run_agent_sync Definition ---
def run_agent_sync(starting_agent, input_data, context_obj=None): # Renamed input_text to input_data
    # Log input type and potentially length if it's a list
    input_info = input_data[:50] if isinstance(input_data, str) else f"List[{len(input_data)} items]" if isinstance(input_data, list) else str(type(input_data))
    logger.info(f"run_agent_sync: agent={getattr(starting_agent, 'name', starting_agent)}, input={input_info!r}, context={context_obj}")
    async def _run():
        return await Runner.run(
            starting_agent=starting_agent,
            input=input_data, # Pass the potentially list input
            context=context_obj
        )
    return async_to_sync(_run)()
# --- End of Existing run_agent_sync Definition ---


# --- API View ---
# --- Existing MultiAgentChatView Definition ---
class MultiAgentChatView(APIView):
    parser_classes = (MultiPartParser, FormParser)
    permission_classes = [permissions.AllowAny]
    def post(self, request, *args, **kwargs):
        user_id_str = str(request.user.id) if request.user.is_authenticated else "Anonymous"
        user_text = request.data.get('text', '').strip()
        user_image_file = request.FILES.get('image')
        history_json = request.data.get('history', '[]') # <<< Get history JSON

        logger.debug(f"API POST: user_id={user_id_str}, user_text={user_text[:50]!r}, image_present={'YES' if user_image_file else 'NO'}, history_len={len(history_json)}")

        # <<< Parse History >>>
        try:
            parsed_history: List[Dict[str, Any]] = json.loads(history_json)
            if not isinstance(parsed_history, list):
                raise ValueError("History is not a list")
            # Basic validation (can be more thorough)
            for item in parsed_history:
                if not isinstance(item, dict) or 'role' not in item or 'content' not in item:
                    raise ValueError("Invalid item in history list")
            logger.debug(f"Parsed history for non-stream request ({len(parsed_history)} messages).")
        except (json.JSONDecodeError, ValueError) as e:
            logger.warning(f"Invalid history format received in non-stream request: {e}. Defaulting to empty history.")
            parsed_history = []
        # <<< End Parse History >>>

        if not client: # Keep existing check
            return Response({"error": "AI service configuration error."},
                            status=status.HTTP_503_SERVICE_UNAVAILABLE)

        try:
            # --- Always reset global for demo ---
            global _POST_IMAGE_B64, _POST_IMAGE_TYPE
            _POST_IMAGE_B64 = None
            _POST_IMAGE_TYPE = None

            # <<< Prepare input data (history + new message) >>>
            input_data_for_agent: List[Dict[str, Any]] = parsed_history
            agent_to_run = None
            current_message_text = ""

            if user_image_file:
                logger.info("About to call agent: issue_detector_agent with image")
                raw_bytes = user_image_file.read()
                image_content_type = user_image_file.content_type
                b64 = base64.b64encode(raw_bytes).decode("utf-8")
                _POST_IMAGE_B64 = b64
                _POST_IMAGE_TYPE = image_content_type

                if not user_text:
                    current_message_text = "See the attached image."
                else:
                    current_message_text = user_text

                # Tell the agent text implies an image is present (as per original logic)
                # This might be redundant if agent instructions are updated, but kept for consistency
                current_message_text += " (See the attached image.)"
                input_data_for_agent.append({"role": "user", "content": current_message_text})
                agent_to_run = issue_detector_agent

            elif user_text:
                current_message_text = user_text
                input_data_for_agent.append({"role": "user", "content": current_message_text})
                agent_to_run = triage_agent # Triage agent handles text-only starts

            else:
                # No new text or image
                if not parsed_history: # Only error if there's also no history
                     return Response({"error": "Please provide text or an image."},
                                status=status.HTTP_400_BAD_REQUEST)
                else:
                    # If history exists but no new input, maybe return last message or special response?
                    # For now, let's error as the original code did not handle this state.
                    logger.warning("Non-stream request with history but no new input.")
                    return Response({"error": "No new message provided to continue."},
                                status=status.HTTP_400_BAD_REQUEST)

            # <<< Call run_agent_sync with the list input >>>
            agent_result = run_agent_sync(
                starting_agent=agent_to_run,
                input_data=input_data_for_agent, # Pass the list
                context_obj=ChatContext(user_id=user_id_str)
            )
            # <<< End Call run_agent_sync >>>


            # --- Existing Response Handling ---
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
            # --- End Existing Response Handling ---

        except openai.APIError as e: # Keep existing error handling
            logger.error(f"User {user_id_str}: OpenAI API error during agent execution: {e}", exc_info=True)
            error_message = f"AI service error ({e.status_code}): {getattr(e, 'message', str(e))}"
            return Response({"error": error_message}, status=status.HTTP_503_SERVICE_UNAVAILABLE)
        except Exception as e: # Keep existing error handling
            logger.exception(f"User {user_id_str}: An unexpected error occurred during agent processing.")
            return Response({"error": f"An internal server error occurred: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
# --- End of Existing MultiAgentChatView Definition ---


from django.http import StreamingHttpResponse
from rest_framework.permissions import AllowAny
# from openai.types.responses import ResponseTextDeltaEvent # Not directly used
import re # Keep existing import
import asyncio, json # Keep existing imports

# --- Existing MultiAgentChatStreamView Definition ---
class MultiAgentChatStreamView(APIView):
    permission_classes = [AllowAny]

    def post(self, request, *args, **kwargs):
        """
        Stream agent output using Server-Sent Events (SSE).
        """
        # ... (Keep user_id, user_text, user_image_file, history_json retrieval) ...
        user_id_str = str(request.user.id) if request.user.is_authenticated else "Anonymous"
        user_text = request.data.get('text', '').strip()
        user_image_file = request.FILES.get('image')
        history_json = request.data.get('history', '[]')

        logger.debug(f"API POST Stream Start: user_id={user_id_str}, text='{user_text[:50]}...', image={'YES' if user_image_file else 'NO'}, history_len={len(history_json)}")

        # --- Parse History (Keep existing) ---
        try:
            parsed_history: List[Dict[str, Any]] = json.loads(history_json)
            if not isinstance(parsed_history, list):
                raise ValueError("History is not a list")
            for item in parsed_history:
                if not isinstance(item, dict) or 'role' not in item or 'content' not in item:
                    raise ValueError("Invalid item in history list")
            logger.debug(f"Parsed history for stream request ({len(parsed_history)} messages).")
        except (json.JSONDecodeError, ValueError) as e:
            logger.warning(f"Invalid history format received in stream request: {e}. Defaulting to empty history.")
            parsed_history = []

        # --- Agent Selection Logic (Keep existing) ---
        agent = None
        context_obj = ChatContext(user_id=user_id_str)
        input_list_for_agent: List[Dict[str, Any]] = parsed_history
        current_message_text = ""

        global _POST_IMAGE_B64, _POST_IMAGE_TYPE
        _POST_IMAGE_B64 = None
        _POST_IMAGE_TYPE = None

        if user_image_file:
            # ... (Keep image handling logic) ...
            raw_bytes = user_image_file.read()
            image_content_type = user_image_file.content_type
            b64 = base64.b64encode(raw_bytes).decode("utf-8")
            _POST_IMAGE_B64 = b64
            _POST_IMAGE_TYPE = image_content_type
            if not user_text:
                 current_message_text = "See the attached image."
            else:
                 current_message_text = user_text
            current_message_text += " (See the attached image.)"
            input_list_for_agent.append({"role": "user", "content": current_message_text})
            agent = issue_detector_agent

        elif user_text:
            # ... (Keep text handling and triage logic) ...
            current_message_text = user_text
            input_list_for_agent.append({"role": "user", "content": current_message_text})
            triage_agent_result = run_agent_sync(
                starting_agent=triage_agent,
                input_data=input_list_for_agent,
                context_obj=context_obj
            )
            if triage_agent_result and hasattr(triage_agent_result, 'final_output') and triage_agent_result.final_output:
                final_output = triage_agent_result.final_output.lower()
                logger.debug(f"Triage agent output (used for routing): {final_output}")
                if "property issue detector" in final_output:
                    agent = issue_detector_agent
                    logger.info("Triage output indicates Property Issue Detector.")
                elif "tenancy agreement expert" in final_output:
                     agent = faq_agent
                     logger.info("Triage output indicates Tenancy Agreement Expert.")
                else:
                    logger.warning(f"Triage output '{final_output}' did not explicitly name a known agent. Defaulting to FAQ agent.")
                    agent = faq_agent
            else:
                logger.error(f"Triage agent did not provide a usable final_output. Result: {triage_agent_result}")
                return Response({"error": "Triage agent failed to determine how to handle the request."},
                                status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        else:
            # ... (Keep no input handling logic) ...
             if not parsed_history:
                 return Response({"error": "Please provide text or an image."}, status=status.HTTP_400_BAD_REQUEST)
             else:
                 logger.warning("Stream request with history but no new input.")
                 return Response({"error": "No new message provided to continue."}, status=status.HTTP_400_BAD_REQUEST)

        # --- Agent Name Determination (Keep existing) ---
        if not agent:
             logger.error("Agent determination failed unexpectedly before streaming.")
             return Response({"error": "Internal error determining agent."}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        agent_name = getattr(agent, "name", str(agent))
        logger.info(f"Starting stream with agent: {agent_name}")

        # --- Streaming Logic with CORRECTED Final Except Block Indentation ---
        async def event_stream():
            # This try block covers the entire streaming process
            try:
                result = Runner.run_streamed(agent, input=input_list_for_agent, context=context_obj)

                # Keep existing filtering logic if needed
                filtering_needed = (agent is issue_detector_agent or getattr(agent, "name", None) == "Property Issue Detector")
                in_tool_arg = filtering_needed
                tool_arg_buffer = ""
                bracket_level = 0

                async for event in result.stream_events():
                    # logger.debug(f"SSE Event Type: {event.type}") # Optional verbose log
                    if event.type == "raw_response_event" and hasattr(event.data, "delta"):
                        delta = event.data.delta
                        # --- Agent switch logic (Keep existing) ---
                        event_agent = None
                        if hasattr(event.data, "agent"):
                            event_agent = getattr(event.data, "agent", None)
                        elif hasattr(event, "agent"):
                            event_agent = getattr(event, "agent", None)
                        if event_agent and hasattr(event_agent, "name"):
                            event_agent_name = event_agent.name
                        elif event_agent:
                            event_agent_name = getattr(event_agent, "name", str(event_agent))
                        else:
                            event_agent_name = agent_name
                        # --- End agent switch logic ---

                        # --- Filtering (Keep existing) ---
                        if in_tool_arg:
                            tool_arg_buffer += delta
                            for ch in delta:
                                if ch == '{': bracket_level += 1
                                elif ch == '}': bracket_level -= 1
                            if bracket_level <= 0 and 'user_description' in tool_arg_buffer:
                                in_tool_arg = False
                                tool_arg_buffer = ""
                                logger.debug("Exiting tool arg filtering.")
                            continue
                        # --- End filtering ---

                        if delta:
                             yield f"data: {json.dumps({'delta': delta, 'agent': event_agent_name})}\n\n"

                    # --- End/Error Event Handling (Keep existing) ---
                    is_last = getattr(event, "is_last", False) or event.type == "final_result_event"
                    if is_last:
                        logger.info(f"End event received for stream from {agent_name}.")
                        yield "event: end\ndata: {}\n\n"
                        break

                    if event.type == "error_event":
                        error_data = getattr(event, 'data', {})
                        error_msg = error_data.get('error', 'Unknown agent error during streaming')
                        logger.error(f"Agent Error Event during stream from {agent_name}: {error_msg}")
                        yield f"data: {json.dumps({'error': str(error_msg), 'agent': agent_name})}\n\n"
                        yield "event: end\ndata: {}\n\n"
                        break

                logger.info(f"Agent stream loop finished normally for user {user_id_str} (Agent: {agent_name}).")

            # --- CORRECTED INDENTATION for the except block ---
            # This except block catches errors during the setup or execution of the stream within the try block above
            except Exception as e:
                logger.exception(f"Error during agent streaming execution for user {user_id_str} (Agent: {agent_name}): {e}")
                # Try to send an error message back through the stream if possible
                try:
                    error_payload = json.dumps({'error': f'Stream generation failed: {str(e)}', 'agent': agent_name})
                    yield f"data: {error_payload}\n\n"
                    yield "event: end\ndata: {}\n\n"
                except Exception as write_err:
                    # Log if we can't even write the error to the stream
                    logger.error(f"Failed to write final error to SSE stream: {write_err}")
            # --- End of CORRECTED INDENTATION ---

        # --- Return Streaming Response (Keep existing) ---
        response = StreamingHttpResponse(
            event_stream(), content_type='text/event-stream'
        )
        response['X-Accel-Buffering'] = 'no'
        response['Cache-Control'] = 'no-cache'
        logger.debug("Returning StreamingHttpResponse")
        return response