"""
Traducción al español de la página CreatingKeyValuePairs (capítulo 12, Diccionarios),
que no estaba incluida en la traducción original de futurecoder.

Ejecuta `python -m translations.extra.apply_extra_es` para añadir estas cadenas
al archivo translations/locales/es/LC_MESSAGES/futurecoder.mo
"""

P = "pages.CreatingKeyValuePairs."
S = P + "steps."

CODE_BITS = {
    "\"OK, here's your cart so far:\"": "\"OK, esto es lo que llevas en tu carro:\"",
    "'How many?'": "'¿Cuántos?'",
    "'What would you like to buy?'": "'¿Qué te gustaría comprar?'",
    "'avocado'": "'aguacate'",
    "'avocat'": "'avocat'",
    "'lawyer'": "'abogado'",
    "___": "___",
    "buy_quantity": "comprar_cantidad",
    "english": "espanol",
    "english_to_french": "espanol_a_frances",
    "english_to_german": "espanol_a_aleman",
    "french_to_german": "frances_a_aleman",
    "make_english_to_german": "crear_espanol_a_aleman",
    "new_dict": "nuevo_dict",
    "reverse": "inversa",
    "swap_keys_values": "intercambiar_claves_valores",
    "total_cost_per_item": "coste_total_por_item",
    "totals": "totales",
}

