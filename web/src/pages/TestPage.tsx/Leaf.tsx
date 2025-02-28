interface LeafProps {
    path: string;
    checked: boolean;
}

const Leaf = ({ checked: parentChecked }: LeafProps) => {
    const [checked, setChecked] = useState(false);

    useEffect(() => {
        setChecked(parentChecked);
    }, [parentChecked]);

    return (
        <Box>

        </Box>
    )
}
