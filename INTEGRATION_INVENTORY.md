# INTEGRATION INVENTORY
> Cubre I15.0.1 (auditoría) + I15.0.10 (documentación del inventario).
> Fecha: 2026-03-15. Auditoría completa de todos los archivos de integración existentes.
> Estado: evidencia obtenida de lectura directa de código. No afirmaciones sin fuente.

---

## 1. Tabla resumen

| Integración | Archivos UI | Edge Functions | Estado | Decisión |
|---|---|---|---|---|
| **Stripe** | `StripeIntegration.tsx` | `sync-stripe` | Roto — tablas inexistentes, mock data | **Reescribir completo** (I15.92) |
| **Holded** | `HoldedIntegration.tsx` | `auto-sync-finances` | Roto — tablas inexistentes, mock data | **Reescribir completo** (I15.91) |
| **Slack** | `SlackIntegration.tsx` | `send-slack-notification` | Parcial — tabla existe, 3 campos mal | **Rescatar** (I15.0.6) |
| **Google Analytics** | _ninguno_ | `google-analytics-sync` | Roto — OAuth incompleto, sin persistencia de token | **Borrar** → rediseñar en I15.97 |
| **Content Calendar** | _ninguno_ | `generate-content-calendar` | Funcional — tablas existen, Claude real | **Conservar** (no es integración externa) |
| **IntegrationsPreviewModal** | `IntegrationsPreviewModal.tsx` | — | 12 integraciones mock, completamente desconectada | **Ocultar** (I15.0.2 + I15.0.3) |
| **IntegrationsView** | `IntegrationsView.tsx` | — | Hub parcial, tabs Holded/Stripe rotos | **Ocultar ruta** hasta arquitectura real |

**HubSpot, Asana, Trello, Google Calendar:** no existen en el repositorio. Solo mencionados en el preview modal.

---

## 2. Stripe

### Archivos
- `src/components/integrations/StripeIntegration.tsx` (~270 líneas)
- `supabase/functions/sync-stripe/index.ts` (~213 líneas)

### Qué hace (intención)
UI acepta API key (`sk_...`), la guarda en `financial_integrations`, llama a `sync-stripe`
que descarga charges y subscriptions y calcula MRR/ARR.

### Estado real
- `financial_integrations` **no existe** → `upsert` en línea 35–41 crashea silenciosamente
- `synced_transactions` **no existe** → function no puede escribir transacciones
- `subscription_metrics` **no existe** → function no puede escribir MRR
- `sync-stripe` usa `generateMockStripeTransactions()` (línea 55–62) — nunca llama a la API real de Stripe
- Comentario en el código dice "En producción: usar Stripe API real" — nunca implementado

### Riesgo activo
El componente acepta API keys reales del usuario. El `upsert` a tabla inexistente falla, pero
el key se mostraría en texto plano en la DB si la tabla existiera. **Credencial sin cifrar**.

### Decisión: REESCRIBIR COMPLETO
No hay nada rescatable en la lógica de negocio (es toda mock). El componente UI sí tiene
estructura reutilizable. Ejecutar cuando existan las tablas base de Bloque B (I15.15–I15.30)
y `integration_credentials` (I15.23) con cifrado.

---

## 3. Holded

### Archivos
- `src/components/integrations/HoldedIntegration.tsx` (~306 líneas)
- `supabase/functions/auto-sync-finances/index.ts` (~458 líneas)

### Qué hace (intención)
UI acepta API key de Holded, auto-sync cada 2 horas. `auto-sync-finances` soporta 6 providers
(Stripe, Holded, QuickBooks, Xero, PayPal, CSV) con switch por provider.

### Estado real
- Mismas tablas inexistentes que Stripe: `financial_integrations`, `synced_transactions`, `subscription_metrics`
- Todas las funciones `syncStripe`, `syncHolded`, `syncQuickBooks` etc. llaman a `generateMockTransactions()` — sin APIs reales
- CSV sync (líneas 343–383) usa `integration_id=null` → funciona parcialmente sin tabla
- La lógica multi-provider del switch sí es reutilizable como estructura

### Riesgo activo
Mismo problema de credencial en texto plano. Plus: `auto-sync-finances` expone 6 providers
en un solo endpoint — superficie de ataque amplia antes de que exista auth por provider.

