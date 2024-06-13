import express from 'express'

const getDataOpenPhoneRouter = express.Router()

import getDataOpenPhone from '../handlers/getDataOpenPhone.js'

getDataOpenPhoneRouter.post('/', getDataOpenPhone)

export default getDataOpenPhoneRouter
