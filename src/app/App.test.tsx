import { act, cleanup, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it } from 'vitest'

import { createSeedPlannerState } from '../domain/schedule/seed.ts'
import { resetPlannerStore } from '../store/plannerStore.ts'
import App from './App.tsx'

function createMultiPageRailState() {
  const state = createSeedPlannerState()

  state.needCards['card-ekstra-10x'] = {
    id: 'card-ekstra-10x',
    title: 'Ekstrafag 10X',
    subtitle: 'Rom 410',
    sourceTeacherId: 'teacher-petter',
    placement: 'unscheduled',
    rowId: null,
    timeBlockId: null,
    explicitAssigneeId: null,
    accentColor: '#d9d6ff',
  }
  state.needCards['card-ekstra-11z'] = {
    id: 'card-ekstra-11z',
    title: 'Ekstrafag 11Z',
    subtitle: 'Rom 411',
    sourceTeacherId: 'teacher-line',
    placement: 'unscheduled',
    rowId: null,
    timeBlockId: null,
    explicitAssigneeId: null,
    accentColor: '#ffd9c2',
  }
  state.needCards['card-ekstra-12y'] = {
    id: 'card-ekstra-12y',
    title: 'Ekstrafag 12Y',
    subtitle: 'Rom 412',
    sourceTeacherId: 'teacher-camilla',
    placement: 'unscheduled',
    rowId: null,
    timeBlockId: null,
    explicitAssigneeId: null,
    accentColor: '#d7f0c8',
  }
  state.needCardOrder.push('card-ekstra-10x', 'card-ekstra-11z', 'card-ekstra-12y')

  state.substitutes['sub-aagot'] = {
    id: 'sub-aagot',
    name: 'Ågot Øie',
    avatarInitials: 'ÅØ',
    accentColor: '#f2d0c3',
  }
  state.substitutes['sub-orjan'] = {
    id: 'sub-orjan',
    name: 'Ørjan Vik',
    avatarInitials: 'ØV',
    accentColor: '#cfe6ff',
  }
  state.substituteOrder.push('sub-aagot', 'sub-orjan')

  return state
}

afterEach(() => {
  cleanup()
  window.localStorage.clear()
  resetPlannerStore()
})

