# 🎯 NOVA HUB - PROJECT PHASES & EXAMPLES

Generated: 2026-02-21

---

## 📊 FASES DEL PROYECTO (Project Lifecycle)

Nova Hub gestiona proyectos a través de 6 fases progresivas:

```
┌─────────────────────────────────────────────────────────────────┐
│                    PROJECT LIFECYCLE                             │
└─────────────────────────────────────────────────────────────────┘

1. 💡 IDEA
   └─> Concepto inicial, validación de problema
       ├─ Onboarding tipo: "generative" o "idea"
       ├─ Objetivo: Definir propuesta de valor
       └─ Siguiente: Validar que el problema existe

2. ✅ PROBLEMA_VALIDADO
   └─> El problema existe y es importante
       ├─ Objetivo: Entender el mercado y usuarios
       └─ Siguiente: Diseñar la solución

3. 🎨 SOLUCION_VALIDADA
   └─> La solución propuesta resuelve el problema
       ├─ Objetivo: Validar que la solución funciona
       └─ Siguiente: Construir MVP

4. 🚀 MVP
   └─> Producto mínimo viable en el mercado
       ├─ Objetivo: Conseguir primeros usuarios/clientes
       └─ Siguiente: Demostrar tracción

5. 📈 TRACCION
   └─> Crecimiento constante demostrado
       ├─ Objetivo: Escalar usuarios y revenue
       └─ Siguiente: Crecer de forma sostenible

6. 🏆 CRECIMIENTO
   └─> Escalando el negocio
       ├─ Objetivo: Dominar el mercado
       └─ Siguiente: Consolidación y expansión
```

---

## 🎯 OBJETIVOS CONFIGURABLES (De configuration tables)

Sistema de objetivos semestrales para equipos:

| Objetivo      | Target    | Unidad | Período  | Descripción                          |
|---------------|-----------|--------|----------|--------------------------------------|
| **obvs**      | 150       | OBVs   | semester | Interacciones con clientes           |
| **lps**       | 18        | LPs    | semester | Learning Points (aprendizajes)       |
| **bps**       | 66        | BPs    | semester | Building Points (construcción)       |
| **cps**       | 40        | CPs    | semester | Contribution Points (contribución)   |
| **facturacion** | 15,000  | €      | semester | Revenue generado                     |
| **margen**    | 7,500     | €      | semester | Margen neto                          |

---

## 📝 EJEMPLO 1: Proyecto IDEA (Generative Onboarding)