TEXTS = {
    P + "title": "Crear pares clave-valor",

    S + "list_append_reminder.text": """\
Ahora aprenderemos a añadir pares clave-valor a un diccionario,
por ejemplo para poder llevar la cuenta de lo que compra el cliente.
Antes de ver los diccionarios, recordemos cómo añadir elementos a una lista. Ejecuta este programa:

    __copyable__
__code0__""",

    S + "list_assign_reminder.text": """\
Muy sencillo. También podemos cambiar el valor en un índice, reemplazándolo por otro diferente:

    __copyable__
__code0__""",

    S + "list_assign_invalid.text": """\
¿Y si usáramos esa idea para crear nuestra lista desde el principio?
Sabemos que queremos una lista donde `carro[0]` sea `'perro'` y `carro[1]` sea `'caja'`, así que digámoslo directamente:

    __copyable__
__code0__""",

    S + "dict_assignment_valid.text": """\
Lo siento, eso no está permitido. En las listas, la asignación con subíndices solo funciona con índices válidos que ya existen.
¡Pero eso no ocurre con los diccionarios! Prueba esto:

__code0__

Observa que `{}` significa un diccionario vacío, es decir, un diccionario sin pares clave-valor.
Es similar a `[]`, que significa una lista vacía, o `""`, que significa una cadena vacía.""",

    S + "buy_quantity_exercise.text": """\
Eso es exactamente lo que necesitamos. Ya sea que el cliente diga que quiere 500 o 5 millones de perros,
podemos poner esa información directamente en nuestro diccionario. Así que, como ejercicio, hagamos una versión genérica de eso.
Escribe una función `comprar_cantidad(cantidades, item, cantidad)` que añada un nuevo par clave-valor al diccionario `cantidades`.
Aquí tienes un código inicial:

    __copyable__
__code0__

Observa que `comprar_cantidad` debe *modificar* el diccionario que recibe, y no necesita hacer `return` ni `print` de nada.
Puedes suponer que `item` todavía no está en `cantidades`.""",

    S + "buy_quantity_exercise.requirements":
        "Tu función debe modificar el argumento `cantidades`. No necesita hacer `return` ni `print` de nada.",

    S + "buy_quantity_exercise.hints.0.text": "El cuerpo de `comprar_cantidad` solo necesita una línea de código sencilla.",
    S + "buy_quantity_exercise.hints.1.text": "Es parecida a algunas de las líneas del paso anterior, pero con variables en lugar de valores fijos.",
    S + "buy_quantity_exercise.hints.2.text": "¡Ten cuidado con las comillas!",
    S + "buy_quantity_exercise.hints.3.text": "`'perro'` es un ejemplo de un valor para `item`.",
    S + "buy_quantity_exercise.hints.4.text": "¿Cuál sería un ejemplo de un valor para `cantidad`?",
    S + "buy_quantity_exercise.hints.5.text": "Para `'perro'`, arriba era `500`.",
    S + "buy_quantity_exercise.hints.6.text": "Estás haciendo una versión genérica de `cantidades['perro'] = 500`.",
    S + "buy_quantity_exercise.hints.7.text": "La parte `cantidades` está bien tal como está.",
    S + "buy_quantity_exercise.hints.8.text": "Mantén también los `[]` y el `=`.",
    S + "buy_quantity_exercise.hints.9.text": "Recuerda que `item` es una variable, y `'item'` es una cadena literal.",
    S + "buy_quantity_exercise.hints.10.text": "Reemplaza `'perro'` por `item`.",
    S + "buy_quantity_exercise.hints.11.text": "Reemplaza `500` por `cantidad`.",
    S + "buy_quantity_exercise.hints.12.text": "No uses `'item'` ni `'cantidad'`; usa directamente las variables `item` y `cantidad`.",

    S + "buy_quantity_input_test.text": """\
¡Bien hecho! Pruébalo de forma interactiva:

    __copyable__
__code0__

Observa la parte `int(input())`: `input()` devuelve una cadena, y `cantidad` debe ser un entero
(un número sin decimales). Esto fallará si escribes algo que no sea un número, pero por ahora está bien.""",

    S + "total_cost_per_item_exercise.text": """\
¡Gracias por comprar con nosotros! Veamos cuánto acabas de gastar en cada artículo.

Antes definimos una función `coste_total(cantidades, precios)` que devolvía un único número
con el total de todos los artículos del carro. Ahora hagamos una función `coste_total_por_item(cantidades, precios)`
que devuelva un nuevo diccionario con el coste total de cada artículo:

    __copyable__
__code0__""",

    S + "total_cost_per_item_exercise.requirements":
        "Ejecuta el programa de arriba, pero reemplaza `___` por el código correcto.",

    S + "total_cost_per_item_exercise.hints.0.text": "Solo necesitas completar la parte `___`.",
    S + "total_cost_per_item_exercise.hints.1.text": "Pero si quieres, también puedes poner ahí el nombre de una variable y luego añadir una nueva línea debajo.",
    S + "total_cost_per_item_exercise.hints.2.text": "Mira las pruebas con `assert_equal`. En el primer ejemplo, la salida esperada es `{'manzana': 6}`. ¿Por qué?",
    S + "total_cost_per_item_exercise.hints.3.text": "Porque el cliente compró 2 manzanas, y cada manzana cuesta 3, así que el coste total es `2 * 3 = 6`.",
    S + "total_cost_per_item_exercise.hints.4.text": "La parte `'caja': 5` se ignora porque el cliente no compró ninguna caja. Solo significa que el precio de una caja es 5.",
    S + "total_cost_per_item_exercise.hints.5.text": "Necesitas añadir un nuevo par clave-valor a un diccionario.",
    S + "total_cost_per_item_exercise.hints.6.text": "Identifica el diccionario, la clave y el valor.",
    S + "total_cost_per_item_exercise.hints.7.text": "Todos están ya presentes en el código dado.",
    S + "total_cost_per_item_exercise.hints.8.text": "El valor es el coste total de ese artículo, que es la cantidad multiplicada por el precio.",
    S + "total_cost_per_item_exercise.hints.9.text": "Es decir, `cantidades[item] * precios[item]`.",
    S + "total_cost_per_item_exercise.hints.10.text": "El diccionario es lo que esta función crea, construye y devuelve.",
    S + "total_cost_per_item_exercise.hints.11.text": "Es decir, `totales`.",
    S + "total_cost_per_item_exercise.hints.12.text": "Observa que `'manzana'` es una clave en los tres diccionarios de esa prueba.",
    S + "total_cost_per_item_exercise.hints.13.text": "Es decir, los diccionarios `cantidades`, `precios` y `totales`.",

    S + "make_english_to_german_exercise.text": """\
¡Perfecto! Es como tener un buen recibo lleno de información útil.

Volvamos al ejemplo de usar diccionarios para traducir. Supón que tenemos un diccionario
para traducir del español al francés, y otro para traducir del francés al alemán.
Usémoslos para crear un diccionario que traduzca del español al alemán:

    __copyable__
__code0__""",

    S + "make_english_to_german_exercise.hints.0.text": "Necesitas crear un diccionario nuevo y llenarlo con pares clave-valor que dependan de los dos diccionarios de entrada.",
    S + "make_english_to_german_exercise.hints.1.text": "Ya has visto código que hace esto antes.",
    S + "make_english_to_german_exercise.hints.2.text": "Concretamente, en el paso anterior. La estructura general que buscas es similar a `coste_total_por_item`.",
    S + "make_english_to_german_exercise.hints.3.text": "Empieza creando un diccionario nuevo vacío.",
    S + "make_english_to_german_exercise.hints.4.text": "Devuelve el diccionario al final. Luego completa el código de en medio.",
    S + "make_english_to_german_exercise.hints.5.text": "Necesitas un bucle `for`.",
    S + "make_english_to_german_exercise.hints.6.text": "La línea `totales[item] = cantidades[item] * precios[item]` del paso anterior se parece a lo que necesitas.",
    S + "make_english_to_german_exercise.hints.7.text": "No necesitas multiplicar nada con `*`, los nombres son diferentes, y hay otra diferencia en la lógica.",
    S + "make_english_to_german_exercise.hints.8.text": "Piensa en cuáles deberían ser las claves y los valores del nuevo diccionario.",
    S + "make_english_to_german_exercise.hints.9.text": "Las claves deben ser palabras en español, así que deben venir del primer diccionario.",
    S + "make_english_to_german_exercise.hints.10.text": "Los valores deben ser palabras en alemán, así que deben venir del segundo diccionario.",
    S + "make_english_to_german_exercise.hints.11.text": "Concretamente, las claves de tu diccionario deben ser las claves del primer diccionario.",
    S + "make_english_to_german_exercise.hints.12.text": "Y los valores de tu diccionario deben ser los valores del segundo diccionario.",
    S + "make_english_to_german_exercise.hints.13.text": "¿Y los valores del primer diccionario y las claves del segundo? Son importantes.",
    S + "make_english_to_german_exercise.hints.14.text": "Mira las palabras en francés `'pomme'` y `'boite'` en la prueba de ejemplo.",
    S + "make_english_to_german_exercise.hints.15.text": "Los valores del primer diccionario de entrada son las claves del segundo diccionario de entrada.",

    S + "swap_keys_values_exercise.text": """\
¡Buen trabajo!

Por supuesto, el lenguaje no es tan simple, y hay muchas formas en que usar un diccionario así podría salir mal.
Así que... ¡hagamos algo todavía peor! Usemos un diccionario de español a francés para crear un diccionario de francés a español.
Escribe una función que reciba un diccionario y devuelva un diccionario nuevo donde las claves y los valores estén intercambiados,
de modo que `a: b` se convierta en `b: a`.

    __copyable__
__code0__""",

    S + "swap_keys_values_exercise.hints.0.text": "No modifiques el diccionario de entrada `d`.",
    S + "swap_keys_values_exercise.hints.1.text": "Necesitas crear un diccionario nuevo y llenarlo con pares clave-valor que dependan del diccionario de entrada.",
    S + "swap_keys_values_exercise.hints.2.text": "Ya hiciste esto en el ejercicio anterior. La estructura general que buscas es similar a `crear_espanol_a_aleman`.",
    S + "swap_keys_values_exercise.hints.3.text": "De hecho es todavía más sencillo, aunque quizás se sienta raro.",
    S + "swap_keys_values_exercise.hints.4.text": "Empieza creando un diccionario nuevo vacío. Devuelve el diccionario al final. Pon un bucle `for` en medio.",
    S + "swap_keys_values_exercise.hints.5.text": "Piensa en cuáles deberían ser las claves y los valores del nuevo diccionario.",
    S + "swap_keys_values_exercise.hints.6.text": "Solo hay una cosa posible sobre la que puedes iterar.",
    S + "swap_keys_values_exercise.hints.7.text": "Usa cada clave del diccionario de entrada `d` para obtener el valor correspondiente.",

    S + "avocado_or_lawyer.text": """\
¡Magnífico!

Bromas aparte, es importante recordar exactamente cómo puede salir mal esto. Igual que varios artículos de la tienda
pueden tener el mismo precio, varias palabras en español pueden tener la misma traducción al francés. Si el diccionario original
tiene *valores* duplicados, ¿qué pasa cuando intentas intercambiar claves y valores? Como las claves de un diccionario deben ser únicas,
se perderán algunos datos.

Por ejemplo, 'avocat' en francés puede significar 'aguacate' o 'abogado'. Así que es fácil traducir
'aguacate' del español al francés, pero no está tan claro cómo traducir 'avocat' de vuelta al español.
Intenta adivinar qué imprimirá el siguiente código:

    __copyable__
__code0__""",

    S + "final_text.text": """\
¡El resultado depende del orden de las claves en el diccionario original!
Si no estás seguro de por qué, prueba a ejecutar el código con `snoop` u otro depurador.

Pero hay muchas situaciones en las que puedes estar seguro de que los valores de un diccionario *son* únicos y de que esta
'inversión' tiene sentido. Por ejemplo, vimos este código [antes en este capítulo](#UsingDictionaries):

    __copyable__
    __no_auto_translate__
    def sustituir(cadena, d):
        resultado = ""
        for letra in cadena:
            resultado += d[letra]
        return resultado

    textoplano = 'helloworld'
    encriptado = 'qpeefifmez'
    letras = {'h': 'q', 'e': 'p', 'l': 'e', 'o': 'f', 'w': 'i', 'r': 'm', 'd': 'z'}
    inversa = {'q': 'h', 'p': 'e', 'e': 'l', 'f': 'o', 'i': 'w', 'm': 'r', 'z': 'd'}
    assert_equal(sustituir(textoplano, letras), encriptado)
    assert_equal(sustituir(encriptado, inversa), textoplano)

Ahora podemos construir el diccionario `inversa` automáticamente:

__code0__

Para que esto funcione, solo tenemos que asegurarnos de que todos los valores de `letras` sean únicos.
De lo contrario sería imposible descifrar los mensajes correctamente. Si tanto `'h'` como `'j'` se reemplazaran por `'q'`
al cifrar, ¡no habría forma de saber si `'qpeef'` significa `'hello'` o `'jello'`!

¡Felicidades! Has llegado al final del curso por ahora. ¡Hay más en camino!""",
}

