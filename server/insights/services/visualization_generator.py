from collections import Counter
from insights.models import ContractVisualization


def generate_visualizations(document):
    ContractVisualization.objects.filter(document=document).delete()
    clauses = list(document.clauses.all())
    if not clauses:
        return []

    created = []
    category_counts = Counter(getattr(c, "category", "default") for c in clauses)
    flagged_count = sum(1 for c in clauses if c.clause_safety_score <= 3)

    impact_vis = ContractVisualization.objects.create(
        document=document,
        clause=None,
        scenario_type=ContractVisualization.ScenarioType.CLAUSE_IMPACT,
        data={
            "chart_type": "pie",
            "distribution": dict(category_counts),
            "total_flagged": flagged_count,
            "total_clauses": len(clauses),
            "summary": f"Distribusi dampak risiko dari {len(clauses)} klausul yang diperiksa.",
        },
    )
    created.append(impact_vis)

    financial_clauses = [
        c
        for c in clauses
        if c.category in ("upah_kompensasi", "non_kompete", "phk_sepihak")
        and c.clause_safety_score <= 3
    ]
    if financial_clauses:
        target_clause = financial_clauses[0]
        fin_vis = ContractVisualization.objects.create(
            document=document,
            clause=target_clause,
            scenario_type=ContractVisualization.ScenarioType.FINANCIAL_LOSS,
            data={
                "chart_type": "bar",
                "labels": ["Pendapatan Standar", "Potensi Kerugian/Penalti"],
                "values": [10000000, 3500000],
                "currency": "IDR",
                "summary": "Simulasi risiko finansial akibat pemotongan sepihak atau pembatasan kompetisi.",
                "clause_id": target_clause.id,
            },
        )
        created.append(fin_vis)

    flagged_clauses = [c for c in clauses if c.clause_safety_score <= 3]
    for c in flagged_clauses[:2]:
        ba_vis = ContractVisualization.objects.create(
            document=document,
            clause=c,
            scenario_type=ContractVisualization.ScenarioType.BEFORE_AFTER,
            data={
                "original_text": c.clause_text,
                "balanced_text": f"{c.plain_language_summary} (direkomendasikan dengan kesepakatan tertulis bersama dan batas waktu maksimal 6 bulan).",
                "risk_level_original": c.risk_level,
                "target_safety_score": 4,
            },
        )
        created.append(ba_vis)

    return created
