"""
ghl_cotizador.py
Calcula el precio de una implementación GHL basándose en el desglose
de la skill de mapeo. Entrada: diccionario con los datos del scope.
Salida: diccionario con precios desglosados, paquete recomendado y ahorro.

Uso:
    from ghl_cotizador import calcular_cotizacion
    resultado = calcular_cotizacion(scope)
    print(resultado)

    O ejecutar directamente con un scope de ejemplo:
    python3 ghl_cotizador.py
"""

# ─── TABLA DE PRECIOS ────────────────────────────────────────────────────────

MODULOS = {
    "crm": {
        "nombre": "CRM & Pipelines",
        "base": 250,
        "mensual": 0,
        "factores": {
            "pipelines":     {"limite": 2, "precio_extra": 60},
            "etapas":        {"limite": 5, "precio_extra": 15},   # por pipeline
            "vistas_filtros":{"limite": 2, "precio_extra": 25},
        }
    },
    "workflows": {
        "nombre": "Automatizaciones & Workflows",
        "base": 350,
        "mensual": 0,
        "factores": {
            "workflows": {"limite": 3, "precio_extra": 70},
            "nodos":     {"limite": 8, "precio_extra": 12},   # por workflow
        }
    },
    "chatbot": {
        "nombre": "Chatbot / AI Chat",
        "base": 400,
        "mensual_por_unidad": 80,   # por chatbot activo
        "factores": {
            "chatbots": {"limite": 1, "precio_extra": 200},
            "nodos":    {"limite": 10, "precio_extra": 15},   # por chatbot
            "ia_avanzada": {"precio": 150},                   # por chatbot que la use
        }
    },
    "integraciones": {
        "nombre": "Integraciones Externas",
        "base": 300,
        "mensual_por_unidad": 50,   # por integración activa
        "factores": {
            "integraciones": {"limite": 1, "precio_extra": 300},
        }
    },
    "documentos": {
        "nombre": "Documentos & Templates",
        "base": 200,
        "mensual": 0,
        "factores": {
            "plantillas": {"limite": 2, "precio_extra": 50},
        }
    },
    "calendarios": {
        "nombre": "Calendarios & Citas",
        "base": 180,
        "mensual": 0,
        "factores": {}
    },
    "landing": {
        "nombre": "Landing Pages / Sitio Web",
        "base": 450,
        "mensual": 0,
        "factores": {
            "pages":     {"limite": 1, "precio_extra": 300},
            "secciones": {"limite": 5, "precio_extra": 40},   # por page
        }
    },
    "reportes": {
        "nombre": "Reportes & Dashboards",
        "base": 250,
        "mensual": 60,
        "factores": {}
    },
    "capacitacion": {
        "nombre": "Capacitación & Onboarding",
        "precio_por_sesion": 200,
    },
    "soporte": {
        "nombre": "Soporte Post-Implementación",
        "mensual": 150,
        "mensual_anual": 127.50,
    }
}

SETUP_SUBCUENTA = {
    "completo": 250,
    "validacion": 100,
}

PAQUETES = {
    "Starter": {
        "setup": 900,
        "mensual": 150,
        "limites": {
            "crm":          {"pipelines": 2, "etapas": 5, "vistas_filtros": 2},
            "workflows":    {"workflows": 3, "nodos": 8},
            "capacitacion": {"sesiones": 1},
            "soporte":      True,
        }
    },
    "Pro": {
        "setup": 1800,
        "mensual": 280,
        "limites": {
            "crm":          {"pipelines": 2, "etapas": 7, "vistas_filtros": 2},
            "workflows":    {"workflows": 6, "nodos": 10},
            "chatbot":      {"chatbots": 1, "nodos": 10},
            "documentos":   {"plantillas": 3},
            "calendarios":  True,
            "capacitacion": {"sesiones": 2},
            "soporte":      True,
        }
    },
    "Enterprise": {
        "setup": 3200,
        "mensual": 400,
        "limites": {
            "crm":          {"pipelines": 2, "etapas": 7, "vistas_filtros": 2},
            "workflows":    {"workflows": 6, "nodos": 10},
            "chatbot":      {"chatbots": 1, "nodos": 10},
            "documentos":   {"plantillas": 3},
            "calendarios":  True,
            "integraciones":{"integraciones": 2},
            "reportes":     True,
            "landing":      {"pages": 1, "secciones": 6},
            "capacitacion": {"sesiones": 3},
            "soporte":      True,
        }
    }
}

