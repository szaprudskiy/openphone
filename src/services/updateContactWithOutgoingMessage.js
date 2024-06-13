const updateContactWithOutgoingMessage = async (contactId, message) => {
  try {
    const response = await axios.get(
      `${process.env.ZOHO_CRM_API_BASE_URL}/Contacts/${contactId}`,
      {
        headers: {
          Authorization: `Zoho-oauthtoken ${process.env.TOKEN}`,
        },
      }
    )

    let currentMessages = response.data.data[0].Outgoing_Messages || ''
    currentMessages += `\n${message}`

    await axios.put(
      `${process.env.ZOHO_CRM_API_BASE_URL}/Contacts`,
      {
        data: [
          {
            id: contactId,
            Outgoing_Messages: currentMessages,
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

    console.log('Outgoing Message added successfully.')
  } catch (error) {
    console.error('Error adding Outgoing Message to contact:', error)
  }
}

export default updateContactWithOutgoingMessage
