import Queue from 'queue-promise'
import formatPhoneNumber from '../utils/formatPhoneNumber.js'
import findContactInZohoCRM from '../services/findContactInZohoCRM.js'
import updateContactWithIncomingMessage from '../services/updateContactWithIncomingMessage.js'
import updateContactWithOutgoingMessage from '../services/updateContactWithOutgoingMessage.js'
import updateContactWithRecording from '../services/updateContactWithCallRecording.js'
import createContactInZohoCRM from '../services/createContactInZohoCRM.js'

const excludedNumbers = ['+1 (727) 966-2707', '+1 (737) 345-3339']

const queue = new Queue({
  concurrent: 1,
  interval: 110000,
})

queue.on('resolve', (data) => {
  console.log('Task completed:', data)
})

queue.on('reject', (error) => {
  console.error('Task failed:', error)
})

const getDataOpenPhone = async (req, res) => {
  try {
    const {
      type,
      data: { object: eventData },
    } = req.body.object

    console.log('req.body', req.body)

    console.log('req.body.object', req.body.object)

    const { from, to, media, body } = eventData

    const formattedFrom = formatPhoneNumber(from)
    const formattedTo = formatPhoneNumber(to)

    if (!excludedNumbers.includes(formattedFrom)) {
      queue.enqueue(async () => {
        let validNumber = formattedFrom
        let contact = await findContactInZohoCRM(validNumber)
        if (!contact) {
          contact = await createContactInZohoCRM(
            validNumber,
            media && media.length > 0 ? media[0].url : null,
            body,
            type
          )
          if (!contact) {
            return res
              .status(500)
              .json({ error: 'Error creating/updating contact in Zoho CRM' })
          }

          return res
            .status(201)
            .json({ message: 'Creating/updating contact in Zoho CRM', contact })
        }

        // Continue processing based on the event type
        if (type === 'call.recording.completed') {
          const result = await updateContactWithRecording(
            contact.id,
            media[0].url
          )
          return res
            .status(200)
            .json({ message: 'Call recording added successfully', result })
        } else if (type === 'message.received') {
          const result = await updateContactWithIncomingMessage(
            contact.id,
            body
          )
          return res
            .status(200)
            .json({ message: 'Incoming Message added successfully', result })
        } else if (type === 'message.delivered') {
          const result = await updateContactWithOutgoingMessage(
            contact.id,
            body
          )
          return res
            .status(200)
            .json({ message: 'Outgoing Message added successfully', result })
        } else {
          return res.status(404).json({ message: 'Contact not found' })
        }
      })
    }
    if (!excludedNumbers.includes(formattedTo)) {
      queue.enqueue(async () => {
        let validNumber = formattedTo
        let contact = await findContactInZohoCRM(validNumber)
        if (!contact) {
          contact = await createContactInZohoCRM(
            validNumber,
            media ? media[0]?.url : null,
            body,
            type
          )
          if (!contact) {
            return res
              .status(500)
              .json({ error: 'Error creating/updating contact in Zoho CRM' })
          }

          return res
            .status(201)
            .json({ message: 'Creating/updating contact in Zoho CRM', contact })
        }

        // Continue processing based on the event type
        if (type === 'call.recording.completed') {
          const result = await updateContactWithRecording(
            contact.id,
            media[0].url
          )
          return res
            .status(200)
            .json({ message: 'Call recording added successfully', result })
        } else if (type === 'message.received') {
          const result = await updateContactWithIncomingMessage(
            contact.id,
            body
          )
          return res
            .status(200)
            .json({ message: 'Incoming Message added successfully', result })
        } else if (type === 'message.delivered') {
          const result = await updateContactWithOutgoingMessage(
            contact.id,
            body
          )
          return res
            .status(200)
            .json({ message: 'Outgoing Message added successfully', result })
        } else {
          return res.status(404).json({ message: 'Contact not found' })
        }
      })
    }
  } catch (error) {
    console.error('Error processing webhook:', error)
    res.status(500).json({ error: 'Internal Server Error' })
  }
}

export default getDataOpenPhone
