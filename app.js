import express from 'express'
import * as dotenv from 'dotenv'
dotenv.config()
const PORT = 4004
const app = express()

import router from './routers/index.js'

app.use(express.json())

app.use(router)

app.listen(PORT, () => {
  console.log(`The app listening on port ${PORT}`)
})
