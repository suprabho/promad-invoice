import express from 'express'
import cors from 'cors'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const app = express()
const PORT = 3001
const DATA_FILE = path.join(__dirname, 'data', 'invoices.json')

app.use(cors())
app.use(express.json())

// Ensure data directory exists
if (!fs.existsSync(path.join(__dirname, 'data'))) {
  fs.mkdirSync(path.join(__dirname, 'data'))
}

// Initialize empty store if file doesn't exist
if (!fs.existsSync(DATA_FILE)) {
  fs.writeFileSync(DATA_FILE, JSON.stringify({ invoices: [] }, null, 2))
}

const readData = () => JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'))
const writeData = (data) => fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2))

// GET all invoices (summary list)
app.get('/api/invoices', (req, res) => {
  const { invoices } = readData()
  const summary = invoices.map(({ id, date, type, client, total }) => ({
    id, date, type, clientName: client.name, total,
  }))
  res.json(summary)
})

// GET single invoice by id
app.get('/api/invoices/:id', (req, res) => {
  const { invoices } = readData()
  const invoice = invoices.find(inv => inv.id === req.params.id)
  if (!invoice) return res.status(404).json({ error: 'Invoice not found' })
  res.json(invoice)
})

// POST create new invoice
app.post('/api/invoices', (req, res) => {
  const data = readData()
  const invoice = req.body
  const existing = data.invoices.find(inv => inv.id === invoice.id)
  if (existing) return res.status(409).json({ error: 'Invoice ID already exists' })
  data.invoices.push(invoice)
  data.invoices.sort((a, b) => a.id.localeCompare(b.id))
  writeData(data)
  res.status(201).json(invoice)
})

// PUT update existing invoice
app.put('/api/invoices/:id', (req, res) => {
  const data = readData()
  const idx = data.invoices.findIndex(inv => inv.id === req.params.id)
  if (idx === -1) return res.status(404).json({ error: 'Invoice not found' })
  data.invoices[idx] = req.body
  writeData(data)
  res.json(req.body)
})

// DELETE invoice
app.delete('/api/invoices/:id', (req, res) => {
  const data = readData()
  data.invoices = data.invoices.filter(inv => inv.id !== req.params.id)
  writeData(data)
  res.json({ success: true })
})

app.listen(PORT, () => {
  console.log(`✅  PROMAD Invoice API running at http://localhost:${PORT}`)
})
