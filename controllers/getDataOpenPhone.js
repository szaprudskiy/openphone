const getDataOpenPhone = (req, res) => {
  try {
    const body = req.body
    console.log('body', body)
    res.status(200).json(body)
  } catch (error) {
    console.error('Error processing webhook:', error)
    res.status(500).json({ error: 'Internal Server Error' })
  }
}

export default getDataOpenPhone
