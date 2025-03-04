import { PDFNode } from "./PDFNode";
import { TextNode, JSONNode, StringListNode, MarkdownNode } from "./TextNodes";
import { RetrieverNode } from "./RetrieverNode";
import { ImageNode } from "./ImageNode";
import { WithWrapper } from "./WithDragHandle";

export const nodeTypes = {
    image: ImageNode,
    text: WithWrapper(TextNode),
    pdf: WithWrapper(PDFNode),
    json: JSONNode,
    retriever: RetrieverNode,
    strings: StringListNode,
    markdown: MarkdownNode,
};
