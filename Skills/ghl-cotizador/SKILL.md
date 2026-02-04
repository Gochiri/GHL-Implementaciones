---
name: GHL Cotizador
description: Herramienta para calcular el presupuesto de implementaciones en GoHighLevel (GHL) basándose en módulos y paquetes predefinidos.
---

# GHL Cotizador Skill

Este skill proporciona la lógica y los datos necesarios para generar cotizaciones precisas de implementaciones en GoHighLevel. Incluye factores de escala para CRM, automatizaciones, chatbots, landing pages, y más.

## Scripts Disponibles
- `ghl_cotizador.py`: Script central que implementa la lógica de cálculo, comparación de paquetes y recomendación basado en el scope del cliente.

## Tabla de Precios de Referencia

### MÓDULO 0: SETUP DE SUBCUENTA
*(Siempre independiente de los paquetes)*

| Escenario | Precio |
|-----------|--------|
| Setup completo (DNS + dominio + WhatsApp + correos) | $250 |
| Solo validación (cliente ya tiene todo) | $100 |

---

## MÓDULOS CON FACTORES DE ESCALA

### Fórmula general
**Precio del módulo = Base + (unidades que supera el límite × precio por unidad extra)**

### Detalle de Módulos (Base y Extras)

| Módulo | Base | Límite Incluido | Precio Unidad Extra |
|--------|------|-----------------|----------------------|
| **1. CRM** | $250 | 2 Pipelines, 5 Etapas/p, 2 Vistas | $60 (Pip), $15 (Etapa), $25 (Vista) |
| **2. Workflows** | $350 | 3 Workflows, 8 Nodos/w | $70 (WF), $12 (Nodo) |
| **3. Chatbot (AI)**| $400 | 1 Chatbot, 10 Nodos | $200 (CB), $15 (Nodo), $150 (IA Avanzada) |
| **4. Integraciones**| $300 | 1 Integración | $300 (Extra) |
| **5. Documentos** | $200 | 2 Plantillas | $50 (Extra) |
| **6. Calendarios** | $180 | Fijo | - |
| **7. Landing Pages**| $450 | 1 Page, 5 Secciones | $300 (Page), $40 (Sección) |
| **8. Reportes** | $250 | Fijo (+$60/mes) | - |

> *Nota: El Módulo 3 (Chatbot) tiene un costo mensual de $80 por unidad activa. El Módulo 4 (Integraciones) tiene un costo mensual de $50 por unidad activa.*

---

## PAQUETES PREDEFINIDOS

| Paquete | Setup | Mensual | Incluye |
|---------|-------|---------|---------|
| **Starter** | $900 | $150 | CRM (2p/5e), Workflows (3w/8n), 1 Cap., Soporte |
| **Pro** | $1,800| $280 | CRM (2p/7e), Workflows (6w/10n), 1 Chatbot(10n), Documentos (3), Cal., 2 Cap., Soporte |
| **Enterprise**| $3,200| $400 | Todo Pro + 2 Integraciones, Reportes, Landing (1p/6s), 3 Cap., Soporte Prioritario |

---

## REGLAS DE CÁLCULO ESTRATÉGICO

1. **Setup de Subcuenta:** Se suma SIEMPRE al total.
2. **Excedentes:** Si se elige un paquete pero el scope supera sus límites, se cobran los extras según los factores de escala del módulo correspondiente.
3. **À la carte:** Si no hay ahorro con paquetes, se suma cada base + extras individualmente.
4. **Descuento Anual:** 15% de descuento solo en la cuota de **Soporte** ($127.50 vs $150) si se paga el año por adelantado.
5. **Recomendación:** El cotizador siempre prioriza el paquete con mayor ahorro en el primer año (Setup + 12 meses).
