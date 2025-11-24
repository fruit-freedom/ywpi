import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { $createTextNode, $getNodeByKey, $getSelection, $isRangeSelection, $parseSerializedNode, BaseSelection, COMMAND_PRIORITY_HIGH, COMMAND_PRIORITY_LOW, EditorConfig, KEY_DOWN_COMMAND, KEY_TAB_COMMAND, LexicalEditor, RangeSelection, SELECTION_CHANGE_COMMAND, TextNode } from "lexical";
import { ForwardedRef, forwardRef, useEffect, useImperativeHandle, useRef } from "react";

export class AutocompleteNode extends TextNode {
    static getType(): string {
        return "autocomplete/text";
    }

    createDOM(config: EditorConfig): HTMLElement {
        const d = super.createDOM(config)
        d.style.color = 'lightgrey';
        return d;
    }
}

export interface CompletitionFnOutputs {
    completition?: string;
}

export interface AutocompletePluginRef {
    insertAutocomplete: (text: string) => void;
}

interface AutocompletePluginProps {
    completitionFn: () => Promise<CompletitionFnOutputs>;
}


class AutocompleteController {
    /*
        Complex state machine.

        States:
        1) Waiting trigger
        2) Completition generation
        3) Completition insert & waiting for Tab or cancel triggering

        *4) Completition cancelled
        5) Completition approved
    */
    __editor: LexicalEditor;
    __node?: AutocompleteNode;
    __cleanup: () => void;

    // Completition meta

    __completitionFnRunning: boolean;
    __completitionSelection: BaseSelection | null;
    __completitionFn: () => Promise<CompletitionFnOutputs>;

    __lastKeyDownEvent?: KeyboardEvent;
    __lastCompletitionFailed: boolean;

    constructor(editor: LexicalEditor, completitionFn: () => Promise<CompletitionFnOutputs>) {
        this.__editor = editor;
        this.__completitionFnRunning = false;
        this.__lastCompletitionFailed = false;
        this.__completitionSelection = null;

        const cb1 = this.__editor.registerCommand(KEY_TAB_COMMAND, this.__onKeyTabCommand.bind(this), COMMAND_PRIORITY_HIGH);
        const cb2 = this.__editor.registerCommand(KEY_DOWN_COMMAND, this.__onKeyDownCommand.bind(this), COMMAND_PRIORITY_LOW);
        const cb4 = editor.registerCommand(SELECTION_CHANGE_COMMAND, this.__onSelectionChangedCommand.bind(this),COMMAND_PRIORITY_HIGH);
        const cb3 = this.__editor.registerMutationListener(AutocompleteNode, this.__onNodeMutation.bind(this));

        const interval = setInterval(this.__backgroundTrigger.bind(this), 300)
        // this.__completitionFn = this.__mockCompletitionFn;
        this.__completitionFn = completitionFn;

        this.__cleanup = () => {
            cb1();
            cb2();
            cb3();
            cb4();
            clearInterval(interval);
        }
    }

    cleanup() {
        this.__cleanup();
    }

    __backgroundTrigger() {
        // console.log("Check")

        const run = () => {
            if (
                this.__node === undefined &&
                this.__completitionFnRunning === false &&
                this.__lastKeyDownEvent?.code !== "Escape" &&
                this.__lastCompletitionFailed !== true
            ) {
                this.__editor.update(() => this.__$executeCompletition())
            }
        }

        /*
            Actively run completition when:
            - user make space
            - user paste ',' or '.'
            - user start new paragraph
        */
        
        const keys = new Set(["Space", "Comma", "Period"])
        if (this.__lastKeyDownEvent) {
            const duration = performance.now() - this.__lastKeyDownEvent.timeStamp;
            // console.log(duration);
            if (duration > 300) { // 1000 for llm based autocomplete
                run();
            } else if (duration > 200 && keys.has(this.__lastKeyDownEvent.code)) {
                run();
            }
        }

    }

    __$executeCompletition() {
        if (!this.__completitionFnRunning) {
            this.__completitionSelection = $getSelection();
            this.__completitionFnRunning = true;
            this.__completitionFn()
            .then(e => {
                if (e.completition)
                    this.insert(
                        e.completition,
                        this.__completitionSelection ? this.__completitionSelection : undefined
                    );
                return e;
            })
            .catch(e => {
                console.warn("Error while execute completitionFn", e)
                this.__lastCompletitionFailed = true;
            })
            .finally(() => {
                this.__completitionFnRunning = false;
                this.__completitionSelection = null;
            })
        }
    }

    remove() {
        if (this.__node) {
            this.__editor.update(() => {
                this.__node?.getLatest().remove();
                this.__node = undefined;
            })
        }
    }

    insert(text: string, initSelection?: BaseSelection) {
        this.__editor.update(() => {
            if (this.__node) {
                if (this.__node.isAttached()) {
                    this.__node.getLatest().remove();
                    this.__node = undefined;
                }
            }

            const node = new AutocompleteNode(text);
            const selection = $getSelection();
            // const selection = initSelection;
            if ($isRangeSelection(selection)) {
                const anchor = $getNodeByKey(selection.anchor.key);
                if (anchor?.getType() != "paragraph") {
                    // anchor?.insertAfter(node); // OLD

                    // Text node
                    const content = anchor.getTextContent();
                
                    const prefix = $createTextNode(content.substring(0, selection.anchor.offset));
                    const suffix = $createTextNode(content.substring(selection.anchor.offset));

                    anchor.insertBefore(prefix);
                    prefix.insertAfter(node);
                    node.insertAfter(suffix);
                    anchor?.remove();
                    prefix.selectEnd();
                }
                else {
                    anchor?.append(node);
                }
                this.__node = node;
            }
        })
    }

