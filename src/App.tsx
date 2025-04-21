import { useState } from 'react'
import { Layout, Input, Button, Card, message, Radio, Select } from 'antd'
import { SendOutlined } from '@ant-design/icons'
import { sendPrompt } from './services/api'
import styles from './App.module.less'

const { Header, Content } = Layout
const { TextArea } = Input
const { Option } = Select

// 中国省会城市列表
const CHINESE_CAPITALS = [
  '北京', '上海', '天津', '重庆', '哈尔滨', '长春', '沈阳', '呼和浩特', 
  '石家庄', '太原', '西安', '济南', '郑州', '南京', '合肥', '杭州', 
  '福州', '南昌', '长沙', '武汉', '广州', '南宁', '海口', '成都', 
  '贵阳', '昆明', '拉萨', '兰州', '西宁', '银川', '乌鲁木齐'
]

interface Message {
  type: 'user' | 'ai' | 'log' | 'result' | 'error'
  content: string
  timestamp: number
}

type Mode = 'manus' | 'planningflow' | 'weather'

function App() {
  const [text, setText] = useState('')
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(false)
  const [mode, setMode] = useState<Mode>('manus')

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
      let logContent = ''
      let resultContent = ''
      
      await sendPrompt(text, mode, (text, type) => {
        if (type === 'ai') {
          aiResponse += text
        } else if (type === 'log') {
          logContent += text + '\n'
        } else if (type === 'result') {
          resultContent += text + '\n'
        }
        
        // Update the last message with all content
        setMessages(prev => {
          const newMessages = [...prev]
          const lastMessage = newMessages[newMessages.length - 1]
          
          let combinedContent = ''
          if (logContent) {
            combinedContent += `<div class="${styles.logMessage}">${logContent}</div>`
          }
          if (aiResponse) {
            combinedContent += aiResponse
          }
          if (resultContent) {
            combinedContent += `<div class="${styles.resultMessage}">${resultContent}</div>`
          }
          
          if (lastMessage && lastMessage.type === 'ai') {
            lastMessage.content = combinedContent
          } else {
            newMessages.push({
              type: 'ai',
              content: combinedContent,
              timestamp: Date.now()
            })
          }
          return newMessages
        })
      })
    } catch (error) {
      message.error('Failed to send message')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const getMessageClassName = (message: Message) => {
    switch (message.type) {
      case 'user':
        return styles.userMessage
      case 'ai':
        return styles.aiMessage
      default:
        return ''
    }
  }

  return (
    <Layout className={styles.layout}>
      <Header className={styles.header}>
        <h1>OpenManus Web</h1>
      </Header>
      <Content className={styles.content}>
        <div className={styles.modeSelector}>
          <Radio.Group 
            value={mode} 
            onChange={(e) => setMode(e.target.value)}
            optionType="button"
            buttonStyle="solid"
          >
            <Radio.Button value="manus">Manus</Radio.Button>
            <Radio.Button value="planningflow">Planning Flow</Radio.Button>
            <Radio.Button value="weather">Weather</Radio.Button>
          </Radio.Group>
        </div>
        <Card className={styles.chatCard}>
          <div className={styles.responseArea}>
            {messages.map((message, index) => (
              <div 
                key={index} 
                className={`${styles.message} ${getMessageClassName(message)}`}
              >
                <div 
                  className={styles.messageContent}
                  dangerouslySetInnerHTML={{ __html: message.content }}
                />
                <div className={styles.messageTime}>
                  {new Date(message.timestamp).toLocaleTimeString()}
                </div>
              </div>
            ))}
          </div>
          <div className={styles.inputArea}>
            {mode === 'weather' ? (
              <Select
                showSearch
                style={{ width: '100%' }}
                placeholder="选择城市"
                optionFilterProp="children"
                onChange={(value: string) => setText(value)}
                onSearch={(value: string) => setText(value)}
                filterOption={(input, option) =>
                  (option?.children as string).toLowerCase().indexOf(input.toLowerCase()) >= 0
                }
              >
                {CHINESE_CAPITALS.map(city => (
                  <Option key={city} value={city}>{city}</Option>
                ))}
              </Select>
            ) : (
              <TextArea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Type your message here..."
                autoSize={{ minRows: 3, maxRows: 6 }}
                onPressEnter={(e) => {
                  if (!e.shiftKey) {
                    e.preventDefault()
                    handleSend()
                  }
                }}
              />
            )}
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