# ─── FUNCIONES DE CÁLCULO ────────────────────────────────────────────────────

def calcular_extras_crm(scope):
    """Calcula extras del módulo CRM basándose en pipelines y sus etapas."""
    extras = 0
    detalle = []
    pipelines = scope.get("pipelines", [])   # lista de dicts: [{"nombre":"X", "etapas": N}, ...]
    cantidad_pipelines = len(pipelines)

    # Extras por cantidad de pipelines
    limite_pip = MODULOS["crm"]["factores"]["pipelines"]["limite"]
    if cantidad_pipelines > limite_pip:
        extra_pip = (cantidad_pipelines - limite_pip) * MODULOS["crm"]["factores"]["pipelines"]["precio_extra"]
        extras += extra_pip
        detalle.append(f"{cantidad_pipelines - limite_pip} pipeline(s) extra → +${extra_pip}")

    # Extras por etapas (se calcula por pipeline individualmente)
    limite_etapas = MODULOS["crm"]["factores"]["etapas"]["limite"]
    for p in pipelines:
        etapas = p.get("etapas", 0)
        if etapas > limite_etapas:
            extra_et = (etapas - limite_etapas) * MODULOS["crm"]["factores"]["etapas"]["precio_extra"]
            extras += extra_et
            detalle.append(f"Pipeline '{p.get('nombre','?')}': {etapas - limite_etapas} etapa(s) extra → +${extra_et}")

    # Extras por vistas y filtros
    vistas = scope.get("vistas_filtros", 0)
    limite_vistas = MODULOS["crm"]["factores"]["vistas_filtros"]["limite"]
    if vistas > limite_vistas:
        extra_v = (vistas - limite_vistas) * MODULOS["crm"]["factores"]["vistas_filtros"]["precio_extra"]
        extras += extra_v
        detalle.append(f"{vistas - limite_vistas} vista(s)/filtro(s) extra → +${extra_v}")

    return extras, detalle


def calcular_extras_workflows(scope):
    """Calcula extras del módulo Workflows basándose en cantidad y nodos por workflow."""
    extras = 0
    detalle = []
    workflows = scope.get("workflows", [])   # lista de dicts: [{"nombre":"SP01", "nodos": N}, ...]
    cantidad_wf = len(workflows)

    # Extras por cantidad de workflows
    limite_wf = MODULOS["workflows"]["factores"]["workflows"]["limite"]
    if cantidad_wf > limite_wf:
        extra_wf = (cantidad_wf - limite_wf) * MODULOS["workflows"]["factores"]["workflows"]["precio_extra"]
        extras += extra_wf
        detalle.append(f"{cantidad_wf - limite_wf} workflow(s) extra → +${extra_wf}")

    # Extras por nodos (por workflow individualmente)
    limite_nodos = MODULOS["workflows"]["factores"]["nodos"]["limite"]
    for wf in workflows:
        nodos = wf.get("nodos", 0)
        if nodos > limite_nodos:
            extra_n = (nodos - limite_nodos) * MODULOS["workflows"]["factores"]["nodos"]["precio_extra"]
            extras += extra_n
            detalle.append(f"Workflow '{wf.get('nombre','?')}': {nodos - limite_nodos} nodo(s) extra → +${extra_n}")

    return extras, detalle


