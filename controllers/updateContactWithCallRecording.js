import axios from 'axios'

const updateContactWithCallRecording = async (contactId, recordingUrl) => {
  try {
    const response = await axios.put(
      `${process.env.ZOHO_CRM_API_BASE_URL}/Contacts`,
      {
        data: [
          {
            id: contactId,
            Description: recordingUrl,
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

    return response.data
  } catch (error) {
    console.error('Error updating contact in Zoho CRM:', error)
    return null
  }
}
export default updateContactWithCallRecording
