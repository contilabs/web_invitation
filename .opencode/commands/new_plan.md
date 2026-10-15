---
description: Genera un nuevo plan para el spec activo
agent: build
---

Lee docs/constitution.md y specs/XYZ-spec-name/spec.md (XYZ numérico incremental) el spec activo. NO escribas
código. Genera specs/XYZ-spec-name/plan.md con: qué archivos se crean o
modifican y qué responsabilidad tiene cada uno, qué funciones puras de lógica
se necesitan, decisiones técnicas justificadas (y su
alternativa descartada) y estrategia de tests con node --test. Todo debe
respetar la constitución y cubrir todos los RF. Marca qué RF cubre cada parte.

Detalles: $ARGUMENTS