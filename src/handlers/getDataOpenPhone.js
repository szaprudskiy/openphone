import Queue from 'queue-promise'
import formatPhoneNumber from '../utils/formatPhoneNumber.js'
import findContactInZohoCRM from '../services/findContactInZohoCRM.js'
import createContactInZohoCRM from '../services/createContactInZohoCRM.js'
import updateContactWithIncomingMessage from '../services/updateContactWithIncomingMessage.js'
import updateContactWithOutgoingMessage from '../services/updateContactWithOutgoingMessage.js'
import updateContactWithRecording from '../services/updateContactWithCallRecording.js'

const excludedNumbers = ['+1 (727) 966-2707', '+1 (737) 345-3339']
const queue = new Queue({ concurrent: 1 }) // Очередь с одновременным выполнением одной задачи

const getDataOpenPhone = async (req, res) => {
  try {
    const {
      type,
      data: { object: eventData },
    } = req.body.object

    const { from, to, media, body } = eventData

    const formattedFrom = formatPhoneNumber(from)
    const formattedTo = formatPhoneNumber(to)

    let validNumber = null
    if (!excludedNumbers.includes(formattedFrom)) {
      validNumber = formattedFrom
    } else if (!excludedNumbers.includes(formattedTo)) {
      validNumber = formattedTo
    }

    if (!validNumber) {
      return res.status(404).json({ message: 'Valid number not found' })
    }

    // Функция для создания контакта в Zoho CRM
    const createContactTask = async () => {
      try {
        const contact = await createContactInZohoCRM(
          validNumber,
          media ? media[0]?.url : null,
          body,
          type
        )
        if (contact) {
          return { success: true, contact }
        } else {
          return { success: false }
        }
      } catch (error) {
        console.error('Error creating contact:', error)
        return { success: false, error }
      }
    }

    // Добавляем задачу в очередь на создание контакта
    const { success, contact, error } = await queue.add(createContactTask)

    if (success) {
      if (contact) {
        res.status(201).json({
          message: 'Contact created successfully in Zoho CRM',
          contact,
        })
      } else {
        res.status(500).json({
          error: 'Error creating contact in Zoho CRM',
        })
      }
    } else {
      res.status(500).json({
        error: 'Error processing create contact task',
        details: error ? error.message : 'Unknown error',
      })
    }

    // Обработка других типов событий
    if (success && contact) {
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
    }
  } catch (error) {
    console.error('Error processing webhook:', error)
    res.status(500).json({ error: 'Internal Server Error' })
  }
}

export default getDataOpenPhone
