import { stripRtf } from './parser.js'

const textExtensions = new Set(['txt', 'md', 'csv', 'json'])

export function selectPortraitCandidate(candidates) {
  return candidates
    .filter(({ width, height, fullPage }) => !fullPage && width >= 80 && height >= 80 && width / height >= 0.58 && width / height <= 1.15)
    .sort((a, b) => (b.width * b.height * (1 - Math.abs(b.width / b.height - 0.78))) - (a.width * a.height * (1 - Math.abs(a.width / a.height - 0.78))))[0]?.dataUrl || ''
}

async function dataUrlCandidate(dataUrl) {
  return new Promise((resolve) => {
    const image = new Image()
    image.onload = () => resolve({ dataUrl, width: image.naturalWidth, height: image.naturalHeight, fullPage: false })
    image.onerror = () => resolve(null)
    image.src = dataUrl
  })
}

function canvasFromPixels(image) {
  if (!image?.width || !image?.height) return null
  const canvas = document.createElement('canvas')
  canvas.width = image.width
  canvas.height = image.height
  const context = canvas.getContext('2d')
  if (!image.data) {
    try { context.drawImage(image.bitmap || image, 0, 0); return canvas } catch { return null }
  }
  const source = image.data
  const pixels = context.createImageData(image.width, image.height)
  if (source.length === image.width * image.height * 4) pixels.data.set(source)
  else if (source.length === image.width * image.height * 3) {
    for (let sourceIndex = 0, targetIndex = 0; sourceIndex < source.length; sourceIndex += 3, targetIndex += 4) {
      pixels.data[targetIndex] = source[sourceIndex]
      pixels.data[targetIndex + 1] = source[sourceIndex + 1]
      pixels.data[targetIndex + 2] = source[sourceIndex + 2]
      pixels.data[targetIndex + 3] = 255
    }
  } else return null
  context.putImageData(pixels, 0, 0)
  return canvas
}

async function pdfPortraitCandidates(pdf, pdfjs) {
  const candidates = []
  for (let pageNumber = 1; pageNumber <= Math.min(pdf.numPages, 3); pageNumber += 1) {
    const page = await pdf.getPage(pageNumber)
    const operations = await page.getOperatorList()
    const names = new Set()
    const images = []
    operations.fnArray.forEach((operation, index) => {
      if (operation === pdfjs.OPS.paintInlineImageXObject) images.push(operations.argsArray[index]?.[0])
      if (operation === pdfjs.OPS.paintImageXObject || operation === pdfjs.OPS.paintJpegXObject) names.add(operations.argsArray[index]?.[0])
    })
    for (const name of names) {
      if (!name) continue
      const image = await new Promise((resolve) => {
        try {
          const ready = page.objs.get(name, resolve)
          if (ready) resolve(ready)
        } catch { resolve(null) }
      })
      if (image) images.push(image)
    }
    for (const image of images) {
      const canvas = canvasFromPixels(image)
      if (!canvas) continue
      candidates.push({
        dataUrl: canvas.toDataURL('image/jpeg', 0.9),
        width: canvas.width,
        height: canvas.height,
        fullPage: canvas.width >= 1000 && canvas.height >= 1400
      })
    }
  }
  return candidates
}

async function renderPdfPage(page) {
  const baseViewport = page.getViewport({ scale: 1 })
  const viewport = page.getViewport({ scale: Math.min(1.75, 1200 / baseViewport.width) })
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(viewport.width)
  canvas.height = Math.round(viewport.height)
  await page.render({ canvasContext: canvas.getContext('2d', { alpha: false }), viewport }).promise
  return canvas
}

