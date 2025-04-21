import axios from 'axios';
import { marked } from 'marked';

// 使用相对路径，Vite 代理会自动处理
const API_BASE_URL = '/api';

// 配置 marked 选项
marked.setOptions({
  breaks: true, // 支持换行符
  gfm: true,    // 支持 GitHub Flavored Markdown
});

export interface WeatherResponse {
  city: string;
  temperature: number;
  description: string;
  humidity: number;
  windSpeed: number;
}

export const getWeather = async (city: string): Promise<WeatherResponse> => {
  try {
    const response = await axios.get(`${API_BASE_URL}/weather`, {
      params: { city }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching weather:', error);
    throw error;
  }
};

export const sendPrompt = async (
  message: string,
  mode: 'manus' | 'planningflow' | 'weather',
  onMessage: (text: string, type: 'user' | 'ai' | 'log' | 'result' | 'error') => void
) => {
  if (!message || message.trim() === '') {
    throw new Error('Prompt is required');
  }

  try {
    const response = await fetch(`${API_BASE_URL}/prompt`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
      body: JSON.stringify({ 
        prompt: message,
        mode: mode
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

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
            switch (parsed.type) {
              case 'log':
                if (parsed.data?.message) {
                  // 将日志消息转换为 markdown
                  const markdown = await marked(parsed.data.message);
                  onMessage(markdown, 'log');
                }
                break;
              case 'output':
                if (parsed.data?.message) {
                  // 将消息转换为 markdown
                  const markdown = await marked(parsed.data.message);
                  onMessage(markdown, 'ai');
                }
                break;
              case 'result':
                if (parsed.data) {
                  // 将结果转换为 markdown
                  const resultText = typeof parsed.data === 'string' 
                    ? parsed.data 
                    : JSON.stringify(parsed.data, null, 2);
                  const markdown = await marked(resultText);
                  onMessage(markdown, 'result');
                }
                break;
              case 'error':
                console.error('Server error:', parsed.data);
                const errorMessage = parsed.data?.message || 'Unknown error';
                const errorMarkdown = await marked(`**Error:** ${errorMessage}`);
                onMessage(errorMarkdown, 'error');
                throw new Error(errorMessage);
              case 'end':
                return;
            }
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