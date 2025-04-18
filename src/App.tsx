import { useState } from 'react'
import { Layout, Input, Button, Card, message } from 'antd'
import { SendOutlined } from '@ant-design/icons'
import { sendPrompt } from './services/api'
import styles from './App.module.less'

const { Header, Content } = Layout
const { TextArea } = Input

interface Message {
  type: 'user' | 'ai'
  content: string
  timestamp: number
}

function App() {
  const [text, setText] = useState('')
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(false)

  const handleSend = async () => {
    if (!text.trim()) {
      message.warning('Please enter a message')
      return
    }

    // Add user message to history
    const userMessage: Message = {
      type: 'user',
      content: text,
      timestamp: Date.now()
    }
    setMessages(prev => [...prev, userMessage])
    
    setLoading(true)
    setText('')

    try {
      let aiResponse = ''
      await sendPrompt(text, (text) => {
        aiResponse += text
      })
      
      // Add AI response to history
      const aiMessage: Message = {
        type: 'ai',
        content: aiResponse,
        timestamp: Date.now()
      }
      setMessages(prev => [...prev, aiMessage])
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
            {messages.map((message, index) => (
              <div 
                key={index} 
                className={`${styles.message} ${message.type === 'user' ? styles.userMessage : styles.aiMessage}`}
              >
                <div className={styles.messageContent}>
                  {message.content}
                </div>
                <div className={styles.messageTime}>
                  {new Date(message.timestamp).toLocaleTimeString()}
                </div>
              </div>
            ))}
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
            />
          </div>
        </Card>
      </Content>
    </Layout>
  )
}

export default App