async function detectFacePortrait(source) {
  if (globalThis.FaceDetector) try {
    const bitmap = source instanceof Blob ? await createImageBitmap(source) : source
    const faces = await new FaceDetector({ fastMode: true, maxDetectedFaces: 5 }).detect(bitmap)
    const face = faces
      .filter(({ boundingBox }) => boundingBox.y < bitmap.height * 0.65)
      .sort((a, b) => b.boundingBox.width * b.boundingBox.height - a.boundingBox.width * a.boundingBox.height)[0]
    if (!face) return ''
    const box = face.boundingBox
    const cropHeight = Math.min(bitmap.height, box.height * 4.4)
    const cropWidth = Math.min(bitmap.width, cropHeight * 0.86)
    const x = Math.max(0, Math.min(bitmap.width - cropWidth, box.x + box.width / 2 - cropWidth / 2))
    const y = Math.max(0, Math.min(bitmap.height - cropHeight, box.y - box.height * 1.15))
    const canvas = document.createElement('canvas')
    canvas.width = 430
    canvas.height = 500
    canvas.getContext('2d').drawImage(bitmap, x, y, cropWidth, cropHeight, 0, 0, canvas.width, canvas.height)
    return canvas.toDataURL('image/jpeg', 0.9)
  } catch {
    // Fall through to conservative scanned-page region detection.
  }

  let raster = source
  if (source instanceof Blob) try {
    const bitmap = await createImageBitmap(source)
    raster = document.createElement('canvas')
    raster.width = bitmap.width
    raster.height = bitmap.height
    raster.getContext('2d').drawImage(bitmap, 0, 0)
  } catch {
    return ''
  }
  if (!(raster instanceof HTMLCanvasElement)) return ''
  const scale = Math.min(1, 360 / raster.width)
  const width = Math.round(raster.width * scale)
  const height = Math.round(raster.height * scale)
  const reduced = document.createElement('canvas')
  reduced.width = width
  reduced.height = height
  const context = reduced.getContext('2d')
  context.drawImage(raster, 0, 0, width, height)
  const pixels = context.getImageData(0, 0, width, height).data
  const dark = new Uint8Array(width * height)
  for (let index = 0; index < dark.length; index += 1) {
    const pixel = index * 4
    dark[index] = (pixels[pixel] + pixels[pixel + 1] + pixels[pixel + 2]) / 3 < 220 ? 1 : 0
  }

  const seen = new Uint8Array(dark.length)
  const candidates = []
  for (let start = 0; start < dark.length; start += 1) {
    if (!dark[start] || seen[start]) continue
    const stack = [start]
    seen[start] = 1
    let minX = width; let maxX = 0; let minY = height; let maxY = 0; let count = 0
    while (stack.length) {
      const index = stack.pop()
      const x = index % width
      const y = Math.floor(index / width)
      minX = Math.min(minX, x); maxX = Math.max(maxX, x); minY = Math.min(minY, y); maxY = Math.max(maxY, y); count += 1
      for (const neighbor of [index - 1, index + 1, index - width, index + width]) {
        if (neighbor < 0 || neighbor >= dark.length || seen[neighbor] || !dark[neighbor]) continue
        const neighborX = neighbor % width
        if (Math.abs(neighborX - x) > 1) continue
        seen[neighbor] = 1
        stack.push(neighbor)
      }
    }
    const boxWidth = maxX - minX + 1
    const boxHeight = maxY - minY + 1
    const ratio = boxWidth / boxHeight
    const density = count / (boxWidth * boxHeight)
    const touchesEdge = minX < 3 || minY < 3 || maxX > width - 4 || maxY > height - 4
    if (!touchesEdge && minY < height * 0.55 && boxWidth > width * 0.08 && boxWidth < width * 0.4 && boxHeight > height * 0.07 && boxHeight < height * 0.38 && ratio >= 0.5 && ratio <= 1.2 && density > 0.32) {
      candidates.push({ minX, minY, boxWidth, boxHeight, score: boxWidth * boxHeight * density })
    }
  }
  let region = candidates.sort((a, b) => b.score - a.score)[0]
  if (!region) {
    const integral = new Uint32Array((width + 1) * (height + 1))
    for (let y = 1; y <= height; y += 1) {
      let row = 0
      for (let x = 1; x <= width; x += 1) {
        row += dark[(y - 1) * width + x - 1]
        integral[y * (width + 1) + x] = integral[(y - 1) * (width + 1) + x] + row
      }
    }
    const darkness = (x, y, boxWidth, boxHeight) => {
      const stride = width + 1
      const right = x + boxWidth
      const bottom = y + boxHeight
      return integral[bottom * stride + right] - integral[y * stride + right] - integral[bottom * stride + x] + integral[y * stride + x]
    }
    const windows = []
    for (let boxWidth = Math.round(width * 0.1); boxWidth <= width * 0.28; boxWidth += Math.max(6, Math.round(width * 0.025))) {
      for (const ratio of [0.6, 0.7, 0.8, 0.9, 1]) {
        const boxHeight = Math.round(boxWidth / ratio)
        for (let y = Math.round(height * 0.02); y + boxHeight < height * 0.55; y += 5) {
          for (let x = Math.round(width * 0.18); x + boxWidth < width * 0.82; x += 5) {
            const density = darkness(x, y, boxWidth, boxHeight) / (boxWidth * boxHeight)
            if (density > 0.2) windows.push({ minX: x, minY: y, boxWidth, boxHeight, score: boxWidth * boxHeight * density * density })
          }
        }
      }
    }
    region = windows.sort((a, b) => b.score - a.score)[0]
  }
  if (!region) return ''
  const padding = Math.round(Math.max(region.boxWidth, region.boxHeight) * 0.04)
  const sourceX = Math.max(0, (region.minX - padding) / scale)
  const sourceY = Math.max(0, (region.minY - padding) / scale)
  const sourceWidth = Math.min(raster.width - sourceX, (region.boxWidth + padding * 2) / scale)
  const sourceHeight = Math.min(raster.height - sourceY, (region.boxHeight + padding * 2) / scale)
  const portrait = document.createElement('canvas')
  portrait.width = 430
  portrait.height = 500
  portrait.getContext('2d').drawImage(raster, sourceX, sourceY, sourceWidth, sourceHeight, 0, 0, portrait.width, portrait.height)
  return portrait.toDataURL('image/jpeg', 0.9)
}

