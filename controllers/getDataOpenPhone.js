import findContactInZohoCRM from './findContactInZohoCRM.js'
import updateContactWithCallRecording from './updateContactWithCallRecording.js'

const getDataOpenPhone = async (req, res) => {
  try {
    const callData = req.body.data.object
    const { from, to, media } = callData

    console.log('Received webhook data:', callData)

    const formattedFrom = `+1 ${from}`
    const formattedTo = `+1 ${to}`

    let contact = await findContactInZohoCRM(formattedFrom)

    if (!contact) {
      contact = await findContactInZohoCRM(formattedTo)
    }

    if (contact) {
      const result = await updateContactWithCallRecording(
        contact.id,
        media[0].url
      )
      res
        .status(200)
        .json({ message: 'Call recording added successfully', result })
    } else {
      res.status(404).json({ message: 'Contact not found' })
    }
  } catch (error) {
    console.error('Error processing webhook:', error)
    res.status(500).json({ error: 'Internal Server Error' })
  }
}
export default getDataOpenPhone
