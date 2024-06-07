import express from 'express'
const router = express.Router()

import getDataOpenPhone from './getDataOpenPhone.js'

router.use('/getdataopenphone', getDataOpenPhone)

export default router