### Decisión: REESCRIBIR COMPLETO
La estructura multi-provider del switch es el único elemento rescatable como referencia
de diseño. Todo el resto: mock data, tablas inexistentes. Ejecutar en I15.91 cuando
exista la arquitectura base.

---

## 4. Slack

### Archivos
- `src/components/integrations/SlackIntegration.tsx` (~392 líneas)
- `supabase/functions/send-slack-notification/index.ts` (~157 líneas)

### Qué hace (intención)
UI gestiona webhooks de Slack por proyecto. Permite añadir/borrar webhooks, elegir tipos
de notificaciones (6 tipos), test de webhook. Edge function envía mensajes a Slack.

### Estado real
- Tabla `slack_webhooks` **existe** — este es el único caso donde hay infraestructura real
- **3 mismatches críticos** entre schema actual y lo que el código espera:

| Campo esperado | En DB | Efecto |
|---|---|---|
| `enabled` | `is_active` | Queries con `.eq('enabled', true)` devuelven error |
| `notification_types TEXT[]` | no existe | Query con `.contains('notification_types', [...])` crashea |
| `last_used_at TIMESTAMPTZ` | no existe | Update de tracking silenciosamente falla |
| `created_by UUID` | no existe | Referencia en línea ~100 falla |

- La función `send-slack-notification` usa la API real de Slack (POST a webhook_url) — esto SÍ funciona
- El componente tiene modo demo (`isDemoMode` prop) que funciona sin DB

### Riesgo activo
Bajo. La tabla existe, los webhooks se pueden guardar (sin los campos extras). El envío de mensajes
funciona si el webhook_url es válido. El mismatch produce errores de columna que se propagan
como toast errors o errores silenciosos, no crashes de app.

### Decisión: RESCATAR
Schema fix: añadir 4 columnas a `slack_webhooks` + renombrar `is_active → enabled`.
O alternativa menos destructiva: no renombrar, actualizar las queries en componente y function.
Ejecutar en I15.0.6 cuando se desbloquee el código.

---

## 5. Google Analytics

### Archivos
- `supabase/functions/google-analytics-sync/index.ts` (~451 líneas)
- UI: **no existe** — no hay componente para esta integración

### Qué hace (intención)
OAuth 2.0 con Google, fetch de métricas GA4 (tráfico, conversiones, fuentes, páginas, demographics),
comparación período actual vs anterior, guardado en `projects.metadata`.

### Estado real
- Código OAuth implementado (líneas 199–246) — estructura correcta pero incompleta:
  - No persiste tokens en ninguna tabla (cada sesión requiere re-auth)
  - No maneja refresh de tokens (expiran a 1 hora)
  - Guarda métricas en `projects.metadata` JSONB — sin tabla dedicada, sin historial
- Depende de 3 env vars no configuradas: `GOOGLE_OAUTH_CLIENT_ID`, `GOOGLE_OAUTH_CLIENT_SECRET`, `GOOGLE_OAUTH_REDIRECT_URI`
- Sin componente UI → no hay forma de que el usuario lo configure

### Riesgo activo
Ninguno activo (no hay UI que lo dispare). Pero si se activa sin las env vars, falla silenciosamente
y el error se pierde.

### Decisión: BORRAR
La función puede eliminarse. El trabajo real de GA se hará desde cero como I15.97 con:
diseño de tabla `integration_credentials` (token storage cifrado), tabla dedicada para
métricas GA, UI de autorización, y refresh token flow correcto.

---

## 6. Content Calendar

### Archivos
- `supabase/functions/generate-content-calendar/index.ts` (~277 líneas)

### Estado real
- Tablas `content_calendars` y `content_pieces` **existen**
- Usa Claude 3.5 Sonnet real (no mock)
- Depende de `ANTHROPIC_API_KEY` — si no está configurada, falla con error claro
- `userId` pasado como `undefined` en línea 119 (bug menor en log)

### Decisión: CONSERVAR
No es una integración con proveedor externo — es una feature de generación de contenido IA interna.
No forma parte de FASE 15. El bug de `userId=undefined` en el log es cosmético.

---

## 7. IntegrationsPreviewModal

### Archivos
- `src/components/preview/IntegrationsPreviewModal.tsx` (~634 líneas)

