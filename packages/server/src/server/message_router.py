



def handle_message(m):
    listeners: dict[int, list[list]] = {}
    agent_id = m['data']['id']

    for channel in listeners.get(agent_id, []):
        channel.append(m)



