from setuptools import setup
import os

__version__ = "0.0.1"

def read_requirements(file):
    requirements = []
    if os.path.exists(file):
        requirements = open(file).read().strip().split("\n")
    return requirements

setup(
    name="ywpi",
    version=__version__,
    author="Alexandr Kozlovsky",
    description="Advance log sytem",
    long_description="",
    zip_safe=True,
    python_requires=">=3.11",
    packages=[
        'ywpi',
    ],
    install_requires=read_requirements('requirements.txt'),
    entry_points={
        'console_scripts': ['ywpi=ywpi.cli:main']
    }
)