### Estado real
- Muestra 12 integraciones como si fueran disponibles o próximamente disponibles
- Completamente mock: ninguna conecta a la DB ni a código real
- Las 12: Slack, HubSpot, Salesforce, Google Workspace, Teams, Jira, Notion, Asana, Stripe, Zapier, GitHub, Intercom
- De esas 12, solo Slack y Stripe tienen código real (parcialmente roto)
- El modal puede ser activado desde algún lugar de la UI (no investigado en este audit)

### Decisión: OCULTAR
No eliminar — puede servir como referencia de UX al diseñar la sección real. Pero no debe
ser accesible al usuario activo porque muestra features que no existen, generando expectativa
falsa. Ejecutar en I15.0.2.

---

## 8. IntegrationsView (ruta `/integrations`)

### Archivos
- `src/pages/IntegrationsView.tsx` (~883 líneas)
- `src/pages/Index.tsx` línea 239: `<Route path="integrations" element={<IntegrationsView />} />`

### Estado real
- Tiene 3 tabs: Slack (parcialmente funcional), Stripe (roto), Holded (roto)
- Tabs "Webhooks" y "API" deshabilitados con badge "Próximamente"
- 12 integraciones adicionales en preview carousel (todas mock)
- La ruta está activa y accesible para cualquier usuario autenticado

### Decisión: OCULTAR RUTA
Desactivar la ruta en Index.tsx hasta que exista arquitectura funcional mínima (Bloques B + C).
Ejecutar en I15.0.3.

---

## 9. Riesgo de credenciales (I15.0.9)

| Componente | Problema | Severidad |
|---|---|---|
| StripeIntegration.tsx | API key (`sk_...`) se enviaría a tabla `financial_integrations.api_key` como texto plano | 🔴 Diseño incorrecto (no ejecuta por tabla inexistente) |
| HoldedIntegration.tsx | API key de Holded igual — mismo diseño, mismo riesgo | 🔴 Diseño incorrecto |
| google-analytics-sync | OAuth secrets en env vars de Supabase → protegidos por defecto | 🟢 Sin riesgo |

**Conclusión:** El diseño de almacenar api_key como TEXT en tabla es incorrecto. Cuando se creen
las tablas en Bloque B, `integration_credentials` (I15.23) debe usar cifrado (Supabase Vault
o columna bytea con pg_crypto). Nunca TEXT plano.

---

## 10. Edge functions — decisiones I15.0.8

| Función | Decisión | Motivo |
|---|---|---|
| `sync-stripe` | **Reescribir** | Mock data, tablas inexistentes, sin API real |
| `auto-sync-finances` | **Reescribir** | Mock data, tablas inexistentes; estructura multi-provider usable como referencia |
| `send-slack-notification` | **Rescatar** | Lógica correcta, solo arreglar nombres de columnas |
| `google-analytics-sync` | **Borrar** | Sin UI, OAuth incompleto, sin persistencia de token |
| `generate-content-calendar` | **Conservar** | Funcional, no es integración externa |

---

## 11. Plan de ejecución para I15.0.2–I15.0.9 (requieren código)

Estas tareas están decididas. Se ejecutan cuando se levante la restricción de código.
Orden recomendado:

1. **I15.0.3** — Ocultar ruta `/integrations` en Index.tsx
2. **I15.0.2** — Ocultar/desactivar IntegrationsPreviewModal
3. **I15.0.7** — Añadir comentario `@legacy_stub` a StripeIntegration y HoldedIntegration (no borrar aún — sirven de referencia de UX)
4. **I15.0.5** — Comentar/eliminar las funciones `generateMockStripeTransactions` y `generateMockTransactions` en edge functions
5. **I15.0.8** — Borrar `google-analytics-sync`
6. **I15.0.4** — Aislar imports a `financial_integrations` (no eliminar el componente, sí romper la dependencia activa)
7. **I15.0.6** — Fix schema `slack_webhooks`: añadir `enabled`, `notification_types`, `last_used_at`, `created_by`; actualizar componente y función
8. **I15.0.9** — Documentar decisión de cifrado en `integration_credentials` (I15.23) — ya documentado aquí

---

## 12. Qué NO existe en el repositorio

Mencionado en el preview modal o en el plan de FASE 15, pero sin ningún código:
- HubSpot
- Asana
- Trello
- Google Calendar
- Salesforce, Teams, Jira, Notion, Zapier, GitHub, Intercom

Todos parten de cero en FASE 15 (I15.93–I15.97).

---

> Próximo documento: `INTEGRATION_DATA_CONTRACT.md` (I15.A.15)
