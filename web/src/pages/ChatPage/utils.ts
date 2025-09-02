export function applyMongoUpdatesToObject(target, updateOps) {
    for (const update of updateOps) {
        for (const [operator, fields] of Object.entries(update)) {
        switch (operator) {
            case '$set':
                for (const [key, value] of Object.entries(fields)) {
                    setNestedValue(target, key, value);
                }
                break;

            case '$inc':
                for (const [key, value] of Object.entries(fields)) {
                    const current = getNestedValue(target, key) || 0;
                    setNestedValue(target, key, current + value);
                }
                break;

            case '$push':
                for (const [key, value] of Object.entries(fields)) {
                    const arr = getNestedValue(target, key);
                    if (Array.isArray(arr)) {
                    arr.push(value);
                    } else {
                        setNestedValue(target, key, [value]);
                    }
                }
                break;

            case '$concat':
                for (const [key, value] of Object.entries(fields)) {
                    const current = getNestedValue(target, key) || '';
                    setNestedValue(target, key, current + value);
                }
                break;

            // Add more operators as needed

            default:
            throw new Error(`Unsupported operator: ${operator}`);
        }
        }
    }
    return target;
}

// Helpers for nested properties
function getNestedValue(obj, path) {
    return path.split('.').reduce((o, k) => (o || {})[k], obj);
}

function setNestedValue(obj, path, value) {
    const keys = path.split('.');
    let current = obj;
    while (keys.length > 1) {
        const key = keys.shift();
        if (!current[key] || typeof current[key] !== 'object') current[key] = {};
        current = current[key];
    }
    current[keys[0]] = value;
}

export function generateRandomString() {
    let result = '';
    const length = 8;
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    for (let i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return result;
}
