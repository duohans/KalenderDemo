import { cleanup, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it } from 'vitest'

import { resetPlannerStore } from '../store/plannerStore.ts'
import App from './App.tsx'

afterEach(() => {
  cleanup()
  window.localStorage.clear()
  resetPlannerStore()
})

describe('App', () => {
  it('renders a compact planner shell with controls and work regions', () => {
    render(<App />)

    expect(screen.getByRole('region', { name: 'Uplanlagt' })).toBeInTheDocument()
    expect(screen.getByRole('region', { name: 'Dagstavle' })).toBeInTheDocument()
    expect(screen.getByRole('region', { name: 'Vikarer' })).toBeInTheDocument()
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
    expect(screen.queryByRole('heading', { name: 'Uplanlagt' })).not.toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Vikarer' })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: /åpne detaljer for kaspers vikartimer/i })).toBeInTheDocument()
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
