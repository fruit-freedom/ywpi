from . import parsing

schema = {
    "steps": {
        "1": {
            "method": "algorithm-service/InsulatorAndDamperDetector",
            "conditions": [
                { "$ref": "#/payload/exists" }
            ],
            "inputs": {
                "image": {
                    "$ref": "#/payload/image"
                }
            },
            "outputs": {
                "results": None
            }
        }
    },
    "payload": {
        "image": None,
        "exists": None
    },
    "returns": {
        "detect_items": {
            "$ref": "#/steps/1/outputs/results"
        }
    }
}

data = parsing.referencify(schema)

print(data, end='\n\n')
print(schema)

