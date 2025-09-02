from pathlib import Path
from typing import Dict

this_file_dir = Path(__file__).parent

files = [
    this_file_dir / "packages/ywpi_hub/src/ywpi_hub/hub_pb2_grpc.py",
    # this_file_dir / "packages/autogen-ext/src/autogen_ext/runtimes/grpc/protos/agent_worker_pb2_grpc.pyi",
]

substitutions: Dict[str, str] = {
    "\nimport hub_pb2 as hub__pb2\n": "\nfrom . import hub_pb2 as hub__pb2\n",
    # "\nimport agent_worker_pb2\n": "\nfrom . import agent_worker_pb2\n",
    # "\nimport cloudevent_pb2 as cloudevent__pb2\n": "\nfrom . import cloudevent_pb2 as cloudevent__pb2\n",
    # "\nimport cloudevent_pb2\n": "\nfrom . import cloudevent_pb2\n",
}


def main():
    for file in files:
        with open(file, "r") as f:
            content = f.read()

        print("Fixing imports in file:", file)
        for old, new in substitutions.items():
            content = content.replace(old, new)

        with open(file, "w") as f:
            f.write(content)


if __name__ == "__main__":
    main()

