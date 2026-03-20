import { STORAGE_VERSION } from './constants.ts'
import type {
  NeedCard,
  PlannerState,
  Row,
  Substitute,
  Teacher,
} from './types.ts'

function toRecord<T extends { id: string }>(items: readonly T[]) {
  return items.reduce<Record<string, T>>((accumulator, item) => {
    accumulator[item.id] = item
    return accumulator
  }, {})
}

export function createSeedPlannerState(): PlannerState {
  const teachers: Teacher[] = [
    {
      id: 'teacher-camilla',
      name: 'Camilla Solberg',
      avatarInitials: 'CS',
      accentColor: '#ffd8bc',
    },
    {
      id: 'teacher-jesper',
      name: 'Jesper Hauge',
      avatarInitials: 'JH',
      accentColor: '#ffe58f',
    },
    {
      id: 'teacher-nora',
      name: 'Nora Lunde',
      avatarInitials: 'NL',
      accentColor: '#cfe6ff',
    },
    {
      id: 'teacher-line',
      name: 'Line Viken',
      avatarInitials: 'LV',
      accentColor: '#d7f0c8',
    },
    {
      id: 'teacher-amalie',
      name: 'Amalie Bjerke',
      avatarInitials: 'AB',
      accentColor: '#f7d2e5',
    },
    {
      id: 'teacher-petter',
      name: 'Petter Nilsen',
      avatarInitials: 'PN',
      accentColor: '#dad8ff',
    },
  ]

  const substitutes: Substitute[] = [
    {
      id: 'sub-kasper',
      name: 'Kasper Dahl',
      avatarInitials: 'KD',
      accentColor: '#ffd38b',
    },
    {
      id: 'sub-ida',
      name: 'Ida Mohn',
      avatarInitials: 'IM',
      accentColor: '#bfe5ff',
    },
    {
      id: 'sub-sara',
      name: 'Sara Lie',
      avatarInitials: 'SL',
      accentColor: '#ffd0dd',
    },
    {
      id: 'sub-tarik',
      name: 'Tarik Ali',
      avatarInitials: 'TA',
      accentColor: '#cce7c1',
    },
    {
      id: 'sub-emma',
      name: 'Emma Foss',
      avatarInitials: 'EF',
      accentColor: '#d7d2ff',
    },
  ]

  const rows: Row[] = [
    { id: 'row-1', order: 0, rowResponsibleId: null },
    { id: 'row-2', order: 1, rowResponsibleId: 'sub-kasper' },
    { id: 'row-3', order: 2, rowResponsibleId: null },
    { id: 'row-4', order: 3, rowResponsibleId: 'sub-ida' },
    { id: 'row-5', order: 4, rowResponsibleId: null },
  ]

  const needCards: NeedCard[] = [
    {
      id: 'card-matte-6a',
      title: 'Matematikk 6A',
      subtitle: 'Rom 204',
      sourceTeacherId: 'teacher-camilla',
      placement: 'scheduled',
      rowId: 'row-1',
      timeBlockId: '08:30',
      explicitAssigneeId: null,
      accentColor: '#ffe6b3',
    },
    {
      id: 'card-norsk-6a',
      title: 'Norsk 6A',
      subtitle: 'Lesesal',
      sourceTeacherId: 'teacher-camilla',
      placement: 'scheduled',
      rowId: 'row-1',
      timeBlockId: '09:30',
      explicitAssigneeId: 'sub-emma',
      accentColor: '#ffd6df',
    },
    {
      id: 'card-engelsk-7b',
      title: 'Engelsk 7B',
      subtitle: 'Rom 105',
      sourceTeacherId: 'teacher-camilla',
      placement: 'scheduled',
      rowId: 'row-2',
      timeBlockId: '08:30',
      explicitAssigneeId: null,
      accentColor: '#d3ebff',
    },
    {
      id: 'card-naturfag-7b',
      title: 'Naturfag 7B',
      subtitle: 'Lab 2',
      sourceTeacherId: 'teacher-camilla',
      placement: 'scheduled',
      rowId: 'row-2',
      timeBlockId: '10:30',
      explicitAssigneeId: 'sub-sara',
      accentColor: '#d7f0c8',
    },
    {
      id: 'card-musikk-8c',
      title: 'Musikk 8C',
      subtitle: 'Musikkrom',
      sourceTeacherId: 'teacher-jesper',
      placement: 'scheduled',
      rowId: 'row-3',
      timeBlockId: '10:30',
      explicitAssigneeId: null,
      accentColor: '#f8dcff',
    },
    {
      id: 'card-samfunn-8c',
      title: 'Samfunnsfag 8C',
      subtitle: 'Rom 118',
      sourceTeacherId: 'teacher-jesper',
      placement: 'unscheduled',
      rowId: null,
      timeBlockId: null,
      explicitAssigneeId: null,
      accentColor: '#ffe6b3',
    },
    {
      id: 'card-kunst-5d',
      title: 'Kunst og håndverk 5D',
      subtitle: 'Verksted',
      sourceTeacherId: 'teacher-camilla',
      placement: 'scheduled',
      rowId: 'row-4',
      timeBlockId: '11:30',
      explicitAssigneeId: null,
      accentColor: '#ffd6df',
    },
    {
      id: 'card-matte-5d',
      title: 'Matematikk 5D',
      subtitle: 'Rom 109',
      sourceTeacherId: 'teacher-jesper',
      placement: 'scheduled',
      rowId: 'row-4',
      timeBlockId: '12:30',
      explicitAssigneeId: null,
      accentColor: '#d3ebff',
    },
    {
      id: 'card-krle-9a',
      title: 'KRLE 9A',
      subtitle: 'Rom 302',
      sourceTeacherId: 'teacher-nora',
      placement: 'scheduled',
      rowId: 'row-5',
      timeBlockId: '13:30',
      explicitAssigneeId: null,
      accentColor: '#d7f0c8',
    },
    {
      id: 'card-norsk-9a',
      title: 'Norsk 9A',
      subtitle: 'Biblioteket',
      sourceTeacherId: 'teacher-nora',
      placement: 'unscheduled',
      rowId: null,
      timeBlockId: null,
      explicitAssigneeId: 'sub-tarik',
      accentColor: '#f8dcff',
    },
    {
      id: 'card-kroppsoving-4b',
      title: 'Kroppsøving 4B',
      subtitle: 'Gymsal',
      sourceTeacherId: 'teacher-line',
      placement: 'unscheduled',
      rowId: null,
      timeBlockId: null,
      explicitAssigneeId: null,
      accentColor: '#ffd8bc',
    },
    {
      id: 'card-mat-og-helse-6c',
      title: 'Mat og helse 6C',
      subtitle: 'Kjøkken',
      sourceTeacherId: 'teacher-amalie',
      placement: 'unscheduled',
      rowId: null,
      timeBlockId: null,
      explicitAssigneeId: null,
      accentColor: '#fff1a8',
    },
  ]

  return {
    version: STORAGE_VERSION,
    teachers: toRecord(teachers),
    teacherOrder: teachers.map((teacher) => teacher.id),
    substitutes: toRecord(substitutes),
    substituteOrder: substitutes.map((substitute) => substitute.id),
    rows: toRecord(rows),
    rowOrder: rows.map((row) => row.id),
    needCards: toRecord(needCards),
    needCardOrder: needCards.map((card) => card.id),
  }
}
