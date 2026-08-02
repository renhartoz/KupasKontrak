from collections import defaultdict

CATEGORY_WEIGHTS = {
    "upah_kompensasi": 3.0,
    "phk_sepihak": 3.0,
    "pembatasan_hak_cipta": 2.5,
    "non_kompete": 2.0,
    "kerahasiaan": 1.5,
    "domisili_hukum": 1.0,
    "default": 1.0,
}

FATAL_CLAUSE_PENALTY_POINTS = 25


def _build_category_breakdown(clauses) -> list[dict]:
    groups = defaultdict(list)
    for clause in clauses:
        cat = getattr(clause, "category", "default") or "default"
        groups[cat].append(clause.clause_safety_score)

    breakdown = []
    for cat, scores in groups.items():
        avg_score = sum(scores) / len(scores)
        normalized_score = round(avg_score, 1)
        breakdown.append(
            {
                "category": cat,
                "score": normalized_score,
                "clause_count": len(scores),
            }
        )
    return breakdown


def compute_document_score(document) -> tuple[float, list[dict], int]:
    clauses = list(document.clauses.all())
    if not clauses:
        return 0.0, [], 0

    max_score = 0.0
    fatal_count = 0
    
    for clause in clauses:
        if clause.clause_safety_score > max_score:
            max_score = clause.clause_safety_score
            
        if getattr(clause, "is_fatal", False) or clause.clause_safety_score >= 80.0:
            fatal_count += 1

    base_score = max_score
    penalty = fatal_count * FATAL_CLAUSE_PENALTY_POINTS
    overall_score = min(100.0, base_score + penalty)

    breakdown = _build_category_breakdown(clauses)
    return round(overall_score, 1), breakdown, fatal_count
