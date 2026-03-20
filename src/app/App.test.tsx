import { cleanup, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it } from 'vitest'

import App from './App.tsx'

afterEach(() => {
  cleanup()
  window.localStorage.clear()
})

describe('App', () => {
  it('renders the v2 planner shell with unscheduled needs, grid, and substitutes', () => {
    render(<App />)

    expect(screen.getByRole('heading', { name: 'Uplanlagt' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Vikarer' })).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Vikarplan for i dag' })).not.toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Dagsplan' })).toBeInTheDocument()
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
})
