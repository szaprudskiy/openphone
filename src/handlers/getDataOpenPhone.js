import formatPhoneNumber from '../utils/formatPhoneNumber.js'
import findContactInZohoCRM from '../services/findContactInZohoCRM.js'
import updateContactWithIncomingMessage from '../services/updateContactWithIncomingMessage.js'
import updateContactWithOutgoingMessage from '../services/updateContactWithOutgoingMessage.js'
import updateContactWithRecording from '../services/updateContactWithCallRecording.js'
import createContactInZohoCRM from '../services/createContactInZohoCRM.js'
import RequestQueue from 'node-request-queue'

const excludedNumbers = ['+1 (727) 966-2707', '+1 (737) 345-3339']
const queueMap = new Map()

const getDataOpenPhone = async (req, res) => {
  try {
    const {
      type,
      data: { object: eventData },
    } = req.body

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

    // Ensure each validNumber has its own queue
    if (!queueMap.has(validNumber)) {
      queueMap.set(validNumber, new RequestQueue({ concurrency: 1 }))
    }

    const queue = queueMap.get(validNumber)

    const contact = await queue.add(async () => {
      let existingContact = await findContactInZohoCRM(validNumber)

      if (!existingContact) {
        existingContact = await createContactInZohoCRM(
          validNumber,
          media ? media[0]?.url : null,
          body,
          type
        )
      }

      return existingContact
    })

    if (!contact) {
      return res.status(404).json({ message: 'Contact not found' })
    }

    let result = null

    if (type === 'call.recording.completed') {
      result = await updateContactWithRecording(contact.id, media[0].url)
      return res
        .status(200)
        .json({ message: 'Call recording added successfully', result })
    } else if (type === 'message.received') {
      result = await updateContactWithIncomingMessage(contact.id, body)
      return res
        .status(200)
        .json({ message: 'Incoming Message added successfully', result })
    } else if (type === 'message.delivered') {
      result = await updateContactWithOutgoingMessage(contact.id, body)
      return res
        .status(200)
        .json({ message: 'Outgoing Message added successfully', result })
    }

    return res.status(404).json({ message: 'Operation not supported' })
  } catch (error) {
    console.error('Error processing webhook:', error)
    return res.status(500).json({ error: 'Internal Server Error' })
  }
}

export default getDataOpenPhone
