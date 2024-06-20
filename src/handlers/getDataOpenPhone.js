import Queue from 'queue-promise'
import formatPhoneNumber from '../utils/formatPhoneNumber.js'
import findContactInZohoCRM from '../services/findContactInZohoCRM.js'
import updateContactWithIncomingMessage from '../services/updateContactWithIncomingMessage.js'
import updateContactWithOutgoingMessage from '../services/updateContactWithOutgoingMessage.js'
import updateContactWithRecording from '../services/updateContactWithCallRecording.js'
import createContactInZohoCRM from '../services/createContactInZohoCRM.js'

const excludedNumbers = ['+1 (727) 966-2707', '+1 (737) 345-3339']

// Create a queue
const queue = new Queue({
  concurrent: 1,
  interval: 80000, // Задержка в 80000 миллисекунд (80 секунд) между задачами
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
    } = req.body
    const { from, to, media, body } = eventData

    const formattedFrom = formatPhoneNumber(from)
    const formattedTo = formatPhoneNumber(to)

    let validNumber = null

    // Определение правильного номера
    if (!excludedNumbers.includes(formattedFrom)) {
      validNumber = formattedFrom
    } else if (!excludedNumbers.includes(formattedTo)) {
      validNumber = formattedTo
    }

    if (validNumber) {
      queue
        .enqueue(
          () =>
            new Promise(async (resolve, reject) => {
              try {
                let contact = await findContactInZohoCRM(validNumber)
                if (!contact) {
                  contact = await createContactInZohoCRM(
                    validNumber,
                    media ? media[0]?.url : null,
                    body,
                    type
                  )
                  if (!contact) {
                    return reject({
                      status: 500,
                      message: 'Error creating/updating contact in Zoho CRM',
                    })
                  }
                  return resolve({
                    status: 200,
                    message: 'Creating/updating contact in Zoho CRM',
                    contact,
                  })
                }
                return resolve({ contact })
              } catch (error) {
                return reject(error)
              }
            })
        )
        .then((result) => {
          const { contact, status, message } = result
          if (status && message) {
            return res.status(status).json({ message, contact })
          }
          if (contact) {
            if (type === 'call.recording.completed') {
              updateContactWithRecording(contact.id, media[0].url)
                .then((result) => {
                  return res
                    .status(200)
                    .json({
                      message: 'Call recording added successfully',
                      result,
                    })
                })
                .catch((error) => {
                  console.error('Error updating contact with recording:', error)
                  return res
                    .status(500)
                    .json({ error: 'Internal Server Error' })
                })
            } else if (type === 'message.received') {
              updateContactWithIncomingMessage(contact.id, body)
                .then((result) => {
                  return res
                    .status(200)
                    .json({
                      message: 'Incoming Message added successfully',
                      result,
                    })
                })
                .catch((error) => {
                  console.error(
                    'Error updating contact with incoming message:',
                    error
                  )
                  return res
                    .status(500)
                    .json({ error: 'Internal Server Error' })
                })
            } else if (type === 'message.delivered') {
              updateContactWithOutgoingMessage(contact.id, body)
                .then((result) => {
                  return res
                    .status(200)
                    .json({
                      message: 'Outgoing Message added successfully',
                      result,
                    })
                })
                .catch((error) => {
                  console.error(
                    'Error updating contact with outgoing message:',
                    error
                  )
                  return res
                    .status(500)
                    .json({ error: 'Internal Server Error' })
                })
            }
          } else {
            return res.status(404).json({ message: 'Contact not found' })
          }
        })
        .catch((error) => {
          console.error('Error processing task:', error)
          return res.status(500).json({ error: 'Internal Server Error' })
        })
    } else {
      return res.status(404).json({ message: 'Valid number not found' })
    }
  } catch (error) {
    console.error('Error processing webhook:', error)
    return res.status(500).json({ error: 'Internal Server Error' })
  }
}

export default getDataOpenPhone
