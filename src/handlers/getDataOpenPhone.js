import AsyncLock from 'async-lock'
import formatPhoneNumber from '../utils/formatPhoneNumber.js'
import findContactInZohoCRM from '../services/findContactInZohoCRM.js'
import updateContactWithIncomingMessage from '../services/updateContactWithIncomingMessage.js'
import updateContactWithOutgoingMessage from '../services/updateContactWithOutgoingMessage.js'
import updateContactWithRecording from '../services/updateContactWithCallRecording.js'
import createContactInZohoCRM from '../services/createContactInZohoCRM.js'

const excludedNumbers = ['+1 (727) 966-2707', '+1 (737) 345-3339']
const lock = new AsyncLock()

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

const getDataOpenPhone = async (req, res) => {
  try {
    // Проверяем, что req.body и req.body.object существуют
    const { type, data } = req.body
    if (!data || !data.object) {
      return res.status(400).json({ error: 'Invalid request body format' })
    }

    const { object: eventData } = data
    const { from, to, media, body } = eventData

    const formattedFrom = formatPhoneNumber(from)
    const formattedTo = formatPhoneNumber(to)

    let contact = null
    let validNumber = null

    if (!excludedNumbers.includes(formattedFrom)) {
      validNumber = formattedFrom
    } else if (!excludedNumbers.includes(formattedTo)) {
      validNumber = formattedTo
    }

    if (validNumber) {
      await lock.acquire(validNumber, async (done) => {
        try {
          contact = await findContactInZohoCRM(validNumber)
          if (!contact) {
            await delay(80000)
            contact = await createContactInZohoCRM(
              validNumber,
              media ? media[0]?.url : null,
              body,
              type
            )
            if (contact) {
              res.status(200).json({
                message: 'Creating/updating contact in Zoho CRM',
                contact,
              })
            } else {
              res.status(500).json({
                error: 'Error creating/updating contact in Zoho CRM',
              })
            }
          }
        } catch (error) {
          console.error('Error within lock:', error)
          res.status(500).json({ error: 'Internal Server Error' })
        } finally {
          done() // Всегда освобождаем блокировку
        }
      })
    } else {
      res.status(404).json({ message: 'Valid number not found' })
    }

    if (contact) {
      if (type === 'call.recording.completed') {
        const result = await updateContactWithRecording(
          contact.id,
          media[0].url
        )
        res.status(200).json({
          message: 'Call recording added successfully',
          result,
        })
      } else if (type === 'message.received') {
        const result = await updateContactWithIncomingMessage(contact.id, body)
        res.status(200).json({
          message: 'Incoming Message added successfully',
          result,
        })
      } else if (type === 'message.delivered') {
        const result = await updateContactWithOutgoingMessage(contact.id, body)
        res.status(200).json({
          message: 'Outgoing Message added successfully',
          result,
        })
      }
    } else {
      res.status(404).json({ message: 'Contact not found' })
    }
  } catch (error) {
    console.error('Error processing webhook:', error)
    res.status(500).json({ error: 'Internal Server Error' })
  }
}

export default getDataOpenPhone
