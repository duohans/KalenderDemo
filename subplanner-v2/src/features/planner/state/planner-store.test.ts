import { createPlannerStore } from '@/features/planner/state/planner-store'

describe('planner store persistence', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('restores persisted planner state from local storage', async () => {
    const firstStore = createPlannerStore()

    firstStore.getState().setRowResponsible('row-1', 'sub-emil')
    firstStore.getState().setCardExplicitAssignee('need-1', 'sub-lina')

    const restoredStore = createPlannerStore()
    await restoredStore.persist.rehydrate()

    const restoredState = restoredStore.getState()
    const restoredRow = restoredState.planner.rows.find((row) => row.id === 'row-1')
    const restoredCard = restoredState.planner.needCards.find((card) => card.id === 'need-1')

    expect(restoredRow?.rowResponsibleId).toBe('sub-emil')
    expect(restoredCard?.explicitAssigneeId).toBe('sub-lina')
  })
})
