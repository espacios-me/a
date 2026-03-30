const $ = (id) => document.getElementById(id)

const loginBtn = $('loginBtn')
const statusBtn = $('statusBtn')
const testKeyBtn = $('testKeyBtn')
const sendBtn = $('sendBtn')
const loginStatus = $('loginStatus')
const cfStatus = $('cfStatus')
const keyStatus = $('keyStatus')
const chatInput = $('chatInput')
const messages = $('messages')

function addMessage(role, text) {
  const wrapper = document.createElement('div')
  wrapper.className = `message ${role}`
  const bubble = document.createElement('div')
  bubble.className = 'bubble'
  bubble.textContent = text
  wrapper.appendChild(bubble)
  messages.appendChild(wrapper)
  messages.scrollTop = messages.scrollHeight
}

async function postJSON(url, body) {
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  const data = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(data.message || data.error || 'Request failed.')
  return data
}

loginBtn?.addEventListener('click', async () => {
  loginBtn.disabled = true
  loginStatus.textContent = 'Signing in…'
  try {
    const data = await postJSON('/a/api/auth/login', { provider: 'cloudflare' })
    loginStatus.textContent = `Signed in as ${data.user.name} (${data.user.email})`
  } catch (error) {
    loginStatus.textContent = error.message
  } finally {
    loginBtn.disabled = false
  }
})

statusBtn?.addEventListener('click', async () => {
  statusBtn.disabled = true
  cfStatus.textContent = 'Checking…'
  try {
    const response = await fetch('/a/api/integrations/cloudflare/status')
    const data = await response.json()
    cfStatus.textContent = JSON.stringify(data, null, 2)
  } catch (error) {
    cfStatus.textContent = error.message
  } finally {
    statusBtn.disabled = false
  }
})

testKeyBtn?.addEventListener('click', async () => {
  const apiKey = $('apiKeyInput').value.trim()
  keyStatus.textContent = 'Testing…'
  try {
    const data = await postJSON('/a/api/test-keys', { provider: 'gemini', apiKey })
    keyStatus.textContent = JSON.stringify(data, null, 2)
  } catch (error) {
    keyStatus.textContent = error.message
  }
})

async function sendChat() {
  const text = chatInput.value.trim()
  if (!text) return
  addMessage('user', text)
  chatInput.value = ''
  sendBtn.disabled = true

  try {
    const data = await postJSON('/a/api/chat', {
      connectedApps: ['cloudflare', 'github'],
      messages: [
        { role: 'assistant', text: 'Deployment shell ready.' },
        { role: 'user', text },
      ],
    })
    addMessage('assistant', data.reply || 'No reply.')
  } catch (error) {
    addMessage('assistant', error.message)
  } finally {
    sendBtn.disabled = false
  }
}

sendBtn?.addEventListener('click', sendChat)
chatInput?.addEventListener('keydown', (event) => {
  if (event.key === 'Enter') sendChat()
})
