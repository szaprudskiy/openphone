import axios from 'axios'
import getAccessToken from './getAccessToken.js'

const updateContactWithIncomingMessage = async (contactId, message) => {
  try {
    const accessToken = await getAccessToken()
    const response = await axios.get(
      `${process.env.ZOHO_CRM_API_BASE_URL}/Contacts/${contactId}`,
      {
        headers: {
          Authorization: `Zoho-oauthtoken ${accessToken}`,
        },
      }
    )

    let currentMessages = response.data.data[0].Incoming_Messages || ''

    // const messagesArray = currentMessages
    //   .split('\n')
    //   .filter((msg) => msg.trim() !== '')
    // const messageCount = messagesArray.length
    // const numberedMessage = `${messageCount + 1}. Incoming: ${message}`
    const numberedMessage = `Incoming: ${message}`

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
          Authorization: `Zoho-oauthtoken ${accessToken}`,
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
