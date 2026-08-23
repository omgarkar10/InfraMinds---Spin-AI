import { createContext, useContext, useState, type ReactNode } from "react";

// ── BRICS Country Language Config ──────────────────────────────────────────
export type CountryCode = "IN" | "BR" | "RU" | "CN" | "ZA";

export interface CountryConfig {
  code: CountryCode;
  name: string;
  language: string;
  languageNative: string;
  flag: string;
  status: "active" | "proposed";
}

export const COUNTRIES: CountryConfig[] = [
  { code: "IN", name: "India",        language: "English / Hindi",      languageNative: "English / हिन्दी",  flag: "🇮🇳", status: "active"   },
  { code: "BR", name: "Brazil",       language: "Portuguese",            languageNative: "Português",          flag: "🇧🇷", status: "proposed" },
  { code: "RU", name: "Russia",       language: "Russian",               languageNative: "Русский",            flag: "🇷🇺", status: "proposed" },
  { code: "CN", name: "China",        language: "Mandarin Chinese",      languageNative: "普通话",             flag: "🇨🇳", status: "proposed" },
  { code: "ZA", name: "South Africa", language: "English / Zulu",        languageNative: "English / isiZulu",  flag: "🇿🇦", status: "proposed" },
];

// ── Translation Schema ──────────────────────────────────────────────────────
export interface Translations {
  // Nav
  overview: string;
  how_it_works: string;
  intelligence: string;
  architecture: string;
  impact: string;
  enter_dashboard: string;
  citizen_label: string;
  select_region: string;
  adapts_spin_language: string;
  proposed_architecture_demo: string;

  // Hero
  hero_eyebrow: string;
  hero_headline_1: string;
  hero_headline_2: string;
  hero_body: string;
  pipeline_citizen: string;
  pipeline_ai: string;
  pipeline_geo: string;
  pipeline_policy: string;
  scroll_to_explore: string;

  // Problem (01)
  problem_label: string;
  problem_h2_1: string;
  problem_h2_2: string;
  problem_citizen_title: string;
  problem_gov_title: string;
  problem_citizen_items: string[];
  problem_gov_items: string[];
  problem_outcomes: string[];
  problem_result: string;

  // Transformation (02)
  trans_label: string;
  trans_h2_1: string;
  trans_h2_2: string;
  trans_stage_1_label: string;
  trans_quote: string;
  trans_stage_1_tags: string[];
  trans_stage_2_label: string;
  trans_table_rows: [string, string][];
  trans_stage_3_label: string;
  trans_complaints: string;
  trans_cluster: string;
  trans_red_zone: string;
  trans_identified: string;
  trans_spatial_tag: string;
  trans_stage_4_label: string;
  trans_recommended: string;
  trans_action: string;
  trans_pending: string;
  trans_disclaimer: string;
  trans_replay: string;

  // Process (03)
  process_label: string;
  process_h2_1: string;
  process_h2_2: string;
  process_checkpoint: string;
  process_stages: { num: string; title: string; desc: string; hitl: boolean }[];

  // Ecosystem (04)
  eco_label: string;
  eco_h2_1: string;
  eco_h2_2: string;
  eco_layers: { label: string; items: string[] }[];
  eco_bhashini_h3: string;
  eco_bhashini_body: string;
  eco_bhashini_flow: string[];

  // Agents (05)
  agents_label: string;
  agents_h2_1: string;
  agents_h2_2: string;
  agents_list: { num: string; name: string; role: string; input: string | null; process: string | null; output: string | null; hitl: boolean }[];
  agents_disclaimer: string;

  // Geospatial (06)
  geo_label: string;
  geo_h2_1: string;
  geo_h2_2: string;
  geo_redzone: string;
  geo_redzone_def: string;
  geo_data_rows: [string, string][];
  geo_rec_label: string;
  geo_rec_action: string;
  geo_rec_amount: string;
  geo_pending: string;

  // Impact (07)
  impact_label: string;
  impact_h2_1: string;
  impact_h2_2: string;
  impact_demo_badge: string;
  impact_metrics: { value: string; label: string; sub: string }[];

  // Footer
  footer_h2_1: string;
  footer_h2_2: string;
  footer_tagline: string;
  footer_explore: string;
  footer_view_dash: string;
  footer_built: string;
  footer_proto: string;

  // Dashboard & Citizen
  dash_title: string;
  dash_summary_title: string;
  dash_signals: string;
  dash_top_domain: string;
  dash_avg_severity: string;
  dash_red_zones: string;
  dash_budget_title: string;
  citizen_chat_title: string;
  citizen_placeholder: string;
}

