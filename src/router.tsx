import { createBrowserRouter } from 'react-router-dom'
import { AppShell } from '@/components/AppShell'
import { RoundingBoard } from '@/views/RoundingBoard'
import { ResidentConference } from '@/views/ResidentConference'
import { ConferenceMode } from '@/views/ConferenceMode'
import { FamilyView } from '@/views/FamilyView'
import { FamilySummaryPage } from '@/views/FamilySummaryPage'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <AppShell />,
    children: [
      { index: true, element: <RoundingBoard /> },
      { path: 'resident/:id', element: <ResidentConference /> },
      { path: 'family/:id', element: <FamilyView /> },
    ],
  },
  // Conference Mode is full-screen (projector/tablet), outside the shell.
  { path: '/resident/:id/conference', element: <ConferenceMode /> },
  // The Family Summary one-pager (print target), also full-screen.
  { path: '/summary/:id', element: <FamilySummaryPage /> },
])