### Project Record

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440001",
  "nombre": "EcoBox - Packaging Sostenible",
  "descripcion": "Servicio de packaging biodegradable para ecommerce con suscripción mensual",
  "owner_id": "user-uuid-laura",
  "work_mode": "individual",
  "business_idea": "Resolver el problema de residuos plásticos en packaging de ecommerce mediante materiales 100% biodegradables con suscripción flexible",
  "industry": "sustainability",
  "logo_url": null,
  "fase": "idea",
  "tipo": "validacion",
  "facturacion": 0,
  "margen": 0,
  "onboarding_completed": true,
  "icon": "📦",
  "color": "#10B981",
  "active": true,
  "deleted_at": null,
  "created_at": "2026-02-15T10:30:00Z",
  "updated_at": "2026-02-15T11:45:00Z",

  "onboarding_data": {
    "onboarding_type": "generative",
    "fast_start_completed": true,
    "deep_setup_completed": false,

    "fast_start": {
      "completed_at": "2026-02-15T10:45:00Z",
      "responses": {
        "business_idea": "Packaging biodegradable para ecommerce",
        "target_audience": "Tiendas online pequeñas y medianas (1-100 pedidos/día)",
        "main_problem": "Alto costo ambiental del packaging tradicional + presión de consumidores por sostenibilidad",
        "unique_value": "100% biodegradable en 90 días + diseño personalizable + sin mínimos de pedido",
        "revenue_model": "Suscripción mensual por volumen (€49/mes = 100 cajas, €149/mes = 500 cajas)"
      }
    },

    "ai_generated": {
      "business_model_canvas": {
        "customer_segments": [
          "Ecommerce B2C (moda, cosmética, alimentación)",
          "Startups sostenibles",
          "Marcas con valores ecológicos"
        ],
        "value_propositions": [
          "Packaging 100% biodegradable certificado",
          "Diseño personalizable con branding",
          "Sin mínimos de pedido",
          "Entrega 48h",
          "Precio competitivo vs. packaging tradicional"
        ],
        "channels": [
          "Web directa",
          "Partnerships con plataformas ecommerce (Shopify, WooCommerce)",
          "LinkedIn B2B marketing",
          "Instagram (casos de éxito de clientes)"
        ],
        "customer_relationships": [
          "Onboarding personalizado",
          "Soporte chat 24/7",
          "Comunidad de marcas sostenibles"
        ],
        "revenue_streams": [
          "Suscripción mensual recurrente",
          "Upselling diseño premium",
          "Consultoría sostenibilidad (€500/sesión)"
        ],
        "key_resources": [
          "Proveedores materiales biodegradables certificados",
          "Diseñadores gráficos",
          "Sistema logístico 48h",
          "Certificaciones ambientales"
        ],
        "key_activities": [
          "Producción packaging",
          "Diseño personalizado",
          "Logística y distribución",
          "Marketing contenido sostenibilidad"
        ],
        "key_partners": [
          "Fabricantes materiales biodegradables",
          "Empresas logística eco-friendly",
          "Certificadoras ambientales",
          "Plataformas ecommerce"
        ],
        "cost_structure": [
          "Materiales biodegradables (40% revenue)",
          "Producción y diseño (25%)",
          "Logística (15%)",
          "Marketing (10%)",
          "Operaciones (10%)"
        ]
      },

      "competitive_analysis": {
        "competitors": [
          {
            "name": "NoIssue",
            "strengths": ["Marca establecida", "Catálogo amplio", "Internacional"],
            "weaknesses": ["Mínimos altos", "Precio premium", "Entrega lenta España"],
            "market_position": "Líder global"
          },
          {
            "name": "EcoEnclose",
            "strengths": ["Variedad materiales", "Certificaciones"],
            "weaknesses": ["Solo USA", "Sin personalización"],
            "market_position": "Nicho USA"
          },
          {
            "name": "Packhelp",
            "strengths": ["Diseño online fácil", "Europa"],
            "weaknesses": ["No 100% biodegradable", "Mínimos 30 unidades"],
            "market_position": "Competidor directo Europa"
          }
        ],
        "competitive_advantage": "Único en España con 100% biodegradable + sin mínimos + 48h"
      },

      "validation_roadmap": {
        "phase_1_problem_validation": {
          "duration_weeks": 2,
          "objectives": [
            "Entrevistar 20 tiendas ecommerce sobre packaging actual",
            "Validar que sostenibilidad es criterio de compra importante",
            "Identificar price sensitivity (€ máximo que pagarían)"
          ],
          "success_criteria": "15/20 dicen que cambiarían a biodegradable si precio es similar"
        },
        "phase_2_solution_validation": {
          "duration_weeks": 3,
          "objectives": [
            "Crear 3 prototipos de cajas con diferentes materiales",
            "Conseguir 10 tiendas que prueben el packaging gratis",
            "Medir feedback: resistencia, estética, biodegradabilidad real"
          ],
          "success_criteria": "8/10 dicen que usarían el producto de forma recurrente"
        },
        "phase_3_mvp": {
          "duration_weeks": 4,
          "objectives": [
            "Landing page + sistema pedidos",
            "Alianza con 1 proveedor materiales",
            "Conseguir 5 clientes pagando (plan básico €49/mes)",
            "Validar logística 48h"
          ],
          "success_criteria": "5 clientes pagando + NPS > 8 + margen > 30%"
        }
      },

      "market_insights": {
        "market_size_spain": "€45M/año packaging ecommerce sostenible (crecimiento 23% anual)",
        "target_market_size": "€8M/año (tiendas 1-100 pedidos/día)",
        "trends": [
          "Regulación UE anti-plástico cada vez más estricta",
          "Consumidores priorizan marcas sostenibles (68% dispuestos a pagar +10%)",
          "Ecommerce España creció 120% post-COVID"
        ],
        "risks": [
          "Commoditización del mercado biodegradable",
          "Proveedores limitados pueden subir precios",
          "Certificaciones caras y lentas"
        ]
      }
    },

    "next_steps": [
      "Completar Deep Setup: Validación de problema",
      "Crear lista de 50 tiendas ecommerce target para entrevistas",
      "Investigar proveedores materiales biodegradables en España",
      "Diseñar prototipo MVP packaging"
    ],

    "progress": {
      "onboarding": 100,
      "problem_validation": 0,
      "solution_validation": 0,
      "mvp": 0
    }
  }
}
```

---

## 📝 EJEMPLO 2: Proyecto EXISTING (Startup en crecimiento)

### Project Record

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440002",
  "nombre": "FitCoach AI",
  "descripcion": "Plataforma SaaS de coaching fitness personalizado con IA para gimnasios",
  "owner_id": "user-uuid-carlos",
  "work_mode": "team_small",
  "business_idea": "Democratizar el coaching personalizado mediante IA, permitiendo a gimnasios ofrecer planes personalizados a escala sin contratar más entrenadores",
  "industry": "fitness_tech",
  "logo_url": "https://storage.supabase.co/avatars/fitcoach-logo.png",
  "fase": "traccion",
  "tipo": "operacion",
  "facturacion": 24500,
  "margen": 14700,
  "onboarding_completed": true,
  "icon": "💪",
  "color": "#F59E0B",
  "active": true,
  "deleted_at": null,
  "created_at": "2024-08-10T09:00:00Z",
  "updated_at": "2026-02-20T18:30:00Z",

  "onboarding_data": {
    "onboarding_type": "existing",
    "fast_start_completed": true,
    "deep_setup_completed": true,

    "fast_start": {
      "completed_at": "2024-08-10T10:15:00Z",
      "responses": {
        "current_status": "mvp_launched",
        "monthly_revenue": 18000,
        "team_size": 4,
        "main_challenge": "Escalar ventas B2B a gimnasios medianos sin aumentar CAC",
        "growth_goal": "Pasar de 12 gimnasios a 50 en 6 meses"
      }
    },

    "existing_business_data": {
      "launch_date": "2024-03-01",
      "current_metrics": {
        "mrr": 24500,
        "customers": 18,
        "churn_rate": 8.5,
        "cac": 1850,
        "ltv": 14200,
        "gross_margin": 60,
        "team_size": 4,
        "runway_months": 14
      },

      "customer_breakdown": {
        "total_gyms": 18,
        "by_size": {
          "small_1_50_members": 12,
          "medium_51_200_members": 5,
          "large_200_plus_members": 1
        },
        "avg_revenue_per_gym": 1360,
        "top_3_customers_revenue_pct": 42
      },

      "team_composition": [
        {
          "role": "ceo_founder",
          "name": "Carlos Martínez",
          "responsibilities": ["Estrategia", "Ventas B2B", "Fundraising"],
          "specialization": "sales"
        },
        {
          "role": "cto_cofounder",
          "name": "Ana López",
          "responsibilities": ["Desarrollo producto", "IA/ML", "Infraestructura"],
          "specialization": "ai_tech"
        },
        {
          "role": "product_designer",
          "name": "David Ruiz",
          "responsibilities": ["UX/UI", "Research usuarios", "Branding"],
          "specialization": "operations"
        },
        {
          "role": "customer_success",
          "name": "Laura Sánchez",
          "responsibilities": ["Onboarding gimnasios", "Soporte", "Retención"],
          "specialization": "operations"
        }
      ],

      "tech_stack": {
        "frontend": "React + TypeScript + Tailwind CSS",
        "backend": "Node.js + Express + PostgreSQL",
        "ai_ml": "Python + TensorFlow + OpenAI API",
        "infrastructure": "AWS + Vercel + Supabase",
        "analytics": "Mixpanel + Google Analytics",
        "tools": "Linear + Notion + Slack + Figma"
      },

      "funding_status": {
        "stage": "pre_seed",
        "total_raised": 180000,
        "investors": [
          "Friends & Family (€50k)",
          "Angel investor - sector fitness (€80k)",
          "Venture Studio (€50k + mentoring)"
        ],
        "next_round": {
          "target": "Seed €500k",
          "timeline": "Q3 2026",
          "use_of_funds": "Contratar equipo sales (2 BDRs) + Marketing (€120k) + Producto (1 dev senior)"
        }
      },

      "current_challenges": [
        {
          "challenge": "Sales cycle muy largo (45-60 días)",
          "impact": "Retrasa crecimiento MRR",
          "current_solution": "Implementar demos automatizados + trial 14 días"
        },
        {
          "challenge": "Onboarding gimnasios requiere mucho tiempo (8h/gimnasio)",
          "impact": "Customer Success no escala",
          "current_solution": "Crear onboarding self-service + videos tutoriales"
        },
        {
          "challenge": "Precisión IA varía según tipo usuario",
          "impact": "Algunos gimnasios reportan planes genéricos",
          "current_solution": "Mejorar modelo ML con más datos + feedback loop"
        },
        {
          "challenge": "Competencia con soluciones gratis (apps móviles)",
          "impact": "Price sensitivity alta en gimnasios pequeños",
          "current_solution": "Diferenciación B2B (branding gimnasio + integración CRM)"
        }
      ],

      "okrs_current_quarter": [
        {
          "objective": "Escalar revenue de forma sostenible",
          "key_results": [
            {
              "kr": "Alcanzar €35k MRR (+43%)",
              "current": 24500,
              "target": 35000,
              "status": "on_track"
            },
            {
              "kr": "Reducir CAC de €1850 a €1200",
              "current": 1850,
              "target": 1200,
              "status": "at_risk"
            },
            {
              "kr": "Mantener churn < 7%",
              "current": 8.5,
              "target": 7,
              "status": "at_risk"
            }
          ]
        },
        {
          "objective": "Mejorar eficiencia operativa",
          "key_results": [
            {
              "kr": "Reducir onboarding de 8h a 3h por gimnasio",
              "current": 8,
              "target": 3,
              "status": "in_progress"
            },
            {
              "kr": "Automatizar 70% de soporte con docs + chatbot",
              "current": 35,
              "target": 70,
              "status": "in_progress"
            }
          ]
        },
        {
          "objective": "Validar product-market fit en segmento medio",
          "key_results": [
            {
              "kr": "Conseguir 8 gimnasios medianos (51-200 miembros)",
              "current": 5,
              "target": 8,
              "status": "on_track"
            },
            {
              "kr": "NPS > 50 en segmento medio",
              "current": 42,
              "target": 50,
              "status": "at_risk"
            }
          ]
        }
      ],

      "integrations_active": [
        "Stripe (pagos)",
        "Mailchimp (email marketing)",
        "Calendly (demos)",
        "Intercom (soporte)",
        "Slack (notificaciones internas)",
        "Google Analytics (analytics)"
      ]
    },

    "ai_generated_insights": {
      "growth_recommendations": [
        {
          "recommendation": "Pivotar pricing: crear tier Enterprise (€500-800/mes) para gimnasios grandes con personalización",
          "reasoning": "Tu único cliente large aporta 18% del revenue con bajo esfuerzo. Potencial €15k MRR adicional con 5 clientes large.",
          "priority": "high",
          "estimated_impact": "+€15k MRR en 4 meses"
        },
        {
          "recommendation": "Implementar referral program: 1 mes gratis por cada gimnasio referido que pague 3 meses",
          "reasoning": "Gimnasios pequeños se conocen entre sí (asociaciones locales). CAC referido = €0 vs €1850 actual.",
          "priority": "high",
          "estimated_impact": "CAC -35% en 3 meses"
        },
        {
          "recommendation": "Crear partnerships con CRM fitness (Glofox, Virtuagym)",
          "reasoning": "Integración nativa = lower friction + co-marketing. Sus usuarios ya pagan, menor price sensitivity.",
          "priority": "medium",
          "estimated_impact": "+30 leads cualificados/mes"
        }
      ],

      "churn_risk_analysis": {
        "high_risk_customers": [
          {
            "gym_name": "FitZone Madrid Norte",
            "risk_score": 78,
            "risk_factors": [
              "Uso bajo (solo 15% miembros usan la app)",
              "Tickets soporte frecuentes (8 en último mes)",
              "No renovó tier premium"
            ],
            "recommended_action": "Call CEO → identificar pain points → ofrecer training equipo gratis"
          }
        ],
        "churn_prevention_playbook": {
          "trigger_low_usage": "Si uso < 30% miembros en primeros 30 días → email automático + tutorial personalizado",
          "trigger_support_tickets": "Si > 5 tickets/mes → asignar CS dedicado",
          "trigger_payment_failed": "Email inmediato + call en 24h + ofrecer split payment"
        }
      },

      "competitor_intelligence": {
        "last_updated": "2026-02-18",
        "movements_detected": [
          {
            "competitor": "TrainWith AI",
            "movement": "Levantaron Seed €2M liderado por Kfund",
            "analysis": "Van a escalar marketing agresivo. Necesitas diferenciarte en integraciones B2B.",
            "action": "Acelerar partnerships + reforzar messaging 'solución B2B, no B2C'"
          },
          {
            "competitor": "MyCoach App",
            "movement": "Lanzaron tier gimnasios a €99/mes (vs. tu €149)",
            "analysis": "Price war en segmento pequeño. Mal para márgenes.",
            "action": "Mantener precio pero añadir valor: analytics gimnasio + branding"
          }
        ]
      }
    },

    "next_steps": [
      "Call urgente con FitZone Madrid Norte para prevenir churn",
      "Diseñar tier Enterprise y pricing (€500-800/mes)",
      "Investigar partnerships: contactar Glofox y Virtuagym",
      "Automatizar onboarding: crear 5 videos tutoriales",
      "Preparar deck Seed round (target Q3 2026)"
    ],

    "progress": {
      "onboarding": 100,
      "product_market_fit": 65,
      "scalability": 45,
      "fundraising_readiness": 70
    }
  }
}
```

