import { PDFNode } from "./PDFNode";
import { TextNode, JSONNode, StringListNode, MarkdownNode } from "./TextNodes";
import { RetrieverNode } from "./RetrieverNode";
import { ImageNode } from "./ImageNode";

export const nodeTypes = {
    image: ImageNode,
    text: TextNode,
    pdf: PDFNode,
    json: JSONNode,
    retriever: RetrieverNode,
    strings: StringListNode,
    markdown: MarkdownNode,
};