def calcular_extras_chatbot(scope):
    """Calcula extras del módulo Chatbot."""
    extras = 0
    detalle = []
    chatbots = scope.get("chatbots", [])   # lista de dicts: [{"nombre":"X", "nodos": N, "ia_avanzada": bool}, ...]
    cantidad_cb = len(chatbots)

    # Extras por cantidad de chatbots
    limite_cb = MODULOS["chatbot"]["factores"]["chatbots"]["limite"]
    if cantidad_cb > limite_cb:
        extra_cb = (cantidad_cb - limite_cb) * MODULOS["chatbot"]["factores"]["chatbots"]["precio_extra"]
        extras += extra_cb
        detalle.append(f"{cantidad_cb - limite_cb} chatbot(s) extra → +${extra_cb}")

    # Extras por nodos (por chatbot individualmente)
    limite_nodos = MODULOS["chatbot"]["factores"]["nodos"]["limite"]
    for cb in chatbots:
        nodos = cb.get("nodos", 0)
        if nodos > limite_nodos:
            extra_n = (nodos - limite_nodos) * MODULOS["chatbot"]["factores"]["nodos"]["precio_extra"]
            extras += extra_n
            detalle.append(f"Chatbot '{cb.get('nombre','?')}': {nodos - limite_nodos} nodo(s) extra → +${extra_n}")
        if cb.get("ia_avanzada", False):
            extras += 150
            detalle.append(f"Chatbot '{cb.get('nombre','?')}': IA generativa avanzada → +$150")

    # Mensual: $80 por chatbot activo
    mensual = cantidad_cb * MODULOS["chatbot"]["mensual_por_unidad"]

    return extras, detalle, mensual


def calcular_extras_integraciones(scope):
    """Calcula extras del módulo Integraciones."""
    extras = 0
    detalle = []
    cantidad = scope.get("integraciones", 0)

    limite = MODULOS["integraciones"]["factores"]["integraciones"]["limite"]
    if cantidad > limite:
        extra = (cantidad - limite) * MODULOS["integraciones"]["factores"]["integraciones"]["precio_extra"]
        extras += extra
        detalle.append(f"{cantidad - limite} integración(es) extra → +${extra}")

    mensual = cantidad * MODULOS["integraciones"]["mensual_por_unidad"]

    return extras, detalle, mensual


def calcular_extras_documentos(scope):
    """Calcula extras del módulo Documentos."""
    extras = 0
    detalle = []
    plantillas = scope.get("plantillas", 0)

    limite = MODULOS["documentos"]["factores"]["plantillas"]["limite"]
    if plantillas > limite:
        extra = (plantillas - limite) * MODULOS["documentos"]["factores"]["plantillas"]["precio_extra"]
        extras += extra
        detalle.append(f"{plantillas - limite} plantilla(s) extra → +${extra}")

    return extras, detalle


def calcular_extras_landing(scope):
    """Calcula extras del módulo Landing Pages."""
    extras = 0
    detalle = []
    pages = scope.get("landing_pages", [])   # lista de dicts: [{"nombre":"X", "secciones": N}, ...]
    cantidad_pages = len(pages)

    limite_pages = MODULOS["landing"]["factores"]["pages"]["limite"]
    if cantidad_pages > limite_pages:
        extra_p = (cantidad_pages - limite_pages) * MODULOS["landing"]["factores"]["pages"]["precio_extra"]
        extras += extra_p
        detalle.append(f"{cantidad_pages - limite_pages} page(s) extra → +${extra_p}")

    limite_sec = MODULOS["landing"]["factores"]["secciones"]["limite"]
    for page in pages:
        secciones = page.get("secciones", 0)
        if secciones > limite_sec:
            extra_s = (secciones - limite_sec) * MODULOS["landing"]["factores"]["secciones"]["precio_extra"]
            extras += extra_s
            detalle.append(f"Page '{page.get('nombre','?')}': {secciones - limite_sec} sección(es) extra → +${extra_s}")

    return extras, detalle


