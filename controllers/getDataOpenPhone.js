import findContactInZohoCRM from './findContactInZohoCRM.js'

const getDataOpenPhone = async (req, res) => {
  try {
    const callData = req.body.data.object
    const { from, to } = callData

    console.log('Received webhook data:', from)

    const formattedFrom = `+1 ${from}`
    console.log('formattedFrom', formattedFrom)
    const formattedTo = `+1 ${to}`

    let contact = await findContactInZohoCRM(formattedFrom)

    if (!contact) {
      contact = await findContactInZohoCRM(formattedTo)
    }

    if (formattedFrom === contact) {
      console.log('true')
    } else {
      console.log('false')
    }

    res.status(200).json({ message: 'Call record added successfully', result })
  } catch (error) {
    console.error('Error processing webhook:', error)
    res.status(500).json({ error: 'Internal Server Error' })
  }
}
export default getDataOpenPhone