// ── Translations Data ───────────────────────────────────────────────────────
const TRANSLATIONS: Record<CountryCode, Translations> = {
  IN: {
    overview: "Overview",
    how_it_works: "How It Works",
    intelligence: "Intelligence",
    architecture: "Architecture",
    impact: "Impact",
    enter_dashboard: "Dashboard →",
    citizen_label: "Citizen",
    select_region: "Select Region",
    adapts_spin_language: "Adapts SPIN to local language",
    proposed_architecture_demo: "PROPOSED ARCHITECTURE · UI DEMO ONLY",

    hero_eyebrow: "Digital Public Infrastructure / AI Governance",
    hero_headline_1: "Turning citizen voices",
    hero_headline_2: "into infrastructure intelligence.",
    hero_body: "SPIN connects citizen grievances with AI, geospatial intelligence and public infrastructure data to help governments understand where communities need investment most.",
    pipeline_citizen: "CITIZEN SIGNALS",
    pipeline_ai: "AI UNDERSTANDING",
    pipeline_geo: "GEOSPATIAL CONTEXT",
    pipeline_policy: "POLICY ACTION",
    scroll_to_explore: "Scroll to explore",

    problem_label: "The Problem",
    problem_h2_1: "The problem isn't",
    problem_h2_2: "a lack of data. It's disconnected data.",
    problem_citizen_title: "Citizen Signals",
    problem_gov_title: "Government Systems",
    problem_citizen_items: ["Voice", "Text", "Images", "Local languages", "GPS location"],
    problem_gov_items: ["CPGRAMS", "Infrastructure records", "PM Gati Shakti", "Demographics", "Planning data"],
    problem_outcomes: ["FRAGMENTED SIGNALS", "SILOED SYSTEMS", "REACTIVE DECISIONS"],
    problem_result: "Misaligned infrastructure investment.",

    trans_label: "See the Transformation",
    trans_h2_1: "What if every complaint",
    trans_h2_2: "became a planning signal?",
    trans_stage_1_label: "RAW SIGNAL",
    trans_quote: '"Hamare area mein pichle 3 hafton se paani nahi aa raha."',
    trans_stage_1_tags: ["HINDI", "UNSTRUCTURED", "VOICE INPUT"],
    trans_stage_2_label: "AI INTERPRETATION",
    trans_table_rows: [
      ["DOMAIN", "WATER"],
      ["SEVERITY", "HIGH"],
      ["LOCATION", "Sector 4"],
      ["ISSUE", "Supply disruption — 3 weeks"],
      ["LANGUAGE", "Hindi → English"],
    ],
    trans_stage_3_label: "SPATIAL INTELLIGENCE",
    trans_complaints: "Complaints",
    trans_cluster: "Cluster",
    trans_red_zone: "RED ZONE",
    trans_identified: "Identified",
    trans_spatial_tag: "Sector 4 East / WATER / HIGH DENSITY",
    trans_stage_4_label: "POLICY ACTION",
    trans_recommended: "Recommended Action",
    trans_action: "Increase water infrastructure allocation — Sector 4 East",
    trans_pending: "AWAITING POLICYMAKER DECISION",
    trans_disclaimer: "AI RECOMMENDS. HUMANS REMAIN ACCOUNTABLE.",
    trans_replay: "[ REPLAY ]",

    process_label: "The System",
    process_h2_1: "Six stages.",
    process_h2_2: "One coherent pipeline.",
    process_checkpoint: "HUMAN CHECKPOINT",
    process_stages: [
      { num: "01", title: "Citizen Input", desc: "Text, voice, images in any local language via WhatsApp, Telegram, or web.", hitl: false },
      { num: "02", title: "Language Processing", desc: "Bhashini detects language, transcribes speech, and translates to English for AI analysis.", hitl: false },
      { num: "03", title: "Location Verification", desc: "Human-in-the-loop gate confirms geographic context before processing.", hitl: true },
      { num: "04", title: "Semantic Understanding", desc: "Gemini agent extracts domain, classifies intent, and scores severity.", hitl: false },
      { num: "05", title: "Geospatial Correlation", desc: "Complaint is matched to infrastructure layers, demographics, and Gati Shakti data.", hitl: false },
      { num: "06", title: "Policy Action", desc: "Red Zone identification and budget recommendations surfaced for policymakers.", hitl: false },
    ],

    eco_label: "Data Ecosystem",
    eco_h2_1: "One signal is useful.",
    eco_h2_2: "A connected signal is powerful.",
    eco_layers: [
      { label: "CITIZEN SIGNALS", items: ["Voice", "Text", "Images", "Location"] },
      { label: "LANGUAGE & AI", items: ["Bhashini detection", "Speech recognition", "Translation", "Semantic parsing"] },
      { label: "GOVERNMENT DATA", items: ["CPGRAMS", "PM Gati Shakti", "Demographics", "Infrastructure layers"] },
      { label: "POLICY INTELLIGENCE", items: ["Red Zones", "Infrastructure gaps", "Priorities", "Recommendations"] },
    ],
    eco_bhashini_h3: "Language should never be a barrier to governance.",
    eco_bhashini_body: "SPIN accepts citizen input in any local language. Multilingual AI provides automatic detection, transcription, and translation prior to analysis. Every voice matters.",
    eco_bhashini_flow: ["Local voice", "Multilingual Engine", "English grievance", "AI analysis", "Policy insight"],

    agents_label: "The AI Pipeline",
    agents_h2_1: "Five stages.",
    agents_h2_2: "One intelligence pipeline.",
    agents_list: [
      { num: "01", name: "Root Agent", role: "Orchestrates the full pipeline workflow.", input: null, process: null, output: null, hitl: false },
      { num: "02", name: "Chatbot Intake Agent", role: "Receives and normalizes citizen input.", input: "Citizen message — any format, any language", process: null, output: "Normalized intake payload", hitl: false },
      { num: "03", name: "HITL Location Gate", role: "Human verifies that sufficient location data exists before pipeline continues.", input: "Intake payload", process: "Human confirms location context", output: "Location-confirmed complaint", hitl: true },
      { num: "04", name: "Semantic Parsing Agent", role: "Understands the complaint in depth.", input: '"The road outside our school has been broken for months."', process: "Entity extraction · Intent classification · Severity scoring", output: "ROAD / PUBLIC WORKS / HIGH", hitl: false },
      { num: "05", name: "Geospatial Correlation Agent", role: "Connects complaint with spatial and infrastructure data.", input: "Structured grievance + confirmed location", process: "Spatial join with infrastructure and demographics", output: "Cluster coordinates, Red Zone flag, infrastructure context", hitl: false },
      { num: "06", name: "Policy Dashboard Agent", role: "Converts analysis into actionable policy intelligence.", input: "Cluster analysis", process: null, output: "Executive summary · Budget recommendation · Red Zone map", hitl: false },
    ],
    agents_disclaimer: "AI RECOMMENDS. HUMANS REMAIN ACCOUNTABLE.",

    geo_label: "Geospatial Intelligence",
    geo_h2_1: "From individual complaints",
    geo_h2_2: "to geographic patterns.",
    geo_redzone: "RED ZONE",
    geo_redzone_def: "A geographic area where citizen complaints are highly concentrated, indicating a critical infrastructure gap.",
    geo_data_rows: [
      ["LOCATION", "Sector 4 East"],
      ["DOMAIN", "Water"],
      ["SIGNALS", "2,431"],
      ["DEMAND", "High"],
      ["RESPONSE", "Low"],
    ],
    geo_rec_label: "Recommended action",
    geo_rec_action: "Prioritize water network inspection and service restoration.",
    geo_rec_amount: "₹12 Cr",
    geo_pending: "AI RECOMMENDATION — PENDING APPROVAL",

    impact_label: "System Impact",
    impact_h2_1: "When demand becomes visible,",
    impact_h2_2: "decisions can become precise.",
    impact_demo_badge: "SYSTEM METRICS",
    impact_metrics: [
      { value: "4,200", label: "Signals Verified", sub: "CPGRAMS grievances" },
      { value: "14", label: "High-Priority Zones", sub: "Red zone clusters" },
      { value: "7 days", label: "Analysis Window", sub: "Rolling period" },
      { value: "22", label: "Indian Languages", sub: "Via Bhashini" },
      { value: "6", label: "AI Workflow Stages", sub: "Agent pipeline" },
    ],

    footer_h2_1: "Infrastructure should respond",
    footer_h2_2: "to where people need it.",
    footer_tagline: "Citizen signals → AI intelligence → spatial context → policy action",
    footer_explore: "Explore Intelligence",
    footer_view_dash: "View Dashboard",
    footer_built: "Built for Code for Communities 2 · Google for India",
    footer_proto: "SPIN is a prototype. Demo data only.",

    dash_title: "POLICYMAKER / LIVE INTELLIGENCE",
    dash_summary_title: "INTELLIGENCE SUMMARY",
    dash_signals: "Total Signals",
    dash_top_domain: "Top Domain",
    dash_avg_severity: "Avg Severity",
    dash_red_zones: "Red Zones",
    dash_budget_title: "BUDGET REALLOCATION RECOMMENDATIONS",
    citizen_chat_title: "Citizen Grievance Portal",
    citizen_placeholder: "Describe your grievance in any language...",
  },

  BR: {
    overview: "Visão Geral",
    how_it_works: "Como Funciona",
    intelligence: "Inteligência",
    architecture: "Arquitetura",
    impact: "Impacto",
    enter_dashboard: "Painel →",
    citizen_label: "Cidadão",
    select_region: "Selecionar Região",
    adapts_spin_language: "Adapta o SPIN ao idioma local",
    proposed_architecture_demo: "ARQUITETURA PROPOSTA · DEMO DE UI",

    hero_eyebrow: "Infraestrutura Pública Digital / Governança por IA",
    hero_headline_1: "Transformando vozes cidadãs",
    hero_headline_2: "em inteligência de infraestrutura.",
    hero_body: "O SPIN conecta reclamações de cidadãos com IA, inteligência geoespacial e dados de infraestrutura pública para ajudar governos a identificar onde são necessários investimentos prioritários.",
    pipeline_citizen: "SINAIS DOS CIDADÃOS",
    pipeline_ai: "COMPREENSÃO DA IA",
    pipeline_geo: "CONTEXTO GEOESPACIAL",
    pipeline_policy: "AÇÃO DE POLÍTICA",
    scroll_to_explore: "Role para explorar",

    problem_label: "O Problema",
    problem_h2_1: "O problema não é",
    problem_h2_2: "a falta de dados. São dados desconectados.",
    problem_citizen_title: "Sinais dos Cidadãos",
    problem_gov_title: "Sistemas Governamentais",
    problem_citizen_items: ["Voz", "Texto", "Imagens", "Idiomas locais", "Localização GPS"],
    problem_gov_items: ["Registros CPGRAMS", "Dados de infraestrutura", "Planejamento Gati Shakti", "Demografia", "Mapeamento urbano"],
    problem_outcomes: ["SINAIS FRAGMENTADOS", "SISTEMAS ISOLADOS", "DECISÕES REATIVAS"],
    problem_result: "Investimento em infraestrutura desalinhado.",

    trans_label: "Veja a Transformação",
    trans_h2_1: "E se cada reclamação",
    trans_h2_2: "se tornasse um sinal de planejamento?",
    trans_stage_1_label: "SINAL BRUTO",
    trans_quote: '"Não temos água em nosso bairro há 3 semanas."',
    trans_stage_1_tags: ["PORTUGUÊS", "NÃO ESTRUTURADO", "ÁUDIO"],
    trans_stage_2_label: "INTERPRETAÇÃO DA IA",
    trans_table_rows: [
      ["DOMÍNIO", "ÁGUA"],
      ["SEVERIDADE", "ALTA"],
      ["LOCALIZAÇÃO", "Sector 4 Leste"],
      ["PROBLEMA", "Interrupção de abastecimento — 3 semanas"],
      ["IDIOMA", "Português → Inglês"],
    ],
    trans_stage_3_label: "INTELIGÊNCIA ESPACIAL",
    trans_complaints: "Reclamações",
    trans_cluster: "Aglomerado",
    trans_red_zone: "ZONA VERMELHA",
    trans_identified: "Identificada",
    trans_spatial_tag: "Sector 4 Leste / ÁGUA / ALTA DENSIDADE",
    trans_stage_4_label: "AÇÃO DE POLÍTICA",
    trans_recommended: "Ação Recomendada",
    trans_action: "Aumentar alocação de infraestrutura hídrica — Sector 4 Leste",
    trans_pending: "AGUARDANDO DECISÃO DO GESTOR",
    trans_disclaimer: "A IA RECOMENDA. OS HUMANOS CONTINUAM RESPONSÁVEIS.",
    trans_replay: "[ REPETIR ]",

    process_label: "O Sistema",
    process_h2_1: "Seis etapas.",
    process_h2_2: "Um pipeline coerente.",
    process_checkpoint: "PONTO DE CHECAGEM HUMANO",
    process_stages: [
      { num: "01", title: "Entrada do Cidadão", desc: "Texto, voz ou imagens em qualquer idioma via WhatsApp, Telegram ou web.", hitl: false },
      { num: "02", title: "Processamento de Linguagem", desc: "Motor de IA detecta o idioma, transcreve a fala e traduz para análise.", hitl: false },
      { num: "03", title: "Verificação de Localização", desc: "Validação humana confirma a localização geográfica antes do processamento.", hitl: true },
      { num: "04", title: "Compreensão Semântica", desc: "Agente IA extrai o domínio, classifica a intenção e calcula a severidade.", hitl: false },
      { num: "05", title: "Correlação Geoespacial", desc: "Reclamação é cruzada com camadas de infraestrutura e dados demográficos.", hitl: false },
      { num: "06", title: "Ação de Política", desc: "Identificação de Zonas Vermelhas e recomendações orçamentárias para gestores.", hitl: false },
    ],

    eco_label: "Ecosistema de Dados",
    eco_h2_1: "Um sinal é útil.",
    eco_h2_2: "Um sinal conectado é poderoso.",
    eco_layers: [
      { label: "SINAIS DOS CIDADÃOS", items: ["Voz", "Texto", "Imagens", "Localização"] },
      { label: "LINGUAGEM E IA", items: ["Detecção de idioma", "Reconhecimento de voz", "Tradução", "Análise semântica"] },
      { label: "DADOS GOVERNAMENTAIS", items: ["Sistemas públicos", "Infraestrutura urbana", "Demografia", "Geoprocessamento"] },
      { label: "INTELIGÊNCIA DE POLÍTICA", items: ["Zonas Vermelhas", "Lacunas de infraestrutura", "Prioridades", "Recomendações"] },
    ],
    eco_bhashini_h3: "O idioma nunca deve ser uma barreira para a governança.",
    eco_bhashini_body: "O SPIN aceita entrada de cidadãos em qualquer idioma local. A IA multilingue realiza detecção e tradução automáticas antes da análise.",
    eco_bhashini_flow: ["Voz local", "Motor Multilingue", "Reclamação traduzida", "Análise IA", "Direcionamento público"],

    agents_label: "O Pipeline de IA",
    agents_h2_1: "Cinco etapas.",
    agents_h2_2: "Um pipeline de inteligência.",
    agents_list: [
      { num: "01", name: "Agente Raiz", role: "Orquestra o fluxo completo do pipeline.", input: null, process: null, output: null, hitl: false },
      { num: "02", name: "Agente de Entrada", role: "Recebe e normaliza o sinal do cidadão.", input: "Mensagem em qualquer formato/idioma", process: null, output: "Payload normalizado", hitl: false },
      { num: "03", name: "Filtro de Localização HUMANO", role: "Validação humana garante dados geográficos precisos.", input: "Payload de entrada", process: "Confirmação humana de local", output: "Reclamação com local confirmado", hitl: true },
      { num: "04", name: "Agente de Análise Semântica", role: "Compreende a reclamação em profundidade.", input: '"A estrada em frente à escola está danificada."', process: "Extração de entidade · Intenção · Severidade", output: "VIAS PÚBLICAS / ALTA", hitl: false },
      { num: "05", name: "Agente de Correlação Geoespacial", role: "Conecta a reclamação com dados de mapas e infraestrutura.", input: "Reclamação estruturada + local", process: "Cruzamento com dados espaciais e demografia", output: "Coordenadas, Zona Vermelha, contexto urbano", hitl: false },
      { num: "06", name: "Agente de Painel de Políticas", role: "Converte análise em inteligência acionável.", input: "Análise de aglomerado", process: null, output: "Resumo executivo · Recomendação orçamentária · Mapa", hitl: false },
    ],
    agents_disclaimer: "A IA RECOMENDA. OS HUMANOS CONTINUAM RESPONSÁVEIS.",

    geo_label: "Inteligência Geoespacial",
    geo_h2_1: "De reclamações individuais",
    geo_h2_2: "a padrões geográficos.",
    geo_redzone: "ZONA VERMELHA",
    geo_redzone_def: "Área geográfica com alta concentração de reclamações, indicando uma falha crítica de infraestrutura.",
    geo_data_rows: [
      ["LOCALIZAÇÃO", "Sector 4 Leste"],
      ["DOMÍNIO", "Água"],
      ["SINAIS", "2.431"],
      ["DEMANDA", "Alta"],
      ["RESPOSTA", "Baixa"],
    ],
    geo_rec_label: "Ação Recomendada",
    geo_rec_action: "Priorizar inspeção da rede de água e restauração do serviço.",
    geo_rec_amount: "R$ 8 Mi",
    geo_pending: "RECOMENDAÇÃO DA IA — AGUARDANDO APROVAÇÃO",

    impact_label: "Impacto do Sistema",
    impact_h2_1: "Quando a demanda se torna visível,",
    impact_h2_2: "as decisões tornam-se precisas.",
    impact_demo_badge: "MÉTRICAS DO SISTEMA",
    impact_metrics: [
      { value: "4.200", label: "Sinais Verificados", sub: "Dados CPGRAMS" },
      { value: "14", label: "Zonas Prioritárias", sub: "Clusters de zona crítica" },
      { value: "7 dias", label: "Janela de Análise", sub: "Período móvel" },
      { value: "22", label: "Idiomas Suportados", sub: "Motor multilingue" },
      { value: "6", label: "Etapas de Trabalho IA", sub: "Pipeline de agentes" },
    ],

    footer_h2_1: "A infraestrutura deve responder",
    footer_h2_2: "onde as pessoas mais precisam.",
    footer_tagline: "Sinais cidadãos → Inteligência IA → Contexto espacial → Ação pública",
    footer_explore: "Explorar Inteligência",
    footer_view_dash: "Ver Painel",
    footer_built: "Desenvolvido para Code for Communities 2 · Google",
    footer_proto: "O SPIN é um protótipo. Apenas dados demonstrativos.",

    dash_title: "GESTOR PÚBLICO / INTELIGÊNCIA EM TEMPO REAL",
    dash_summary_title: "RESUMO DE INTELIGÊNCIA",
    dash_signals: "Total de Sinais",
    dash_top_domain: "Principal Domínio",
    dash_avg_severity: "Média de Severidade",
    dash_red_zones: "Zonas Vermelhas",
    dash_budget_title: "RECOMENDAÇÕES DE REALOCAÇÃO ORÇAMENTÁRIA",
    citizen_chat_title: "Portal do Cidadão",
    citizen_placeholder: "Descreva sua queixa em qualquer idioma...",
  },

  RU: {
    overview: "Обзор",
    how_it_works: "Как Это Работает",
    intelligence: "Аналитика",
    architecture: "Архитектура",
    impact: "Влияние",
    enter_dashboard: "Панель →",
    citizen_label: "Гражданин",
    select_region: "Выбрать регион",
    adapts_spin_language: "Адаптирует SPIN к местному языку",
    proposed_architecture_demo: "ПРЕДЛАГАЕМАЯ АРХИТЕКТУРА · ДЕМО ИНТЕРФЕЙСА",

    hero_eyebrow: "Цифровая публичная инфраструктура / ИИ-управление",
    hero_headline_1: "Превращаем голоса граждан",
    hero_headline_2: "в инфраструктурный интеллект.",
    hero_body: "SPIN связывает обращения граждан с ИИ, геопространственными данными и инфраструктурой, помогая государству направлять инвестиции туда, где они наиболее необходимы.",
    pipeline_citizen: "СИГНАЛЫ ГРАЖДАН",
    pipeline_ai: "ПОНИМАНИЕ ИИ",
    pipeline_geo: "ГЕОПРОСТРАНСТВО",
    pipeline_policy: "ПОЛИТИЧЕСКОЕ ДЕЙСТВИЕ",
    scroll_to_explore: "Прокрутите для изучения",

    problem_label: "Проблема",
    problem_h2_1: "Проблема заключается не",
    problem_h2_2: "в нехватке данных. Проблема — разрозненность.",
    problem_citizen_title: "Сигналы Граждан",
    problem_gov_title: "Государственные Системы",
    problem_citizen_items: ["Голос", "Текст", "Фото", "Местные языки", "GPS-локация"],
    problem_gov_items: ["Госуслуги / Обращения", "Инфраструктура", "Геоинформационные данные", "Демография", "Планы развития"],
    problem_outcomes: ["ФРАГМЕНТИРОВАННЫЕ СИГНАЛЫ", "ИЗОЛИРОВАННЫЕ СИСТЕМЫ", "РЕАКТИВНЫЕ РЕШЕНИЯ"],
    problem_result: "Неэффективное распределение инфраструктурного бюджета.",

    trans_label: "Трансформация Данных",
    trans_h2_1: "Что если каждая жалоба",
    trans_h2_2: "станет сигналом для планирования?",
    trans_stage_1_label: "ИСХОДНЫЙ СИГНАЛ",
    trans_quote: '"В нашем районе уже 3 недели нет воды."',
    trans_stage_1_tags: ["РУССКИЙ", "НЕСТРУКТУРИРОВАННО", "ГОЛОСОВОЙ ВВОД"],
    trans_stage_2_label: "АНАЛИЗ ИИ",
    trans_table_rows: [
      ["СФЕРА", "ВОДОСНАБЖЕНИЕ"],
      ["КРИТИЧНОСТЬ", "ВЫСОКАЯ"],
      ["ЛОКАЦИЯ", "Пуна Восток"],
      ["ПРОБЛЕМА", "Сбой водоснабжения — 3 недели"],
      ["ЯЗЫК", "Русский → Английский"],
    ],
    trans_stage_3_label: "ГЕОАНАЛИТИКА",
    trans_complaints: "Жалобы",
    trans_cluster: "Кластер",
    trans_red_zone: "КРАСНАЯ ЗОНА",
    trans_identified: "Выявлена",
    trans_spatial_tag: "ПУНА ВОСТОК / ВОДОСНАБЖЕНИЕ / ВЫСОКАЯ ПЛОТНОСТЬ",
    trans_stage_4_label: "УПРАВЛЕНЧЕСКОЕ РЕШЕНИЕ",
    trans_recommended: "Рекомендуемое действие",
    trans_action: "Увеличить финансирование водной инфраструктуры — Пуна Восток",
    trans_pending: "ОЖИДАЕТ УТВЕРЖДЕНИЯ РУКОВОДИТЕЛЕМ",
    trans_disclaimer: "ИИ РЕКОМЕНДУЕТ. ЧЕЛОВЕК НЕСЕТ ОТВЕТСТВЕННОСТЬ.",
    trans_replay: "[ ПОВТОРИТЬ ]",

    process_label: "Система",
    process_h2_1: "Шесть этапов.",
    process_h2_2: "Единый сквозной процесс.",
    process_checkpoint: "ПРОВЕРКА ЧЕЛОВЕКОМ",
    process_stages: [
      { num: "01", title: "Ввод от гражданина", desc: "Текст, голос или фото на любом языке через мессенджеры или веб.", hitl: false },
      { num: "02", title: "Обработка языка", desc: "Мультиязычный ИИ определяет язык, распознает речь и переводит текст.", hitl: false },
      { num: "03", title: "Верификация локации", desc: "Этап с участием человека подтверждает геопривязку до запуска обработки.", hitl: true },
      { num: "04", title: "Семантический анализ", desc: "Агент Gemini определяет категорию, суть проблемы и уровень критичности.", hitl: false },
      { num: "05", title: "Геопространственная корреляция", desc: "Жалоба сопоставляется с объектами инфраструктуры и демографией.", hitl: false },
      { num: "06", title: "Управленческое решение", desc: "Формирование Красных зон и рекомендаций по бюджету для лиц, принимающих решения.", hitl: false },
    ],

    eco_label: "Экосистема Данных",
    eco_h2_1: "Один сигнал полезен.",
    eco_h2_2: "Связанные сигналы дают силу.",
    eco_layers: [
      { label: "СИГНАЛЫ ГРАЖДАН", items: ["Голос", "Текст", "Фото", "Локация"] },
      { label: "ЯЗЫК И ИИ", items: ["Определение языка", "Распознавание речи", "Перевод", "Семантика"] },
      { label: "ГОСУДАРСТВЕННЫЕ ДАННЫЕ", items: ["Реестры обращений", "Инфраструктура", "Демография", "Картография"] },
      { label: "УПРАВЛЕНЧЕСКАЯ АНАЛИТИКА", items: ["Красные зоны", "Дефицит инфраструктуры", "Приоритеты", "Рекомендации"] },
    ],
    eco_bhashini_h3: "Язык не должен быть barrier для госуправления.",
    eco_bhashini_body: "SPIN принимает обращения на любых языках. ИИ обеспечивает автоматическое распознавание речи и перевод до проведения анализа.",
    eco_bhashini_flow: ["Голосовой сигнал", "Мультиязычный ИИ", "Переведенный запрос", "Анализ ИИ", "Управленческий вывод"],

    agents_label: "Конвейер ИИ",
    agents_h2_1: "Пять этапов.",
    agents_h2_2: "Единый конвейер аналитики.",
    agents_list: [
      { num: "01", name: "Корневой агент", role: "Управляет общим исполнением пайплайна.", input: null, process: null, output: null, hitl: false },
      { num: "02", name: "Агент приема обращений", role: "Принимает и нормализует входные данные.", input: "Сообщение в любом формате/языке", process: null, output: "Нормализованный пакет данных", hitl: false },
      { num: "03", name: "Контроль локации (HITL)", role: "Человек проверяет полноту геоданных перед продолжением.", input: "Пакет обращения", process: "Подтверждение геоконтекста", output: "Обращение с проверенной локацией", hitl: true },
      { num: "04", name: "Агент семантического разбора", role: "Глубоко анализирует суть обращения.", input: '"Дорога около нашей школы разрушена уже несколько месяцев."', process: "Извлечение сущностей · Оценка критичности", output: "ДОРОГИ / БЛАГОУСТРОЙСТВО / ВЫСОКАЯ", hitl: false },
      { num: "05", name: "Агент геокорреляции", role: "Связывает обращение с картой и объектами инфраструктуры.", input: "Структурированная жалоба + геопривязка", process: "Сопоставление с картой и демографией", output: "Координаты кластера, Красная зона, контекст", hitl: false },
      { num: "06", name: "Агент панели управления", role: "Преобразует аналитику в конкретные рекомендации.", input: "Анализ кластера", process: null, output: "Отчет · Рекомендация по бюджету · Карта", hitl: false },
    ],
    agents_disclaimer: "ИИ РЕКОМЕНДУЕТ. ЧЕЛОВЕК НЕСЕТ ОТВЕТСТВЕННОСТЬ.",

    geo_label: "Геопространственный Интеллект",
    geo_h2_1: "От точечных жалоб",
    geo_h2_2: "к географическим закономерностям.",
    geo_redzone: "КРАСНАЯ ЗОНА",
    geo_redzone_def: "Географическая зона с высокой концентрацией жалоб, указывающая на критический дефицит инфраструктуры.",
    geo_data_rows: [
      ["ЛОКАЦИЯ", "Пуна Восток"],
      ["СФЕРА", "Водоснабжение"],
      ["СИГНАЛЫ", "2 431"],
      ["ПОТРЕБНОСТЬ", "Высокая"],
      ["РЕАКЦИЯ", "Низкая"],
    ],
    geo_rec_label: "Рекомендуемое действие",
    geo_rec_action: "Приоритетный инспекционный выезд и ремонт водопроводной сети.",
    geo_rec_amount: "120 млн ₽",
    geo_pending: "РЕКОМЕНДАЦИЯ ИИ — НА УТВЕРЖДЕНИИ",

    impact_label: "Результат Системы",
    impact_h2_1: "Когда потребности становятся видимыми,",
    impact_h2_2: "решения становятся точными.",
    impact_demo_badge: "СИСТЕМНЫЕ МЕТРИКИ",
    impact_metrics: [
      { value: "4 200", label: "Проверенных Сигналов", sub: "Данные CPGRAMS" },
      { value: "14", label: "Приоритетных Зон", sub: "Кластеры красных зон" },
      { value: "7 дней", label: "Период Анализа", sub: "Текущее окно" },
      { value: "22", label: "Поддерживаемых Языка", sub: "Мультиязычный модуль" },
      { value: "6", label: "Этапов Анализа ИИ", sub: "Конвейер агентов" },
    ],

    footer_h2_1: "Инфраструктура должна развиваться",
    footer_h2_2: "там, где это нужно людям.",
    footer_tagline: "Сигналы граждан → Интеллект ИИ → Геоконтекст → Управленческое решение",
    footer_explore: "Изучить аналитику",
    footer_view_dash: "Открыть панель",
    footer_built: "Создано для Code for Communities 2 · Google",
    footer_proto: "SPIN — прототип. Только демонстрационные данные.",

    dash_title: "РУКОВОДИТЕЛЬ / ОПЕРАТИВНАЯ АНАЛИТИКА",
    dash_summary_title: "СВОДКА АНАЛИТИКИ",
    dash_signals: "Всего Сигналов",
    dash_top_domain: "Главная Сфера",
    dash_avg_severity: "Средняя Критичность",
    dash_red_zones: "Красные Зоны",
    dash_budget_title: "РЕКОМЕНДАЦИИ ПО ПЕРЕРАСПРЕДЕЛЕНИЮ БЮДЖЕТА",
    citizen_chat_title: "Портал Гражданина",
    citizen_placeholder: "Опишите вашу проблему на любом языке...",
  },

  CN: {
    overview: "概览",
    how_it_works: "运作方式",
    intelligence: "智能",
    architecture: "架构",
    impact: "影响",
    enter_dashboard: "控制台 →",
    citizen_label: "公民",
    select_region: "选择区域",
    adapts_spin_language: "将 SPIN 适配为本地语言",
    proposed_architecture_demo: "拟议架构 · 仅供界面演示",

    hero_eyebrow: "数字公共基础设施 / 人工智能治理",
    hero_headline_1: "将公民声音转化为",
    hero_headline_2: "基础设施智慧。",
    hero_body: "SPIN 将公民诉求与人工智能、地理空间智能及公共基础设施数据相连接，帮助政府了解社区最需要投资的领域。",
    pipeline_citizen: "公民信号",
    pipeline_ai: "AI 理解",
    pipeline_geo: "地理空间背景",
    pipeline_policy: "政策行动",
    scroll_to_explore: "滚动探索",

    problem_label: "核心问题",
    problem_h2_1: "问题不在于",
    problem_h2_2: "缺乏数据，而是数据相互孤立。",
    problem_citizen_title: "公民信号",
    problem_gov_title: "政府系统",
    problem_citizen_items: ["语音", "文本", "图片", "本地方言", "GPS 定位"],
    problem_gov_items: ["投诉信访记录", "基础设施台账", "空间规划数据", "人口统计", "建设规划"],
    problem_outcomes: ["信号碎片化", "系统孤岛化", "被动响应决策"],
    problem_result: "基础设施投资方向错位。",

    trans_label: "查看转化过程",
    trans_h2_1: "如果每一次投诉",
    trans_h2_2: "都能转化为规划信号？",
    trans_stage_1_label: "原始信号",
    trans_quote: "“我们这个片区已经连续3周没有自来水了。”",
    trans_stage_1_tags: ["中文 / 方言", "非结构化", "语音输入"],
    trans_stage_2_label: "AI 智能解析",
    trans_table_rows: [
      ["领域", "供水"],
      ["严重程度", "高"],
      ["位置", "浦那东区"],
      ["问题类型", "供水中断 — 持续3周"],
      ["语言", "中文 → 英文解析"],
    ],
    trans_stage_3_label: "空间智能分析",
    trans_complaints: "投诉量",
    trans_cluster: "聚合簇",
    trans_red_zone: "红区预警",
    trans_identified: "已识别",
    trans_spatial_tag: "浦那东区 / 供水 / 高密度预警",
    trans_stage_4_label: "政策决策行动",
    trans_recommended: "建议采取行动",
    trans_action: "追加浦那东区供水基础设施专项预算",
    trans_pending: "等待决策者最终审批",
    trans_disclaimer: "AI 提供决策建议，人类保持最终问责权。",
    trans_replay: "[ 重新播放 ]",

    process_label: "系统架构",
    process_h2_1: "六大阶段。",
    process_h2_2: "一套无缝协同管道。",
    process_checkpoint: "人工确认关卡",
    process_stages: [
      { num: "01", title: "公民信号输入", desc: "支持通过 WhatsApp、微信或网页提交语音、文本或图片。", hitl: false },
      { num: "02", title: "多语言处理", desc: "多语言 AI 引擎自动检测方言、转写语音并翻译，供 AI 深度解析。", hitl: false },
      { num: "03", title: "地理位置校验", desc: "人工介入校验（HITL）确认地理上下文，保障定位精准。", hitl: true },
      { num: "04", title: "语义理解与分类", desc: "Gemini 智能体提取归属领域、识别意图并计算严重等级。", hitl: false },
      { num: "05", title: "地理空间关联", desc: "将诉求关联至城市基础设施图层、人口统计与空间规划数据。", hitl: false },
      { num: "06", title: "政策行动生成", desc: "自动识别红区预警，生成高管简报与预算调整建议。", hitl: false },
    ],

    eco_label: "数据生态",
    eco_h2_1: "单一信号作用有限。",
    eco_h2_2: "互联的信号将释放巨大能量。",
    eco_layers: [
      { label: "公民信号", items: ["语音", "文本", "图片", "地理位置"] },
      { label: "语言与 AI", items: ["语言检测", "语音识别", "智能翻译", "语义解析"] },
      { label: "政府数据", items: ["信访平台", "空间规划图层", "人口数据", "基础设施台账"] },
      { label: "政策智能", items: ["红区识别", "设施短板", "优先事项", "决策建议"] },
    ],
    eco_bhashini_h3: "语言不应成为公共治理的障碍。",
    eco_bhashini_body: "SPIN 支持公民使用任何本地语言或方言进行诉求表达。多语言 AI 引擎在分析前提供自动识别与翻译，确保每一位声音都被听见。",
    eco_bhashini_flow: ["本地语音输入", "多语言 AI 引擎", "标准化文本", "AI 智能分析", "公共政策洞察"],

    agents_label: "AI 智能体流水线",
    agents_h2_1: "五大阶段。",
    agents_h2_2: "一个智能分析流水线。",
    agents_list: [
      { num: "01", name: "根节点协调智能体", role: "全局编排整个处理流水线的调度。", input: null, process: null, output: null, hitl: false },
      { num: "02", name: "公民接入智能体", role: "接收并标准化公民提交的各类诉求。", input: "公民消息 — 任何格式与语言", process: null, output: "标准化接入数据包", hitl: false },
      { num: "03", name: "位置人工校验关卡", role: "人工确认地理信息的完整性与准确性。", input: "接入数据包", process: "人工确认地理位置", output: "位置确认完成的诉求", hitl: true },
      { num: "04", name: "语义解析智能体", role: "深度理解诉求的具体内容与严重性。", input: "“我们学校门口的道路已经破损几个月了。”", process: "实体提取 · 意图分类 · 严重度评分", output: "道路工程 / 公共设施 / 高", hitl: false },
      { num: "05", name: "地理空间关联智能体", role: "将诉求与地图图层及基础设施数据融合。", input: "结构化诉求 + 确认位置", process: "与空间规划与人口图层建立空间关联", output: "聚合坐标、红区标识、设施上下文", hitl: false },
      { num: "06", name: "政策控制台智能体", role: "将分析结果转化为可执行的决策智能。", input: "空间聚合分析", process: null, output: "高管简报 · 预算调整建议 · 红区地图", hitl: false },
    ],
    agents_disclaimer: "AI 提供建议，人类保持最终问责。",

    geo_label: "地理空间智能",
    geo_h2_1: "从零散的个人投诉",
    geo_h2_2: "到清晰的地理格局。",
    geo_redzone: "红区预警",
    geo_redzone_def: "公民诉求异常高度集中的地理区域，标志着存在关键基础设施或公共服务短板。",
    geo_data_rows: [
      ["位置", "浦那东区"],
      ["领域", "供水"],
      ["信号数", "2,431"],
      ["需求度", "极高"],
      ["响应度", "偏低"],
    ],
    geo_rec_label: "建议采取行动",
    geo_rec_action: "优先安排供水管网排查与抢修服务。",
    geo_rec_amount: "¥1,200 万",
    geo_pending: "AI 决策建议 — 等待审核批准",

    impact_label: "系统成效",
    impact_h2_1: "当公众需求清晰可见，",
    impact_h2_2: "决策才能精准高效。",
    impact_demo_badge: "系统指标",
    impact_metrics: [
      { value: "4,200", label: "已核验信号数", sub: "CPGRAMS 数据" },
      { value: "14", label: "高优先红区", sub: "红区集群" },
      { value: "7 天", label: "分析时间窗口", sub: "动态滚动周期" },
      { value: "22", label: "支持语言数量", sub: "多语言引擎驱动" },
      { value: "6", label: "AI 流程阶段", sub: "智能体流水线" },
    ],

    footer_h2_1: "基础设施的建设",
    footer_h2_2: "应当回应民众最迫切的需求。",
    footer_tagline: "公民信号 → AI 智能 → 空间背景 → 政策行动",
    footer_explore: "探索决策智能",
    footer_view_dash: "打开管理控制台",
    footer_built: "专为 Code for Communities 2 · Google 打造",
    footer_proto: "SPIN 为演示原型系统，仅展示模拟数据。",

    dash_title: "决策者控制台 / 实时智能",
    dash_summary_title: "智能简报",
    dash_signals: "总信号量",
    dash_top_domain: "主要领域",
    dash_avg_severity: "平均严重度",
    dash_red_zones: "红区数量",
    dash_budget_title: "预算重分配建议",
    citizen_chat_title: "公民诉求服务门户",
    citizen_placeholder: "请使用任何语言描述您的诉求...",
  },

  ZA: {
    overview: "Uhlolojikelele",
    how_it_works: "Isebenza Kanjani",
    intelligence: "Ulwazi",
    architecture: "Isakhiwo",
    impact: "Umthelela",
    enter_dashboard: "Ibhodi →",
    citizen_label: "Umuntu",
    select_region: "Khetha Isifunda",
    adapts_spin_language: "I-SPIN iguqulela olimini lwakho",
    proposed_architecture_demo: "ISAKHIWO ESIPHAKANYISWE · IDEMO",

    hero_eyebrow: "Digital Public Infrastructure / AI Governance",
    hero_headline_1: "Ukuguqula izwi labantu",
    hero_headline_2: "libe ulwazi lwezingqalazizinda.",
    hero_body: "I-SPIN ixhumanisa izikhalazo zabantu ne-AI, ulwazi lwejografi kanye nedatha yezingqalazizinda zomphakathi ukusiza ohulumeni ukuthi baqonde ukuthi imiphakathi idinga ukutshalwa kwemali kakhulu kuphi.",
    pipeline_citizen: "IZIMPAWU ZABANTU",
    pipeline_ai: "UKUQONDA KWE-AI",
    pipeline_geo: "ISIZINDA SEJOGRAFI",
    pipeline_policy: "ISENZO SENQUBOMGOMO",
    scroll_to_explore: "Skrolela ukuhlola",

    problem_label: "Inkinga",
    problem_h2_1: "Inkinga akukho",
    problem_h2_2: "ukuswela idatha. Idatha ayixhunyanisiwe.",
    problem_citizen_title: "Izimpawu Zabantu",
    problem_gov_title: "Izinhlelo Zohulumeni",
    problem_citizen_items: ["Izwi", "Umbhalo", "Izithombe", "Izilimi zasendaweni", "I-GPS"],
    problem_gov_items: ["CPGRAMS", "Izinhlelo zengqalasizinda", "PM Gati Shakti", "Idemografi", "Ukuhlelwa kwedolobha"],
    problem_outcomes: ["IZIMPAWU EZIDELEKILEYO", "IZINHLELO EZAHLUKENE", "IZINQUMO EZIBUYELA UMUVA"],
    problem_result: "Ukutshalwa kwemali engqalasizindeni okungafanele.",

    trans_label: "Bona Inguquko",
    trans_h2_1: "Kupekube sonke isikhalazo",
    trans_h2_2: "siba uphawu lokuhlela?",
    trans_stage_1_label: "UPHAWU OLUNGAPHELELANGANGA",
    trans_quote: '"Emphakathini wakithi amanzi awaphumi amaviki amathathu."',
    trans_stage_1_tags: ["ISIZULU", "ENGAKHULUNYIWENI", "IZWI"],
    trans_stage_2_label: "UKUHUMUSHA KWE-AI",
    trans_table_rows: [
      ["INGXENYE", "AMANZI"],
      ["UBUNZIMA", "PHEZULU"],
      ["INDAWO", "Sector 4 East"],
      ["INKINGA", "Ukunqamuka kwamanzi — amaviki a-3"],
      ["ULIMI", "isiZulu → English"],
    ],
    trans_stage_3_label: "ULWAZI LWEJOGRAFI",
    trans_complaints: "Izikhalazo",
    trans_cluster: "Iqoqo",
    trans_red_zone: "INDAWO EBOMVU",
    trans_identified: "Ibonakele",
    trans_spatial_tag: "Sector 4 East / AMANZI / ABANTU ABANINGI",
    trans_stage_4_label: "ISENZO SENQUBOMGOMO",
    trans_recommended: "Isenzo Esiphakanyisiwe",
    trans_action: "Khuphula imali yamanzi — Sector 4 East",
    trans_pending: "KULINDELWE ISINQUMO SAMAHHOVISI",
    trans_disclaimer: "I-AI IYAPHAKAMISA. ABANTU BAHLALA BENOMTHWALO.",
    trans_replay: "[ PHINDA ]",

    process_label: "Uhlelo",
    process_h2_1: "Izinyathelo eziyisithupha.",
    process_h2_2: "Inqubo eyodwa ehlelekile.",
    process_checkpoint: "ISIKHATHI SOKUHLOLA OMUNTU",
    process_stages: [
      { num: "01", title: "Ukufaka Komuntu", desc: "Umbhalo, izwi noma izithombe kunoma iluphi ulimi ngewebhu noma nge-WhatsApp.", hitl: false },
      { num: "02", title: "Ukuhunyushwa Kolimi", desc: "I-AI ibona ulimi, ibhale inkulumo bese ihumushela esiNgisini ukuze ihlaziywe.", hitl: false },
      { num: "03", title: "Ukuqinisekisa Indawo", desc: "Umuntu uqinisekisa indawo yejografi ngaphambi kokuba inqubo iqhubeke.", hitl: true },
      { num: "04", title: "Ukuqonda Okujulile", desc: "I-Gemini ikhipha ingxenye, ihlaziye inhloso bese ibeka ubunzima.", hitl: false },
      { num: "05", title: "Ukuhlanganiswa Kejografi", desc: "Isikhalazo siyanamatheliswa kungqalasizinda nakudatha yedemografi.", hitl: false },
      { num: "06", title: "Isenzo Senqubomgomo", desc: "Indawo ebomvu iyabonakala bese kuphakanyiswa isabelomali kubaholi.", hitl: false },
    ],

    eco_label: "Isimo Sedatha",
    eco_h2_1: "Uphawu olulodwa luyasiza.",
    eco_h2_2: "Izimpawu ezixhumene unamandla.",
    eco_layers: [
      { label: "IZIMPAWU ZABANTU", items: ["Izwi", "Umbhalo", "Izithombe", "Indawo"] },
      { label: "ULIMI NE-AI", items: ["Ukubona ulimi", "Ukurekhoda inkulumo", "Ukuhumusha", "Ukuhlaziya"] },
      { label: "IDATHA YOHULUMENI", items: ["Izinhlelo zikahulumeni", "Ingqalasizinda", "Idemografi", "Amamaphu"] },
      { label: "ULWAZI LWE-POLISI", items: ["Izindawo ezibomvu", "Izikhala sengqalasizinda", "Izinto ezibalulekile", "Amaphakanyiso"] },
    ],
    eco_bhashini_h3: "Ulimi akufanele lube isithiyo ekubuseni.",
    eco_bhashini_body: "I-SPIN yamukela izikhalazo zabantu kunoma iluphi ulimi lwasendaweni. I-AI ibona ulimi ihumushe ngokushesha ngaphambi kokuhlaziya.",
    eco_bhashini_flow: ["Izwi lasendaweni", "I-Injini YoLimi", "Isikhalazo esihunyushiwe", "Ukuhlaziya kwe-AI", "Ulwazi likahulumeni"],

    agents_label: "Inqubo Ye-AI",
    agents_h2_1: "Izinyathelo eziyisihlanu.",
    agents_h2_2: "Inqubo eyodwa yokuhlaziya.",
    agents_list: [
      { num: "01", name: "I-Agent Enkulu", role: "Ihlanganisa zonke izinyathelo zenqubo.", input: null, process: null, output: null, hitl: false },
      { num: "02", name: "I-Agent Yamukela", role: "Yamukela imilayezo yabantu iyilungise.", input: "Umlayezo womuntu — noma iyiphi indlela", process: null, output: "Idatha elungisiwe", hitl: false },
      { num: "03", name: "Indawo Yokuhlola Omuntu", role: "Umuntu uqinisekisa indawo ngaphambi kokuba kuqhubekwe.", input: "Idatha eyemukeliwe", process: "Ukuhlola indawo komuntu", output: "Isikhalazo esinedatha yendawo", hitl: true },
      { num: "04", name: "I-Agent Ekhipha Incazelo", role: "Iliqonda ngokujulile isikhalazo.", input: '"Umgwaqo phambi kwesikole wonakele izinyanga."', process: "Ukukhipha incazelo · Ukubeka ubunzima", output: "UMGWAQO / IMISEBENZI / PHEZULU", hitl: false },
      { num: "05", name: "I-Agent Yejografi", role: "Ixhumanisa isikhalazo namamaphu nengqalasizinda.", input: "Isikhalazo esihleliwe + indawo", process: "Ukuhlanganisa nedatha yejografi", output: "Izikhundla zeqoqo, Indawo ebomvu", hitl: false },
      { num: "06", name: "I-Agent Yebhodi Yehhovisi", role: "Iguqula ukuhlaziya kuhlakanipho olusebenzayo.", input: "Ukuhlaziya meqoqo", process: null, output: "Isifinyezo · Isiphakamiso senqubo · Imaphu", hitl: false },
    ],
    agents_disclaimer: "I-AI IYAPHAKAMISA. ABANTU BAHLALA BENOMTHWALO.",

    geo_label: "Ulwazi Lwejografi",
    geo_h2_1: "Kusukela ezikhalazweni zomuntu",
    geo_h2_2: "kuye ekuboneni amaphetheni ejografi.",
    geo_redzone: "INDAWO EBOMVU",
    geo_redzone_def: "Indawo yejografi lapho izikhalazo zabantu zibuthana kakhulu, ebonisa ukuswela kwengqalasizinda.",
    geo_data_rows: [
      ["INDAWO", "Sector 4 East"],
      ["INGXENYE", "Amanzi"],
      ["IZIMPAWU", "2,431"],
      ["IDINGO", "Phezulu"],
      ["IMPENDULO", "Phansi"],
    ],
    geo_rec_label: "Isenzo Esiphakanyisiwe",
    geo_rec_action: "Hlola inethiwekhi yamanzi bese ulungisa inkinga ngokusheshe.",
    geo_rec_amount: "R 25 Mi",
    geo_pending: "ISIPHAKAMISO SE-AI — KULINDELWE UKUQINISEKISWA",

    impact_label: "Umthelela Wehlelo",
    impact_h2_1: "Uma idingo ibonakala,",
    impact_h2_2: "izinqumo ziba nembobo nse.",
    impact_demo_badge: "IZINKOMBA ZEHLELO",
    impact_metrics: [
      { value: "4,200", label: "Izimpawu Ezaziwayo", sub: "Idatha ye-CPGRAMS" },
      { value: "14", label: "Izindawo Ezibomvu", sub: "Amaqembu ezindawo ezibomvu" },
      { value: "7 izinsuku", label: "Ukuhlaziya Kwesikhathi", sub: "Isikhathi esihambayo" },
      { value: "22", label: "Izilimi Ezisebenzayo", sub: "Nge-injini yolimi" },
      { value: "6", label: "Izinyathelo Ye-AI", sub: "Inqubo ye-agent" },
    ],

    footer_h2_1: "Ingqalasizinda kufanele isabele",
    footer_h2_2: "lapho abantu bayidinga kakhulu.",
    footer_tagline: "Izimpawu zabantu → Ulwazi lwe-AI → Isizinda sejografi → Isenzo senqubo",
    footer_explore: "Hlola Ulwazi",
    footer_view_dash: "Bona Ibhodi",
    footer_built: "Kwakhelwe Code for Communities 2 · Google",
    footer_proto: "I-SPIN iyisifanekiso. Idatha yokubonisa kuphela.",

    dash_title: "AMAHHOVISI / ULWAZI OLUPHILAYO",
    dash_summary_title: "ISIFINYEZO SOKUHLAZIYA",
    dash_signals: "Zonke Izimpawu",
    dash_top_domain: "Ingxenye Enkulu",
    dash_avg_severity: "Ubunzima Obuphakathi",
    dash_red_zones: "Izindawo Ezibomvu",
    dash_budget_title: "ISIPHAKAMISO SOKWABIWA KWEMALI",
    citizen_chat_title: "Iphothali Zabantu",
    citizen_placeholder: "Chaza isikhalazo sakho noma ngaluphi ulimi...",
  },
};

