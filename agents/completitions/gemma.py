from ollama import chat as ollama_chat
from ollama import ChatResponse

from ywpi import contexts


AUTOCOMPLETE_PROMPT_FIM = """
You are fill in the middle agent that help user to fill gaps based on the context (prefix and suffix).
You MUST response only with text, do not include prefix or suffix into response.

<context>
{prefix}<fill_me>{suffix}
</context>

Return the fill_me content.
"""


def find_left(node: contexts.LexicalNode, key: str):
    if node._key == key:
        return node.content


@contexts.completition
def gemma_completition(
    selection: contexts.Selection,
    ctx: contexts.Context[contexts.Markdown]
):
    left, _ = ctx.data.tree.root.content_left(selection.anchor)
    right = (ctx.data.tree.root.content)[len(left) - 1:]

    response: ChatResponse = ollama_chat(model='gemma3:12b', messages=[
        {
            "role": "system",
            "content": "You are completition agent"
        },
        {
            "role": "user",
            "content": AUTOCOMPLETE_PROMPT_FIM.format(prefix=left, suffix=right)
        },
    ])

    completition = response.message.content
    # print(text, " ----> ", completition)

    return completition
