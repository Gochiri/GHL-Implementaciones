---
name: ghl-cotizador
description: Genera cotizaciones profesionales para implementaciones GHL a partir del desglose de la skill de mapeo (ghl-onboarding-mapper). Usar cuando el usuario pida precio, cotización, propuesta económica, o cuando ya tenga un desglose de implementación listo y necesite convertirlo en números. Produce cotización con desglose por módulo, comparación de paquetes, recomendación automática y resumen ejecutivo listo para enviar al cliente.
---

# GHL Cotizador

Convierte un desglose de implementación GHL en una cotización profesional completa.

## Flujo de trabajo

1. **Recibir el desglose** — del usuario directamente o del output de la skill ghl-onboarding-mapper
2. **Leer la tabla de precios** — ver `references/tabla_precios.md`
3. **Ejecutar el cálculo** — usar `scripts/ghl_cotizador.py` con el scope del cliente
4. **Generar el output** — cotización desglosada + recomendación de paquete + resumen ejecutivo

---

## Paso 1: Parsear el desglose en un scope

El desglose puede llegar de dos formas:

**A) Output de la skill de mapeo** — ya tiene los workflows con sus códigos (LS01, SP02...) y cantidad de nodos. Extraer directamente.

**B) Descripción libre del usuario** — el usuario describe lo que necesita el cliente. Extraer los datos y armar el scope.

El scope que necesita el script tiene esta estructura:

```python
scope = {
    "cliente": "Nombre del cliente",
    "setup_subcuenta": "completo",        # "completo" o "validacion"
    "pipelines": [                         # lista de pipelines con sus etapas
        {"nombre": "Sales", "etapas": 7},
    ],
    "vistas_filtros": 3,                   # cantidad total
    "workflows": [                         # lista de workflows con sus nodos
        {"nombre": "SP01", "nodos": 12},
    ],
    "chatbots": [                          # lista de chatbots
        {"nombre": "WhatsApp Bot", "nodos": 14, "ia_avanzada": True},
    ],
    "integraciones": 2,                    # cantidad total
    "plantillas": 3,                       # cantidad total
    "calendarios": True,                   # bool
    "landing_pages": [                     # lista de pages con secciones
        {"nombre": "Principal", "secciones": 6},
    ],
    "reportes": True,                      # bool
    "sesiones_capacitacion": 2,            # cantidad
    "soporte": True,                       # bool
    "pago_anual_soporte": False,           # bool, aplica 15% descuento en soporte mensual
}
```

Si algo no aplica, no lo incluyas en el scope.

---

## Paso 2: Ejecutar el cálculo

Crear un script temporal que importa el cotizador y ejecuta el cálculo con el scope del cliente:

```python
import sys
sys.path.insert(0, 'scripts')
from ghl_cotizador import calcular_cotizacion
import json

scope = { ... }  # el scope parseado

resultado = calcular_cotizacion(scope)
print(json.dumps(resultado, indent=2, ensure_ascii=False))
```

---

## Paso 3: Generar el output

Con los números del resultado, generar tres cosas en orden:

### 3a. Cotización desglosada (para uso interno)

Tabla clara con cada módulo, su precio base, extras y total. Formato PDF-ready.

### 3b. Recomendación de paquete

El script ya calcula esto automáticamente. Si ningún paquete genera ahorro, recomienda à la carte y explica por qué (scope pesado que supera los límites de todos los paquetes).

### 3c. Resumen ejecutivo (para enviar al cliente)

Formato profesional, en español. Incluye:
- Nombre del cliente
- Descripción breve de lo que se implementa (sin detalle técnico interno)
- Precio setup (one-time)
- Precio mensual
- Qué incluye el precio
- Nota sobre el setup de subcuenta si aplica
- Validez de la cotización (usar 30 días por defecto)

**Tono del resumen ejecutivo:** profesional pero cercano. No usar jerga técnica. El cliente no necesita saber de nodos ni triggers.

---

## Ejemplo de output completo

Cuando el usuario pida la cotización, el output debe tener estas tres secciones visibles:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  COTIZACIÓN INTERNA — [Nombre cliente]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[Tabla desglosada por módulo con base + extras + totales]
[Comparación: à la carte vs paquetes]
[Recomendación marcada]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  RESUMEN EJECUTIVO — Listo para enviar
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[Texto profesional para el cliente]
```

---

## Reglas importantes

- Setup de Subcuenta siempre va separado, nunca dentro de paquetes.
- Si el usuario no menciona setup de subcuenta, preguntar si el cliente ya tiene la cuenta configurada.
- Los precios son en USD siempre.
- El resumen ejecutivo nunca muestra los precios internos de los extras por unidad. Solo muestra el precio total por módulo o el precio del paquete recomendado.
- Si el scope es muy pesado (workflows con 20+ nodos, 6+ workflows), mencionar al usuario que la cotización refleja un proyecto de alta complejidad y que tiene sentido comunicarlo al cliente como un valor diferencial.
