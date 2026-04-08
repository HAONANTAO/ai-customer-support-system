const express = require('express')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const { createUser, getUserByEmail } = require('../database')

const router = express.Router()

// POST /api/auth/register
router.post('/register', async (req, res) => {
  const { email, password } = req.body
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' })
  }
  if (password.length < 8) {
    return res.status(400).json({ error: 'Password must be at least 8 characters' })
  }

  const existing = getUserByEmail(email.toLowerCase().trim())
  if (existing) {
    return res.status(409).json({ error: 'An account with this email already exists' })
  }

  const passwordHash = await bcrypt.hash(password, 12)
  const result = createUser(email.toLowerCase().trim(), passwordHash)

  const token = jwt.sign(
    { id: result.lastInsertRowid, email: email.toLowerCase().trim(), plan: 'free' },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  )

  res.status(201).json({ token, plan: 'free' })
})

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { email, password } = req.body
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' })
  }

  const user = getUserByEmail(email.toLowerCase().trim())
  if (!user) {
    return res.status(401).json({ error: 'Invalid email or password' })
  }

  const valid = await bcrypt.compare(password, user.password_hash)
  if (!valid) {
    return res.status(401).json({ error: 'Invalid email or password' })
  }

  const token = jwt.sign(
    { id: user.id, email: user.email, plan: user.plan },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  )

  res.json({ token, plan: user.plan })
})

// POST /api/auth/logout  (JWT is stateless — client clears the token)
router.post('/logout', (_req, res) => {
  res.json({ success: true })
})

module.exports = router
