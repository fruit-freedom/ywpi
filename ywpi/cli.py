import importlib
import argparse
import sys
import os

import watchfiles

import ywpi


parser = argparse.ArgumentParser()
parser.add_argument('command', choices=['run'])
parser.add_argument('target', help='Path to launch target. Example: agents.test:func')
parser.add_argument('--id', type=str, help='Agent id', default='ywpi-run')
parser.add_argument('--name', type=str, help='Agent name', default='Untitled')
parser.add_argument('--reload', action='store_true', help='Enable auto reloading', default=False)


def perform_run_command(args):
    module_path, _, method = args.target.partition(':')

    sys.path.insert(0, os.getcwd())
    module = importlib.import_module(module_path)

    # Register method
    if len(method) > 0:
        ywpi.method(module.__dict__[method])

    ywpi.serve(args.id, args.name)


def main():
    args = parser.parse_args()

    if args.command == 'run':
        if args.reload:
            watchfiles.run_process('.', target=perform_run_command, args=(args,))
        else:
            perform_run_command(args)


if __name__ == '__main__':
    main()
