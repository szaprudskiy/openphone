import axios from 'axios'
import getAccessToken from './getAccessToken.js'
import findContactInZohoCRM from './findContactInZohoCRM.js'

const createContactInZohoCRM = async (phone, recordingUrl, message, type) => {
  try {
    const accessToken = await getAccessToken()
    const existingContact = await findContactInZohoCRM(phone)

    if (existingContact) {
      const response = await axios.put(
        'https://www.zohoapis.com/crm/v2/Contacts',
        {
          data: [
            {
              id: existingContact.id,
              Phone: phone,
              Last_Name: existingContact.Last_Name,
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

      console.log('Contact updated in Zoho CRM:', response.data)

      if (response.data.data && response.data.data.length > 0) {
        return response.data.data[0]
      } else {
        return null
      }
    } else {
      console.log('phone', phone)
      console.log('recordingUrl', recordingUrl)
      console.log('message', message)
      console.log('type', type)

      let currentRecordings = recordingUrl ? `1. ${recordingUrl}` : ''

      let currentMessage

      if (type === 'message.received') {
        currentMessage = `Outgoing: ${message}`
      } else if (type === 'message.delivered') {
        currentMessage = `Incoming: ${message}`
      }

      const response = await axios.post(
        'https://www.zohoapis.com/crm/v2/Contacts',
        {
          data: [
            {
              Phone: phone,
              Last_Name: 'OpenPhone',
              Multi_Line_5: currentRecordings,
              Incoming_Messages: currentMessage,
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

      console.log('Contact created in Zoho CRM:', response.data.data[0])
      return response.data.data[0]
    }
  } catch (error) {
    console.error('Error creating/updating contact in Zoho CRM:', error)
    throw new Error('Error creating/updating contact in Zoho CRM')
  }
}

export default createContactInZohoCRM