// ── Context Provider ────────────────────────────────────────────────────────
interface LanguageContextValue {
  country: CountryConfig;
  t: Translations;
  setCountry: (code: CountryCode) => void;
}

const COUNTRY_TO_LANG: Record<CountryCode, string> = {
  IN: "en",
  BR: "pt",
  RU: "ru",
  CN: "zh-CN",
  ZA: "zu",
};

const LanguageContext = createContext<LanguageContextValue>({
  country: COUNTRIES[0],
  t: TRANSLATIONS["IN"],
  setCountry: () => {},
});

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [code, setCode] = useState<CountryCode>(() => {
    const saved = localStorage.getItem("spin_selected_country");
    return (saved as CountryCode) || "IN";
  });

  const country = COUNTRIES.find((c) => c.code === code) || COUNTRIES[0];
  // Always use English for React state so Google Translate can cleanly translate the DOM
  const t = TRANSLATIONS["IN"];

  const setCountryHandler = (newCode: CountryCode) => {
    setCode(newCode);
    localStorage.setItem("spin_selected_country", newCode);
    
    const lang = COUNTRY_TO_LANG[newCode] || "en";

    // Set Google Translate cookies
    if (lang === "en") {
      document.cookie = "googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
      document.cookie = "googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; domain=" + window.location.hostname + "; path=/;";
    } else {
      document.cookie = `googtrans=/en/${lang}; path=/;`;
      document.cookie = `googtrans=/en/${lang}; domain=${window.location.hostname}; path=/;`;
    }

    // Trigger select element if present
    setTimeout(() => {
      const select = document.querySelector(".goog-te-combo") as HTMLSelectElement | null;
      if (select) {
        select.value = lang;
        select.dispatchEvent(new Event("change"));
      } else {
        window.location.reload();
      }
    }, 150);
  };

  return (
    <LanguageContext.Provider value={{ country, t, setCountry: setCountryHandler }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}

