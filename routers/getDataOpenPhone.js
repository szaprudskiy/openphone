import express from 'express'

const getDataOpenPhoneRouter = express.Router()

import getDataOpenPhone from '../controllers/getDataOpenPhone.js'

getDataOpenPhoneRouter.post('/', getDataOpenPhone)

export default getDataOpenPhoneRouter