# ─── COTIZACIÓN À LA CARTE ───────────────────────────────────────────────────

def cotizar_a_la_carte(scope):
    """Calcula el precio total comprando módulos individualmente."""
    setup_total = 0
    mensual_total = 0
    desglose = []

    # Setup de subcuenta (siempre)
    tipo_setup = scope.get("setup_subcuenta", "completo")   # "completo" o "validacion"
    precio_setup = SETUP_SUBCUENTA[tipo_setup]
    setup_total += precio_setup
    desglose.append({"modulo": "Setup de Subcuenta", "setup": precio_setup, "mensual": 0, "detalle": [f"Tipo: {tipo_setup}"]})

    # CRM & Pipelines
    if scope.get("pipelines"):
        base = MODULOS["crm"]["base"]
        extras, detalle = calcular_extras_crm(scope)
        setup_total += base + extras
        desglose.append({"modulo": "CRM & Pipelines", "setup": base + extras, "mensual": 0, "detalle": detalle})

    # Workflows
    if scope.get("workflows"):
        base = MODULOS["workflows"]["base"]
        extras, detalle = calcular_extras_workflows(scope)
        setup_total += base + extras
        desglose.append({"modulo": "Automatizaciones & Workflows", "setup": base + extras, "mensual": 0, "detalle": detalle})

    # Chatbot
    if scope.get("chatbots"):
        base = MODULOS["chatbot"]["base"]
        extras, detalle, mensual = calcular_extras_chatbot(scope)
        setup_total += base + extras
        mensual_total += mensual
        desglose.append({"modulo": "Chatbot / AI Chat", "setup": base + extras, "mensual": mensual, "detalle": detalle})

    # Integraciones
    if scope.get("integraciones", 0) > 0:
        base = MODULOS["integraciones"]["base"]
        extras, detalle, mensual = calcular_extras_integraciones(scope)
        setup_total += base + extras
        mensual_total += mensual
        desglose.append({"modulo": "Integraciones Externas", "setup": base + extras, "mensual": mensual, "detalle": detalle})

    # Documentos
    if scope.get("plantillas", 0) > 0:
        base = MODULOS["documentos"]["base"]
        extras, detalle = calcular_extras_documentos(scope)
        setup_total += base + extras
        desglose.append({"modulo": "Documentos & Templates", "setup": base + extras, "mensual": 0, "detalle": detalle})

    # Calendarios
    if scope.get("calendarios", False):
        setup_total += MODULOS["calendarios"]["base"]
        desglose.append({"modulo": "Calendarios & Citas", "setup": 180, "mensual": 0, "detalle": []})

    # Landing Pages
    if scope.get("landing_pages"):
        base = MODULOS["landing"]["base"]
        extras, detalle = calcular_extras_landing(scope)
        setup_total += base + extras
        desglose.append({"modulo": "Landing Pages", "setup": base + extras, "mensual": 0, "detalle": detalle})

    # Reportes
    if scope.get("reportes", False):
        setup_total += MODULOS["reportes"]["base"]
        mensual_total += MODULOS["reportes"]["mensual"]
        desglose.append({"modulo": "Reportes & Dashboards", "setup": 250, "mensual": 60, "detalle": []})

    # Capacitación
    sesiones = scope.get("sesiones_capacitacion", 0)
    if sesiones > 0:
        precio = sesiones * MODULOS["capacitacion"]["precio_por_sesion"]
        setup_total += precio
        desglose.append({"modulo": "Capacitación & Onboarding", "setup": precio, "mensual": 0, "detalle": [f"{sesiones} sesión(es) × $200"]})

    # Soporte
    if scope.get("soporte", False):
        mensual_total += MODULOS["soporte"]["mensual"]
        desglose.append({"modulo": "Soporte Post-Implementación", "setup": 0, "mensual": 150, "detalle": []})

    return {"setup": setup_total, "mensual": mensual_total, "desglose": desglose}


