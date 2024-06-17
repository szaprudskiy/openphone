import axios from 'axios'
import getAccessToken from './getAccessToken.js'
import findContactInZohoCRM from './findContactInZohoCRM.js'

const createContactInZohoCRM = async (phone) => {
  try {
    const existingContact = await findContactInZohoCRM(phone)

    if (existingContact) {
      const accessToken = await getAccessToken()
      const response = await axios.put(
        `${process.env.ZOHO_CRM_API_BASE_URL}/Contacts`,
        {
          data: [
            {
              id: existingContact.id,
              Phone: phone,
              Last_Name: 'OpenPhone Updated', // Example: Update Last_Name if needed
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
      const accessToken = await getAccessToken()
      const response = await axios.post(
        `${process.env.ZOHO_CRM_API_BASE_URL}/Contacts`,
        {
          data: [
            {
              Phone: phone,
              Last_Name: 'OpenPhone',
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

      console.log('Contact created in Zoho CRM:', response.data)

      if (response.data.data && response.data.data.length > 0) {
        return response.data.data[0]
      } else {
        return null
      }
    }
  } catch (error) {
    console.error('Error creating/updating contact in Zoho CRM:', error)
    return null
  }
}

export default createContactInZohoCRM
