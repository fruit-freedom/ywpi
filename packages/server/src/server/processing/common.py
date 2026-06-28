class Reference:
    def __init__(self, ref: str) -> None:
        self.ref = ref

    def __repr__(self) -> str:
        return f'Reference(ref="{self.ref}")'

    def __hash__(self) -> int:
        return self.ref.__hash__()
    
    def __eq__(self, other: "Reference") -> bool:
        return self.ref == other.ref    