# ─── COTIZACIÓN CON PAQUETE ──────────────────────────────────────────────────

def calcular_extras_sobre_paquete(scope, nombre_paquete):
    """Calcula solo los extras que supera el scope respecto a un paquete."""
    paquete = PAQUETES[nombre_paquete]
    limites = paquete["limites"]
    extras_setup = 0
    extras_mensual = 0
    detalle_extras = []

    # CRM: extras de pipelines y etapas sobre los límites del paquete
    if "crm" in limites and scope.get("pipelines"):
        lim = limites["crm"]
        pipelines = scope["pipelines"]
        cantidad_pip = len(pipelines)
        if cantidad_pip > lim["pipelines"]:
            extra = (cantidad_pip - lim["pipelines"]) * 60
            extras_setup += extra
            detalle_extras.append(f"CRM: {cantidad_pip - lim['pipelines']} pipeline(s) extra → +${extra}")
        for p in pipelines:
            if p.get("etapas", 0) > lim["etapas"]:
                extra = (p["etapas"] - lim["etapas"]) * 15
                extras_setup += extra
                detalle_extras.append(f"CRM: Pipeline '{p.get('nombre','?')}' — {p['etapas'] - lim['etapas']} etapa(s) extra → +${extra}")

    # Workflows: extras de cantidad y nodos
    if "workflows" in limites and scope.get("workflows"):
        lim = limites["workflows"]
        workflows = scope["workflows"]
        cantidad_wf = len(workflows)
        if cantidad_wf > lim["workflows"]:
            extra = (cantidad_wf - lim["workflows"]) * 70
            extras_setup += extra
            detalle_extras.append(f"Workflows: {cantidad_wf - lim['workflows']} workflow(s) extra → +${extra}")
        for wf in workflows:
            if wf.get("nodos", 0) > lim["nodos"]:
                extra = (wf["nodos"] - lim["nodos"]) * 12
                extras_setup += extra
                detalle_extras.append(f"Workflows: '{wf.get('nombre','?')}' — {wf['nodos'] - lim['nodos']} nodo(s) extra → +${extra}")

    # Chatbot: extras si el scope supera los límites del paquete
    if "chatbot" in limites and scope.get("chatbots"):
        lim = limites["chatbot"]
        chatbots = scope["chatbots"]
        cantidad_cb = len(chatbots)
        if cantidad_cb > lim["chatbots"]:
            extra = (cantidad_cb - lim["chatbots"]) * 200
            extras_setup += extra
            detalle_extras.append(f"Chatbot: {cantidad_cb - lim['chatbots']} chatbot(s) extra → +${extra}")
        for cb in chatbots:
            if cb.get("nodos", 0) > lim["nodos"]:
                extra = (cb["nodos"] - lim["nodos"]) * 15
                extras_setup += extra
                detalle_extras.append(f"Chatbot: '{cb.get('nombre','?')}' — {cb['nodos'] - lim['nodos']} nodo(s) extra → +${extra}")
            if cb.get("ia_avanzada", False):
                extras_setup += 150
                detalle_extras.append(f"Chatbot: '{cb.get('nombre','?')}' — IA avanzada → +$150")
        # Mensual: chatbots extra sobre el límite
        extras_mensual += cantidad_cb * 80  # siempre $80/chatbot activo (el paquete ya lo incluye para el primero)
    elif scope.get("chatbots") and "chatbot" not in limites:
        # El paquete no incluye chatbot, se cobra el módulo completo como extra
        base = MODULOS["chatbot"]["base"]
        extras_cb, detalle_cb, mensual_cb = calcular_extras_chatbot(scope)
        extras_setup += base + extras_cb
        extras_mensual += mensual_cb
        detalle_extras.append(f"Chatbot: módulo completo (no incluido en {nombre_paquete}) → +${base + extras_cb} setup, +${mensual_cb}/mes")

    # Integraciones: si el paquete no las incluye o el scope supera
    if "integraciones" in limites and scope.get("integraciones", 0) > 0:
        lim = limites["integraciones"]["integraciones"]
        cantidad = scope["integraciones"]
        if cantidad > lim:
            extra = (cantidad - lim) * 300
            extras_setup += extra
            detalle_extras.append(f"Integraciones: {cantidad - lim} integración(es) extra → +${extra}")
        extras_mensual += cantidad * 50
    elif scope.get("integraciones", 0) > 0 and "integraciones" not in limites:
        base = MODULOS["integraciones"]["base"]
        extras_int, detalle_int, mensual_int = calcular_extras_integraciones(scope)
        extras_setup += base + extras_int
        extras_mensual += mensual_int
        detalle_extras.append(f"Integraciones: módulo completo (no incluido en {nombre_paquete}) → +${base + extras_int}")

    # Documentos: extras de plantillas
    if "documentos" in limites and scope.get("plantillas", 0) > 0:
        lim = limites["documentos"]["plantillas"]
        if scope["plantillas"] > lim:
            extra = (scope["plantillas"] - lim) * 50
            extras_setup += extra
            detalle_extras.append(f"Documentos: {scope['plantillas'] - lim} plantilla(s) extra → +${extra}")
    elif scope.get("plantillas", 0) > 0 and "documentos" not in limites:
        base = MODULOS["documentos"]["base"]
        extras_doc, detalle_doc = calcular_extras_documentos(scope)
        extras_setup += base + extras_doc
        detalle_extras.append(f"Documentos: módulo completo (no incluido en {nombre_paquete}) → +${base + extras_doc}")

    # Landing: extras si el scope supera
    if "landing" in limites and scope.get("landing_pages"):
        lim = limites["landing"]
        pages = scope["landing_pages"]
        if len(pages) > lim["pages"]:
            extra = (len(pages) - lim["pages"]) * 300
            extras_setup += extra
            detalle_extras.append(f"Landing: {len(pages) - lim['pages']} page(s) extra → +${extra}")
        for page in pages:
            if page.get("secciones", 0) > lim["secciones"]:
                extra = (page["secciones"] - lim["secciones"]) * 40
                extras_setup += extra
                detalle_extras.append(f"Landing: '{page.get('nombre','?')}' — {page['secciones'] - lim['secciones']} sección(es) extra → +${extra}")
    elif scope.get("landing_pages") and "landing" not in limites:
        base = MODULOS["landing"]["base"]
        extras_lp, detalle_lp = calcular_extras_landing(scope)
        extras_setup += base + extras_lp
        detalle_extras.append(f"Landing: módulo completo (no incluido en {nombre_paquete}) → +${base + extras_lp}")

    # Reportes: si no está incluido en el paquete pero el cliente lo necesita
    if scope.get("reportes", False) and "reportes" not in limites:
        extras_setup += 250
        extras_mensual += 60
        detalle_extras.append(f"Reportes: módulo completo (no incluido en {nombre_paquete}) → +$250 setup, +$60/mes")

    # Calendarios: si no está incluido en el paquete pero el cliente lo necesita
    if scope.get("calendarios", False) and "calendarios" not in limites:
        extras_setup += 180
        detalle_extras.append(f"Calendarios: módulo completo (no incluido en {nombre_paquete}) → +$180")

    # Capacitación: sesiones extras sobre el límite del paquete
    if "capacitacion" in limites:
        lim_sesiones = limites["capacitacion"]["sesiones"]
        sesiones = scope.get("sesiones_capacitacion", 0)
        if sesiones > lim_sesiones:
            extra = (sesiones - lim_sesiones) * 200
            extras_setup += extra
            detalle_extras.append(f"Capacitación: {sesiones - lim_sesiones} sesión(es) extra → +${extra}")

    return extras_setup, extras_mensual, detalle_extras


