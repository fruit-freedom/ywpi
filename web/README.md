```
Notes
If you have controls (like a slider) or other elements inside your custom node that should not drag the node you can add the class nodrag to those elements. This prevents the default drag behaviour as well as the default node selection behaviour when elements with this class are clicked.

export default function CustomNode(props: NodeProps) {
  return (
    <div>
      <input className="nodrag" type="range" min={0} max={100} />
    </div>
  );
}
If you have scroll containers inside your custom node you can add the class nowheel to disable the default canvas pan behaviour when scrolling inside your custom nodes.

export default function CustomNode(props: NodeProps) {
  return (
    <div className="nowheel" style={{ overflow: 'auto' }}>
      <p>Scrollable content...</p>
    </div>
  );
}
When creating your own custom nodes, you will also need to remember to style them! Custom nodes have no default styles unlike the built-in nodes so you can use any styling method you like such as styled components or tailwind.

```