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
  interval: 60000,
})

queue.on('resolve', (data) => {
  const { res, result } = data
  res.status(result.status).json(result.data)
  console.log('Task completed:', result)
})

queue.on('reject', (error) => {
  const { res, err } = error
  res.status(500).json({ error: 'Internal Server Error' })
  console.error('Task failed:', err)
})

const processContact = async (validNumber, type, media, body) => {
  let contact = await findContactInZohoCRM(validNumber)
  if (!contact) {
    contact = await createContactInZohoCRM(
      validNumber,
      media && media.length > 0 ? media[0].url : null,
      body,
      type
    )
    if (!contact) {
      return {
        status: 500,
        data: { error: 'Error creating/updating contact in Zoho CRM' },
      }
    }
    return {
      status: 201,
      data: { message: 'Creating/updating contact in Zoho CRM', contact },
    }
  }

  // Continue processing based on the event type
  if (type === 'call.recording.completed') {
    const result = await updateContactWithRecording(contact.id, media[0].url)
    return {
      status: 200,
      data: { message: 'Call recording added successfully', result },
    }
  } else if (type === 'message.received') {
    const result = await updateContactWithIncomingMessage(contact.id, body)
    return {
      status: 200,
      data: { message: 'Incoming Message added successfully', result },
    }
  } else if (type === 'message.delivered') {
    const result = await updateContactWithOutgoingMessage(contact.id, body)
    return {
      status: 200,
      data: { message: 'Outgoing Message added successfully', result },
    }
  } else {
    return { status: 404, data: { message: 'Contact not found' } }
  }
}

const getDataOpenPhone = async (req, res) => {
  try {
    const {
      type,
      data: { object: eventData },
    } = req.body.object

    const { from, to, media, body } = eventData

    const formattedFrom = formatPhoneNumber(from)
    const formattedTo = formatPhoneNumber(to)

    if (!excludedNumbers.includes(formattedFrom)) {
      queue.enqueue(async () => {
        const result = await processContact(formattedFrom, type, media, body)
        return { res, result }
      })
    } else if (!excludedNumbers.includes(formattedTo)) {
      queue.enqueue(async () => {
        const result = await processContact(formattedTo, type, media, body)
        return { res, result }
      })
    } else {
      res.status(404).json({ message: 'Valid number not found' })
    }
  } catch (error) {
    console.error('Error processing webhook:', error)
    res.status(500).json({ error: 'Internal Server Error' })
  }
}

export default getDataOpenPhone
