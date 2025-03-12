Ywpi
----

Платформа позволяет интерактивно подключать пользовательские алгоритмы для обработки данных.

# Quick start

Для подключения собственного метода достаточно установить последнюю версию пакета:

```bash
pip install https://github.com/fruit-freedom/ywpi.git
```

И запустить следующий скрипт:


```python
import ywpi

@ywpi.method
def greetings(name: str):
    print(f'Greet for {name}')
    return {
        'text': f'{name}'
    }

ywpi.serve('MyIdentifier')
```

Далее на странице методов можно наблюдать сформированную форму для вызова метода:

![](greetings_method.png)



# Documentation

[Описание проблематики и решения](long_description.md)
