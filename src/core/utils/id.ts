import { nanoid } from 'nanoid'

export function convId(): string {
  return `conv_${nanoid(12)}`
}

export function jobId(): string {
  return `job_${nanoid(12)}`
}

export function noteId(): string {
  return `note_${nanoid(12)}`
}