    __onSelectionChangedCommand() {
        if (this.__node === undefined) {
            return false;
        }

        this.__editor.update(() => {
            const selection = $getSelection();
            if ($isRangeSelection(selection)) {

            }
        });

        return false;
    }

    __onKeyTabCommand(e: KeyboardEvent, editor: any) {
        if (this.__node === undefined) {
            return false;
        }

        editor.update(() => {
            const selection = $getSelection();
            if ($isRangeSelection(selection)) {
                const anchor = $getNodeByKey(selection.anchor.key);
                const nextNode = anchor?.getNextSibling();
                if (anchor && nextNode && nextNode?.getType() == "autocomplete/text") {
                    const textNode = $createTextNode(nextNode.getTextContent());
                    anchor?.insertAfter(textNode);
                    nextNode.remove();  // TODO: Remove `this.__node` directly
                    textNode.selectEnd();

                    // TODO: Important: join text nodes [before][tab][after] to one
                    this.__node = undefined;
                }
            }
        });

        e.preventDefault();
        return true;
    }

    __mockCompletitionFn(): Promise<string> {
        return new Promise((res, rej) => {
            setTimeout(() => {
                res("completition text");
            }, 500);
        });
    }

    __onKeyDownCommand(e: KeyboardEvent, editor: any) {
        // editor.update(() => {

        //     const selection = $getSelection();
        //     if ($isRangeSelection(selection)) {
        //         const anchor = $getNodeByKey(selection.anchor.key);
        //         const nextNode = anchor?.getNextSibling();
        //         if (anchor && nextNode && nextNode?.getType() == "autocomplete/text") {
        //             ++this.__keyPressedCount;
        //             if (this.__keyPressedCount > 4) {
        //                 nextNode.remove();
        //                 this.__node = undefined;
        //                 this.__keyPressedCount = 0;
        //             }
        //         }
        //     }
        // });


        editor.update(() => {
            if (this.__node === undefined) { // (1) or (2) state
                if (this.__completitionFnRunning === false) { // (1) state
                    // Waiting for trigger

                    // Force generation Crlt + Space
                    if ((e.ctrlKey || e.metaKey) && e.code === "Space") {
                        this.__$executeCompletition();
                    }
                }
                else { // (2) state
                }
            }
            else { // (3) state
                if (e.key === "Escape") {
                    this.__node.getLatest().remove();
                    this.__node = undefined;
                } else if (e.key !== "Tab") {
                    this.__node.getLatest().remove();
                    this.__node = undefined;
                }
            }



            // const selection = $getSelection();
            // console.log("selection", selection)
            // if ($isRangeSelection(selection)) {
            //     if (selection.anchor.type == "text") {
            //         const anchorNode = $getNodeByKey(selection.anchor.key);
            //         console.log("anchorNode", anchorNode)
            //         const curChar = (anchorNode?.getLatest() as TextNode).getTextContent()[selection.anchor.offset];
            //         console.log("curChar", curChar, (anchorNode?.getLatest() as TextNode).getTextContent())
            //     }
            // }

            // ++this.__keyPressedCount;
            // if (this.__keyPressedCount > 4) {
            //     this.__keyPressedCount = 0;
            //     this.__completitonPromise = this.__generateCompletition()
            //     .then(e => {
            //         this.insert(e);
            //         this.__completitonPromise = undefined;
            //         return e;
            //     })
            // }
            // return;

            // const selection = $getSelection();
            // if ($isRangeSelection(selection)) {
            //     const anchor = $getNodeByKey(selection.anchor.key);
            //     const nextNode = anchor?.getNextSibling();
            //     if (anchor && nextNode && nextNode?.getType() == "autocomplete/text") {
            //         ++this.__keyPressedCount;
            //         if (this.__keyPressedCount > 4) {
            //             nextNode.remove();
            //             this.__node = undefined;
            //             this.__keyPressedCount = 0;
            //         }
            //     }
            // }
        });

        this.__lastKeyDownEvent = e;
        if (this.__lastCompletitionFailed) {
            this.__lastCompletitionFailed = false;
        }
        return false;
    }

    __onNodeMutation(e: any) {
        this.__editor.read(() => {
            if (this.__node?.isAttached()) {
                const key = this.__node?.getLatest().getKey();
                if (key && e.has(key)) {
                    if (e.get(key) === "destroyed") {
                        this.__node = undefined;
                    }
                }
            }
        })
    }
}


export const AutocompletePlugin =
forwardRef(function ContentAccessPlugin(props: AutocompletePluginProps, ref: ForwardedRef<AutocompletePluginRef>) {
    const [editor] = useLexicalComposerContext();
    const controller = useRef<AutocompleteController>();
    useEffect(() => {
        controller.current = new AutocompleteController(editor, props.completitionFn);

        return () => controller.current?.cleanup();
    }, [props.completitionFn]);

    useImperativeHandle(ref, () => {
        return {
            insertAutocomplete: (text: string) => {
                controller.current?.insert(text)
            },
        }
    }, [editor]);

    return null;
})