def cotizar_con_paquete(scope, nombre_paquete):
    """Calcula el precio total usando un paquete + extras."""
    paquete = PAQUETES[nombre_paquete]

    # Setup de subcuenta siempre separado
    tipo_setup = scope.get("setup_subcuenta", "completo")
    precio_setup_sub = SETUP_SUBCUENTA[tipo_setup]

    # Extras sobre el paquete
    extras_setup, extras_mensual, detalle_extras = calcular_extras_sobre_paquete(scope, nombre_paquete)

    setup_total = precio_setup_sub + paquete["setup"] + extras_setup
    mensual_total = paquete["mensual"] + extras_mensual

    return {
        "paquete": nombre_paquete,
        "setup_subcuenta": precio_setup_sub,
        "setup_paquete": paquete["setup"],
        "extras_setup": extras_setup,
        "setup_total": setup_total,
        "mensual_paquete": paquete["mensual"],
        "extras_mensual": extras_mensual,
        "mensual_total": mensual_total,
        "detalle_extras": detalle_extras,
    }


# ─── RECOMENDACIÓN DE PAQUETE ────────────────────────────────────────────────

def recomendar_paquete(scope, cotizacion_carte):
    """Compara los tres paquetes y recomienda el que da mejor ahorro."""
    resultados = []
    for nombre in ["Starter", "Pro", "Enterprise"]:
        cot = cotizar_con_paquete(scope, nombre)
        ahorro_setup = cotizacion_carte["setup"] - cot["setup_total"]
        ahorro_mensual = cotizacion_carte["mensual"] - cot["mensual_total"]
        cot["ahorro_setup"] = ahorro_setup
        cot["ahorro_mensual"] = ahorro_mensual
        cot["ahorro_total_primer_año"] = ahorro_setup + (ahorro_mensual * 12)
        resultados.append(cot)

    # Recomienda el paquete con mayor ahorro total en el primer año, siempre que el ahorro sea positivo
    positivos = [r for r in resultados if r["ahorro_total_primer_año"] > 0]
    if positivos:
        mejor = max(positivos, key=lambda x: x["ahorro_total_primer_año"])
    else:
        mejor = None   # ningún paquete ahorra, mejor à la carte

    return mejor, resultados