---

## 🔑 KEY DIFFERENCES: Idea vs. Existing

| Aspecto                  | IDEA (Generative)                          | EXISTING (Startup)                               |
|--------------------------|--------------------------------------------|-------------------------------------------------|
| **Fase típica**          | `idea` o `problema_validado`               | `mvp`, `traccion`, `crecimiento`                |
| **Onboarding data**      | AI generado (business model, roadmap)      | Real data (métricas, equipo, OKRs)              |
| **Facturación**          | €0                                         | €24,500 MRR                                     |
| **Work mode**            | `individual` o `team_small`                | `team_small` o `team_established`               |
| **Tipo**                 | `validacion`                               | `operacion`                                     |
| **AI Insights**          | Validación de problema, competencia        | Growth hacks, churn prevention, fundraising     |
| **Next steps**           | Validar hipótesis, crear MVP               | Escalar, optimizar, fundraising                 |
| **Complejidad context**  | Business idea + hipótesis                  | Métricas reales + equipo + OKRs + competitors   |

---

## 🎨 CÓMO SE USA EL CONTEXTO EN AI LEAD FINDER

Cuando el usuario ejecuta **AI Lead Finder**, el sistema:

### Para proyecto IDEA (EcoBox):
```typescript
const projectContext = {
  work_mode: 'individual',
  industry: 'sustainability',
  business_idea: 'Packaging biodegradable para ecommerce...',
  current_phase: 'idea',
  onboarding_data: { /* datos generativos */ }
};

// AI Lead Finder busca:
- Tiendas ecommerce 1-100 pedidos/día (target audience)
- Sector: moda, cosmética, alimentación
- Que valoren sostenibilidad
- Ubicación: España (prioridad logística 48h)
```

### Para proyecto EXISTING (FitCoach AI):
```typescript
const projectContext = {
  work_mode: 'team_small',
  industry: 'fitness_tech',
  business_idea: 'SaaS coaching IA para gimnasios...',
  current_phase: 'traccion',
  current_metrics: { mrr: 24500, customers: 18 },
  okrs: [ /* objetivos actuales */ ]
};

// AI Lead Finder busca:
- Gimnasios medianos (51-200 miembros) - objetivo OKR
- Que ya usen CRM fitness (Glofox, Virtuagym)
- Ubicación: España + Portugal (expansión geográfica lógica)
- Que tengan app móvil propia (pain point integración)
```

---

## 📌 NOTAS IMPORTANTES

1. **onboarding_data es JSONB**: Estructura flexible que evoluciona según el tipo de proyecto
2. **Contexto completo**: Cuanto más completo el onboarding_data, más precisos los leads
3. **AI Lead Finder context-aware**: Lee TODO el onboarding_data para personalizar búsqueda
4. **Progress tracking**: Cada proyecto tiene su propio progress (onboarding, validación, MVP, etc.)
5. **Multi-tenant por proyecto**: Laura puede tener EcoBox (idea) + otro proyecto (existing) simultáneamente

---

**End of document**
