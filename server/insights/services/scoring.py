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
        normalized_score = round((avg_score / 5.0) * 100.0, 1)
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

    weighted_sum = 0.0
    weight_sum = 0.0
    fatal_count = 0
    for clause in clauses:
        weight = CATEGORY_WEIGHTS.get(clause.category, CATEGORY_WEIGHTS["default"])
        weighted_sum += clause.clause_safety_score * weight
        weight_sum += weight
        if clause.clause_safety_score == 1:
            fatal_count += 1

    base_score = (weighted_sum / (5 * weight_sum)) * 100 if weight_sum else 0.0
    penalty = fatal_count * FATAL_CLAUSE_PENALTY_POINTS
    overall_score = max(0.0, base_score - penalty)

    breakdown = _build_category_breakdown(clauses)
    return round(overall_score, 1), breakdown, fatal_count
