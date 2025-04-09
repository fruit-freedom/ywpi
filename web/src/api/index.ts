export const executeMethod = async (agentId: string, methodName: string, inputs: any) => {
    const response = await fetch('/api/run_task', {
        method: 'POST',
        body: JSON.stringify({
            agent_id: agentId,
            method: methodName,
            inputs
        }),
        headers: { 'Content-Type': 'application/json' }
    });

    return await response.json();
}

