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
  interval: 80000, // 1 second interval between tasks
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

    if (!excludedNumbers.includes(formattedFrom)) {
      validNumber = formattedFrom
    } else if (!excludedNumbers.includes(formattedTo)) {
      validNumber = formattedTo
    }

    if (validNumber) {
      queue
        .enqueue(async () => {
          let contact = await findContactInZohoCRM(validNumber)
          if (!contact) {
            contact = await createContactInZohoCRM(
              validNumber,
              media ? media[0]?.url : null,
              body,
              type
            )
            if (!contact) {
              throw new Error('Error creating/updating contact in Zoho CRM')
            }
            // Return the created contact for response
            return {
              status: 200,
              data: {
                message: 'Creating/updating contact in Zoho CRM',
                contact,
              },
            }
          }

          // Continue processing based on the event type
          if (type === 'call.recording.completed') {
            const result = await updateContactWithRecording(
              contact.id,
              media[0].url
            )
            return {
              status: 200,
              data: { message: 'Call recording added successfully', result },
            }
          } else if (type === 'message.received') {
            const result = await updateContactWithIncomingMessage(
              contact.id,
              body
            )
            return {
              status: 200,
              data: { message: 'Incoming Message added successfully', result },
            }
          } else if (type === 'message.delivered') {
            const result = await updateContactWithOutgoingMessage(
              contact.id,
              body
            )
            return {
              status: 200,
              data: { message: 'Outgoing Message added successfully', result },
            }
          } else {
            return {
              status: 200,
              data: {
                message: 'Contact found or created successfully',
                contact,
              },
            }
          }
        })
        .then((result) => {
          // Send the response only once here after processing the task
          res.status(result.status).json(result.data)
        })
        .catch((error) => {
          console.error('Error processing task:', error)
          res.status(500).json({ error: 'Internal Server Error' })
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
