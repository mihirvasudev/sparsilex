import json
import asyncio
from typing import AsyncGenerator
import anthropic
from core.config import settings
from services.data_service import get_dataset, get_dataset_schema, get_column_stats
from services.stats_service import run_analysis
from agent.system_prompt import build_system_prompt
from agent.tools import TOOL_DEFINITIONS
from agent.memory import ConversationMemory

_conversations: dict[str, ConversationMemory] = {}


def _get_or_create_memory(conversation_id: str | None, dataset_id: str) -> tuple[str, ConversationMemory]:
    if conversation_id and conversation_id in _conversations:
        return conversation_id, _conversations[conversation_id]
    cid = conversation_id or f"conv-{id(object())}"
    mem = ConversationMemory(dataset_id=dataset_id)
    _conversations[cid] = mem
    return cid, mem


def _execute_tool(tool_name: str, tool_input: dict, dataset_id: str) -> dict:
    """Execute a tool and return the result."""
    from agent.tools.inspect_data import inspect_data
    from agent.tools.clean_data import clean_data
    from agent.tools.detect_outliers import detect_outliers
    from agent.tools.check_normality import check_normality
    from agent.tools.check_assumptions import check_assumptions
    from agent.tools.run_test import run_test_tool
    from agent.tools.create_plot import create_plot
    from agent.tools.code_tools import (
        write_file_tool, read_file_tool, edit_file_tool,
        list_files_tool, run_in_session_tool, read_session_state_tool,
    )

    dispatch = {
        "inspect_data": inspect_data,
        "clean_data": clean_data,
        "detect_outliers": detect_outliers,
        "check_normality": check_normality,
        "check_assumptions": check_assumptions,
        "run_test": run_test_tool,
        "create_plot": create_plot,
        # Code-mode tools
        "write_file": write_file_tool,
        "read_file": read_file_tool,
        "edit_file": edit_file_tool,
        "list_files": list_files_tool,
        "run_in_session": run_in_session_tool,
        "read_session_state": read_session_state_tool,
    }

    if tool_name == "open_analysis_panel":
        return {"action": "open_analysis_panel", **tool_input}

    if tool_name not in dispatch:
        return {"error": f"Unknown tool: {tool_name}"}

    try:
        return dispatch[tool_name](dataset_id=dataset_id, **tool_input)
    except Exception as e:
        return {"error": f"{type(e).__name__}: {str(e)}"}


async def run_agent(
    dataset_id: str, message: str, conversation_id: str | None
) -> AsyncGenerator[dict, None]:
    """Run the research agent in an agentic loop, yielding SSE events."""

    conv_id, memory = _get_or_create_memory(conversation_id, dataset_id)

    # Build context
    schema = get_dataset_schema(dataset_id)
    system_prompt = build_system_prompt(schema, memory.analysis_history)

    # Add user message
    memory.add_message("user", message)

    client = anthropic.Anthropic(api_key=settings.anthropic_api_key)

    # Yield conversation ID
    yield {"event": "meta", "data": json.dumps({"conversation_id": conv_id})}

    # Agentic loop
    max_iterations = 10
    for _ in range(max_iterations):
        # Retry with backoff for rate limits
        for attempt in range(3):
            try:
                response = client.messages.create(
                    model="claude-haiku-4-5-20251001",
                    max_tokens=2048,
                    system=system_prompt,
                    messages=memory.messages,
                    tools=TOOL_DEFINITIONS,
                )
                break
            except anthropic.RateLimitError:
                wait = 15 * (attempt + 1)
                yield {
                    "event": "message",
                    "data": json.dumps({"type": "thinking", "content": f"Rate limited, retrying in {wait}s..."}),
                }
                await asyncio.sleep(wait)
        else:
            yield {
                "event": "message",
                "data": json.dumps({"type": "message", "content": "Rate limit exceeded. Please try again in a minute."}),
            }
            break

        # Process response content blocks
        has_tool_use = False
        tool_results = []

        for block in response.content:
            if block.type == "text":
                # Parse [POINT:target:label] tags for companion buddy
                import re
                point_pattern = re.compile(r'\[POINT:([^:\]]+):([^\]]+)\]')
                clean_text = point_pattern.sub('', block.text).strip()
                points = point_pattern.findall(block.text)

                yield {
                    "event": "message",
                    "data": json.dumps({"type": "message", "content": clean_text}),
                }

                for target, label in points:
                    yield {
                        "event": "message",
                        "data": json.dumps({"type": "point_at", "target": target.strip(), "label": label.strip()}),
                    }

            elif block.type == "tool_use":
                has_tool_use = True

                # Stream the tool call
                yield {
                    "event": "message",
                    "data": json.dumps({
                        "type": "tool_call",
                        "tool": block.name,
                        "tool_use_id": block.id,
                        "args": block.input,
                    }),
                }

                # Execute the tool
                result = _execute_tool(block.name, block.input, dataset_id)

                # Handle UI actions
                if block.name == "open_analysis_panel":
                    yield {
                        "event": "message",
                        "data": json.dumps({
                            "type": "ui_action",
                            "action": "open_analysis",
                            **result,
                        }),
                    }

                # Track analysis results
                if block.name == "run_test" and "error" not in result:
                    memory.add_analysis_result(result)

                # Stream tool result
                yield {
                    "event": "message",
                    "data": json.dumps({
                        "type": "tool_result",
                        "tool": block.name,
                        "tool_use_id": block.id,
                        "result": result,
                    }),
                }

                tool_results.append({
                    "type": "tool_result",
                    "tool_use_id": block.id,
                    "content": json.dumps(result),
                })

        # Add assistant response to memory
        memory.add_raw_message({"role": "assistant", "content": response.content})

        if has_tool_use:
            # Feed tool results back to Claude and continue the loop
            memory.add_raw_message({"role": "user", "content": tool_results})
            await asyncio.sleep(0)  # Yield control
        else:
            # No more tool calls — agent is done
            break

    yield {"event": "message", "data": json.dumps({"type": "done"})}
