import { PDFNode } from "./PDFNode";
import { TextNode, JSONNode, StringListNode, MarkdownNode, Chat, Context } from "./TextNodes";
import { RetrieverNode } from "./RetrieverNode";
import { ImageNode } from "./ImageNode";
import { WithWrapper } from "./WithDragHandle";
import { IssueNode } from "./IssueNode";

export const nodeTypes = {
    image: ImageNode,
    text: WithWrapper(TextNode),
    pdf: WithWrapper(PDFNode),
    json: JSONNode,
    retriever: RetrieverNode,
    strings: StringListNode,
    markdown: MarkdownNode,
    chat: WithWrapper(Chat),
    context: WithWrapper(Context),
    issue: WithWrapper(IssueNode),
};