# ─── FUNCIÓN PRINCIPAL ───────────────────────────────────────────────────────

def calcular_cotizacion(scope):
    """
    Función principal. Recibe el scope y retorna todo el resultado.

    scope = {
        "cliente": "Nombre del cliente",
        "setup_subcuenta": "completo" | "validacion",
        "pipelines": [{"nombre": "Sales", "etapas": 7}, ...],
        "vistas_filtros": 3,
        "workflows": [{"nombre": "SP01", "nodos": 12}, ...],
        "chatbots": [{"nombre": "WhatsApp Bot", "nodos": 14, "ia_avanzada": True}, ...],
        "integraciones": 2,
        "plantillas": 3,
        "calendarios": True,
        "landing_pages": [{"nombre": "Principal", "secciones": 6}, ...],
        "reportes": True,
        "sesiones_capacitacion": 2,
        "soporte": True,
        "pago_anual_soporte": False,
    }
    """
    cotizacion_carte = cotizar_a_la_carte(scope)
    mejor_paquete, todos_paquetes = recomendar_paquete(scope, cotizacion_carte)

    # Descuento anual en soporte si aplica
    mensual_anual = cotizacion_carte["mensual"]
    if scope.get("pago_anual_soporte", False) and scope.get("soporte", False):
        mensual_anual = cotizacion_carte["mensual"] - MODULOS["soporte"]["mensual"] + MODULOS["soporte"]["mensual_anual"]

    return {
        "cliente": scope.get("cliente", "Cliente"),
        "a_la_carte": cotizacion_carte,
        "mensual_con_descuento_anual": round(mensual_anual, 2),
        "mejor_paquete": mejor_paquete,
        "todos_paquetes": todos_paquetes,
    }