export async function recognizeOcrPages(sources, recognize, onProgress, timeoutMs = 60000) {
  const pages = []
  for (let index = 0; index < sources.length; index += 1) {
    const pageNumber = index + 1
    onProgress?.(`Scanning page ${pageNumber} of ${sources.length}…`)
    let timeout
    try {
      const result = await Promise.race([
        recognize(sources[index], index),
        new Promise((resolve) => { timeout = setTimeout(() => resolve(null), timeoutMs) })
      ])
      if (!result) {
        onProgress?.(`Page ${pageNumber} took too long; continuing with extracted pages…`)
        break
      }
      pages.push(result.data.text)
    } catch {
      onProgress?.(`Page ${pageNumber} could not be read; continuing…`)
    } finally {
      clearTimeout(timeout)
    }
  }
  return pages.join('\n')
}

async function ocrSources(sources, onProgress) {
  const { default: Tesseract } = await import('tesseract.js')
  let pageNumber = 1
  const worker = await Tesseract.createWorker('eng', 1, {
    workerPath: `${import.meta.env.BASE_URL}ocr/worker.min.js`,
    corePath: `${import.meta.env.BASE_URL}ocr/tesseract-core-lstm.wasm.js`,
    langPath: `${import.meta.env.BASE_URL}ocr`,
    logger: ({ status, progress }) => onProgress?.(`${status} · page ${pageNumber}/${sources.length} · ${Math.round((progress || 0) * 100)}%`)
  })
  try {
    await worker.setParameters({ tessedit_pageseg_mode: '3', preserve_interword_spaces: '1' })
    return await recognizeOcrPages(sources, (source, index) => {
      pageNumber = index + 1
      return worker.recognize(source)
    }, onProgress)
  } finally {
    void worker.terminate()
  }
}

