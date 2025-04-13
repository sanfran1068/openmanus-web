import axios from 'axios';

// 使用相对路径，Vite 代理会自动处理
const API_BASE_URL = '/api';

export const sendPrompt = async (message: string, onMessage: (text: string) => void) => {
  try {
    const response = await fetch(`${API_BASE_URL}/prompt`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ message }),
    });

    const reader = response.body?.getReader();
    const decoder = new TextDecoder();

    if (!reader) {
      throw new Error('Failed to get response reader');
    }

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value);
      const lines = chunk.split('\n');

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6);
          if (data === '[DONE]') {
            break;
          }
          try {
            const parsed = JSON.parse(data);
            onMessage(parsed.text);
          } catch (e) {
            console.error('Error parsing data:', e);
          }
        }
      }
    }
  } catch (error) {
    console.error('Error sending prompt:', error);
    throw error;
  }
}; 