describe('App', () => {
  it('renders a compact planner shell with controls and work regions', () => {
    render(<App />)

    const tasksPanel = screen.getByRole('region', { name: 'Uplanlagt' })
    const peoplePanel = screen.getByRole('region', { name: 'Vikarer' })

    expect(tasksPanel).toBeInTheDocument()
    expect(screen.getByRole('region', { name: 'Dagstavle' })).toBeInTheDocument()
    expect(peoplePanel).toBeInTheDocument()
    expect(screen.getByText('6 udekket')).toBeInTheDocument()
    expect(screen.getByText('50% dekning')).toBeInTheDocument()
    expect(screen.getByText('5 vikarer')).toBeInTheDocument()
    expect(screen.getByText('5 rader')).toBeInTheDocument()
    expect(screen.queryByText('Substituttavle')).not.toBeInTheDocument()
    expect(
      screen.queryByText('Planlegg dagens vikarer med tydelig dekning og raske overstyringer.'),
    ).not.toBeInTheDocument()
    expect(
      screen.queryByText(
        'Dra kort mellom rader og tidsslots, eller bruk detaljarket for tastaturvennlige endringer.',
      ),
    ).not.toBeInTheDocument()
    expect(screen.queryByText('Planoversikt')).not.toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Uplanlagt' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Dagstavle' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Vikarer' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /åpne detaljer for kaspers vikartimer/i })).toBeInTheDocument()
    expect(within(tasksPanel).getByText('1 / 1')).toBeInTheDocument()
    expect(within(peoplePanel).getByText('1 / 1')).toBeInTheDocument()

    const rowButton = screen.getByRole('button', { name: /åpne detaljer for kaspers vikartimer/i })
    const rowTitle = rowButton.querySelector('.row-header__title')

    expect(rowTitle).not.toBeNull()
    expect(rowTitle).not.toHaveClass('planner-heading')
  })

  it('pages both side rails in groups of five', async () => {
    const user = userEvent.setup()

    resetPlannerStore(createMultiPageRailState())
    render(<App />)

    const tasksPanel = screen.getByRole('region', { name: 'Uplanlagt' })
    const peoplePanel = screen.getByRole('region', { name: 'Vikarer' })

    expect(within(tasksPanel).getAllByLabelText(/^kort /i)).toHaveLength(5)
    expect(within(peoplePanel).getAllByLabelText(/^vikar /i)).toHaveLength(5)
    expect(within(tasksPanel).getByText('1 / 2')).toBeInTheDocument()
    expect(within(peoplePanel).getByText('1 / 2')).toBeInTheDocument()
    expect(within(tasksPanel).queryByLabelText(/kort ekstrafag 11z/i)).not.toBeInTheDocument()
    expect(within(peoplePanel).queryByLabelText(/vikar ågot øie/i)).not.toBeInTheDocument()

    await user.click(within(tasksPanel).getByRole('button', { name: /neste side i uplanlagt/i }))
    await user.click(within(peoplePanel).getByRole('button', { name: /neste side i vikarer/i }))

    expect(within(tasksPanel).getAllByLabelText(/^kort /i)).toHaveLength(2)
    expect(within(peoplePanel).getAllByLabelText(/^vikar /i)).toHaveLength(2)
    expect(within(tasksPanel).getByLabelText(/kort ekstrafag 11z/i)).toBeInTheDocument()
    expect(within(peoplePanel).getByLabelText(/vikar ågot øie/i)).toBeInTheDocument()
    expect(within(tasksPanel).getByText('2 / 2')).toBeInTheDocument()
    expect(within(peoplePanel).getByText('2 / 2')).toBeInTheDocument()
  })

  it('clamps the current page when a side rail shrinks back to one page', async () => {
    const user = userEvent.setup()

    resetPlannerStore(createMultiPageRailState())
    render(<App />)

    const tasksPanel = screen.getByRole('region', { name: 'Uplanlagt' })

    await user.click(within(tasksPanel).getByRole('button', { name: /neste side i uplanlagt/i }))
    expect(within(tasksPanel).getByText('2 / 2')).toBeInTheDocument()

    act(() => {
      resetPlannerStore(createSeedPlannerState())
    })

    expect(within(tasksPanel).getByText('1 / 1')).toBeInTheDocument()
    expect(within(tasksPanel).queryByLabelText(/kort ekstrafag 11z/i)).not.toBeInTheDocument()
  })

  it('opens need card details with source teacher and assignment explanation', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.click(screen.getByLabelText(/kort naturfag 7b/i))

    const dialog = screen.getByRole('dialog')
    expect(within(dialog).getByText('Naturfag 7B')).toBeInTheDocument()
    expect(within(dialog).getByText('7B')).toBeInTheDocument()
    expect(within(dialog).getByText('Naturfag')).toBeInTheDocument()
    expect(within(dialog).getByText('Camilla Solberg')).toBeInTheDocument()
    expect(within(dialog).getByText('Lab 2')).toBeInTheDocument()
    expect(within(dialog).getByText(/kortet bruker en direkte vikar/i)).toBeInTheDocument()
    expect(within(dialog).getByText('Sara Lie')).toBeInTheDocument()
  })

  it('opens row details with row assignee and cards in the row', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.click(screen.getByRole('button', { name: /åpne detaljer for idas vikartimer/i }))

    const dialog = screen.getByRole('dialog')
    expect(within(dialog).getByRole('heading', { name: 'Idas vikartimer' })).toBeInTheDocument()
    expect(within(dialog).getByText('Ida Mohn')).toBeInTheDocument()
    expect(within(dialog).getByText('Kunst og håndverk')).toBeInTheDocument()
    expect(within(dialog).getByText('Matematikk')).toBeInTheDocument()
  })

  it('clears a row assignee inline without opening the detail sheet', async () => {
    const user = userEvent.setup()
    render(<App />)

    const rowButton = screen.getByRole('button', { name: /åpne detaljer for kaspers vikartimer/i })
    const rowContainer = rowButton.closest('.row-header-dropzone')

    expect(rowContainer).not.toBeNull()

    const clearButton = within(rowContainer as HTMLElement).getByRole('button', {
      name: /fjern radansvarlig/i,
    })

    await user.click(clearButton)

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: /åpne detaljer for kaspers vikartimer/i }),
    ).not.toBeInTheDocument()
  })

  it('clears a direct card assignee inline and falls back to the row assignee', async () => {
    const user = userEvent.setup()
    render(<App />)

    const card = screen.getByLabelText(/kort naturfag 7b/i)
    const clearButton = within(card).getByRole('button', {
      name: /fjern direkte tildeling/i,
    })

    await user.click(clearButton)

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(within(card).queryByLabelText(/direkte: sara lie/i)).not.toBeInTheDocument()
    expect(within(card).getByLabelText(/via rad: kasper dahl/i)).toBeInTheDocument()
  })

  it('assigns row responsibility from the detail sheet and supports undo', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.click(screen.getByRole('button', { name: /åpne detaljer for camillas timer/i }))

    const dialog = screen.getByRole('dialog')
    await user.selectOptions(within(dialog).getByLabelText('Vikar'), 'sub-kasper')
    await user.click(within(dialog).getByRole('button', { name: /lagre radansvar/i }))
    await user.click(within(dialog).getByRole('button', { name: /lukk/i }))

    expect(
      screen.queryByRole('button', { name: /åpne detaljer for camillas timer/i }),
    ).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /^angre$/i }))

    expect(
      screen.getByRole('button', { name: /åpne detaljer for camillas timer/i }),
    ).toBeInTheDocument()
  })

  it('moves an unscheduled card through the detail sheet and returns it with undo', async () => {
    const user = userEvent.setup()
    render(<App />)

    const tasksPanel = screen.getByRole('region', { name: 'Uplanlagt' })

    await user.click(within(tasksPanel).getByLabelText(/kort samfunnsfag 8c/i))

    const dialog = screen.getByRole('dialog')
    await user.selectOptions(within(dialog).getByLabelText('Rad'), 'row-3')
    await user.selectOptions(within(dialog).getByLabelText('Tid'), '08:30')
    await user.click(within(dialog).getByRole('button', { name: /lagre plassering/i }))
    await user.click(within(dialog).getByRole('button', { name: /lukk/i }))

    expect(within(tasksPanel).queryByLabelText(/kort samfunnsfag 8c/i)).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /^angre$/i }))

    expect(within(tasksPanel).getByLabelText(/kort samfunnsfag 8c/i)).toBeInTheDocument()
  })
})
