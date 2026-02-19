# Tabla de Precios — Referencia para el Cotizador
## Todos los precios en USD

---

## MÓDULO 0: SETUP DE SUBCUENTA (siempre separado, nunca dentro de paquetes)

| Escenario | Precio |
|-----------|--------|
| Setup completo (DNS + dominio + WhatsApp + correos) | $250 |
| Solo validación (cliente ya tiene todo) | $100 |

---

## MÓDULOS CON FACTORES DE ESCALA

### Fórmula general
**Precio del módulo = Base + (unidades que supera el límite × precio por unidad extra)**

### Módulo 1 — CRM & Pipelines | Base: $250

| Elemento | Límite incluido en base | Precio por unidad extra |
|----------|:-----------------------:|:----------------------:|
| Pipelines | 2 | +$60 |
| Etapas por pipeline | 5 | +$15 |
| Vistas y filtros | 2 | +$25 |

> Las etapas extra se calculan por pipeline individualmente. Ej: si un pipeline tiene 7 etapas = 2 etapas extra = +$30.

---

### Módulo 2 — Automatizaciones & Workflows | Base: $350

| Elemento | Límite incluido en base | Precio por unidad extra |
|----------|:-----------------------:|:----------------------:|
| Workflows | 3 | +$70 |
| Nodos por workflow | 8 | +$12 |

> Los nodos extra se calculan por workflow individualmente. Ej: WF con 25 nodos = 17 nodos extra = +$204.
> Este es el módulo que más impacta el precio final por su capacidad de escalar.

---

### Módulo 3 — Chatbot / AI Chat | Base: $400 | Mensual: $80 por chatbot activo

| Elemento | Límite incluido en base | Precio por unidad extra |
|----------|:-----------------------:|:----------------------:|
| Chatbots | 1 | +$200 |
| Nodos por chatbot | 10 | +$15 |
| IA generativa avanzada | No incluido | +$150 por chatbot que la use |

---

### Módulo 4 — Integraciones Externas | Base: $300 | Mensual: $50 por integración activa

| Elemento | Límite incluido en base | Precio por unidad extra |
|----------|:-----------------------:|:----------------------:|
| Integraciones | 1 | +$300 |

---

### Módulo 5 — Documentos & Templates | Base: $200

| Elemento | Límite incluido en base | Precio por unidad extra |
|----------|:-----------------------:|:----------------------:|
| Plantillas | 2 | +$50 |

---

### Módulo 6 — Calendarios & Citas | Precio fijo: $180
Sin factores de escala.

---

### Módulo 7 — Landing Pages / Sitio Web | Base: $450

| Elemento | Límite incluido en base | Precio por unidad extra |
|----------|:-----------------------:|:----------------------:|
| Landing pages | 1 | +$300 |
| Secciones por page | 5 | +$40 |

---

### Módulo 8 — Reportes & Dashboards | Precio fijo: $250 | Mensual: $60
Sin factores de escala.

---

### Módulo 9 — Capacitación & Onboarding | $200 por sesión (2h)
Sin precio base. Se cobra por cantidad de sesiones.

---

### Módulo 10 — Soporte Post-Implementación | Mensual: $150
Sin setup. Descuento pago anual: 15% → $127.50/mes.

---

## PAQUETES

Los paquetes tienen precio fijo. Si el scope del cliente supera los límites del paquete, los extras se cobran según los factores de escala correspondientes.

### Starter — $900 setup | $150/mes

| Módulo | Límite incluido |
|--------|----------------|
| CRM & Pipelines | 2 pipelines, 5 etapas c/u, 2 vistas |
| Workflows | 3 workflows, 8 nodos c/u |
| Capacitación | 1 sesión |
| Soporte | Mensual |

---

### Pro — $1,800 setup | $280/mes

| Módulo | Límite incluido |
|--------|----------------|
| CRM & Pipelines | 2 pipelines, 7 etapas c/u, 2 vistas |
| Workflows | 6 workflows, 10 nodos c/u |
| Chatbot | 1 chatbot, 10 nodos |
| Documentos | 3 plantillas |
| Calendarios | Incluido |
| Capacitación | 2 sesiones |
| Soporte | Mensual |

---

### Enterprise — $3,200 setup | $400/mes

| Módulo | Límite incluido |
|--------|----------------|
| Todo lo de Pro | Con sus límites |
| Integraciones | 2 integraciones |
| Reportes & Dashboards | Incluido |
| Landing Page | 1 page, 6 secciones |
| Capacitación | 3 sesiones |
| Soporte | Mensual, prioridad alta |

---

## REGLAS DE CÁLCULO

1. Setup de Subcuenta siempre se suma al total. Nunca está dentro de un paquete.
2. Si el cliente toma un paquete: calcular si su scope cabe dentro de los límites. Si no, sumar solo los extras según factores de escala.
3. Si el cliente compra à la carte: sumar base de cada módulo + extras según cantidad.
4. Cuota mensual = suma de las cuotas de cada módulo activo que tenga cuota.
5. Descuento pago anual (15%) aplica solo a la cuota mensual, no al setup.
6. Capacitación nunca tiene precio base, siempre se cobra por sesión.
7. El cotizador siempre debe sugerir el paquete que mejor se ajuste al scope del cliente y mostrar el ahorro vs. à la carte.
