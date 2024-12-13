import importlib
import argparse
import sys
import os

import ywpi


parser = argparse.ArgumentParser()
parser.add_argument('command', choices=['run'])
parser.add_argument('target', help='Path to launch target. Example: agents.test:func')
parser.add_argument('--id', type=str, help='Agent id')


def perform_run_command(args):
    module_path, _, method = args.target.partition(':')

    sys.path.insert(0, os.getcwd())
    module = importlib.import_module(module_path)

    # Register method
    if len(method) > 0:
        ywpi.method(module.__dict__[method])

    ywpi.serve(args.id if args.id is not None else 'ywpi-run')


def main():
    args = parser.parse_args()

    if args.command == 'run':
        perform_run_command(args)


if __name__ == '__main__':
    main()
