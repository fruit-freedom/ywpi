import importlib
import argparse
import sys
import os
from pathlib import Path

import watchfiles

import ywpi
from ywpi.logger import logger
import ywpi.stub
import ywpi.stub.generation

parser = argparse.ArgumentParser()
command_subparsers = parser.add_subparsers(dest='command')

run_parser = command_subparsers.add_parser('run')
run_parser.add_argument('target', help='Path to launch target. Example: agents.test:func')
run_parser.add_argument('--id', type=str, help='Agent id', default='ywpi-run')
run_parser.add_argument('--name', type=str, help='Agent name', default='Untitled')
run_parser.add_argument('--project', type=str, help='Project ID')
run_parser.add_argument('--reload', action='store_true', help='Enable auto reloading', default=False)

command_subparsers.add_parser('methods')

sync_parser = command_subparsers.add_parser('sync')
sync_parser.add_argument('stub_file_path', help='Path to file with stub. Example: app/stub.py')


def perform_run_command(args):
    module_path, _, method = args.target.partition(':')

    sys.path.insert(0, os.getcwd())

    # Truncate `.py` extension
    # and replace `/` with `.` for fs path handling (i.e. `agets/search.py`)
    if module_path.endswith('.py'):
        module_path = module_path[:-3]
    module_path = module_path.replace('/', '.')

    module = importlib.import_module(module_path)

    # Register method
    if len(method) > 0:
        ywpi.method(module.__dict__[method])

    kwargs = {}
    if args.project is not None: kwargs['project'] = args.project

    ywpi.serve(args.id, args.name, **kwargs)


def perform_sync(args):
    stub_file_path = Path(args.stub_file_path)
    pyi_file_path = stub_file_path.with_suffix(".pyi")

    methods = ywpi.get_methods()
    content = ywpi.stub.generation.generate_stub_file_content(methods)
    
    with open(pyi_file_path, 'w') as file:
        file.write(content)


def main():
    args = parser.parse_args()

    def callback(e):
        path = os.path.relpath(next(iter(e))[1], os.getcwd())
        logger.warning(f"WatchFiles detected changes in '{path}'. Reloading...")

    if args.command == 'run':
        if args.reload:
            watchfiles.run_process('', target=perform_run_command, args=(args,), callback=callback)
        else:
            perform_run_command(args)
    elif args.command == 'methods':
        for m in ywpi.get_methods():
            print(f'{m.agent_id}/{m.name}')
    elif args.command == 'sync':
        perform_sync(args)


if __name__ == '__main__':
    main()
