import { createHashRouter } from 'react-router-dom'
import { Chooser } from '@/Chooser'
import { AppShell } from '@/components/AppShell'
import { RoundingBoard } from '@/views/RoundingBoard'
import { ResidentConference } from '@/views/ResidentConference'
import { ConferenceMode } from '@/views/ConferenceMode'
import { FamilyView } from '@/views/FamilyView'
import { FamilySummaryPage } from '@/views/FamilySummaryPage'
import { EmrDemo } from '@/emr/EmrDemo'
import { Console } from '@/emr/Console'

// HashRouter so deep links survive a refresh on GitHub Pages without any
// server-side SPA fallback.
export const router = createHashRouter([
  // Demo chooser — the site's front door.
  { path: '/', element: <Chooser /> },

  // ── Huddle Dashboard Demo (the InTandem care-conference app) ──
  {
    path: '/huddle',
    element: <AppShell />,
    children: [
      { index: true, element: <RoundingBoard /> },
      { path: 'resident/:id', element: <ResidentConference /> },
      { path: 'family/:id', element: <FamilyView /> },
    ],
  },
  // Full-screen Huddle routes (outside the shell).
  { path: '/huddle/resident/:id/conference', element: <ConferenceMode /> },
  { path: '/huddle/summary/:id', element: <FamilySummaryPage /> },

  // ── EMR Demo (AI family-notification, separate module) ──
  { path: '/emr', element: <EmrDemo /> },
  { path: '/console', element: <Console /> },
])
