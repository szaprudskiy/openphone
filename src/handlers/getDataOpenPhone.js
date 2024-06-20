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
  interval: 0, // Задержка в 80000 миллисекунд (80 секунд) между задачами
})

queue.on('resolve', (data) => {
  console.log('Task completed:', data)
})

queue.on('reject', (error) => {
  console.error('Task failed:', error)
})

const getDataOpenPhone = async (req, res) => {
  try {
    // Проверка на существование req.body и req.body.object
    if (
      !req.body ||
      !req.body.object ||
      !req.body.object.data ||
      !req.body.object.data.object
    ) {
      console.error('Invalid request body:', req.body)
      return res.status(400).json({ error: 'Invalid request body' })
    }

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

                  if (contact) {
                    return resolve({
                      status: 200,
                      message: 'Creating/updating contact in Zoho CRM',
                      contact,
                    })
                  } else {
                    return reject(
                      new Error('Error creating/updating contact in Zoho CRM')
                    )
                  }
                }

                if (type === 'call.recording.completed') {
                  const result = await updateContactWithRecording(
                    contact.id,
                    media[0].url
                  )
                  return resolve({
                    status: 200,
                    message: 'Call recording added successfully',
                    result,
                  })
                } else if (type === 'message.received') {
                  const result = await updateContactWithIncomingMessage(
                    contact.id,
                    body
                  )
                  return resolve({
                    status: 200,
                    message: 'Incoming Message added successfully',
                    result,
                  })
                } else if (type === 'message.delivered') {
                  const result = await updateContactWithOutgoingMessage(
                    contact.id,
                    body
                  )
                  return resolve({
                    status: 200,
                    message: 'Outgoing Message added successfully',
                    result,
                  })
                }

                return resolve({
                  status: 200,
                  message: 'Contact found and no updates needed',
                  contact,
                })
              } catch (error) {
                console.error('Error processing task:', error)
                return reject(error)
              }
            })
        )
        .then((result) => {
          res.status(result.status).json({
            message: result.message,
            contact: result.contact,
            result: result.result,
          })
        })
        .catch((error) => {
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