async function readPdf(file, onProgress) {
  const [pdfjs, { default: pdfWorker }] = await Promise.all([
    import('pdfjs-dist'),
    import('pdfjs-dist/build/pdf.worker.min.mjs?url')
  ])
  pdfjs.GlobalWorkerOptions.workerSrc = pdfWorker
  const pdf = await pdfjs.getDocument({ data: await file.arrayBuffer() }).promise
  const pages = []
  for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
    const page = await pdf.getPage(pageNumber)
    const content = await page.getTextContent()
    const lines = []
    for (const item of content.items) {
      const y = Math.round(item.transform?.[5] || 0)
      const line = lines.find((candidate) => Math.abs(candidate.y - y) <= 2)
      if (line) line.items.push({ x: item.transform?.[4] || 0, text: item.str })
      else lines.push({ y, items: [{ x: item.transform?.[4] || 0, text: item.str }] })
    }
    pages.push(lines.sort((a, b) => b.y - a.y).map((line) => line.items.sort((a, b) => a.x - b.x).map((item) => item.text).join(' ').trim()).filter(Boolean).join('\n'))
  }

  const embeddedText = pages.join('\n')
  const scanned = embeddedText.replace(/\s/g, '').length < 40
  const renderedPages = []
  if (scanned) {
    for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) renderedPages.push(await renderPdfPage(await pdf.getPage(pageNumber)))
  }
  const text = scanned ? await ocrSources(renderedPages, onProgress) : embeddedText
  const embeddedPhoto = scanned ? '' : selectPortraitCandidate(await pdfPortraitCandidates(pdf, pdfjs))
  let photo = embeddedPhoto
  if (!photo) try {
    photo = await detectFacePortrait(renderedPages[0] || await renderPdfPage(await pdf.getPage(1)))
  } catch {
    onProgress?.('Text extracted; portrait could not be read.')
  }
  return { text, photo }
}

async function readDocx(file) {
  const mammoth = await import('mammoth/mammoth.browser')
  const arrayBuffer = await file.arrayBuffer()
  const images = []
  await mammoth.convertToHtml({ arrayBuffer }, {
    convertImage: mammoth.images.imgElement(async (image) => {
      const dataUrl = `data:${image.contentType};base64,${await image.read('base64')}`
      images.push(dataUrl)
      return { src: dataUrl }
    })
  })
  const candidates = (await Promise.all(images.map(dataUrlCandidate))).filter(Boolean)
  return { text: (await mammoth.extractRawText({ arrayBuffer })).value, photo: selectPortraitCandidate(candidates) }
}

async function readImage(file, onProgress) {
  const [text, photo] = await Promise.all([ocrSources([file], onProgress), detectFacePortrait(file)])
  return { text, photo }
}

export async function extractResume(file, onProgress) {
  const extension = file.name.split('.').pop()?.toLowerCase() || ''
  const type = file.type.toLowerCase()
  if (type === 'application/pdf' || extension === 'pdf') return readPdf(file, onProgress)
  if (extension === 'docx' || type.includes('wordprocessingml')) return readDocx(file)
  if (type.startsWith('image/') || ['png', 'jpg', 'jpeg', 'webp', 'bmp', 'tif', 'tiff'].includes(extension)) return readImage(file, onProgress)
  if (extension === 'rtf' || type === 'application/rtf') return { text: stripRtf(await file.text()), photo: '' }
  if (extension === 'html' || extension === 'htm' || type === 'text/html') {
    const document = new DOMParser().parseFromString(await file.text(), 'text/html')
    const candidates = (await Promise.all(Array.from(document.images).filter((image) => image.src.startsWith('data:image/')).map((image) => dataUrlCandidate(image.src)))).filter(Boolean)
    return { text: document.body.textContent || '', photo: selectPortraitCandidate(candidates) }
  }
  if (textExtensions.has(extension) || type.startsWith('text/')) return { text: await file.text(), photo: '' }
  return { text: '', photo: '' }
}