# ─── EJEMPLO DE EJECUCIÓN ────────────────────────────────────────────────────

if __name__ == "__main__":
    import json

    # Ejemplo: inmobiliaria mediana con workflows pesados
    scope_ejemplo = {
        "cliente": "Inmobiliaria Ejemplo S.A.",
        "setup_subcuenta": "completo",
        "pipelines": [
            {"nombre": "Leads Calientes", "etapas": 6},
            {"nombre": "Proyectos Activos", "etapas": 8},
        ],
        "vistas_filtros": 3,
        "workflows": [
            {"nombre": "LS01 - Instagram DM", "nodos": 5},
            {"nombre": "LS02 - Meta Campaigns", "nodos": 7},
            {"nombre": "SP01 - New Lead", "nodos": 12},
            {"nombre": "SP02 - Inspection", "nodos": 18},
            {"nombre": "SP03 - Estimate Sent", "nodos": 10},
            {"nombre": "AP01 - Job Scheduled", "nodos": 25},
            {"nombre": "AP02 - Completion", "nodos": 9},
            {"nombre": "PS01 - Review Request", "nodos": 6},
        ],
        "chatbots": [
            {"nombre": "WhatsApp Bot Principal", "nodos": 14, "ia_avanzada": True},
        ],
        "integraciones": 2,
        "plantillas": 3,
        "calendarios": True,
        "landing_pages": [
            {"nombre": "Sitio Principal", "secciones": 7},
        ],
        "reportes": True,
        "sesiones_capacitacion": 2,
        "soporte": True,
        "pago_anual_soporte": False,
    }

    resultado = calcular_cotizacion(scope_ejemplo)

    print("=" * 70)
    print(f"  COTIZACIÓN GHL — {resultado['cliente']}")
    print("=" * 70)

    # À la carte
    print("\n📋 OPCIÓN À LA CARTE")
    print("-" * 40)
    for item in resultado["a_la_carte"]["desglose"]:
        print(f"  {item['modulo']}")
        print(f"    Setup: ${item['setup']} | Mensual: ${item['mensual']}")
        for d in item["detalle"]:
            print(f"      → {d}")
    print(f"\n  TOTAL À LA CARTE: ${resultado['a_la_carte']['setup']} setup | ${resultado['a_la_carte']['mensual']}/mes")

    # Paquetes
    print("\n\n📦 COMPARACIÓN DE PAQUETES")
    print("-" * 40)
    for p in resultado["todos_paquetes"]:
        print(f"\n  {p['paquete']}:")
        print(f"    Setup: ${p['setup_paquete']} (paquete) + ${p['setup_subcuenta']} (subcuenta) + ${p['extras_setup']} (extras) = ${p['setup_total']}")
        print(f"    Mensual: ${p['mensual_paquete']} (paquete) + ${p['extras_mensual']} (extras) = ${p['mensual_total']}")
        print(f"    Ahorro vs à la carte: ${p['ahorro_setup']} en setup | ${p['ahorro_mensual']}/mes | ${p['ahorro_total_primer_año']} en primer año")
        if p["detalle_extras"]:
            print(f"    Extras:")
            for e in p["detalle_extras"]:
                print(f"      → {e}")

    # Recomendación
    if resultado["mejor_paquete"]:
        mp = resultado["mejor_paquete"]
        print(f"\n\n✅ RECOMENDACIÓN: Paquete {mp['paquete']}")
        print(f"   Setup total: ${mp['setup_total']} | Mensual: ${mp['mensual_total']}")
        print(f"   Ahorro primer año vs à la carte: ${mp['ahorro_total_primer_año']}")
    else:
        print("\n\n✅ RECOMENDACIÓN: À la carte (ningún paquete genera ahorro significativo)")

    print("\n" + "=" * 70)
