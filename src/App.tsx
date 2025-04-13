import { useState } from 'react'
import { Layout, Input, Button, Card, message } from 'antd'
import { SendOutlined } from '@ant-design/icons'
import { sendPrompt } from './services/api'
import styles from './App.module.less'

const { Header, Content } = Layout
const { TextArea } = Input

function App() {
  const [text, setText] = useState('')
  const [response, setResponse] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSend = async () => {
    if (!text.trim()) {
      message.warning('Please enter a message')
      return
    }

    setLoading(true)
    setResponse('')

    try {
      await sendPrompt(text, (text) => {
        setResponse((prev) => prev + text)
      })
    } catch (error) {
      message.error('Failed to send message')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Layout className={styles.layout}>
      <Header className={styles.header}>
        <h1>OpenManus Web</h1>
      </Header>
      <Content className={styles.content}>
        <Card className={styles.chatCard}>
          <div className={styles.responseArea}>
            {response && (
              <div className={styles.responseText}>
                {response}
              </div>
            )}
          </div>
          <div className={styles.inputArea}>
            <TextArea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Type your message here..."
              autoSize={{ minRows: 2, maxRows: 6 }}
              onPressEnter={(e) => {
                if (!e.shiftKey) {
                  e.preventDefault()
                  handleSend()
                }
              }}
            />
            <Button
              type="primary"
              icon={<SendOutlined />}
              onClick={handleSend}
              loading={loading}
              className={styles.sendButton}
            >
              Send
            </Button>
          </div>
        </Card>
      </Content>
    </Layout>
  )
}

export default App
