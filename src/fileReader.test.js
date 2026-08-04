import test from 'node:test'
import assert from 'node:assert/strict'
import { recognizeOcrPages } from './fileReader.js'

test('keeps OCR results when one scanned page fails', async () => {
  const text = await recognizeOcrPages(
    ['bad-page', 'good-page'],
    async (source) => {
      if (source === 'bad-page') throw new Error('OCR worker failed')
      return { data: { text: 'usable resume text' } }
    },
    undefined,
    20
  )

  assert.equal(text, 'usable resume text')
})
