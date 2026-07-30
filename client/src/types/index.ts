export type RiskLevel = 'hijau_tua' | 'hijau_muda' | 'kuning' | 'merah_muda' | 'merah_tua'

export type ClauseSafetyScore = 1 | 2 | 3 | 4 | 5

export interface ClauseFinding {
  id: string
  clause_text: string
  is_flagged: boolean
  clause_safety_score: ClauseSafetyScore
  risk_level: RiskLevel
  category: string
  plain_language_summary: string
  mcp_query_hint?: string
  legal_reference?: {
    law: string
    article: string
    source_url: string
    retrieved_at: string
  } | null
}

export interface ScoreBreakdownItem {
  category: string
  weight: number
  score_contribution: number
}

export interface DocumentResult {
  document_id: string
  status: string
  progress_hint?: string
  signed_pdf_url?: string
  signed_url_expires_at?: string
  summary?: string
  overall_risk_score?: number
  score_breakdown?: ScoreBreakdownItem[]
  clauses?: ClauseFinding[]
}

export interface User {
  id: string
  username: string
  email: string
  tier: 'b2c_esensial' | 'b2b_profesional'
}
