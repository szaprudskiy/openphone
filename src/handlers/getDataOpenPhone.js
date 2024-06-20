import formatPhoneNumber from '../utils/formatPhoneNumber.js'
import findContactInZohoCRM from '../services/findContactInZohoCRM.js'
import updateContactWithIncomingMessage from '../services/updateContactWithIncomingMessage.js'
import updateContactWithOutgoingMessage from '../services/updateContactWithOutgoingMessage.js'
import updateContactWithRecording from '../services/updateContactWithCallRecording.js'
import createContactInZohoCRM from '../services/createContactInZohoCRM.js'

const excludedNumbers = ['+1 (727) 966-2707', '+1 (737) 345-3339']

const getDataOpenPhone = async (req, res) => {
  try {
    const {
      type,
      data: { object: eventData },
    } = req.body

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
      contact = await findContactInZohoCRM(validNumber)
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
        } else {
          return res
            .status(200)
            .json({ message: 'Creating/updating contact in Zoho CRM', contact })
        }
      }
    }

    if (contact) {
      if (type === 'call.recording.completed') {
        const result = await updateContactWithRecording(
          contact.id,
          media[0].url
        )
        return res
          .status(200)
          .json({ message: 'Call recording added successfully', result })
      } else if (type === 'message.received') {
        const result = await updateContactWithIncomingMessage(contact.id, body)
        return res
          .status(200)
          .json({ message: 'Incoming Message added successfully', result })
      } else if (type === 'message.delivered') {
        const result = await updateContactWithOutgoingMessage(contact.id, body)
        return res
          .status(200)
          .json({ message: 'Outgoing Message added successfully', result })
      }
    } else {
      return res.status(404).json({ message: 'Contact not found' })
    }
  } catch (error) {
    console.error('Error processing webhook:', error)
    return res.status(500).json({ error: 'Internal Server Error' })
  }
}

export default getDataOpenPhone
