import axios from 'axios'

const updateContactWithIncomingMessage = async (contactId, message) => {
  try {
    const response = await axios.get(
      `${process.env.ZOHO_CRM_API_BASE_URL}/Contacts/${contactId}`,
      {
        headers: {
          Authorization: `Zoho-oauthtoken ${process.env.TOKEN}`,
        },
      }
    )

    let currentMessages = response.data.data[0].Incoming_Messages || ''

    const messagesArray = currentMessages
      .split('\n')
      .filter((msg) => msg.trim() !== '')
    const messageCount = messagesArray.length

    const numberedMessage = `${messageCount + 1}. ${message}`

    currentMessages += `\n${numberedMessage}`
    await axios.put(
      `${process.env.ZOHO_CRM_API_BASE_URL}/Contacts`,
      {
        data: [
          {
            id: contactId,
            Incoming_Messages: currentMessages,
          },
        ],
      },
      {
        headers: {
          Authorization: `Zoho-oauthtoken ${process.env.TOKEN}`,
          'Content-Type': 'application/json',
        },
      }
    )

    console.log('Incoming Message added successfully.')
  } catch (error) {
    console.error('Error adding Incoming Message to contact:', error)
  }
}

export default updateContactWithIncomingMessage