_CHOICES = {
    "list_append_reminder": [None, "['perro']", "['caja']", "['perro', 'caja']", "['caja', 'perro']",
                             "['perro', 'perro']", "['caja', 'caja']"],
    "list_assign_reminder": ["['caja']", "['perro', 'gato']", "['caja', 'perro']", "['caja', 'gato']",
                             "['perro', 'caja']", "['gato', 'caja']", "['caja', 'perro', 'gato']",
                             "['perro', 'caja', 'gato']", "['perro', 'gato', 'caja']"],
    "list_assign_invalid": [None, "['perro']", "['caja']", "['perro', 'caja']", "['caja', 'perro']",
                            "['perro', 'perro']", "['caja', 'caja']"],
    "dict_assignment_valid": ["{'perro': 500, 'caja': 2}", "{'perro': 2, 'caja': 500}",
                              "{2: 'perro', 500: 'caja'}", "{500: 'perro', 2: 'caja'}"],
}

for _step, _choices in _CHOICES.items():
    for _i, _choice in enumerate(_choices):
        if _choice is not None:
            TEXTS[f"{S}{_step}.output_prediction_choices.{_i}"] = _choice

# Correcciones a cadenas ya existentes en la traducción original
FIXES = {
    "pages.UsingDictionaries.steps.final_text.text": [
        ("assert_equal(substitute(textoplano, letras), cifrado)",
         "assert_equal(sustituir(textoplano, letras), encriptado)"),
        ("assert_equal(substitute(cifrado, inversa), textoplano)",
         "assert_equal(sustituir(encriptado, inversa), textoplano)"),
        ("inversa = swap_keys_values(letras)", "inversa = intercambiar_claves_valores(letras)"),
    ],
}


def all_entries():
    for k, v in CODE_BITS.items():
        yield "code_bits." + k, v
    yield from TEXTS.items()
