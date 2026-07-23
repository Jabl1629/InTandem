import { describe, expect, it } from 'vitest'
import { SEED } from '@/data/seed'
import { assessResident, type ResidentAssessment } from './assess'

function assess(id: string): ResidentAssessment {
  const resident = SEED.residents.find((r) => r.id === id)!
  return assessResident({
    resident,
    readings: SEED.readings,
    manualStates: SEED.manualStates,
    actionItems: SEED.actionItems,
    hydrationGoal: SEED.hydrationGoals[id] ?? 1500,
  })
}

describe('seed narratives produce the intended clinical picture', () => {
  it('Eleanor (decline) — gait + weight alert, significant-change fires', () => {
    const a = assess('eleanor')
    expect(a.sensor.mobility_gait?.status.status).toBe('alert')
    expect(a.sensor.weight?.status.status).toBe('alert')
    expect(a.alertCount).toBeGreaterThanOrEqual(2)
    expect(a.significant.triggered).toBe(true)
    expect(a.overdueCount).toBeGreaterThanOrEqual(1) // the overdue PT eval
  })

  it('Frank (rehab) — no alerts, no significant-change', () => {
    const a = assess('frank')
    expect(a.alertCount).toBe(0)
    expect(a.significant.triggered).toBe(false)
  })

  it('Marguerite (data-gap) — sensors stable, no alerts', () => {
    const a = assess('marguerite')
    expect(a.alertCount).toBe(0)
    expect(a.significant.triggered).toBe(false)
  })

  it('Eleanor has the highest Change Score of all residents', () => {
    const scores = SEED.residents.map((r) => ({ id: r.id, score: assess(r.id).changeScore.score }))
    scores.sort((x, y) => y.score - x.score)
    expect(scores[0].id).toBe('eleanor')
  })

  it('Change Score exposes its contributing factors (no black box)', () => {
    const a = assess('eleanor')
    expect(a.changeScore.factors.length).toBeGreaterThan(0)
    expect(a.changeScore.factors.every((f) => f.points > 0)).toBe(true)
  })

  it('background residents carry the authored watches', () => {
    expect(assess('ruth').sensor.hydration?.status.status).toBe('watch')
    expect(assess('walter').sensor.mobility_activity?.status.status).toBe('watch')
    expect(assess('mabel').sensor.weight?.status.status).toBe('watch')
  })
})

describe('deltas', () => {
  it('Eleanor shows an adverse (downward) weight delta since last conference', () => {
    const d = assess('eleanor').sensor.weight?.delta
    expect(d).not.toBeNull()
    expect(d!.direction).toBe('down')
    expect(d!.adverse).toBe(true)
  })

  it("Frank's activity delta since last conference is an improvement", () => {
    const d = assess('frank').sensor.mobility_activity?.delta
    expect(d!.direction).toBe('up')
    expect(d!.adverse).toBe(false)
  })
})
