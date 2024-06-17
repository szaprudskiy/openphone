import formatPhoneNumber from '../utils/formatPhoneNumber.js'
import findContactInZohoCRM from '../services/findContactInZohoCRM.js'
import updateContactWithIncomingMessage from '../services/updateContactWithIncomingMessage.js'
import updateContactWithOutgoingMessage from '../services/updateContactWithOutgoingMessage.js'
import updateContactWithRecording from '../services/updateContactWithCallRecording.js'

const getDataOpenPhone = async (req, res) => {
  try {
    const {
      type,
      data: { object: eventData },
    } = req.body

    // console.log('Received webhook event:', type, eventData)

    const { from, to, media, body } = eventData

    const formattedFrom = formatPhoneNumber(from)
    const formattedTo = formatPhoneNumber(to)

    console.log('formattedFrom', formattedFrom)

    let contact = await findContactInZohoCRM(formattedFrom)

    if (!contact) {
      contact = await findContactInZohoCRM(formattedTo)
    }

    if (!contact) {
      contact = await createContactInZohoCRM(formattedFrom || formattedTo)
    }

    if (contact) {
      if (type === 'call.recording.completed') {
        const result = await updateContactWithRecording(
          contact.id,
          media[0].url
        )
        res
          .status(200)
          .json({ message: 'Call recording added successfully', result })
      } else if (type === 'message.received') {
        const result = await updateContactWithIncomingMessage(contact.id, body)
        res
          .status(200)
          .json({ message: 'Outgoing Message added successfully', result })
      } else if (type === 'message.delivered') {
        const result = await updateContactWithOutgoingMessage(contact.id, body)
        res
          .status(200)
          .json({ message: 'Incoming Message added successfully', result })
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
